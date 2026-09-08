const adminState = {
  user: null,
  isAdmin: false,
  matches: [],
  tips: [],
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
