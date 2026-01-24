import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let uid = null;
let contasCache = [];
let dataAtual = new Date();

const grid = document.getElementById("gridCalendario");
const mesAno = document.getElementById("mesAno");
const filtroRecorrente = document.getElementById("filtroRecorrente");

document.getElementById("mesAnterior").onclick = () => mudarMes(-1);
document.getElementById("proximoMes").onclick = () => mudarMes(1);
filtroRecorrente.onchange = () => renderizarCalendario();

onAuthStateChanged(auth, user => {
  if (user) {
    uid = user.uid;
    ouvirContas();
  }
});

document.getElementById("formConta").onsubmit = async e => {
  e.preventDefault();

  await addDoc(collection(db, "contas"), {
    descricao: descricao.value,
    vencimento: vencimento.value,
    recorrente: recorrente.checked,
    status: "pendente",
    uid
  });

  e.target.reset();
};

function ouvirContas() {
  const q = query(collection(db, "contas"), where("uid", "==", uid));
  onSnapshot(q, snap => {
    contasCache = snap.docs.map(d => d.data());
    renderizarCalendario();
  });
}

function mudarMes(delta) {
  dataAtual.setMonth(dataAtual.getMonth() + delta);
  renderizarCalendario();
}

function renderizarCalendario() {
  grid.innerHTML = "";

  const contas = filtroRecorrente.checked
    ? contasCache.filter(c => c.recorrente)
    : contasCache;

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  mesAno.textContent = dataAtual.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    const divDia = document.createElement("div");
    divDia.className = "dia";
    divDia.innerHTML = `<span>${dia}</span>`;

    const dataStr = `${ano}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;

    contas.forEach(c => {
      const diaConta = c.vencimento.split("-")[2];

      if (
        c.vencimento === dataStr ||
        (c.recorrente && diaConta === String(dia).padStart(2,"0"))
      ) {
        const div = document.createElement("div");
        div.className = `conta-cal ${c.status}`;
        div.textContent = c.descricao;
        divDia.appendChild(div);
      }
    });

    divDia.onclick = () => abrirDia(dataStr);
    grid.appendChild(divDia);
  }
}

window.abrirDia = dataStr => {
  document.getElementById("modalDia").classList.remove("hidden");
  document.getElementById("tituloDia").textContent = dataStr;

  const ul = document.getElementById("listaDia");
  ul.innerHTML = "";

  contasCache
    .filter(c =>
      c.vencimento === dataStr ||
      (c.recorrente && c.vencimento.split("-")[2] === dataStr.split("-")[2])
    )
    .forEach(c => {
      const li = document.createElement("li");
      li.textContent = c.descricao;
      ul.appendChild(li);
    });
};

window.fecharModal = () =>
  document.getElementById("modalDia").classList.add("hidden");
