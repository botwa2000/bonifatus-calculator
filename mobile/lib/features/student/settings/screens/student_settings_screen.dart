import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/theme_mode_provider.dart';
import '../../../../core/providers/locale_provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../../api/services/connection_service.dart';
import '../../../../api/services/biometric_service.dart';
import '../../../../api/services/profile_service.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../l10n/app_localizations.dart';

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

  // School profile state
  String? _schoolName;
  String? _schoolTown;
  int _semesterCount = 2;
  int _programLength = 13;

  @override
  void initState() {
    super.initState();
    _loadConnections();
    _checkBiometric();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await ref.read(profileServiceProvider).fetchProfile();
      if (!mounted) return;
      setState(() {
        _schoolName = profile['schoolName'] as String?;
        _schoolTown = profile['schoolTown'] as String?;
        _semesterCount = (profile['semesterCount'] as int?) ?? 2;
        _programLength = (profile['programLength'] as int?) ?? 13;
      });
    } catch (_) {}
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
      final authed = await svc.authenticate(reason: AppLocalizations.of(context)!.settingsBiometricLogin);
      if (!authed) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLocalizations.of(context)!.settingsBiometricVerifyFailed)),
          );
        }
        return;
      }
    }
    await svc.setEnabled(value);
    if (mounted) setState(() => _biometricEnabled = value);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
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
          const SizedBox(height: 20),
          _SectionHeader(title: l10n.settingsSectionSchool),
          const SizedBox(height: 8),
          _buildSchoolCard(context),
          const SizedBox(height: 20),
          _SectionHeader(title: l10n.settingsSectionConnectedParents),
          const SizedBox(height: 8),
          _buildConnectedParentsCard(context),
          const SizedBox(height: 20),
          _SectionHeader(title: l10n.settingsSectionApp),
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
                WidgetsBinding.instance.addPostFrameCallback((_) =>
                    ref.read(themeModeProvider.notifier).setThemeMode(s.first)),
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
    ]);
  }

  Widget _buildAccountCard(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    return _Card(children: [
      _SettingsTile(
        icon: Icons.person_outline_rounded,
        label: l10n.settingsEditProfile,
        onTap: () => _showEditProfileSheet(context),
      ),
      Divider(height: 1, indent: 56, color: cs.outlineVariant),
      _SettingsTile(
        icon: Icons.lock_outline_rounded,
        label: l10n.settingsChangePassword,
        onTap: () => _showChangePasswordSheet(context),
      ),
      Divider(height: 1, indent: 56, color: cs.outlineVariant),
      _SettingsTile(
        icon: Icons.email_outlined,
        label: l10n.settingsChangeEmail,
        onTap: () => _showChangeEmailSheet(context),
      ),
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
        icon: Icons.delete_outline_rounded,
        label: l10n.settingsDeleteAccount,
        color: AppColors.error,
        onTap: () => _confirmDeleteAccount(context),
      ),
    ]);
  }

  Widget _buildSchoolCard(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;
    final subtitle = [
      if (_schoolTown != null && _schoolTown!.isNotEmpty) _schoolTown,
      if (_schoolName != null && _schoolName!.isNotEmpty) _schoolName,
    ].join(' · ');
    return _Card(children: [
      ListTile(
        leading: Icon(Icons.school_outlined, color: cs.onSurfaceVariant, size: 22),
        title: Text(l10n.settingsSchoolInfo, style: TextStyle(fontSize: 15, color: cs.onSurface, fontWeight: FontWeight.w500)),
        subtitle: subtitle.isNotEmpty
            ? Text(subtitle, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant))
            : null,
        trailing: Icon(Icons.chevron_right_rounded, color: cs.outlineVariant),
        onTap: () => _showSchoolInfoSheet(context),
      ),
    ]);
  }

  void _showSchoolInfoSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final townCtrl = TextEditingController(text: _schoolTown ?? '');
    final nameCtrl = TextEditingController(text: _schoolName ?? '');
    int semesterCount = _semesterCount;
    int programLength = _programLength;
    bool saving = false;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final cs = Theme.of(ctx).colorScheme;
          return Padding(
            padding: EdgeInsets.only(
              left: 20, right: 20, top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Center(child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)))),
                Text(l10n.settingsSchoolInfo, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: cs.onSurface)),
                const SizedBox(height: 4),
                Text(l10n.settingsSchoolInfoDesc, style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                const SizedBox(height: 20),
                TextField(
                  controller: townCtrl,
                  decoration: InputDecoration(
                    labelText: l10n.profileSchoolTown,
                    hintText: l10n.profileSchoolTownPlaceholder,
                    border: const OutlineInputBorder(),
                  ),
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  decoration: InputDecoration(
                    labelText: l10n.profileSchoolName,
                    hintText: l10n.profileSchoolNamePlaceholder,
                    border: const OutlineInputBorder(),
                  ),
                  textInputAction: TextInputAction.done,
                ),
                const SizedBox(height: 16),
                Text(l10n.profileSemesterSystem, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
                const SizedBox(height: 8),
                SegmentedButton<int>(
                  segments: [
                    ButtonSegment(value: 2, label: Text('2×', style: const TextStyle(fontSize: 12))),
                    ButtonSegment(value: 3, label: Text('3×', style: const TextStyle(fontSize: 12))),
                    ButtonSegment(value: 4, label: Text('4×', style: const TextStyle(fontSize: 12))),
                  ],
                  selected: {semesterCount},
                  onSelectionChanged: (s) => setSheetState(() => semesterCount = s.first),
                  style: const ButtonStyle(visualDensity: VisualDensity.compact),
                ),
                const SizedBox(height: 16),
                Text(l10n.profileProgramLength, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
                const SizedBox(height: 8),
                InputDecorator(
                  decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 4)),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: programLength,
                      isExpanded: true,
                      items: List.generate(20, (i) => i + 1).map((y) => DropdownMenuItem(
                        value: y,
                        child: Text('$y ${l10n.profileProgramLengthYears}${y == 13 ? '  (${l10n.profileProgramLengthDefault})' : ''}'),
                      )).toList(),
                      onChanged: (v) { if (v != null) setSheetState(() => programLength = v); },
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(l10n.profileProgramLengthHint, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: saving ? null : () async {
                      setSheetState(() => saving = true);
                      try {
                        await ref.read(profileServiceProvider).updateProfile(
                          schoolName: nameCtrl.text.trim().isEmpty ? null : nameCtrl.text.trim(),
                          schoolTown: townCtrl.text.trim().isEmpty ? null : townCtrl.text.trim(),
                          semesterCount: semesterCount,
                          programLength: programLength,
                        );
                        if (mounted) {
                          setState(() {
                            _schoolName = nameCtrl.text.trim().isEmpty ? null : nameCtrl.text.trim();
                            _schoolTown = townCtrl.text.trim().isEmpty ? null : townCtrl.text.trim();
                            _semesterCount = semesterCount;
                            _programLength = programLength;
                          });
                        }
                        if (ctx.mounted) {
                          Navigator.of(ctx).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(l10n.profileSaved), backgroundColor: AppColors.tierBest),
                          );
                        }
                      } catch (e) {
                        setSheetState(() => saving = false);
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
                          );
                        }
                      }
                    },
                    child: saving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(l10n.settingsSave),
                  ),
                ),
              ]),
            ),
          );
        },
      ),
    );
  }

  Widget _buildConnectedParentsCard(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
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
          label: l10n.settingsNoParentsConnected,
          trailing: _scanQrButton(context),
          onTap: () => _showQrScannerSheet(context),
        )
      else ...[
        ..._parentConnections.asMap().entries.map((entry) {
          final cs = Theme.of(context).colorScheme;
          final conn = entry.value;
          final parentMap = conn['parent'] as Map<String, dynamic>?;
          final parentName = parentMap?['fullName'] as String? ?? l10n.parentFallback;
          return Column(children: [
            _SettingsTile(
              icon: Icons.person_outline_rounded,
              label: parentName,
              trailing: const Icon(Icons.check_circle_rounded, color: AppColors.tierBest, size: 20),
              onTap: () => _showParentConnectionSheet(context, conn),
            ),
            if (entry.key < _parentConnections.length - 1)
              Divider(height: 1, indent: 56, color: cs.outlineVariant),
          ]);
        }),
        Divider(height: 1, indent: 56, color: Theme.of(context).colorScheme.outlineVariant),
        _SettingsTile(
          icon: Icons.qr_code_scanner_rounded,
          label: l10n.settingsAddAnotherParent,
          onTap: () => _showQrScannerSheet(context),
        ),
      ],
    ]);
  }

  Widget _scanQrButton(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return TextButton.icon(
      onPressed: () => _showQrScannerSheet(context),
      icon: const Icon(Icons.qr_code_scanner_rounded, size: 16, color: AppColors.primary),
      label: Text(l10n.settingsScanQr, style: const TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildAppCard(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return _Card(children: [
      _SettingsTile(
        icon: Icons.info_outline_rounded,
        label: l10n.settingsAbout,
        onTap: () => _showAboutSheet(context),
      ),
    ]);
  }

  Widget _buildLogoutButton(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => _logout(context),
        icon: const Icon(Icons.logout_rounded, color: AppColors.error),
        label: Text(l10n.settingsLogOut, style: const TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.error),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
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
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2))),
              Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                  child: Text(l10n.settingsLanguageLabel, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: cs.onSurface))),
              ListTile(
                leading: const Text('🌐', style: TextStyle(fontSize: 22)),
                title: Text(l10n.settingsLanguageAutoSystem, style: TextStyle(color: cs.onSurface)),
                trailing: current == null ? const Icon(Icons.check_rounded, color: AppColors.primary) : null,
                onTap: () {
                  Navigator.of(ctx).pop();
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    ref.read(localeProvider.notifier).setLocale(null);
                  });
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
                  Navigator.of(ctx).pop();
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    ref.read(localeProvider.notifier).setLocale(Locale(lang.code));
                  });
                },
              )),
              const SizedBox(height: 8),
            ]),
          ),
        );
      },
    );
  }

  void _showParentConnectionSheet(BuildContext context, Map<String, dynamic> conn) {
    final l10n = AppLocalizations.of(context)!;
    // MOB-018: safe cast — conn['parent'] may not always be a Map at runtime
    final rawParent = conn['parent'];
    final parentMap = rawParent is Map ? Map<String, dynamic>.from(rawParent) : null;
    final parentName = parentMap?['fullName'] as String? ?? l10n.parentFallback;
    // MOB-016: read email from the parent map, not a blank literal
    final parentEmail = parentMap?['email'] as String? ?? '';
    final connectedSince = conn['createdAt'] as String?;
    final relationshipId = conn['id'] as String?;
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(color: Theme.of(ctx).colorScheme.outlineVariant, borderRadius: BorderRadius.circular(2))),
          Row(children: [
            Container(width: 48, height: 48, decoration: const BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
              alignment: Alignment.center,
              child: Text(parentName.isNotEmpty ? parentName.substring(0, 1).toUpperCase() : '?',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primary))),
            const SizedBox(width: 14),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(parentName, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Theme.of(ctx).colorScheme.onSurface)),
              if (parentEmail.isNotEmpty)
                Text(parentEmail, style: TextStyle(fontSize: 13, color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
              if (connectedSince != null)
                Text(l10n.settingsConnectedSince(connectedSince.substring(0, 10)),
                    style: TextStyle(fontSize: 12, color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
            ]),
          ]),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.link_off_rounded, color: AppColors.error),
              label: Text(l10n.settingsRemoveConnection, style: const TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
              // MOB-003: confirm and call the API instead of just closing the sheet
              onPressed: relationshipId == null ? null : () {
                Navigator.of(ctx).pop();
                _confirmRemoveConnection(context, relationshipId, parentName);
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.error),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  void _confirmRemoveConnection(BuildContext context, String relationshipId, String parentName) {
    final l10n = AppLocalizations.of(context)!;
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.settingsRemoveConnectionTitle),
        content: Text(l10n.settingsRemoveConnectionContent),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: Text(l10n.settingsCancel)),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              try {
                await ref.read(connectionServiceProvider).removeConnection(relationshipId);
                _loadConnections();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(l10n.settingsRemoveConnectionSuccess), backgroundColor: AppColors.tierBest),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(l10n.settingsRemoveConnectionFailed), backgroundColor: AppColors.error),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: Text(l10n.settingsRemoveConnection),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteAccount(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final pwCtrl = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(l10n.settingsDeleteAccountDialogTitle),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(l10n.settingsDeleteAccountDialogContent),
            const SizedBox(height: 16),
            TextField(
              controller: pwCtrl,
              obscureText: true,
              decoration: InputDecoration(
                labelText: l10n.settingsCurrentPassword,
                border: const OutlineInputBorder(),
              ),
              onChanged: (_) => setDialogState(() {}),
            ),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(), child: Text(l10n.settingsCancel)),
            TextButton(
              onPressed: pwCtrl.text.isEmpty ? null : () async {
                final password = pwCtrl.text;
                Navigator.of(ctx).pop();
                try {
                  await ref.read(authStateNotifierProvider.notifier).deleteAccount(password: password);
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
      ),
    );
  }

  void _showQrScannerSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
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
              Text(l10n.settingsScanParentQrTitle, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Theme.of(ctx).colorScheme.onSurface)),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () { controller.dispose(); Navigator.of(ctx).pop(); },
              ),
            ]),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(l10n.settingsScanQrInstructions,
                style: TextStyle(fontSize: 13, color: Theme.of(ctx).colorScheme.onSurfaceVariant), textAlign: TextAlign.center),
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
                        SnackBar(content: Text(l10n.settingsParentConnected), backgroundColor: AppColors.tierBest),
                      );
                    }
                  } catch (e) {
                    redeemed = false;
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(AppLocalizations.of(context)!.genericFailedError(e.toString())), backgroundColor: AppColors.error),
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
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
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
            SizedBox(width: double.infinity, child: _SaveButton(label: l10n.settingsSave, onPressed: () async {
              if (!formKey.currentState!.validate()) return;
              Navigator.of(ctx).pop();
              try {
                await ref.read(profileServiceProvider).updateProfile(fullName: nameCtrl.text.trim());
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.settingsProfileUpdated)));
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context)!.genericFailedError(e.toString())), backgroundColor: AppColors.error));
              }
            })),
            const SizedBox(height: 24),
          ]),
        ),
      ),
    );
  }

  void _showChangePasswordSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final currentPwCtrl = TextEditingController();
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
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
          child: Form(
            key: formKey,
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(l10n.settingsChangePasswordTitle, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),
              TextFormField(
                controller: currentPwCtrl,
                obscureText: obscure,
                decoration: InputDecoration(
                  labelText: l10n.settingsCurrentPassword,
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    onPressed: () => setSheetState(() => obscure = !obscure),
                  ),
                ),
                validator: (v) => (v == null || v.isEmpty) ? l10n.settingsEnterCurrentPassword : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: pwCtrl,
                obscureText: obscure,
                decoration: InputDecoration(
                  labelText: l10n.settingsNewPassword,
                  border: const OutlineInputBorder(),
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
              SizedBox(width: double.infinity, child: _SaveButton(label: l10n.settingsSave, onPressed: () async {
                if (!formKey.currentState!.validate()) return;
                Navigator.of(ctx).pop();
                try {
                  await ref.read(profileServiceProvider).changePassword(
                    currentPassword: currentPwCtrl.text,
                    newPassword: pwCtrl.text,
                  );
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.settingsPasswordChanged)));
                } catch (e) {
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context)!.genericFailedError(e.toString())), backgroundColor: AppColors.error));
                }
              })),
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
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
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
                SizedBox(width: double.infinity, child: _SaveButton(
                  label: loading ? l10n.settingsSending : l10n.settingsSendVerificationCode,
                  onPressed: loading ? null : () async {
                    if (!formKey.currentState!.validate()) return;
                    setSheetState(() => loading = true);
                    try {
                      await ref.read(profileServiceProvider).requestEmailChange(newEmail: emailCtrl.text.trim());
                      setSheetState(() { codeSent = true; loading = false; });
                    } catch (e) {
                      setSheetState(() => loading = false);
                      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context)!.genericFailedError(e.toString())), backgroundColor: AppColors.error));
                    }
                  },
                )),
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
                SizedBox(width: double.infinity, child: _SaveButton(label: l10n.settingsSave, onPressed: () async {
                  if (!formKey.currentState!.validate()) return;
                  try {
                    await ref.read(profileServiceProvider).verifyEmailChange(code: codeCtrl.text.trim());
                    if (ctx.mounted) Navigator.of(ctx).pop();
                    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.settingsEmailUpdated)));
                  } catch (e) {
                    if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(l10n.settingsInvalidCode), backgroundColor: AppColors.error));
                  }
                })),
              ],
              const SizedBox(height: 24),
            ]),
          ),
        ),
      ),
    );
  }

  void _showAboutSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        final cs = Theme.of(ctx).colorScheme;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Align(alignment: Alignment.center,
                child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)))),
              Row(children: [
                Container(width: 52, height: 52,
                  decoration: const BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: const Text('🎓', style: TextStyle(fontSize: 26))),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(l10n.settingsAboutAppName,
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface)),
                  FutureBuilder<PackageInfo>(
                    future: PackageInfo.fromPlatform(),
                    builder: (_, snap) => Text(
                      snap.hasData ? 'v${snap.data!.version}' : '',
                      style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                  ),
                ])),
              ]),
              const SizedBox(height: 16),
              Text(l10n.aboutDescription,
                  style: TextStyle(fontSize: 14, color: cs.onSurface, height: 1.5)),
              const SizedBox(height: 16),
              Divider(color: cs.outlineVariant),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(Icons.privacy_tip_outlined, color: cs.onSurfaceVariant, size: 20),
                title: Text(l10n.aboutPrivacyPolicy,
                    style: TextStyle(fontSize: 15, color: cs.onSurface)),
                trailing: Icon(Icons.open_in_new_rounded, color: cs.outlineVariant, size: 18),
                onTap: () => launchUrl(
                    Uri.parse('https://bonifatus.com/privacy'),
                    mode: LaunchMode.externalApplication),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(Icons.gavel_outlined, color: cs.onSurfaceVariant, size: 20),
                title: Text(l10n.aboutTermsOfService,
                    style: TextStyle(fontSize: 15, color: cs.onSurface)),
                trailing: Icon(Icons.open_in_new_rounded, color: cs.outlineVariant, size: 18),
                onTap: () => launchUrl(
                    Uri.parse('https://bonifatus.com/terms'),
                    mode: LaunchMode.externalApplication),
              ),
            ]),
          ),
        );
      },
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
