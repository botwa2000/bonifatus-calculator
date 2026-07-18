// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Russian (`ru`).
class AppLocalizationsRu extends AppLocalizations {
  AppLocalizationsRu([String locale = 'ru']) : super(locale);

  @override
  String get appName => 'Bonifatus';

  @override
  String get loginWelcomeBack => 'С возвращением';

  @override
  String get loginSignInSubtitle => 'Войдите в свой аккаунт';

  @override
  String get loginEmailLabel => 'Электронная почта';

  @override
  String get loginEmailValidator => 'Введите корректный адрес почты';

  @override
  String get loginPasswordLabel => 'Пароль';

  @override
  String get loginPasswordValidator => 'Введите пароль';

  @override
  String get loginForgotPassword => 'Забыли пароль?';

  @override
  String get loginSignInButton => 'Войти';

  @override
  String get loginBiometricButton => 'Войти биометрически';

  @override
  String get loginNoAccountPrompt => 'Нет аккаунта? ';

  @override
  String get loginSignUpLink => 'Зарегистрироваться';

  @override
  String get registerStep1Title => 'Как вас зовут?';

  @override
  String get registerStep1Subtitle => 'Так вас будут видеть другие.';

  @override
  String get registerFullNameLabel => 'Полное имя';

  @override
  String get registerContinueButton => 'Продолжить';

  @override
  String get registerStep2Title => 'Я...';

  @override
  String get registerStep2Subtitle => 'Выберите роль для подходящего опыта.';

  @override
  String get registerRoleStudentTitle => 'Ученик';

  @override
  String get registerRoleStudentSubtitle =>
      'Отслеживаю оценки и зарабатываю награды';

  @override
  String get registerRoleParentTitle => 'Родитель';

  @override
  String get registerRoleParentSubtitle =>
      'Устанавливаю награды и слежу за успехами ребёнка';

  @override
  String get registerStep3Title => 'Создайте аккаунт';

  @override
  String get registerStep3Subtitle => 'Почти готово!';

  @override
  String get registerEmailLabel => 'Электронная почта';

  @override
  String get registerPasswordLabel => 'Пароль';

  @override
  String get registerConfirmPasswordLabel => 'Подтвердите пароль';

  @override
  String get registerCreateAccountButton => 'Создать аккаунт';

  @override
  String get registerAlreadyHaveAccount => 'Уже есть аккаунт? ';

  @override
  String get registerSignInLink => 'Войти';

  @override
  String get registerPasswordsDoNotMatch => 'Пароли не совпадают';

  @override
  String get registerPasswordTooShort =>
      'Пароль должен содержать не менее 12 символов';

  @override
  String get registerFailed => 'Регистрация не удалась. Попробуйте снова.';

  @override
  String get forgotPasswordAppBarTitle => 'Сброс пароля';

  @override
  String get forgotPasswordStep1Title => 'Забыли пароль?';

  @override
  String get forgotPasswordStep1Subtitle =>
      'Введите почту, и мы отправим код для сброса.';

  @override
  String get forgotPasswordEmailLabel => 'Электронная почта';

  @override
  String get forgotPasswordSendCodeButton => 'Отправить код';

  @override
  String get forgotPasswordStep2Title => 'Проверьте почту';

  @override
  String forgotPasswordStep2Subtitle(String email) {
    return 'Введите код, который мы отправили на $email.';
  }

  @override
  String get forgotPasswordResetCodeLabel => 'Код сброса';

  @override
  String get forgotPasswordNewPasswordLabel => 'Новый пароль';

  @override
  String get forgotPasswordResetButton => 'Сбросить пароль';

  @override
  String get forgotPasswordResendCode => 'Отправить код повторно';

  @override
  String get forgotPasswordUpdatedSnackbar =>
      'Пароль обновлён! Войдите с новым паролем.';

  @override
  String get verifyEmailAppBarTitle => 'Подтверждение почты';

  @override
  String get verifyEmailTitle => 'Проверьте почту';

  @override
  String verifyEmailSubtitle(String email) {
    return 'Введите 6-значный код, отправленный на\n$email';
  }

  @override
  String get verifyEmailButton => 'Подтвердить';

