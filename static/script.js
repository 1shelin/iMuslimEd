// script.js

const openIslamBtn = document.getElementById("openIslamBtn");
const islamPopup = document.getElementById("islamPopup");
const closePopup = document.getElementById("closePopup");
const authPopup = document.getElementById("authPopup");
const closeAuth = document.getElementById("closeAuth");
const toggle = document.getElementById("religionToggle");

const loginBtn = document.getElementById("loginBtn");
const loginInput = document.getElementById("loginInput");
const passwordInput = document.getElementById("passwordInput");
const togglePassword = document.getElementById("togglePassword");
const passwordIcon = togglePassword ? togglePassword.querySelector("img") : null;

const authLoading = document.getElementById("authLoading");
const closeLoading = document.getElementById("closeLoading");
const mainWindow = document.getElementById("mainWindow");
const closeMain = document.getElementById("closeMain");


const chatWindow = document.getElementById("chatWindow");
const chatBtn = document.querySelector(".main-btn");
const closeChat = document.getElementById("closeChat");
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const messageContainer = document.getElementById("messageContainer");

const chatMenu = document.querySelector(".chat-menu");
const menuPopup = document.querySelector(".menu-popup"); // это белый купол
const menuClose = document.querySelector(".menu-close"); // крестик в меню

const prayerPopupEl = document.getElementById("prayerPopup");
const closePrayerBtn = document.getElementById("closePrayer");
const prayerTimesContainer = document.getElementById("prayerTimes");

const halalPopup = document.getElementById("halalPopup");
const mosquePopup = document.getElementById("mosquePopup");
const closeHalal = document.getElementById("closeHalal");
const closeMosque = document.getElementById("closeMosque");


let islamAccepted = false;     
let authFinished = false; 

// показать попап с анимацией
function showPopup(popupElement) {
  if (!popupElement) return;
  
  // скрыть все другие попапы
  hideAllPopups();
  
  popupElement.style.display = 'block';
  setTimeout(() => {
    popupElement.classList.remove('popup-hidden');
    popupElement.classList.add('popup-visible');
  }, 50);
}

// скрыть попап с анимацией
function hidePopup(popupElement) {
  if (!popupElement) return;
  popupElement.classList.remove('popup-visible');
  popupElement.classList.add('popup-hidden');
  setTimeout(() => {
    popupElement.classList.remove('popup-hidden');
    popupElement.style.display = 'none';
  }, 300);
}

// скрыть все попапы
function hideAllPopups() {
  const popups = [islamPopup, authPopup, authLoading, mainWindow];
  popups.forEach(popup => {
    if (popup && popup.style.display === 'block') {
      hidePopup(popup);
    }
  });
}

// обработка клика по кнопке (лунe)
openIslamBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  if (authFinished) {
    //если авторизация завершена, то главное окно
    showPopup(mainWindow);
    return;
  }

  // обычная логика до авторизации
  if (islamAccepted) {
    showPopup(authPopup);
  } else {
    showPopup(islamPopup);
  }
});

// крестики закрывают соответствующие окна
closePopup && closePopup.addEventListener("click", () => hidePopup(islamPopup));
closeAuth && closeAuth.addEventListener("click", () => hidePopup(authPopup));
closeLoading && closeLoading.addEventListener("click", () => hidePopup(authLoading));
closeMain && closeMain.addEventListener("click", () => hidePopup(mainWindow));

// переключатель: при включении к форме логина
toggle && toggle.addEventListener("change", () => {
  if (toggle.checked) {
    islamAccepted = true;
    toggle.disabled = true;
    
    setTimeout(() => {
      hidePopup(islamPopup);
      setTimeout(() => showPopup(authPopup), 200);
    }, 400);
  } else {
    islamAccepted = false;
  }
});

