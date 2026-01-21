import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const btnGoogle = document.getElementById("btnGoogle");
const btnLogout = document.getElementById("btnLogout");

btnGoogle.onclick = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
};

btnLogout.onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  document.getElementById("loginBox").style.display = user ? "none" : "block";
  document.getElementById("app").style.display = user ? "block" : "none";
});
