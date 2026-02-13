// глобальные переменные
let islamAccepted = false;     
let authFinished = false;
let currentLogin = "";
let currentPassword = "";
let chatMessages = [];

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
const chatBtn = document.querySelector(".main-btn");
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

const halalPopupEl = document.getElementById("halalPopup");
const closeHalalBtn = document.getElementById("closeHalal");

const mosquePopupEl = document.getElementById("mosquePopup");
const closeMosqueBtn = document.getElementById("closeMosque");

//  ОСНОВНЫЕ ФУНКЦИИ 

//показать попап (заменяет другие окна)
function showPopup(popupElement) {
  if (!popupElement) {
    console.error("Popup element not found!");
    return;
  }
  
  // скрыть ТОЛЬКО основные окна, но НЕ дочерние 
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
  
  console.log("Showing popup:", popupElement.id);
}

// показать дочернее окно (поверх текущего, не закрывая его)
function showChildPopup(popupElement) {
  if (!popupElement) {
    console.error("Child popup element not found!");
    return;
  }
  
  // не закрывать другие окна, показ дочерних поверх
  popupElement.style.display = 'block';
  popupElement.classList.remove('popup-hidden');
  popupElement.classList.add('popup-visible');
  
  // устанавливаем высокий z-index
  popupElement.style.zIndex = '2000';
  
  console.log("Showing child popup:", popupElement.id);
}

// скрыть попап с анимацией
function hidePopup(popupElement) {
  if (!popupElement) return;
  
  popupElement.classList.remove('popup-visible');
  popupElement.classList.add('popup-hidden');
  
  setTimeout(() => {
    popupElement.classList.remove('popup-hidden');
    popupElement.style.display = 'none';
    // Сброс z-index
    popupElement.style.zIndex = '';
    console.log("Hiding popup:", popupElement.id);
  }, 300);
}

