// глобальные переменные
let islamAccepted = false;     
let authFinished = false;
let currentLogin = "";
let currentPassword = "";
let chatMessages = [];
const LAST_AUTH_WINDOW_KEY = "lastAuthorizedWindow";

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

const chatWindow = document.getElementById("chatWindow");
const chatBtn = document.getElementById("askQuestionBtn");
const openMajorBtn = document.getElementById("openMajorBtn");
const closeChat = document.getElementById("closeChat");
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const messageContainer = document.getElementById("messageContainer");

// кнопки меню
const menuButtons = document.querySelectorAll(".chat-menu");
const menuWindow = document.getElementById("menuWindow");
const menuClose = document.getElementById("closeMenu");
const menuHome = document.getElementById("menuHome");
const menuChat = document.getElementById("menuChat");
const menuSettings = document.getElementById("menuSettings");

const settingsWindow = document.getElementById("settingsWindow");
const closeSettings = document.getElementById("closeSettings");

const majorWindow = document.getElementById("majorWindow");
const closeMajor = document.getElementById("closeMajor");

// дочерние окна (должны открываться поверх главного)
const prayerPopupEl = document.getElementById("prayerPopup");
const closePrayerBtn = document.getElementById("closePrayer");
const prayerTimesContainer = document.getElementById("prayerTimes");
const faqPopupEl = document.getElementById("faqPopup");
const closeFaqBtn = document.getElementById("closeFaq");

const halalPopupEl = document.getElementById("halalPopup");
const closeHalalBtn = document.getElementById("closeHalal");

const mosquePopupEl = document.getElementById("mosquePopup");
const closeMosqueBtn = document.getElementById("closeMosque");

//  основные функции 
function getWindowKey(windowElement) {
  if (windowElement === mainWindow) return "main";
  if (windowElement === chatWindow) return "chat";
  if (windowElement === majorWindow) return "major";
  if (windowElement === settingsWindow) return "settings";
  return "";
}

function getWindowByKey(windowKey) {
  if (windowKey === "main") return mainWindow;
  if (windowKey === "chat") return chatWindow;
  if (windowKey === "major") return majorWindow;
  if (windowKey === "settings") return settingsWindow;
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

// показать попап (заменяет другие окна)
function showPopup(popupElement) {
  if (!popupElement) {
    console.error("popup element not found!");
    return;
  }
  
  // скрыть только основные окна, но не дочерние 
  const mainPopups = [
    islamPopup, authPopup, authLoading, mainWindow, 
    chatWindow, menuWindow, settingsWindow, fioPopup
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
    
    console.log("hiding popup:", popupElement.id);
  }, 300);
}

// скрыть все попапы
function hideAllPopups() {
  const allPopups = [
    islamPopup, authPopup, authLoading, mainWindow, 
    chatWindow, menuWindow, settingsWindow, majorWindow,
    fioPopup, prayerPopupEl, faqPopupEl, halalPopupEl, mosquePopupEl
  ];
  
  allPopups.forEach(popup => {
    if (popup && popup.style.display === 'block') {
      hidePopup(popup);
    }
  });
}

// функция переключения главных окон
function switchMainWindow(windowElement) {
  const mainWindows = [majorWindow, chatWindow, settingsWindow];

  // закрываем все окна
  mainWindows.forEach(win => {
    if (win && win.style.display === 'block') {
      hidePopup(win);
    }
  });

  // если это то же окно — просто закрываем
  if (activeMainWindow === windowElement) {
    return;
  }

  // открываем новое окно
  setTimeout(() => {
    showPopup(windowElement);
    rememberAuthorizedWindow(windowElement);
  }, 50);
}

