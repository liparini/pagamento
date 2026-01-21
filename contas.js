import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const form = document.getElementById("formConta");
const lista = document.getElementById("listaContas");

let uid = null;

// Aguarda login
onAuthStateChanged(auth, (user) => {
  if (user) {
    uid = user.uid;
    carregarContas();
  } else {
    lista.innerHTML = "";
  }
});

// Salvar conta
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  await addDoc(collection(db, "contas"), {
    descricao: descricao.value,
    vencimento: vencimento.value,
    recorrente: recorrente.checked,
    status: "pendente",
    uid,
    criadoEm: serverTimestamp()
  });

  form.reset();
});

// Listar contas
function carregarContas() {
  const q = query(
    collection(db, "contas"),
    where("uid", "==", uid)
  );

  onSnapshot(q, (snapshot) => {
    lista.innerHTML = "";

    if (snapshot.empty) {
      lista.innerHTML = "<li>Nenhuma conta cadastrada</li>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const c = docSnap.data();

      const li = document.createElement("li");
      li.innerHTML = `
        <b>${c.descricao}</b><br>
        Vencimento: ${c.vencimento}<br>
        Status: ${c.status}<br>
        <button>Feito</button>
      `;

      li.querySelector("button").addEventListener("click", () => {
        updateDoc(doc(db, "contas", docSnap.id), { status: "feito" });
      });

      lista.appendChild(li);
    });
  });
}
