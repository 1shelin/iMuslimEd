const openIslamBtn = document.getElementById("openIslamBtn");
const islamPopup = document.getElementById("islamPopup");
const closePopup = document.getElementById("closePopup");
const authPopup = document.getElementById("authPopup");
const closeAuth = document.getElementById("closeAuth");
const toggle = document.getElementById("religionToggle");
let islamAccepted = false;

// для показа попапа с анимацией
function showPopup(popupElement) {
  hideAllPopups();
  
  popupElement.style.display = 'block';
  setTimeout(() => {
    popupElement.classList.add('popup-visible');
  }, 50);
}

// для скрытия попапа с анимацией
function hidePopup(popupElement) {
  popupElement.classList.remove('popup-visible');
  popupElement.classList.add('popup-hidden');
  setTimeout(() => {
    popupElement.classList.remove('popup-hidden');
    popupElement.style.display = 'none';
  }, 300);
}

// для скрытия всех попапов
function hideAllPopups() {
  [islamPopup, authPopup].forEach(popup => {
    if (popup.style.display === 'block') {
      hidePopup(popup);
    }
  });
}

// кнопка с луной 
openIslamBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  
  if (islamAccepted) {
    if (authPopup.style.display === "block") {
      hidePopup(authPopup);
    } else {
      showPopup(authPopup);
    }
  } else {
    if (islamPopup.style.display === "block") {
      hidePopup(islamPopup);
    } else {
      showPopup(islamPopup);
    }
  }
});

// - красное окно
closePopup.addEventListener("click", () => {
  hidePopup(islamPopup);
});

// - зелёное окно
closeAuth.addEventListener("click", () => {
  hidePopup(authPopup);
});

// переключатель
toggle.addEventListener("change", () => {
  if (toggle.checked) {
    islamAccepted = true;
    setTimeout(() => {
      hidePopup(islamPopup);
      setTimeout(() => {
        showPopup(authPopup);
      }, 200);
    }, 400);
  } else {
    islamAccepted = false;
  }
});

// закрытие по клику вне окна
document.addEventListener('click', (e) => {
  if (!islamPopup.contains(e.target) && !openIslamBtn.contains(e.target)) {
    hidePopup(islamPopup);
  }
  if (!authPopup.contains(e.target) && !openIslamBtn.contains(e.target)) {
    hidePopup(authPopup);
  }
});