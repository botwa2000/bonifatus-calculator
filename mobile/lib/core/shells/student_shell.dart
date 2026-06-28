import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';

class StudentShell extends StatelessWidget {
  final Widget child;
  const StudentShell({super.key, required this.child});

  static const _tabs = [
    _TabItem(label: 'Home', icon: Icons.home_outlined, activeIcon: Icons.home, path: '/student/home'),
    _TabItem(label: 'Notes', icon: Icons.camera_alt_outlined, activeIcon: Icons.camera_alt, path: '/student/notes'),
    _TabItem(label: 'Calculator', icon: Icons.calculate_outlined, activeIcon: Icons.calculate, path: '/student/calculator'),
    _TabItem(label: 'Insights', icon: Icons.bar_chart_outlined, activeIcon: Icons.bar_chart, path: '/student/insights'),
    _TabItem(label: 'Settings', icon: Icons.settings_outlined, activeIcon: Icons.settings, path: '/student/settings'),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _currentIndex(context);
    final isWideScreen = MediaQuery.of(context).size.width >= 600;

    if (isWideScreen) {
      // Tablet: navigation rail
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: currentIndex,
              onDestinationSelected: (i) => context.go(_tabs[i].path),
              labelType: NavigationRailLabelType.all,
              backgroundColor: Theme.of(context).colorScheme.surface,
              selectedIconTheme: const IconThemeData(color: AppColors.primary),
              selectedLabelTextStyle: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 12),
              destinations: _tabs.map((t) => NavigationRailDestination(
                icon: Icon(t.icon),
                selectedIcon: Icon(t.activeIcon),
                label: Text(t.label),
              )).toList(),
            ),
            const VerticalDivider(width: 1),
            Expanded(child: child),
          ],
        ),
      );
    }

    // Phone: bottom nav
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (i) => context.go(_tabs[i].path),
        items: _tabs.map((t) => BottomNavigationBarItem(
          icon: Icon(t.icon),
          activeIcon: Icon(t.activeIcon),
          label: t.label,
        )).toList(),
      ),
    );
  }
}

class _TabItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final String path;
  const _TabItem({required this.label, required this.icon, required this.activeIcon, required this.path});
}
