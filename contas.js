import { auth, db } from "./firebase.js";
import {
  collection, addDoc, getDocs, query, where,
  updateDoc, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const lista = document.getElementById("listaContas");
const btnSalvar = document.getElementById("btnSalvar");

btnSalvar.onclick = salvarConta;

onAuthStateChanged(auth, user => {
  if (user) carregarContas();
});

async function salvarConta() {
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, "contas"), {
    descricao: descricao.value,
    vencimento: vencimento.value,
    recorrente: recorrente.checked,
    status: "pendente",
    uid: user.uid
  });

  descricao.value = "";
  vencimento.value = "";
  recorrente.checked = false;

  carregarContas();
}

async function carregarContas() {
  lista.innerHTML = "";
  let pagar=0, feitas=0, vencidas=0;

  const hoje = new Date().toISOString().split("T")[0];
  const q = query(collection(db, "contas"), where("uid","==",auth.currentUser.uid));
  const snap = await getDocs(q);

  snap.forEach(d => {
    let c = d.data();
    let status = c.status;

    if (status==="pendente" && c.vencimento < hoje) status="vencida";

    if (status==="pendente") pagar++;
    if (status==="feito") feitas++;
    if (status==="vencida") vencidas++;

    lista.innerHTML += `
      <li>
        ${c.descricao} | ${c.vencimento} | ${status}
        ${status==="pendente" ? `<button onclick="marcarFeito('${d.id}')">Feito</button>` : ""}
      </li>
    `;
  });

  qtdPagar.innerText=pagar;
  qtdFeitas.innerText=feitas;
  qtdVencidas.innerText=vencidas;
}

window.marcarFeito = async id => {
  await updateDoc(doc(db,"contas",id),{status:"feito"});
  carregarContas();
};
