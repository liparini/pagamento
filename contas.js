import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let usuarioAtual = null;
let todasContas = [];

// ================== AUTENTICAÇÃO ==================
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  usuarioAtual = user;
  carregarContas();
});

// ================== CADASTRAR CONTA ==================
document.getElementById("salvarConta").addEventListener("click", async () => {
  const descricao = document.getElementById("descricao").value;
  const vencimento = document.getElementById("vencimento").value;
  const recorrente = document.getElementById("recorrente").checked;

  if (!descricao || !vencimento) {
    alert("Preencha todos os campos");
    return;
  }

  await addDoc(collection(db, "contas"), {
    uid: usuarioAtual.uid,
    descricao,
    vencimento,
    recorrente,
    status: "aberta",
    criadoEm: new Date()
  });

  document.getElementById("descricao").value = "";
  document.getElementById("vencimento").value = "";
  document.getElementById("recorrente").checked = false;
});

// ================== CARREGAR CONTAS ==================
function carregarContas() {
  const q = query(
    collection(db, "contas"),
    where("uid", "==", usuarioAtual.uid)
  );

  onSnapshot(q, snapshot => {
    todasContas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    aplicarFiltros();
  });
}

// ================== FILTROS ==================
document.getElementById("btnFiltrar").addEventListener("click", aplicarFiltros);

function aplicarFiltros() {
  const mes = document.getElementById("filtroMes").value;
  const status = document.getElementById("filtroStatus").value;

  let filtradas = [...todasContas];

  if (mes) {
    filtradas = filtradas.filter(c =>
      c.vencimento.startsWith(mes)
    );
  }

  if (status !== "todos") {
    filtradas = filtradas.filter(c => c.status === status);
  }

  renderizarLista(filtradas);
  atualizarDashboard();
}

// ================== RENDERIZAR LISTA ==================
function renderizarLista(lista) {
  const ul = document.getElementById("listaContas");
  ul.innerHTML = "";

  if (lista.length === 0) {
    ul.innerHTML = "<li>Nenhuma conta encontrada</li>";
    return;
  }

  lista.forEach(conta => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${conta.descricao}</strong> - 
      ${conta.vencimento}
      <button onclick="marcarFeito('${conta.id}')">Feito</button>
      <button onclick="editarConta('${conta.id}')">Editar</button>
    `;

    ul.appendChild(li);
  });
}

// ================== DASHBOARD ==================
function atualizarDashboard() {
  const hoje = new Date().toISOString().slice(0, 10);

  const abertas = todasContas.filter(c => c.status === "aberta");
  const feitas = todasContas.filter(c => c.status === "feita");
  const vencidas = abertas.filter(c => c.vencimento < hoje);

  document.getElementById("qtdAbertas").innerText = abertas.length;
  document.getElementById("qtdFeitas").innerText = feitas.length;
  document.getElementById("qtdVencidas").innerText = vencidas.length;
}

// ================== MARCAR COMO FEITO ==================
window.marcarFeito = async id => {
  const conta = todasContas.find(c => c.id === id);
  if (!conta) return;

  await updateDoc(doc(db, "contas", id), {
    status: "feita"
  });

  // Recorrência mensal
  if (conta.recorrente) {
    const novaData = new Date(conta.vencimento);
    novaData.setMonth(novaData.getMonth() + 1);

    await addDoc(collection(db, "contas"), {
      uid: usuarioAtual.uid,
      descricao: conta.descricao,
      vencimento: novaData.toISOString().slice(0, 10),
      recorrente: true,
      status: "aberta",
      criadoEm: new Date()
    });
  }
};

// ================== EDITAR (BÁSICO) ==================
window.editarConta = id => {
  const conta = todasContas.find(c => c.id === id);
  if (!conta) return;

  document.getElementById("descricao").value = conta.descricao;
  document.getElementById("vencimento").value = conta.vencimento;
};

