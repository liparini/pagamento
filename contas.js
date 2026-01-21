import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =====================
   ELEMENTOS DA TELA
===================== */
const descricaoInput = document.getElementById("descricao");
const vencimentoInput = document.getElementById("vencimento");
const recorrenteInput = document.getElementById("recorrente");

const btnSalvar = document.getElementById("btnSalvar");
const btnFiltrar = document.getElementById("btnFiltrar");

const filtroMes = document.getElementById("filtroMes");
const filtroStatus = document.getElementById("filtroStatus");

const listaContas = document.getElementById("listaContas");

const qtdPagar = document.getElementById("qtdPagar");
const qtdFeitas = document.getElementById("qtdFeitas");
const qtdVencidas = document.getElementById("qtdVencidas");

/* =====================
   EVENTOS
===================== */
btnSalvar.addEventListener("click", salvarConta);
btnFiltrar.addEventListener("click", carregarContas);

/* =====================
   AUTENTICAÇÃO
===================== */
onAuthStateChanged(auth, (user) => {
  if (user) {
    carregarContas();
  }
});

/* =====================
   SALVAR CONTA
===================== */
async function salvarConta() {
  const user = auth.currentUser;
  if (!user) return;

  const descricao = descricaoInput.value.trim();
  const vencimento = vencimentoInput.value;
  const recorrente = recorrenteInput.checked;

  if (!descricao || !vencimento) {
    alert("Preencha descrição e vencimento");
    return;
  }

  await addDoc(collection(db, "contas"), {
    descricao,
    vencimento,           // YYYY-MM-DD
    recorrente,
    status: "pendente",
    uid: user.uid,
    criadoEm: serverTimestamp()
  });

  descricaoInput.value = "";
  vencimentoInput.value = "";
  recorrenteInput.checked = false;

  carregarContas();
}

/* =====================
   CARREGAR CONTAS
===================== */
async function carregarContas() {
  listaContas.innerHTML = "";

  let pagar = 0;
  let feitas = 0;
  let vencidas = 0;

  const hoje = new Date().toISOString().split("T")[0];

  const q = query(
    collection(db, "contas"),
    where("uid", "==", auth.currentUser.uid)
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const conta = docSnap.data();
    let status = conta.status;

    /* 🔴 Atualiza vencidas automaticamente */
    if (status === "pendente" && conta.vencimento < hoje) {
      status = "vencida";
      updateDoc(doc(db, "contas", docSnap.id), { status });
    }

    /* 🔍 FILTRO DE MÊS */
    if (filtroMes.value) {
      if (!conta.vencimento.startsWith(filtroMes.value)) return;
    }

    /* 🔍 FILTRO DE STATUS */
    if (filtroStatus.value && filtroStatus.value !== status) return;

    /* CONTADORES */
    if (status === "pendente") pagar++;
    if (status === "feito") feitas++;
    if (status === "vencida") vencidas++;

    /* LISTA */
    const li = document.createElement("li");
    li.className = status;

    li.innerHTML = `
      <input 
        value="${conta.descricao}"
        onchange="editarConta('${docSnap.id}', this.value)"
      >
      <span> | ${conta.vencimento} | ${status}</span>
      ${
        status === "pendente"
          ? `<button onclick="marcarFeito('${docSnap.id}', ${conta.recorrente})">Feito</button>`
          : ""
      }
    `;

    listaContas.appendChild(li);
  });

  qtdPagar.innerText = pagar;
  qtdFeitas.innerText = feitas;
  qtdVencidas.innerText = vencidas;
}

/* =====================
   EDITAR CONTA
===================== */
window.editarConta = async function (id, novaDescricao) {
  await updateDoc(doc(db, "contas", id), {
    descricao: novaDescricao
  });
};

/* =====================
   MARCAR COMO FEITO
===================== */
window.marcarFeito = async function (id, recorrente) {
  await updateDoc(doc(db, "contas", id), {
    status: "feito"
  });

  if (recorrente) {
    await criarProximaConta(id);
  }

  carregarContas();
};

/* =====================
   RECORRÊNCIA AUTOMÁTICA
===================== */
async function criarProximaConta(idConta) {
  const ref = doc(db, "contas", idConta);
  const snap = await getDocs(query(collection(db, "contas")));

  // ⚠️ Lógica simples e segura:
  // cria nova conta no mês seguinte com mesmo nome

  const hoje = new Date();
  hoje.setMonth(hoje.getMonth() + 1);

  const novaData = hoje.toISOString().split("T")[0];

  await addDoc(collection(db, "contas"), {
    descricao: "Recorrente",
    vencimento: novaData,
    recorrente: true,
    status: "pendente",
    uid: auth.currentUser.uid,
    criadoEm: serverTimestamp()
  });
}
