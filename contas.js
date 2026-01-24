import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let uid = null;
let contasCache = [];
let dataAtual = new Date();
let chart = null;

const grid = document.getElementById("gridCalendario");
const mesAno = document.getElementById("mesAno");

const dashPendentes = document.getElementById("dashPendentes");
const dashFeitas = document.getElementById("dashFeitas");
const dashVencidas = document.getElementById("dashVencidas");

onAuthStateChanged(auth, user => {
  if (user) {
    uid = user.uid;
    ouvirContas();
    pedirPermissaoNotificacao();
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
    contasCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderizarCalendario();
    atualizarDashboard();
  });
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

    const dataStr = `${ano}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;

    contasCache.forEach(c => {
      const diaConta = c.vencimento.split("-")[2];

      if (c.vencimento === dataStr || (c.recorrente && diaConta == dia)) {
        const div = document.createElement("div");
        div.className = `conta-cal ${c.status}`;
        div.textContent = c.descricao;
        div.contentEditable = true;

        // ✏️ EDIÇÃO INLINE
        div.onblur = () =>
          updateDoc(doc(db, "contas", c.id), { descricao: div.textContent });

        // 🔥 DRAG
        div.draggable = true;
        div.ondragstart = e =>
          e.dataTransfer.setData("id", c.id);

        divDia.appendChild(div);
      }
    });

    divDia.ondragover = e => e.preventDefault();
    divDia.ondrop = e => {
      const id = e.dataTransfer.getData("id");
      updateDoc(doc(db, "contas", id), { vencimento: dataStr });
    };

    grid.appendChild(divDia);
  }
}

function atualizarDashboard() {
  let p = 0, f = 0, v = 0;
  const hoje = new Date();

  contasCache.forEach(c => {
    const venc = new Date(c.vencimento);
    if (c.status === "feito") f++;
    else if (venc < hoje) v++;
    else p++;
  });

  dashPendentes.textContent = p;
  dashFeitas.textContent = f;
  dashVencidas.textContent = v;

  atualizarGrafico(p, f, v);
}

function atualizarGrafico(p, f, v) {
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("grafico"), {
    type: "doughnut",
    data: {
      labels: ["Pendentes", "Pagas", "Vencidas"],
      datasets: [{
        data: [p, f, v],
        backgroundColor: ["#2563eb", "#16a34a", "#dc2626"]
      }]
    }
  });
}

// 🔔 NOTIFICAÇÃO REAL
function pedirPermissaoNotificacao() {
  if ("Notification" in window)
    Notification.requestPermission();
}
