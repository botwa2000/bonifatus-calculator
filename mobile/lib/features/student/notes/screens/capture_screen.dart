import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../models/calculator_config.dart';
import '../../providers/quick_grades_provider.dart';
import '../../providers/calculator_config_provider.dart';

enum _CaptureState { viewfinder, processing, confirming }

// ── Data models ──────────────────────────────────────────────────

class _ScanResult {
  final String? grade;          // validated against system.gradeValues
  final String? rawGrade;       // raw OCR text (shown as hint when grade==null)
  final SubjectItem? subject;   // matched from configured subjects
  final String? rawSubjectName; // raw subject text from OCR

  const _ScanResult({this.grade, this.rawGrade, this.subject, this.rawSubjectName});

  String displaySubject() => subject?.name ?? rawSubjectName ?? '';
  String displayGrade()   => grade ?? rawGrade ?? '';
}

class _EditableEntry {
  SubjectItem? subject;
  String? rawSubjectName;
  String gradeText;
  String? rawGrade;

  _EditableEntry({this.subject, this.rawSubjectName, required this.gradeText, this.rawGrade});

  String displaySubject() => subject?.name ?? rawSubjectName ?? '';
}

// ── Extraction engine ────────────────────────────────────────────

class _GradeExtractor {
  /// Returns all detected subject-grade pairs from a scanned document.
  static List<_ScanResult> extractAll(
      String text, GradingSystem system, List<SubjectItem> subjects) {
    if (_isGermanZeugnis(text)) return _extractGermanZeugnis(text, system, subjects);
    if (_isIcseFormat(text))    return _extractIcse(text, system, subjects);
    // Generic single-result (individual test paper)
    final grade   = _extractGrade(text, system);
    final subject = _matchSubject(text, subjects);
    final raw     = _firstNumericToken(text);
    if (grade != null || subject != null) {
      return [_ScanResult(grade: grade, rawGrade: raw, subject: subject)];
    }
    return [];
  }

  // ── Format detectors ─────────────────────────────────────────

  static bool _isGermanZeugnis(String text) {
    final u = text.toUpperCase();
    return u.contains('ZEUGNIS') ||
        u.contains('PFLICHTUNTERRICHT') ||
        (u.contains('HALBJAHR') && u.contains('SCHULJAHR'));
  }

  static bool _isIcseFormat(String text) {
    final u = text.toUpperCase();
    return u.contains('MARKS OUT OF') ||
        (u.contains('1ST TERM') && u.contains('2ND TERM')) ||
        u.contains('FINAL REPORT FOR THE YEAR') ||
        u.contains('ICSE') ||
        u.contains('CBSE');
  }

  // ── German Zeugnis (1-6 grades, two-column layout) ───────────

  static List<_ScanResult> _extractGermanZeugnis(
      String text, GradingSystem system, List<SubjectItem> subjects) {
    final results = <_ScanResult>[];
    final seen    = <String>{};

    // Grade: standalone digit 1-6, not adjacent to another digit or dot/slash
    final gradeRx = RegExp(r'(?<![.\d/])([1-6])(?![.\d])');

    // Try to extract class level from document header (used externally)
    for (final rawLine in text.split('\n')) {
      final line = rawLine.trim();
      if (line.isEmpty || _isZeugnisSkipLine(line)) { continue; }

      final matches = gradeRx.allMatches(line).toList();
      if (matches.isEmpty) continue;

      int cursor = 0;
      for (final m in matches) {
        final grade = m.group(1)!;
        if (!system.gradeValues.contains(grade)) {
          cursor = m.end;
          continue;
        }

        // Subject name = text from cursor to match start
        final raw = line.substring(cursor, m.start).trim();
        cursor = m.end;

        final cleaned = raw
            .replaceAll(RegExp(r'[-–\s]+$'), '')
            .replaceAll(RegExp(r'^[-–\s]+'), '')
            .trim();
        if (cleaned.length < 3) continue;

        const gradeWords = {
          'sehr gut', 'gut', 'befriedigend', 'ausreichend', 'mangelhaft', 'ungenügend',
        };
        final key = cleaned.toLowerCase();
        if (seen.contains(key)) continue;
        if (gradeWords.contains(key)) continue;
        seen.add(key);

        final subject = _matchSubjectByName(cleaned, subjects);
        results.add(_ScanResult(
          grade: grade,
          rawGrade: grade,
          subject: subject,
          rawSubjectName: cleaned,
        ));
      }
    }
    return results;
  }

