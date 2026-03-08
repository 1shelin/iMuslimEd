// глобальные переменные
let islamAccepted = false;     
let authFinished = false;
let currentLogin = "";
let currentPassword = "";
let currentUserId = localStorage.getItem("currentUserId") || "";
let chatMessages = [];
const MAX_CHAT_MESSAGE_LENGTH = 500;
const LAST_AUTH_WINDOW_KEY = "lastAuthorizedWindow";
const APP_LANGUAGE_KEY = "appLanguage";
const TASBIH_COUNT_KEY = "tasbihCount";

// добавлено для отслеживания активного окна
let activeMainWindow = null;
// запоминаем подтверждение ислама
let islamConfirmed = localStorage.getItem("islamConfirmed") === "true";

// элементы DOM
const openIslamBtn = document.getElementById("openIslamBtn");
const islamPopup = document.getElementById("islamPopup");
const closePopup = document.getElementById("closePopup");
const authPopup = document.getElementById("authPopup");
const closeAuth = document.getElementById("closeAuth");
const toggle = document.getElementById("religionToggle");
const islamPopupBody = islamPopup ? islamPopup.querySelector(".popup-body") : null;
const quickLanguageBtn = document.getElementById("quickLanguageBtn");
const quickLanguagePopupEl = document.getElementById("quickLanguagePopup");
const quickLanguageTitleEl = document.getElementById("quickLanguageTitle");
const quickLanguageRuBtn = document.getElementById("quickLanguageRuBtn");
const quickLanguageEnBtn = document.getElementById("quickLanguageEnBtn");

const loginBtn = document.getElementById("loginBtn");
const loginInput = document.getElementById("loginInput");
const passwordInput = document.getElementById("passwordInput");
const togglePassword = document.getElementById("togglePassword");
const passwordIcon = togglePassword ? togglePassword.querySelector("img") : null;

const authLoading = document.getElementById("authLoading");
const closeLoading = document.getElementById("closeLoading");
const mainWindow = document.getElementById("mainWindow");
const closeMain = document.getElementById("closeMain");

const fioPopup = document.getElementById("fioPopup");
const fioInput = document.getElementById("fioInput");
const saveFioBtn = document.getElementById("saveFioBtn");
const closeFio = document.getElementById("closeFio");
const profileName = document.getElementById("profileName");
const miniAlertPopup = document.getElementById("miniAlertPopup");
const miniAlertBox = document.getElementById("miniAlertBox");
const miniAlertText = document.getElementById("miniAlertText");
const miniAlertOk = document.getElementById("miniAlertOk");

const chatWindow = document.getElementById("chatWindow");
const chatBtn = document.getElementById("askQuestionBtn");
const openMajorBtn = document.getElementById("openMajorBtn");
const closeChat = document.getElementById("closeChat");
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const messageContainer = document.getElementById("messageContainer");
const chatDateEl = document.getElementById("chatDate");

// кнопки меню
const menuButtons = document.querySelectorAll(".chat-menu");
const menuWindow = document.getElementById("menuWindow");
const menuClose = document.getElementById("closeMenu");
const menuHome = document.getElementById("menuHome");
const menuChat = document.getElementById("menuChat");
const menuPrayer = document.getElementById("menuPrayer");
const menuNames99 = document.getElementById("menuNames99");
const menuSettings = document.getElementById("menuSettings");
const menuPrayerWindow = document.getElementById("menuPrayerWindow");
const menuNames99Window = document.getElementById("menuNames99Window");
const closeMenuPrayerWindowBtn = document.getElementById("closeMenuPrayerWindow");
const closeMenuNames99WindowBtn = document.getElementById("closeMenuNames99Window");
const names99Grid = document.getElementById("names99Grid");
const menuPrayerPopupEl = document.getElementById("menuPrayerPopup");
const menuNames99PopupEl = document.getElementById("menuNames99Popup");
const closeMenuPrayerBtn = document.getElementById("closeMenuPrayer");
const closeMenuNames99Btn = document.getElementById("closeMenuNames99");
const languageSettingsBtn = document.getElementById("languageSettings");
const languagePopupEl = document.getElementById("languagePopup");
const closeLanguagePopupBtn = document.getElementById("closeLanguagePopup");
const languageRuBtn = document.getElementById("languageRuBtn");
const languageEnBtn = document.getElementById("languageEnBtn");
const qiblaCard = document.getElementById("qiblaCard");
const qiblaPopupEl = document.getElementById("qiblaPopup");
const closeQiblaPopupBtn = document.getElementById("closeQiblaPopup");
const tasbihCard = document.getElementById("tasbihCard");
const tasbihPopupEl = document.getElementById("tasbihPopup");
const closeTasbihPopupBtn = document.getElementById("closeTasbihPopup");
const tasbihFingerBtn = document.getElementById("tasbihFingerBtn");
const tasbihCounterValueEl = document.getElementById("tasbihCounterValue");
const tasbihResetBtn = document.getElementById("tasbihResetBtn");

const settingsWindow = document.getElementById("settingsWindow");
const closeSettings = document.getElementById("closeSettings");

const majorWindow = document.getElementById("majorWindow");
const closeMajor = document.getElementById("closeMajor");

// дочерние окна (должны открываться поверх главного)
const prayerPopupEl = document.getElementById("prayerPopup");
const closePrayerBtn = document.getElementById("closePrayer");
const prayerTimesContainer = document.getElementById("prayerTimes");
const aboutPopupEl = document.getElementById("aboutPopup");
const closeAboutBtn = document.getElementById("closeAbout");
const feedbackPopupEl = document.getElementById("feedbackPopup");
const closeFeedbackBtn = document.getElementById("closeFeedback");
const faqPopupEl = document.getElementById("faqPopup");
const closeFaqBtn = document.getElementById("closeFaq");
const centerInfoBtn = document.getElementById("centerInfoBtn");
const centerInfoPopupEl = document.getElementById("centerInfoPopup");
const closeCenterInfoBtn = document.getElementById("closeCenterInfo");
const clearHistoryConfirmPopupEl = document.getElementById("clearHistoryConfirmPopup");
const clearHistoryConfirmYesBtn = document.getElementById("confirmClearHistoryYes");
const clearHistoryConfirmNoBtn = document.getElementById("confirmClearHistoryNo");
const closeClearHistoryPopupBtn = document.getElementById("closeClearHistoryPopup");
const logoutConfirmPopupEl = document.getElementById("logoutConfirmPopup");
const logoutMiniBox = document.querySelector("#logoutConfirmPopup .logout-mini-box");
const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

const halalPopupEl = document.getElementById("halalPopup");
const closeHalalBtn = document.getElementById("closeHalal");

const mosquePopupEl = document.getElementById("mosquePopup");
const closeMosqueBtn = document.getElementById("closeMosque");

let currentLanguage = (localStorage.getItem(APP_LANGUAGE_KEY) || "ru").toLowerCase().startsWith("en") ? "en" : "ru";
let tasbihCount = Number.parseInt(localStorage.getItem(TASBIH_COUNT_KEY) || "0", 10);
if (!Number.isFinite(tasbihCount) || tasbihCount < 0) tasbihCount = 0;

const UI_TEXT = {
  ru: {
    muiv_header: "Московский Университет им. С.Ю. Витте",
    religion_question: "Ваша Религия — Ислам?",
    registration_header: "Регистрация",
    auth_title: "Авторизуйтесь",
    fio_title: "Введите ваше ФИО",
    login_placeholder: "Логин",
    password_placeholder: "Пароль",
    fio_placeholder: "Фамилия Имя Отчество",
    login_btn: "Войти",
    continue_btn: "Продолжить",
    ask_btn: "Задать вопрос",
    home_btn: "Главная",
    menu_home: "Главная",
    menu_chat: "Чат",
    menu_prayer: "Молитва",
    menu_names: "99 Имён",
    menu_settings: "Настройки",
    settings_title: "Настройки",
    clear_history: "Очистить историю чата",
    about_service: "О сервисе",
    feedback: "Обратная связь",
    about_popup_title: "О сервисе",
    feedback_popup_title: "Обратная связь",
    language: "Язык",
    qibla_title: "Qibla",
    qibla_coords_label: "Координаты:",
    qibla_direction_label: "Направление:",
    qibla_popup_title: "Направление киблы",
    tasbih_popup_title: "Счётчик зикров",
    tasbih_counter_label: "Прочитано:",
    tasbih_reset: "Сброс",
    logout: "Выйти",
    language_popup_title: "Язык интерфейса",
    language_ru: "Русский",
    language_en: "English",
    prayer_title: "В помощь студентам:<br>7 дуа для экзаменов и учебы",
    names_title: "99 Прекрасных Имён Аллаха",
    clear_history_popup_title: "Очистить историю",
    clear_history_popup_text: "Вы точно хотите очистить историю чата?",
    yes: "Да",
    no: "Нет",
    logout_confirm: "Вы уверены, что хотите выйти?",
    cancel: "Отмена",
    ok: "ОК",
    loading_auth: "Авторизация...",
    main_welcome_line1: "• Ас-саляму ʿАлейкум!",
    main_welcome_line2: "Добро пожаловать в",
    major_title: "Главная",
    major_quote: "«Пусть знания ведут к взаимопониманию»",
    profile_name_placeholder: "ФИО",
    major_prayer: "Время<br>намаза",
    major_mosque: "Мечеть /<br>молельная",
    major_faq: "Часто задаваемые<br>вопросы",
    major_halal: "Халяль<br>рядом",
    center_info_popup_title: "Информация",
    prayer_popup_title: "Время намаза",
    faq_popup_title: "Часто задаваемые вопросы",
    halal_popup_title: "Халяль рядом",
    mosque_popup_title: "Мечеть / молельная",
    chat_placeholder: "Введите сообщение...",
    today: "Сегодня",
    net_error: "Ошибка подключения, повторите запрос.",
    thinking1: "Думаю.",
    thinking2: "Думаю..",
    thinking3: "Думаю...",
    thinking_stage1: "Ищу точный ответ...",
    thinking_stage2: "Осталось еще немного...",
    thinking_stage3: "Почти готово...",
    login_password_hint: "Введите ваш логин и пароль личного кабинета",
    empty_chat_error: "Пустое сообщение",
    login_required: "Введите логин",
    login_too_short: "Логин должен содержать минимум 3 символа",
    login_too_long: "Логин слишком длинный",
    login_spaces: "Логин не должен содержать пробелы",
    login_format: "Логин может содержать только латиницу, цифры и символы . _ -",
    password_required: "Введите пароль",
    password_too_short: "Пароль должен содержать минимум 4 символа",
    password_too_long: "Пароль слишком длинный",
    password_spaces: "Пароль не должен содержать пробелы",
    fio_required: "Введите ФИО",
    fio_invalid: "ФИО вводится на русском через пробелы: Фамилия Имя Отчество",
    fio_too_long: "ФИО слишком длинное",
    fio_equals_login: "ФИО не должно совпадать с логином",
    save_error: "Ошибка сохранения",
    max_chars_message: "Максимум {n} символов в одном сообщении.",
    empty_model_response: "Пустой ответ модели.",
    model_response_error: "Ошибка ответа модели.",
    mini_error_default: "Ошибка",
    mini_message_default: "Сообщение",
    prayer_loading: "Загрузка…",
    prayer_load_error: "Ошибка при загрузке времени намаза",
    faq_q1: "1. Что такое Ислам?",
    faq_a1: "Ислам - мировая религия, основанная на вере в Единого Бога (Аллаха). Мусульмане следуют учению пророка Мухаммада (мир ему).",
    faq_q2: "2. Какие пять столпов Ислама?",
    faq_a2_1: "Шахада (вера в Единого Бога)",
    faq_a2_2: "Намаз (ежедневная молитва)",
    faq_a2_3: "Ураза (пост в месяц Рамадан)",
    faq_a2_4: "Закят (обязательная милостыня)",
    faq_a2_5: "Хадж (паломничество в Мекку)",
    faq_q3: "3. Во сколько сегодня намаз в Москве?",
    faq_a3: "Время намаза меняется ежедневно. В нашем приложении есть раздел «Время намаза» с актуальным расписанием.",
    faq_q4: "4. Где находится ближайшая мечеть?",
    faq_a4: "В разделе «Мечеть / молельная» вы найдете карту с ближайшими мечетями/молельнями Москвы.",
    faq_q5: "5. Что значит «халяль»?",
    faq_a5: "Халяль - всё, что разрешено мусульманам. Обычно термин используется для еды: мясо, забитое по исламским правилам, без свинины и алкоголя.",
    faq_q6: "6. Где поесть халяль рядом с университетом?",
    faq_a6: "В разделе «Халяль рядом» есть карта с отмеченными халяль-кафе и ресторанами в районе университета.",
    faq_q7: "7. На какие вопросы может ответить чат-бот?",
    faq_a7: "Чат-бот отвечает на вопросы, связанные с исламскими традициями, правилами религиозной практики, халяль-инфраструктурой, адаптацией студентов в университетской среде, а также на общие вопросы о межкультурном взаимодействии и работе сервиса IMuslimEd.",
    faq_q8: "8. Бесплатно ли использование платформы?",
    faq_a8: "Да.",
    faq_q9: "9. Безопасны ли мои данные?",
    faq_a9: "Да, мы не передаем данные третьим лицам. Логин и пароль хранятся в зашифрованном виде.",
    faq_q10: "10. Как связаться с разработчиками?",
    faq_a10: "В разделе «Настройки» выберите пункт «Обратная связь».",
  },
  en: {
    muiv_header: "Moscow Witte University",
    religion_question: "Is Your Religion Islam?",
    registration_header: "Registration",
    auth_title: "Sign In",
    fio_title: "Enter your full name",
    login_placeholder: "Login",
    password_placeholder: "Password",
    fio_placeholder: "Surname Name Patronymic",
    login_btn: "Sign In",
    continue_btn: "Continue",
    ask_btn: "Ask a Question",
    home_btn: "Home",
    menu_home: "Home",
    menu_chat: "Chat",
    menu_prayer: "Prayer",
    menu_names: "99 Names",
    menu_settings: "Settings",
    settings_title: "Settings",
    clear_history: "Clear chat history",
    about_service: "About service",
    feedback: "Feedback",
    about_popup_title: "About service",
    feedback_popup_title: "Feedback",
    language: "Language",
    qibla_title: "Qibla",
    qibla_coords_label: "Coordinates:",
    qibla_direction_label: "Direction:",
    qibla_popup_title: "Qibla Direction",
    tasbih_popup_title: "Dhikr Counter",
    tasbih_counter_label: "Recited:",
    tasbih_reset: "Reset",
    logout: "Log out",
    language_popup_title: "Interface language",
    language_ru: "Russian",
    language_en: "English",
    prayer_title: "For students:<br>7 Duas for Exams and Study",
    names_title: "99 Beautiful Names of Allah",
    clear_history_popup_title: "Clear history",
    clear_history_popup_text: "Are you sure you want to clear chat history?",
    yes: "Yes",
    no: "No",
    logout_confirm: "Are you sure you want to log out?",
    cancel: "Cancel",
    ok: "OK",
    loading_auth: "Authorizing...",
    main_welcome_line1: "• As-salamu alaykum!",
    main_welcome_line2: "Welcome to",
    major_title: "Home",
    major_quote: "\"May knowledge lead to mutual understanding\"",
    profile_name_placeholder: "Full Name",
    major_prayer: "Prayer<br>time",
    major_mosque: "Mosque /<br>prayer room",
    major_faq: "Frequently asked<br>questions",
    major_halal: "Halal<br>nearby",
    center_info_popup_title: "Information",
    prayer_popup_title: "Prayer time",
    faq_popup_title: "Frequently Asked Questions",
    halal_popup_title: "Halal Nearby",
    mosque_popup_title: "Mosque / prayer room",
    chat_placeholder: "Type a message...",
    today: "Today",
    net_error: "Connection error, please retry.",
    thinking1: "Thinking.",
    thinking2: "Thinking..",
    thinking3: "Thinking...",
    thinking_stage1: "Searching for an accurate answer...",
    thinking_stage2: "Almost there...",
    thinking_stage3: "Finalizing...",
    login_password_hint: "Enter your personal account login and password",
    empty_chat_error: "Empty message",
    login_required: "Enter login",
    login_too_short: "Login must be at least 3 characters",
    login_too_long: "Login is too long",
    login_spaces: "Login must not contain spaces",
    login_format: "Login may contain only Latin letters, digits, and . _ -",
    password_required: "Enter password",
    password_too_short: "Password must be at least 4 characters",
    password_too_long: "Password is too long",
    password_spaces: "Password must not contain spaces",
    fio_required: "Enter full name",
    fio_invalid: "Full name must be in Russian with spaces: Surname Name Patronymic",
    fio_too_long: "Full name is too long",
    fio_equals_login: "Full name must not match login",
    save_error: "Save error",
    max_chars_message: "Maximum {n} characters per message.",
    empty_model_response: "Model returned an empty response.",
    model_response_error: "Model response error.",
    mini_error_default: "Error",
    mini_message_default: "Message",
    prayer_loading: "Loading…",
    prayer_load_error: "Failed to load prayer times",
    faq_q1: "1. What is Islam?",
    faq_a1: "Islam is a world religion based on belief in One God (Allah). Muslims follow the teachings of Prophet Muhammad (peace be upon him).",
    faq_q2: "2. What are the five pillars of Islam?",
    faq_a2_1: "Shahada (belief in One God)",
    faq_a2_2: "Salah (daily prayer)",
    faq_a2_3: "Sawm (fasting in Ramadan)",
    faq_a2_4: "Zakat (obligatory charity)",
    faq_a2_5: "Hajj (pilgrimage to Mecca)",
    faq_q3: "3. What time is prayer today in Moscow?",
    faq_a3: "Prayer times change daily. In our app, open the \"Prayer time\" section for the latest schedule.",
    faq_q4: "4. Where is the nearest mosque?",
    faq_a4: "In the \"Mosque / prayer room\" section you will find a map of nearby places in Moscow.",
    faq_q5: "5. What does \"halal\" mean?",
    faq_a5: "Halal means what is permissible for Muslims. It is often used for food: meat prepared by Islamic rules, without pork and alcohol.",
    faq_q6: "6. Where can I eat halal food near the university?",
    faq_a6: "In the \"Halal nearby\" section there is a map with halal cafes and restaurants near the university.",
    faq_q7: "7. What questions can the chatbot answer?",
    faq_a7: "The chatbot answers questions about Islamic traditions, religious practice, halal infrastructure, student adaptation, intercultural communication, and IMuslimEd service features.",
    faq_q8: "8. Is the platform free?",
    faq_a8: "Yes.",
    faq_q9: "9. Are my data safe?",
    faq_a9: "Yes, we do not share data with third parties. Login and password are stored encrypted.",
    faq_q10: "10. How can I contact the developers?",
    faq_a10: "Open \"Settings\" and choose \"Feedback\".",
  }
};

