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

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const form = document.getElementById("formConta");
const lista = document.getElementById("listaContas");

const totalEl = document.getElementById("total");
const feitasEl = document.getElementById("feitas");
const pendentesEl = document.getElementById("pendentes");
const vencidasEl = document.getElementById("vencidas");

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

// Carregar contas + dashboard
function carregarContas() {
  const q = query(collection(db, "contas"), where("uid", "==", uid));

  onSnapshot(q, (snapshot) => {
    lista.innerHTML = "";

    let total = 0;
    let feitas = 0;
    let pendentes = 0;
    let vencidas = 0;

    const hoje = new Date().toISOString().split("T")[0];

    snapshot.forEach((docSnap) => {
      const c = docSnap.data();
      total++;

      if (c.status === "feito") feitas++;
      else if (c.vencimento < hoje) vencidas++;
      else pendentes++;

      const li = document.createElement("li");
      li.innerHTML = `
        <div class="item">
          <div>
            <b>${c.descricao}</b><br>
            <small>Vencimento: ${c.vencimento}</small>
          </div>
          <div>
            <span class="status ${c.status}">${c.status}</span>
            ${
              c.status !== "feito"
                ? `<button>Feito</button>`
                : ""
            }
          </div>
        </div>
      `;

      if (c.status !== "feito") {
        li.querySelector("button").onclick = () =>
          updateDoc(doc(db, "contas", docSnap.id), { status: "feito" });
      }

      lista.appendChild(li);
    });

    totalEl.textContent = total;
    feitasEl.textContent = feitas;
    pendentesEl.textContent = pendentes;
    vencidasEl.textContent = vencidas;
  });
}
