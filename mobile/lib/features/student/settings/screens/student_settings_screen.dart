import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/theme_mode_provider.dart';
import '../../../../core/providers/locale_provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../../api/services/connection_service.dart';
import '../../../../api/services/biometric_service.dart';

const _kLanguages = [
  (code: 'en', name: 'English', flag: '🇬🇧'),
  (code: 'de', name: 'Deutsch', flag: '🇩🇪'),
  (code: 'fr', name: 'Français', flag: '🇫🇷'),
  (code: 'it', name: 'Italiano', flag: '🇮🇹'),
  (code: 'es', name: 'Español', flag: '🇪🇸'),
  (code: 'ru', name: 'Русский', flag: '🇷🇺'),
];

class StudentSettingsScreen extends ConsumerStatefulWidget {
  const StudentSettingsScreen({super.key});

  @override
  ConsumerState<StudentSettingsScreen> createState() => _StudentSettingsScreenState();
}

class _StudentSettingsScreenState extends ConsumerState<StudentSettingsScreen> {
  List<Map<String, dynamic>> _parentConnections = [];
  bool _connectionsLoaded = false;
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;

  @override
  void initState() {
    super.initState();
    _loadConnections();
    _checkBiometric();
  }

  Future<void> _loadConnections() async {
    try {
      final service = ref.read(connectionServiceProvider);
      final connections = await service.fetchParentConnections();
      if (mounted) setState(() { _parentConnections = connections; _connectionsLoaded = true; });
    } catch (_) {
      if (mounted) setState(() => _connectionsLoaded = true);
    }
  }

  Future<void> _checkBiometric() async {
    final svc = ref.read(biometricServiceProvider);
    final available = await svc.canAuthenticate();
    final enabled = available ? await svc.isEnabled() : false;
    if (!mounted) return;
    setState(() { _biometricAvailable = available; _biometricEnabled = enabled; });
  }

