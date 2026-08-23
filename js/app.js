async function checkConnection() {
  const statusEl = document.getElementById("connection-status");
  try {
    const { error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    statusEl.textContent = "✅ Conectado a Supabase correctamente";
    statusEl.classList.remove("status-loading");
    statusEl.classList.add("status-ok");
    await loadStandings();
  } catch (err) {
    statusEl.textContent = "❌ Error de conexión: " + err.message;
    statusEl.classList.remove("status-loading");
    statusEl.classList.add("status-error");
  }
}

async function loadStandings() {
  const container = document.getElementById("standings-container");
  const { data, error } = await supabaseClient
    .from("tabla_posiciones")
    .select("*");

  if (error) {
    container.textContent = "Error al cargar la tabla: " + error.message;
    return;
  }

  let html = `
    <table class="standings-table">
      <thead>
        <tr>
          <th>#</th><th>Club</th><th>PJ</th><th>G</th><th>E</th><th>P</th>
          <th>GF</th><th>GC</th><th>DG</th><th>Pts</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach((row, i) => {
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${row.club}</td>
        <td>${row.pj}</td>
        <td>${row.g}</td>
        <td>${row.e_}</td>
        <td>${row.p_}</td>
        <td>${row.gf}</td>
        <td>${row.gc}</td>
        <td>${row.dg}</td>
        <td><strong>${row.pts}</strong></td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", checkConnection);
