import { db, auth } from "./firebase.js";
import {
  collection, addDoc, query, where,
  onSnapshot, updateDoc, doc, deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let uid = null;
let chart = null;

const form = document.getElementById("formConta");
const lista = document.getElement.getElementById("listaContas");
const graficoEl = document.getElementById("grafico");
const mesFiltro = document.getElementById("mesFiltro");
const totaisEl = document.getElementById("totais");

onAuthStateChanged(auth, user => {
  if (user) {
    uid = user.uid;
    escutarContas();
  }
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  await addDoc(collection(db, "contas"), {
    descricao: descricao.value,
    vencimento: vencimento.value,
    valor: Number(valor.value),
    status: "pendente",
    uid,
    criadoEm: serverTimestamp()
  });
  form.reset();
});

function escutarContas() {
  const q = query(collection(db, "contas"), where("uid", "==", uid));
  onSnapshot(q, snap => {
    const contas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderizarLista(contas);
    montarFiltroMes(contas);
    atualizarResumo(contas);
  });
}

function renderizarLista(contas) {
  lista.innerHTML = "";
  const hoje = new Date();

  contas.forEach(c => {
    const venc = new Date(c.vencimento);
    const statusClass =
      c.status === "feito" ? "feito" : venc < hoje ? "vencida" : "";

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item ${statusClass}">
        <div>
          <input class="inline desc" value="${c.descricao}">
          <input class="inline venc" type="date" value="${c.vencimento}">
          <input class="inline val" type="number" step="0.01" value="${c.valor}">
        </div>
        <div>
          <button class="ok">✔</button>
          <button class="del">🗑️</button>
        </div>
      </div>
    `;

    li.querySelector(".ok").onclick = () =>
      updateDoc(doc(db, "contas", c.id), {
        status: c.status === "feito" ? "pendente" : "feito"
      });

    li.querySelector(".del").onclick = () =>
      confirm("Excluir?") && deleteDoc(doc(db, "contas", c.id));

    li.querySelector(".desc").onchange = e =>
      updateDoc(doc(db, "contas", c.id), { descricao: e.target.value });

    li.querySelector(".venc").onchange = e =>
      updateDoc(doc(db, "contas", c.id), { vencimento: e.target.value });

    li.querySelector(".val").onchange = e =>
      updateDoc(doc(db, "contas", c.id), { valor: Number(e.target.value) });

    lista.appendChild(li);
  });
}

function montarFiltroMes(contas) {
  const meses = [...new Set(contas.map(c => c.vencimento.slice(0,7)))];
  mesFiltro.innerHTML = meses.map(m => `<option>${m}</option>`).join("");
}

function atualizarResumo(contas) {
  const mes = mesFiltro.value;
  const filtradas = contas.filter(c => c.vencimento.startsWith(mes));

  let feitas=0, pendentes=0, vencidas=0, total=0;
  const hoje = new Date();

  filtradas.forEach(c => {
    total += c.valor;
    const venc = new Date(c.vencimento);
    if (c.status === "feito") feitas++;
    else if (venc < hoje) vencidas++;
    else pendentes++;
  });

  totaisEl.innerText = `Total do mês: R$ ${total.toFixed(2)}`;
  atualizarGrafico(feitas, pendentes, vencidas);
}

mesFiltro.onchange = () => escutarContas();

function atualizarGrafico(f, p, v) {
  if (chart) chart.destroy();
  chart = new Chart(graficoEl, {
    type: "pie",
    data: {
      labels: ["Feitas", "Pendentes", "Vencidas"],
      datasets: [{ data: [f,p,v] }]
    }
  });
}
