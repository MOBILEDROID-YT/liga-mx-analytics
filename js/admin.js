const adminState = {
  user: null,
  isAdmin: false,
  matches: [],
  tips: [],
  standings: [],
  liguillaMatches: [],
  liguillaRows: [],
  liguillaTableReady: false,
  tipDraftMatchId: null
};

const admin$ = (id) => document.getElementById(id);

function adminEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function adminMessage(message, type = '') {
  const element = admin$('admin-message');
  if (!element) return;
  element.className = `auth-message ${type}`.trim();
  element.textContent = message;
}

function adminFeedback(message, type = '') {
  const element = admin$('admin-feedback');
  if (!element) return;
  element.className = `admin-feedback ${type}`.trim();
  element.textContent = message;
}

function adminDate(value) {
  if (!value) return 'fecha pendiente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'fecha pendiente';
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function adminDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function adminStandings() {
  return [...adminState.standings].sort((first, second) => {
    return Number(second.pts || 0) - Number(first.pts || 0)
      || Number(second.dg || 0) - Number(first.dg || 0)
      || Number(second.gf || 0) - Number(first.gf || 0);
  });
}

function adminTeamName(row, position) {
  return row?.club || row?.nombre || row?.equipo || row?.team || `Por definir (${position}°)`;
}

function makeLiguillaRow(clave, fase, serie, tramo, local, visitante) {
  return {
    clave,
    fase,
    serie,
    tramo,
    local,
    visitante,
    fecha_hora_mx: null,
    goles_local: null,
    goles_visitante: null,
    estado: 'programado'
  };
}

function buildDefaultLiguillaRows() {
  const standings = adminStandings();
  const qualified = Array.from({ length: 8 }, (_, index) => adminTeamName(standings[index], index + 1));
  const rows = [];
  const pairings = [[1, 8], [2, 7], [3, 6], [4, 5]];
  pairings.forEach(([higherSeed, lowerSeed], index) => {
    const series = index + 1;
    rows.push(makeLiguillaRow(`C${series}_IDA`, 'cuartos', series, 'ida', qualified[higherSeed - 1], qualified[lowerSeed - 1]));
    rows.push(makeLiguillaRow(`C${series}_VUELTA`, 'cuartos', series, 'vuelta', qualified[lowerSeed - 1], qualified[higherSeed - 1]));
  });
  rows.push(makeLiguillaRow('S1_IDA', 'semifinal', 1, 'ida', 'Ganador de Serie 1', 'Ganador de Serie 4'));
  rows.push(makeLiguillaRow('S1_VUELTA', 'semifinal', 1, 'vuelta', 'Ganador de Serie 4', 'Ganador de Serie 1'));
  rows.push(makeLiguillaRow('S2_IDA', 'semifinal', 2, 'ida', 'Ganador de Serie 2', 'Ganador de Serie 3'));
  rows.push(makeLiguillaRow('S2_VUELTA', 'semifinal', 2, 'vuelta', 'Ganador de Serie 3', 'Ganador de Serie 2'));
  rows.push(makeLiguillaRow('F_UNICO', 'final', null, 'unico', 'Ganador de Semifinal 1', 'Ganador de Semifinal 2'));
  return rows;
}

function mergeLiguillaRows(savedRows) {
  const savedByKey = new Map(savedRows.map((row) => [String(row.clave), row]));
  return buildDefaultLiguillaRows().map((row) => ({ ...row, ...(savedByKey.get(row.clave) || {}) }));
}

function renderLiguillaAdmin() {
  const container = admin$('admin-liguilla-form');
  const status = admin$('admin-liguilla-status');
  if (!container || !status) return;

  if (!adminState.liguillaTableReady) {
    status.textContent = 'Ejecuta una sola vez supabase/04_liguilla_admin.sql para habilitar este apartado.';
    container.innerHTML = '<div class="admin-playoff-empty">La estructura todavía no está habilitada. Tus partidos y tips actuales no se modifican.</div>';
    return;
  }

  status.textContent = adminState.liguillaRows.length
    ? 'Edita equipos, fechas, marcadores y estados. Después pulsa “Guardar liguilla”.'
    : 'Pulsa “Preparar llave desde la tabla” para cargar las 11 partidas.';
  if (!adminState.liguillaRows.length) {
    container.innerHTML = '<div class="admin-playoff-empty">Todavía no hay una llave preparada.</div>';
    return;
  }

  container.innerHTML = adminState.liguillaRows.map((row, index) => `
    <div class="admin-playoff-row" data-liguilla-row="${index}" data-liguilla-id="${adminEscape(row.id || '')}">
      <div class="admin-playoff-row-heading"><strong>${adminEscape(row.fase === 'cuartos' ? `Cuartos · Serie ${row.serie}` : row.fase === 'semifinal' ? `Semifinal ${row.serie}` : 'Final')}</strong><span>${adminEscape(row.tramo === 'unico' ? 'Partido único' : row.tramo)}</span></div>
      <div class="admin-playoff-team-fields">
        <label>Local<input class="text-control" data-liguilla-field="local" value="${adminEscape(row.local)}" maxlength="100"></label>
        <label>Visitante<input class="text-control" data-liguilla-field="visitante" value="${adminEscape(row.visitante)}" maxlength="100"></label>
      </div>
      <div class="admin-playoff-score-fields">
        <label>Fecha<input type="datetime-local" data-liguilla-field="fecha_hora_mx" value="${adminDateTimeLocal(row.fecha_hora_mx)}"></label>
        <label>Local<input type="number" min="0" max="99" step="1" data-liguilla-field="goles_local" value="${row.goles_local ?? ''}"></label>
        <label>Visitante<input type="number" min="0" max="99" step="1" data-liguilla-field="goles_visitante" value="${row.goles_visitante ?? ''}"></label>
        <label>Estado<select data-liguilla-field="estado"><option value="programado" ${row.estado === 'programado' ? 'selected' : ''}>Programado</option><option value="en_vivo" ${row.estado === 'en_vivo' ? 'selected' : ''}>En vivo</option><option value="finalizado" ${row.estado === 'finalizado' ? 'selected' : ''}>Finalizado</option></select></label>
      </div>
    </div>
  `).join('');
}

async function loadLiguillaAdminData() {
  const standingsResponse = await adminRequest(
    supabaseClient.from('tabla_posiciones').select('*'),
    'la tabla de posiciones'
  );
  adminState.standings = standingsResponse.error ? [] : (Array.isArray(standingsResponse.data) ? standingsResponse.data : []);

  const response = await adminRequest(
    supabaseClient.from('liguilla_partidos').select('*').order('clave'),
    'la liguilla'
  );
  if (response.error) {
    adminState.liguillaTableReady = false;
    adminState.liguillaMatches = [];
    adminState.liguillaRows = [];
    renderLiguillaAdmin();
    return;
  }

  adminState.liguillaTableReady = true;
  adminState.liguillaMatches = Array.isArray(response.data) ? response.data : [];
  adminState.liguillaRows = adminState.liguillaMatches.length ? mergeLiguillaRows(adminState.liguillaMatches) : [];
  renderLiguillaAdmin();
}

function seedLiguillaAdmin() {
  if (!adminState.liguillaTableReady) {
    adminFeedback('Primero ejecuta supabase/04_liguilla_admin.sql.', 'error');
    return;
  }
  adminState.liguillaRows = mergeLiguillaRows([]);
  renderLiguillaAdmin();
  adminFeedback('Llave preparada con el Top 8 actual. Revisa y guarda.', 'success');
}

function collectLiguillaRows() {
  const container = admin$('admin-liguilla-form');
  if (!container) return [];
  return [...container.querySelectorAll('[data-liguilla-row]')].map((element, index) => {
    const source = adminState.liguillaRows[index];
    const field = (name) => element.querySelector(`[data-liguilla-field="${name}"]`)?.value ?? '';
    const local = field('local').trim();
    const visitante = field('visitante').trim();
    if (!local || !visitante) throw new Error(`Completa los equipos de la fila ${index + 1}.`);
    const dateValue = field('fecha_hora_mx');
    const homeScore = field('goles_local');
    const awayScore = field('goles_visitante');
    const row = {
      clave: source.clave,
      fase: source.fase,
      serie: source.serie,
      tramo: source.tramo,
      local,
      visitante,
      fecha_hora_mx: dateValue ? new Date(dateValue).toISOString() : null,
      goles_local: homeScore === '' ? null : Number(homeScore),
      goles_visitante: awayScore === '' ? null : Number(awayScore),
      estado: field('estado') || 'programado',
      updated_at: new Date().toISOString()
    };
    if (source.id) row.id = source.id;
    return row;
  });
}

async function saveLiguillaAdmin() {
  if (!adminState.liguillaTableReady) {
    adminFeedback('Primero ejecuta supabase/04_liguilla_admin.sql.', 'error');
    return;
  }
  if (!adminState.liguillaRows.length) {
    adminFeedback('Prepara la llave antes de guardarla.', 'error');
    return;
  }
  let payload;
  try {
    payload = collectLiguillaRows();
  } catch (error) {
    adminFeedback(error.message, 'error');
    return;
  }
  adminFeedback('Guardando la liguilla...', 'loading');
  const { data, error } = await supabaseClient
    .from('liguilla_partidos')
    .upsert(payload, { onConflict: 'clave' })
    .select('*');
  if (error) {
    adminFeedback(error.message || 'No se pudo guardar la liguilla.', 'error');
    return;
  }
  adminState.liguillaMatches = Array.isArray(data) ? data : payload;
  adminState.liguillaRows = mergeLiguillaRows(adminState.liguillaMatches);
  renderLiguillaAdmin();
  adminFeedback('Liguilla guardada. Recarga la web pública para ver los cambios.', 'success');
}

function adminUserName(user) {
  return user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email || 'Administrador';
}

function showAdminSection(section, visible) {
  admin$(section)?.classList.toggle('hidden', !visible);
}

function setDynamicOption(select, value) {
  if (!select || !value) return;
  if (![...select.options].some((option) => option.value === value)) {
    select.add(new Option(value, value));
  }
  select.value = value;
}

function adminRequest(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => window.setTimeout(() => reject(new Error(`Tiempo de espera agotado al cargar ${label}.`)), 10000))
  ]);
}