  static bool _isZeugnisSkipLine(String line) {
    if (line.length < 3) return true;
    // Lines starting with year digits
    if (RegExp(r'^\d{4}').hasMatch(line)) return true;
    final lower = line.toLowerCase();
    const skip = [
      'schuljahr', 'halbjahr', 'klasse', 'geboren', 'unterrichtstage',
      'unentschuldigt', 'klassenleitung', 'schulleiter', 'unterschrift',
      'notenstufen', 'bewertungsstufen', 'grundlegende', 'fachleistungs',
      'berufs', 'ausbildungs', 'arbeitsverhalten', 'sozialverhalten',
      'bemerkungen', 'teilnahme', 'arbeitsgemeinschaft', 'erwartungen',
      'verleihung', 'qualifikation',
    ];
    for (final k in skip) {
      if (lower.contains(k)) return true;
    }
    // All-caps headings (ZEUGNIS, PFLICHTUNTERRICHT)
    final stripped = line.replaceAll(RegExp(r'[\s\-–]'), '');
    if (stripped.length > 6 && stripped == stripped.toUpperCase()) return true;
    return false;
  }

  // ── ICSE / percentage table format ───────────────────────────

  static List<_ScanResult> _extractIcse(
      String text, GradingSystem system, List<SubjectItem> subjects) {
    final results  = <_ScanResult>[];
    final lines    = text.split('\n');
    bool inTable   = false;

    for (final rawLine in lines) {
      final line = rawLine.trim();
      if (line.isEmpty) continue;

      // Detect table header
      if (!inTable) {
        final u = line.toUpperCase();
        if (u.contains('SUBJECT') && (u.contains('MARKS') || u.contains('TERM'))) {
          inTable = true;
        }
        continue;
      }

      final lower = line.toLowerCase();
      // Stop conditions
      if (lower.contains('attendance') || lower.contains('conduct') ||
          lower.contains('teacher')    || lower.contains('principal') ||
          lower.contains('remarks')    || lower.contains('date :')) { break; }
      // Skip totals rows (start with large digit sequence)
      if (RegExp(r'^\d{3,}').hasMatch(line)) { continue; }
      // Skip S.U.P.W. and subsidiary header
      if (line.toUpperCase().startsWith('S.U.P.W') ||
          line.toUpperCase().contains('SUBSIDIARY SUBJECTS')) { continue; }

      // Subject name = text before first digit run
      final numStart = RegExp(r'\d').firstMatch(line);
      if (numStart == null) continue;
      final rawName = line.substring(0, numStart.start).trim();
      if (rawName.length < 3) continue;

      // Collect all integers from the line
      final numbers = RegExp(r'\b(\d{1,3})\b')
          .allMatches(line)
          .map((m) => int.parse(m.group(1)!))
          .toList();

      // Find first score: skip 100 (max marks), take first value ≥40 ≤100
      String? rawGrade;
      bool skippedMax = false;
      for (final n in numbers) {
        if (!skippedMax && n == 100) { skippedMax = true; continue; }
        if (n >= 40 && n <= 100) { rawGrade = n.toString(); break; }
      }
      if (rawGrade == null) continue;

      final grade   = system.gradeValues.contains(rawGrade) ? rawGrade : null;
      final subject = _matchSubjectByName(rawName, subjects);
      results.add(_ScanResult(
        grade: grade,
        rawGrade: rawGrade,
        subject: subject,
        rawSubjectName: rawName,
      ));
    }
    return results;
  }

  // ── Subject matching ─────────────────────────────────────────

  static SubjectItem? _matchSubjectByName(String name, List<SubjectItem> subjects) {
    if (subjects.isEmpty) return null;
    final lower  = name.toLowerCase().trim();
    final sorted = [...subjects]..sort((a, b) => b.name.length.compareTo(a.name.length));
    for (final s in sorted) {
      if (s.name.length < 3) continue;
      if (lower.contains(s.name.toLowerCase())) return s;
      if (_crossLangMatch(lower, s.name.toLowerCase())) return s;
    }
    return null;
  }

