let teamNameMap = {};

async function checkConnection() {
  const statusEl = document.getElementById("connection-status");
  try {
    const { error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    statusEl.textContent = "✅ Conectado a Supabase correctamente";
    statusEl.classList.remove("status-loading");
    statusEl.classList.add("status-ok");
    await loadStandings();
    await loadTips();
    await loadRosterTab();
    await loadPalmaresSelector();
    await loadTeamNamesForSearch();
    setupBanner();
    setupCalendarSearch();
    setupModalClose();
    setupPalmaresTab();
  } catch (err) {
    statusEl.textContent = "❌ Error de conexión: " + err.message;
    statusEl.classList.remove("status-loading");
    statusEl.classList.add("status-error");
  }
}

// ===== BANNER EXPANDIBLE =====
function setupBanner() {
  const banner = document.getElementById("megaBanner");
  const tabs = document.querySelectorAll(".banner-tab[data-tab]");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".banner-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.getElementById(tab.dataset.tab + "-container");
      if (panel) panel.classList.add("active");
      banner.classList.add("expanded");
    });
  });

  document.querySelector(".banner-topbar").addEventListener("click", (e) => {
    if (e.target.closest(".banner-tab") || e.target.closest(".banner-search")) return;
    banner.classList.toggle("expanded");
  });
}

function setupModalClose() {
  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("team-modal").classList.add("hidden");
  });
  document.getElementById("team-modal").addEventListener("click", (e) => {
    if (e.target.id === "team-modal") {
      document.getElementById("team-modal").classList.add("hidden");
    }
  });
}

// ===== PALMARÉS: cierra el banner y baja hasta la sección =====
function setupPalmaresTab() {
  document.getElementById("palmaresTabBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("megaBanner").classList.remove("expanded");
    document.getElementById("palmares-container").scrollIntoView({ behavior: "smooth" });
  });
}