  Future<void> _toggleBiometric(bool value) async {
    final svc = ref.read(biometricServiceProvider);
    if (value) {
      final authed = await svc.authenticate(reason: 'Verify to enable biometric login');
      if (!authed) return;
    }
    await svc.setEnabled(value);
    if (mounted) setState(() => _biometricEnabled = value);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final currentThemeMode = ref.watch(themeModeProvider).valueOrNull ?? ThemeMode.system;
    final currentLocale = ref.watch(localeProvider).valueOrNull;

    return Scaffold(
      backgroundColor: cs.surfaceContainerLowest,
      appBar: AppBar(
        backgroundColor: cs.surface,
        elevation: 0,
        title: Text('Settings', style: TextStyle(color: cs.onSurface, fontWeight: FontWeight.w700, fontSize: 20)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionHeader(title: 'Preferences'),
          const SizedBox(height: 8),
          _buildPreferencesCard(context, currentThemeMode, currentLocale),
          const SizedBox(height: 20),
          _SectionHeader(title: 'Account'),
          const SizedBox(height: 8),
          _buildAccountCard(context),
          const SizedBox(height: 20),
          _SectionHeader(title: 'Connected Parents'),
          const SizedBox(height: 8),
          _buildConnectedParentsCard(context),
          const SizedBox(height: 20),
          _SectionHeader(title: 'App'),
          const SizedBox(height: 8),
          _buildAppCard(context),
          const SizedBox(height: 20),
          _buildLogoutButton(context),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildPreferencesCard(BuildContext context, ThemeMode currentThemeMode, Locale? currentLocale) {
    final cs = Theme.of(context).colorScheme;
    final localeLabel = _localeLabel(currentLocale);

    return _Card(children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Appearance', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
          const SizedBox(height: 10),
          SegmentedButton<ThemeMode>(
            segments: const [
              ButtonSegment(value: ThemeMode.system, label: Text('System'), icon: Icon(Icons.brightness_auto_rounded, size: 16)),
              ButtonSegment(value: ThemeMode.light, label: Text('Light'), icon: Icon(Icons.light_mode_rounded, size: 16)),
              ButtonSegment(value: ThemeMode.dark, label: Text('Dark'), icon: Icon(Icons.dark_mode_rounded, size: 16)),
            ],
            selected: {currentThemeMode},
            onSelectionChanged: (s) =>
                ref.read(themeModeProvider.notifier).setThemeMode(s.first),
            style: ButtonStyle(
              visualDensity: VisualDensity.compact,
              textStyle: WidgetStateProperty.all(const TextStyle(fontSize: 12)),
            ),
          ),
        ]),
      ),
      Divider(height: 1, indent: 16, endIndent: 16, color: cs.outlineVariant),
      ListTile(
        leading: Icon(Icons.language_rounded, color: cs.onSurfaceVariant, size: 22),
        title: Text('Language', style: TextStyle(fontSize: 15, color: cs.onSurface, fontWeight: FontWeight.w500)),
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(localeLabel, style: TextStyle(fontSize: 14, color: cs.onSurfaceVariant)),
          const SizedBox(width: 4),
          Icon(Icons.chevron_right_rounded, color: cs.outlineVariant),
        ]),
        onTap: () => _showLanguagePicker(context),
      ),
    ]);
  }

  Widget _buildAccountCard(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return _Card(children: [
      _SettingsTile(
        icon: Icons.lock_outline_rounded,
        label: 'Change Password',
        onTap: () => context.push('/auth/forgot-password'),
      ),
      if (_biometricAvailable) ...[
        Divider(height: 1, indent: 56, color: cs.outlineVariant),
        ListTile(
          leading: const Icon(Icons.fingerprint_rounded, color: AppColors.neutral600, size: 22),
          title: const Text('Biometric Login', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
          trailing: Switch(
            value: _biometricEnabled,
            onChanged: _toggleBiometric,
            activeThumbColor: AppColors.primary,
            activeTrackColor: AppColors.primaryLight,
          ),
          onTap: () => _toggleBiometric(!_biometricEnabled),
        ),
      ],
      Divider(height: 1, indent: 56, color: cs.outlineVariant),
      _SettingsTile(
        icon: Icons.delete_outline_rounded,
        label: 'Delete Account',
        color: AppColors.error,
        onTap: () => _confirmDeleteAccount(context),
      ),
    ]);
  }

  Widget _buildConnectedParentsCard(BuildContext context) {
    if (!_connectionsLoaded) {
      return const _Card(children: [
        Padding(padding: EdgeInsets.all(16),
            child: Center(child: SizedBox(width: 20, height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)))),
      ]);
    }

    return _Card(children: [
      if (_parentConnections.isEmpty)
        _SettingsTile(
          icon: Icons.people_outline_rounded,
          label: 'No parents connected',
          trailing: _scanQrButton(context),
          onTap: () => _showQrScannerSheet(context),
        )
      else ...[
        ..._parentConnections.asMap().entries.map((entry) {
          final cs = Theme.of(context).colorScheme;
          final conn = entry.value;
          final parentName = conn['parentName'] as String? ?? conn['parentEmail'] as String? ?? 'Parent';
          return Column(children: [
            _SettingsTile(
              icon: Icons.person_outline_rounded,
              label: parentName,
              trailing: const Icon(Icons.check_circle_rounded, color: AppColors.tierBest, size: 20),
              onTap: () {},
            ),
            if (entry.key < _parentConnections.length - 1)
              Divider(height: 1, indent: 56, color: cs.outlineVariant),
          ]);
        }),
        Divider(height: 1, indent: 56, color: Theme.of(context).colorScheme.outlineVariant),
        _SettingsTile(
          icon: Icons.qr_code_scanner_rounded,
          label: 'Add another parent',
          onTap: () => _showQrScannerSheet(context),
        ),
      ],
    ]);
  }

  Widget _scanQrButton(BuildContext context) {
    return TextButton.icon(
      onPressed: () => _showQrScannerSheet(context),
      icon: const Icon(Icons.qr_code_scanner_rounded, size: 16, color: AppColors.primary),
      label: const Text('Scan QR', style: TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildAppCard(BuildContext context) {
    return _Card(children: [
      _SettingsTile(
        icon: Icons.info_outline_rounded,
        label: 'About',
        onTap: () => showAboutDialog(context: context, applicationName: 'Bonifatus', applicationVersion: '2.0.0',
          applicationLegalese: 'Grade rewards tracker for students'),
      ),
    ]);
  }

  Widget _buildLogoutButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => _logout(context),
        icon: const Icon(Icons.logout_rounded, color: AppColors.error),
        label: const Text('Log Out', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.error),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }

  void _showLanguagePicker(BuildContext context) {
    final current = ref.read(localeProvider).valueOrNull;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        final cs = Theme.of(ctx).colorScheme;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2))),
              Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                  child: Text('Language', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: cs.onSurface))),
              ListTile(
                leading: const Text('🌐', style: TextStyle(fontSize: 22)),
                title: Text('Auto (System)', style: TextStyle(color: cs.onSurface)),
                trailing: current == null ? const Icon(Icons.check_rounded, color: AppColors.primary) : null,
                onTap: () {
                  ref.read(localeProvider.notifier).setLocale(null);
                  Navigator.of(ctx).pop();
                },
              ),
              const Divider(height: 1, indent: 16, endIndent: 16),
              ..._kLanguages.map((lang) => ListTile(
                leading: Text(lang.flag, style: const TextStyle(fontSize: 22)),
                title: Text(lang.name, style: TextStyle(color: cs.onSurface)),
                trailing: current?.languageCode == lang.code
                    ? const Icon(Icons.check_rounded, color: AppColors.primary)
                    : null,
                onTap: () {
                  ref.read(localeProvider.notifier).setLocale(Locale(lang.code));
                  Navigator.of(ctx).pop();
                },
              )),
              const SizedBox(height: 8),
            ]),
          ),
        );
      },
    );
  }

  void _confirmDeleteAccount(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
          'This will permanently delete your account and all data. This action cannot be undone.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              try {
                await ref.read(authStateNotifierProvider.notifier).deleteAccount();
                if (context.mounted) context.go('/onboarding');
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed to delete account: $e'), backgroundColor: AppColors.error),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete Account'),
          ),
        ],
      ),
    );
  }

  void _showQrScannerSheet(BuildContext context) {
    final controller = MobileScannerController();
    bool redeemed = false;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SizedBox(
        height: MediaQuery.of(ctx).size.height * 0.65,
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Scan Parent QR Code', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () { controller.dispose(); Navigator.of(ctx).pop(); },
              ),
            ]),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Text('Point the camera at the QR code shown on the parent device',
                style: TextStyle(fontSize: 13, color: AppColors.neutral600), textAlign: TextAlign.center),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: MobileScanner(
                controller: controller,
                onDetect: (capture) async {
                  if (redeemed || capture.barcodes.isEmpty) return;
                  final raw = capture.barcodes.first.rawValue ?? '';
                  String code = raw.trim();
                  if (code.contains('code=')) {
                    code = Uri.tryParse(code)?.queryParameters['code'] ?? code;
                  }
                  if (!RegExp(r'^\d{6}$').hasMatch(code)) return;
                  redeemed = true;
                  controller.dispose();
                  if (ctx.mounted) Navigator.of(ctx).pop();
                  try {
                    await ref.read(connectionServiceProvider).redeemCode(code);
                    _loadConnections();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Parent connected!'), backgroundColor: AppColors.tierBest),
                      );
                    }
                  } catch (e) {
                    redeemed = false;
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.error),
                      );
                    }
                  }
                },
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    await ref.read(authStateNotifierProvider.notifier).logout();
    if (context.mounted) context.go('/onboarding');
  }

  static String _localeLabel(Locale? locale) {
    if (locale == null) return 'Auto';
    for (final lang in _kLanguages) {
      if (lang.code == locale.languageCode) return '${lang.flag} ${lang.name}';
    }
    return locale.languageCode.toUpperCase();
  }
}

class _Card extends StatelessWidget {
  final List<Widget> children;
  const _Card({required this.children});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: children),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 4),
      child: Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant, letterSpacing: 0.3)),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final Widget? trailing;
  final Color? color;

  const _SettingsTile({
    required this.icon,
    required this.label,
    this.onTap,
    this.trailing,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final c = color;
    return ListTile(
      leading: Icon(icon, color: c ?? cs.onSurfaceVariant, size: 22),
      title: Text(label, style: TextStyle(fontSize: 15, color: c ?? cs.onSurface, fontWeight: FontWeight.w500)),
      trailing: trailing ?? Icon(Icons.chevron_right_rounded, color: cs.outlineVariant),
      onTap: onTap,
    );
  }
}