// скрыть все попапы
function hideAllPopups() {
  const allPopups = [
    islamPopup, authPopup, authLoading, mainWindow, 
    chatWindow, menuWindow, settingsWindow, majorWindow,
    fioPopup, prayerPopupEl, halalPopupEl, mosquePopupEl
  ];
  
  allPopups.forEach(popup => {
    if (popup && popup.style.display === 'block') {
      hidePopup(popup);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded");

  // скрываем всё при загрузке
  hideAllPopups();

  // проверкаы авторизации
  const isAuthorized = localStorage.getItem("isAuthorized");
  const savedFio = localStorage.getItem("fio");

  if (isAuthorized === "true" && savedFio) {
    profileName.textContent = savedFio;
  }

  initEventListeners();
});

function initEventListeners() {
  // ссновная кнопка (луна)
  if (openIslamBtn) {
    openIslamBtn.addEventListener("click", handleMainButtonClick);
    console.log("Main button listener attached");
  } else {
    console.error("Main button not found!");
  }
  
  // кнопки закрытия
  if (closePopup) closePopup.addEventListener("click", () => hidePopup(islamPopup));
  if (closeAuth) closeAuth.addEventListener("click", () => hidePopup(authPopup));
  if (closeLoading) closeLoading.addEventListener("click", () => hidePopup(authLoading));
  if (closeMain) closeMain.addEventListener("click", () => hidePopup(mainWindow));
  if (closeChat) closeChat.addEventListener("click", () => hidePopup(chatWindow));
  if (closeFio) closeFio.addEventListener("click", () => {
    hidePopup(fioPopup);
    currentLogin = "";
    currentPassword = "";
  });
  
  // переключатель 
  if (toggle) {
    toggle.addEventListener("change", function() {
      if (this.checked) {
        islamAccepted = true;
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
  
  // кнопка сохранения ФИО
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
  
  // чат
  if (chatBtn) chatBtn.addEventListener("click", () => {
    hidePopup(mainWindow);
    showPopup(chatWindow);
  });
  
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);
  
  //  КНОПКА МЕНЮ (3 ПОЛОСКИ) 
  if (menuButtons && menuButtons.length > 0) {
    menuButtons.forEach(btn => {
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        console.log("Меню открыто через:", this);
        
        if (menuWindow) {
          showPopup(menuWindow);
        }
      });
    });
    console.log(`Attached menu listeners to ${menuButtons.length} button(s)`);
  }
  
  // закрытие меню
  if (menuClose) {
    menuClose.addEventListener("click", function(e) {
      e.stopPropagation();
      e.preventDefault();
      hidePopup(menuWindow);
    });
  }
  
  // навигация в меню
  if (menuHome) {
    menuHome.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("Меню: Главная");
      hidePopup(menuWindow);
      showPopup(majorWindow);
    });
  }

  if (menuChat) {
    menuChat.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("Меню: Чат");
      hidePopup(menuWindow);
      showPopup(chatWindow);
    });
  }

  if (menuSettings) {
    menuSettings.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("Меню: Настройки");
      hidePopup(menuWindow);
      showPopup(settingsWindow);
    });
  }

  // закрытие главного окна
  if (closeMajor) {
    closeMajor.addEventListener("click", function(e) {
      e.stopPropagation();
      hidePopup(majorWindow);
    });
  }
  
  // настройки
  if (closeSettings) closeSettings.addEventListener("click", () => hidePopup(settingsWindow));
  
  //  ВРЕМЯ НАМАЗА 
  const prayerTimeElement = document.getElementById('prayerTime');
  if (prayerTimeElement && prayerPopupEl && closePrayerBtn) {
    prayerTimeElement.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log("Opening prayer times");
      
      showChildPopup(prayerPopupEl);
      loadPrayerTimes();
    });
    
    closePrayerBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      hidePopup(prayerPopupEl);
    });
  }
  
    //  ХАЛЯЛЬ РЯДОМ 
  const halalBtn = document.getElementById("halalNearby");
  if (halalBtn && halalPopupEl && closeHalalBtn) {
    halalBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log("Opening halal map");
      
      showChildPopup(halalPopupEl);
      
      setTimeout(() => {
        if (!window.halalMap) {
          initHalalMap();
        } else {
          window.halalMap.invalidateSize();
        }
      }, 200); 
    });
    
    closeHalalBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      hidePopup(halalPopupEl);
    });
  }
  
