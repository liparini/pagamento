import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const contasDiv = document.getElementById("contas");

// CARREGA A TELA QUANDO LOGAR
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  renderForm();
  await listarContas(user.uid);
});

// FORMULÁRIO
function renderForm() {
  contasDiv.innerHTML = `
    <h3>➕ Nova Conta</h3>

    <input id="descricao" placeholder="Descrição da conta">
    <input id="valor" type="number" placeholder="Valor">
    <input id="vencimento" type="date">

    <button id="btnSalvar">Salvar</button>

    <hr>
    <h3>📋 Contas Cadastradas</h3>
    <div id="listaContas"></div>
  `;

  document.getElementById("btnSalvar").onclick = salvarConta;
}

// SALVAR
async function salvarConta() {
  const user = auth.currentUser;
  if (!user) return;

  const descricao = document.getElementById("descricao").value;
  const valor = Number(document.getElementById("valor").value);
  const vencimento = document.getElementById("vencimento").value;

  if (!descricao || !valor || !vencimento) {
    alert("Preencha todos os campos");
    return;
  }

  try {
    await addDoc(
      collection(db, "users", user.uid, "contas"),
      {
        descricao,
        valor,
        vencimento,
        paga: false,
        criadoEm: serverTimestamp()
      }
    );

    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("vencimento").value = "";

    await listarContas(user.uid);
  } catch (e) {
    console.error("Erro ao salvar:", e);
    alert("Erro ao salvar conta");
  }
}

// LISTAR
async function listarContas(uid) {
  const listaDiv = document.getElementById("listaContas");
  listaDiv.innerHTML = "";

  const snapshot = await getDocs(
    collection(db, "users", uid, "contas")
  );

  snapshot.forEach((docSnap) => {
    const conta = docSnap.data();

    const div = document.createElement("div");
    div.className = `conta ${conta.paga ? "paga" : ""}`;

    div.innerHTML = `
      <span>
        ${conta.descricao} - R$ ${conta.valor.toFixed(2)}
        <br>
        Vencimento: ${conta.vencimento}
      </span>
      ${
        conta.paga
          ? ""
          : `<button onclick="marcarPaga('${docSnap.id}')">Pagar</button>`
      }
    `;

    listaDiv.appendChild(div);
  });
}

// MARCAR COMO PAGA
window.marcarPaga = async function (id) {
  const user = auth.currentUser;
  if (!user) return;

  await updateDoc(
    doc(db, "users", user.uid, "contas", id),
    { paga: true }
  );

  await listarContas(user.uid);
};
