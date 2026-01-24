import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEScK6Aa7SUAC4FGge50MxyW6pIS6S14U",
  authDomain: "controle-contas-49411.firebaseapp.com",
  projectId: "controle-contas-49411",
  storageBucket: "controle-contas-49411.firebasestorage.app",
  messagingSenderId: "37137953658",
  appId: "1:37137953658:web:001611f15d9f40f49d5cc3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