function initEventListeners() {
  
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

      const isAuthorized = localStorage.getItem("isAuthorized");
      const savedFio = localStorage.getItem("fio");
      
      // ========== 1. не авторизован ==========
      if (isAuthorized !== "true" || !savedFio) {
        
        // проверяем подтверждал ли ислам
        if (!islamConfirmed) {
          // если ислам не подтвержден — работаем с красным окном
          if (islamPopup.style.display === 'block') {
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
      if (profileName) profileName.textContent = savedFio;
      
      // все основные окна авторизованного пользователя
      const mainUserWindows = [mainWindow, majorWindow, chatWindow, settingsWindow, menuWindow];
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
        // если это не меню — запоминаем как последнее активное
        if (openMainWindow !== menuWindow) {
          if (openMainWindow === majorWindow || 
              openMainWindow === mainWindow ||
              openMainWindow === chatWindow || 
              openMainWindow === settingsWindow) {
            rememberAuthorizedWindow(openMainWindow);
          }
        }
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
  if (closePopup) closePopup.addEventListener("click", () => hidePopup(islamPopup));
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
  
  // переключатель  
  if (toggle) {
    toggle.addEventListener("change", function() {
      if (this.checked) {
        islamAccepted = true;
        islamConfirmed = true;
        localStorage.setItem("islamConfirmed", "true"); 
        this.disabled = true;
        
        setTimeout(() => {
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
    hidePopup(mainWindow);     // закрываем главное окно
    showPopup(chatWindow);     // открываем чат
    rememberAuthorizedWindow(chatWindow);
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
        e.stopPropagation();
        e.preventDefault();
        console.log("меню открыто через:", this);
        
        if (menuWindow) {
          showPopup(menuWindow);
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
      
      // если главная уже открыта — просто закрываем меню, главная остается
      if (majorWindow.style.display === 'block') {
        console.log("главная уже открыта");
        return;
      }
      
      // иначе открываем главную
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
      switchMainWindow(chatWindow);
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
      e.stopPropagation();
      e.preventDefault();
      showChildPopup(faqPopupEl);
    });

    closeFaqBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      hidePopup(faqPopupEl);
    });
  }

  // аккордеон FAQ
  const faqQuestionButtons = document.querySelectorAll(".faq-question");
  if (faqQuestionButtons.length > 0) {
    faqQuestionButtons.forEach((btn) => {
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        const faqItem = this.closest(".faq-item");
        if (!faqItem) return;
        faqItem.classList.toggle("open");
      });
    });
  }
  
  // халяль рядом 
  const halalBtn = document.getElementById("halalNearby");
  if (halalBtn && halalPopupEl && closeHalalBtn) {
    halalBtn.addEventListener("click", function(e) {
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
    clearChatCheckbox.addEventListener('change', function(e) {
      if (this.checked) {
        if (confirm("вы уверены, что хотите очистить историю чата?")) {
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
  }
  
  // о сервисе
  document.getElementById('aboutService')?.addEventListener('click', function() {
    alert("imuslimed - сервис для мусульманских студентов московского университета им. с.ю. витте\n\nверсия 1.0");
  });
  
  // обратная связь
  document.getElementById('feedback')?.addEventListener('click', function() {
    alert("для обратной связи напишите на email: support@imuslimed.ru\n\nмы ценим ваше мнение!");
  });
  
  // выход
  document.getElementById('logoutBtn')?.addEventListener('click', function() {
    if (confirm("вы уверены, что хотите выйти?")) {
      localStorage.removeItem("fio");
      localStorage.removeItem("chatHistory");
      localStorage.removeItem("isAuthorized");
      localStorage.removeItem("islamConfirmed"); 
      
      authFinished = false;
      islamAccepted = false;
      islamConfirmed = false; 
      currentLogin = "";
      currentPassword = "";
      
      if (loginInput) loginInput.value = "";
      if (passwordInput) passwordInput.value = "";
      if (fioInput) fioInput.value = "";
      
      if (profileName) {
        profileName.textContent = "";
      }
      
      // сбрасываем переключатель религии
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
  
  if (chatInput) chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });
}

function handleMainButtonClick(e) {
  e.stopPropagation();
  console.log("handleMainButtonClick - используется новый обработчик луны");
}

async function handleLogin() {
  const login = loginInput.value.trim();
  const password = passwordInput.value.trim();

  if (!login || !password) {
    alert("введите логин и пароль!");
    return;
  }

  currentLogin = login;
  currentPassword = password;

  showPopup(authLoading);

  try {
    const response = await fetch("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password })
    });

    const result = await response.json();
    hidePopup(authLoading);

    if (result.success) {
      // если пользователь новый или у него нет фио — обязательно ведем на ввод фио
      if (result.registered === false || !result.fio) {
        showPopup(fioPopup);
      } else {
        localStorage.setItem("isAuthorized", "true");

        if (result.fio) {
          localStorage.setItem("fio", result.fio);
          if (profileName) profileName.textContent = result.fio;
        }

        loginInput.value = "";
        passwordInput.value = "";

        showPopup(mainWindow);
        rememberAuthorizedWindow(mainWindow);
      }
    } else {
      alert(result.error || "ошибка входа");
    }
  } catch (error) {
    hidePopup(authLoading);
    alert("ошибка сети");
  }
}

async function handleSaveFio() {
  const fio = formatFIO(fioInput.value);
  
  // проверка на пустое значение
  if (!fio) {
    alert("введите фио");
    return;
  }
  
  // проверка на максимальную длину
  if (fio.length > 100) {
    alert("фио слишком длинное");
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
        fio: fio
      })
    });

    const result = await response.json();
    hidePopup(authLoading);

    if (result.success) {
      localStorage.setItem("fio", fio);
      localStorage.setItem("isAuthorized", "true");

      if (profileName) profileName.textContent = fio;

      fioInput.value = "";
      loginInput.value = "";
      passwordInput.value = "";

      showPopup(mainWindow);
      rememberAuthorizedWindow(mainWindow);
    } else {
      alert(result.error || "ошибка сохранения");
    }
  } catch (error) {
    hidePopup(authLoading);
    alert("ошибка сети");
  }
}

function sendMessage() {
  let msg = chatInput.value.trim();
  if (!msg) return;
  
  let div = document.createElement("div");
  div.classList.add("message-user");
  div.textContent = msg;
  messageContainer.appendChild(div);
  
  chatMessages.push({ type: 'user', text: msg });
  saveChatHistory();
  
  chatInput.value = "";
  messageContainer.scrollTop = messageContainer.scrollHeight;
  
  setTimeout(() => {
    let botDiv = document.createElement("div");
    botDiv.classList.add("message-bot");
    botDiv.textContent = "спасибо за ваше сообщение!";
    messageContainer.appendChild(botDiv);
    
    chatMessages.push({ type: 'bot', text: "спасибо за ваше сообщение!" });
    saveChatHistory();
    
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }, 1000);
}

function saveChatHistory() {
  if (messageContainer) {
    localStorage.setItem("chatHistory", messageContainer.innerHTML);
  }
}

// время намаза 
async function loadPrayerTimes() {
  if (!prayerTimesContainer) return;

  prayerTimesContainer.textContent = "загрузка…";

  const lat = 55.700283;
  const lon = 37.654942;

  try {
    const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json || !json.data || !json.data.timings) {
      throw new Error("неверный ответ api");
    }

    const timings = json.data.timings;
    const now = new Date();

    function toMinutes(t) {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: "фаджр", time: timings.Fajr },
      { name: "зухр", time: timings.Dhuhr },
      { name: "аср", time: timings.Asr },
      { name: "магриб", time: timings.Maghrib },
      { name: "иша", time: timings.Isha }
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
    prayerTimesContainer.textContent = "ошибка при загрузке времени намаза";
  }
}

// карты 
let halalMap = null;
let mosqueMap = null;

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
            const places = [
                { name: "Ресторан 'Шафран'", lat: 55.699634, lon: 37.657776 },
                { name: "Кафе 'Non gusht'", lat: 55.700903, lon: 37.651461 },
                { name: "Кафе 'Сочный вертел'", lat: 55.694225, lon: 37.665306 },
                { name: "Кафе 'Плов&бургер'", lat: 55.700121, lon: 37.657538 },
                { name: "Кофейня 'Здрасте'", lat: 55.690114, lon: 37.654806 },
            ];
            
            places.forEach(place => {
                L.marker([place.lat, place.lon])
                    .addTo(halalMap)
                    .bindPopup(place.name);
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
            const mosques = [
               { name: "Наследие Ислама", lat: 55.7176, lon: 37.6375 },
               { name: "Мечеть 'Соборная'", lat: 55.779167, lon: 37.626944 },
               { name: "Мечеть 'Ярдэм'", lat: 55.856667, lon: 37.592222 },
               { name: "Мечеть 'Мемориальная'", lat: 55.725377, lon: 37.497144 },
               { name: "Мечеть 'Историческая'", lat: 55.738803, lon: 37.632483 },
               { name: "Ресторан 'Шафран'", lat: 55.699634, lon: 37.657776 },
               { name: "Кафе 'Плов&бургер'", lat: 55.700121, lon: 37.657538 },

             ];
            
            mosques.forEach(mosque => {
                L.marker([mosque.lat, mosque.lon])
                    .addTo(mosqueMap)
                    .bindPopup(mosque.name);
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
  hideAllPopups();

  // проверка
  const isAuthorized = localStorage.getItem("isAuthorized");
  const savedFio = localStorage.getItem("fio");

  if (isAuthorized === "true" && savedFio) {
    profileName.textContent = savedFio;
    activeMainWindow = getRememberedAuthorizedWindow();
  }

  initEventListeners();
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
    { popup: majorWindow, btn: [openIslamBtn, openMajorBtn] },
    { popup: fioPopup, btn: null },
    { popup: prayerPopupEl, btn: document.getElementById('prayerTime') },
    { popup: faqPopupEl, btn: document.getElementById('faq') },
    { popup: halalPopupEl, btn: document.getElementById('halalNearby') },
    { popup: mosquePopupEl, btn: document.getElementById('mosque') }
  ];
  
  popups.forEach(({ popup, btn }) => {
    if (popup && popup.style.display === 'block') {
      const isClickInside = popup.contains(e.target);
      
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
      const isChildPopup = [prayerPopupEl, faqPopupEl, halalPopupEl, mosquePopupEl].includes(popup);
      const isClickOnParent = majorWindow && majorWindow.contains(e.target) && majorWindow.style.display === 'block';
      
      if (!isClickInside && !isButtonClick && !(isChildPopup && isClickOnParent)) {
        hidePopup(popup);
      }
    }
  });
});

console.log("script loaded successfully!");