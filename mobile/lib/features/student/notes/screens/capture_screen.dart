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

class _ScanResult {
  final String? grade;
  final SubjectItem? subject;
  const _ScanResult({this.grade, this.subject});
}

class _GradeExtractor {
  static _ScanResult extract(
      String text, GradingSystem system, List<SubjectItem> subjects) {
    return _ScanResult(
      grade: _extractGrade(text, system),
      subject: _matchSubject(text, subjects),
    );
  }

  static String? _extractGrade(String text, GradingSystem system) {
    final values = system.gradeValues;
    if (values.isEmpty) return null;

    // Try matching against explicit grade definitions first (exact word boundaries)
    if (system.gradeDefinitions.isNotEmpty) {
      final lower = text.toLowerCase();
      for (final def in system.gradeDefinitions) {
        final escaped = RegExp.escape(def.grade.toLowerCase());
        if (RegExp(r'\b' + escaped + r'\b').hasMatch(lower)) {
          return def.grade;
        }
      }
    }

    // System-specific regex patterns, ordered from most-specific to least
    for (final pattern in _patternsForSystem(system.id)) {
      final match = pattern.firstMatch(text);
      if (match != null) {
        final raw = match.group(0)!.trim();
        if (values.contains(raw)) return raw;
        // Try stripping trailing +/- suffix (e.g. "2+" → "2")
        final base = raw.replaceAll(RegExp(r'[+-]$'), '');
        if (values.contains(base)) return base;
      }
    }
    return null;
  }

  static List<RegExp> _patternsForSystem(String id) {
    final lower = id.toLowerCase();
    if (lower.contains('gymnasium')) {
      // DE_GYMNASIUM: 0–15 points
      return [RegExp(r'\b(1[0-5]|[0-9])\b')];
    }
    if (lower.contains('letter') || lower.contains('us_')) {
      // US letter grades A–F with optional +/-
      return [RegExp(r'\b[A-F][+-]?\b')];
    }
    if (lower.contains('fr_') || lower.contains('0_20')) {
      // French 0–20 system, optionally shown as x/20
      return [
        RegExp(r'\b(1[0-9]|20|[0-9])\s*/\s*20\b'),
        RegExp(r'\b(1[0-9]|20|[0-9])\b'),
      ];
    }
    if (lower.contains('uk') || lower.contains('gcse')) {
      // UK GCSE 1–9 or legacy A*–G
      return [RegExp(r'\b[1-9]\b'), RegExp(r'\b[A-G]\*?\b')];
    }
    if (lower.contains('percent') ||
        lower.contains('ca_') ||
        lower.contains('in_')) {
      // Percentage systems (CA, IN)
      return [
        RegExp(r'\b\d{1,3}\s*%'),
        RegExp(r'\b(100|[1-9]?\d)\b'),
      ];
    }
    // Default: DE_1_6, AT_1_5, CH_6_1 — integer 1–6 with optional +/-
    return [RegExp(r'\b[1-6][+-]?\b')];
  }

  static SubjectItem? _matchSubject(String text, List<SubjectItem> subjects) {
    if (subjects.isEmpty) return null;
    final lower = text.toLowerCase();
    // Sort by name length descending so longer (more specific) names match first
    final sorted = [...subjects]
      ..sort((a, b) => b.name.length.compareTo(a.name.length));
    for (final s in sorted) {
      if (s.name.length > 2 && lower.contains(s.name.toLowerCase())) return s;
    }
    return null;
  }
}

class CaptureScreen extends ConsumerStatefulWidget {
  const CaptureScreen({super.key});

  @override
  ConsumerState<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends ConsumerState<CaptureScreen> {
  _CaptureState _state = _CaptureState.viewfinder;
  _ScanResult? _scanResult;
  final ImagePicker _picker = ImagePicker();

  Future<void> _captureFromCamera() async {
    final XFile? file = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 90,
    );
    if (file != null && mounted) await _processImage(file);
  }

