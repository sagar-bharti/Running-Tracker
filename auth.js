function signup() {

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    alert("Please fill all fields");
    return;
  }

  const user = { name, email, password };

  localStorage.setItem("runnerUser", JSON.stringify(user));

  // USER AUTOMATIC LOGIN AFTER SIGNUP
  localStorage.setItem("isLoggedIn", "true");

  alert("Account Created 🎉");
  window.location.href = "index.html";
}


function login() {

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const storedUser = JSON.parse(localStorage.getItem("runnerUser"));

  if (!storedUser) {
    alert("No account found");
    return;
  }

  if (email === storedUser.email && password === storedUser.password) {

    // LOGIN SESSION SAVE
    localStorage.setItem("isLoggedIn", "true");

    alert("Login Successful 🚀");
    window.location.href = "index.html";

  } else {
    alert("Invalid credentials ❌");
  }
}