const ABOUT_CONTENT = {
  ru: `
    <section class="about-hero">
      <h3 class="about-hero-title">IMuslimEd</h3>
      <div class="about-meta">
        <span class="about-pill">Образование</span>
        <span class="about-pill">Диалог</span>
        <span class="about-pill">Поддержка</span>
      </div>
      <p class="about-hero-text">IMuslimEd — это информационный веб-сервис, разработанный для поддержки межкультурных коммуникаций и формирования инклюзивной образовательной среды среди студентов разных конфессий.</p>
      <p class="about-hero-text">Платформа ориентирована на студентов, исповедующих ислам, а также на всех обучающихся, заинтересованных в межконфессиональном взаимодействии и культурном диалоге.</p>
    </section>
    <section class="about-goal">
      <div class="about-chip">Цель сервиса</div>
      <p class="about-section-text">Обеспечить удобный доступ к достоверной информации об исламских традициях, религиозной практике и культурных особенностях, а также создать цифровое пространство для комфортного взаимодействия в университетской среде.</p>
    </section>
    <section class="about-features">
      <div class="about-chip">Функциональные возможности</div>
      <ul class="about-feature-list">
        <li>Подтверждение, регистрация (ввод логина и пароля, при первом входе — ввод ФИО), приветствие.</li>
        <li>Отображение актуального времени намазов с ежедневным обновлением.</li>
        <li>Предоставление точек о местах для совершения молитвы.</li>
        <li>Халяль-заведения с пометками на картах.</li>
        <li>Интеллектуальный чат-бот, отвечающий на вопросы религиозного, культурного и образовательного характера.</li>
        <li>Раздел часто задаваемых вопросов (FAQ) с систематизированными ответами по основным темам.</li>
        <li>Пользовательские настройки (очистка истории взаимодействия, справка о сервисе, обратная связь).</li>
        <li>Инструменты обратной связи для направления предложений, замечаний и сообщений о технических ошибках.</li>
        <li>Адаптивный веб-интерфейс для корректной работы на различных устройствах.</li>
      </ul>
    </section>
    <section class="about-data">
      <div class="about-chip">Данные и доступ</div>
      <p class="about-section-text">Пользовательские данные сохраняются на серверной стороне в формате JSON-файла. Обработка информации осуществляется в пределах функционала веб-приложения. Доступ к данным регулируется механизмом авторизации.</p>
    </section>
    <section class="about-impact">
      <div class="about-quote">«Пусть знания ведут к взаимопониманию»</div>
      <p class="about-section-text">IMuslimEd способствует снижению межкультурных барьеров, развитию общения и поддержке студентов в процессе адаптации к образовательной среде университета.</p>
    </section>
  `,
  en: `
    <section class="about-hero">
      <h3 class="about-hero-title">IMuslimEd</h3>
      <div class="about-meta">
        <span class="about-pill">Education</span>
        <span class="about-pill">Dialogue</span>
        <span class="about-pill">Support</span>
      </div>
      <p class="about-hero-text">IMuslimEd is an informational web service designed to support intercultural communication and build an inclusive educational environment for students of different faiths.</p>
      <p class="about-hero-text">The platform is focused on Muslim students and all learners interested in interfaith interaction and cultural dialogue.</p>
    </section>
    <section class="about-goal">
      <div class="about-chip">Service Goal</div>
      <p class="about-section-text">To provide convenient access to reliable information about Islamic traditions, religious practice, and cultural aspects, and to create a digital space for comfortable interaction in the university environment.</p>
    </section>
    <section class="about-features">
      <div class="about-chip">Core Features</div>
      <ul class="about-feature-list">
        <li>Verification and registration (login/password, and full name on first entry), plus welcome flow.</li>
        <li>Display of up-to-date prayer times with daily updates.</li>
        <li>Map points for places suitable for prayer.</li>
        <li>Halal food places marked on maps.</li>
        <li>An intelligent chatbot for religious, cultural, and educational questions.</li>
        <li>FAQ section with structured answers on key topics.</li>
        <li>User settings (clear history, service info, feedback).</li>
        <li>Feedback tools for suggestions and technical issue reports.</li>
        <li>Adaptive web interface for different devices.</li>
      </ul>
    </section>
    <section class="about-data">
      <div class="about-chip">Data and Access</div>
      <p class="about-section-text">User data is stored server-side in JSON format. Data processing is limited to the web app functionality. Access is controlled by the authorization mechanism.</p>
    </section>
    <section class="about-impact">
      <div class="about-quote">"May knowledge lead to mutual understanding"</div>
      <p class="about-section-text">IMuslimEd helps reduce intercultural barriers, supports communication, and assists student adaptation in the university environment.</p>
    </section>
  `
};

const FEEDBACK_CONTENT = {
  ru: `
    <p class="feedback-text">
      Для направления обращений, предложений или сообщений о технических ошибках воспользуйтесь электронной почтой:
      <a class="feedback-email" href="mailto:support@imuslimed.ru">support@imuslimed.ru</a>.
    </p>
    <p class="feedback-text">Все обращения рассматриваются администрацией сервиса в установленном порядке.</p>
    <p class="feedback-text">Мы ценим ваше мнение и стремимся к постоянному совершенствованию платформы.</p>
    <p class="feedback-sign">С уважением, IMuslimEd.</p>
  `,
  en: `
    <p class="feedback-text">
      To send requests, suggestions, or technical issue reports, please use email:
      <a class="feedback-email" href="mailto:support@imuslimed.ru">support@imuslimed.ru</a>.
    </p>
    <p class="feedback-text">All requests are reviewed by the service administration according to established procedures.</p>
    <p class="feedback-text">We value your feedback and continuously improve the platform.</p>
    <p class="feedback-sign">Best regards, IMuslimEd.</p>
  `
};

