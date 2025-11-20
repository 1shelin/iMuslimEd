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
const passwordIcon = togglePassword.querySelector("img");

const authLoading = document.getElementById("authLoading");
const closeLoading = document.getElementById("closeLoading");

let islamAccepted = false;

// показ окна
function showPopup(popupElement) {
  hideAllPopups();
  popupElement.style.display = 'block';
  setTimeout(() => {
    popupElement.classList.add('popup-visible');
  }, 50);
}

// скрытие окна
function hidePopup(popupElement) {
  popupElement.classList.remove('popup-visible');
  popupElement.classList.add('popup-hidden');
  setTimeout(() => {
    popupElement.classList.remove('popup-hidden');
    popupElement.style.display = 'none';
  }, 300);
}

// убрать оба
function hideAllPopups() {
  [islamPopup, authPopup, authLoading].forEach(popup => {
    if (popup.style.display === 'block') hidePopup(popup);
  });
}

// кнопка луна
openIslamBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (islamAccepted) {
    authPopup.style.display === "block" ? hidePopup(authPopup) : showPopup(authPopup);
  } else {
    islamPopup.style.display === "block" ? hidePopup(islamPopup) : showPopup(islamPopup);
  }
});

// крестики
closePopup.addEventListener("click", () => hidePopup(islamPopup));
closeAuth.addEventListener("click", () => hidePopup(authPopup));
closeLoading.addEventListener("click", () => hidePopup(authLoading));

// переключатель
toggle.addEventListener("change", () => {
  if (toggle.checked) {
    islamAccepted = true;
    setTimeout(() => {
      hidePopup(islamPopup);
      setTimeout(() => showPopup(authPopup), 200);
    }, 400);
  } else islamAccepted = false;
});

// клик вне окна
document.addEventListener('click', (e) => {
  if (!islamPopup.contains(e.target) && !openIslamBtn.contains(e.target)) hidePopup(islamPopup);
  if (!authPopup.contains(e.target) && !openIslamBtn.contains(e.target)) hidePopup(authPopup);
  if (!authLoading.contains(e.target) && !openIslamBtn.contains(e.target)) hidePopup(authLoading);
});

// нажимаем "войти"
loginBtn.addEventListener("click", async () => {
  const login = loginInput.value.trim();
  const password = passwordInput.value.trim();

  if (!login || !password) {
    alert("Введите логин и пароль!");
    return;
  }

  hidePopup(authPopup);
  setTimeout(() => showPopup(authLoading), 200);

  try {
    const response = await fetch("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password })
    });

    const result = await response.json();
    console.log(result);

    setTimeout(() => {
      hidePopup(authLoading);
      // здесь откроем следующее окно (потом сделать)
      alert("Авторизация успешна! Можно переходить к следующему окну.");
    }, 2000);
  } catch (error) {
    console.error("Ошибка авторизации:", error);
    hidePopup(authLoading);
    alert("Ошибка авторизации. Попробуйте снова.");
  }
});

// переключение видимости пароля
togglePassword.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;

  passwordIcon.src = type === "password" 
    ? "/static/eye_closed.png"
    : "/static/eye_open.png";
});

// Обработка нажатия Enter в полях ввода
loginInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    loginBtn.click();
  }
});

passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    loginBtn.click();
  }
});