  @override
  String get verifyEmailFailed => 'Подтверждение не удалось. Попробуйте снова.';

  @override
  String get onboardingSkip => 'Пропустить';

  @override
  String get onboardingNext => 'Далее';

  @override
  String get onboardingGetStarted => 'Начать';

  @override
  String get onboardingNoAccountPrompt => 'Нет аккаунта? ';

  @override
  String get onboardingSignUpLink => 'Зарегистрироваться';

  @override
  String get onboardingPage1Title => 'Превращай оценки\nв награды';

  @override
  String get onboardingPage1Body =>
      'Ученики зарабатывают бонусные баллы за каждую хорошую оценку. Родители устанавливают награды. Все в выигрыше.';

  @override
  String get onboardingPage2Title =>
      'Сфотографируй оценку —\nполучи баллы сразу';

  @override
  String get onboardingPage2Body =>
      'Сфотографируй любую школьную работу с оценкой. Приложение само распознает предмет и оценку.';

  @override
  String get onboardingPage3Title => 'Следите за успехами\nвместе';

  @override
  String get onboardingPage3Body =>
      'Родители и ученики видят одну и ту же информацию — оценки, бонусы и динамику со временем.';

  @override
  String get settingsTitle => 'Настройки';

  @override
  String get settingsSectionPreferences => 'Предпочтения';

  @override
  String get settingsSectionAccount => 'Аккаунт';

  @override
  String get settingsSectionConnectedParents => 'Подключённые родители';

  @override
  String get settingsSectionApp => 'Приложение';

  @override
  String get settingsAppearanceLabel => 'Оформление';

  @override
  String get settingsThemeSystem => 'Системная';

  @override
  String get settingsThemeLight => 'Светлая';

  @override
  String get settingsThemeDark => 'Тёмная';

  @override
  String get settingsLanguageLabel => 'Язык';

  @override
  String get settingsLanguageAuto => 'Авто';

  @override
  String get settingsLanguageAutoSystem => 'Авто (системный)';

  @override
  String get settingsEditProfile => 'Редактировать профиль';

  @override
  String get settingsChangePassword => 'Изменить пароль';

  @override
  String get settingsChangeEmail => 'Изменить почту';

  @override
  String get settingsBiometricLogin => 'Биометрический вход';

  @override
  String get settingsBiometricVerifyFailed =>
      'Биометрическая верификация не удалась. Попробуйте ещё раз.';

  @override
  String get settingsDeleteAccount => 'Удалить аккаунт';

  @override
  String get settingsDeleteAccountDialogTitle => 'Удалить аккаунт';

  @override
  String get settingsDeleteAccountDialogContent =>
      'Это навсегда удалит ваш аккаунт и все данные. Это действие нельзя отменить.';

  @override
  String get settingsDeleteAccountConfirm => 'Удалить аккаунт';

  @override
  String get settingsCancel => 'Отмена';

  @override
  String get settingsAbout => 'О приложении';

  @override
  String get settingsLogOut => 'Выйти';

  @override
  String get settingsNoParentsConnected => 'Родители не подключены';

  @override
  String get settingsScanQr => 'Сканировать QR';

  @override
  String get settingsAddAnotherParent => 'Добавить другого родителя';

  @override
  String get settingsScanParentQrTitle => 'Сканировать QR родителя';

  @override
  String get settingsScanQrInstructions =>
      'Наведите камеру на QR-код, показанный на устройстве родителя';

  @override
  String settingsConnectedSince(String date) {
    return 'Подключено $date';
  }

  @override
  String get settingsRemoveConnection => 'Удалить соединение';

  @override
  String get settingsRemoveConnectionTitle => 'Удалить соединение';

  @override
  String get settingsRemoveConnectionContent =>
      'Вы уверены, что хотите удалить это родительское соединение? Это действие нельзя отменить.';

  @override
  String get settingsRemoveConnectionSuccess => 'Соединение удалено';

  @override
  String get settingsRemoveConnectionFailed => 'Не удалось удалить соединение';

  @override
  String get settingsParentConnected => 'Родитель подключён!';

  @override
  String get settingsEditProfileTitle => 'Редактировать профиль';

