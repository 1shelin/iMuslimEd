// script.js (заменить полностью содержимое файла)

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

// состояния
let islamAccepted = false;     
let authInProgress = false;    
let authLocked = false;        
let authFinished = false; 

// показать попап с анимацией
function showPopup(popupElement) {
  if (!popupElement) return;
  hideAllPopups();
  popupElement.style.display = 'block';
  // небольшая задержка чтобы сработала анимация css
  setTimeout(() => popupElement.classList.add('popup-visible'), 50);
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
  [islamPopup, authPopup, authLoading].forEach(p => {
    if (p && p.style.display === 'block') hidePopup(p);
  });
}

// обработка клика по кнопке (лунe)
openIslamBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  // если уже авторизовались - всегда показываем окно загрузки
  if (authFinished) {
    hidePopup(authPopup);
    hidePopup(islamPopup);
    authLoading.style.display === "block"
      ? hidePopup(authLoading)
      : showPopup(authLoading);
    return;
  }

  // обычная логика до авторизации
  if (islamAccepted) {
    authPopup.style.display === "block" ? hidePopup(authPopup) : showPopup(authPopup);
  } else {
    islamPopup.style.display === "block" ? hidePopup(islamPopup) : showPopup(islamPopup);
  }
});

// крестики закрывают соответствующие окна
closePopup && closePopup.addEventListener("click", () => hidePopup(islamPopup));
closeAuth && closeAuth.addEventListener("click", () => {
  hidePopup(authPopup);
});
closeLoading.addEventListener("click", () => hidePopup(authLoading));


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
  authFinished = true; 

  hidePopup(authPopup);
  setTimeout(() => showPopup(authLoading), 200);


  // показываем окно загрузки (authLoading)
  setTimeout(() => {
    showPopup(authLoading);
    authInProgress = true;
  }, 200);

  // отправляем запрос на сервер
  try {
    const response = await fetch("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password })
    });

    const result = await response.json();
    console.log("auth result:", result);

    setTimeout(() => {
      hidePopup(authLoading);
      authInProgress = false;

      if (result.success) {
        if (result.new) {
          alert("новый пользователь сохранён");
        } else {
          alert("авторизация успешна!");
        }
      } else {
        alert(result.error || "ошибка авторизации");
        authLocked = false;
        showPopup(authPopup);
      }
    }, 1000);
  } catch (err) {
    console.error("fetch /auth error:", err);
    hidePopup(authLoading);
    authInProgress = false;
    alert("ошибка сети при авторизации");
    authLocked = false;
    showPopup(authPopup);
  }
});

// переключение видимости пароля (глаз)
if (togglePassword) {
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    if (passwordIcon) {
      passwordIcon.src = type === "password" ? "/static/eye_closed.png" : "/static/eye_open.png";
    }
  });
}

// Enter 
loginInput && loginInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") loginBtn && loginBtn.click();
});
passwordInput && passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") loginBtn && loginBtn.click();
});

// клик вне окон закрывает их
document.addEventListener('click', (e) => {
  if (islamPopup && !islamPopup.contains(e.target) && !openIslamBtn.contains(e.target)) hidePopup(islamPopup);
  if (authPopup && !authPopup.contains(e.target) && !openIslamBtn.contains(e.target)) hidePopup(authPopup);
  if (authLoading && !authLoading.contains(e.target) && !openIslamBtn.contains(e.target)) hidePopup(authLoading);
});
