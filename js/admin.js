const adminState = {
  user: null,
  isAdmin: false,
  matches: [],
  tips: []
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
  select.innerHTML = adminState.tips.length
    ? adminState.tips.map((tip) => `<option value="${adminEscape(tip.id)}">J${adminEscape(tip.jornada)} · ${adminEscape(tip.local)} vs ${adminEscape(tip.visitante)} · ${adminEscape(tip.prediccion)}</option>`).join('')
    : '<option value="">No hay tips disponibles</option>';
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
  const tip = adminState.tips.find((item) => String(item.id) === String(admin$('tip-select')?.value));
  if (!tip) return;
  admin$('tip-category').value = tip.categoria || 'base';
  admin$('tip-market').value = tip.tipo_apuesta || '';
  admin$('tip-prediction').value = tip.prediccion || '';
  admin$('tip-confidence').value = tip.confianza ?? '';
  admin$('tip-result').value = tip.resultado || '';
  admin$('tip-reason').value = tip.razonamiento || '';
}

async function loadAdminData() {
  const [matchesResponse, tipsResponse] = await Promise.all([
    supabaseClient
      .from('calendario_completo')
      .select('id,jornada,local,visitante,fecha_hora_mx,goles_local,goles_visitante,estado')
      .order('fecha_hora_mx', { ascending: true }),
    supabaseClient
      .from('tips_completos')
      .select('id,jornada,local,visitante,categoria,tipo_apuesta,prediccion,confianza,razonamiento')
      .order('jornada', { ascending: false })
  ]);
  if (matchesResponse.error) throw matchesResponse.error;
  if (tipsResponse.error) throw tipsResponse.error;
  adminState.matches = Array.isArray(matchesResponse.data) ? matchesResponse.data : [];
  const tips = Array.isArray(tipsResponse.data) ? tipsResponse.data : [];
  const tipIds = tips.map((tip) => tip.id).filter(Boolean);
  let tipResults = [];
  if (tipIds.length) {
    const resultsResponse = await supabaseClient
      .from('tips')
      .select('id,resultado')
      .in('id', tipIds);
    if (resultsResponse.error) throw resultsResponse.error;
    tipResults = Array.isArray(resultsResponse.data) ? resultsResponse.data : [];
  }
  const resultsById = new Map(tipResults.map((tip) => [String(tip.id), tip.resultado || '']));
  adminState.tips = tips.map((tip) => ({ ...tip, resultado: resultsById.get(String(tip.id)) || '' }));
  renderMatchOptions();
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
  const id = admin$('tip-select')?.value;
  if (!id) return;
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
  adminFeedback('Guardando tip...', 'loading');
  const { error } = await supabaseClient.from('tips').update(payload).eq('id', id);
  if (error) {
    adminFeedback(error.message || 'No se pudo guardar el tip.', 'error');
    return;
  }
  const tip = adminState.tips.find((item) => String(item.id) === String(id));
  if (tip) Object.assign(tip, payload);
  adminFeedback('Tip guardado correctamente.', 'success');
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