  Future<void> _pickFromGallery() async {
    final XFile? file = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 90,
    );
    if (file != null && mounted) await _processImage(file);
  }

  Future<void> _processImage(XFile file) async {
    setState(() => _state = _CaptureState.processing);
    try {
      final inputImage = InputImage.fromFilePath(file.path);
      final recognizer =
          TextRecognizer(script: TextRecognitionScript.latin);
      RecognizedText recognized;
      try {
        recognized = await recognizer.processImage(inputImage);
      } finally {
        await recognizer.close();
      }
      final config = ref.read(calculatorConfigProvider).valueOrNull;
      _ScanResult? result;
      if (config != null && recognized.text.isNotEmpty) {
        result = _GradeExtractor.extract(
          recognized.text,
          config.defaultGradingSystem,
          config.subjects,
        );
      }
      if (mounted) {
        setState(() {
          _scanResult = result;
          _state = _CaptureState.confirming;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _state = _CaptureState.confirming);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Text(
          l10n.captureTitle,
          style: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.w600),
        ),
      ),
      body: switch (_state) {
        _CaptureState.viewfinder => _buildViewfinder(l10n),
        _CaptureState.processing => _buildProcessing(l10n),
        _CaptureState.confirming => _buildConfirming(),
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
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 15,
                height: 1.4,
              ),
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
                    Positioned(
                        top: 0,
                        left: 0,
                        child: _CornerBracket(
                            alignment: Alignment.topLeft,
                            color: AppColors.primary)),
                    Positioned(
                        top: 0,
                        right: 0,
                        child: _CornerBracket(
                            alignment: Alignment.topRight,
                            color: AppColors.primary)),
                    Positioned(
                        bottom: 0,
                        left: 0,
                        child: _CornerBracket(
                            alignment: Alignment.bottomLeft,
                            color: AppColors.primary)),
                    Positioned(
                        bottom: 0,
                        right: 0,
                        child: _CornerBracket(
                            alignment: Alignment.bottomRight,
                            color: AppColors.primary)),
                    Center(
                      child: Icon(
                        Icons.document_scanner_outlined,
                        size: 64,
                        color: Colors.white.withValues(alpha: 0.2),
                      ),
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
                    icon: const Icon(Icons.photo_library_outlined,
                        color: Colors.white),
                    label: Text(l10n.captureChooseFromGallery,
                        style: const TextStyle(color: Colors.white)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white38),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
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
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
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
          Text(
            l10n.captureAnalyzingImage,
            style: const TextStyle(color: Colors.white70, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirming() {
    final configAsync = ref.watch(calculatorConfigProvider);
    return configAsync.when(
      loading: () =>
          const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      error: (_, __) => _GradeEntryForm(
        config: CalculatorConfig.fallback,
        scanResult: _scanResult,
        onSaved: () => context.pop(),
      ),
      data: (config) => _GradeEntryForm(
        config: config,
        scanResult: _scanResult,
        onSaved: () => context.pop(),
      ),
    );
  }
}

class _GradeEntryForm extends ConsumerStatefulWidget {
  final CalculatorConfig config;
  final _ScanResult? scanResult;
  final VoidCallback onSaved;

  const _GradeEntryForm(
      {required this.config, required this.onSaved, this.scanResult});

  @override
  ConsumerState<_GradeEntryForm> createState() => _GradeEntryFormState();
}

class _GradeEntryFormState extends ConsumerState<_GradeEntryForm> {
  late GradingSystem _selectedSystem;
  SubjectItem? _selectedSubject;
  String? _selectedGrade;
  int _classLevel = 5;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _selectedSystem = widget.config.defaultGradingSystem;
    _selectedSubject = widget.scanResult?.subject ??
        (widget.config.subjects.isNotEmpty
            ? widget.config.subjects.first
            : null);
    final grades = _selectedSystem.gradeValues;
    final detected = widget.scanResult?.grade;
    if (detected != null && grades.contains(detected)) {
      _selectedGrade = detected;
    } else if (grades.isNotEmpty) {
      _selectedGrade = grades.first;
    }
  }

  Future<void> _save(AppLocalizations l10n) async {
    if (_selectedSubject == null || _selectedGrade == null) {
      setState(() => _error = l10n.captureSelectSubjectAndGrade);
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(quickGradesProvider.notifier).addGrade(
            subjectId: _selectedSubject!.id,
            gradingSystemId: _selectedSystem.id,
            classLevel: _classLevel,
            gradeValue: _selectedGrade!,
          );
      if (mounted) widget.onSaved();
    } catch (e) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final grades = _selectedSystem.gradeValues;
    final detected = widget.scanResult?.grade != null ||
        widget.scanResult?.subject != null;

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(
              l10n.captureEnterGrade,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              detected
                  ? l10n.captureDetectedHint
                  : l10n.captureSelectSubjectGrade,
              style: TextStyle(
                color: detected
                    ? AppColors.primary.withValues(alpha: 0.9)
                    : Colors.white60,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 28),

            // Subject picker
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.captureSubjectLabel,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.white60),
                  ),
                  const SizedBox(height: 12),
                  if (widget.config.subjects.isEmpty)
                    Text(l10n.captureNoSubjectsLoaded,
                        style: const TextStyle(color: Colors.white54))
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: widget.config.subjects.map((s) {
                        final selected = s.id == _selectedSubject?.id;
                        final autoDetected =
                            widget.scanResult?.subject?.id == s.id;
                        return GestureDetector(
                          onTap: () =>
                              setState(() => _selectedSubject = s),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: selected
                                  ? AppColors.primary
                                  : Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(20),
                              border: autoDetected && !selected
                                  ? Border.all(
                                      color: AppColors.primary
                                          .withValues(alpha: 0.5))
                                  : null,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (autoDetected) ...[
                                  Icon(Icons.auto_awesome,
                                      size: 12,
                                      color: selected
                                          ? Colors.white
                                          : AppColors.primary),
                                  const SizedBox(width: 4),
                                ],
                                Text(
                                  s.name,
                                  style: TextStyle(
                                    color: selected
                                        ? Colors.white
                                        : Colors.white70,
                                    fontWeight: FontWeight.w500,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Grade picker
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.captureGradeLabel,
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Colors.white60),
                      ),
                      Text(
                        _selectedSystem.name,
                        style: const TextStyle(
                            fontSize: 12, color: Colors.white38),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: grades.map((g) {
                      final selected = g == _selectedGrade;
                      final autoDetected = widget.scanResult?.grade == g;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () =>
                              setState(() => _selectedGrade = g),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            padding:
                                const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: selected
                                  ? AppColors.primary
                                  : Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(10),
                              border: autoDetected && !selected
                                  ? Border.all(
                                      color: AppColors.primary
                                          .withValues(alpha: 0.6))
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (autoDetected && !selected)
                                  Icon(Icons.auto_awesome,
                                      size: 8,
                                      color: AppColors.primary
                                          .withValues(alpha: 0.8)),
                                Text(
                                  g,
                                  style: TextStyle(
                                    color: selected
                                        ? Colors.white
                                        : Colors.white70,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Class level picker
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.captureClassLevelLabel,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.white60),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: List.generate(13, (i) {
                      final level = i + 1;
                      final selected = level == _classLevel;
                      return GestureDetector(
                        onTap: () =>
                            setState(() => _classLevel = level),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.primary
                                : Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '$level',
                            style: TextStyle(
                              color: selected
                                  ? Colors.white
                                  : Colors.white70,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),

            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  _error!,
                  style:
                      const TextStyle(color: AppColors.error, fontSize: 13),
                ),
              ),
            ],

            const SizedBox(height: 28),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed:
                        _saving ? null : () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white38),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(l10n.captureCancel,
                        style: const TextStyle(color: Colors.white70)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _saving ? null : () => _save(l10n),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2),
                          )
                        : Text(l10n.captureSaveGrade,
                            style: const TextStyle(
                                fontWeight: FontWeight.w700)),
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
}

class _CornerBracket extends StatelessWidget {
  final Alignment alignment;
  final Color color;

  const _CornerBracket({required this.alignment, required this.color});

  @override
  Widget build(BuildContext context) {
    final isLeft = alignment == Alignment.topLeft ||
        alignment == Alignment.bottomLeft;
    final isTop =
        alignment == Alignment.topLeft || alignment == Alignment.topRight;
    return SizedBox(
      width: 24,
      height: 24,
      child: CustomPaint(
        painter:
            _BracketPainter(isLeft: isLeft, isTop: isTop, color: color),
      ),
    );
  }
}

class _BracketPainter extends CustomPainter {
  final bool isLeft;
  final bool isTop;
  final Color color;

  _BracketPainter(
      {required this.isLeft, required this.isTop, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final x = isLeft ? 0.0 : size.width;
    final y = isTop ? 0.0 : size.height;
    final dx = isLeft ? size.width * 0.6 : -size.width * 0.6;
    final dy = isTop ? size.height * 0.6 : -size.height * 0.6;

    final path = Path()
      ..moveTo(x + dx, y)
      ..lineTo(x, y)
      ..lineTo(x, y + dy);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _BracketPainter oldDelegate) => false;
}