// логика нажатия "войти"
loginBtn.addEventListener("click", async () => {
  const login = loginInput.value.trim();
  const password = passwordInput.value.trim();

  if (!login || !password) {
    alert("Введите логин и пароль!");
    return;
  }

  // окно загрузки
  showPopup(authLoading);

  try {
    const response = await fetch("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password })
    });

    const result = await response.json();

    setTimeout(() => {
      if (result.success) {
        // скрыть окно загрузки
        hidePopup(authLoading);
        
        // очистить поля ввода
        loginInput.value = "";
        passwordInput.value = "";
        
        // показать главное окно сразу
        setTimeout(() => {
          showPopup(mainWindow);
        }, 100);
        
        // блок повторное открытие авторизации
        authFinished = true;
        
      } else {
        hidePopup(authLoading);
        alert(result.error || "Неверный логин или пароль");
      }    
    }, 1500);

  } catch (error) {
    hidePopup(authLoading);
    alert("Ошибка сети при авторизации.");
  }
});

// переключение видимости пароля (глаз)
if (togglePassword) {
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    if (passwordIcon) {
      passwordIcon.src = type === "password" 
        ? "{{ url_for('static', filename='eye_closed.png') }}" 
        : "{{ url_for('static', filename='eye_open.png') }}";
    }
  });
}

chatBtn.addEventListener("click", () => {
  hidePopup(mainWindow);
  showPopup(chatWindow);
});

closeChat.addEventListener("click", () => hidePopup(chatWindow));

sendBtn.addEventListener("click", () => {
  let msg = chatInput.value.trim();
  if (!msg) return;
  let div = document.createElement("div");
  div.classList.add("message-user");
  div.textContent = msg;
  messageContainer.appendChild(div);
  chatInput.value = "";
});


// Enter 
loginInput && loginInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

passwordInput && passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") loginBtn.click();
});
// Отправка сообщения по Enter
chatInput && chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});


function hideAllPopups() {
  const popups = [islamPopup, authPopup, authLoading, mainWindow, chatWindow];
  popups.forEach(popup => {
    if (popup && popup.style.display === 'block') {
      hidePopup(popup);
    }
  });
}

// открытие меню по клику на три полоски
chatMenu.addEventListener("click", (e) => {
  e.stopPropagation();
  showPopup(menuWindow);
});

// закрытие меню
closeMenu.addEventListener("click", () => hidePopup(menuWindow));

// навигация по меню
menuHome.addEventListener("click", (e) => {
  e.preventDefault();
  hidePopup(menuWindow);
  showPopup(majorWindow);
});

menuChat.addEventListener("click", (e) => {
  e.preventDefault();
  hidePopup(menuWindow);
  showPopup(chatWindow);
});

menuSettings.addEventListener("click", (e) => {
  e.preventDefault();
  hidePopup(menuWindow);
  showPopup(settingsWindow); 
});

function hideAllPopups() {
  const popups = [islamPopup, authPopup, authLoading, mainWindow, chatWindow, menuWindow, settingsWindow];
  popups.forEach(popup => {
    if (popup && popup.style.display === 'block') {
      hidePopup(popup);
    }
  });
}

document.getElementById('clearChatHistory')?.addEventListener('change', function(e) {
  if (this.checked) {
    if (confirm("Вы уверены, что хотите очистить историю чата?")) {
      messageContainer.innerHTML = '';
      localStorage.removeItem('chatHistory');
      setTimeout(() => {
        this.checked = false;
      }, 500);
    } else {
      this.checked = false;
    }
  }
});


document.getElementById('aboutService')?.addEventListener('click', function() {
  alert("iMuslimEd - сервис для мусульманских студентов Московского Университета им. С.Ю. Витте\n\nВерсия 1.0");
});


document.getElementById('feedback')?.addEventListener('click', function() {
  alert("Для обратной связи напишите на email: support@imuslimed.ru\n\nМы ценим ваше мнение!");
});


document.getElementById('logoutBtn')?.addEventListener('click', function() {
  if (confirm("Вы уверены, что хотите выйти?")) {
  
    authFinished = false;
    islamAccepted = false;
  
    hideAllPopups();
    
    setTimeout(() => {
      showPopup(islamPopup);
    }, 300);
  }
});