  static bool _crossLangMatch(String ocr, String sub) {
    const m = {
      'mathematik': ['mathematics', 'maths', 'math'],
      'mathematics': ['mathematik'], 'maths': ['mathematik'],
      'deutsch': ['german'], 'german': ['deutsch'],
      'englisch': ['english'], 'english': ['englisch'],
      'physik': ['physics'], 'physics': ['physik'],
      'chemie': ['chemistry'], 'chemistry': ['chemie'],
      'biologie': ['biology'], 'biology': ['biologie'],
      'informatik': ['computer science', 'computing', 'informatics'],
      'geschichte': ['history'], 'history': ['geschichte'],
      'geographie': ['geography'], 'erdkunde': ['geography'],
      'geography': ['geographie', 'erdkunde'],
      'sport': ['physical education', 'p.e.', 'sports'],
      'musik': ['music'], 'music': ['musik'],
      'kunst': ['art', 'fine art'],
      'wirtschaft': ['economics', 'business'],
      'sozialwissenschaften': ['social studies', 'social science'],
      'social studies': ['sozialwissenschaften'],
    };
    for (final entry in m.entries) {
      if (ocr.contains(entry.key)) {
        for (final eq in entry.value) {
          if (sub.contains(eq)) return true;
        }
      }
    }
    return false;
  }

  static SubjectItem? _matchSubject(String text, List<SubjectItem> subjects) {
    if (subjects.isEmpty) return null;
    final lower  = text.toLowerCase();
    final sorted = [...subjects]..sort((a, b) => b.name.length.compareTo(a.name.length));
    for (final s in sorted) {
      if (s.name.length > 2 && lower.contains(s.name.toLowerCase())) return s;
    }
    return null;
  }

  static String? _extractGrade(String text, GradingSystem system) {
    final values = system.gradeValues;
    if (values.isEmpty) return null;
    if (system.gradeDefinitions.isNotEmpty) {
      final lower = text.toLowerCase();
      for (final def in system.gradeDefinitions) {
        final esc = RegExp.escape(def.grade.toLowerCase());
        if (RegExp(r'\b' + esc + r'\b').hasMatch(lower)) return def.grade;
      }
    }
    for (final pat in _patternsForSystem(system.id)) {
      final match = pat.firstMatch(text);
      if (match != null) {
        final raw  = match.group(0)!.trim();
        if (values.contains(raw)) return raw;
        final base = raw.replaceAll(RegExp(r'[+-]$'), '');
        if (values.contains(base)) return base;
      }
    }
    return null;
  }

  static String? _firstNumericToken(String text) =>
      RegExp(r'\b(\d{1,3})\b').firstMatch(text)?.group(1);

  static List<RegExp> _patternsForSystem(String id) {
    final lower = id.toLowerCase();
    if (lower.contains('gymnasium'))  return [RegExp(r'\b(1[0-5]|[0-9])\b')];
    if (lower.contains('letter') || lower.contains('us_')) return [RegExp(r'\b[A-F][+-]?\b')];
    if (lower.contains('fr_') || lower.contains('0_20')) {
      return [RegExp(r'\b(1[0-9]|20|[0-9])\s*/\s*20\b'), RegExp(r'\b(1[0-9]|20|[0-9])\b')];
    }
    if (lower.contains('uk') || lower.contains('gcse')) {
      return [RegExp(r'\b[1-9]\b'), RegExp(r'\b[A-G]\*?\b')];
    }
    if (lower.contains('percent') || lower.contains('ca_') || lower.contains('in_')) {
      return [RegExp(r'\b\d{1,3}\s*%'), RegExp(r'\b(100|[1-9]?\d)\b')];
    }
    return [RegExp(r'\b[1-6][+-]?\b')];
  }
}

// ── Class level helpers ──────────────────────────────────────────

