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


// import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
// import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } 
// from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// const firebaseConfig = {
//   apiKey: "AIzaSyDOyZryQlWssbHQyig0T-wZDUSh5H4gjFg",
//   authDomain: "running-zone-6fddb.firebaseapp.com",
//   projectId: "running-zone-6fddb",
// };

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);

// // SIGNUP
// window.signup = function () {
//   const email = document.getElementById("email").value;
//   const password = document.getElementById("password").value;

//   createUserWithEmailAndPassword(auth, email, password)
//     .then(() => {
//       alert("Account created ✅");
//       window.location.href = "login.html";
//     })
//     .catch(err => alert(err.message));
// };

// // LOGIN
// window.login = function () {
//   const email = document.getElementById("email").value;
//   const password = document.getElementById("password").value;

//   signInWithEmailAndPassword(auth, email, password)
//     .then(() => {
//       alert("Login successful ✅");
//       window.location.href = "index.html";
//     })
//     .catch(err => alert(err.message));
// };
