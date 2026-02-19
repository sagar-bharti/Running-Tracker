// LOAD USER
const user = JSON.parse(localStorage.getItem("runnerUser"));

if (user) {
  document.getElementById("userName").innerText = user.name;
}

// TOGGLE MENU
function toggleMenu() {
  const menu = document.getElementById("profileMenu");
  menu.style.display =
    menu.style.display === "block" ? "none" : "block";
}

// LOGOUT
function logout() {
  localStorage.removeItem("runnerUser");
  window.location.href = "login.html";
}

// GO PROFILE
function goProfile() {
  window.location.href = "profile.html";
}