int? _detectClassLevel(String text) {
  // German: "Klasse 10R" → 10
  final de = RegExp(r'[Kk]lasse\s+(\d+)').firstMatch(text);
  if (de != null) return int.tryParse(de.group(1)!);
  // Indian: "CLASS : IX" → 9
  final en = RegExp(r'CLASS\s*:\s*([IVXivx]+)', caseSensitive: false).firstMatch(text);
  if (en != null) return _romanToInt(en.group(1)!.toUpperCase());
  return null;
}

int? _romanToInt(String s) {
  const v = {'I': 1, 'V': 5, 'X': 10, 'L': 50};
  int r = 0;
  for (int i = 0; i < s.length; i++) {
    final cur  = v[s[i]] ?? 0;
    final next = i + 1 < s.length ? (v[s[i + 1]] ?? 0) : 0;
    r += cur < next ? -cur : cur;
  }
  return r > 0 && r <= 13 ? r : null;
}

// ── Main screen ──────────────────────────────────────────────────

class CaptureScreen extends ConsumerStatefulWidget {
  const CaptureScreen({super.key});

  @override
  ConsumerState<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends ConsumerState<CaptureScreen> {
  _CaptureState _state = _CaptureState.viewfinder;
  List<_ScanResult> _scanResults = [];
  int _detectedClassLevel = 5;
  final ImagePicker _picker = ImagePicker();

  // Review state (active when _state == confirming)
  List<_EditableEntry> _entries = [];
  bool _saving = false;
  String? _reviewError;
  int _savedCount = 0;
  CalculatorConfig? _config; // cached when processImage runs — survives provider re-loads

  @override
  void initState() {
    super.initState();
  }

  Future<void> _captureFromCamera() async {
    final file = await _picker.pickImage(source: ImageSource.camera, imageQuality: 90);
    if (file != null && mounted) await _processImage(file);
  }

  Future<void> _pickFromGallery() async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 90);
    if (file != null && mounted) await _processImage(file);
  }

  Future<void> _processImage(XFile file) async {
    setState(() => _state = _CaptureState.processing);
    try {
      final inputImage = InputImage.fromFilePath(file.path);
      final recognizer = TextRecognizer(script: TextRecognitionScript.latin);
      RecognizedText recognized;
      try {
        recognized = await recognizer.processImage(inputImage);
      } finally {
        await recognizer.close();
      }
      final config = await ref.read(calculatorConfigProvider.future);
      List<_ScanResult> results = [];
      int classLevel = 5;
      if (kDebugMode) debugPrint('[OCR] text length=${recognized.text.length}, first100="${recognized.text.substring(0, recognized.text.length.clamp(0, 100))}"');
      if (recognized.text.isNotEmpty) {
        results    = _GradeExtractor.extractAll(recognized.text, config.defaultGradingSystem, config.subjects);
        classLevel = _detectClassLevel(recognized.text) ?? 5;
        if (kDebugMode) debugPrint('[OCR] found ${results.length} results, system=${config.defaultGradingSystem.name}');
      }
      if (mounted) {
        final entries = results.map((r) => _EditableEntry(
          subject: r.subject,
          rawSubjectName: r.rawSubjectName,
          gradeText: r.grade ?? r.rawGrade ?? '',
          rawGrade: r.rawGrade,
        )).toList();
        _config = config;
        setState(() {
          _scanResults = results;
          _detectedClassLevel = classLevel;
          _entries = entries.isEmpty ? [_EditableEntry(gradeText: '')] : entries;
          _saving = false;
          _reviewError = null;
          _savedCount = 0;
          _state = _CaptureState.confirming;
        });
      }
    } catch (e, st) {
      if (kDebugMode) debugPrint('[OCR] error: $e\n$st');
      if (mounted) {
        try { _config = await ref.read(calculatorConfigProvider.future); } catch (_) {}
        setState(() {
          _entries = [_EditableEntry(gradeText: '')];
          _saving = false;
          _reviewError = null;
          _savedCount = 0;
          _state = _CaptureState.confirming;
        });
      }
    }
  }

  Future<void> _saveAll(AppLocalizations l10n, GradingSystem system) async {
    final valid = _entries.where((e) => e.subject != null && e.gradeText.isNotEmpty).toList();
    if (valid.isEmpty) {
      setState(() => _reviewError = l10n.captureSelectSubjectAndGrade);
      return;
    }
    setState(() { _saving = true; _reviewError = null; _savedCount = 0; });
    try {
      for (final entry in valid) {
        await ref.read(quickGradesProvider.notifier).addGrade(
          subjectId:       entry.subject!.id,
          gradingSystemId: system.id,
          classLevel:      _detectedClassLevel,
          gradeValue:      entry.gradeText,
        );
        if (mounted) setState(() => _savedCount++);
      }
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) setState(() { _saving = false; _reviewError = e.toString(); });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isConfirming = _state == _CaptureState.confirming;

    // Watch config to keep the provider alive; in confirming state prefer the
    // cached _config so a mid-flow provider re-load doesn't blank the body.
    final configAsync = ref.watch(calculatorConfigProvider);
    final config = isConfirming ? (_config ?? configAsync.valueOrNull) : null;

    return Scaffold(
      backgroundColor: isConfirming
          ? Theme.of(context).scaffoldBackgroundColor
          : const Color(0xFF0D0D0D),
      extendBodyBehindAppBar: false,
      appBar: AppBar(
        backgroundColor: isConfirming
            ? Theme.of(context).colorScheme.surface
            : Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.close_rounded,
            color: isConfirming ? null : Colors.white,
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          isConfirming
              ? (_scanResults.isEmpty ? l10n.captureEnterGrade : l10n.captureReviewGrades)
              : l10n.captureTitle,
          style: TextStyle(
            color: isConfirming ? null : Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      bottomNavigationBar: (isConfirming && config != null)
          ? _buildConfirmingBottomBar(l10n, config.defaultGradingSystem)
          : null,
      body: switch (_state) {
        _CaptureState.viewfinder => _buildViewfinder(l10n),
        _CaptureState.processing => _buildProcessing(l10n),
        _CaptureState.confirming => _buildConfirmingBody(l10n, config),
      },
    );
  }

  Widget _buildViewfinder(AppLocalizations l10n) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          children: [
            const SizedBox(height: 24),
            Text(
              l10n.capturePositionGrade,
              style: const TextStyle(color: Colors.white70, fontSize: 15, height: 1.4),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),
            Center(
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.primary, width: 2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Stack(
                  children: [
                    Positioned(top: 0, left: 0,
                        child: _CornerBracket(alignment: Alignment.topLeft,     color: AppColors.primary)),
                    Positioned(top: 0, right: 0,
                        child: _CornerBracket(alignment: Alignment.topRight,    color: AppColors.primary)),
                    Positioned(bottom: 0, left: 0,
                        child: _CornerBracket(alignment: Alignment.bottomLeft,  color: AppColors.primary)),
                    Positioned(bottom: 0, right: 0,
                        child: _CornerBracket(alignment: Alignment.bottomRight, color: AppColors.primary)),
                    Center(
                      child: Icon(Icons.document_scanner_outlined,
                          size: 64, color: Colors.white.withValues(alpha: 0.2)),
                    ),
                  ],
                ),
              ),
            ),
            const Spacer(),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickFromGallery,
                    icon: const Icon(Icons.photo_library_outlined, color: Colors.white),
                    label: Text(l10n.captureChooseFromGallery,
                        style: const TextStyle(color: Colors.white)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white38),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _captureFromCamera,
                    icon: const Icon(Icons.camera_alt_rounded),
                    label: Text(l10n.captureTakePhoto),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildProcessing(AppLocalizations l10n) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: 24),
          Text(l10n.captureAnalyzingImage,
              style: const TextStyle(color: Colors.white70, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildConfirmingBody(AppLocalizations l10n, CalculatorConfig? config) {
    if (config == null) return const SizedBox.shrink();
    final theme  = Theme.of(context);
    final system = config.defaultGradingSystem;
    return CustomScrollView(
      slivers: [
        // Detection banner
        if (_scanResults.isNotEmpty)
          SliverToBoxAdapter(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              color: AppColors.primary.withValues(alpha: 0.08),
              child: Row(
                children: [
                  const Icon(Icons.auto_awesome_rounded, size: 15, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    l10n.captureNGradesDetected(_scanResults.length),
                    style: const TextStyle(
                        color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),

        // Class level row
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: theme.colorScheme.outlineVariant)),
            ),
            child: Row(
              children: [
                Text(l10n.captureClassLevelLabel,
                    style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w600)),
                const SizedBox(width: 10),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: List.generate(13, (i) {
                        final lvl      = i + 1;
                        final selected = lvl == _detectedClassLevel;
                        return GestureDetector(
                          onTap: _saving ? null : () => setState(() => _detectedClassLevel = lvl),
                          child: Container(
                            width: 30, height: 30,
                            margin: const EdgeInsets.only(right: 4),
                            decoration: BoxDecoration(
                              color: selected ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: selected
                                    ? AppColors.primary
                                    : theme.colorScheme.outlineVariant,
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Text('$lvl', style: TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w700,
                              color: selected ? Colors.white : theme.colorScheme.onSurfaceVariant,
                            )),
                          ),
                        );
                      }),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Entry rows
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          sliver: SliverList.separated(
            itemCount: _entries.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (ctx, i) => _EntryRow(
              key:      ValueKey(i),
              entry:    _entries[i],
              system:   system,
              subjects: config.subjects,
              saving:   _saving,
              onChanged: () => setState(() {}),
              onDelete:  _entries.length > 1
                  ? () => setState(() => _entries.removeAt(i))
                  : null,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildConfirmingBottomBar(AppLocalizations l10n, GradingSystem system) {
    final theme      = Theme.of(context);
    final validCount = _entries.where((e) => e.subject != null && e.gradeText.isNotEmpty).length;
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_reviewError != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(_reviewError!,
                    style: TextStyle(color: theme.colorScheme.error, fontSize: 13),
                    textAlign: TextAlign.center),
              ),
            if (_saving) ...[
              LinearProgressIndicator(
                value: _savedCount / _entries.length.clamp(1, 9999),
                color: AppColors.primary,
                backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: 8),
            ],
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: _saving
                      ? null
                      : () => setState(() => _entries.add(_EditableEntry(gradeText: ''))),
                  icon: const Icon(Icons.add_rounded, size: 16),
                  label: Text(l10n.captureAddEntry),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    minimumSize: const Size(0, 44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: (_saving || validCount == 0)
                        ? null
                        : () => _saveAll(l10n, system),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.4),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: _saving
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text(
                            l10n.captureSaveAll(validCount),
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Entry row ────────────────────────────────────────────────────

class _EntryRow extends StatelessWidget {
  final _EditableEntry     entry;
  final GradingSystem      system;
  final List<SubjectItem>  subjects;
  final bool               saving;
  final VoidCallback       onChanged;
  final VoidCallback?      onDelete;

  const _EntryRow({
    super.key,
    required this.entry,
    required this.system,
    required this.subjects,
    required this.saving,
    required this.onChanged,
    this.onDelete,
  });

  Future<void> _pickSubject(BuildContext context) async {
    final picked = await showModalBottomSheet<SubjectItem>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _SubjectPickerSheet(subjects: subjects, selected: entry.subject),
    );
    if (picked != null) {
      entry.subject = picked;
      onChanged();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme   = Theme.of(context);
    final l10n    = AppLocalizations.of(context)!;
    final grades  = system.gradeValues;
    final unknown = entry.subject == null;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: unknown
              ? theme.colorScheme.error.withValues(alpha: 0.35)
              : theme.colorScheme.outlineVariant,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Subject chip + delete button row
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: saving ? null : () => _pickSubject(context),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: unknown
                          ? theme.colorScheme.errorContainer.withValues(alpha: 0.25)
                          : AppColors.primary.withValues(alpha: 0.09),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: unknown
                            ? theme.colorScheme.error.withValues(alpha: 0.4)
                            : AppColors.primary.withValues(alpha: 0.25),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          unknown ? Icons.help_outline_rounded : Icons.book_outlined,
                          size: 14,
                          color: unknown
                              ? theme.colorScheme.error
                              : AppColors.primary,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            entry.displaySubject().isEmpty
                                ? l10n.captureSelectSubject
                                : entry.displaySubject(),
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: unknown
                                  ? theme.colorScheme.error
                                  : AppColors.primary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Icon(
                          Icons.keyboard_arrow_down_rounded,
                          size: 16,
                          color: unknown
                              ? theme.colorScheme.error
                              : AppColors.primary,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (onDelete != null) ...[
                const SizedBox(width: 6),
                IconButton(
                  icon: Icon(Icons.close_rounded,
                      size: 18, color: theme.colorScheme.onSurfaceVariant),
                  onPressed: saving ? null : onDelete,
                  constraints:
                      const BoxConstraints(minWidth: 32, minHeight: 32),
                  padding: EdgeInsets.zero,
                ),
              ],
            ],
          ),

          const SizedBox(height: 10),

          // Grade picker
          if (grades.isNotEmpty && grades.length <= 10)
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: grades.map((g) {
                final selected = g == entry.gradeText;
                return GestureDetector(
                  onTap: saving
                      ? null
                      : () {
                          entry.gradeText = g;
                          onChanged();
                        },
                  child: Container(
                    width: 40,
                    height: 36,
                    decoration: BoxDecoration(
                      color: selected
                          ? AppColors.primary
                          : theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      g,
                      style: TextStyle(
                        color: selected
                            ? Colors.white
                            : theme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                );
              }).toList(),
            )
          else
            // Text field for large-range systems (percentages, US letter, etc.)
            TextFormField(
              initialValue: entry.gradeText,
              enabled: !saving,
              decoration: InputDecoration(
                isDense: true,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                labelText: l10n.captureGradeLabel,
                hintText: entry.rawGrade,
              ),
              onChanged: (v) {
                entry.gradeText = v.trim();
                onChanged();
              },
            ),

          // Hint when detected raw value differs from any system value
          if (entry.gradeText.isNotEmpty &&
              !system.gradeValues.contains(entry.gradeText) &&
              grades.isNotEmpty &&
              grades.length > 10)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '≈ ${entry.gradeText}',
                style: TextStyle(
                    fontSize: 11,
                    color: theme.colorScheme.onSurfaceVariant),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Subject picker bottom sheet ──────────────────────────────────

class _SubjectPickerSheet extends StatelessWidget {
  final List<SubjectItem> subjects;
  final SubjectItem?      selected;

  const _SubjectPickerSheet({required this.subjects, this.selected});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n  = AppLocalizations.of(context)!;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Text(
                l10n.captureSubjectLabel,
                style: theme.textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: subjects.map((s) {
                    final isSel = s.id == selected?.id;
                    return GestureDetector(
                      onTap: () => Navigator.of(context).pop(s),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: isSel
                              ? AppColors.primary
                              : theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          s.name,
                          style: TextStyle(
                            color: isSel
                                ? Colors.white
                                : theme.colorScheme.onSurfaceVariant,
                            fontWeight:
                                isSel ? FontWeight.w700 : FontWeight.w500,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Corner bracket decoration ────────────────────────────────────

class _CornerBracket extends StatelessWidget {
  final Alignment alignment;
  final Color     color;

  const _CornerBracket({required this.alignment, required this.color});

  @override
  Widget build(BuildContext context) {
    final isLeft = alignment == Alignment.topLeft || alignment == Alignment.bottomLeft;
    final isTop  = alignment == Alignment.topLeft || alignment == Alignment.topRight;
    return SizedBox(
      width:  24,
      height: 24,
      child: CustomPaint(
          painter: _BracketPainter(isLeft: isLeft, isTop: isTop, color: color)),
    );
  }
}

class _BracketPainter extends CustomPainter {
  final bool  isLeft;
  final bool  isTop;
  final Color color;

  _BracketPainter({required this.isLeft, required this.isTop, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color       = color
      ..strokeWidth = 3
      ..style       = PaintingStyle.stroke
      ..strokeCap   = StrokeCap.round;
    final x  = isLeft ? 0.0 : size.width;
    final y  = isTop  ? 0.0 : size.height;
    final dx = isLeft ? size.width * 0.6  : -size.width * 0.6;
    final dy = isTop  ? size.height * 0.6 : -size.height * 0.6;
    canvas.drawPath(
        Path()
          ..moveTo(x + dx, y)
          ..lineTo(x, y)
          ..lineTo(x, y + dy),
        paint);
  }

  @override
  bool shouldRepaint(covariant _BracketPainter old) => false;
}
