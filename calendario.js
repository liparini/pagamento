import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let dataAtual = new Date();
let contasCache = [];
let uid = null;

const mesAno = document.getElementById("mesAno");
const grid = document.getElementById("gridCalendario");

document.getElementById("mesAnterior").onclick = () => mudarMes(-1);
document.getElementById("proximoMes").onclick = () => mudarMes(1);

onAuthStateChanged(auth, (user) => {
  if (user) {
    uid = user.uid;
    ouvirContas();
  }
});

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

    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    contasCache.forEach(c => {
      const diaConta = c.vencimento.split("-")[2];

      if (
        c.recorrente ||
        c.vencimento === dataStr ||
        (c.recorrente && diaConta == dia)
      ) {
        const contaDiv = document.createElement("div");
        contaDiv.className = `conta-cal ${c.status}`;
        contaDiv.textContent = c.descricao;
        divDia.appendChild(contaDiv);
      }
    });

    grid.appendChild(divDia);
  }
}