const PRAYER_CONTENT = {
  ru: `
    <h1 class="menu-full-title" id="prayerWindowTitle">В помощь студентам:<br>7 дуа для экзаменов и учебы</h1>
    <div class="prayer-intro-card">
      <p class="prayer-lead">Одна из лучших форм поклонения — дуа. Посредством дуа верующий приближается к Аллаху и имеет возможность обращаться к Нему напрямую.</p>
      <p class="prayer-quote">«Взывайте ко Мне, и Я отвечу вам». (40:60)</p>
      <p class="prayer-lead">Посланник Аллаха (ﷺ) сказал:</p>
      <p class="prayer-quote">«Дуа — это поклонение». (Абу Дауд, Тирмизи)</p>
      <p class="prayer-lead">Во время учёбы и подготовки к экзаменам особенно важно соединять старание с искренней мольбой. Ниже — дуа из Корана и Сунны, которые можно читать в такие периоды.</p>
    </div>
    <article class="dua-card"><h3 class="dua-title">Господи! Приумножь мои знания (20:114)</h3><p class="dua-arabic">رَّبِّ زِدْنِي عِلْمًا</p><p class="dua-translit">Рабби зидни ‘илма</p><p class="dua-meaning">Смысл: «Господи! Приумножь мои знания».</p></article>
    <article class="dua-card"><h3 class="dua-title">Дуа пророка Мусы (мир ему) (20:25-28)</h3><p class="dua-meaning">«Господи! Раскрой для меня мою грудь! Облегчи мою миссию! Развяжи узел на моем языке, чтобы они могли понять мою речь».</p><p class="dua-arabic">رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي يَفْقَهُوا قَوْلِي</p><p class="dua-translit">Рабби ишрах ли садри ва яссир ли амри вахлюль ‘укдата-м-мин ал-лисани яфкаху каули</p></article>
    <article class="dua-card"><h3 class="dua-title">О полезном знании и благом уделе</h3><p class="dua-meaning">«О Аллах! Поистине, я прошу у Тебя полезного знания, благого удела и такого дела, которое будет принято».</p><p class="dua-arabic">اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا</p><p class="dua-translit">Аллахумма инни ас’алюка ‘ильман нафи‘ан ва ризкан таййибан ва ‘амалян мутакаббалян</p></article>
    <article class="dua-card"><h3 class="dua-title">Дуа ангелов о знании (2:32)</h3><p class="dua-meaning">«Преславен Ты! Мы знаем только то, чему Ты научил нас. Воистину, Ты — Знающий, Мудрый».</p><p class="dua-arabic">سُبْحَانَكَ لاَ عِلْمَ لَنَا إِلاَّ مَا عَلَّمْتَنَا إِنَّكَ أَنتَ الْعَلِيمُ الْحَكِيمُ</p><p class="dua-translit">Субханака ла ‘илма лана илла ма ‘алламтана; иннака антал-’Алимуль-Хаким</p></article>
    <article class="dua-card"><h3 class="dua-title">Об облегчении и благом завершении (Тирмизи)</h3><p class="dua-meaning">«Господь мой! Облегчи для меня это дело и не усложняй его. Господь мой! Даруй мне благое завершение».</p><p class="dua-arabic">رَبِّ يَسِّرْ وَلَا تُعَسِّرْ، رَبِّ تَمِّمْ بِالْخَيْرِ</p><p class="dua-translit">Рабби йассир ва ля ту‘ассир. Рабби таммим биль-хайр</p></article>
    <article class="dua-card"><h3 class="dua-title">Нет лёгкого, кроме того, что Ты сделал лёгким</h3><p class="dua-meaning">«О Аллах, нет ничего лёгкого, кроме того, что Ты сделал лёгким, и если Ты пожелаешь, то сделаешь это затруднение лёгким».</p><p class="dua-arabic">اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا</p><p class="dua-translit">Аллахумма ля сахля илля ма джа’альтаху сахлян, ва Анта тадж’алюль-хазна иза ши’та сахлян</p></article>
    <article class="dua-card"><h3 class="dua-title">Защита от бесполезного знания</h3><p class="dua-meaning">«О Аллах, убереги меня от бесполезных знаний, несмиренного сердца, ненасыщающегося нафса и мольбы, которая остаётся без ответа».</p><p class="dua-arabic">اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لَا يَنْفَعُ وَمِنْ قَلْبٍ لَا يَخْشَعُ وَمِنْ نَفْسٍ لَا تَشْبَعُ وَمِنْ دَعْوَةٍ لَا يُسْتَجَابُ لَهَا</p><p class="dua-translit">Аллахумма инни а‘узу бика мин ‘ильмин ля янфа‘, ва мин кальбин ля яхша‘, ва мин нафсин ля ташба‘, ва мин да‘ватин ля юстаджабу ляха</p></article>
    <div class="prayer-outro-card">Каждый студент должен помнить: дуа сопровождается усердием и дисциплиной в учёбе. Знание в Исламе имеет особую ценность, поэтому важно серьёзно относиться к обучению.</div>
  `,
  en: `
    <h1 class="menu-full-title" id="prayerWindowTitle">For students:<br>7 Duas for Exams and Study</h1>
    <div class="prayer-intro-card">
      <p class="prayer-lead">One of the best forms of worship is dua. Through dua, a believer draws closer to Allah and can call upon Him directly.</p>
      <p class="prayer-quote">"Call upon Me, and I will answer you." (40:60)</p>
      <p class="prayer-lead">The Messenger of Allah (ﷺ) said:</p>
      <p class="prayer-quote">"Dua is worship." (Abu Dawud, Tirmidhi)</p>
      <p class="prayer-lead">During study and exam preparation, it is important to combine effort with sincere supplication. Below are duas from the Quran and Sunnah that can be read in these periods.</p>
    </div>
    <article class="dua-card"><h3 class="dua-title">My Lord, Increase Me in Knowledge (20:114)</h3><p class="dua-arabic">رَّبِّ زِدْنِي عِلْمًا</p><p class="dua-translit">Rabbi zidni 'ilma</p><p class="dua-meaning">Meaning: "My Lord, increase me in knowledge."</p></article>
    <article class="dua-card"><h3 class="dua-title">Dua of Prophet Musa (peace be upon him) (20:25-28)</h3><p class="dua-meaning">"My Lord, expand my chest, ease my task for me, and untie the knot from my tongue so that they may understand my speech."</p><p class="dua-arabic">رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي يَفْقَهُوا قَوْلِي</p><p class="dua-translit">Rabbi ishrah li sadri wa yassir li amri wahlul 'uqdatan min lisani yafqahu qawli</p></article>
    <article class="dua-card"><h3 class="dua-title">For Beneficial Knowledge and Blessed Provision</h3><p class="dua-meaning">"O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds."</p><p class="dua-arabic">اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا</p><p class="dua-translit">Allahumma inni as'aluka 'ilman nafi'an wa rizqan tayyiban wa 'amalan mutaqabbalan</p></article>
    <article class="dua-card"><h3 class="dua-title">Angels' Dua About Knowledge (2:32)</h3><p class="dua-meaning">"Glory be to You. We have no knowledge except what You have taught us. Indeed, You are the All-Knowing, All-Wise."</p><p class="dua-arabic">سُبْحَانَكَ لاَ عِلْمَ لَنَا إِلاَّ مَا عَلَّمْتَنَا إِنَّكَ أَنتَ الْعَلِيمُ الْحَكِيمُ</p><p class="dua-translit">Subhanaka la 'ilma lana illa ma 'allamtana innaka anta al-'Alim al-Hakim</p></article>
    <article class="dua-card"><h3 class="dua-title">For Ease and Good Completion (Tirmidhi)</h3><p class="dua-meaning">"My Lord, make it easy and do not make it difficult. My Lord, grant good completion."</p><p class="dua-arabic">رَبِّ يَسِّرْ وَلَا تُعَسِّرْ، رَبِّ تَمِّمْ بِالْخَيْرِ</p><p class="dua-translit">Rabbi yassir wa la tu'assir, Rabbi tammim bil-khayr</p></article>
    <article class="dua-card"><h3 class="dua-title">Nothing Is Easy Except What You Make Easy</h3><p class="dua-meaning">"O Allah, nothing is easy except what You make easy, and You can make hardship easy if You will."</p><p class="dua-arabic">اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا</p><p class="dua-translit">Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alu al-hazna idha shi'ta sahla</p></article>
    <article class="dua-card"><h3 class="dua-title">Protection from Useless Knowledge</h3><p class="dua-meaning">"O Allah, I seek refuge in You from knowledge that does not benefit, from a heart that does not humble itself, from a soul that is never satisfied, and from a supplication that is not answered."</p><p class="dua-arabic">اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لَا يَنْفَعُ وَمِنْ قَلْبٍ لَا يَخْشَعُ وَمِنْ نَفْسٍ لَا تَشْبَعُ وَمِنْ دَعْوَةٍ لَا يُسْتَجَابُ لَهَا</p><p class="dua-translit">Allahumma inni a'udhu bika min 'ilmin la yanfa', wa min qalbin la yakhsha', wa min nafsin la tashba', wa min da'watin la yustajabu laha</p></article>
    <div class="prayer-outro-card">Every student should remember: dua goes together with effort and discipline in study. Knowledge has high value in Islam, so learning should be treated with seriousness and care.</div>
  `
};

const ALLAH_99_NAMES = [
  ["Аллах", "الله", "Единственный Бог, Обладатель божественности"],
  ["Ар-Рахман", "الرحمن", "Всеобъемлюще Милостивый"],
  ["Ар-Рахим", "الرحيم", "Особо Милующий верующих"],
  ["Аль-Малик", "الملك", "Владыка"],
  ["Аль-Куддус", "القدوس", "Пресвятой"],
  ["Ас-Салям", "السلام", "Источник мира и безопасности"],
  ["Аль-Му’мин", "المؤمن", "Дарующий защиту и уверенность"],
  ["Аль-Мухаймин", "المهيمن", "Хранитель и Попечитель"],
  ["Аль-Азиз", "العزيز", "Всемогущий"],
  ["Аль-Джаббар", "الجبار", "Обладающий непреодолимой властью"],
  ["Аль-Мутакаббир", "المتكبر", "Превознесённый"],
  ["Аль-Халик", "الخالق", "Творец"],
  ["Аль-Бари", "البارئ", "Создатель из небытия"],
  ["Аль-Мусаввир", "المصور", "Дарующий облик"],
  ["Аль-Гаффар", "الغفار", "Многократно Прощающий"],
  ["Аль-Каххар", "القهار", "Всепобеждающий"],
  ["Аль-Ваххаб", "الوهاب", "Щедро Дарующий"],
  ["Ар-Раззак", "الرزاق", "Наделяющий пропитанием"],
  ["Аль-Фаттах", "الفتاح", "Открывающий"],
  ["Аль-Алим", "العليم", "Всеведущий"],
  ["Аль-Кабид", "القابض", "Сжимающий"],
  ["Аль-Басит", "الباسط", "Расширяющий"],
  ["Аль-Хафид", "الخافض", "Унижающий"],
  ["Ар-Рафи‘", "الرافع", "Возвышающий"],
  ["Аль-Му‘изз", "المعز", "Дарующий честь"],
  ["Аль-Музилль", "المذل", "Унижающий"],
  ["Ас-Сами‘", "السميع", "Всеслышащий"],
  ["Аль-Басыр", "البصير", "Всевидящий"],
  ["Аль-Хакам", "الحكم", "Судящий"],
  ["Аль-‘Адль", "العدل", "Справедливый"],
  ["Аль-Латиф", "اللطيف", "Тонко Знающий"],
  ["Аль-Хабир", "الخبير", "Всеведающий"],
  ["Аль-Халим", "الحليم", "Кроткий"],
  ["Аль-‘Азим", "العظيم", "Великий"],
  ["Аль-Гафур", "الغفور", "Прощающий"],
  ["Аш-Шакур", "الشكور", "Благодарный (Вознаграждающий)"],
  ["Аль-‘Алий", "العلي", "Возвышенный"],
  ["Аль-Кабир", "الكبير", "Великий"],
  ["Аль-Хафиз", "الحفيظ", "Хранитель"],
  ["Аль-Мукит", "المقيت", "Поддерживающий"],
  ["Аль-Хасиб", "الحسيب", "Достаточный"],
  ["Аль-Джалиль", "الجليل", "Величественный"],
  ["Аль-Карим", "الكريم", "Щедрый"],
  ["Ар-Ракиб", "الرقيب", "Наблюдающий"],
  ["Аль-Муджиб", "المجيب", "Отвечающий на мольбы"],
  ["Аль-Васи‘", "الواسع", "Всеобъемлющий"],
  ["Аль-Хаким", "الحكيم", "Мудрый"],
  ["Аль-Вадуд", "الودود", "Любящий"],
  ["Аль-Маджид", "المجيد", "Преславный"],
  ["Аль-Ба‘ис", "الباعث", "Воскрешающий"],
  ["Аш-Шахид", "الشهيد", "Свидетель"],
  ["Аль-Хакк", "الحق", "Истина"],
  ["Аль-Вакил", "الوكيل", "Попечитель"],
  ["Аль-Кавий", "القوي", "Сильный"],
  ["Аль-Матин", "المتين", "Крепкий"],
  ["Аль-Валий", "الولي", "Покровитель"],
  ["Аль-Хамид", "الحميد", "Достохвальный"],
  ["Аль-Мухси", "المحصي", "Учитывающий"],
  ["Аль-Мубди’", "المبدئ", "Начинающий творение"],
  ["Аль-Му‘ид", "المعيد", "Возвращающий"],
  ["Аль-Мухйи", "المحيي", "Оживляющий"],
  ["Аль-Мумит", "المميت", "Умерщвляющий"],
  ["Аль-Хайй", "الحي", "Живой"],
  ["Аль-Кайюм", "القيوم", "Самосущий"],
  ["Аль-Ваджид", "الواجد", "Обладающий всем"],
  ["Аль-Маджид", "الماجد", "Славный"],
  ["Аль-Вахид", "الواحد", "Единый"],
  ["Аль-Ахад", "الاحد", "Единственный"],
  ["Ас-Самад", "الصمد", "Абсолютно Самодостаточный"],
  ["Аль-Кадир", "القادر", "Всемогущий"],
  ["Аль-Муктадир", "المقتدر", "Обладающий совершенной мощью"],
  ["Аль-Мукаддим", "المقدم", "Выдвигающий вперёд"],
  ["Аль-Муаххир", "المؤخر", "Отодвигающий"],
  ["Аль-Авваль", "الأول", "Первый"],
  ["Аль-Ахир", "الأخر", "Последний"],
  ["Аз-Захир", "الظاهر", "Явный по Своим знамениям"],
  ["Аль-Батин", "الباطن", "Непостижимый сущностно"],
  ["Аль-Вали", "الوالي", "Управляющий"],
  ["Аль-Мута‘али", "المتعالي", "Превознесённый"],
  ["Аль-Барр", "البر", "Благостный"],
  ["Ат-Тавваб", "التواب", "Принимающий покаяние"],
  ["Аль-Мунтаким", "المنتقم", "Воздающий"],
  ["Аль-‘Афувв", "العفو", "Прощающий"],
  ["Ар-Ра’уф", "الرؤوف", "Сострадательный"],
  ["Малик уль-Мульк", "مالك الملك", "Владыка владычества"],
  ["Зуль-Джаляли уаль-Икрам", "ذو الجلال والإكرام", "Обладатель Величия и Щедрости"],
  ["Аль-Муксит", "المقسط", "Справедливо Распределяющий"],
  ["Аль-Джами‘", "الجامع", "Собирающий"],
  ["Аль-Ганий", "الغني", "Богатый, Ни в чём не нуждающийся"],
  ["Аль-Мугни", "المغني", "Обогащающий"],
  ["Аль-Мани‘", "المانع", "Удерживающий"],
  ["Ад-Дарр", "الضار", "Допускающий вред по Своей мудрости"],
  ["Ан-Нафи‘", "النافع", "Приносящий пользу"],
  ["Ан-Нур", "النور", "Свет"],
  ["Аль-Хади", "الهادي", "Ведущий прямым путём"],
  ["Аль-Бади‘", "البديع", "Создающий без примера"],
  ["Аль-Бакы", "الباقي", "Вечный"],
  ["Аль-Варис", "الوارث", "Наследующий"],
  ["Ас-Сабур", "الصبور", "Терпеливый"]
];

