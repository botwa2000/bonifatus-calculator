import 'package:flutter/material.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
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

  List<_Page> _getPages(AppLocalizations l10n) => [
    _Page(emoji: '🏆', title: l10n.onboardingPage1Title, body: l10n.onboardingPage1Body),
    _Page(emoji: '📸', title: l10n.onboardingPage2Title, body: l10n.onboardingPage2Body),
    _Page(emoji: '📊', title: l10n.onboardingPage3Title, body: l10n.onboardingPage3Body),
  ];

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  Future<void> _goToLogin() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConstants.keySeenOnboarding, true);
    if (!mounted) return;
    context.go('/auth/login');
  }

  void _next(int pagesLength) {
    if (_page < pagesLength - 1) {
      _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _goToLogin();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    final pages = _getPages(l10n);
    return Scaffold(
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
                    color: theme.colorScheme.onSurface, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  TextButton(
                    onPressed: _goToLogin,
                    child: Text(l10n.onboardingSkip, style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (i) => setState(() => _page = i),
                itemCount: pages.length,
                itemBuilder: (_, i) => _PageView(page: pages[i]),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(pages.length, (i) => _Dot(active: i == _page)),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () => _next(pages.length),
                    child: Text(_page == pages.length - 1 ? l10n.onboardingGetStarted : l10n.onboardingNext),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => context.go('/auth/register'),
                    child: RichText(
                      text: TextSpan(style: theme.textTheme.bodyMedium, children: [
                        TextSpan(text: l10n.onboardingNoAccountPrompt),
                        TextSpan(text: l10n.onboardingSignUpLink,
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
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
            style: theme.textTheme.displayLarge?.copyWith(color: theme.colorScheme.onSurface, height: 1.15),
            textAlign: TextAlign.center),
          const SizedBox(height: 16),
          Text(page.body,
            style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant, height: 1.5),
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
      color: active ? AppColors.primary : Theme.of(context).colorScheme.outlineVariant,
      borderRadius: BorderRadius.circular(4)),
  );
}

class _Page {
  final String emoji, title, body;
  const _Page({required this.emoji, required this.title, required this.body});
}
