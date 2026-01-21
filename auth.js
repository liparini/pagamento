// auth.js
import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Provedor Google
const provider = new GoogleAuthProvider();

// LOGIN COM GOOGLE
window.loginGoogle = function () {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Usuário logado:", result.user);
    })
    .catch((error) => {
      console.error("Erro no login:", error);
      alert("Erro ao fazer login com Google");
    });
};

// LOGOUT
window.logout = function () {
  signOut(auth)
    .then(() => {
      console.log("Logout realizado");
    })
    .catch((error) => {
      console.error("Erro ao sair:", error);
    });
};

// OBSERVADOR DE LOGIN
onAuthStateChanged(auth, (user) => {
  const loginDiv = document.getElementById("login");
  const appDiv = document.getElementById("app");

  if (user) {
    // Usuário autenticado
    loginDiv.style.display = "none";
    appDiv.style.display = "block";
    console.log("Usuário autenticado:", user.email);
  } else {
    // Não autenticado
    loginDiv.style.display = "block";
    appDiv.style.display = "none";
  }
});