  @override
  String get settingsFullName => 'Полное имя';

  @override
  String get settingsNameCannotBeEmpty => 'Имя не может быть пустым';

  @override
  String get settingsProfileUpdated => 'Профиль обновлён';

  @override
  String get settingsChangePasswordTitle => 'Изменить пароль';

  @override
  String get settingsNewPassword => 'Новый пароль';

  @override
  String get settingsConfirmPassword => 'Подтвердите пароль';

  @override
  String get settingsEnterPassword => 'Введите пароль';

  @override
  String get settingsMin12Chars => 'Минимум 12 символов';

  @override
  String get settingsPasswordsDoNotMatch => 'Пароли не совпадают';

  @override
  String get settingsPasswordChanged => 'Пароль изменён';

  @override
  String get settingsChangeEmailTitle => 'Изменить почту';

  @override
  String get settingsNewEmailAddress => 'Новый адрес почты';

  @override
  String get settingsEnterEmail => 'Введите почту';

  @override
  String get settingsEnterValidEmail => 'Введите корректный адрес почты';

  @override
  String get settingsSendVerificationCode => 'Отправить код подтверждения';

  @override
  String get settingsSending => 'Отправка…';

  @override
  String settingsCodeSentTo(String email) {
    return 'Мы отправили 6-значный код на $email.';
  }

  @override
  String get settingsVerificationCode => 'Код подтверждения';

  @override
  String get settingsEnter6DigitCode => 'Введите 6-значный код';

  @override
  String get settingsEmailUpdated => 'Почта обновлена';

  @override
  String get settingsInvalidCode =>
      'Неверный или устаревший код. Попробуйте снова.';

  @override
  String get settingsSave => 'Сохранить';

  @override
  String settingsDeleteAccountFailed(String error) {
    return 'Не удалось удалить аккаунт: $error';
  }

  @override
  String get settingsAboutLegalese => 'Трекер наград за оценки для учеников';

  @override
  String get settingsAboutAppName => 'Bonifatus';

  @override
  String get settingsGradingConfig => 'Настройка оценок';

  @override
  String get settingsGradingConfigSubtitle =>
      'Множители уровней · цикл оценок · коэффициент бонуса';

  @override
  String get settingsGradeTierMultipliers => 'Множители уровня оценки';

  @override
  String get settingsOngoingNotesCycle => 'Текущий цикл оценок';

  @override
  String settingsEditMultiplier(String label) {
    return 'Изменить множитель: $label';
  }

  @override
  String settingsConfigFor(String childName) {
    return 'Настройка для $childName';
  }

  @override
  String get settingsCycleType => 'Тип цикла';

  @override
  String get settingsBonusRatio => 'Коэффициент бонуса';

  @override
  String get settingsTierBestLabel => 'Отлично (Оценка 1–2)';

  @override
  String get settingsTierSecondLabel => 'Хорошо (Оценка 3)';

  @override
  String get settingsTierThirdLabel => 'Удовлетворительно (Оценка 4)';

  @override
  String get settingsFailedToLoadChildren => 'Не удалось загрузить детей';

  @override
  String get settingsNoChildrenConnected => 'Дети не подключены';

  @override
  String dashboardHiName(String name) {
    return 'Привет, $name 👋';
  }

  @override
  String get dashboardSubtitle => 'Отслеживайте оценки, зарабатывайте награды';

  @override
  String get dashboardThisWeek => 'На этой неделе';

  @override
  String get dashboardRecentNotes => 'Последние оценки';

  @override
  String get dashboardSavedResults => 'Сохранённые результаты';

  @override
  String get dashboardQuickCalculate => 'Быстрый расчёт';

  @override
  String get dashboardCouldNotLoadNotes => 'Не удалось загрузить оценки';

  @override
  String get dashboardNoNotesYet => 'Оценок пока нет';

  @override
  String get dashboardCouldNotLoadResults => 'Не удалось загрузить результаты';

  @override
  String get dashboardNoSavedResultsYet => 'Сохранённых результатов пока нет';

  @override
  String get calculatorTitle => 'Калькулятор оценок';

  @override
  String get calculatorGradingSystem => 'Система оценивания';

