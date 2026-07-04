import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  static const _pages = [
    _Page(emoji: '🏆', title: 'Turn grades into\nrewards',
      body: 'Students earn bonus points for every good grade. Parents set the rewards. Everyone wins.'),
    _Page(emoji: '📸', title: 'Snap a grade,\nearn instantly',
      body: 'Photo any graded school work. The app reads the subject and grade automatically.'),
    _Page(emoji: '📊', title: 'Track progress\ntogether',
      body: 'Parents and students see the same insights — grades, bonuses, and trends over time.'),
  ];

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  Future<void> _goToLogin() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConstants.keySeenOnboarding, true);
    if (!mounted) return;
    context.go('/auth/login');
  }

  void _next() {
    if (_page < _pages.length - 1) {
      _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _goToLogin();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 0),
              child: Row(
                children: [
                  Image.asset('assets/images/logo.png', width: 36, height: 36),
                  const SizedBox(width: 8),
                  Text('Bonifatus', style: theme.textTheme.titleLarge?.copyWith(
                    color: AppColors.neutral900, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  TextButton(
                    onPressed: _goToLogin,
                    child: Text('Skip', style: theme.textTheme.labelLarge?.copyWith(color: AppColors.neutral400)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (i) => setState(() => _page = i),
                itemCount: _pages.length,
                itemBuilder: (_, i) => _PageView(page: _pages[i]),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_pages.length, (i) => _Dot(active: i == _page)),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _next,
                    child: Text(_page == _pages.length - 1 ? 'Get Started' : 'Next'),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => context.go('/auth/register'),
                    child: RichText(
                      text: TextSpan(style: theme.textTheme.bodyMedium, children: [
                        const TextSpan(text: "Don't have an account? "),
                        const TextSpan(text: 'Sign up',
                          style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PageView extends StatelessWidget {
  final _Page page;
  const _PageView({required this.page});
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(page.emoji, style: const TextStyle(fontSize: 80)),
          const SizedBox(height: 40),
          Text(page.title,
            style: theme.textTheme.displayLarge?.copyWith(color: AppColors.neutral900, height: 1.15),
            textAlign: TextAlign.center),
          const SizedBox(height: 16),
          Text(page.body,
            style: theme.textTheme.bodyLarge?.copyWith(color: AppColors.neutral600, height: 1.5),
            textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  final bool active;
  const _Dot({required this.active});
  @override
  Widget build(BuildContext context) => AnimatedContainer(
    duration: const Duration(milliseconds: 200),
    margin: const EdgeInsets.symmetric(horizontal: 4),
    width: active ? 20 : 8, height: 8,
    decoration: BoxDecoration(
      color: active ? AppColors.primary : AppColors.neutral200,
      borderRadius: BorderRadius.circular(4)),
  );
}

class _Page {
  final String emoji, title, body;
  const _Page({required this.emoji, required this.title, required this.body});
}
