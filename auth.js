import { app } from "./firebase.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");

btnLogin.onclick = () => signInWithPopup(auth, provider);
btnLogout.onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  document.getElementById("cadastro").style.display = user ? "block" : "none";
  document.getElementById("lista").style.display = user ? "block" : "none";
  document.getElementById("dashboard").style.display = user ? "block" : "none";
  btnLogin.style.display = user ? "none" : "inline";
  btnLogout.style.display = user ? "inline" : "none";
});