closeSettings && closeSettings.addEventListener("click", () => hidePopup(settingsWindow));

document.getElementById('prayerTime')?.addEventListener('click', () => {
  showPrayerPopup(prayerPopup);
  loadPrayerTimes();
});

document.getElementById('closePrayerTimes')?.addEventListener('click', () => {
  hidePrayerPopup(prayerPopup);
});

// Открытие при клике на сектор
document.getElementById("prayerTime")?.addEventListener("click", () => {
  // Показываем окно поверх большого
  prayerPopupEl.style.display = "block";
  prayerPopupEl.classList.remove("popup-hidden");
  prayerPopupEl.classList.add("popup-visible");

  // Загружаем намаз
  loadPrayerTimes();
});

// Закрытие по кресту
closePrayerBtn?.addEventListener("click", () => {
  prayerPopupEl.classList.remove("popup-visible");
  prayerPopupEl.classList.add("popup-hidden");
  setTimeout(() => {
    prayerPopupEl.style.display = "none";
  }, 300);
});

// Функция загрузки намаза
async function loadPrayerTimes() {
  if (!prayerTimesContainer) return;

  prayerTimesContainer.textContent = "Загрузка…";

  const lat = 55.700283;
  const lon = 37.654942;

  try {
    const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json || !json.data || !json.data.timings) {
      throw new Error("Неверный ответ API");
    }

    const timings = json.data.timings;

    const now = new Date();

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const currentMinutes = now.getHours() * 60 + now.getMinutes();

const prayers = [
  { name: "Фаджр", time: timings.Fajr },
  { name: "Зухр", time: timings.Dhuhr },
  { name: "Аср", time: timings.Asr },
  { name: "Магриб", time: timings.Maghrib },
  { name: "Иша", time: timings.Isha }
];

let activeIndex = 0;

for (let i = 0; i < prayers.length; i++) {
  const cur = toMinutes(prayers[i].time);
  const next = prayers[i + 1] ? toMinutes(prayers[i + 1].time) : 24 * 60;

  if (currentMinutes >= cur && currentMinutes < next) {
    activeIndex = i;
    break;
  }
}

prayerTimesContainer.innerHTML = prayers.map((p, i) => `
  <div class="prayer-row ${i === activeIndex ? 'active-prayer' : ''}">
    <span>${p.name}</span>
    <span>${p.time}</span>
  </div>
`).join("");

  } catch (err) {
    console.error(err);
    prayerTimesContainer.textContent = "Ошибка при загрузке времени намаза";
  }
}

document.getElementById('faq')?.addEventListener('click', function() {
  alert("Функция 'Часто задаваемые вопросы' в разработке");
});


function hideAllPopups() {
  const popups = [islamPopup, authPopup, authLoading, mainWindow, chatWindow, menuWindow, settingsWindow, majorWindow];
  popups.forEach(popup => {
    if (popup && popup.style.display === 'block') {
      hidePopup(popup);
    }
  });
}

const closeMajor = document.getElementById('closeMajor');
closeMajor && closeMajor.addEventListener("click", () => hidePopup(majorWindow));


// клик вне окон:
document.addEventListener('click', (e) => {
  const popups = [
    { popup: islamPopup, btn: openIslamBtn },
    { popup: authPopup, btn: openIslamBtn },
    { popup: authLoading, btn: openIslamBtn },
    { popup: mainWindow, btn: openIslamBtn },
    { popup: chatWindow, btn: openIslamBtn },
    { popup: menuWindow, btn: chatMenu },
    { popup: settingsWindow, btn: menuSettings },
    { popup: majorWindow, btn: menuHome }  // Добавлено
  ];
  
  popups.forEach(({ popup, btn }) => {
    if (popup && 
        popup.style.display === 'block' && 
        !popup.contains(e.target) && 
        !btn.contains(e.target)) {
      hidePopup(popup);
    }
  });
});

// скрыть все попапы при загрузке
document.addEventListener('DOMContentLoaded', () => {
  hideAllPopups();
});