function renderMatchOptions() {
  const select = admin$('match-select');
  if (!select) return;
  select.innerHTML = adminState.matches.length
    ? adminState.matches.map((match) => `<option value="${adminEscape(match.id)}">J${adminEscape(match.jornada)} · ${adminEscape(match.local)} vs ${adminEscape(match.visitante)} · ${adminEscape(adminDate(match.fecha_hora_mx))}</option>`).join('')
    : '<option value="">No hay partidos disponibles</option>';
  fillMatchForm();
}

function renderTipOptions() {
  const select = admin$('tip-select');
  if (!select) return;
  const selectedValue = select.value;
  const tipsByMatch = new Map();
  adminState.tips.forEach((tip) => {
    const matchId = String(tip.partido_id || '');
    if (!tipsByMatch.has(matchId)) tipsByMatch.set(matchId, []);
    tipsByMatch.get(matchId).push(tip);
  });
  const groups = new Map();
  [...adminState.matches]
    .sort((first, second) => {
      const jornadaDifference = Number(second.jornada || 0) - Number(first.jornada || 0);
      if (jornadaDifference) return jornadaDifference;
      return new Date(first.fecha_hora_mx || 0) - new Date(second.fecha_hora_mx || 0);
    })
    .forEach((match) => {
      const jornada = match.jornada || '—';
      if (!groups.has(jornada)) groups.set(jornada, []);
      const matchTips = tipsByMatch.get(String(match.id)) || [];
      if (matchTips.length) {
        matchTips.forEach((tip) => groups.get(jornada).push({
          value: `tip:${tip.id}`,
          label: `${match.local} vs ${match.visitante} · ${tip.prediccion || 'Tip sin predicción'}`
        }));
      } else {
        groups.get(jornada).push({
          value: `new:${match.id}`,
          label: `${match.local} vs ${match.visitante} · Nuevo tip`
        });
      }
    });

  select.innerHTML = groups.size
    ? [...groups.entries()].map(([jornada, options]) => `
        <optgroup label="Jornada ${adminEscape(jornada)}">
          ${options.map((option) => `<option value="${adminEscape(option.value)}">${adminEscape(option.label)}</option>`).join('')}
        </optgroup>
      `).join('')
    : '<option value="">No hay partidos disponibles</option>';
  if (selectedValue && [...select.options].some((option) => option.value === selectedValue)) select.value = selectedValue;
  fillTipForm();
}

