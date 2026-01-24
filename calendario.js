import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc
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
filtroRecorrente.onchange = () => renderizarCalendario();

onAuthStateChanged(auth, (user) => {
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

    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    divDia.onclick = () => abrirDia(dataStr);

    contas.forEach(c => {
      const diaConta = c.vencimento.split("-")[2];

      if (
        c.vencimento === dataStr ||
        (c.recorrente && diaConta === String(dia).padStart(2, "0"))
      ) {
        const contaDiv = document.createElement("div");
        contaDiv.className = `conta-cal ${c.status}`;
        contaDiv.textContent = c.descricao;

        // editar inline
        contaDiv.ondblclick = (e) => {
          e.stopPropagation();
          const novoNome = prompt("Editar descrição:", c.descricao);
          if (novoNome)
            updateDoc(doc(db, "contas", c.id), { descricao: novoNome });
        };

        // drag & drop
        contaDiv.draggable = true;
        contaDiv.ondragstart = e =>
          e.dataTransfer.setData("id", c.id);

        divDia.ondragover = e => e.preventDefault();
        divDia.ondrop = e => {
          const id = e.dataTransfer.getData("id");
          updateDoc(doc(db, "contas", id), { vencimento: dataStr });
        };

        divDia.appendChild(contaDiv);
      }
    });

    grid.appendChild(divDia);
  }
}

// ===== MODAL =====
window.abrirDia = function (dataStr) {
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
