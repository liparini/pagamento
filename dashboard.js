import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function atualizarDashboard() {
  let total = 0, pago = 0, pendente = 0;
  const snap = await getDocs(collection(db, "contas"));

  snap.forEach(d => {
    const c = d.data();
    total += c.valor;
    c.status === "pago" ? pago += c.valor : pendente += c.valor;
  });

  totalMes.innerText = `Total: R$ ${total}`;
  totalPago.innerText = `Pago: R$ ${pago}`;
  totalPendente.innerText = `Pendente: R$ ${pendente}`;
}
