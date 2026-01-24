import { db, auth } from "./firebase.js";
import {
  collection, query, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js";

let chart = null;

onAuthStateChanged(auth, user => {
  if (!user) return;

  const q = query(collection(db, "contas"), where("uid", "==", user.uid));
  onSnapshot(q, snap => {
    let feito = 0, pendente = 0, vencida = 0;
    const hoje = new Date().toISOString().split("T")[0];

    snap.forEach(d => {
      const c = d.data();
      if (c.status === "feito") feito++;
      else if (c.vencimento < hoje) vencida++;
      else pendente++;
    });

    renderGrafico(feito, pendente, vencida);
  });
});

function renderGrafico(f, p, v) {
  const ctx = document.getElementById("graficoPizza");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Feitas", "Pendentes", "Vencidas"],
      datasets: [{
        data: [f, p, v],
        backgroundColor: ["#2ecc71", "#f1c40f", "#e74c3c"]
      }]
    }
  });
}