function fillMatchForm() {
  const match = adminState.matches.find((item) => String(item.id) === String(admin$('match-select')?.value));
  if (!match) return;
  admin$('match-home-score').value = match.goles_local ?? '';
  admin$('match-away-score').value = match.goles_visitante ?? '';
  setDynamicOption(admin$('match-status'), match.estado || 'programado');
}

function fillTipForm() {
  const selection = admin$('tip-select')?.value || '';
  if (selection.startsWith('new:')) {
    adminState.tipDraftMatchId = selection.slice(4);
    admin$('tip-category').value = 'base';
    admin$('tip-market').value = '';
    admin$('tip-prediction').value = '';
    admin$('tip-confidence').value = '';
    admin$('tip-result').value = '';
    admin$('tip-reason').value = '';
    return;
  }
  adminState.tipDraftMatchId = null;
  const tipId = selection.startsWith('tip:') ? selection.slice(4) : selection;
  const tip = adminState.tips.find((item) => String(item.id) === String(tipId));
  if (!tip) return;
  admin$('tip-category').value = tip.categoria || 'base';
  admin$('tip-market').value = tip.tipo_apuesta || '';
  admin$('tip-prediction').value = tip.prediccion || '';
  admin$('tip-confidence').value = tip.confianza ?? '';
  admin$('tip-result').value = tip.resultado || '';
  admin$('tip-reason').value = tip.razonamiento || '';
}

