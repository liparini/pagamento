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

// ===== ELEMENTOS =====
const form = document.getElementById("formConta");
const lista = document.getElementById("listaContas");
const graficoEl = document.getElementById("grafico");

const descricao = document.getElementById("descricao");
const vencimento = document.getElementById("vencimento");
const recorrente = document.getElementById("recorrente");

// ===== ESTADO =====
let uid = null;
let contasCache = [];
let chart = null;

// ===== AUTH =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    uid = user.uid;
    escutarContas();
  }
});

// ===== CADASTRO =====
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

// ===== FIRESTORE =====
function escutarContas() {
  const q = query(collection(db, "contas"), where("uid", "==", uid));

  onSnapshot(q, (snapshot) => {
    contasCache = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    renderizarLista(contasCache);
    atualizarDashboard(contasCache);
  });
}

// ===== LISTA =====
function renderizarLista(contas) {
  lista.innerHTML = "";
  const hoje = new Date().toISOString().split("T")[0];

  contas.forEach(c => {
    let statusClass = "pendente";

    if (c.status === "feito") statusClass = "feito";
    else if (c.vencimento < hoje) statusClass = "vencida";

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item ${statusClass}">
        <div>
          <b>${c.descricao}</b><br>
          <small>${c.vencimento}</small>
        </div>

        <div class="acoes">
          <button class="ok">✔</button>
          <button class="editar">✏️</button>
          <button class="excluir">🗑️</button>
        </div>
      </div>
    `;

    li.querySelector(".ok").onclick = () =>
      updateDoc(doc(db, "contas", c.id), {
        status: c.status === "feito" ? "pendente" : "feito"
      });

    li.querySelector(".editar").onclick = () => editarConta(c);
    li.querySelector(".excluir").onclick = () =>
      confirm("Excluir conta?") && deleteDoc(doc(db, "contas", c.id));

    lista.appendChild(li);
  });
}

// ===== DASHBOARD =====
function atualizarDashboard(contas) {
  let feitas = 0, pendentes = 0, vencidas = 0;
  const hoje = new Date().toISOString().split("T")[0];

  contas.forEach(c => {
    if (c.status === "feito") feitas++;
    else if (c.vencimento < hoje) vencidas++;
    else pendentes++;
  });

  atualizarGrafico(feitas, pendentes, vencidas);
}

// ===== GRÁFICO =====
function atualizarGrafico(feitas, pendentes, vencidas) {
  if (!graficoEl) return;
  if (chart) chart.destroy();

  chart = new Chart(graficoEl, {
    type: "pie",
    data: {
      labels: ["Feitas", "Pendentes", "Vencidas"],
      datasets: [{
        data: [feitas, pendentes, vencidas],
        backgroundColor: ["#16a34a", "#2563eb", "#dc2626"]
      }]
    },
    options: {
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// ===== EDITAR =====
function editarConta(conta) {
  const novaDescricao = prompt("Descrição:", conta.descricao);
  const novoVenc = prompt("Vencimento (YYYY-MM-DD):", conta.vencimento);

  if (!novaDescricao || !novoVenc) return;

  updateDoc(doc(db, "contas", conta.id), {
    descricao: novaDescricao,
    vencimento: novoVenc
  });
}
