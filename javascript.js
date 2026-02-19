// Isse click karte hi run.html open hoga
function startRun(){
  window.location.href = "run.html";
}

document.addEventListener("DOMContentLoaded", function () {

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const profileWrapper = document.getElementById("profilewrapper");
  const loginBtn = document.querySelector(".auth");

  if (isLoggedIn === "true") {
    profileWrapper.style.display = "block";
    loginBtn.style.display = "none";
  } else {
    profileWrapper.style.display = "none";
  }

});

function logout() {
  localStorage.removeItem("isLoggedIn");
  location.reload();
}

