import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/theme_mode_provider.dart';
import '../../../../core/providers/locale_provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/children_provider.dart';
import '../../../../api/services/connection_service.dart';
import '../../../../api/services/biometric_service.dart';
import '../../../../api/services/profile_service.dart';
import '../../../../core/constants/app_constants.dart';

class _TierFactor {
  final String tier;
  final String label;
  final double multiplier;
  final Color color;

  const _TierFactor({
    required this.tier,
    required this.label,
    required this.multiplier,
    required this.color,
  });
}

class _ChildCycleConfig {
  final String childId;
  final String childName;
  final String cycleType;
  final double ratio;

  const _ChildCycleConfig({
    required this.childId,
    required this.childName,
    required this.cycleType,
    required this.ratio,
  });
}

class ParentSettingsScreen extends ConsumerStatefulWidget {
  const ParentSettingsScreen({super.key});

  @override
  ConsumerState<ParentSettingsScreen> createState() =>
      _ParentSettingsScreenState();
}

class _ParentSettingsScreenState extends ConsumerState<ParentSettingsScreen> {
  List<_TierFactor> _tierFactors = const [
    _TierFactor(tier: 'best', label: 'Best (Grade 1–2)', multiplier: 2.0, color: AppColors.tierBest),
    _TierFactor(tier: 'second', label: 'Second (Grade 3)', multiplier: 1.5, color: AppColors.tierSecond),
    _TierFactor(tier: 'third', label: 'Third (Grade 4)', multiplier: 1.0, color: AppColors.tierThird),
  ];
  final Map<String, _ChildCycleConfig> _cycleOverrides = {};
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;

  @override
  void initState() {
    super.initState();
    _loadFactors();
    _checkBiometric();
  }

  Future<void> _loadFactors() async {
    try {
      final service = ref.read(connectionServiceProvider);
      final factors = await service.fetchBonusFactors();
      if (!mounted || factors.isEmpty) return;
      setState(() {
        _tierFactors = _tierFactors.map((f) {
          final loaded = factors[f.tier];
          return loaded != null
              ? _TierFactor(tier: f.tier, label: f.label, multiplier: loaded, color: f.color)
              : f;
        }).toList();
      });
    } catch (_) {}
  }

