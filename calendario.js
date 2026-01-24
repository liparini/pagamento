import { db, auth } from "./firebase.js";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let dataAtual = new Date();
let contasCache = [];
let uid = null;

const mesAno = document.getElementById("mesAno");
const grid = document.getElementById("gridCalendario");
const filtroRecorrente = document.getElementById("filtroRecorrente");

document.getElementById("mesAnterior").onclick = () => mudarMes(-1);
document.getElementById("proximoMes").onclick = () => mudarMes(1);
filtroRecorrente.onchange = renderizarCalendario;

onAuthStateChanged(auth, user => {
  if (user) {
    uid = user.uid;
    ouvirContas();
  }
});

function ouvirContas() {
  const q = query(collection(db, "contas"), where("uid", "==", uid));
  onSnapshot(q, snap => {
    contasCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderizarCalendario();
  });
}

function mudarMes(delta) {
  dataAtual.setMonth(dataAtual.getMonth() + delta);
  renderizarCalendario();
}

function ocorreNoDia(c, dataStr) {
  if (!c.recorrencia) return c.vencimento === dataStr;

  const base = new Date(c.vencimento);
  const atual = new Date(dataStr);

  if (c.recorrencia.tipo === "mensal")
    return base.getDate() === atual.getDate();

  if (c.recorrencia.tipo === "semanal")
    return base.getDay() === atual.getDay();

  return false;
}

function renderizarCalendario() {
  grid.innerHTML = "";

  const contas = filtroRecorrente.checked
    ? contasCache.filter(c => c.recorrencia)
    : contasCache;

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  mesAno.textContent = dataAtual.toLocaleDateString("pt-BR", {
    month: "long", year: "numeric"
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
      `${ano}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;

    contas.forEach(c => {
      if (ocorreNoDia(c, dataStr)) {
        const ev = document.createElement("div");
        ev.className = `evento ${c.status}`;
        ev.textContent = c.descricao;
        div.appendChild(ev);
      }
    });

    grid.appendChild(div);
  }
}
