async function checkConnection() {
  const statusEl = document.getElementById("connection-status");
  try {
    const { error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    statusEl.textContent = "✅ Conectado a Supabase correctamente";
    statusEl.classList.remove("status-loading");
    statusEl.classList.add("status-ok");
    await loadStandings();
    await loadUpcomingMatches();
    await loadTips();
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

async function loadUpcomingMatches() {
  const container = document.getElementById("matches-container");
  const { data, error } = await supabaseClient
    .from("proximos_partidos")
    .select("*");

  if (error) {
    container.textContent = "Error al cargar partidos: " + error.message;
    return;
  }

  let html = `<h2 class="section-title">Próximos Partidos</h2><div class="matches-list">`;

  data.forEach((row) => {
    const fecha = new Date(row.fecha_hora_mx);
    const fechaStr = fecha.toLocaleDateString("es-MX", { weekday: 'short', day: 'numeric', month: 'short' });
    const horaStr = fecha.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' });
    const enVivo = row.estado === 'en_vivo';

    html += `
      <div class="match-card ${enVivo ? 'match-live' : ''}">
        <div class="match-jornada">J${row.jornada}</div>
        <div class="match-teams">
          <span class="team-name">${row.local}</span>
          <span class="match-score">
            ${enVivo ? `${row.goles_local ?? 0} - ${row.goles_visitante ?? 0}` : 'vs'}
          </span>
          <span class="team-name">${row.visitante}</span>
        </div>
        <div class="match-time">
          ${enVivo ? '🔴 EN VIVO' : `${fechaStr} · ${horaStr}`}
        </div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}

async function loadTips() {
  const container = document.getElementById("tips-container");
  const { data, error } = await supabaseClient
    .from("tips_completos")
    .select("*");

  if (error) {
    container.textContent = "Error al cargar tips: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "";
    return;
  }

  const jornadaActual = Math.max(...data.map(t => t.jornada));
  const tipsJornada = data.filter(t => t.jornada === jornadaActual);

  const categorias = [
    { key: "base", label: "🟢 Base", clase: "tip-base" },
    { key: "zona_gris", label: "🟡 Zona Gris", clase: "tip-gris" },
    { key: "sorpresa", label: "🔴 Sorpresa", clase: "tip-sorpresa" }
  ];

  let html = `<h2 class="section-title">Tips · Jornada ${jornadaActual}</h2>`;

  categorias.forEach(cat => {
    const items = tipsJornada.filter(t => t.categoria === cat.key);
    if (items.length === 0) return;

    html += `<h3 class="tip-category-title">${cat.label}</h3><div class="tips-list">`;
    items.forEach(t => {
      html += `
        <div class="tip-card ${cat.clase}">
          <div class="tip-match">${t.local} vs ${t.visitante}</div>
          <div class="tip-detail">
            <span class="tip-tipo">${t.tipo_apuesta}</span>
            <span class="tip-prediccion">${t.prediccion}</span>
            <span class="tip-confianza">${t.confianza}%</span>
          </div>
          <div class="tip-razonamiento">${t.razonamiento}</div>
        </div>
      `;
    });
    html += `</div>`;
  });

  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", checkConnection);