//  МЕЧЕТЬ/МОЛЕЛЬНАЯ
const mosqueBtn = document.getElementById("mosque");
if (mosqueBtn && mosquePopupEl && closeMosqueBtn) {
  mosqueBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log("Opening mosque map");
    
    showChildPopup(mosquePopupEl);
    
    // инициализация карты 
    setTimeout(() => {
      if (!window.mosqueMap) {
        initMosqueMap();
      } else {
        window.mosqueMap.invalidateSize();
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
  }
  
  // о сервисе
  document.getElementById('aboutService')?.addEventListener('click', function() {
    alert("iMuslimEd - сервис для мусульманских студентов Московского Университета им. С.Ю. Витте\n\nВерсия 1.0");
  });
  
  // обратная связь
  document.getElementById('feedback')?.addEventListener('click', function() {
    alert("Для обратной связи напишите на email: support@imuslimed.ru\n\nМы ценим ваше мнение!");
  });
  
  // выход
  document.getElementById('logoutBtn')?.addEventListener('click', function() {
    if (confirm("Вы уверены, что хотите выйти?")) {
      localStorage.removeItem("fio");
      localStorage.removeItem("chatHistory");
      localStorage.removeItem("isAuthorized");
      
      authFinished = false;
      islamAccepted = false;
      currentLogin = "";
      currentPassword = "";
      
      if (loginInput) loginInput.value = "";
      if (passwordInput) passwordInput.value = "";
      if (fioInput) fioInput.value = "";
      
      if (profileName) {
        profileName.textContent = "";
      }
      
      // Сбрасываем переключатель религии
      if (toggle) {
        toggle.checked = false;
        toggle.disabled = false;
      }
      
      hideAllPopups();
      
      setTimeout(() => {
        showPopup(islamPopup);
      }, 300);
    }
  });
  
  // FAQ
  document.getElementById('faq')?.addEventListener('click', function() {
    alert("Функция 'Часто задаваемые вопросы' в разработке");
  });
  
  // Enter в полях ввода
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

  const isAuthorized = localStorage.getItem("isAuthorized");
  const savedFio = localStorage.getItem("fio");

  if (isAuthorized === "true" && savedFio) {
    if (profileName) profileName.textContent = savedFio;
    showPopup(majorWindow);
  } else {
    showPopup(islamPopup);
  }
}

async function handleLogin() {
  const login = loginInput.value.trim();
  const password = passwordInput.value.trim();

  if (!login || !password) {
    alert("Введите логин и пароль!");
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
      if (result.registered === false) {
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

        setTimeout(() => {
          hidePopup(mainWindow);
        }, 3000);
      }
    } else {
      alert(result.error || "Ошибка входа");
    }
  } catch (error) {
    hidePopup(authLoading);
    alert("Ошибка сети");
  }
}

async function handleSaveFio() {
  const fio = fioInput.value.trim();

  if (!fio) {
    alert("Введите ФИО");
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

      setTimeout(() => {
        hidePopup(mainWindow);
      }, 3000);
    } else {
      alert(result.error || "Ошибка сохранения");
    }
  } catch (error) {
    hidePopup(authLoading);
    alert("Ошибка сети");
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
    botDiv.textContent = "Спасибо за ваше сообщение!";
    messageContainer.appendChild(botDiv);
    
    chatMessages.push({ type: 'bot', text: "Спасибо за ваше сообщение!" });
    saveChatHistory();
    
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }, 1000);
}

function saveChatHistory() {
  if (messageContainer) {
    localStorage.setItem("chatHistory", messageContainer.innerHTML);
  }
}

//  ВРЕМЯ НАМАЗА 

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

//  КАРТЫ 
let halalMap = null;
let mosqueMap = null;

function initHalalMap() {
    console.log("Инициализация карты халяль...");
    
    const mapElement = document.getElementById('halalMap');
    if (!mapElement) {
        console.error("Элемент halalMap не найден!");
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
            console.log("Размеры элемента:", rect.width, "x", rect.height);
            
            if (rect.width === 0 || rect.height === 0) {
                console.warn("Элемент карты имеет нулевой размер!");
            }
            
            // создание карт
            halalMap = L.map('halalMap').setView([55.700283, 37.654942], 15);
            
            // тайлы OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(halalMap);
            
            // маркеры
            const places = [
                { name: "Ресторан 'Шафран'", lat: 55.699634, lon: 37.657776 },
                { name: "Кафе 'Non Gusht'", lat: 55.700903, lon: 37.651461 },
                { name: "Кафе 'Сочный Вертел'", lat: 55.694225, lon: 37.665306 },
                { name: "Кафе 'Плов&Бургер'", lat: 55.700121, lon: 37.657538 },
                { name: "Кофейня 'Здрасте'", lat: 55.690114, lon: 37.654806 },
            ];
            
            places.forEach(place => {
                L.marker([place.lat, place.lon])
                    .addTo(halalMap)
                    .bindPopup(place.name);
            });
            
            // обновленме размер карты
            setTimeout(() => {
                if (halalMap) {
                    halalMap.invalidateSize();
                    console.log("Карта халяль обновлена");
                }
            }, 100);
            
            console.log("Карта халяль успешно создана!");
        }, 300);
        
    } catch (error) {
        console.error("Ошибка при создании карты халяль:", error);
    }
}

