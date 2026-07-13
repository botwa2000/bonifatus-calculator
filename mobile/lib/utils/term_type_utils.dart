import '../l10n/app_localizations.dart';

String localizeTermType(AppLocalizations l10n, String termType) {
  switch (termType) {
    case 'semester_1':
      return l10n.termTypeSemester1;
    case 'semester_2':
      return l10n.termTypeSemester2;
    case 'trimester_1':
      return l10n.termTypeTrimester1;
    case 'trimester_2':
      return l10n.termTypeTrimester2;
    case 'trimester_3':
      return l10n.termTypeTrimester3;
    case 'annual':
      return l10n.termTypeAnnual;
    default:
      return termType.replaceAll('_', ' ');
  }
}

String localizeTermLabel(
    AppLocalizations l10n, String termType, String schoolYear, String? termName) {
  if (termName != null && termName.isNotEmpty) return termName;
  return '$schoolYear · ${localizeTermType(l10n, termType)}';
}
