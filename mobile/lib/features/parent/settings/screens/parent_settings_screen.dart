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
import '../../../../l10n/app_localizations.dart';

class _TierFactor {
  final String tier;
  final double multiplier;
  final Color color;

  const _TierFactor({
    required this.tier,
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
    _TierFactor(tier: 'best', multiplier: 2.0, color: AppColors.tierBest),
    _TierFactor(tier: 'second', multiplier: 1.5, color: AppColors.tierSecond),
    _TierFactor(tier: 'third', multiplier: 1.0, color: AppColors.tierThird),
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
              ? _TierFactor(tier: f.tier, multiplier: loaded, color: f.color)
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
    final l10n = AppLocalizations.of(context)!;
    final svc = ref.read(biometricServiceProvider);
    if (value) {
      final authed = await svc.authenticate(reason: l10n.settingsBiometricLogin);
      if (!authed) return;
    }
    await svc.setEnabled(value);
    if (mounted) setState(() => _biometricEnabled = value);
  }

  String _tierLabel(AppLocalizations l10n, String tier) {
    switch (tier) {
      case 'best': return l10n.settingsTierBestLabel;
      case 'second': return l10n.settingsTierSecondLabel;
      case 'third': return l10n.settingsTierThirdLabel;
      default: return tier;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final l10n = AppLocalizations.of(context)!;
    final currentThemeMode = ref.watch(themeModeProvider).valueOrNull ?? ThemeMode.system;
    final currentLocale = ref.watch(localeProvider).valueOrNull;

    return Scaffold(
      backgroundColor: cs.surfaceContainerLowest,
      appBar: AppBar(
        backgroundColor: cs.surface,
        elevation: 0,
        title: Text(l10n.settingsTitle, style: TextStyle(color: cs.onSurface, fontWeight: FontWeight.w700, fontSize: 20)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionHeader(title: l10n.settingsSectionPreferences),
          const SizedBox(height: 8),
          _buildPreferencesCard(context, currentThemeMode, currentLocale),
          const SizedBox(height: 20),
          _SectionHeader(title: l10n.settingsSectionAccount),
          const SizedBox(height: 8),
          _buildAccountCard(context),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildPreferencesCard(BuildContext context, ThemeMode currentThemeMode, Locale? currentLocale) {
    final cs = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    final localeLabel = _localeLabel(l10n, currentLocale);

    return _Card(children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(l10n.settingsAppearanceLabel, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
          const SizedBox(height: 10),
          SegmentedButton<ThemeMode>(
            segments: [
              ButtonSegment(value: ThemeMode.system, label: Text(l10n.settingsThemeSystem), icon: const Icon(Icons.brightness_auto_rounded, size: 16)),
              ButtonSegment(value: ThemeMode.light, label: Text(l10n.settingsThemeLight), icon: const Icon(Icons.light_mode_rounded, size: 16)),
              ButtonSegment(value: ThemeMode.dark, label: Text(l10n.settingsThemeDark), icon: const Icon(Icons.dark_mode_rounded, size: 16)),
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
        title: Text(l10n.settingsLanguageLabel, style: TextStyle(fontSize: 15, color: cs.onSurface, fontWeight: FontWeight.w500)),
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
        title: Text(l10n.settingsGradingConfig, style: TextStyle(fontSize: 15, color: cs.onSurface, fontWeight: FontWeight.w500)),
        subtitle: Text(l10n.settingsGradingConfigSubtitle,
            style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
        trailing: Icon(Icons.chevron_right_rounded, color: cs.outlineVariant),
        onTap: () => _showGradingConfigSheet(context),
      ),
    ]);
  }

  Widget _buildAccountCard(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    return _Card(children: [
      _SettingsTile(icon: Icons.person_outline_rounded, label: l10n.settingsEditProfile, onTap: () => _showEditProfileSheet(context)),
      Divider(height: 1, indent: 56, color: cs.outlineVariant),
      _SettingsTile(icon: Icons.lock_outline_rounded, label: l10n.settingsChangePassword, onTap: () => _showChangePasswordSheet(context)),
      Divider(height: 1, indent: 56, color: cs.outlineVariant),
      _SettingsTile(icon: Icons.email_outlined, label: l10n.settingsChangeEmail, onTap: () => _showChangeEmailSheet(context)),
      if (_biometricAvailable) ...[
        Divider(height: 1, indent: 56, color: cs.outlineVariant),
        ListTile(
          leading: Icon(Icons.fingerprint_rounded, color: Theme.of(context).colorScheme.onSurfaceVariant, size: 22),
          title: Text(l10n.settingsBiometricLogin, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
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
        icon: Icons.logout_rounded, label: l10n.settingsLogOut,
        iconColor: AppColors.error, labelColor: AppColors.error,
        onTap: () => _logout(context),
      ),
      Divider(height: 1, indent: 56, color: cs.outlineVariant),
      _SettingsTile(
        icon: Icons.delete_outline_rounded, label: l10n.settingsDeleteAccount,
        iconColor: AppColors.error, labelColor: AppColors.error,
        onTap: () => _confirmDeleteAccount(context),
      ),
    ]);
  }

  // ── Sheets & Dialogs ─────────────────────────────────────────────────────

  void _showGradingConfigSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
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
                  child: Text(l10n.settingsGradingConfig, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: cs.onSurface))),
              Expanded(
                child: ListView(
                  controller: scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                  children: [
                    // ── Grade Tier Multipliers ──────────────────────────
                    Padding(padding: const EdgeInsets.only(left: 4, bottom: 6, top: 4),
                        child: Text(l10n.settingsGradeTierMultipliers, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant, letterSpacing: 0.3))),
                    _Card(children: List.generate(_tierFactors.length, (i) {
                      final factor = _tierFactors[i];
                      final label = _tierLabel(l10n, factor.tier);
                      return Column(children: [
                        ListTile(
                          leading: Container(width: 10, height: 10,
                              decoration: BoxDecoration(color: factor.color, shape: BoxShape.circle)),
                          title: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: cs.onSurface)),
                          trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                            Text('${factor.multiplier}x', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary)),
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () => _showMultiplierSheet(i, factor, l10n, onSaved: () => setSheetState(() {})),
                              borderRadius: BorderRadius.circular(8),
                              child: Padding(padding: const EdgeInsets.all(4),
                                  child: Icon(Icons.edit_outlined, size: 18, color: cs.onSurfaceVariant)),
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
                        child: Text(l10n.settingsOngoingNotesCycle, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant, letterSpacing: 0.3))),
                    childrenAsync.when(
                      loading: () => _Card(children: [
                        const Padding(padding: EdgeInsets.all(24),
                            child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))),
                      ]),
                      error: (_, __) => _Card(children: [
                        Padding(padding: const EdgeInsets.all(16),
                            child: Text(l10n.settingsFailedToLoadChildren, style: TextStyle(color: cs.onSurfaceVariant))),
                      ]),
                      data: (children) {
                        if (children.isEmpty) {
                          return _Card(children: [
                            Padding(padding: const EdgeInsets.all(16),
                                child: Text(l10n.settingsNoChildrenConnected, style: TextStyle(color: cs.onSurfaceVariant))),
                          ]);
                        }
                        return _Card(children: List.generate(children.length, (i) {
                          final child = children[i];
                          final override = _cycleOverrides[child.childId];
                          final cycleType = override?.cycleType ?? l10n.cycleTypeWeekly;
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
                              subtitle: Text('${config.cycleType} · ${(config.ratio * 100).round()}% ${l10n.ratioLabel}',
                                  style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                              trailing: InkWell(
                                onTap: () => _showCycleConfigSheet(config, l10n, onSaved: () => setSheetState(() {})),
                                borderRadius: BorderRadius.circular(8),
                                child: Padding(padding: const EdgeInsets.all(4),
                                    child: Icon(Icons.tune_rounded, size: 20, color: cs.onSurfaceVariant)),
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
    final l10n = AppLocalizations.of(context)!;
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
                    child: Text(l10n.settingsLanguageLabel, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: cs.onSurface))),
                ListTile(
                  leading: const Text('🌐', style: TextStyle(fontSize: 22)),
                  title: Text(l10n.settingsLanguageAutoSystem, style: TextStyle(color: cs.onSurface)),
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
    final l10n = AppLocalizations.of(context)!;
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.settingsDeleteAccountDialogTitle),
        content: Text(l10n.settingsDeleteAccountDialogContent),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: Text(l10n.settingsCancel)),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              try {
                await ref.read(authStateNotifierProvider.notifier).deleteAccount();
                if (context.mounted) context.go('/onboarding');
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(l10n.settingsDeleteAccountFailed(e.toString())), backgroundColor: AppColors.error),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: Text(l10n.settingsDeleteAccountConfirm),
          ),
        ],
      ),
    );
  }

  void _showMultiplierSheet(int index, _TierFactor factor, AppLocalizations l10n, {VoidCallback? onSaved}) {
    double currentValue = factor.multiplier.clamp(0.5, 3.0);
    final label = _tierLabel(l10n, factor.tier);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(l10n.settingsEditMultiplier(label),
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Theme.of(ctx).colorScheme.onSurface)),
            const SizedBox(height: 20),
            Center(child: Text('${currentValue.toStringAsFixed(1)}x',
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: AppColors.primary))),
            Slider(value: currentValue, min: 0.5, max: 3.0, divisions: 25, activeColor: AppColors.primary,
                onChanged: (v) => setSheetState(() => currentValue = v)),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('0.5x', style: TextStyle(fontSize: 12, color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
              Text('3.0x', style: TextStyle(fontSize: 12, color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
            ]),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final newMultiplier = double.parse(currentValue.toStringAsFixed(1));
                  final updated = List<_TierFactor>.from(_tierFactors);
                  updated[index] = _TierFactor(tier: factor.tier, multiplier: newMultiplier, color: factor.color);
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
                child: Text(l10n.settingsSave, style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(height: 16),
          ]),
        ),
      ),
    );
  }

  void _showCycleConfigSheet(_ChildCycleConfig config, AppLocalizations l10n, {VoidCallback? onSaved}) {
    String currentCycleType = config.cycleType;
    double currentRatio = config.ratio;
    const cycleTypes = ['Daily', 'Weekly', 'Monthly'];
    final cycleTypeLabels = {
      'Daily': l10n.cycleTypeDaily,
      'Weekly': l10n.cycleTypeWeekly,
      'Monthly': l10n.cycleTypeMonthly,
    };

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(l10n.settingsConfigFor(config.childName),
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Theme.of(ctx).colorScheme.onSurface)),
            const SizedBox(height: 20),
            Text(l10n.settingsCycleType, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
            const SizedBox(height: 10),
            Row(children: cycleTypes.map((type) {
              final selected = type == currentCycleType;
              return Expanded(child: GestureDetector(
                onTap: () => setSheetState(() => currentCycleType = type),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : Theme.of(ctx).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(cycleTypeLabels[type] ?? type, style: TextStyle(
                    color: selected ? Colors.white : Theme.of(ctx).colorScheme.onSurface,
                    fontWeight: FontWeight.w600, fontSize: 13,
                  )),
                ),
              ));
            }).toList()),
            const SizedBox(height: 20),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(l10n.settingsBonusRatio, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
              Text('${(currentRatio * 100).round()}%',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary)),
            ]),
            Slider(value: currentRatio, min: 0.05, max: 1.0, divisions: 19, activeColor: AppColors.primary,
                onChanged: (v) => setSheetState(() => currentRatio = v)),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('5%', style: TextStyle(fontSize: 12, color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
              Text('100%', style: TextStyle(fontSize: 12, color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
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
                child: Text(l10n.settingsSave, style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(height: 24),
          ]),
        ),
      ),
    );
  }

  void _showEditProfileSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
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
            Text(l10n.settingsEditProfileTitle, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 20),
            TextFormField(
              controller: nameCtrl,
              decoration: InputDecoration(labelText: l10n.settingsFullName, border: const OutlineInputBorder()),
              textCapitalization: TextCapitalization.words,
              validator: (v) => (v == null || v.trim().isEmpty) ? l10n.settingsNameCannotBeEmpty : null,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: _SaveButton(label: l10n.settingsSave, onPressed: () async {
                if (!formKey.currentState!.validate()) return;
                Navigator.of(ctx).pop();
                try {
                  await ref.read(profileServiceProvider).updateProfile(fullName: nameCtrl.text.trim());
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(l10n.settingsProfileUpdated)),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(AppLocalizations.of(context)!.genericFailedError(e.toString())), backgroundColor: AppColors.error),
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
    final l10n = AppLocalizations.of(context)!;
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
              Text(l10n.settingsChangePasswordTitle, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),
              TextFormField(
                controller: pwCtrl,
                obscureText: obscure,
                decoration: InputDecoration(
                  labelText: l10n.settingsNewPassword,
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    onPressed: () => setSheetState(() => obscure = !obscure),
                  ),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return l10n.settingsEnterPassword;
                  if (v.length < 12) return l10n.settingsMin12Chars;
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: confirmCtrl,
                obscureText: obscure,
                decoration: InputDecoration(labelText: l10n.settingsConfirmPassword, border: const OutlineInputBorder()),
                validator: (v) => v != pwCtrl.text ? l10n.settingsPasswordsDoNotMatch : null,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: _SaveButton(label: l10n.settingsSave, onPressed: () async {
                  if (!formKey.currentState!.validate()) return;
                  Navigator.of(ctx).pop();
                  try {
                    await ref.read(profileServiceProvider).changePassword(newPassword: pwCtrl.text);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(l10n.settingsPasswordChanged)),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(AppLocalizations.of(context)!.genericFailedError(e.toString())), backgroundColor: AppColors.error),
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
    final l10n = AppLocalizations.of(context)!;
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
              Text(l10n.settingsChangeEmailTitle, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),
              if (!codeSent) ...[
                TextFormField(
                  controller: emailCtrl,
                  decoration: InputDecoration(labelText: l10n.settingsNewEmailAddress, border: const OutlineInputBorder()),
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return l10n.settingsEnterEmail;
                    if (!v.contains('@')) return l10n.settingsEnterValidEmail;
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: _SaveButton(
                    label: loading ? l10n.settingsSending : l10n.settingsSendVerificationCode,
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
                            SnackBar(content: Text(AppLocalizations.of(context)!.genericFailedError(e.toString())), backgroundColor: AppColors.error),
                          );
                        }
                      }
                    },
                  ),
                ),
              ] else ...[
                Text(l10n.settingsCodeSentTo(emailCtrl.text),
                    style: TextStyle(fontSize: 13, color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
                const SizedBox(height: 16),
                TextFormField(
                  controller: codeCtrl,
                  decoration: InputDecoration(labelText: l10n.settingsVerificationCode, border: const OutlineInputBorder()),
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  validator: (v) => (v == null || v.length != 6) ? l10n.settingsEnter6DigitCode : null,
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: _SaveButton(label: l10n.settingsSave, onPressed: () async {
                    if (!formKey.currentState!.validate()) return;
                    try {
                      await ref.read(profileServiceProvider).verifyEmailChange(code: codeCtrl.text.trim());
                      if (ctx.mounted) Navigator.of(ctx).pop();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(l10n.settingsEmailUpdated)),
                        );
                      }
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          SnackBar(content: Text(l10n.settingsInvalidCode), backgroundColor: AppColors.error),
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

  static String _localeLabel(AppLocalizations l10n, Locale? locale) {
    if (locale == null) return l10n.settingsLanguageAuto;
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
  const _SaveButton({required this.onPressed, required this.label});

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