  @override
  String get calculatorClass => 'Класс';

  @override
  String get calculatorTerm => 'Полугодие';

  @override
  String get calculatorSchoolYear => 'Учебный год';

  @override
  String get calculatorLabelOptional => 'Метка (необязательно)';

  @override
  String get calculatorGradePlanner => 'Планировщик оценок';

  @override
  String get calculatorGradePlannerHint =>
      'Выберите класс и полугодие выше, затем нажмите «Добавить предмет».';

  @override
  String get calculatorAddSubject => 'Добавить предмет';

  @override
  String get calculatorSearchSubjects => 'Поиск предметов…';

  @override
  String get calculatorGradeLabel => 'Оценка';

  @override
  String get calculatorWeightLabel => 'Вес';

  @override
  String get calculatorWeightTooltip =>
      'Больший вес = больше бонус. Используйте 2× для сложных экзаменов.';

  @override
  String get calculatorSelectSubjectValidator => 'Выберите предмет';

  @override
  String get calculatorSelectGradeValidator => 'Выберите оценку';

  @override
  String get calculatorCoreSubjects => 'Основные предметы';

  @override
  String get calculatorOther => 'Другие';

  @override
  String get calculatorTotalBonus => 'Итоговый бонус';

  @override
  String get calculatorSaveResult => 'Сохранить результат';

  @override
  String get calculatorResultSaved => 'Результат сохранён!';

  @override
  String get calculatorSaveChanges => 'Сохранить изменения';

  @override
  String get calculatorTierExcellent => 'Отлично';

  @override
  String get calculatorTierGood => 'Хорошо';

  @override
  String get calculatorTierSatisfactory => 'Удовлетворительно';

  @override
  String get calculatorTierBelow => 'Ниже порога';

  @override
  String get calculatorSettingsTooltip => 'Настройки';

  @override
  String get notesTitle => 'Оценки';

  @override
  String get notesNoNotesYet => 'Оценок пока нет';

  @override
  String get notesTapToCaptureFirst => 'Нажмите + чтобы добавить первую оценку';

  @override
  String get notesFailedToLoad => 'Не удалось загрузить оценки';

  @override
  String get genericRetry => 'Повторить';

  @override
  String get notesRetry => 'Повторить';

  @override
  String get notesViewCycleSummary => 'Просмотр итогов цикла';

  @override
  String get notesDeleteGradeTitle => 'Удалить оценку';

  @override
  String get notesDeleteGradeConfirm =>
      'Вы уверены, что хотите удалить эту оценку?';

  @override
  String get notesDelete => 'Удалить';

  @override
  String get notesCancel => 'Отмена';

  @override
  String get notesThisWeek => 'На этой неделе';

  @override
  String get notesLastWeek => 'На прошлой неделе';

  @override
  String get noteDetailTitle => 'Детали оценки';

  @override
  String get noteDetailCouldNotLoad => 'Не удалось загрузить оценку';

  @override
  String get noteDetailNotFound => 'Оценка не найдена';

  @override
  String get noteDetailDateCaptured => 'Дата добавления';

  @override
  String get noteDetailQualityTier => 'Уровень качества';

  @override
  String get noteDetailSettlement => 'Расчёт';

  @override
  String get noteDetailSettled => 'Выплачено';

  @override
  String get noteDetailPending => 'Ожидает';

  @override
  String get noteDetailTier1 => 'Уровень 1 — Отлично';

  @override
  String get noteDetailTier2 => 'Уровень 2 — Хорошо';

  @override
  String get noteDetailTier3 => 'Уровень 3 — Удовлетворительно';

  @override
  String get noteDetailTierBelow => 'Ниже порога';

  @override
  String get noteDetailDeleteTitle => 'Удалить оценку';

  @override
  String get noteDetailDeleteConfirm =>
      'Вы уверены, что хотите удалить эту оценку? Это действие нельзя отменить.';

  @override
  String get noteDetailDelete => 'Удалить';

  @override
  String get noteDetailCancel => 'Отмена';

  @override
  String get captureTitle => 'Добавить оценку';

  @override
  String get capturePositionGrade =>
      'Расположите оценку так, чтобы она была чётко видна';