const ALLAH_99_MEANINGS_EN = [
  "The One God, Possessor of Divinity",
  "The Most Compassionate",
  "The Most Merciful",
  "The Sovereign",
  "The Most Holy",
  "The Source of Peace and Safety",
  "The Giver of Security and Faith",
  "The Guardian and Overseer",
  "The Almighty",
  "The Compeller",
  "The Supreme",
  "The Creator",
  "The Evolver",
  "The Fashioner",
  "The Great Forgiver",
  "The All-Subduer",
  "The Bestower",
  "The Provider",
  "The Opener",
  "The All-Knowing",
  "The Withholder",
  "The Expander",
  "The Reducer",
  "The Exalter",
  "The Honorer",
  "The Humiliator",
  "The All-Hearing",
  "The All-Seeing",
  "The Judge",
  "The Utterly Just",
  "The Subtle and Gentle",
  "The All-Aware",
  "The Forbearing",
  "The Magnificent",
  "The Forgiving",
  "The Appreciative",
  "The Most High",
  "The Most Great",
  "The Preserver",
  "The Sustainer",
  "The Reckoner",
  "The Majestic",
  "The Generous",
  "The Watchful",
  "The Responsive",
  "The All-Encompassing",
  "The Wise",
  "The Loving",
  "The Glorious",
  "The Resurrector",
  "The Witness",
  "The Truth",
  "The Trustee",
  "The Strong",
  "The Firm",
  "The Protecting Friend",
  "The Praiseworthy",
  "The Counter",
  "The Originator",
  "The Restorer",
  "The Giver of Life",
  "The Creator of Death",
  "The Ever-Living",
  "The Self-Subsisting",
  "The Finder",
  "The Illustrious",
  "The One",
  "The Unique",
  "The Eternal Refuge",
  "The Powerful",
  "The Omnipotent",
  "The Expediter",
  "The Delayer",
  "The First",
  "The Last",
  "The Manifest",
  "The Hidden",
  "The Governor",
  "The Most Exalted",
  "The Source of Goodness",
  "The Accepter of Repentance",
  "The Avenger",
  "The Pardoner",
  "The Most Kind",
  "Owner of Sovereignty",
  "Lord of Majesty and Honor",
  "The Equitable",
  "The Gatherer",
  "The Self-Sufficient",
  "The Enricher",
  "The Preventer",
  "The Afflicter (by wisdom)",
  "The Benefactor",
  "The Light",
  "The Guide",
  "The Incomparable Originator",
  "The Everlasting",
  "The Inheritor",
  "The Most Patient"
];

function getAllah99NamesForLanguage() {
  if (currentLanguage !== "en") return ALLAH_99_NAMES;
  return ALLAH_99_NAMES.map(([name, arabic], idx) => [
    translitRuToLat(name),
    arabic,
    ALLAH_99_MEANINGS_EN[idx] || ""
  ]);
}

//  основные функции 
function getWindowKey(windowElement) {
  if (windowElement === mainWindow) return "main";
  if (windowElement === chatWindow) return "chat";
  if (windowElement === majorWindow) return "major";
  if (windowElement === settingsWindow) return "settings";
  if (windowElement === menuWindow) return "menu";
  if (windowElement === menuPrayerWindow) return "menu_prayer";
  if (windowElement === menuNames99Window) return "menu_names99";
  return "";
}

function getWindowByKey(windowKey) {
  if (windowKey === "main") return mainWindow;
  if (windowKey === "chat") return chatWindow;
  if (windowKey === "major") return majorWindow;
  if (windowKey === "settings") return settingsWindow;
  if (windowKey === "menu") return menuWindow;
  if (windowKey === "menu_prayer") return menuPrayerWindow;
  if (windowKey === "menu_names99") return menuNames99Window;
  return null;
}

function rememberAuthorizedWindow(windowElement) {
  const key = getWindowKey(windowElement);
  if (!key) return;
  activeMainWindow = windowElement;
  localStorage.setItem(LAST_AUTH_WINDOW_KEY, key);
}

function getRememberedAuthorizedWindow() {
  return getWindowByKey(localStorage.getItem(LAST_AUTH_WINDOW_KEY) || "");
}

function t(key) {
  return (UI_TEXT[currentLanguage] && UI_TEXT[currentLanguage][key]) || (UI_TEXT.ru && UI_TEXT.ru[key]) || key;
}

function renderTasbihCount() {
  if (!tasbihCounterValueEl) return;
  tasbihCounterValueEl.textContent = String(tasbihCount);
}

function setTasbihCount(value) {
  const next = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  tasbihCount = next;
  localStorage.setItem(TASBIH_COUNT_KEY, String(tasbihCount));
  renderTasbihCount();
}

function applyLanguage(lang) {
  currentLanguage = (String(lang || "").toLowerCase().startsWith("en")) ? "en" : "ru";
  localStorage.setItem(APP_LANGUAGE_KEY, currentLanguage);
  document.documentElement.lang = currentLanguage;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  const setHtml = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  };
  const setTextBySelector = (selector, value) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  };

  setTextBySelector(".muiv-header-text", t("muiv_header"));
  setText("religionQuestionText", t("religion_question"));
  setText("registrationHeaderText", t("registration_header"));
  setText("authTitleText", t("auth_title"));
  setText("fioTitleText", t("fio_title"));
  setText("loginBtn", t("login_btn"));
  setText("saveFioBtn", t("continue_btn"));
  setText("askQuestionBtn", t("ask_btn"));
  setText("openMajorBtn", t("home_btn"));
  setText("menuHomeText", t("menu_home"));
  setText("menuChatText", t("menu_chat"));
  setText("menuPrayerText", t("menu_prayer"));
  setText("menuNamesText", t("menu_names"));
  setText("menuSettingsText", t("menu_settings"));
  setText("settingsMainTitleText", t("settings_title"));
  setText("clearHistoryText", t("clear_history"));
  setText("aboutServiceText", t("about_service"));
  setText("feedbackText", t("feedback"));
  setText("aboutPopupTitleText", t("about_popup_title"));
  setText("feedbackPopupTitleText", t("feedback_popup_title"));
  setText("languageText", t("language"));
  setText("qiblaTitleText", t("qibla_title"));
  setText("qiblaCoordsLabelText", t("qibla_coords_label"));
  setText("qiblaDirectionLabelText", t("qibla_direction_label"));
  setText("qiblaPopupTitleText", t("qibla_popup_title"));
  setText("qiblaPopupCoordsLabelText", t("qibla_coords_label"));
  setText("qiblaPopupDirectionLabelText", t("qibla_direction_label"));
  setText("tasbihPopupTitleText", t("tasbih_popup_title"));
  setText("tasbihCounterLabelText", t("tasbih_counter_label"));
  setText("tasbihResetText", t("tasbih_reset"));
  setText("logoutText", t("logout"));
  setText("languagePopupTitle", t("language_popup_title"));
  setText("languageRuBtn", t("language_ru"));
  setText("languageEnBtn", t("language_en"));
  if (quickLanguageTitleEl) quickLanguageTitleEl.textContent = t("language");
  setText("quickLanguageRuBtn", t("language_ru"));
  setText("quickLanguageEnBtn", t("language_en"));
  const prayerTitleEl = document.getElementById("prayerWindowTitle");
  if (prayerTitleEl) prayerTitleEl.innerHTML = t("prayer_title");
  const namesTitleEl = document.getElementById("namesWindowTitle");
  if (namesTitleEl) namesTitleEl.textContent = t("names_title");
  setText("clearHistoryPopupTitle", t("clear_history_popup_title"));
  setText("clearHistoryPopupText", t("clear_history_popup_text"));
  setText("confirmClearHistoryNo", t("no"));
  setText("confirmClearHistoryYes", t("yes"));
  setText("logoutConfirmText", t("logout_confirm"));
  setText("cancelLogoutBtn", t("cancel"));
  setText("confirmLogoutBtn", t("ok"));
  setText("loadingText", t("loading_auth"));
  setText("mainWelcomeLine1", t("main_welcome_line1"));
  setText("mainWelcomeLine2", t("main_welcome_line2"));
  setText("majorTitleText", t("major_title"));
  setText("majorQuoteText", t("major_quote"));
  const majorQuoteEl = document.getElementById("majorQuoteText");
  if (majorQuoteEl) {
    majorQuoteEl.classList.toggle("is-en", currentLanguage === "en");
  }
  setHtml("majorPrayerText", t("major_prayer"));
  setHtml("majorMosqueText", t("major_mosque"));
  setHtml("majorFaqText", t("major_faq"));
  setHtml("majorHalalText", t("major_halal"));
  setText("centerInfoPopupTitleText", t("center_info_popup_title"));
  setText("prayerPopupTitleText", t("prayer_popup_title"));
  setText("faqPopupTitleText", t("faq_popup_title"));
  setText("halalPopupTitleText", t("halal_popup_title"));
  setText("mosquePopupTitleText", t("mosque_popup_title"));
  setText("miniAlertOk", t("ok"));
  if (miniAlertText && (miniAlertText.textContent === UI_TEXT.ru.mini_message_default || miniAlertText.textContent === UI_TEXT.en.mini_message_default)) {
    miniAlertText.textContent = t("mini_message_default");
  }

  if (loginInput) loginInput.placeholder = t("login_placeholder");
  if (passwordInput) passwordInput.placeholder = t("password_placeholder");
  if (fioInput) fioInput.placeholder = t("fio_placeholder");
  if (chatInput) chatInput.placeholder = t("chat_placeholder");
  updateProfileNameLabel();

  if (languageRuBtn) languageRuBtn.classList.toggle("active", currentLanguage === "ru");
  if (languageEnBtn) languageEnBtn.classList.toggle("active", currentLanguage === "en");
  if (quickLanguageRuBtn) quickLanguageRuBtn.classList.toggle("active", currentLanguage === "ru");
  if (quickLanguageEnBtn) quickLanguageEnBtn.classList.toggle("active", currentLanguage === "en");

  updateChatDateLabel();
  renderPrayerContentByLanguage();
  renderFaqByLanguage();
  renderSettingsContentByLanguage();
  initNames99Grid();
  renderTasbihCount();
}

function updateProfileNameLabel() {
  if (!profileName) return;
  const savedFio = (localStorage.getItem("fio") || "").trim();
  const low = savedFio.toLowerCase();
  const isPlaceholder = !savedFio || low === "фио" || low === "full name";
  const value = isPlaceholder ? t("profile_name_placeholder") : savedFio;
  profileName.textContent = currentLanguage === "en" ? translitRuToLat(value) : value;
}

function translitRuToLat(text) {
  const map = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
  };
  return String(text || "").replace(/[А-Яа-яЁё]/g, (ch) => {
    const lower = ch.toLowerCase();
    const lat = map[lower] ?? ch;
    if (ch === lower) return lat;
    return lat ? lat[0].toUpperCase() + lat.slice(1) : "";
  });
}

function updateChatDateLabel() {
  if (!chatDateEl) return;
  const now = new Date();
  let lastDate = null;

  for (let i = chatMessages.length - 1; i >= 0; i--) {
    const createdAt = chatMessages[i] && chatMessages[i].created_at;
    if (!createdAt) continue;
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      lastDate = parsed;
      break;
    }
  }

  if (!lastDate) {
    chatDateEl.textContent = t("today");
    return;
  }

  const isToday =
    lastDate.getFullYear() === now.getFullYear() &&
    lastDate.getMonth() === now.getMonth() &&
    lastDate.getDate() === now.getDate();

  if (isToday) {
    chatDateEl.textContent = t("today");
    return;
  }

  chatDateEl.textContent = lastDate.toLocaleDateString(currentLanguage === "en" ? "en-US" : "ru-RU", {
    day: "numeric",
    month: "long"
  });
}

function scrollChatToBottom() {
  if (!messageContainer) return;
  messageContainer.scrollTop = messageContainer.scrollHeight;
  requestAnimationFrame(() => {
    messageContainer.scrollTop = messageContainer.scrollHeight;
  });
  setTimeout(() => {
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }, 60);
}

function isChatNearBottom(threshold = 28) {
  if (!messageContainer) return true;
  const distance = messageContainer.scrollHeight - messageContainer.clientHeight - messageContainer.scrollTop;
  return distance <= threshold;
}

function resizeChatInput() {
  if (!chatInput) return;
  const minHeight = 18;
  const maxHeight = 78;
  chatInput.style.height = `${minHeight}px`;
  const nextHeight = Math.min(chatInput.scrollHeight, maxHeight);
  chatInput.style.height = `${nextHeight}px`;
  chatInput.style.overflowY = chatInput.scrollHeight > maxHeight ? "auto" : "hidden";
}

function hasBlockingChildPopupOpen() {
  const childPopups = [
    prayerPopupEl,
    faqPopupEl,
    halalPopupEl,
    mosquePopupEl,
    aboutPopupEl,
    feedbackPopupEl,
    qiblaPopupEl,
    tasbihPopupEl,
    clearHistoryConfirmPopupEl,
    logoutConfirmPopupEl,
    languagePopupEl,
    quickLanguagePopupEl,
    miniAlertPopup,
    menuPrayerPopupEl,
    menuNames99PopupEl
  ];
  return childPopups.some((popup) => popup && popup.style.display === 'block');
}

function setQuickLanguageOpenState(isOpen) {
  if (!islamPopupBody) return;
  islamPopupBody.classList.toggle("quick-language-open", !!isOpen);
}

function positionLogoutConfirmPopup() {
  if (!logoutConfirmPopupEl || !logoutMiniBox) return;
  const candidates = [
    settingsWindow,
    majorWindow,
    chatWindow,
    menuWindow,
    mainWindow,
    authPopup,
    fioPopup,
    islamPopup
  ];
  const anchor = candidates.find((el) => el && el.style.display === "block");
  if (!anchor) {
    logoutMiniBox.style.left = "50%";
    logoutMiniBox.style.top = "50%";
    return;
  }
  const rect = anchor.getBoundingClientRect();
  logoutMiniBox.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
  logoutMiniBox.style.top = `${Math.round(rect.top + rect.height / 2)}px`;
}