async function loadAdminData() {
  const matchesResponse = await adminRequest(
    supabaseClient
      .from('calendario_completo')
      .select('id,jornada,local,visitante,fecha_hora_mx,goles_local,goles_visitante,estado')
      .order('fecha_hora_mx', { ascending: true }),
    'los partidos'
  );
  if (matchesResponse.error) throw matchesResponse.error;
  adminState.matches = Array.isArray(matchesResponse.data) ? matchesResponse.data : [];
  renderMatchOptions();

  const tipsResponse = await adminRequest(
    supabaseClient.rpc('admin_list_tips'),
    'los tips'
  );
  if (tipsResponse.error) throw tipsResponse.error;
  const matchesById = new Map(adminState.matches.map((match) => [String(match.id), match]));
  const tips = Array.isArray(tipsResponse.data)
    ? [...tipsResponse.data].sort((first, second) => new Date(second.created_at || 0) - new Date(first.created_at || 0))
    : [];
  adminState.tips = tips.map((tip) => {
    const match = matchesById.get(String(tip.partido_id));
    return {
      ...tip,
      jornada: match?.jornada || '—',
      local: match?.local || 'Partido no encontrado',
      visitante: match?.visitante || `ID ${tip.partido_id || 'sin partido'}`
    };
  });
  renderTipOptions();
  await loadLiguillaAdminData();
}

async function checkAdmin(user) {
  if (!user) {
    adminState.isAdmin = false;
    showAdminSection('admin-access', true);
    showAdminSection('admin-denied', false);
    showAdminSection('admin-dashboard', false);
    admin$('admin-logout-btn')?.classList.add('hidden');
    return;
  }

  adminMessage('Verificando permisos...', 'loading');
  const { data, error } = await supabaseClient.rpc('is_admin');
  if (error) throw error;
  adminState.isAdmin = data === true;
  showAdminSection('admin-access', false);
  showAdminSection('admin-denied', !adminState.isAdmin);
  showAdminSection('admin-dashboard', adminState.isAdmin);
  admin$('admin-logout-btn')?.classList.remove('hidden');
  admin$('admin-current-email').textContent = `${adminUserName(user)} · ${user.email || ''}`;
  if (adminState.isAdmin) {
    adminFeedback('Cargando datos administrativos...', 'loading');
    try {
      await loadAdminData();
      adminFeedback('Listo. Los cambios se aplican directamente a Supabase.', 'success');
    } catch (error) {
      adminFeedback(`No se pudieron cargar los datos: ${error.message || 'revisa las vistas y permisos de Supabase.'}`, 'error');
      throw error;
    }
  }
}

async function refreshAdminSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  adminState.user = data.session?.user || null;
  await checkAdmin(adminState.user);
}

async function adminEmailLogin(event) {
  event.preventDefault();
  const email = admin$('admin-email')?.value.trim();
  const password = admin$('admin-password')?.value || '';
  if (!email || !password) {
    adminMessage('Escribe correo y contrasena.', 'error');
    return;
  }
  const button = admin$('admin-login-btn');
  if (button) button.disabled = true;
  adminMessage('Iniciando sesion...', 'loading');
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    adminMessage(error.message || 'No se pudo iniciar sesi&oacute;n.', 'error');
  } else {
    adminState.user = data.user;
    try {
      await checkAdmin(data.user);
    } catch (permissionError) {
      adminMessage(permissionError.message || 'No se pudieron verificar los permisos.', 'error');
    }
  }
  if (button) button.disabled = false;
}

async function adminGoogleLogin() {
  adminMessage('Abriendo Google...', 'loading');
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  if (error) adminMessage(error.message || 'No se pudo abrir Google.', 'error');
}

