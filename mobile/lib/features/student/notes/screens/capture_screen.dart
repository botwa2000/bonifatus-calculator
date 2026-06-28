import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_colors.dart';

enum _CaptureState { viewfinder, processing, confirming }

class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> {
  _CaptureState _state = _CaptureState.viewfinder;
  final ImagePicker _picker = ImagePicker();

  void _simulateCapture() {
    setState(() => _state = _CaptureState.processing);
    Timer(const Duration(milliseconds: 1500), () {
      if (mounted) {
        setState(() => _state = _CaptureState.confirming);
      }
    });
  }

  Future<void> _pickFromGallery() async {
    final XFile? file = await _picker.pickImage(source: ImageSource.gallery);
    if (file != null && mounted) {
      setState(() => _state = _CaptureState.processing);
      Timer(const Duration(milliseconds: 1500), () {
        if (mounted) {
          setState(() => _state = _CaptureState.confirming);
        }
      });
    }
  }

  void _confirm() {
    context.pop();
  }

  void _showEditSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _EditSheet(
        initialSubject: "Math",
        initialGrade: "2",
        onSave: (subject, grade) {
          Navigator.of(ctx).pop();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          "Capture Grade",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
      ),
      body: switch (_state) {
        _CaptureState.viewfinder => _buildViewfinder(),
        _CaptureState.processing => _buildProcessing(),
        _CaptureState.confirming => _buildConfirming(),
      },
    );
  }

  Widget _buildViewfinder() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          children: [
            const SizedBox(height: 24),
            const Text(
              "Position the grade so it is clearly visible",
              style: TextStyle(
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
                  border: Border.all(
                    color: AppColors.primary,
                    width: 2,
                    style: BorderStyle.solid,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      top: 0,
                      left: 0,
                      child: _CornerBracket(
                        alignment: Alignment.topLeft,
                        color: AppColors.primary,
                      ),
                    ),
                    Positioned(
                      top: 0,
                      right: 0,
                      child: _CornerBracket(
                        alignment: Alignment.topRight,
                        color: AppColors.primary,
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      left: 0,
                      child: _CornerBracket(
                        alignment: Alignment.bottomLeft,
                        color: AppColors.primary,
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: _CornerBracket(
                        alignment: Alignment.bottomRight,
                        color: AppColors.primary,
                      ),
                    ),
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
                    icon: const Icon(Icons.photo_library_outlined, color: Colors.white),
                    label: const Text(
                      "Choose from Gallery",
                      style: TextStyle(color: Colors.white),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white38),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _simulateCapture,
                    icon: const Icon(Icons.camera_alt_rounded),
                    label: const Text("Take Photo"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
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

  Widget _buildProcessing() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppColors.primary),
          SizedBox(height: 24),
          Text(
            "Analyzing grade...",
            style: TextStyle(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirming() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 16),
            const Text(
              "Grade detected",
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              "Please confirm or edit the result",
              style: TextStyle(color: Colors.white60, fontSize: 14),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.3),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.tierBestLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          "Math",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.tierBest,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Container(
                        width: 56,
                        height: 56,
                        decoration: const BoxDecoration(
                          color: AppColors.tierBest,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          "2",
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            "OCR Confidence",
                            style: TextStyle(
                              color: Colors.white60,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            "85%",
                            style: TextStyle(
                              color: AppColors.tierBest,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: 0.85,
                          backgroundColor: Colors.white12,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            AppColors.tierBest,
                          ),
                          minHeight: 8,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Spacer(),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _showEditSheet,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white38),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      "Edit",
                      style: TextStyle(color: Colors.white70),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _confirm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      "Confirm",
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
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
    final isLeft = alignment == Alignment.topLeft || alignment == Alignment.bottomLeft;
    final isTop = alignment == Alignment.topLeft || alignment == Alignment.topRight;
    return SizedBox(
      width: 24,
      height: 24,
      child: CustomPaint(
        painter: _BracketPainter(
          isLeft: isLeft,
          isTop: isTop,
          color: color,
        ),
      ),
    );
  }
}

class _BracketPainter extends CustomPainter {
  final bool isLeft;
  final bool isTop;
  final Color color;

  _BracketPainter({
    required this.isLeft,
    required this.isTop,
    required this.color,
  });

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

class _EditSheet extends StatefulWidget {
  final String initialSubject;
  final String initialGrade;
  final void Function(String subject, String grade) onSave;

  const _EditSheet({
    required this.initialSubject,
    required this.initialGrade,
    required this.onSave,
  });

  @override
  State<_EditSheet> createState() => _EditSheetState();
}

class _EditSheetState extends State<_EditSheet> {
  late String _subject;
  late String _grade;

  static const List<String> _subjects = [
    "Math",
    "English",
    "Biology",
    "Physics",
    "History",
    "Chemistry",
    "German",
    "Geography",
  ];

  static const List<String> _grades = ["1", "2", "3", "4", "5", "6"];

  @override
  void initState() {
    super.initState();
    _subject = widget.initialSubject;
    _grade = widget.initialGrade;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 24,
        right: 24,
        top: 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Edit Detection",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.neutral900,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            "Subject",
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.neutral600,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _subjects.map((s) {
              final selected = s == _subject;
              return GestureDetector(
                onTap: () => setState(() => _subject = s),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : AppColors.neutral100,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    s,
                    style: TextStyle(
                      color: selected ? AppColors.white : AppColors.neutral700,
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          const Text(
            "Grade",
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.neutral600,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: _grades.map((g) {
              final selected = g == _grade;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _grade = g),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.primary : AppColors.neutral100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      g,
                      style: TextStyle(
                        color: selected ? AppColors.white : AppColors.neutral700,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => widget.onSave(_subject, _grade),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                "Save",
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