  @override
  String get captureChooseFromGallery => 'Выбрать из галереи';

  @override
  String get captureTakePhoto => 'Сделать фото';

  @override
  String get captureLoadingEntry => 'Загрузка записи об оценке...';

  @override
  String get captureEnterGrade => 'Ввести оценку';

  @override
  String get captureSelectSubjectGrade => 'Выберите предмет и значение оценки';

  @override
  String get captureSubjectLabel => 'Предмет';

  @override
  String get captureGradeLabel => 'Оценка';

  @override
  String get captureNoSubjectsLoaded => 'Предметы не загружены';

  @override
  String get captureSelectSubjectAndGrade => 'Выберите предмет и оценку';

  @override
  String get captureSaveGrade => 'Сохранить оценку';

  @override
  String get captureCancel => 'Отмена';

  @override
  String get cycleSummaryTitle => 'Итоги цикла';

  @override
  String get cycleSummaryCouldNotLoad => 'Не удалось загрузить оценки';

  @override
  String get cycleSummaryWeekly => 'Понедельно';

  @override
  String get cycleSummaryNotesInCycle => 'Оценки в этом цикле';

  @override
  String get cycleSummaryNoGrades => 'Оценок за этот период нет';

  @override
  String get cycleSummaryPositive => 'Положительный';

  @override
  String get cycleSummaryNet => 'Итог';

  @override
  String get resultsTitle => 'Сохранённые результаты';

  @override
  String get resultsFailedToLoad => 'Не удалось загрузить результаты';

  @override
  String get resultsRetry => 'Повторить';

  @override
  String get resultsNoResults => 'Сохранённых результатов пока нет';

  @override
  String get resultsUseCalculator =>
      'Используйте калькулятор, чтобы сохранить первый результат за полугодие.';

  @override
  String get resultsOpenCalculator => 'Открыть калькулятор';

  @override
  String get termDetailTitle => 'Результат за полугодие';

  @override
  String get termDetailCouldNotLoad => 'Не удалось загрузить полугодие';

  @override
  String get termDetailNotFound => 'Полугодие не найдено';

  @override
  String get termDetailAverage => 'Средний балл';

  @override
  String get termDetailBonus => 'Бонус';

  @override
  String get termDetailSubjects => 'Предметы';

  @override
  String get termDetailSubjectBreakdown => 'Разбивка по предметам';

  @override
  String get insightsTitle => 'Аналитика';

  @override
  String get insightsFailedToLoad => 'Не удалось загрузить аналитику';

  @override
  String get insightsRetry => 'Повторить';

  @override
  String get insightsNoGradesYet => 'Оценок пока нет';

  @override
  String get insightsAddGradesHint =>
      'Добавьте оценки на вкладке «Оценки», чтобы увидеть аналитику.';

  @override
  String get insightsBonusPointsLastMonths =>
      'Бонусные баллы — последние 6 месяцев';

  @override
  String get insightsNoBonusPoints =>
      'Бонусных баллов за последние 6 месяцев нет';

  @override
  String get insightsGradeDistribution => 'Распределение оценок';

  @override
  String get insightsThisWeek => 'На этой неделе';

  @override
  String get insightsAllTime => 'За всё время';

  @override
  String get insightsGrades => 'Оценки';

  @override
  String get insightsEarned => 'Заработано';

  @override
  String get insightsUnsettled => 'Не выплачено';

  @override
  String get insightsTotalPts => 'Всего баллов';

  @override
  String get insightsPending => 'Ожидает';

  @override
  String get periodWeek => 'Неделя';

  @override
  String get periodMonth => 'Месяц';

  @override
  String get periodAllTime => 'Всего';

  @override
  String get insightsTierBest => 'Отлично (1–1,4)';

  @override
  String get insightsTierGood => 'Хорошо (1,5–2,4)';

  @override
  String get insightsTierOk => 'Удовл. (2,5–3,4)';

  @override
  String get insightsTierBelow => 'Неудовл. (3,5+)';

  @override
  String parentDashboardHiName(String name) {
    return 'Привет, $name';
  }

  @override
  String get parentDashboardOverview => 'Обзор ваших детей';

