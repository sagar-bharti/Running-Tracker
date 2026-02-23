// Isse click karte hi run.html open hoga
function startRun(){
  window.location.href = "run.html";
}

document.addEventListener("DOMContentLoaded", function () {

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const profileWrapper = document.getElementById("profilewrapper");
  const authsection = document.querySelector(".auth");

  if (isLoggedIn === "true") {
    profileWrapper.style.display = "block";
    authsection.style.display = "none";

     const user = JSON.parse(localStorage.getItem("runnerUser"));
  document.getElementById("userName").innerText = user.name;
  } else {
    profileWrapper.style.display = "none";
    authsection.style.display = "block";
  }

});

function logout() {

  localStorage.removeItem("isLoggedIn");

  alert("Logged Out 👋");

  window.location.href = "index.html";
}

function toggleMenu() {
  document.getElementById("profileMenu").classList.toggle("show-menu");
}
