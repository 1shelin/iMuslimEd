const openIslamBtn = document.getElementById("openIslamBtn");
const islamPopup = document.getElementById("islamPopup");
const closePopup = document.getElementById("closePopup");

openIslamBtn.addEventListener("click", () => {
  islamPopup.style.display = "block";
});

closePopup.addEventListener("click", () => {
  islamPopup.style.display = "none";
});
