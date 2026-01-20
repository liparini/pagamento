import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("lista");

async function carregarContas(filtro) {
  lista.innerHTML = "";
  const snapshot = await getDocs(collection(db, "contas"));
  const hoje = new Date();

  snapshot.forEach(docSnap => {
    const c = docSnap.data();
    const id = docSnap.id;
    const venc = new Date(c.dataVencimento);

    let mostrar = false;

    if (filtro === "pagas") mostrar = c.status === "pago";
    if (filtro === "vencidas") mostrar = c.status === "pendente" && venc < hoje;
    if (filtro === "hoje") mostrar = venc.toDateString() === hoje.toDateString();
    if (filtro === "mes")
      mostrar =
        venc.getMonth() === hoje.getMonth() &&
        venc.getFullYear() === hoje.getFullYear();

    if (!filtro) mostrar = true;

    if (mostrar) {
      const li = document.createElement("li");

      li.className =
        c.status === "pago"
          ? "pago"
          : venc < hoje
          ? "vencido"
          : "";

      li.innerHTML = `
        <span>${c.descricao} - R$ ${c.valor} - ${c.dataVencimento}</span>
        ${
          c.status === "pendente"
            ? `<button onclick="pagar('${id}')">✔</button>`
            : ""
        }
      `;
      lista.appendChild(li);
    }
  });
}

window.adicionarConta = async function () {
  await addDoc(collection(db, "contas"), {
    descricao: descricao.value,
    valor: Number(valor.value),
    dataVencimento: data.value,
    recorrente: recorrencia.value !== "nao",
    tipoRecorrencia: recorrencia.value,
    status: "pendente",
    criadoEm: new Date().toISOString()
  });
  carregarContas();
};

window.pagar = async function (id) {
  await updateDoc(doc(db, "contas", id), {
    status: "pago",
    dataPagamento: new Date().toISOString()
  });
  carregarContas();
};

window.carregarHoje = () => carregarContas("hoje");
window.carregarMes = () => carregarContas("mes");
window.carregarVencidas = () => carregarContas("vencidas");
window.carregarPagas = () => carregarContas("pagas");

carregarContas();
