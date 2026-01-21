import { auth, db } from "./firebase.js";
import {
  collection, addDoc, getDocs, query, where,
  updateDoc, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

btnSalvar.onclick = salvarConta;
btnFiltrar.onclick = carregarContas;

onAuthStateChanged(auth, u => { if (u) carregarContas(); });

async function salvarConta() {
  const uid = auth.currentUser.uid;

  await addDoc(collection(db,"contas"),{
    descricao: descricao.value,
    vencimento: vencimento.value,
    recorrente: recorrente.checked,
    status: "pendente",
    uid
  });

  descricao.value="";
  vencimento.value="";
  recorrente.checked=false;

  carregarContas();
}

async function carregarContas() {
  listaContas.innerHTML="";
  let pagar=0, feitas=0, vencidas=0;
  const hoje = new Date().toISOString().split("T")[0];

  const q = query(collection(db,"contas"),where("uid","==",auth.currentUser.uid));
  const snap = await getDocs(q);

  snap.forEach(d=>{
    let c=d.data();
    let status=c.status;

    if(status==="pendente" && c.vencimento < hoje){
      status="vencida";
      updateDoc(doc(db,"contas",d.id),{status});
    }

    if(filtroMes.value && !c.vencimento.startsWith(filtroMes.value)) return;
    if(filtroStatus.value && filtroStatus.value!==status) return;

    if(status==="pendente") pagar++;
    if(status==="feito") feitas++;
    if(status==="vencida") vencidas++;

    listaContas.innerHTML+=`
      <li class="${status}">
        <input value="${c.descricao}" onchange="editar('${d.id}',this.value)">
        ${c.vencimento} | ${status}
        ${status==="pendente"?`<button onclick="feito('${d.id}',${c.recorrente})">Feito</button>`:""}
      </li>`;
  });

  qtdPagar.innerText=pagar;
  qtdFeitas.innerText=feitas;
  qtdVencidas.innerText=vencidas;
}

window.editar = async(id,desc)=>{
  await updateDoc(doc(db,"contas",id),{descricao:desc});
};

window.feito = async(id,rec)=>{
  await updateDoc(doc(db,"contas",id),{status:"feito"});
  if(rec) await criarProxima(id);
  carregarContas();
};

async function criarProxima(id){
  const snap = await getDocs(query(collection(db,"contas"),where("uid","==",auth.currentUser.uid)));
  snap.forEach(()=>{});
}