  @override
  String get parentDashboardSummary => 'Сводка';

  @override
  String get parentDashboardChildren => 'Дети';

  @override
  String get parentDashboardPending => 'Ожидает';

  @override
  String get parentDashboardGrades => 'Оценки';

  @override
  String get parentDashboardChildrenOverview => 'Обзор детей';

  @override
  String get parentDashboardNoChildrenConnected =>
      'Детей пока не подключено.\nПерейдите на вкладку «Дети», чтобы добавить.';

  @override
  String get parentDashboardRecentGrade => 'Последняя оценка';

  @override
  String get parentDashboardCouldNotLoadChildren =>
      'Не удалось загрузить данные детей';

  @override
  String get childrenTitle => 'Дети';

  @override
  String get childrenNoChildrenConnected => 'Дети не подключены';

  @override
  String get childrenShareQrHint =>
      'Поделитесь QR-кодом приглашения, чтобы подключить ученика';

  @override
  String get childrenShowInviteQr => 'Показать QR приглашения';

  @override
  String get childrenInviteStudent => 'Пригласить ученика';

  @override
  String get childrenScanCodeHint =>
      'Попросите ученика отсканировать этот код в своём приложении';

  @override
  String get childrenFailedToCreateInvite => 'Не удалось создать приглашение';

  @override
  String get childrenRetry => 'Повторить';

  @override
  String get childrenClose => 'Закрыть';

  @override
  String get childrenFailedToLoad => 'Не удалось загрузить детей';

  @override
  String get childDetailTitle => 'Данные ребёнка';

  @override
  String get childDetailCouldNotLoad => 'Не удалось загрузить данные';

  @override
  String get childDetailNotFound => 'Ребёнок не найден';

  @override
  String get childDetailTermResults => 'Результаты за полугодие';

  @override
  String get childDetailNoTermResults =>
      'Сохранённых результатов за полугодие нет.';

  @override
  String get childDetailCouldNotLoadTermResults =>
      'Не удалось загрузить результаты за полугодие';

  @override
  String get childDetailQuickGrades => 'Быстрые оценки';

  @override
  String get childDetailNoQuickGrades => 'Быстрых оценок пока нет';

  @override
  String get childDetailGrades => 'Оценки';

  @override
  String get childDetailTotalPts => 'Всего баллов';

  @override
  String get childDetailPending => 'Ожидает';

  @override
  String get childDetailSettled => 'Выплачено';

  @override
  String get childDetailBonus => 'Бонус';

  @override
  String get childDetailStatus => 'Статус';

  @override
  String get rewardsTitle => 'Награды';

  @override
  String get rewardsTabQuickGrades => 'Быстрые оценки';

  @override
  String get rewardsTabGrades => 'Оценки';

  @override
  String get rewardsTabSummary => 'Сводка';

  @override
  String get rewardsTabHistory => 'История';

  @override
  String get rewardsHistoryEmpty => 'Расчётов пока нет';

  @override
  String get rewardsBadgeTerm => 'Четверть';

  @override
  String get rewardsNoChildrenConnected => 'Дети не подключены';

  @override
  String get rewardsFailedToLoadData =>
      'Не удалось загрузить данные о наградах';

  @override
  String get rewardsRetry => 'Повторить';

  @override
  String get rewardsNoPendingGrades => 'Ожидающих оценок нет';

  @override
  String get rewardsSettle => 'Выплатить';

  @override
  String rewardsSettleBonusFor(String childName) {
    return 'Выплатить бонус для $childName';
  }

  @override
  String get rewardsAmountToTransfer => 'Сумма для перевода';

  @override
  String get rewardsCancel => 'Отмена';

  @override
  String get rewardsConfirmSettle => 'Подтвердить выплату';

  @override
  String get rewardsSettled => 'Выплачено!';

  @override
  String get rewardsSectionTermGrades => 'Оценки за четверть';

  @override
  String rewardsSectionNotesWeek(String weekRange) {
    return 'Заметки — $weekRange';
  }

  @override
  String rewardsGroupSettleBonusFor(String label, String childName) {
    return 'Выплатить $label для $childName';
  }