function initNames99Grid() {
  if (!names99Grid) return;
  names99Grid.innerHTML = "";
  const namesData = getAllah99NamesForLanguage();

  namesData.forEach((item, index) => {
    const [translit, arabic, meaning] = item;
    const card = document.createElement("div");
    card.className = "name99-card";
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    const order = document.createElement("div");
    order.className = "name99-index";
    order.textContent = `${index + 1}.`;

    const translitEl = document.createElement("div");
    translitEl.className = "name99-translit";
    translitEl.textContent = translit;

    const arabicEl = document.createElement("div");
    arabicEl.className = "name99-arabic";
    arabicEl.textContent = arabic;

    const meaningEl = document.createElement("div");
    meaningEl.className = "name99-meaning";
    meaningEl.textContent = meaning;

    card.appendChild(order);
    card.appendChild(translitEl);
    card.appendChild(arabicEl);
    card.appendChild(meaningEl);

    const activateCard = () => {
      const cards = names99Grid.querySelectorAll(".name99-card");
      const isAlreadyActive = card.classList.contains("active");
      cards.forEach((c) => c.classList.remove("active"));
      if (!isAlreadyActive) {
        card.classList.add("active");
      }
    };

    card.addEventListener("click", activateCard);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateCard();
      }
    });

    names99Grid.appendChild(card);
  });
}

function updateParentWindowEffects() {
  const majorChildOpen = [prayerPopupEl, faqPopupEl, halalPopupEl, mosquePopupEl]
    .some((popup) => popup && popup.style.display === 'block');
  const settingsChildOpen = [aboutPopupEl, feedbackPopupEl, languagePopupEl, qiblaPopupEl, tasbihPopupEl]
    .some((popup) => popup && popup.style.display === 'block');
  const settingsConfirmOpen = (
    (clearHistoryConfirmPopupEl && clearHistoryConfirmPopupEl.style.display === 'block') ||
    (logoutConfirmPopupEl && logoutConfirmPopupEl.style.display === 'block')
  );

  if (majorWindow) {
    majorWindow.classList.toggle('parent-dimmed', majorChildOpen);
  }
  if (settingsWindow) {
    settingsWindow.classList.toggle('parent-dimmed', settingsChildOpen || settingsConfirmOpen);
  }
}

// показать попап (заменяет другие окна)
function showPopup(popupElement) {
  if (!popupElement) {
    console.error("popup element not found!");
    return;
  }
  
  // скрыть только основные окна, но не дочерние 
  const mainPopups = [
    islamPopup, authPopup, authLoading, mainWindow, 
    chatWindow, menuWindow, settingsWindow, majorWindow, fioPopup, menuPrayerWindow, menuNames99Window
  ];
  
  mainPopups.forEach(popup => {
    if (popup && popup.style.display === 'block' && popup !== popupElement) {
      hidePopup(popup);
    }
  });
  
  // показываем текущий
  popupElement.style.display = 'block';
  popupElement.classList.remove('popup-hidden');
  popupElement.classList.add('popup-visible');
  if (popupElement === chatWindow) {
    scrollChatToBottom();
  }
  
  console.log("showing popup:", popupElement.id);
}

// показать дочернее окно (поверх текущего, не закрывая его)
function showChildPopup(popupElement) {
  if (!popupElement) {
    console.error("child popup element not found!");
    return;
  }
  
  // не закрывать другие окна, показ дочерних поверх
  popupElement.style.display = 'block';
  popupElement.classList.remove('popup-hidden');
  popupElement.classList.add('popup-visible');
  
  // устанавливаем высокий z-index
  popupElement.style.zIndex = '2000';
  updateParentWindowEffects();
  
  console.log("showing child popup:", popupElement.id);
}

// скрыть попап с анимацией
function hidePopup(popupElement) {
  if (!popupElement) return;
  
  popupElement.classList.remove('popup-visible');
  popupElement.classList.add('popup-hidden');
  
  setTimeout(() => {
    popupElement.classList.remove('popup-hidden');
    popupElement.style.display = 'none';
    // сброс z-index
    popupElement.style.zIndex = '';
    updateParentWindowEffects();
    
    console.log("hiding popup:", popupElement.id);
  }, 180);
}

// скрыть все попапы
function hideAllPopups() {
  const allPopups = [
    islamPopup, authPopup, authLoading, mainWindow, 
    chatWindow, menuWindow, settingsWindow, majorWindow, centerInfoPopupEl,
    fioPopup, prayerPopupEl, faqPopupEl, centerInfoPopupEl, aboutPopupEl, feedbackPopupEl, languagePopupEl, qiblaPopupEl, tasbihPopupEl, quickLanguagePopupEl, halalPopupEl, mosquePopupEl, clearHistoryConfirmPopupEl, logoutConfirmPopupEl, menuPrayerPopupEl, menuNames99PopupEl, menuPrayerWindow, menuNames99Window
  ];
  
  allPopups.forEach(popup => {
    if (popup && popup.style.display === 'block') {
      hidePopup(popup);
    }
  });
  setQuickLanguageOpenState(false);
}

// функция переключения главных окон
function switchMainWindow(windowElement) {
  const mainWindows = [majorWindow, centerInfoPopupEl, chatWindow, settingsWindow, menuPrayerWindow, menuNames99Window];

  // если целевое окно уже открыто — ничего не делаем
  if (windowElement && windowElement.style.display === 'block') {
    rememberAuthorizedWindow(windowElement);
    return;
  }

  // закрываем все окна
  mainWindows.forEach(win => {
    if (win && win.style.display === 'block') {
      hidePopup(win);
    }
  });

  // открываем новое окно
  setTimeout(() => {
    showPopup(windowElement);
    rememberAuthorizedWindow(windowElement);
  }, 50);
}

