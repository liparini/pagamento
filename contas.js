import { db, auth } from "./firebase.js";
import {
  collection, addDoc, getDocs, query, where,
  updateDoc, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaContas");

window.salvarConta = async () => {
  const user = auth.currentUser;
  if (!user) return alert("Usuário não autenticado");

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
};

window.carregarContas = async () => {
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
    let statusAtual = c.status;

    // Atualiza vencidas automaticamente
    if (statusAtual === "pendente" && c.dataVencimento < hoje) {
      statusAtual = "vencido";
      updateDoc(doc(db, "contas", docSnap.id), { status: "vencido" });
    }

    if (statusAtual === "pendente") pagar++;
    if (statusAtual === "feito") pago++;
    if (statusAtual === "vencido") vencido++;

    lista.innerHTML += `
      <li>
        <strong>${c.descricao}</strong> | ${c.dataVencimento} | ${statusAtual}

        ${statusAtual === "pendente" ? `
          <button onclick="marcarFeito('${docSnap.id}', ${c.recorrente})">
            Feito
          </button>
        ` : ""}

        <button onclick="editarConta('${docSnap.id}', '${c.descricao}', '${c.dataVencimento}', ${c.recorrente})">
          Alterar
        </button>

        <button onclick="excluirConta('${docSnap.id}')">
          Excluir
        </button>
      </li>
    `;
  });

  qtdPagar.innerText = pagar;
  qtdPago.innerText = pago;
  qtdVencido.innerText = vencido;
};

window.marcarFeito = async (id, recorrente) => {
  const ref = doc(db, "contas", id);
  await updateDoc(ref, { status: "feito" });

  carregarContas();
};

window.editarConta = async (id, desc, data, rec) => {
  const novaDesc = prompt("Descrição:", desc);
  const novaData = prompt("Data de vencimento (AAAA-MM-DD):", data);

  if (!novaDesc || !novaData) return;

  await updateDoc(doc(db, "contas", id), {
    descricao: novaDesc,
    dataVencimento: novaData,
    recorrente: rec
  });

  carregarContas();
};

window.excluirConta = async (id) => {
  if (confirm("Deseja excluir esta conta?")) {
    await deleteDoc(doc(db, "contas", id));
    carregarContas();
  }
};

auth.onAuthStateChanged(user => {
  if (user) carregarContas();
});