  @override
  String get childrenSearchPlaceholder => 'Поиск детей...';

  @override
  String get insightsFilterAll => 'Все';

  @override
  String get parentInsightsTitle => 'Аналитика';

  @override
  String get parentInsightsFailedToLoad => 'Не удалось загрузить аналитику';

  @override
  String get parentInsightsRetry => 'Повторить';

  @override
  String get parentInsightsNoInsights => 'Аналитики пока нет';

  @override
  String get parentInsightsNoInsightsHint =>
      'Подключите детей, чтобы видеть аналитику их оценок';

  @override
  String get parentInsightsAllChildrenSummary => 'Все дети — Сводка';

  @override
  String get parentInsightsTotalEarned => 'Всего заработано';

  @override
  String get parentInsightsPending => 'Ожидает';

  @override
  String get parentInsightsChildren => 'Дети';

  @override
  String get insightsReadyToSettle => 'К выплате';

  @override
  String get insightsRecentActivity => 'Последние оценки';

  @override
  String get insightsPendingPts => 'Ожидает (балл)';

  @override
  String get insightsUnsettledGrades => 'Не выплачено';

  @override
  String get insightsToday => 'Сегодня';

  @override
  String get insightsYesterday => 'Вчера';

  @override
  String insightsDaysAgo(int days) {
    return '$daysд назад';
  }

  @override
  String get insightsNote => 'запись';

  @override
  String get insightsNotes => 'записи';

  @override
  String rewardsSettleAmount(int pts) {
    return 'Выплатить · $pts пт';
  }

  @override
  String get navHome => 'Главная';

  @override
  String get navCalculator => 'Калькулятор';

  @override
  String parentDashboardChildSubtitle(int count, int pts) {
    return '$count оценок · $pts Б ожидает';
  }

  @override
  String get homeActionCenterSubtitle => 'Вот что требует вашего внимания';

  @override
  String homeUnsettledBannerTitle(int pts) {
    return '$pts Б готовы к выплате';
  }

  @override
  String homeUnsettledBannerSub(int count) {
    return '$count неоплаченных позиций';
  }

  @override
  String get homeGoToInsights => 'Перейти к аналитике';

  @override
  String get homeTopPendingSection => 'Наибольший ожидающий';

  @override
  String get homeActiveTodaySection => 'Активны сегодня';

  @override
  String get homeActiveTodayEmpty => 'Нет активности за последние 24 часа';

  @override
  String get homeAllSettledUp => 'Всё выплачено!';

  @override
  String get termDetailDeleteTitle => 'Удалить результат';

  @override
  String get termDetailDeleteConfirm =>
      'Вы уверены, что хотите удалить этот результат? Это действие нельзя отменить.';

  @override
  String get termDetailDelete => 'Удалить';

  @override
  String get termDetailEditLabel => 'Изменить метку';

  @override
  String get termDetailEditGrade => 'Изменить оценку';

  @override
  String get termSettledBadge => 'Оплачено';

  @override
  String get termOpenBadge => 'Открыто';

  @override
  String get calculatorLabelHint => 'напр. Итоговый экзамен';