function initEventListeners() {
  if (miniAlertOk) {
    miniAlertOk.addEventListener("click", function(e) {
      e.stopPropagation();
      hideMiniAlert();
    });
  }
  
  // ================ универсальная логика луны ================
  // основная кнопка (луна) — работает с любым окном
  if (openIslamBtn) {
    // удаляем старый обработчик
    const newIslamBtn = openIslamBtn.cloneNode(true);
    openIslamBtn.parentNode.replaceChild(newIslamBtn, openIslamBtn);
    
    newIslamBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log("луна нажата");
      setQuickLanguageOpenState(false);
      hidePopup(logoutConfirmPopupEl);
      hidePopup(quickLanguagePopupEl);
      hidePopup(qiblaPopupEl);
      hidePopup(tasbihPopupEl);
      hidePopup(centerInfoPopupEl);

      const isAuthorized = localStorage.getItem("isAuthorized");
      const savedFio = localStorage.getItem("fio");
      
      // ========== 1. не авторизован ==========
      if (isAuthorized !== "true" || !savedFio) {
        
        // проверяем подтверждал ли ислам
        if (!islamConfirmed) {
          // если ислам не подтвержден — работаем с красным окном
          if (islamPopup.style.display === 'block') {
            setQuickLanguageOpenState(false);
            hidePopup(quickLanguagePopupEl);
            hidePopup(islamPopup);
          } else {
            showPopup(islamPopup);
          }
          return;
        }
        
        // если ислам подтвержден — работаем с окнами авторизации
        // определяем текущее открытое окно авторизации
        const authWindows = [authPopup, fioPopup, authLoading];
        let openAuthWindow = null;
        
        for (let win of authWindows) {
          if (win && win.style.display === 'block') {
            openAuthWindow = win;
            break;
          }
        }
        
        // если какое-то окно авторизации открыто — закрываем его
        if (openAuthWindow) {
          hidePopup(openAuthWindow);
          console.log("закрыто окно авторизации:", openAuthWindow.id);
          return;
        }
        
        // если ничего не открыто — открываем последнее активное окно авторизации
        // проверяем, был ли уже ввод логина/пароля
        if (currentLogin && currentPassword) {
          // если уже есть данные, значит переходим к фио
          console.log("открываем окно фио");
          showPopup(fioPopup);
        } else {
          // иначе открываем окно авторизации
          console.log("открываем окно авторизации");
          showPopup(authPopup);
        }
        return;
      }
      
      // ========== 2. авторизован ==========
      updateProfileNameLabel();
      
      // все основные окна авторизованного пользователя
      const mainUserWindows = [mainWindow, majorWindow, centerInfoPopupEl, chatWindow, settingsWindow, menuWindow, menuPrayerWindow, menuNames99Window];
      let openMainWindow = null;
      
      for (let win of mainUserWindows) {
        if (win && win.style.display === 'block') {
          openMainWindow = win;
          break;
        }
      }
      
      // если какое-то окно открыто — закрываем его
      if (openMainWindow) {
        hidePopup(openMainWindow);
        // запоминаем последнее активное окно, включая меню
        rememberAuthorizedWindow(openMainWindow);
        console.log("закрыто окно:", openMainWindow.id);
        return;
      }
      
      // если ничего не открыто — открываем последнее активное окно или главную
      if (!activeMainWindow) {
        activeMainWindow = getRememberedAuthorizedWindow();
      }

      if (activeMainWindow) {
        console.log("открываем последнее окно:", activeMainWindow.id);
        showPopup(activeMainWindow);
      } else {
        console.log("открываем окно приветствия");
        showPopup(mainWindow);
        rememberAuthorizedWindow(mainWindow);
      }
    });
    
    window.openIslamBtn = newIslamBtn;
    console.log("луна: универсальный обработчик установлен");
  }
  
  // кнопки закрытия
  if (closePopup) closePopup.addEventListener("click", () => {
    setQuickLanguageOpenState(false);
    hidePopup(quickLanguagePopupEl);
    hidePopup(islamPopup);
  });
  if (closeAuth) closeAuth.addEventListener("click", () => hidePopup(authPopup));
  if (closeLoading) closeLoading.addEventListener("click", () => hidePopup(authLoading));
  if (closeMain) closeMain.addEventListener("click", () => {
    hidePopup(mainWindow);
    rememberAuthorizedWindow(mainWindow);
  });
  if (closeChat) closeChat.addEventListener("click", () => hidePopup(chatWindow));
  if (closeFio) closeFio.addEventListener("click", () => {
    hidePopup(fioPopup);
    console.log("окно фио закрыто, данные сохранены");
  });

  quickLanguageBtn?.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!quickLanguagePopupEl) return;
    if (quickLanguagePopupEl.style.display === "block") {
      setQuickLanguageOpenState(false);
      hidePopup(quickLanguagePopupEl);
      return;
    }
    setQuickLanguageOpenState(true);
    showChildPopup(quickLanguagePopupEl);
  });

  quickLanguageRuBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    applyLanguage("ru");
    setQuickLanguageOpenState(false);
    hidePopup(quickLanguagePopupEl);
  });

  quickLanguageEnBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    applyLanguage("en");
    setQuickLanguageOpenState(false);
    hidePopup(quickLanguagePopupEl);
  });
  
  // переключатель  
  if (toggle) {
    toggle.addEventListener("change", function() {
      if (this.checked) {
        islamAccepted = true;
        islamConfirmed = true;
        localStorage.setItem("islamConfirmed", "true"); 
        this.disabled = true;
        
        setTimeout(() => {
          setQuickLanguageOpenState(false);
          hidePopup(quickLanguagePopupEl);
          hidePopup(islamPopup);
          setTimeout(() => showPopup(authPopup), 200);
        }, 400);
      }
    });
  }
  
  // кнопка входа
  if (loginBtn) {
    loginBtn.addEventListener("click", handleLogin);
  }
  
  // кнопка сохранения фио
  if (saveFioBtn) {
    saveFioBtn.addEventListener("click", handleSaveFio);
  }
  
  // показать/скрыть пароль
  if (togglePassword) {
    togglePassword.addEventListener("click", function() {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      if (passwordIcon) {
        passwordIcon.src = type === "password" 
          ? "/static/eye_closed.png" 
          : "/static/eye_open.png";
      }
    });
  }
  
  // кнопка чата
  if (chatBtn) chatBtn.addEventListener("click", () => {
    hidePopup(mainWindow);     
    showPopup(chatWindow);    
    rememberAuthorizedWindow(chatWindow);
    scrollChatToBottom();
  });

  // кнопка перехода на главный экран с картами
  if (openMajorBtn) openMajorBtn.addEventListener("click", () => {
    hidePopup(mainWindow);
    showPopup(majorWindow);
    rememberAuthorizedWindow(majorWindow);
  });
  
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);
  
  // кнопка меню (3 полоски) 
  if (menuButtons && menuButtons.length > 0) {
    menuButtons.forEach(btn => {
      btn.addEventListener("click", function(e) {
        if (hasBlockingChildPopupOpen()) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        e.preventDefault();
        console.log("меню открыто через:", this);
        
        if (menuWindow) {
          showPopup(menuWindow);
          rememberAuthorizedWindow(menuWindow);
        }
      });
    });
    console.log(`attached menu listeners to ${menuButtons.length} button(s)`);
  }
  
  // закрытие меню
  if (menuClose) {
    menuClose.addEventListener("click", function(e) {
      e.stopPropagation();
      e.preventDefault();
      hidePopup(menuWindow);
    });
  }
    
  // главная
  if (menuHome) {
    menuHome.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("меню: главная");
      hidePopup(menuWindow);
      
      if (majorWindow.style.display === 'block') {
        console.log("главная уже открыта");
        return;
      }
  
      switchMainWindow(majorWindow);
    });
  }

  // чат
  if (menuChat) {
    menuChat.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("меню: чат");
      hidePopup(menuWindow);
      showPopup(chatWindow);
      rememberAuthorizedWindow(chatWindow);
      scrollChatToBottom();
    });
  }

  // настройки
  if (menuSettings) {
    menuSettings.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("меню: настройки");
      hidePopup(menuWindow);
      switchMainWindow(settingsWindow);
    });
  }

  if (menuPrayer && menuPrayerWindow) {
    menuPrayer.addEventListener("click", function(e) {
      if (hasBlockingChildPopupOpen()) return;
      e.preventDefault();
      e.stopPropagation();
      hidePopup(menuWindow);
      switchMainWindow(menuPrayerWindow);
    });
  }

  if (menuNames99 && menuNames99Window) {
    menuNames99.addEventListener("click", function(e) {
      if (hasBlockingChildPopupOpen()) return;
      e.preventDefault();
      e.stopPropagation();
      hidePopup(menuWindow);
      switchMainWindow(menuNames99Window);
    });
  }

  if (closeMenuPrayerWindowBtn) {
    closeMenuPrayerWindowBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      hidePopup(menuPrayerWindow);
    });
  }

  if (closeMenuNames99WindowBtn) {
    closeMenuNames99WindowBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      hidePopup(menuNames99Window);
    });
  }

  // закрытие главного окна
  if (closeMajor) {
    closeMajor.addEventListener("click", function(e) {
      e.stopPropagation();
      hidePopup(majorWindow);
      rememberAuthorizedWindow(majorWindow);
    });
  }
  
  // закрытие настроек
  if (closeSettings) closeSettings.addEventListener("click", () => hidePopup(settingsWindow));
  
  // время намаза 
  const prayerTimeElement = document.getElementById('prayerTime');
  if (prayerTimeElement && prayerPopupEl && closePrayerBtn) {
    prayerTimeElement.addEventListener('click', function(e) {
      if (hasBlockingChildPopupOpen()) return;
      e.stopPropagation();
      e.preventDefault();
      console.log("opening prayer times");
      
      showChildPopup(prayerPopupEl);
      loadPrayerTimes();
    });
    
    closePrayerBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      hidePopup(prayerPopupEl);
    });
  }

  // часто задаваемые вопросы
  const faqBtn = document.getElementById("faq");
  if (faqBtn && faqPopupEl && closeFaqBtn) {
    faqBtn.addEventListener("click", function(e) {
      if (hasBlockingChildPopupOpen()) return;
      e.stopPropagation();
      e.preventDefault();
      showChildPopup(faqPopupEl);
    });

    closeFaqBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      hidePopup(faqPopupEl);
    });
  }

  // центральная info-кнопка
  if (centerInfoBtn && centerInfoPopupEl && closeCenterInfoBtn) {
    centerInfoBtn.addEventListener("click", function(e) {
      if (hasBlockingChildPopupOpen()) return;
      e.stopPropagation();
      e.preventDefault();
      switchMainWindow(centerInfoPopupEl);
    });

    closeCenterInfoBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      hidePopup(centerInfoPopupEl);
    });
  }

  // халяль рядом 
  const halalBtn = document.getElementById("halalNearby");
  if (halalBtn && halalPopupEl && closeHalalBtn) {
    halalBtn.addEventListener("click", function(e) {
      if (hasBlockingChildPopupOpen()) return;
      e.stopPropagation();
      e.preventDefault();
      console.log("opening halal map");
      
      showChildPopup(halalPopupEl);
      
      setTimeout(() => {
        if (!halalMap) {
          initHalalMap();
        } else {
          halalMap.invalidateSize();
        }
      }, 200); 
    });
    
    closeHalalBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      hidePopup(halalPopupEl);
    });
  }
  
  // мечеть/молельная
  const mosqueBtn = document.getElementById("mosque");
  if (mosqueBtn && mosquePopupEl && closeMosqueBtn) {
    mosqueBtn.addEventListener("click", function(e) {
      if (hasBlockingChildPopupOpen()) return;
      e.stopPropagation();
      e.preventDefault();
      console.log("opening mosque map");
      
      showChildPopup(mosquePopupEl);
      
      setTimeout(() => {
        if (!mosqueMap) {
          initMosqueMap();
        } else {
          mosqueMap.invalidateSize();
        }
      }, 200); 
    });
    
    closeMosqueBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      hidePopup(mosquePopupEl);
    });
  }
  
  // очистка истории чата
  const clearChatCheckbox = document.getElementById('clearChatHistory');
  if (clearChatCheckbox) {
    clearChatCheckbox.addEventListener('change', function() {
      if (!this.checked) return;
      if (clearHistoryConfirmPopupEl) {
        showChildPopup(clearHistoryConfirmPopupEl);
      }
    });
  }

  if (clearHistoryConfirmNoBtn) {
    clearHistoryConfirmNoBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      hidePopup(clearHistoryConfirmPopupEl);
      if (clearChatCheckbox) clearChatCheckbox.checked = false;
    });
  }

  if (closeClearHistoryPopupBtn) {
    closeClearHistoryPopupBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      hidePopup(clearHistoryConfirmPopupEl);
      if (clearChatCheckbox) clearChatCheckbox.checked = false;
    });
  }

  if (clearHistoryConfirmYesBtn) {
    clearHistoryConfirmYesBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      messageContainer.innerHTML = '';
      chatMessages = [];
      updateChatDateLabel();

      if (currentUserId) {
        try {
          await fetch("/clear_chat_history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUserId })
          });
        } catch (error) {
          console.error("Ошибка очистки истории чата:", error);
        }
      }

      hidePopup(clearHistoryConfirmPopupEl);
      if (clearChatCheckbox) clearChatCheckbox.checked = false;
    });
  }
  
  // о сервисе
  document.getElementById('aboutService')?.addEventListener('click', function(e) {
    if (hasBlockingChildPopupOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    if (feedbackPopupEl && feedbackPopupEl.style.display === 'block') return;
    showChildPopup(aboutPopupEl);
  });

  if (closeAboutBtn) {
    closeAboutBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      hidePopup(aboutPopupEl);
    });
  }
  
  // обратная связь
  document.getElementById('feedback')?.addEventListener('click', function(e) {
    if (hasBlockingChildPopupOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    if (aboutPopupEl && aboutPopupEl.style.display === 'block') return;
    showChildPopup(feedbackPopupEl);
  });

  if (closeFeedbackBtn) {
    closeFeedbackBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      hidePopup(feedbackPopupEl);
    });
  }

  // язык
  languageSettingsBtn?.addEventListener("click", function(e) {
    if (hasBlockingChildPopupOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    showChildPopup(languagePopupEl);
  });

  closeLanguagePopupBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    hidePopup(languagePopupEl);
  });

  languageRuBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    applyLanguage("ru");
    hidePopup(languagePopupEl);
  });

  languageEnBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    applyLanguage("en");
    hidePopup(languagePopupEl);
  });

  // кибла
  qiblaCard?.addEventListener("click", function(e) {
    if (hasBlockingChildPopupOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    showChildPopup(qiblaPopupEl);
  });

  closeQiblaPopupBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    hidePopup(qiblaPopupEl);
  });

  // тасбих
  tasbihCard?.addEventListener("click", function(e) {
    if (hasBlockingChildPopupOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    showChildPopup(tasbihPopupEl);
  });

  closeTasbihPopupBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    hidePopup(tasbihPopupEl);
  });

  tasbihFingerBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    setTasbihCount(tasbihCount + 1);
  });

  tasbihResetBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    setTasbihCount(0);
  });
  
  function performLogout() {
    localStorage.removeItem("fio");
    localStorage.removeItem("isAuthorized");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("islamConfirmed");

    authFinished = false;
    islamAccepted = false;
    islamConfirmed = false;
    currentLogin = "";
    currentPassword = "";
    currentUserId = "";

    if (loginInput) loginInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (fioInput) fioInput.value = "";

    if (profileName) {
      profileName.textContent = t("profile_name_placeholder");
    }

    if (toggle) {
      toggle.checked = false;
      toggle.disabled = false;
    }

    hideAllPopups();
    activeMainWindow = null;
    localStorage.removeItem(LAST_AUTH_WINDOW_KEY);

    setTimeout(() => {
      showPopup(islamPopup);
    }, 300);
  }

  // выход
  document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    if (hasBlockingChildPopupOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    if (logoutConfirmPopupEl) {
      positionLogoutConfirmPopup();
      showChildPopup(logoutConfirmPopupEl);
    }
  });

  cancelLogoutBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    hidePopup(logoutConfirmPopupEl);
  });

  confirmLogoutBtn?.addEventListener("click", function(e) {
    e.stopPropagation();
    hidePopup(logoutConfirmPopupEl);
    setTimeout(() => performLogout(), 100);
  });

  window.addEventListener("resize", () => {
    if (logoutConfirmPopupEl && logoutConfirmPopupEl.style.display === "block") {
      positionLogoutConfirmPopup();
    }
  });
  
  // enter в полях ввода
  if (loginInput) loginInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });
  
  if (passwordInput) passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });
  
  if (fioInput) fioInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") saveFioBtn.click();
  });
  
  if (chatInput) chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  if (chatInput) {
    chatInput.maxLength = MAX_CHAT_MESSAGE_LENGTH;
    resizeChatInput();
    chatInput.addEventListener("input", resizeChatInput);
  }

  const socialLinks = document.querySelectorAll(".social-icons a");
  if (socialLinks.length > 0) {
    socialLinks.forEach((link) => {
      link.addEventListener("click", function(e) {
        if (hasBlockingChildPopupOpen()) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    });
  }
}

function handleMainButtonClick(e) {
  e.stopPropagation();
  console.log("handleMainButtonClick - используется новый обработчик луны");
}

function getActiveHostWindowForMiniAlert() {
  const windows = [
    fioPopup,
    authPopup,
    mainWindow,
    chatWindow,
    settingsWindow,
    majorWindow,
    authLoading
  ];
  for (const win of windows) {
    if (win && win.style.display === "block") {
      return win;
    }
  }
  return null;
}

function showMiniAlert(message) {
  if (!miniAlertPopup || !miniAlertText || !miniAlertBox) return;
  miniAlertText.textContent = message || t("mini_error_default");
  const host = getActiveHostWindowForMiniAlert();
  if (host) {
    const rect = host.getBoundingClientRect();
    miniAlertBox.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
    miniAlertBox.style.top = `${Math.round(rect.top + rect.height / 2)}px`;
  } else {
    miniAlertBox.style.left = "50%";
    miniAlertBox.style.top = "50%";
  }
  miniAlertPopup.style.display = "block";
}

function hideMiniAlert() {
  if (!miniAlertPopup) return;
  miniAlertPopup.style.display = "none";
  if (miniAlertBox) {
    miniAlertBox.style.left = "50%";
    miniAlertBox.style.top = "50%";
  }
}

function validateLoginValue(login) {
  if (!login) return t("login_required");
  if (login.length < 3) return t("login_too_short");
  if (login.length > 30) return t("login_too_long");
  if (/\s/.test(login)) return t("login_spaces");
  if (!/^[A-Za-z0-9._-]+$/.test(login)) {
    return t("login_format");
  }
  return "";
}

function validatePasswordValue(password) {
  if (!password) return t("password_required");
  if (password.length < 4) return t("password_too_short");
  if (password.length > 64) return t("password_too_long");
  if (/\s/.test(password)) return t("password_spaces");
  return "";
}

function validateFioValue(fio) {
  if (!fio) return t("fio_required");
  const normalized = fio.trim().replace(/\s+/g, " ");
  const fioRegex = /^[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?(?: [А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?){1,2}$/;
  if (!fioRegex.test(normalized)) {
    return t("fio_invalid");
  }
  return "";
}

async function handleLogin() {
  const login = loginInput.value.trim();
  const password = passwordInput.value.trim();

  const loginError = validateLoginValue(login);
  if (loginError) {
    showMiniAlert(t("login_password_hint"));
    return;
  }

  const passwordError = validatePasswordValue(password);
  if (passwordError) {
    showMiniAlert(t("login_password_hint"));
    return;
  }

  if (login === password) {
    showMiniAlert(t("login_password_hint"));
    return;
  }

  currentLogin = login;
  currentPassword = password;

  showPopup(authLoading);

  try {
    const response = await fetch("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password, language: currentLanguage })
    });

    const result = await response.json();
    hidePopup(authLoading);

    if (result.success) {
      // если пользователь новый или у него нет фио — обязательно ведем на ввод фио
      if (result.registered === false || !result.fio) {
        showPopup(fioPopup);
      } else {
        localStorage.setItem("isAuthorized", "true");
        currentUserId = result.user_id || "";
        if (currentUserId) {
          localStorage.setItem("currentUserId", currentUserId);
        }

        if (result.fio) {
          localStorage.setItem("fio", result.fio);
          updateProfileNameLabel();
        }

        loginInput.value = "";
        passwordInput.value = "";

        showPopup(mainWindow);
        rememberAuthorizedWindow(mainWindow);
        renderChatHistory(result.chat_history || []);
      }
    } else {
      showMiniAlert(t("login_password_hint"));
    }
  } catch (error) {
    hidePopup(authLoading);
    showMiniAlert(t("net_error"));
  }
}

async function handleSaveFio() {
  const fio = formatFIO(fioInput.value);
  
  const fioError = validateFioValue(fio);
  if (fioError) {
    showMiniAlert(fioError);
    return;
  }

  if (fio.length > 100) {
    showMiniAlert(t("fio_too_long"));
    return;
  }

  if (currentLogin && fio.toLowerCase() === currentLogin.toLowerCase()) {
    showMiniAlert(t("fio_equals_login"));
    return;
  }

  showPopup(authLoading);

  try {
    const response = await fetch("/save_fio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: currentLogin,
        password: currentPassword,
        fio: fio,
        language: currentLanguage
      })
    });

    const result = await response.json();
    hidePopup(authLoading);

    if (result.success) {
      localStorage.setItem("fio", fio);
      localStorage.setItem("isAuthorized", "true");
      currentUserId = result.user_id || "";
      if (currentUserId) {
        localStorage.setItem("currentUserId", currentUserId);
      }

      updateProfileNameLabel();

      fioInput.value = "";
      loginInput.value = "";
      passwordInput.value = "";

      showPopup(mainWindow);
      rememberAuthorizedWindow(mainWindow);
      renderChatHistory(result.chat_history || []);
    } else {
      showMiniAlert(result.error || t("save_error"));
    }
  } catch (error) {
    hidePopup(authLoading);
    showMiniAlert(t("net_error"));
  }
}

