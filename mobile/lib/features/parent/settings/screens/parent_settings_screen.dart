import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';

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
  final String childName;
  final String cycleType;
  final double ratio;

  const _ChildCycleConfig({
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
    _TierFactor(tier: "best", label: "Best (Grade 1–2)", multiplier: 2.0, color: AppColors.tierBest),
    _TierFactor(tier: "second", label: "Second (Grade 3)", multiplier: 1.5, color: AppColors.tierSecond),
    _TierFactor(tier: "third", label: "Third (Grade 4)", multiplier: 1.0, color: AppColors.tierThird),
  ];

  List<_ChildCycleConfig> _cycleConfigs = const [
    _ChildCycleConfig(childName: "Lena M.", cycleType: "Weekly", ratio: 0.25),
    _ChildCycleConfig(childName: "Tom M.", cycleType: "Weekly", ratio: 0.20),
  ];

  @override
  Widget build(BuildContext context) {
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
          _SectionHeader(title: "Grade Bonus Factors"),
          const SizedBox(height: 8),
          _buildTierFactorsCard(),
          const SizedBox(height: 20),
          _SectionHeader(title: "Ongoing Notes Config"),
          const SizedBox(height: 8),
          _buildCycleConfigCard(),
          const SizedBox(height: 20),
          _SectionHeader(title: "Account"),
          const SizedBox(height: 8),
          _buildAccountCard(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildTierFactorsCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: List.generate(_tierFactors.length, (i) {
          final factor = _tierFactors[i];
          return Column(
            children: [
              ListTile(
                leading: Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: factor.color,
                    shape: BoxShape.circle,
                  ),
                ),
                title: Text(
                  factor.label,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.neutral900,
                  ),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "${factor.multiplier}x",
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    InkWell(
                      onTap: () => _showMultiplierSheet(i, factor),
                      borderRadius: BorderRadius.circular(8),
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        child: Icon(
                          Icons.edit_outlined,
                          size: 18,
                          color: AppColors.neutral400,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (i < _tierFactors.length - 1)
                const Divider(height: 1, indent: 16, endIndent: 16, color: AppColors.neutral100),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildCycleConfigCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: List.generate(_cycleConfigs.length, (i) {
          final config = _cycleConfigs[i];
          return Column(
            children: [
              ListTile(
                leading: Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    color: AppColors.primaryLight,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    config.childName.substring(0, 1),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                      fontSize: 14,
                    ),
                  ),
                ),
                title: Text(
                  config.childName,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.neutral900,
                  ),
                ),
                subtitle: Text(
                  "${config.cycleType} · ${(config.ratio * 100).round()}% ratio",
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.neutral600,
                  ),
                ),
                trailing: InkWell(
                  onTap: () => _showCycleConfigSheet(i, config),
                  borderRadius: BorderRadius.circular(8),
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(
                      Icons.tune_rounded,
                      size: 20,
                      color: AppColors.neutral400,
                    ),
                  ),
                ),
              ),
              if (i < _cycleConfigs.length - 1)
                const Divider(height: 1, indent: 16, endIndent: 16, color: AppColors.neutral100),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildAccountCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
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
            onTap: () {},
          ),
          const Divider(height: 1, indent: 56, color: AppColors.neutral100),
          _SettingsTile(
            icon: Icons.email_outlined,
            label: "Change Email",
            onTap: () {},
          ),
          const Divider(height: 1, indent: 56, color: AppColors.neutral100),
          _SettingsTile(
            icon: Icons.logout_rounded,
            label: "Log Out",
            iconColor: AppColors.error,
            labelColor: AppColors.error,
            onTap: () => _logout(context),
          ),
        ],
      ),
    );
  }

  void _showMultiplierSheet(int index, _TierFactor factor) {
    double currentValue = factor.multiplier;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Edit Multiplier: ${factor.label}",
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: AppColors.neutral900,
                ),
              ),
              const SizedBox(height: 20),
              Center(
                child: Text(
                  "${currentValue.toStringAsFixed(1)}x",
                  style: const TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ),
              Slider(
                value: currentValue,
                min: 0.5,
                max: 3.0,
                divisions: 25,
                activeColor: AppColors.primary,
                onChanged: (v) => setSheetState(() => currentValue = v),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text("0.5x", style: TextStyle(fontSize: 12, color: AppColors.neutral400)),
                  Text("3.0x", style: TextStyle(fontSize: 12, color: AppColors.neutral400)),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      final updated = List<_TierFactor>.from(_tierFactors);
                      updated[index] = _TierFactor(
                        tier: factor.tier,
                        label: factor.label,
                        multiplier: double.parse(currentValue.toStringAsFixed(1)),
                        color: factor.color,
                      );
                      _tierFactors = updated;
                    });
                    Navigator.of(ctx).pop();
                  },
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
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showCycleConfigSheet(int index, _ChildCycleConfig config) {
    String currentCycleType = config.cycleType;
    double currentRatio = config.ratio;
    const cycleTypes = ["Daily", "Weekly", "Monthly"];

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
            left: 24,
            right: 24,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Config for ${config.childName}",
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: AppColors.neutral900,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "Cycle Type",
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.neutral600,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: cycleTypes.map((type) {
                  final selected = type == currentCycleType;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setSheetState(() => currentCycleType = type),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.primary : AppColors.neutral100,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          type,
                          style: TextStyle(
                            color: selected ? AppColors.white : AppColors.neutral700,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "Bonus Ratio",
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.neutral600,
                    ),
                  ),
                  Text(
                    "${(currentRatio * 100).round()}%",
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
              Slider(
                value: currentRatio,
                min: 0.05,
                max: 1.0,
                divisions: 19,
                activeColor: AppColors.primary,
                onChanged: (v) => setSheetState(() => currentRatio = v),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text("5%", style: TextStyle(fontSize: 12, color: AppColors.neutral400)),
                  Text("100%", style: TextStyle(fontSize: 12, color: AppColors.neutral400)),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      final updated = List<_ChildCycleConfig>.from(_cycleConfigs);
                      updated[index] = _ChildCycleConfig(
                        childName: config.childName,
                        cycleType: currentCycleType,
                        ratio: currentRatio,
                      );
                      _cycleConfigs = updated;
                    });
                    Navigator.of(ctx).pop();
                  },
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
        ),
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    await ref.read(authStateNotifierProvider.notifier).logout();
    if (context.mounted) {
      context.go("/onboarding");
    }
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 4),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: AppColors.neutral600,
          letterSpacing: 0.3,
        ),
      ),
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
    return ListTile(
      leading: Icon(icon, color: iconColor ?? AppColors.neutral600, size: 22),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 15,
          color: labelColor ?? AppColors.neutral900,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: const Icon(
        Icons.chevron_right_rounded,
        color: AppColors.neutral400,
      ),
      onTap: onTap,
    );
  }
}
