import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../widgets/inactivity_guard.dart';
import '../../l10n/app_localizations.dart';

class StudentShell extends StatelessWidget {
  final Widget child;
  const StudentShell({super.key, required this.child});

  static const _tabs = [
    _TabItem(icon: Icons.home_outlined, activeIcon: Icons.home, path: '/student/home'),
    _TabItem(icon: Icons.camera_alt_outlined, activeIcon: Icons.camera_alt, path: '/student/notes'),
    _TabItem(icon: Icons.calculate_outlined, activeIcon: Icons.calculate, path: '/student/calculator'),
    _TabItem(icon: Icons.bar_chart_outlined, activeIcon: Icons.bar_chart, path: '/student/insights'),
    _TabItem(icon: Icons.settings_outlined, activeIcon: Icons.settings, path: '/student/settings'),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  List<String> _labels(AppLocalizations l10n) => [
    l10n.navHome,
    l10n.notesTitle,
    l10n.navCalculator,
    l10n.insightsTitle,
    l10n.settingsTitle,
  ];

  @override
  Widget build(BuildContext context) {
    final currentIndex = _currentIndex(context);
    final isWideScreen = MediaQuery.of(context).size.width >= 600;
    final l10n = AppLocalizations.of(context)!;
    final labels = _labels(l10n);

    if (isWideScreen) {
      // Tablet: navigation rail
      return InactivityGuard(
        child: Scaffold(
          body: Row(
            children: [
              NavigationRail(
                selectedIndex: currentIndex,
                onDestinationSelected: (i) => context.go(_tabs[i].path),
                labelType: NavigationRailLabelType.all,
                backgroundColor: Theme.of(context).colorScheme.surface,
                selectedIconTheme: const IconThemeData(color: AppColors.primary),
                selectedLabelTextStyle: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 12),
                destinations: List.generate(_tabs.length, (i) => NavigationRailDestination(
                  icon: Icon(_tabs[i].icon),
                  selectedIcon: Icon(_tabs[i].activeIcon),
                  label: Text(labels[i]),
                )),
              ),
              const VerticalDivider(width: 1),
              Expanded(child: child),
            ],
          ),
        ),
      );
    }

    // Phone: bottom nav
    return InactivityGuard(
      child: Scaffold(
        body: child,
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: (i) => context.go(_tabs[i].path),
          items: List.generate(_tabs.length, (i) => BottomNavigationBarItem(
            icon: Icon(_tabs[i].icon),
            activeIcon: Icon(_tabs[i].activeIcon),
            label: labels[i],
          )),
        ),
      ),
    );
  }
}

class _TabItem {
  final IconData icon;
  final IconData activeIcon;
  final String path;
  const _TabItem({required this.icon, required this.activeIcon, required this.path});
}