async function sendMessage() {
  let msg = chatInput.value.trim();
  if (!msg) {
    showMiniAlert(t("empty_chat_error"));
    return;
  }
  if (msg.length > MAX_CHAT_MESSAGE_LENGTH) {
    showMiniAlert(t("max_chars_message").replace("{n}", String(MAX_CHAT_MESSAGE_LENGTH)));
    return;
  }
  
  const keepScrollAtBottom = isChatNearBottom();

  let div = document.createElement("div");
  div.classList.add("message-user");
  div.textContent = msg;
  messageContainer.appendChild(div);
  
  const userCreatedAt = new Date().toISOString();
  chatMessages.push({ type: 'user', text: msg, created_at: userCreatedAt });
  updateChatDateLabel();
  saveChatHistory();
  
  chatInput.value = "";
  resizeChatInput();
  if (keepScrollAtBottom) scrollChatToBottom();
  
  let botDiv = document.createElement("div");
  botDiv.classList.add("message-bot");
  botDiv.textContent = t("thinking1");
  messageContainer.appendChild(botDiv);
  if (keepScrollAtBottom) scrollChatToBottom();
  const stopThinking = startThinkingAnimation(botDiv);

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, language: currentLanguage }),
    });
    const result = await response.json();

    const rawBotText = result.success
      ? (result.response || t("empty_model_response"))
      : (result.error || t("model_response_error"));
    const botText = sanitizeBotText(rawBotText);

    stopThinking();
    await typeMessage(botDiv, botText, 18, keepScrollAtBottom);
    botDiv.innerHTML = markdownToHtml(botText);
    const botCreatedAt = new Date().toISOString();
    chatMessages.push({ type: 'bot', text: botText, created_at: botCreatedAt });
    updateChatDateLabel();
    saveChatHistory();
    if (keepScrollAtBottom) scrollChatToBottom();
  } catch (error) {
    stopThinking();
    botDiv.textContent = t("net_error");
    const botErrorCreatedAt = new Date().toISOString();
    chatMessages.push({ type: 'bot', text: t("net_error"), created_at: botErrorCreatedAt });
    updateChatDateLabel();
    saveChatHistory();
  }
}

function startThinkingAnimation(el) {
  const frames = [t("thinking1"), t("thinking2"), t("thinking3")];
  let idx = 0;
  el.textContent = frames[idx];

  const statusStages = [
    { ms: 4000, text: t("thinking_stage1") },
    { ms: 8000, text: t("thinking_stage2") },
    { ms: 12000, text: t("thinking_stage3") }
  ];
  const stageTimers = statusStages.map((stage) =>
    setTimeout(() => {
      el.textContent = stage.text;
      if (isChatNearBottom()) scrollChatToBottom();
    }, stage.ms)
  );

  const timer = setInterval(() => {
    const currentText = el.textContent || "";
    const isBase = frames.includes(currentText);
    if (isBase) {
      idx = (idx + 1) % frames.length;
      el.textContent = frames[idx];
    }
    if (isChatNearBottom()) scrollChatToBottom();
  }, 280);

  return function stop() {
    clearInterval(timer);
    stageTimers.forEach((t) => clearTimeout(t));
  };
}

async function typeMessage(el, text, speedMs = 12, keepScrollAtBottom = true) {
  el.textContent = "";
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    if (keepScrollAtBottom && isChatNearBottom()) {
      scrollChatToBottom();
    }
    await new Promise((resolve) => setTimeout(resolve, speedMs));
  }
}

function sanitizeBotText(raw) {
  let text = String(raw || "");
  const directReplacements = [
    "Я, Gemini Enterprise,",
    "Я — Gemini Enterprise,",
    "Я Gemini Enterprise,",
    "Я, Gemini Enterprise",
    "Я — Gemini Enterprise",
    "Я Gemini Enterprise",
    "Gemini Enterprise",
    "Надеюсь, что эта информация была вам полезна.",
    "Если у вас возникнут другие вопросы о традициях, текстах молитв или истории — обязательно спрашивайте!",
  ];
  directReplacements.forEach((frag) => {
    text = text.replaceAll(frag, "");
  });

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const bannedTailPatterns = [
    "хотите ли вы узнать",
    "если у вас возникнут другие вопросы",
    "обязательно спрашивайте",
    "надеюсь, что эта информация",
    "есть ли какой-то конкретный аспект",
    "о котором вы хотели бы узнать",
    "нужна помощь с планированием",
    "would you like to know",
    "if you have any other questions",
    "i hope this information",
    "do you want to know",
  ];

  const cleaned = lines.filter((line) => {
    const low = line.toLowerCase();
    return !bannedTailPatterns.some((p) => low.includes(p));
  });

  return cleaned.join("\n").trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInlineMarkdown(value) {
  let s = escapeHtml(value);
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(.+?)__/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  s = s.replace(/`(.+?)`/g, "<code>$1</code>");
  return s;
}

function parseTableRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function isTableSeparator(line) {
  const s = line.trim();
  return /^\|?\s*:?-{3,}:?(\s*\|\s*:?-{3,}:?)+\s*\|?$/.test(s);
}

function markdownToHtml(rawText) {
  const text = String(rawText || "").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const htmlParts = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      htmlParts.push(`<p class="chat-md-heading">${formatInlineMarkdown(headingMatch[2])}</p>`);
      i += 1;
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headerCells = parseTableRow(lines[i]);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      const thead = `<thead><tr>${headerCells.map((c) => `<th>${formatInlineMarkdown(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${formatInlineMarkdown(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      htmlParts.push(`<table class="chat-md-table">${thead}${tbody}</table>`);
      continue;
    }

    const orderedMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    if (orderedMatch) {
      const listItems = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(/^(\d+)[.)]\s+(.+)/);
        if (!m) break;
        listItems.push(`<li>${formatInlineMarkdown(m[2])}</li>`);
        i += 1;
      }
      htmlParts.push(`<ol class="chat-md-ol">${listItems.join("")}</ol>`);
      continue;
    }

    htmlParts.push(`<p>${formatInlineMarkdown(line)}</p>`);
    i += 1;
  }

  if (htmlParts.length === 0) return `<p>${formatInlineMarkdown(text)}</p>`;
  return htmlParts.join("");
}

function saveChatHistory() {
  saveChatHistoryToServer();
}

function renderChatHistory(historyItems) {
  if (!messageContainer) return;
  messageContainer.innerHTML = "";
  chatMessages = [];
  if (!Array.isArray(historyItems)) {
    updateChatDateLabel();
    return;
  }

  historyItems.forEach((item) => {
    if (!item || (item.type !== "user" && item.type !== "bot")) return;
    if (typeof item.text !== "string") return;
    const createdAt = typeof item.created_at === "string" ? item.created_at : "";
    const div = document.createElement("div");
    div.classList.add(item.type === "user" ? "message-user" : "message-bot");
    if (item.type === "bot") {
      div.innerHTML = markdownToHtml(item.text);
    } else {
      div.textContent = item.text;
    }
    messageContainer.appendChild(div);
    chatMessages.push({ type: item.type, text: item.text, created_at: createdAt });
  });
  updateChatDateLabel();
  scrollChatToBottom();
}

async function loadChatHistoryFromServer() {
  if (!currentUserId) return;
  try {
    const res = await fetch(`/chat_history?user_id=${encodeURIComponent(currentUserId)}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.history)) {
      renderChatHistory(data.history);
    }
  } catch (error) {
    console.error("Ошибка загрузки истории чата:", error);
  }
}

async function saveChatHistoryToServer() {
  if (!currentUserId) return;
  try {
    await fetch("/chat_history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: currentUserId,
        history: chatMessages
      })
    });
  } catch (error) {
    console.error("Ошибка сохранения истории чата:", error);
  }
}

// время намаза 
async function loadPrayerTimes() {
  if (!prayerTimesContainer) return;
  prayerTimesContainer.textContent = t("prayer_loading");
  const CACHE_SIGNATURE = "server:prayer_times:dumrf";
  const now = new Date();
  const moscowDateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const y = moscowDateParts.find((p) => p.type === "year")?.value || "0000";
  const m = moscowDateParts.find((p) => p.type === "month")?.value || "01";
  const d = moscowDateParts.find((p) => p.type === "day")?.value || "01";
  const today = `${y}-${m}-${d}`;
  const cached = localStorage.getItem("prayerCache");
  let timings;

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.date === today && parsed.signature === CACHE_SIGNATURE) {
        timings = parsed.data;
      }
    } catch (e) {
      localStorage.removeItem("prayerCache");
    }
  }

  if (!timings) {
    try {
      const res = await fetch("/prayer_times");
      const json = await res.json();
      if (!json?.success) throw new Error("server parse error");
      timings = json;
      localStorage.setItem("prayerCache", JSON.stringify({
        date: today,
        signature: CACHE_SIGNATURE,
        data: timings
      }));
    } catch (err) {
      console.error(err);
      prayerTimesContainer.textContent = t("prayer_load_error");
      return;
    }
  }

  function toMinutes(str) {
    const clean = String(str || "").slice(0, 5);
    const [h, m] = clean.split(":").map(Number);
    return h * 60 + m;
  }

  const moscowParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);
  const moscowHour = Number(moscowParts.find((p) => p.type === "hour")?.value || "0");
  const moscowMinute = Number(moscowParts.find((p) => p.type === "minute")?.value || "0");
  const currentMinutes = moscowHour * 60 + moscowMinute;

  const prayers = currentLanguage === "en"
    ? [
        { name: "Fajr", time: timings.Fajr, isPrayer: true },
        { name: "Sunrise", time: timings.Sunrise, isPrayer: false },
        { name: "Dhuhr", time: timings.Dhuhr, isPrayer: true },
        { name: "Asr", time: timings.Asr, isPrayer: true },
        { name: "Maghrib", time: timings.Maghrib, isPrayer: true },
        { name: "Isha", time: timings.Isha, isPrayer: true },
      ]
    : [
        { name: "Фаджр", time: timings.Fajr, isPrayer: true },
        { name: "Восход", time: timings.Sunrise, isPrayer: false },
        { name: "Зухр", time: timings.Dhuhr, isPrayer: true },
        { name: "Аср", time: timings.Asr, isPrayer: true },
        { name: "Магриб", time: timings.Maghrib, isPrayer: true },
        { name: "Иша", time: timings.Isha, isPrayer: true },
      ];

  let activeIndex = -1;
  for (let i = 0; i < prayers.length; i++) {
    const cur = toMinutes(prayers[i].time);
    const next = prayers[i + 1] ? toMinutes(prayers[i + 1].time) : 24 * 60;
    if (currentMinutes >= cur && currentMinutes < next) {
      activeIndex = prayers[i].isPrayer ? i : -1;
      break;
    }
  }

  prayerTimesContainer.innerHTML = prayers.map((p, i) => `
    <div class="prayer-row ${i === activeIndex ? "active-prayer" : ""}">
      <span>${p.name}</span>
      <span>${p.time}</span>
    </div>
  `).join("");
}

function renderFaqByLanguage() {
  const container = document.querySelector("#faqPopup .faq-scroll-content");
  if (!container) return;
  container.innerHTML = `
    <div class="faq-item">
      <button class="faq-question" type="button">${t("faq_q1")}</button>
      <div class="faq-answer">${t("faq_a1")}</div>
    </div>
    <div class="faq-item">
      <button class="faq-question" type="button">${t("faq_q2")}</button>
      <div class="faq-answer">
        <ol class="faq-list">
          <li>${t("faq_a2_1")}</li>
          <li>${t("faq_a2_2")}</li>
          <li>${t("faq_a2_3")}</li>
          <li>${t("faq_a2_4")}</li>
          <li>${t("faq_a2_5")}</li>
        </ol>
      </div>
    </div>
    <div class="faq-item">
      <button class="faq-question" type="button">${t("faq_q3")}</button>
      <div class="faq-answer">${t("faq_a3")}</div>
    </div>
    <div class="faq-item">
      <button class="faq-question" type="button">${t("faq_q4")}</button>
      <div class="faq-answer">${t("faq_a4")}</div>
    </div>
    <div class="faq-item">
      <button class="faq-question" type="button">${t("faq_q5")}</button>
      <div class="faq-answer">${t("faq_a5")}</div>
    </div>
    <div class="faq-item">
      <button class="faq-question" type="button">${t("faq_q6")}</button>
      <div class="faq-answer">${t("faq_a6")}</div>
    </div>
    <div class="faq-item">
      <button class="faq-question" type="button">${t("faq_q7")}</button>
      <div class="faq-answer">${t("faq_a7")}</div>
    </div>
    <div class="faq-item">
      <button class="faq-question" type="button">${t("faq_q8")}</button>
      <div class="faq-answer">${t("faq_a8")}</div>
    </div>
    <div class="faq-item">
      <button class="faq-question" type="button">${t("faq_q9")}</button>
      <div class="faq-answer">${t("faq_a9")}</div>
    </div>
    <div class="faq-item">
      <button class="faq-question" type="button">${t("faq_q10")}</button>
      <div class="faq-answer">${t("faq_a10")}</div>
    </div>
  `;
  initFaqToggleHandlers();
}

function renderSettingsContentByLanguage() {
  const aboutLayout = document.getElementById("aboutLayoutContent");
  if (aboutLayout) {
    aboutLayout.innerHTML = ABOUT_CONTENT[currentLanguage] || ABOUT_CONTENT.ru;
  }
  const feedbackCard = document.getElementById("feedbackCardContent");
  if (feedbackCard) {
    feedbackCard.innerHTML = FEEDBACK_CONTENT[currentLanguage] || FEEDBACK_CONTENT.ru;
  }
}

function renderPrayerContentByLanguage() {
  const prayerContent = document.getElementById("prayerWindowContent");
  if (prayerContent) {
    prayerContent.innerHTML = PRAYER_CONTENT[currentLanguage] || PRAYER_CONTENT.ru;
  }
}

function initFaqToggleHandlers() {
  const faqQuestionButtons = document.querySelectorAll(".faq-question");
  if (faqQuestionButtons.length === 0) return;
  faqQuestionButtons.forEach((btn) => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      const faqItem = this.closest(".faq-item");
      if (!faqItem) return;
      faqItem.classList.toggle("open");
    });
  });
}

// карты 
let halalMap = null;
let mosqueMap = null;

function getDarkGreenLeafletIcon() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="42" viewBox="0 0 28 42">
        <path d="M14 0C6.8 0 1 5.8 1 13c0 10.2 13 28.5 13 28.5S27 23.2 27 13C27 5.8 21.2 0 14 0z" fill="#0A5A25" stroke="#063B18" stroke-width="1.4"/>
        <circle cx="14" cy="13" r="5.2" fill="#EAF3EA" stroke="#0A5A25" stroke-width="1.2"/>
      </svg>
    `.trim();
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    return L.icon({
        iconUrl,
        iconSize: [28, 42],
        iconAnchor: [14, 41],
        popupAnchor: [0, -34],
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        shadowSize: [41, 41],
        shadowAnchor: [13, 41]
    });
}

function initHalalMap() {
    console.log("инициализация карты халяль...");
    
    const mapElement = document.getElementById('halalMap');
    if (!mapElement) {
        console.error("элемент halalmap не найден!");
        return;
    }
    
    // размеры
    mapElement.style.height = '300px';
    mapElement.style.width = '100%';
    mapElement.style.display = 'block';
    
    if (halalMap) {
        halalMap.remove();
        halalMap = null;
    }
    
    try {
        // создание карты с задержкой
        setTimeout(() => {
            // проверка, видим ли элемент
            const rect = mapElement.getBoundingClientRect();
            console.log("размеры элемента:", rect.width, "x", rect.height);
            
            if (rect.width === 0 || rect.height === 0) {
                console.warn("элемент карты имеет нулевой размер!");
            }
            
            // создание карт
            halalMap = L.map('halalMap').setView([55.700283, 37.654942], 15);
            
            // тайлы openstreetmap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© openstreetmap contributors'
            }).addTo(halalMap);
            
            // маркеры
            const places = currentLanguage === "en"
                ? [
                    { name: "Shafran Restaurant", lat: 55.699634, lon: 37.657776 },
                    { name: "Non Gusht Cafe", lat: 55.700903, lon: 37.651461 },
                    { name: "Sochny Vertel Cafe", lat: 55.694225, lon: 37.665306 },
                    { name: "Plov&Burger Cafe", lat: 55.700121, lon: 37.657538 },
                    { name: "Zdraste Coffee Shop", lat: 55.690114, lon: 37.654806 },
                  ]
                : [
                    { name: "Ресторан 'Шафран'", lat: 55.699634, lon: 37.657776 },
                    { name: "Кафе 'Non gusht'", lat: 55.700903, lon: 37.651461 },
                    { name: "Кафе 'Сочный вертел'", lat: 55.694225, lon: 37.665306 },
                    { name: "Кафе 'Плов&бургер'", lat: 55.700121, lon: 37.657538 },
                    { name: "Кофейня 'Здрасте'", lat: 55.690114, lon: 37.654806 },
                  ];
            
            const darkGreenIcon = getDarkGreenLeafletIcon();
            places.forEach(place => {
                L.marker([place.lat, place.lon])
                    .setIcon(darkGreenIcon)
                    .addTo(halalMap)
                    .bindPopup(
                        `<div class="map-place-card map-place-card-halal">
                           <div class="map-place-badge">HALAL</div>
                           <div class="map-place-title">${place.name}</div>
                         </div>`,
                        { className: "imuslim-map-popup" }
                    );
            });
            
            // обновление размера карты
            setTimeout(() => {
                if (halalMap) {
                    halalMap.invalidateSize();
                    console.log("карта халяль обновлена");
                }
            }, 100);
            
            console.log("карта халяль успешно создана!");
        }, 300);
        
    } catch (error) {
        console.error("ошибка при создании карты халяль:", error);
    }
}

function initMosqueMap() {
    console.log("Инициализация карты мечетей...");
    
    // элемент карты
    const mapElement = document.getElementById('mosqueMap');
    if (!mapElement) {
        console.error("Элемент mosquemap не найден!");
        return;
    }
    
    // размеры
    mapElement.style.height = '300px';
    mapElement.style.width = '100%';
    mapElement.style.display = 'block';
    
    if (mosqueMap) {
        mosqueMap.remove();
        mosqueMap = null;
    }
    
    try {
        // создание карты с задержкой
        setTimeout(() => {
            // проверка
            const rect = mapElement.getBoundingClientRect();
            console.log("размеры элемента:", rect.width, "x", rect.height);
            
            if (rect.width === 0 || rect.height === 0) {
                console.warn("Элемент карты имеет нулевой размер!");
            }
            
            // создание карты
            mosqueMap = L.map('mosqueMap').setView([55.700283, 37.654942], 12);
            
            // openstreetmap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© openstreetmap contributors'
            }).addTo(mosqueMap);
            
            // маркеры мечетей
            const mosques = currentLanguage === "en"
               ? [
                   { name: "Heritage of Islam", lat: 55.7176, lon: 37.6375 },
                   { name: "Cathedral Mosque", lat: 55.779167, lon: 37.626944 },
                   { name: "Yardem Mosque", lat: 55.856667, lon: 37.592222 },
                   { name: "Memorial Mosque", lat: 55.725377, lon: 37.497144 },
                   { name: "Historical Mosque", lat: 55.738803, lon: 37.632483 },
                   { name: "Shafran Restaurant", lat: 55.699634, lon: 37.657776 },
                   { name: "Plov&Burger Cafe", lat: 55.700121, lon: 37.657538 },
                 ]
               : [
                   { name: "Наследие Ислама", lat: 55.7176, lon: 37.6375 },
                   { name: "Мечеть 'Соборная'", lat: 55.779167, lon: 37.626944 },
                   { name: "Мечеть 'Ярдэм'", lat: 55.856667, lon: 37.592222 },
                   { name: "Мечеть 'Мемориальная'", lat: 55.725377, lon: 37.497144 },
                   { name: "Мечеть 'Историческая'", lat: 55.738803, lon: 37.632483 },
                   { name: "Ресторан 'Шафран'", lat: 55.699634, lon: 37.657776 },
                   { name: "Кафе 'Плов&бургер'", lat: 55.700121, lon: 37.657538 },
                 ];
            
            const darkGreenIcon = getDarkGreenLeafletIcon();
            mosques.forEach(mosque => {
                L.marker([mosque.lat, mosque.lon])
                    .setIcon(darkGreenIcon)
                    .addTo(mosqueMap)
                    .bindPopup(
                        `<div class="map-place-card map-place-card-prayer">
                           <div class="map-place-badge">PRAYER</div>
                           <div class="map-place-title">${mosque.name}</div>
                         </div>`,
                        { className: "imuslim-map-popup" }
                    );
            });
            
            // размер карты
            setTimeout(() => {
                if (mosqueMap) {
                    mosqueMap.invalidateSize();
                    console.log("карта мечетей обновлена");
                }
            }, 100);
            
            console.log("карта мечетей успешно создана!");
        }, 300);
        
    } catch (error) {
        console.error("ошибка при создании карты мечетей:", error);
    }
}