function initMosqueMap() {
    console.log("Инициализация карты мечетей...");
    
    // элемент карты
    const mapElement = document.getElementById('mosqueMap');
    if (!mapElement) {
        console.error("Элемент mosqueMap не найден!");
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
            console.log("Размеры элемента:", rect.width, "x", rect.height);
            
            if (rect.width === 0 || rect.height === 0) {
                console.warn("Элемент карты имеет нулевой размер!");
            }
            
            // Создание карты
            mosqueMap = L.map('mosqueMap').setView([55.700283, 37.654942], 12);
            
            // OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mosqueMap);
            
            // маркеры мечетей
            const mosques = [
               { name: "Наследие Ислама", lat: 55.7176, lon: 37.6375 },
               { name: "Мечеть 'Соборная'", lat: 55.779167, lon: 37.626944 },
               { name: "Мечеть 'Ярдэм'", lat: 55.856667, lon: 37.592222 },
               { name: "Мечеть 'Мемориальная'", lat: 55.725377, lon: 37.497144 },
               { name: "Мечеть 'Историческая'", lat: 55.738803, lon: 37.632483 },
               { name: "Ресторан 'Шафран'", lat: 55.699634, lon: 37.657776 },
               { name: "Кафе 'Плов&Бургер'", lat: 55.700121, lon: 37.657538 },
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
                    console.log("Карта мечетей обновлена");
                }
            }, 100);
            
            console.log("Карта мечетей успешно создана!");
        }, 300);
        
    } catch (error) {
        console.error("Ошибка при создании карты мечетей:", error);
    }
}

// ДЛЯ КАРТ
function setupMapHandlers() {
    console.log("Настройка обработчиков карт...");
    
    // ХАЛЯЛЬ
    const halalBtn = document.getElementById("halalNearby");
    const halalPopup = document.getElementById("halalPopup");
    const closeHalal = document.getElementById("closeHalal");
    
    if (halalBtn && halalPopup) {
        const newHalalBtn = halalBtn.cloneNode(true);
        halalBtn.parentNode.replaceChild(newHalalBtn, halalBtn);
        
        newHalalBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Клик по кнопке Халяль");
            
            showChildPopup(halalPopup);
            
            initHalalMap();
        });
    }
    
    // МЕЧЕТЬ
    const mosqueBtn = document.getElementById("mosque");
    const mosquePopup = document.getElementById("mosquePopup");
    const closeMosque = document.getElementById("closeMosque");
    
    if (mosqueBtn && mosquePopup) {
        const newMosqueBtn = mosqueBtn.cloneNode(true);
        mosqueBtn.parentNode.replaceChild(newMosqueBtn, mosqueBtn);
        
        newMosqueBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Клик по кнопке Мечеть");
            
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

document.addEventListener('DOMContentLoaded', function() {
  hideAllPopups();

  // проверка
  const isAuthorized = localStorage.getItem("isAuthorized");
  const savedFio = localStorage.getItem("fio");

  if (isAuthorized === "true" && savedFio) {
    profileName.textContent = savedFio;
  }

  initEventListeners();
  
  setTimeout(setupMapHandlers, 500);
});

//  закрытие
document.addEventListener('click', (e) => {
  const popups = [
    { popup: islamPopup, btn: openIslamBtn },
    { popup: authPopup, btn: openIslamBtn },
    { popup: authLoading, btn: openIslamBtn },
    { popup: mainWindow, btn: openIslamBtn },
    { popup: chatWindow, btn: chatBtn },
    { popup: menuWindow, btn: menuButtons },
    { popup: settingsWindow, btn: menuSettings },
    { popup: majorWindow, btn: openIslamBtn },
    { popup: fioPopup, btn: null },
    { popup: prayerPopupEl, btn: document.getElementById('prayerTime') },
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
      const isChildPopup = [prayerPopupEl, halalPopupEl, mosquePopupEl].includes(popup);
      const isClickOnParent = majorWindow && majorWindow.contains(e.target) && majorWindow.style.display === 'block';
      
      if (!isClickInside && !isButtonClick && !(isChildPopup && isClickOnParent)) {
        hidePopup(popup);
      }
    }
  });
});

console.log("Script loaded successfully!");