async function adminLogout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) adminMessage(error.message || 'No se pudo cerrar sesion.', 'error');
}

async function saveMatch(event) {
  event.preventDefault();
  const id = admin$('match-select')?.value;
  if (!id) return;
  const homeScore = admin$('match-home-score').value;
  const awayScore = admin$('match-away-score').value;
  const payload = {
    goles_local: homeScore === '' ? null : Number(homeScore),
    goles_visitante: awayScore === '' ? null : Number(awayScore),
    estado: admin$('match-status').value
  };
  adminFeedback('Guardando resultado...', 'loading');
  const { error } = await supabaseClient.from('partidos').update(payload).eq('id', id);
  if (error) {
    adminFeedback(error.message || 'No se pudo guardar el resultado.', 'error');
    return;
  }
  const match = adminState.matches.find((item) => String(item.id) === String(id));
  if (match) Object.assign(match, payload);
  adminFeedback('Resultado guardado. Recarga el sitio público para comprobar el historial.', 'success');
}

async function saveTip(event) {
  event.preventDefault();
  const selection = admin$('tip-select')?.value || '';
  if (!selection) return;
  const isNewTip = selection.startsWith('new:');
  const id = isNewTip ? '' : (selection.startsWith('tip:') ? selection.slice(4) : selection);
  const result = admin$('tip-result').value || null;
  const confidence = admin$('tip-confidence').value;
  const payload = {
    categoria: admin$('tip-category').value,
    tipo_apuesta: admin$('tip-market').value.trim(),
    prediccion: admin$('tip-prediction').value.trim(),
    confianza: confidence === '' ? null : Number(confidence),
    razonamiento: admin$('tip-reason').value.trim(),
    resultado: result,
    resultado_actualizado_en: result ? new Date().toISOString() : null
  };
  if (isNewTip) {
    payload.partido_id = adminState.tipDraftMatchId;
    payload.es_premium = false;
  }
  adminFeedback('Guardando tip...', 'loading');
  const response = isNewTip
    ? await supabaseClient.from('tips').insert(payload).select().single()
    : await supabaseClient.from('tips').update(payload).eq('id', id);
  const { data, error } = response;
  if (error) {
    adminFeedback(error.message || 'No se pudo guardar el tip.', 'error');
    return;
  }
  if (isNewTip && data) {
    const match = adminState.matches.find((item) => String(item.id) === String(payload.partido_id));
    adminState.tips.push({
      ...data,
      jornada: match?.jornada || '—',
      local: match?.local || 'Partido no encontrado',
      visitante: match?.visitante || `ID ${payload.partido_id || 'sin partido'}`
    });
    renderTipOptions();
    admin$('tip-select').value = `tip:${data.id}`;
    fillTipForm();
  }
  const tip = adminState.tips.find((item) => String(item.id) === String(id));
  if (tip) Object.assign(tip, payload);
  adminFeedback(isNewTip ? 'Nuevo tip creado correctamente.' : 'Tip guardado correctamente.', 'success');
}

function bindAdminEvents() {
  admin$('admin-login-form')?.addEventListener('submit', adminEmailLogin);
  admin$('admin-google-btn')?.addEventListener('click', adminGoogleLogin);
  admin$('admin-logout-btn')?.addEventListener('click', adminLogout);
  admin$('match-select')?.addEventListener('change', fillMatchForm);
  admin$('tip-select')?.addEventListener('change', fillTipForm);
  admin$('match-form')?.addEventListener('submit', saveMatch);
  admin$('tip-form')?.addEventListener('submit', saveTip);
  admin$('admin-liguilla-seed-btn')?.addEventListener('click', seedLiguillaAdmin);
  admin$('admin-liguilla-save-btn')?.addEventListener('click', saveLiguillaAdmin);
}

async function initializeAdmin() {
  bindAdminEvents();
  try {
    await refreshAdminSession();
  } catch (error) {
    adminMessage(error.message || 'No se pudo conectar con Supabase.', 'error');
    showAdminSection('admin-access', true);
  }
  supabaseClient.auth.onAuthStateChange((event, session) => {
    window.setTimeout(async () => {
      adminState.user = session?.user || null;
      try {
        await checkAdmin(adminState.user);
      } catch (error) {
        adminMessage(error.message || 'No se pudieron verificar los permisos.', 'error');
      }
    }, 0);
  });
}

window.addEventListener('DOMContentLoaded', initializeAdmin);
