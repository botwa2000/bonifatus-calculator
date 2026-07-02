import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';

class StudentSettingsScreen extends ConsumerWidget {
  const StudentSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: const Text(
          "Settings",
          style: TextStyle(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionHeader(title: "Account"),
          const SizedBox(height: 8),
          _buildAccountCard(context),
          const SizedBox(height: 20),
          _SectionHeader(title: "Connected Parents"),
          const SizedBox(height: 8),
          _buildConnectedParentsCard(context),
          const SizedBox(height: 20),
          _SectionHeader(title: "App"),
          const SizedBox(height: 8),
          _buildAppCard(context),
          const SizedBox(height: 20),
          _buildLogoutButton(context, ref),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildAccountCard(BuildContext context) {
    return _Card(
      children: [
        _SettingsTile(
          icon: Icons.person_outline_rounded,
          label: "Edit Profile",
          onTap: () {},
        ),
        const Divider(height: 1, indent: 56, color: AppColors.neutral100),
        _SettingsTile(
          icon: Icons.lock_outline_rounded,
          label: "Change Password",
          onTap: () => context.push("/auth/forgot-password"),
        ),
        const Divider(height: 1, indent: 56, color: AppColors.neutral100),
        _SettingsTile(
          icon: Icons.language_rounded,
          label: "Language",
          trailing: const Text(
            "English",
            style: TextStyle(fontSize: 13, color: AppColors.neutral400),
          ),
          onTap: () => _showLanguageDialog(context),
        ),
      ],
    );
  }

  Widget _buildConnectedParentsCard(BuildContext context) {
    return _Card(
      children: [
        _SettingsTile(
          icon: Icons.people_outline_rounded,
          label: "No parents connected",
          trailing: TextButton.icon(
            onPressed: () => _showQrScannerSheet(context),
            icon: const Icon(Icons.qr_code_scanner_rounded, size: 16, color: AppColors.primary),
            label: const Text("Scan QR", style: TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600)),
          ),
          onTap: () => _showQrScannerSheet(context),
        ),
      ],
    );
  }

  Widget _buildAppCard(BuildContext context) {
    return _Card(
      children: [
        _SettingsTile(
          icon: Icons.dark_mode_outlined,
          label: "Theme",
          trailing: const Text(
            "System",
            style: TextStyle(fontSize: 13, color: AppColors.neutral400),
          ),
          onTap: () {},
        ),
        const Divider(height: 1, indent: 56, color: AppColors.neutral100),
        _SettingsTile(
          icon: Icons.info_outline_rounded,
          label: "About",
          onTap: () => _showAboutDialog(context),
        ),
      ],
    );
  }

  Widget _buildLogoutButton(BuildContext context, WidgetRef ref) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => _logout(context, ref),
        icon: const Icon(Icons.logout_rounded, color: AppColors.error),
        label: const Text(
          "Log Out",
          style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600),
        ),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.error),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text("Language", style: TextStyle(fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ["English", "Deutsch", "Francais"].map((lang) {
            final selected = lang == "English";
            return ListTile(
              title: Text(lang),
              trailing: selected ? const Icon(Icons.check_rounded, color: AppColors.primary) : null,
              onTap: () => Navigator.of(ctx).pop(),
            );
          }).toList(),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text("Cancel")),
        ],
      ),
    );
  }

  void _showQrScannerSheet(BuildContext context) {
    final controller = MobileScannerController();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SizedBox(
        height: MediaQuery.of(ctx).size.height * 0.65,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Scan Parent QR Code", style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () { controller.dispose(); Navigator.of(ctx).pop(); },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Text("Point the camera at the QR code shown on the parent device",
                style: TextStyle(fontSize: 13, color: AppColors.neutral600), textAlign: TextAlign.center),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: MobileScanner(
                  controller: controller,
                  onDetect: (capture) {
                    if (capture.barcodes.isNotEmpty) { controller.dispose(); Navigator.of(ctx).pop(); }
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showAboutDialog(context: context, applicationName: "Bonifatus", applicationVersion: "1.0.0",
      applicationLegalese: "Grade rewards tracker for students");
  }

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    await ref.read(authStateNotifierProvider.notifier).logout();
    if (context.mounted) context.go("/onboarding");
  }
}

class _Card extends StatelessWidget {
  final List<Widget> children;
  const _Card({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,  // fix: prevents unbounded height in ListView
        children: children,
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 4),
      child: Text(title,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.neutral600, letterSpacing: 0.3)),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Widget? trailing;
  const _SettingsTile({required this.icon, required this.label, required this.onTap, this.trailing});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.neutral600, size: 22),
      title: Text(label, style: const TextStyle(fontSize: 15, color: AppColors.neutral900, fontWeight: FontWeight.w500)),
      trailing: trailing ?? const Icon(Icons.chevron_right_rounded, color: AppColors.neutral400),
      onTap: onTap,
    );
  }
}