// для карт
function setupMapHandlers() {
    console.log("настройка обработчиков карт...");
    
    // халяль
    const halalBtn = document.getElementById("halalNearby");
    const halalPopup = document.getElementById("halalPopup");
    const closeHalal = document.getElementById("closeHalal");
    
    if (halalBtn && halalPopup) {
        const newHalalBtn = halalBtn.cloneNode(true);
        halalBtn.parentNode.replaceChild(newHalalBtn, halalBtn);
        
        newHalalBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("клик по кнопке халяль");
            
            showChildPopup(halalPopup);
            
            initHalalMap();
        });
    }
    
    // мечеть
    const mosqueBtn = document.getElementById("mosque");
    const mosquePopup = document.getElementById("mosquePopup");
    const closeMosque = document.getElementById("closeMosque");
    
    if (mosqueBtn && mosquePopup) {
        const newMosqueBtn = mosqueBtn.cloneNode(true);
        mosqueBtn.parentNode.replaceChild(newMosqueBtn, mosqueBtn);
        
        newMosqueBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("клик по кнопке мечеть");
            
            showChildPopup(mosquePopup);
            
            initMosqueMap();
        });
    }
    
    if (closeHalal) {
        closeHalal.addEventListener("click", function(e) {
            e.stopPropagation();
            hidePopup(halalPopup);
        });
    }
    
    if (closeMosque) {
        closeMosque.addEventListener("click", function(e) {
            e.stopPropagation();
            hidePopup(mosquePopup);
        });
    }
}

// форматирование фио - каждое слово с большой буквы
function formatFIO(fio) {
  return fio
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => {
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

document.addEventListener('DOMContentLoaded', function() {
  console.log("dom fully loaded");
  if (centerInfoPopupEl && centerInfoPopupEl.parentElement !== document.body) {
    document.body.appendChild(centerInfoPopupEl);
  }
  hideAllPopups();
  applyLanguage(currentLanguage);
  updateChatDateLabel();
  initNames99Grid();
  setInterval(updateChatDateLabel, 60000);

  // проверка
  const isAuthorized = localStorage.getItem("isAuthorized");
  const savedFio = localStorage.getItem("fio");
  currentUserId = localStorage.getItem("currentUserId") || "";

  if (isAuthorized === "true" && savedFio) {
    updateProfileNameLabel();
    activeMainWindow = getRememberedAuthorizedWindow();
    loadChatHistoryFromServer();
  }

  initEventListeners();
  updateParentWindowEffects();
});

// закрытие по клику вне
document.addEventListener('click', (e) => {
  const popups = [
    { popup: islamPopup, btn: openIslamBtn },
    { popup: authPopup, btn: openIslamBtn },
    { popup: authLoading, btn: openIslamBtn },
    { popup: mainWindow, btn: openIslamBtn },
    { popup: chatWindow, btn: chatBtn },
    { popup: menuWindow, btn: menuButtons },
    { popup: settingsWindow, btn: menuSettings },
    { popup: menuPrayerWindow, btn: menuPrayer },
    { popup: menuNames99Window, btn: menuNames99 },
    { popup: majorWindow, btn: [openIslamBtn, openMajorBtn] },
    { popup: fioPopup, btn: null },
    { popup: prayerPopupEl, btn: document.getElementById('prayerTime') },
    { popup: faqPopupEl, btn: document.getElementById('faq') },
    { popup: centerInfoPopupEl, btn: centerInfoBtn },
    { popup: aboutPopupEl, btn: document.getElementById('aboutService') },
    { popup: feedbackPopupEl, btn: document.getElementById('feedback') },
    { popup: languagePopupEl, btn: document.getElementById('languageSettings') },
    { popup: qiblaPopupEl, btn: qiblaCard },
    { popup: tasbihPopupEl, btn: tasbihCard },
    { popup: quickLanguagePopupEl, btn: quickLanguageBtn },
    { popup: menuPrayerPopupEl, btn: menuPrayer },
    { popup: menuNames99PopupEl, btn: menuNames99 },
    { popup: clearHistoryConfirmPopupEl, btn: document.getElementById('clearChatHistory') },
    { popup: logoutConfirmPopupEl, btn: document.getElementById('logoutBtn') },
    { popup: halalPopupEl, btn: document.getElementById('halalNearby') },
    { popup: mosquePopupEl, btn: document.getElementById('mosque') }
  ];
  
  popups.forEach(({ popup, btn }) => {
    if (popup && popup.style.display === 'block') {
      const isClickInside = (popup === logoutConfirmPopupEl && logoutMiniBox)
        ? logoutMiniBox.contains(e.target)
        : popup.contains(e.target);
      
      // проверка, является ли клик по кнопке открытия
      let isButtonClick = false;
      if (btn) {
        if (btn.forEach) {
          btn.forEach(b => {
            if (b && b.contains(e.target)) isButtonClick = true;
          });
        } else {
          isButtonClick = btn.contains(e.target);
        }
      }
      
      // не закрывать окна при клике на главное окно
      const isChildPopup = [prayerPopupEl, faqPopupEl, aboutPopupEl, feedbackPopupEl, languagePopupEl, qiblaPopupEl, tasbihPopupEl, quickLanguagePopupEl, clearHistoryConfirmPopupEl, logoutConfirmPopupEl, menuPrayerPopupEl, menuNames99PopupEl, halalPopupEl, mosquePopupEl].includes(popup);
      const isClickOnMajorParent = majorWindow && majorWindow.contains(e.target) && majorWindow.style.display === 'block';
      const isClickOnSettingsParent = settingsWindow && settingsWindow.contains(e.target) && settingsWindow.style.display === 'block';
      const isClickOnParent = isClickOnMajorParent || isClickOnSettingsParent;
      
      if (!isClickInside && !isButtonClick && !(isChildPopup && isClickOnParent)) {
        if (popup === logoutConfirmPopupEl) {
          setQuickLanguageOpenState(false);
          hidePopup(quickLanguagePopupEl);
        }
        if (popup === quickLanguagePopupEl) {
          setQuickLanguageOpenState(false);
        }
        hidePopup(popup);
      }
    }
  });
});

console.log("script loaded successfully!");
