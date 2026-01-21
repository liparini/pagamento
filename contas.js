import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const lista = document.getElementById("lista");

onAuthStateChanged(auth, user => {
  if (user) {
    carregarContas(user.uid);
  } else {
    lista.innerHTML = "";
  }
});

async function carregarContas(uid) {
  lista.innerHTML = "";

  const q = query(
    collection(db, "contas"),
    where("uid", "==", uid)
  );

  const snapshot = await getDocs(q);
  const hoje = new Date();

  snapshot.forEach(docSnap => {
    const conta = docSnap.data();
    const id = docSnap.id;
    const venc = new Date(conta.dataVencimento);

    const li = document.createElement("li");

    if (conta.status === "pago") li.classList.add("pago");
    if (conta.status === "pendente" && venc < hoje)
      li.classList.add("vencido");

    li.innerHTML = `
      <span>
        ${conta.descricao} - R$ ${conta.valor} - ${conta.dataVencimento}
        ${conta.recorrente ? "🔄" : ""}
      </span>
      ${
        conta.status === "pendente"
          ? `<button onclick="pagar('${id}')">✔</button>`
          : ""
      }
    `;

    lista.appendChild(li);
  });
}

window.adicionarConta = async function () {
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, "contas"), {
    uid: user.uid,
    descricao: descricao.value,
    valor: Number(valor.value),
    dataVencimento: data.value,
    recorrente: recorrencia.value !== "nao",
    tipoRecorrencia: recorrencia.value,
    status: "pendente",
    criadoEm: new Date().toISOString()
  });

  carregarContas(user.uid);
};

window.pagar = async function (id) {
  const ref = doc(db, "contas", id);
  const snapshot = await getDocs(collection(db, "contas"));

  let contaAtual;
  snapshot.forEach(d => {
    if (d.id === id) contaAtual = d.data();
  });

  await updateDoc(ref, {
    status: "pago",
    dataPagamento: new Date().toISOString()
  });

  if (contaAtual.recorrente) {
    await gerarProximaConta(contaAtual);
  }

  carregarContas(contaAtual.uid);
};

async function gerarProximaConta(conta) {
  const novaData = new Date(conta.dataVencimento);

  if (conta.tipoRecorrencia === "mensal")
    novaData.setMonth(novaData.getMonth() + 1);

  if (conta.tipoRecorrencia === "semanal")
    novaData.setDate(novaData.getDate() + 7);

  if (conta.tipoRecorrencia === "anual")
    novaData.setFullYear(novaData.getFullYear() + 1);

  await addDoc(collection(db, "contas"), {
    ...conta,
    dataVencimento: novaData.toISOString().split("T")[0],
    status: "pendente",
    criadoEm: new Date().toISOString()
  });
}
