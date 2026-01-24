import { db, auth } from "./firebase.js";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= ESTADO ================= */
let dataAtual = new Date();
let contasCache = [];
let uid = null;

/* ================= ELEMENTOS ================= */
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

/* ================= CALENDÁRIO ================= */
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

  for (let i = 0; i < primeiroDia; i++)
    grid.appendChild(document.createElement("div"));

  for (let dia = 1; dia <= totalDias; dia++) {
    const div = document.createElement("div");
    div.className = "dia";
    div.innerHTML = `<div class="numero-dia">${dia}</div>`;

    const dataStr =
      `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    contas.forEach(c => {
      if (c.vencimento === dataStr) {
        const ev = document.createElement("div");
        ev.className = `evento ${c.status === "feito" ? "feito" : "pendente"}`;

        ev.innerHTML = `
          <div contenteditable="true"
               class="editavel"
               data-id="${c.id}">
            ${c.descricao}
          </div>

          <div class="acoes">
            <button data-pago="${c.id}">
              ${c.status === "feito" ? "↩" : "✔"}
            </button>
            <button data-del="${c.id}">🗑</button>
          </div>
        `;

        // Drag & Drop (estilo Google)
        ev.draggable = true;
        ev.ondragstart = e =>
          e.dataTransfer.setData("id", c.id);

        div.ondragover = e => e.preventDefault();
        div.ondrop = e => {
          const id = e.dataTransfer.getData("id");
          updateDoc(doc(db, "contas", id), { vencimento: dataStr });
        };

        div.appendChild(ev);
      }
    });

    grid.appendChild(div);
  }
}

/* ================= EDIÇÃO INLINE ================= */
document.addEventListener("blur", async e => {
  if (e.target.classList.contains("editavel")) {
    const id = e.target.dataset.id;
    await updateDoc(doc(db, "contas", id), {
      descricao: e.target.innerText.trim()
    });
  }
}, true);

/* ================= AÇÕES ================= */
document.addEventListener("click", async e => {
  if (e.target.dataset.pago) {
    const id = e.target.dataset.pago;
    const conta = contasCache.find(c => c.id === id);
    await updateDoc(doc(db, "contas", id), {
      status: conta.status === "feito" ? "pendente" : "feito"
    });
  }

  if (e.target.dataset.del) {
    if (confirm("Excluir esta conta?")) {
      await deleteDoc(doc(db, "contas", e.target.dataset.del));
    }
  }
});
