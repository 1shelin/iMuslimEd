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
// отправка сообщения по Enter
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

// клик вне окон закрывает их
document.addEventListener('click', (e) => {
  const popups = [
    { popup: islamPopup, btn: openIslamBtn },
    { popup: authPopup, btn: openIslamBtn },
    { popup: authLoading, btn: openIslamBtn },
    { popup: mainWindow, btn: openIslamBtn },
    { popup: chatWindow, btn: openIslamBtn }
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