import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const form = document.getElementById("formConta");
const lista = document.getElementById("listaContas");
const graficoEl = document.getElementById("grafico");

let uid = null;
let chart = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    uid = user.uid;
    carregarContas();
  }
});

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

function carregarContas() {
  const q = query(collection(db, "contas"), where("uid", "==", uid));

  onSnapshot(q, (snapshot) => {
    lista.innerHTML = "";

    let feitas = 0;
    let pendentes = 0;
    let vencidas = 0;

    const hoje = new Date().toISOString().split("T")[0];

    snapshot.forEach((docSnap) => {
      const c = docSnap.data();
      let statusClass = "pendente";

      if (c.status === "feito") feitas++;
      else if (c.vencimento < hoje) {
        vencidas++;
        statusClass = "vencida";
      } else pendentes++;

      const li = document.createElement("li");
      li.innerHTML = `
        <div class="item ${statusClass}">
          <div>
            <b contenteditable="true">${c.descricao}</b><br>
            <small>${c.vencimento}</small>
          </div>

          <div class="acoes">
            <button class="ok">✔</button>
            <button class="editar">✏️</button>
            <button class="excluir">🗑️</button>
          </div>
        </div>
      `;

      // ✔ feito / desfazer
      li.querySelector(".ok").onclick = () =>
        updateDoc(doc(db, "contas", docSnap.id), {
          status: c.status === "feito" ? "pendente" : "feito"
        });

      // ✏️ editar
      li.querySelector(".editar").onclick = () => {
        const novoNome = prompt("Editar descrição:", c.descricao);
        if (novoNome)
          updateDoc(doc(db, "contas", docSnap.id), { descricao: novoNome });
      };

      // 🗑️ excluir
      li.querySelector(".excluir").onclick = () =>
        confirm("Excluir conta?")
          ? deleteDoc(doc(db, "contas", docSnap.id))
          : null;

      lista.appendChild(li);
    });

    atualizarGrafico(feitas, pendentes, vencidas);
  });
}

function atualizarGrafico(feitas, pendentes, vencidas) {
  if (chart) chart.destroy();

  chart = new Chart(graficoEl, {
    type: "pie",
    data: {
      labels: ["Feitas", "Pendentes", "Vencidas"],
      datasets: [{
        data: [feitas, pendentes, vencidas],
        backgroundColor: ["#2ecc71", "#f1c40f", "#e74c3c"]
      }]
    }
  });
}
