console.log("contas.js carregado");

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  console.log("auth mudou", user);

  if (!user) return;

  const contasDiv = document.getElementById("contas");

  contasDiv.innerHTML = `
    <h3>TESTE OK</h3>
    <input placeholder="Descrição">
    <button>Salvar</button>
  `;
});