// ===== TABLA DE POSICIONES + FORMA RECIENTE =====
async function loadStandings() {
  const container = document.getElementById("standings-container");

  const [{ data: tabla, error: err1 }, { data: forma, error: err2 }] = await Promise.all([
    supabaseClient.from("tabla_posiciones").select("*"),
    supabaseClient.from("forma_reciente").select("*")
  ]);

  if (err1) {
    container.textContent = "Error al cargar la tabla: " + err1.message;
    return;
  }

  const formaMap = {};
  if (!err2 && forma) {
    forma.forEach(f => { formaMap[f.abreviatura] = f.ultimos5; });
  }

  let html = `
    <table class="standings-table">
      <thead>
        <tr>
          <th>#</th><th>Club</th><th>PJ</th><th>G</th><th>E</th><th>P</th>
          <th>GF</th><th>GC</th><th>DG</th><th>Pts</th><th>Últimos 5</th>
        </tr>
      </thead>
      <tbody>
  `;
  tabla.forEach((row, i) => {
    const ultimos5 = formaMap[row.abreviatura] || [];
    const dots = ultimos5.map(r => {
      return r === 'G' ? '🟢' : r === 'E' ? '🟤' : '🔴';
    }).join(" ");

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
        <td class="form-cell">${dots}</td>
      </tr>
    `;
  });
  html += "</tbody></table>";
  container.innerHTML = html;
}

// ===== TIPS =====
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
  document.getElementById("tipsTabBtn").textContent = `Tips Jornada ${jornadaActual}`;

  const categorias = [
    { key: "base", label: "🟢 Base", clase: "tip-base" },
    { key: "zona_gris", label: "🟡 Zona Gris", clase: "tip-gris" },
    { key: "sorpresa", label: "🔴 Sorpresa", clase: "tip-sorpresa" }
  ];

  let html = `<div class="tips-scroll">`;
  categorias.forEach(cat => {
    const items = tipsJornada.filter(t => t.categoria === cat.key);
    items.forEach(t => {
      html += `
        <div class="tip-card ${cat.clase}">
          <div class="tip-match">${t.local} vs ${t.visitante}</div>
          <div class="tip-detail">
            <span class="tip-tipo">${t.tipo_apuesta}</span>
            <span class="tip-prediccion">${t.prediccion}</span>
            <span class="tip-confianza">${t.confianza}%</span>
          </div>
        </div>
      `;
    });
  });
  html += "</div>";
  container.innerHTML = html;
}

// ===== BUSCADOR DE CALENDARIO =====
async function loadTeamNamesForSearch() {
  const { data, error } = await supabaseClient
    .from("equipos")
    .select("abreviatura, nombre")
    .order("nombre");
  if (error) return;

  const datalist = document.getElementById("team-list");
  data.forEach(t => {
    teamNameMap[t.nombre.toLowerCase()] = { abv: t.abreviatura, nombre: t.nombre };
    const option = document.createElement("option");
    option.value = t.nombre;
    datalist.appendChild(option);
  });
}

function setupCalendarSearch() {
  const input = document.getElementById("team-search-input");
  const searchBtn = document.getElementById("search-team-btn");
  const fullBtn = document.getElementById("full-calendar-btn");
  const banner = document.getElementById("megaBanner");

  function activateCalendarTab() {
    document.querySelectorAll(".banner-tab[data-tab]").forEach(t => t.classList.remove("active"));
    document.querySelector('[data-tab="calendar"]').classList.add("active");
    document.querySelectorAll(".banner-panel").forEach(p => p.classList.remove("active"));
    document.getElementById("calendar-container").classList.add("active");
    banner.classList.add("expanded");
  }

  function doSearch() {
    const query = input.value.trim().toLowerCase();
    if (!query) return;
    activateCalendarTab();
    const matchKey = Object.keys(teamNameMap).find(name => name.includes(query));
    if (matchKey) {
      const team = teamNameMap[matchKey];
      loadTeamCalendar(team.abv, team.nombre);
    } else {
      document.getElementById("calendar-results").innerHTML =
        `<p class="calendar-empty">Equipo no encontrado. Intenta con otro nombre.</p>`;
    }
  }

  searchBtn.addEventListener("click", doSearch);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
  fullBtn.addEventListener("click", () => {
    activateCalendarTab();
    loadFullCalendarView();
  });
}

async function loadTeamCalendar(abreviatura, teamName) {
  const container = document.getElementById("calendar-results");
  container.innerHTML = "Cargando calendario...";

  const { data, error } = await supabaseClient
    .from("calendario_equipo")
    .select("*")
    .eq("equipo_abv", abreviatura)
    .order("jornada");

  if (error) {
    container.textContent = "Error al cargar calendario: " + error.message;
    return;
  }

  let html = `<h3 class="calendar-team-title">${teamName}</h3><div class="calendar-list">`;
  data.forEach(row => {
    const vs = row.condicion === 'local' ? `vs ${row.rival}` : `@ ${row.rival}`;
    let resultBadge = '';
    if (row.estado === 'finalizado') {
      const marcador = row.condicion === 'local'
        ? `${row.goles_local}-${row.goles_visitante}`
        : `${row.goles_visitante}-${row.goles_local}`;
      const claseResultado = row.resultado === 'G' ? 'badge-win' : row.resultado === 'E' ? 'badge-draw' : 'badge-loss';
      resultBadge = `<span class="calendar-badge ${claseResultado}">${row.resultado} ${marcador}</span>`;
    } else {
      const fecha = new Date(row.fecha_hora_mx);
      const fechaStr = fecha.toLocaleDateString("es-MX", { day: 'numeric', month: 'short' });
      const enVivo = row.estado === 'en_vivo';
      resultBadge = enVivo
        ? `<span class="calendar-badge badge-live">EN VIVO</span>`
        : `<span class="calendar-badge badge-pending">${fechaStr}</span>`;
    }
    html += `
      <div class="calendar-row">
        <span class="calendar-jornada">J${row.jornada}</span>
        <span class="calendar-vs">${vs}</span>
        ${resultBadge}
      </div>
    `;
  });
  html += "</div>";
  container.innerHTML = html;
}

async function loadFullCalendarView() {
  const container = document.getElementById("calendar-results");
  container.innerHTML = "Cargando calendario completo...";

  const { data, error } = await supabaseClient
    .from("calendario_completo")
    .select("*");

  if (error) {
    container.textContent = "Error al cargar calendario: " + error.message;
    return;
  }

  const jornadas = [...new Set(data.map(m => m.jornada))].sort((a, b) => a - b);
  let html = "";
  jornadas.forEach(num => {
    const matches = data.filter(m => m.jornada === num);
    html += `<h3 class="calendar-jornada-title">Jornada ${num}</h3><div class="calendar-list">`;
    matches.forEach(m => {
      const enVivo = m.estado === 'en_vivo';
      const finalizado = m.estado === 'finalizado';
      let scoreHtml;
      if (finalizado || enVivo) {
        scoreHtml = `<span class="calendar-badge ${enVivo ? 'badge-live' : 'badge-score'}">${m.goles_local ?? 0} - ${m.goles_visitante ?? 0}</span>`;
      } else {
        const fecha = new Date(m.fecha_hora_mx);
        const fechaStr = fecha.toLocaleDateString("es-MX", { day: 'numeric', month: 'short' });
        scoreHtml = `<span class="calendar-badge badge-pending">${fechaStr}</span>`;
      }
      html += `
        <div class="calendar-row">
          <span class="calendar-vs">${m.local} vs ${m.visitante}</span>
          ${scoreHtml}
        </div>
      `;
    });
    html += "</div>";
  });
  container.innerHTML = html;
}

// ===== PLANTILLAS (selector en banner → abre modal blanco con texto negro) =====
async function loadRosterTab() {
  const select = document.getElementById("team-select");
  const { data, error } = await supabaseClient
    .from("equipos")
    .select("abreviatura, nombre")
    .order("nombre");

  if (error) {
    console.error("Error cargando equipos:", error.message);
    return;
  }

  data.forEach(equipo => {
    const option = document.createElement("option");
    option.value = equipo.abreviatura;
    option.textContent = equipo.nombre;
    select.appendChild(option);
  });

  select.addEventListener("change", (e) => {
    if (e.target.value) openTeamModal(e.target.value);
  });
}

async function openTeamModal(abreviatura) {
  const modal = document.getElementById("team-modal");
  modal.classList.remove("hidden");

  document.getElementById("dt-container").innerHTML = "Cargando DT...";
  document.getElementById("roster-list-container").innerHTML = "Cargando plantilla...";

  await Promise.all([loadDT(abreviatura), loadRoster(abreviatura)]);
}

async function loadDT(abreviatura) {
  const container = document.getElementById("dt-container");
  const { data, error } = await supabaseClient
    .from("dt_por_equipo")
    .select("*")
    .eq("abreviatura", abreviatura)
    .single();

  if (error) { container.innerHTML = ""; return; }

  container.innerHTML = `
    <div class="dt-card">
      <div class="dt-header">
        <span class="dt-name">${data.dt_nombre}</span>
        <span class="dt-nationality">${data.nacionalidad}${data.edad ? ' · ' + data.edad + ' años' : ''}</span>
      </div>
      ${data.sistema_tactico ? `<div class="dt-sistema">Sistema: <strong>${data.sistema_tactico}</strong></div>` : ''}
      ${data.estilo_ofensivo ? `<div class="dt-estilo"><strong>Ofensiva:</strong> ${data.estilo_ofensivo}</div>` : ''}
      ${data.estilo_defensivo ? `<div class="dt-estilo"><strong>Defensiva:</strong> ${data.estilo_defensivo}</div>` : ''}
      ${data.balon_parado ? `<div class="dt-estilo"><strong>Balón parado:</strong> ${data.balon_parado}</div>` : ''}
    </div>
  `;
}

async function loadRoster(abreviatura) {
  const container = document.getElementById("roster-list-container");
  const { data, error } = await supabaseClient
    .from("jugadores_equipo")
    .select("*")
    .eq("abreviatura", abreviatura);

  if (error) {
    container.textContent = "Error al cargar plantilla: " + error.message;
    return;
  }

  const posiciones = [
    { key: "POR", label: "Porteros" },
    { key: "DEF", label: "Defensas" },
    { key: "MED", label: "Mediocampistas" },
    { key: "DEL", label: "Delanteros" }
  ];

  let html = "";
  posiciones.forEach(pos => {
    const jugadores = data.filter(j => j.posicion === pos.key);
    if (jugadores.length === 0) return;
    html += `<h3 class="roster-position-title">${pos.label}</h3><div class="roster-list">`;
    jugadores.forEach(j => {
      html += `
        <div class="player-card">
          <span class="player-number">${j.numero ?? '-'}</span>
          <span class="player-name">${j.nombre}</span>
          <span class="player-info">${j.nacionalidad}${j.edad ? ' · ' + j.edad + ' años' : ''}</span>
        </div>
      `;
    });
    html += `</div>`;
  });
  container.innerHTML = html;
}

// ===== PALMARÉS =====
async function loadPalmaresSelector() {
  const select = document.getElementById("palmares-select");
  const { data, error } = await supabaseClient
    .from("equipos")
    .select("abreviatura, nombre")
    .order("nombre");

  if (error) return;

  data.forEach(equipo => {
    const option = document.createElement("option");
    option.value = equipo.abreviatura;
    option.textContent = equipo.nombre;
    select.appendChild(option);
  });

  select.addEventListener("change", (e) => {
    if (e.target.value) loadPalmares(e.target.value);
    else document.getElementById("palmares-results").innerHTML = "";
  });
}

async function loadPalmares(abreviatura) {
  const container = document.getElementById("palmares-results");
  container.innerHTML = "Cargando palmarés...";

  const { data, error } = await supabaseClient
    .from("palmares_equipo")
    .select("*")
    .eq("abreviatura", abreviatura)
    .single();

  if (error) {
    container.textContent = "Error al cargar palmarés: " + error.message;
    return;
  }

  const items = [
    { label: "Liga MX", val: data.liga_mx },
    { label: "Copa MX", val: data.copa_mx },
    { label: "Concacaf / Gigantes", val: data.concacaf },
    { label: "Leagues Cup", val: data.leagues_cup },
    { label: "Interamericana / Sudamericana", val: data.interamericana },
    { label: "Campeones Cup", val: data.campeones_cup },
    { label: "Campeón de Campeones", val: data.campeon_campeones },
    { label: "Supercopa MX", val: data.supercopa_mx },
    { label: "Supercopa de la Liga MX", val: data.supercopa_liga_mx },
  ];

  const total = items.reduce((sum, i) => sum + i.val, 0);

  let html = `<h3 class="palmares-team-title">${data.equipo_nombre} — Total: ${total}</h3>
    <div class="palmares-grid">`;
  items.forEach(i => {
    html += `
      <div class="palmares-item">
        <span class="palmares-label">${i.label}</span>
        <span class="palmares-count">${i.val}</span>
      </div>
    `;
  });
  html += "</div>";
  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", checkConnection);
