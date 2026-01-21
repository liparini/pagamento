import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

btnGoogle.onclick = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
};

btnLogout.onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  loginBox.style.display = user ? "none" : "block";
  app.style.display = user ? "block" : "none";
});
