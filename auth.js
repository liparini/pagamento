import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.login = async () => {
  await signInWithEmailAndPassword(auth, email.value, senha.value);
};

window.registrar = async () => {
  await createUserWithEmailAndPassword(auth, email.value, senha.value);
};

window.logout = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  login.style.display = user ? "none" : "block";
  app.style.display = user ? "block" : "none";
});