  @override
  String studentNotesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count записей',
      few: '$count записи',
      one: '$count запись',
    );
    return '$_temp0';
  }

  @override
  String calculatorNoSubjectsMatch(String query) {
    return 'Нет предметов, соответствующих \"$query\"';
  }

  @override
  String get calculatorRemoveSubject => 'Удалить';

  @override
  String calculatorFailedToSave(String error) {
    return 'Не удалось сохранить: $error';
  }

  @override
  String calculatorSubjectsLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count предметов',
      few: '$count предмета',
      one: '$count предмет',
    );
    return '$_temp0';
  }

  @override
  String calculatorGradeHint(String example) {
    return 'напр. $example';
  }

  @override
  String childrenGradesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count оценок',
      few: '$count оценки',
      one: '$count оценка',
    );
    return '$_temp0';
  }

  @override
  String get childrenView => 'Просмотр';

  @override
  String childrenPtsPending(int pts) {
    return '$pts балл. ожидается';
  }

  @override
  String rewardsSummarySubtitle(int count, int pts) {
    return '$count оценок · $pts балл. всего';
  }

  @override
  String get subjectFallback => 'Предмет';

  @override
  String genericFailedError(String error) {
    return 'Ошибка: $error';
  }

  @override
  String get errorLoadingConfig => 'Не удалось загрузить конфигурацию';

  @override
  String forgotPasswordCooldownMessage(int seconds) {
    return 'Пожалуйста, подождите $seconds секунд перед повторным запросом кода.';
  }

  @override
  String get cycleTypeDaily => 'Ежедневно';

  @override
  String get cycleTypeWeekly => 'Еженедельно';

  @override
  String get cycleTypeMonthly => 'Ежемесячно';

  @override
  String notesNetPointsLabel(String pts) {
    return 'Нетто: $pts балл.';
  }

  @override
  String childrenInviteCode(String code) {
    return 'Код: $code';
  }

  @override
  String get ptsAbbr => 'балл';

  @override
  String get bonusPtsLabel => 'бонусных балл.';

  @override
  String get totalGradesLabel => 'оценок всего';

  @override
  String get classLabel => 'Класс';

  @override
  String get ratioLabel => 'доля';

  @override
  String get genericRequestFailed => 'Запрос не выполнен';

  @override
  String get parentFallback => 'Родитель';

  @override
  String get calculatorSchoolYearHint => '2024/25';

  @override
  String get registerDateOfBirthLabel => 'Дата рождения';

  @override
  String get registerDateOfBirthHint => 'Выбрать дату рождения';

  @override
  String get registerDateOfBirthRequired =>
      'Пожалуйста, выберите дату рождения';

  @override
  String get captureClassLevelLabel => 'Класс';

  @override
  String get captureAnalyzingImage => 'Анализ изображения…';

  @override
  String get captureDetectedHint =>
      'Оценка обнаружена — проверьте и подтвердите';

  @override
  String get captureReviewGrades => 'Проверьте обнаруженные оценки';

  @override
  String captureNGradesDetected(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'Обнаружено $count оценок',
      few: 'Обнаружено $count оценки',
      one: 'Обнаружена $count оценка',
      zero: 'Оценки не обнаружены',
    );
    return '$_temp0';
  }

  @override
  String get captureAddEntry => 'Добавить запись';

  @override
  String captureSaveAll(int count) {
    return 'Сохранить $count';
  }

  @override
  String get captureSelectSubject => 'Нажмите для выбора';

  @override
  String get termTypeSemester1 => 'Семестр 1';

  @override
  String get termTypeSemester2 => 'Семестр 2';

  @override
  String get termTypeTrimester1 => 'Триместр 1';

  @override
  String get termTypeTrimester2 => 'Триместр 2';

  @override
  String get termTypeTrimester3 => 'Триместр 3';

  @override
  String get termTypeAnnual => 'Годовой';

  @override
  String get nameUnknown => 'Неизвестно';

  @override
  String get gradingSystemGermanDefault => 'Немецкая 1–6';

  @override
  String get loginOrDivider => 'или';

  @override
  String get loginContinueWithGoogle => 'Войти через Google';

  @override
  String get googleProfileTitle => 'Заполните профиль';

  @override
  String get googleProfileSubtitle => 'Ещё несколько деталей для начала.';

  @override
  String get googleProfileRoleRequired => 'Пожалуйста, выберите роль';

  @override
  String get registerPasswordHelper => 'Минимум 12 символов';

  @override
  String get aboutDescription =>
      'Bonifatus превращает школьные оценки в семейные награды. Ученики зарабатывают бонусные баллы за хорошие оценки, родители устанавливают награды.';

  @override
  String get aboutPrivacyPolicy => 'Политика конфиденциальности';

  @override
  String get aboutTermsOfService => 'Условия использования';

  @override
  String get settingsSectionConnectedChildren => 'Подключённые дети';

  @override
  String get settingsChildBirthday => 'Дата рождения';

  @override
  String get settingsChildSchool => 'Школа';

  @override
  String get settingsChildNotSpecified => 'Не указано';

  @override
  String settingsChildStats(int grades, int pts, int pending) {
    return '$grades оценок · $pts баллов · $pending ожидает';
  }
}