  Future<void> _checkBiometric() async {
    final svc = ref.read(biometricServiceProvider);
    final available = await svc.canAuthenticate();
    final enabled = available ? await svc.isEnabled() : false;
    if (!mounted) return;
    setState(() {
      _biometricAvailable = available;
      _biometricEnabled = enabled;
    });
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
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
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
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildPreferencesCard(BuildContext context, ThemeMode currentThemeMode, Locale? currentLocale) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
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
      Divider(height: 1, indent: 16, endIndent: 16, color: cs.outlineVariant),
      ListTile(
        leading: Icon(Icons.tune_rounded, color: cs.onSurfaceVariant, size: 22),
        title: Text('Grading Config', style: TextStyle(fontSize: 15, color: cs.onSurface, fontWeight: FontWeight.w500)),
        subtitle: Text('Tier multipliers · notes cycle · bonus ratio',
            style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
        trailing: Icon(Icons.chevron_right_rounded, color: cs.outlineVariant),
        onTap: () => _showGradingConfigSheet(context),
      ),
    ]);
  }

  Widget _buildAccountCard(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return _Card(children: [
      _SettingsTile(icon: Icons.person_outline_rounded, label: 'Edit Profile', onTap: () => _showEditProfileSheet(context)),
      Divider(height: 1, indent: 56, color: cs.outlineVariant),
      _SettingsTile(icon: Icons.lock_outline_rounded, label: 'Change Password', onTap: () => _showChangePasswordSheet(context)),
      Divider(height: 1, indent: 56, color: cs.outlineVariant),
      _SettingsTile(icon: Icons.email_outlined, label: 'Change Email', onTap: () => _showChangeEmailSheet(context)),
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
        icon: Icons.logout_rounded, label: 'Log Out',
        iconColor: AppColors.error, labelColor: AppColors.error,
        onTap: () => _logout(context),
      ),
      Divider(height: 1, indent: 56, color: cs.outlineVariant),
      _SettingsTile(
        icon: Icons.delete_outline_rounded, label: 'Delete Account',
        iconColor: AppColors.error, labelColor: AppColors.error,
        onTap: () => _confirmDeleteAccount(context),
      ),
    ]);
  }

  // ── Sheets & Dialogs ─────────────────────────────────────────────────────

  void _showGradingConfigSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final cs = Theme.of(ctx).colorScheme;
          final childrenAsync = ref.watch(childrenQuickGradesProvider);
          return DraggableScrollableSheet(
            initialChildSize: 0.72,
            minChildSize: 0.4,
            maxChildSize: 0.92,
            expand: false,
            builder: (_, scrollCtrl) => Column(children: [
              Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 4),
                  decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2))),
              Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                  child: Text('Grading Config', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: cs.onSurface))),
              Expanded(
                child: ListView(
                  controller: scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                  children: [
                    // ── Grade Tier Multipliers ──────────────────────────
                    Padding(padding: const EdgeInsets.only(left: 4, bottom: 6, top: 4),
                        child: Text('Grade Tier Multipliers', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant, letterSpacing: 0.3))),
                    _Card(children: List.generate(_tierFactors.length, (i) {
                      final factor = _tierFactors[i];
                      return Column(children: [
                        ListTile(
                          leading: Container(width: 10, height: 10,
                              decoration: BoxDecoration(color: factor.color, shape: BoxShape.circle)),
                          title: Text(factor.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: cs.onSurface)),
                          trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                            Text('${factor.multiplier}x', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary)),
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () => _showMultiplierSheet(i, factor, onSaved: () => setSheetState(() {})),
                              borderRadius: BorderRadius.circular(8),
                              child: const Padding(padding: EdgeInsets.all(4),
                                  child: Icon(Icons.edit_outlined, size: 18, color: AppColors.neutral400)),
                            ),
                          ]),
                        ),
                        if (i < _tierFactors.length - 1)
                          Divider(height: 1, indent: 16, endIndent: 16, color: cs.outlineVariant),
                      ]);
                    })),
                    const SizedBox(height: 20),
                    // ── Ongoing Notes Cycle Config ──────────────────────
                    Padding(padding: const EdgeInsets.only(left: 4, bottom: 6),
                        child: Text('Ongoing Notes Cycle', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant, letterSpacing: 0.3))),
                    childrenAsync.when(
                      loading: () => _Card(children: [
                        const Padding(padding: EdgeInsets.all(24),
                            child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))),
                      ]),
                      error: (_, __) => _Card(children: [
                        Padding(padding: const EdgeInsets.all(16),
                            child: Text('Failed to load children', style: TextStyle(color: cs.onSurfaceVariant))),
                      ]),
                      data: (children) {
                        if (children.isEmpty) {
                          return _Card(children: [
                            Padding(padding: const EdgeInsets.all(16),
                                child: Text('No children connected', style: TextStyle(color: cs.onSurfaceVariant))),
                          ]);
                        }
                        return _Card(children: List.generate(children.length, (i) {
                          final child = children[i];
                          final override = _cycleOverrides[child.childId];
                          final cycleType = override?.cycleType ?? 'Weekly';
                          final ratio = override?.ratio ?? 0.25;
                          final config = _ChildCycleConfig(childId: child.childId, childName: child.childName, cycleType: cycleType, ratio: ratio);
                          return Column(children: [
                            ListTile(
                              leading: Container(width: 36, height: 36,
                                  decoration: const BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
                                  alignment: Alignment.center,
                                  child: Text(config.childName.substring(0, 1).toUpperCase(),
                                      style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary, fontSize: 14))),
                              title: Text(config.childName, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface)),
                              subtitle: Text('${config.cycleType} · ${(config.ratio * 100).round()}% ratio',
                                  style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                              trailing: InkWell(
                                onTap: () => _showCycleConfigSheet(config, onSaved: () => setSheetState(() {})),
                                borderRadius: BorderRadius.circular(8),
                                child: const Padding(padding: EdgeInsets.all(4),
                                    child: Icon(Icons.tune_rounded, size: 20, color: AppColors.neutral400)),
                              ),
                            ),
                            if (i < children.length - 1)
                              Divider(height: 1, indent: 16, endIndent: 16, color: cs.outlineVariant),
                          ]);
                        }));
                      },
                    ),
                  ],
                ),
              ),
            ]),
          );
        },
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
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2))),
                Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                    child: Text('Language', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: cs.onSurface))),
                ListTile(
                  leading: const Text('🌐', style: TextStyle(fontSize: 22)),
                  title: Text('Auto (System)', style: TextStyle(color: cs.onSurface)),
                  trailing: current == null ? Icon(Icons.check_rounded, color: AppColors.primary) : null,
                  onTap: () {
                    ref.read(localeProvider.notifier).setLocale(null);
                    Navigator.of(ctx).pop();
                  },
                ),
                const Divider(height: 1, indent: 16, endIndent: 16),
                ...AppConstants.languages.map((lang) => ListTile(
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
              ],
            ),
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

  void _showMultiplierSheet(int index, _TierFactor factor, {VoidCallback? onSaved}) {
    double currentValue = factor.multiplier.clamp(0.5, 3.0);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Edit Multiplier: ${factor.label}',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
            const SizedBox(height: 20),
            Center(child: Text('${currentValue.toStringAsFixed(1)}x',
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: AppColors.primary))),
            Slider(value: currentValue, min: 0.5, max: 3.0, divisions: 25, activeColor: AppColors.primary,
                onChanged: (v) => setSheetState(() => currentValue = v)),
            const Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('0.5x', style: TextStyle(fontSize: 12, color: AppColors.neutral400)),
              Text('3.0x', style: TextStyle(fontSize: 12, color: AppColors.neutral400)),
            ]),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final newMultiplier = double.parse(currentValue.toStringAsFixed(1));
                  final updated = List<_TierFactor>.from(_tierFactors);
                  updated[index] = _TierFactor(tier: factor.tier, label: factor.label, multiplier: newMultiplier, color: factor.color);
                  setState(() => _tierFactors = updated);
                  Navigator.of(ctx).pop();
                  try {
                    final factorMap = {for (final f in updated) f.tier: f.multiplier};
                    await ref.read(connectionServiceProvider).saveBonusFactors(factorMap);
                  } catch (_) {}
                  onSaved?.call();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary, foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Save', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(height: 16),
          ]),
        ),
      ),
    );
  }

  void _showCycleConfigSheet(_ChildCycleConfig config, {VoidCallback? onSaved}) {
    String currentCycleType = config.cycleType;
    double currentRatio = config.ratio;
    const cycleTypes = ['Daily', 'Weekly', 'Monthly'];

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Config for ${config.childName}',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
            const SizedBox(height: 20),
            const Text('Cycle Type', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.neutral600)),
            const SizedBox(height: 10),
            Row(children: cycleTypes.map((type) {
              final selected = type == currentCycleType;
              return Expanded(child: GestureDetector(
                onTap: () => setSheetState(() => currentCycleType = type),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : AppColors.neutral100,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(type, style: TextStyle(
                    color: selected ? AppColors.white : AppColors.neutral700,
                    fontWeight: FontWeight.w600, fontSize: 13,
                  )),
                ),
              ));
            }).toList()),
            const SizedBox(height: 20),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Bonus Ratio', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.neutral600)),
              Text('${(currentRatio * 100).round()}%',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary)),
            ]),
            Slider(value: currentRatio, min: 0.05, max: 1.0, divisions: 19, activeColor: AppColors.primary,
                onChanged: (v) => setSheetState(() => currentRatio = v)),
            const Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('5%', style: TextStyle(fontSize: 12, color: AppColors.neutral400)),
              Text('100%', style: TextStyle(fontSize: 12, color: AppColors.neutral400)),
            ]),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  setState(() {
                    _cycleOverrides[config.childId] = _ChildCycleConfig(
                      childId: config.childId, childName: config.childName,
                      cycleType: currentCycleType, ratio: currentRatio,
                    );
                  });
                  Navigator.of(ctx).pop();
                  onSaved?.call();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary, foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Save', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(height: 24),
          ]),
        ),
      ),
    );
  }

  void _showEditProfileSheet(BuildContext context) {
    final authState = ref.read(authStateNotifierProvider).valueOrNull;
    final nameCtrl = TextEditingController(text: authState?.name ?? '');
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          left: 24, right: 24, top: 24,
        ),
        child: Form(
          key: formKey,
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Edit Profile', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 20),
            TextFormField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
              textCapitalization: TextCapitalization.words,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Name cannot be empty' : null,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: _SaveButton(onPressed: () async {
                if (!formKey.currentState!.validate()) return;
                Navigator.of(ctx).pop();
                try {
                  await ref.read(profileServiceProvider).updateProfile(fullName: nameCtrl.text.trim());
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Profile updated')),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.error),
                    );
                  }
                }
              }),
            ),
            const SizedBox(height: 24),
          ]),
        ),
      ),
    );
  }

  void _showChangePasswordSheet(BuildContext context) {
    final pwCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool obscure = true;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
            left: 24, right: 24, top: 24,
          ),
          child: Form(
            key: formKey,
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Change Password', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),
              TextFormField(
                controller: pwCtrl,
                obscureText: obscure,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    onPressed: () => setSheetState(() => obscure = !obscure),
                  ),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Enter a password';
                  if (v.length < 12) return 'Minimum 12 characters';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: confirmCtrl,
                obscureText: obscure,
                decoration: const InputDecoration(labelText: 'Confirm Password', border: OutlineInputBorder()),
                validator: (v) => v != pwCtrl.text ? 'Passwords do not match' : null,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: _SaveButton(onPressed: () async {
                  if (!formKey.currentState!.validate()) return;
                  Navigator.of(ctx).pop();
                  try {
                    await ref.read(profileServiceProvider).changePassword(newPassword: pwCtrl.text);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Password changed')),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.error),
                      );
                    }
                  }
                }),
              ),
              const SizedBox(height: 24),
            ]),
          ),
        ),
      ),
    );
  }

  void _showChangeEmailSheet(BuildContext context) {
    final emailCtrl = TextEditingController();
    final codeCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool codeSent = false;
    bool loading = false;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
            left: 24, right: 24, top: 24,
          ),
          child: Form(
            key: formKey,
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Change Email', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),
              if (!codeSent) ...[
                TextFormField(
                  controller: emailCtrl,
                  decoration: const InputDecoration(labelText: 'New Email Address', border: OutlineInputBorder()),
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Enter an email';
                    if (!v.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: _SaveButton(
                    label: loading ? 'Sending…' : 'Send Verification Code',
                    onPressed: loading ? null : () async {
                      if (!formKey.currentState!.validate()) return;
                      setSheetState(() => loading = true);
                      try {
                        await ref.read(profileServiceProvider).requestEmailChange(newEmail: emailCtrl.text.trim());
                        setSheetState(() { codeSent = true; loading = false; });
                      } catch (e) {
                        setSheetState(() => loading = false);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.error),
                          );
                        }
                      }
                    },
                  ),
                ),
              ] else ...[
                Text('We sent a 6-digit code to ${emailCtrl.text}.',
                    style: const TextStyle(fontSize: 13, color: AppColors.neutral600)),
                const SizedBox(height: 16),
                TextFormField(
                  controller: codeCtrl,
                  decoration: const InputDecoration(labelText: 'Verification Code', border: OutlineInputBorder()),
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  validator: (v) => (v == null || v.length != 6) ? 'Enter the 6-digit code' : null,
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: _SaveButton(onPressed: () async {
                    if (!formKey.currentState!.validate()) return;
                    try {
                      await ref.read(profileServiceProvider).verifyEmailChange(code: codeCtrl.text.trim());
                      if (ctx.mounted) Navigator.of(ctx).pop();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Email updated')),
                        );
                      }
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(content: Text('Invalid or expired code. Please try again.'), backgroundColor: AppColors.error),
                        );
                      }
                    }
                  }),
                ),
              ],
              const SizedBox(height: 24),
            ]),
          ),
        ),
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    await ref.read(authStateNotifierProvider.notifier).logout();
    // GoRouter's redirect guard handles navigation to login once auth state is cleared
  }

  static String _localeLabel(Locale? locale) {
    if (locale == null) return 'Auto';
    for (final lang in AppConstants.languages) {
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
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? labelColor;

  const _SettingsTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor,
    this.labelColor,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(icon, color: iconColor ?? cs.onSurfaceVariant, size: 22),
      title: Text(label, style: TextStyle(fontSize: 15, color: labelColor ?? cs.onSurface, fontWeight: FontWeight.w500)),
      trailing: Icon(Icons.chevron_right_rounded, color: cs.outlineVariant),
      onTap: onTap,
    );
  }
}

class _SaveButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String label;
  const _SaveButton({required this.onPressed, this.label = 'Save'});

  @override
  Widget build(BuildContext context) => ElevatedButton(
    onPressed: onPressed,
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.white,
      disabledBackgroundColor: AppColors.neutral200,
      padding: const EdgeInsets.symmetric(vertical: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
  );
}
