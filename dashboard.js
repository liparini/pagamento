import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js";

let grafico = null;

export function atualizarDashboard(contas) {
  const hoje = new Date();

  let pagas = 0;
  let abertas = 0;
  let vencidas = 0;

  contas.forEach(c => {
    const venc = new Date(c.vencimento);

    if (c.status === "paga") {
      pagas++;
    } else if (venc < hoje) {
      vencidas++;
    } else {
      abertas++;
    }
  });

  document.getElementById("totalContas").textContent = contas.length;
  document.getElementById("contasPagas").textContent = pagas;
  document.getElementById("contasAbertas").textContent = abertas;
  document.getElementById("contasVencidas").textContent = vencidas;

  renderizarGrafico(pagas, abertas, vencidas);
}

function renderizarGrafico(pagas, abertas, vencidas) {
  const ctx = document.getElementById("graficoPizza");

  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Pagas", "A Pagar", "Vencidas"],
      datasets: [{
        data: [pagas, abertas, vencidas],
        backgroundColor: ["#16a34a", "#2563eb", "#dc2626"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}
