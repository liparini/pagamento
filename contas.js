import { db, auth } from "./firebase.js";
import {
  collection, addDoc, getDocs, query, where,
  updateDoc, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const btnSalvar = document.getElementById("btnSalvar");
const lista = document.getElementById("listaContas");

btnSalvar.addEventListener("click", salvarConta);

async function salvarConta() {
  const user = auth.currentUser;
  if (!user) {
    alert("Usuário não autenticado");
    return;
  }

  await addDoc(collection(db, "contas"), {
    descricao: descricao.value,
    dataVencimento: data.value,
    recorrente: recorrente.checked,
    status: "pendente",
    usuarioId: user.uid,
    criadoEm: new Date()
  });

  descricao.value = "";
  data.value = "";
  recorrente.checked = false;

  carregarContas();
}

async function carregarContas() {
  lista.innerHTML = "";

  let pagar = 0, pago = 0, vencido = 0;
  const hoje = new Date().toISOString().split("T")[0];

  const q = query(
    collection(db, "contas"),
    where("usuarioId", "==", auth.currentUser.uid)
  );

  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const c = docSnap.data();
    let status = c.status;

    if (status === "pendente" && c.dataVencimento < hoje) {
      status = "vencido";
      updateDoc(doc(db, "contas", docSnap.id), { status: "vencido" });
    }

    if (status === "pendente") pagar++;
    if (status === "feito") pago++;
    if (status === "vencido") vencido++;

    lista.innerHTML += `
      <li>
        ${c.descricao} | ${c.dataVencimento} | ${status}
        ${status === "pendente" ? `<button data-id="${docSnap.id}" class="feito">Feito</button>` : ""}
      </li>
    `;
  });

  qtdPagar.innerText = pagar;
  qtdPago.innerText = pago;
  qtdVencido.innerText = vencido;

  document.querySelectorAll(".feito").forEach(btn => {
    btn.onclick = () => marcarFeito(btn.dataset.id);
  });
}

async function marcarFeito(id) {
  await updateDoc(doc(db, "contas", id), { status: "feito" });
  carregarContas();
}

auth.onAuthStateChanged(user => {
  if (user) carregarContas();
});
