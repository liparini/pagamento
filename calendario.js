import { db, auth } from "./firebase.js";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let dataAtual = new Date();
let contasCache = [];
let uid = null;

const mesAno = document.getElementById("mesAno");
const grid = document.getElementById("gridCalendario");
const filtroRecorrente = document.getElementById("filtroRecorrente");

document.getElementById("mesAnterior").onclick = () => mudarMes(-1);
document.getElementById("proximoMes").onclick = () => mudarMes(1);
filtroRecorrente.onchange = renderizarCalendario;

/* ================= AUTH ================= */
onAuthStateChanged(auth, user => {
  if (user) {
    uid = user.uid;
    ouvirContas();
  }
});

/* ================= FIRESTORE ================= */
function ouvirContas() {
  const q = query(collection(db, "contas"), where("uid", "==", uid));
  onSnapshot(q, snap => {
    contasCache = snap.docs.map(d => ({
      id: d.id,
      pago: false,
      recorrencia: null,
      ...d.data()
    }));
    renderizarCalendario();
  });
}

/* ================= NAVEGAÇÃO ================= */
function mudarMes(delta) {
  dataAtual.setMonth(dataAtual.getMonth() + delta);
  renderizarCalendario();
}

/* ================= RECORRÊNCIA ================= */
function ocorreNoDia(c, dataStr) {
  if (!c.recorrencia) return c.data === dataStr;

  const base = new Date(c.data);
  const atual = new Date(dataStr);

  if (c.recorrencia.tipo === "mensal")
    return base.getDate() === atual.getDate();

  if (c.recorrencia.tipo === "semanal")
    return base.getDay() === atual.getDay();

  return false;
}

/* ================= CALENDÁRIO ================= */
function renderizarCalendario() {
  grid.innerHTML = "";

  const contas = filtroRecorrente.checked
    ? contasCache.filter(c => c.recorrencia)
    : contasCache;

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  mesAno.textContent = dataAtual.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++)
    grid.appendChild(document.createElement("div"));

  for (let dia = 1; dia <= totalDias; dia++) {
    const div = document.createElement("div");
    div.className = "dia";
    div.innerHTML = `<div class="numero-dia">${dia}</div>`;

    const dataStr =
      `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    contas.forEach(c => {
      if (ocorreNoDia(c, dataStr)) {
        const ev = document.createElement("div");
        ev.className = `evento ${c.pago ? "pago" : ""}`;

        ev.innerHTML = `
          <div contenteditable="true"
               class="editavel"
               data-id="${c.id}">
            ${c.titulo}
          </div>

          <small>R$ ${Number(c.valor || 0).toFixed(2)}</small>

          <div class="acoes">
            <button data-pago="${c.id}">✔</button>
            <button data-del="${c.id}">🗑</button>
          </div>
        `;

        div.appendChild(ev);
      }
    });

    grid.appendChild(div);
  }
}

/* ================= AÇÕES INLINE ================= */
document.addEventListener("blur", async e => {
  if (e.target.classList.contains("editavel")) {
    const id = e.target.dataset.id;
    await updateDoc(doc(db, "contas", id), {
      titulo: e.target.innerText.trim()
    });
  }
}, true);

document.addEventListener("click", async e => {
  if (e.target.dataset.pago) {
    const ref = doc(db, "contas", e.target.dataset.pago);
    const conta = contasCache.find(c => c.id === e.target.dataset.pago);
    await updateDoc(ref, { pago: !conta.pago });
  }

  if (e.target.dataset.del) {
    if (confirm("Excluir esta conta?")) {
      await deleteDoc(doc(db, "contas", e.target.dataset.del));
    }
  }
});
