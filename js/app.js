const appState = {
  view: window.location.hash.replace('#', '') || 'inicio',
  teams: [],
  standings: [],
  matches: [],
  tips: [],
  history: [],
  palmares: [],
  favorites: JSON.parse(localStorage.getItem('lma-favorite-teams') || '[]'),
  historySource: 'fallback',
  calendarFilter: 'all',
  calendarTeam: '',
  compareA: '',
  compareB: '',
  quinielaSize: 14,
  quinielaPicks: {},
  simulatorPicks: {},
  deferredInstallPrompt: null,
  lastUpdatedAt: null
};

const validViews = ['inicio', 'calendario', 'tips', 'equipos', 'analisis', 'herramientas'];

const categoryMeta = {
  base: { label: 'Base', className: 'tip-base', dot: 'green' },
  zona_gris: { label: 'Zona Gris', className: 'tip-gris', dot: 'yellow' },
  sorpresa: { label: 'Sorpresa', className: 'tip-sorpresa', dot: 'red' }
};

function getCategoryKey(value) {
  const category = normalizeText(value).replace(/\s+/g, '_');
  if (category.includes('zona') && category.includes('gris')) return 'zona_gris';
  if (category.includes('sorpresa')) return 'sorpresa';
  if (category.includes('base')) return 'base';
  return category;
}

const $ = (id) => document.getElementById(id);

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function numericValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatDate(value, options = {}) {
  if (!value) return 'Fecha por confirmar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }).format(date);
}

function formatShortDate(value) {
  return formatDate(value, { year: undefined, hour: undefined, minute: undefined });
}

function hasRecordedScore(match) {
  const localGoals = match?.goles_local;
  const visitorGoals = match?.goles_visitante;
  return localGoals !== null && localGoals !== undefined && String(localGoals).trim() !== ''
    && visitorGoals !== null && visitorGoals !== undefined && String(visitorGoals).trim() !== '';
}

function isFinalMatch(match) {
  const state = normalizeText(match?.estado);
  if (state.includes('finaliz') || state.includes('termin') || state === 'finished' || state === 'completed' || state === 'played') return true;
  const matchDate = new Date(match?.fecha_hora_mx || 0).getTime();
  return !state && hasRecordedScore(match) && Number.isFinite(matchDate) && matchDate < Date.now();
}

function isLiveMatch(match) {
  const state = normalizeText(match?.estado);
  return state.includes('en vivo') || state === 'live';
}

function isCurrentOrFutureMatch(match) {
  if (isLiveMatch(match)) return true;
  const matchDate = new Date(match?.fecha_hora_mx || 0).getTime();
  if (!Number.isFinite(matchDate) || matchDate === 0) return true;
  return matchDate >= Date.now() - (6 * 60 * 60 * 1000);
}

function getTeamByAbbreviation(abbreviation) {
  return appState.teams.find((team) => team.abreviatura === abbreviation);
}

function getTeamByName(name) {
  const normalizedName = normalizeText(name);
  return appState.teams.find((team) => normalizeText(team.nombre) === normalizedName);
}

function getTeamAbbreviation(name) {
  return getTeamByName(name)?.abreviatura || '';
}

function getTeamName(abbreviation) {
  return getTeamByAbbreviation(abbreviation)?.nombre || abbreviation;
}

function canonicalTeamName(value) {
  return normalizeText(value)
    .replace(/\b(club|fc|futbol|football|deportivo|cd|cf|de)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sameTeamName(firstName, secondName) {
  const first = canonicalTeamName(firstName);
  const second = canonicalTeamName(secondName);
  return Boolean(first && second && (first === second || first.includes(second) || second.includes(first)));
}

function matchContainsTeam(match, abbreviation) {
  if (!abbreviation) return false;
  return getTeamAbbreviation(match.local) === abbreviation || getTeamAbbreviation(match.visitante) === abbreviation;
}

function getCurrentJornada() {
  const activeJornadas = appState.matches
    .filter((match) => !isFinalMatch(match) && isCurrentOrFutureMatch(match))
    .map((match) => numericValue(match.jornada, 0))
    .filter(Boolean);

  if (activeJornadas.length) return Math.min(...activeJornadas);

  const matchJornadas = appState.matches
    .map((match) => numericValue(match.jornada, 0))
    .filter(Boolean);
  if (matchJornadas.length) return Math.max(...matchJornadas);

  const tipJornadas = appState.tips
    .map((tip) => numericValue(tip.jornada, 0))
    .filter(Boolean);
  return tipJornadas.length ? Math.max(...tipJornadas) : '—';
}

function getTipsJornada() {
  const currentJornada = numericValue(getCurrentJornada(), 0);
  const tipJornadas = [...new Set(appState.tips.map((tip) => numericValue(tip.jornada, 0)).filter(Boolean))];
  if (!tipJornadas.length) return currentJornada;

  const nearbyJornadas = currentJornada
    ? tipJornadas.filter((jornada) => jornada >= currentJornada && jornada <= currentJornada + 1)
    : tipJornadas;
  if (nearbyJornadas.length) return Math.max(...nearbyJornadas);
  return currentJornada || Math.max(...tipJornadas);
}

function getUpcomingMatches() {
  return appState.matches
    .filter((match) => !isFinalMatch(match) && isCurrentOrFutureMatch(match))
    .sort((first, second) => new Date(first.fecha_hora_mx || 0) - new Date(second.fecha_hora_mx || 0));
}

function getFinishedMatchesForTeam(teamName) {
  const normalizedTeam = normalizeText(teamName);
  return appState.matches
    .filter((match) => isFinalMatch(match) && (normalizeText(match.local) === normalizedTeam || normalizeText(match.visitante) === normalizedTeam))
    .sort((first, second) => new Date(second.fecha_hora_mx || 0) - new Date(first.fecha_hora_mx || 0));
}

function getTeamResult(match, teamName) {
  const isLocal = normalizeText(match.local) === normalizeText(teamName);
  const goalsFor = isLocal ? numericValue(match.goles_local) : numericValue(match.goles_visitante);
  const goalsAgainst = isLocal ? numericValue(match.goles_visitante) : numericValue(match.goles_local);
  if (goalsFor > goalsAgainst) return 'G';
  if (goalsFor === goalsAgainst) return 'E';
  return 'P';
}

function getTeamForm(teamName, limit = 5) {
  return getFinishedMatchesForTeam(teamName).slice(0, limit).map((match) => getTeamResult(match, teamName));
}

function renderFormDots(teamName) {
  const form = getTeamForm(teamName);
  if (!form.length) return '<span class="form-empty">Sin datos</span>';
  return form.map((result) => `<span class="form-pill form-${result === 'G' ? 'win' : result === 'E' ? 'draw' : 'loss'}">${result}</span>`).join('');
}

function getMatchOutcome(match) {
  if (!isFinalMatch(match)) return '';
  const localGoals = numericValue(match.goles_local);
  const visitorGoals = numericValue(match.goles_visitante);
  if (localGoals > visitorGoals) return '1';
  if (localGoals === visitorGoals) return 'x';
  return '2';
}

function getCornerTotal(match) {
  const directFields = ['corners_total', 'corner_total', 'tiros_esquina_total'];
  const localFields = ['corners_local', 'corner_local', 'tiros_esquina_local'];
  const visitorFields = ['corners_visitante', 'corner_visitante', 'tiros_esquina_visitante'];
  const directField = directFields.find((field) => match?.[field] !== null && match?.[field] !== undefined && String(match[field]).trim() !== '');
  if (directField) return numericValue(match[directField]);
  const localField = localFields.find((field) => match?.[field] !== null && match?.[field] !== undefined && String(match[field]).trim() !== '');
  const visitorField = visitorFields.find((field) => match?.[field] !== null && match?.[field] !== undefined && String(match[field]).trim() !== '');
  if (localField && visitorField) return numericValue(match[localField]) + numericValue(match[visitorField]);
  return null;
}

function getScoreLabel(match) {
  if (isLiveMatch(match)) return 'EN VIVO';
  if (isFinalMatch(match)) return `${numericValue(match.goles_local)} - ${numericValue(match.goles_visitante)}`;
  return formatDate(match.fecha_hora_mx);
}

function getScoreClass(match) {
  if (isLiveMatch(match)) return 'score-live';
  if (isFinalMatch(match)) return 'score-final';
  return 'score-pending';
}

function setConnectionStatus(type, message) {
  const status = $('connection-status');
  if (!status) return;
  status.className = `status-card status-${type}`;
  status.textContent = message;
}

function setLastUpdated() {
  appState.lastUpdatedAt = new Date();
  const element = $('last-updated');
  if (element) element.textContent = `Última consulta: ${formatDate(appState.lastUpdatedAt)}`;
}

async function initializeApp() {
  bindStaticEvents();
  setView(validViews.includes(appState.view) ? appState.view : 'inicio', false);
  setConnectionStatus('loading', 'Verificando conexión con Supabase...');

  try {
    const { error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;

    const results = await Promise.allSettled([
      loadTeams(),
      loadStandings(),
      loadMatches(),
      loadTips(),
      loadPalmares()
    ]);

    await loadHistory();
    renderAll();
    setLastUpdated();

    const failedRequests = results.filter((result) => result.status === 'rejected');
    if (failedRequests.length) {
      setConnectionStatus('error', 'Conectado, pero algunas secciones necesitan revisión.');
    } else {
      setConnectionStatus('ok', 'Conectado a Supabase correctamente');
    }
  } catch (error) {
    setConnectionStatus('error', `Error de conexión: ${error.message}`);
    renderAll();
  }

  registerPwa();
}

async function loadTeams() {
  const { data, error } = await supabaseClient
    .from('equipos')
    .select('*')
    .order('nombre');
  if (error) throw error;
  appState.teams = safeArray(data);
}

async function loadStandings() {
  const { data, error } = await supabaseClient
    .from('tabla_posiciones')
    .select('*');
  if (error) throw error;
  appState.standings = safeArray(data).sort((first, second) => {
    return numericValue(second.pts) - numericValue(first.pts)
      || numericValue(second.dg) - numericValue(first.dg)
      || numericValue(second.gf) - numericValue(first.gf);
  });
}

async function loadMatches() {
  const { data, error } = await supabaseClient
    .from('calendario_completo')
    .select('*');
  if (error) throw error;
  appState.matches = safeArray(data).sort((first, second) => {
    return new Date(first.fecha_hora_mx || 0) - new Date(second.fecha_hora_mx || 0);
  });
}

async function loadTips() {
  const { data, error } = await supabaseClient
    .from('tips_completos')
    .select('*');
  if (error) throw error;
  appState.tips = safeArray(data).sort((first, second) => numericValue(second.jornada) - numericValue(first.jornada));
}

function normalizeTipResult(value) {
  const result = normalizeText(value);
  if (['acertado', 'acierto', 'ganado', 'ganada', 'win', 'won'].includes(result)) return 'acertado';
  if (['fallado', 'fallo', 'perdido', 'perdida', 'loss', 'lost'].includes(result)) return 'fallado';
  return '';
}

function findHistoryMatch(row) {
  if (row.partido_id !== null && row.partido_id !== undefined) {
    const matchById = appState.matches.find((match) => String(match.id) === String(row.partido_id));
    if (matchById) return matchById;
  }

  const rowLocal = normalizeText(row.local);
  const rowVisitor = normalizeText(row.visitante);
  const rowJornada = numericValue(row.jornada, 0);
  return appState.matches.find((match) => {
    const sameTeams = sameTeamName(match.local, rowLocal) && sameTeamName(match.visitante, rowVisitor);
    const sameJornada = !rowJornada || numericValue(match.jornada, 0) === rowJornada;
    return sameTeams && sameJornada;
  });
}

function getPredictedOutcome(row, match) {
  const prediction = normalizeText(row.prediccion);
  const betType = normalizeText(row.tipo_apuesta);
  const combinedPredictions = prediction.split(/\s+(?:y|e)\s+/).filter(Boolean);
  if (combinedPredictions.length > 1) {
    const combinedResults = combinedPredictions.map((part) => getPredictedOutcome({ ...row, prediccion: part, tipo_apuesta: '' }, match));
    if (combinedResults.every(Boolean)) return combinedResults.every((result) => result === 'acertado') ? 'acertado' : 'fallado';
  }
  const text = `${prediction} ${betType}`.trim();
  const outcome = getMatchOutcome(match);
  if (!outcome) return '';

  const localGoals = numericValue(match.goles_local);
  const visitorGoals = numericValue(match.goles_visitante);
  const totalGoals = localGoals + visitorGoals;
  const isCornersMarket = /\b(?:corner|corners|tiro de esquina|tiros de esquina)\b/.test(text);
  const marketTotal = isCornersMarket ? getCornerTotal(match) : totalGoals;
  const exactScore = prediction.match(/(?:^|\s)(\d+)\s*[-:]\s*(\d+)(?:\s|$)/);
  if (exactScore) return localGoals === Number(exactScore[1]) && visitorGoals === Number(exactScore[2]) ? 'acertado' : 'fallado';

  const over = text.match(/(?:mas|over)\s*(?:de|del)?\s*(\d+(?:\.\d+)?)/);
  if (over) return marketTotal === null ? '' : marketTotal > Number(over[1]) ? 'acertado' : 'fallado';
  const under = text.match(/(?:menos|under)\s*(?:de|del)?\s*(\d+(?:\.\d+)?)/);
  if (under) return marketTotal === null ? '' : marketTotal < Number(under[1]) ? 'acertado' : 'fallado';

  if (/(?:ambos.*(?:si|anotan|marcan)|btts.*(?:yes|si))/.test(text)) return localGoals > 0 && visitorGoals > 0 ? 'acertado' : 'fallado';
  if (/(?:ambos.*no|btts.*no)/.test(text)) return localGoals === 0 || visitorGoals === 0 ? 'acertado' : 'fallado';

  const mentionsLocalTeam = sameTeamName(prediction, match.local) || /\blocal\b/.test(text);
  const mentionsVisitorTeam = sameTeamName(prediction, match.visitante) || /\b(?:visitante|visita)\b/.test(text);
  const localDoesNotWin = mentionsLocalTeam && /\bno gan\w*/.test(text);
  const localDoesNotLose = mentionsLocalTeam && /\bno pierd\w*/.test(text);
  const visitorDoesNotWin = mentionsVisitorTeam && /\bno gan\w*/.test(text);
  const visitorDoesNotLose = mentionsVisitorTeam && /\bno pierd\w*/.test(text);
  const drawWithLocal = /\bempate\b/.test(text) && mentionsLocalTeam && !mentionsVisitorTeam;
  const drawWithVisitor = /\bempate\b/.test(text) && mentionsVisitorTeam && !mentionsLocalTeam;
  const drawAndVisitor = /(?:empate.*(?:derrota|visita|visitante)|(?:derrota|visita|visitante).*empate)/.test(text);
  const drawAndLocal = /(?:empate.*local|local.*empate)/.test(text);
  if (localDoesNotWin || visitorDoesNotLose || drawWithVisitor || drawAndVisitor) return ['x', '2'].includes(outcome) ? 'acertado' : 'fallado';
  if (localDoesNotLose || visitorDoesNotWin || drawWithLocal || drawAndLocal) return ['1', 'x'].includes(outcome) ? 'acertado' : 'fallado';
  if (/(?:\b1x\b|local.*empate|empate.*local)/.test(text)) return ['1', 'x'].includes(outcome) ? 'acertado' : 'fallado';
  if (/(?:\bx2\b|empate.*visitante|visitante.*empate)/.test(text)) return ['x', '2'].includes(outcome) ? 'acertado' : 'fallado';
  if (/(?:\b12\b|local.*visitante|visitante.*local)/.test(text)) return ['1', '2'].includes(outcome) ? 'acertado' : 'fallado';

  const pickedLocal = prediction === '1' || prediction === 'local' || mentionsLocalTeam || /(?:gana|victoria|triunfo).*local|local.*(?:gana|victoria|triunfo)/.test(text);
  const pickedDraw = prediction === 'x' || prediction === 'empate' || /\bempate\b/.test(text);
  const pickedVisitor = prediction === '2' || prediction === 'visitante' || mentionsVisitorTeam || /(?:gana|victoria|triunfo).*visitante|visitante.*(?:gana|victoria|triunfo)/.test(text);
  if (pickedLocal) return outcome === '1' ? 'acertado' : 'fallado';
  if (pickedDraw) return outcome === 'x' ? 'acertado' : 'fallado';
  if (pickedVisitor) return outcome === '2' ? 'acertado' : 'fallado';
  return '';
}

function resolveHistoryResult(row) {
  const explicitResult = normalizeTipResult(row.resultado);
  if (explicitResult) return { ...row, resultado: explicitResult };

  const match = findHistoryMatch(row);
  const calculatedResult = match && isFinalMatch(match) ? getPredictedOutcome(row, match) : '';
  return { ...row, resultado: calculatedResult || 'pendiente' };
}

function resolveHistoryRows(rows) {
  return safeArray(rows).map(resolveHistoryResult);
}

async function loadHistory() {
  const { data, error } = await supabaseClient
    .from('tips_historial')
    .select('*')
    .order('jornada', { ascending: false });

  if (!error && data) {
    appState.history = resolveHistoryRows(data);
    appState.historySource = 'tips_historial';
    return;
  }

  appState.history = resolveHistoryRows(appState.tips);
  appState.historySource = 'fallback';
}

async function loadPalmares() {
  const { data, error } = await supabaseClient
    .from('palmares_equipo')
    .select('*');
  if (error) throw error;
  appState.palmares = safeArray(data);
}

function bindStaticEvents() {
  document.addEventListener('click', handleDocumentClick);

  $('mobile-menu-btn')?.addEventListener('click', () => {
    const nav = $('main-nav');
    const button = $('mobile-menu-btn');
    const isOpen = nav?.classList.toggle('open');
    button?.setAttribute('aria-expanded', String(Boolean(isOpen)));
  });

  $('search-team-btn')?.addEventListener('click', searchTeam);
  $('team-search-input')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') searchTeam();
  });

  $('calendar-filter')?.addEventListener('change', (event) => {
    appState.calendarFilter = event.target.value;
    renderCalendar();
  });

  $('calendar-team-filter')?.addEventListener('change', (event) => {
    appState.calendarTeam = event.target.value;
    renderCalendar();
  });

  $('full-calendar-btn')?.addEventListener('click', () => {
    appState.calendarFilter = 'all';
    appState.calendarTeam = '';
    if ($('calendar-filter')) $('calendar-filter').value = 'all';
    if ($('calendar-team-filter')) $('calendar-team-filter').value = '';
    renderCalendar();
  });

  $('tips-filter')?.addEventListener('change', renderTips);

  document.querySelectorAll('[data-tips-panel]').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = button.dataset.tipsPanel;
      document.querySelectorAll('[data-tips-panel]').forEach((item) => item.classList.toggle('active', item === button));
      $('tips-current-panel')?.classList.toggle('active', panel === 'current');
      $('tips-history-panel')?.classList.toggle('active', panel === 'history');
    });
  });

  $('team-select')?.addEventListener('change', (event) => {
    if (event.target.value) openTeamModal(event.target.value);
  });

  $('palmares-select')?.addEventListener('change', (event) => renderPalmares(event.target.value));
  $('compare-team-a')?.addEventListener('change', (event) => {
    appState.compareA = event.target.value;
    renderComparison();
  });
  $('compare-team-b')?.addEventListener('change', (event) => {
    appState.compareB = event.target.value;
    renderComparison();
  });

  $('quiniela-size')?.addEventListener('change', (event) => {
    appState.quinielaSize = numericValue(event.target.value, 14);
    renderQuiniela();
  });

  $('quiniela-reset')?.addEventListener('click', () => {
    appState.quinielaPicks = {};
    renderQuiniela();
  });

  $('simulator-reset')?.addEventListener('click', () => {
    appState.simulatorPicks = {};
    renderSimulator();
  });

  $('close-modal')?.addEventListener('click', closeTeamModal);
  $('team-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'team-modal') closeTeamModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeTeamModal();
  });

  $('install-app-btn')?.addEventListener('click', installPwa);
  window.addEventListener('hashchange', () => {
    const view = window.location.hash.replace('#', '');
    setView(validViews.includes(view) ? view : 'inicio', false);
  });
}

function handleDocumentClick(event) {
  const viewLink = event.target.closest('[data-view-link]');
  if (viewLink) {
    event.preventDefault();
    setView(viewLink.dataset.viewLink);
    return;
  }

  const action = event.target.closest('[data-action]');
  if (!action) return;

  if (action.dataset.action === 'set-view') {
    setView(action.dataset.view);
  }

  if (action.dataset.action === 'toggle-favorite') {
    toggleFavorite(action.dataset.team);
  }

  if (action.dataset.action === 'quiniela-pick') {
    updateQuinielaPick(action.dataset.match, action.dataset.pick);
  }
}

function setView(view, updateHash = true) {
  const nextView = validViews.includes(view) ? view : 'inicio';
  appState.view = nextView;

  document.querySelectorAll('.app-view[data-view]').forEach((section) => {
    section.classList.toggle('active', section.dataset.view === nextView);
  });
  document.querySelectorAll('[data-view-link]').forEach((link) => {
    link.classList.toggle('active', link.dataset.viewLink === nextView);
  });

  $('main-nav')?.classList.remove('open');
  $('mobile-menu-btn')?.setAttribute('aria-expanded', 'false');

  if (updateHash && window.location.hash !== `#${nextView}`) {
    window.history.replaceState(null, '', `#${nextView}`);
  }

  if (nextView === 'calendario') renderCalendar();
  if (nextView === 'tips') renderTips();
  if (nextView === 'analisis') {
    renderComparison();
    renderStreaks();
  }
  if (nextView === 'herramientas') {
    renderQuiniela();
    renderSimulator();
  }
}

function searchTeam() {
  const input = $('team-search-input');
  const query = normalizeText(input?.value);
  if (!query) return;
  const team = appState.teams.find((item) => normalizeText(item.nombre).includes(query));
  setView('calendario');
  if (!team) {
    appState.calendarTeam = '';
    $('calendar-results').innerHTML = '<div class="empty-state">Equipo no encontrado. Intenta con otro nombre.</div>';
    return;
  }
  appState.calendarTeam = team.abreviatura;
  if ($('calendar-team-filter')) $('calendar-team-filter').value = team.abreviatura;
  renderCalendar();
}

function renderAll() {
  populateSelectors();
  renderHome();
  renderCalendar();
  renderTips();
  renderStandings();
  renderFavorites();
  renderComparison();
  renderStreaks();
  renderPalmares($('palmares-select')?.value || '');
  renderQuiniela();
  renderSimulator();
}

function populateSelectors() {
  const optionList = appState.teams.map((team) => `<option value="${escapeHtml(team.abreviatura)}">${escapeHtml(team.nombre)}</option>`).join('');
  const teamSelect = $('team-select');
  const palmaresSelect = $('palmares-select');
  const calendarTeamFilter = $('calendar-team-filter');
  const compareA = $('compare-team-a');
  const compareB = $('compare-team-b');

  if (teamSelect) teamSelect.innerHTML = '<option value="">Selecciona un equipo...</option>' + optionList;
  if (palmaresSelect) palmaresSelect.innerHTML = '<option value="">Selecciona un equipo...</option>' + optionList;
  if (calendarTeamFilter) calendarTeamFilter.innerHTML = '<option value="">Todos los equipos</option>' + optionList;
  if (compareA) compareA.innerHTML = optionList;
  if (compareB) compareB.innerHTML = optionList;

  if (appState.compareA && getTeamByAbbreviation(appState.compareA)) {
    compareA.value = appState.compareA;
  } else if (appState.teams[0]) {
    appState.compareA = appState.teams[0].abreviatura;
    compareA.value = appState.compareA;
  }

  if (appState.compareB && getTeamByAbbreviation(appState.compareB)) {
    compareB.value = appState.compareB;
  } else if (appState.teams[1]) {
    appState.compareB = appState.teams[1].abreviatura;
    compareB.value = appState.compareB;
  }

  if ($('team-search-input')) {
    $('team-list').innerHTML = appState.teams.map((team) => `<option value="${escapeHtml(team.nombre)}"></option>`).join('');
  }
}

function renderHome() {
  const currentJornada = numericValue(getCurrentJornada(), 0);
  const upcomingMatches = getUpcomingMatches();
  const currentMatches = upcomingMatches.filter((match) => numericValue(match.jornada, 0) === currentJornada);
  const latestJornada = getTipsJornada();
  const latestTips = appState.tips.filter((tip) => numericValue(tip.jornada) === latestJornada);
  const historyStats = calculateHistoryStats(appState.history);

  if ($('home-jornada')) $('home-jornada').textContent = currentJornada ? `J${currentJornada}` : '—';
  if ($('home-hero-caption')) $('home-hero-caption').textContent = currentMatches.length ? `${currentMatches.length} partidos pendientes de J${currentJornada}.` : 'Consulta los partidos disponibles.';
  if ($('home-favorites-count')) $('home-favorites-count').textContent = appState.favorites.length;
  if ($('home-upcoming-count')) $('home-upcoming-count').textContent = currentMatches.length;
  if ($('home-tips-count')) $('home-tips-count').textContent = latestTips.length;
  if ($('home-history-count')) $('home-history-count').textContent = `${historyStats.accuracy}%`;

  if ($('home-next-matches')) {
    $('home-next-matches').innerHTML = upcomingMatches.length
      ? upcomingMatches.slice(0, 4).map((match) => renderMatchCard(match, true)).join('')
      : '<div class="empty-state">No hay partidos próximos cargados todavía.</div>';
  }

  if ($('home-tips-preview')) {
    $('home-tips-preview').innerHTML = latestTips.length
      ? latestTips.slice(0, 4).map(renderMiniTip).join('')
      : '<div class="empty-state">Todavía no hay tips publicados.</div>';
  }

  renderFavoriteChips('home-favorite-teams');
}

function renderMatchCard(match, showFollow = false) {
  const localAbbreviation = getTeamAbbreviation(match.local);
  const visitorAbbreviation = getTeamAbbreviation(match.visitante);
  const localFollow = showFollow && localAbbreviation
    ? `<button class="follow-mini ${appState.favorites.includes(localAbbreviation) ? 'is-following' : ''}" type="button" data-action="toggle-favorite" data-team="${escapeHtml(localAbbreviation)}" aria-label="Seguir a ${escapeHtml(match.local)}">★</button>`
    : '';
  const visitorFollow = showFollow && visitorAbbreviation
    ? `<button class="follow-mini ${appState.favorites.includes(visitorAbbreviation) ? 'is-following' : ''}" type="button" data-action="toggle-favorite" data-team="${escapeHtml(visitorAbbreviation)}" aria-label="Seguir a ${escapeHtml(match.visitante)}">★</button>`
    : '';

  return `
    <article class="match-card">
      <div class="match-meta"><span>Jornada ${escapeHtml(match.jornada ?? '—')}</span><span>${escapeHtml(formatShortDate(match.fecha_hora_mx))}</span></div>
      <div class="match-main">
        <div class="match-team"><span class="team-mark green-mark"></span><strong>${escapeHtml(match.local)}</strong>${localFollow}</div>
        <div class="match-score ${getScoreClass(match)}">${escapeHtml(getScoreLabel(match))}</div>
        <div class="match-team visitor-team">${visitorFollow}<strong>${escapeHtml(match.visitante)}</strong><span class="team-mark red-mark"></span></div>
      </div>
    </article>
  `;
}

function renderMiniTip(tip) {
  const meta = categoryMeta[getCategoryKey(tip.categoria)] || categoryMeta.base;
  return `
    <article class="mini-tip ${meta.className}">
      <div><span class="category-dot ${meta.dot}"></span><strong>${escapeHtml(tip.local)} vs ${escapeHtml(tip.visitante)}</strong></div>
      <span>${escapeHtml(tip.prediccion || tip.tipo_apuesta || 'Lectura pendiente')}</span>
      <b>${numericValue(tip.confianza)}%</b>
    </article>
  `;
}

function renderCalendar() {
  const container = $('calendar-results');
  if (!container) return;

  let matches = [...appState.matches];
  if (appState.calendarFilter === 'future') matches = matches.filter((match) => !isFinalMatch(match));
  if (appState.calendarFilter === 'favorites') matches = matches.filter((match) => appState.favorites.some((favorite) => matchContainsTeam(match, favorite)));
  if (appState.calendarTeam) matches = matches.filter((match) => matchContainsTeam(match, appState.calendarTeam));

  if (!matches.length) {
    container.innerHTML = '<div class="empty-state">No hay partidos que coincidan con estos filtros.</div>';
    return;
  }

  const groups = new Map();
  matches.forEach((match) => {
    const jornada = numericValue(match.jornada, 0);
    if (!groups.has(jornada)) groups.set(jornada, []);
    groups.get(jornada).push(match);
  });

  container.innerHTML = [...groups.entries()].sort((first, second) => first[0] - second[0]).map(([jornada, jornadaMatches]) => `
    <section class="calendar-group">
      <div class="group-heading"><span>Jornada ${jornada || '—'}</span><small>${jornadaMatches.length} partidos</small></div>
      <div class="match-list">${jornadaMatches.map((match) => renderMatchCard(match, true)).join('')}</div>
    </section>
  `).join('');
}

function renderTips() {
  const container = $('tips-container');
  if (!container) return;
  const filter = $('tips-filter')?.value || 'all';
  const latestJornada = getTipsJornada();
  const latestTips = appState.tips
    .filter((tip) => numericValue(tip.jornada) === latestJornada)
    .filter((tip) => filter === 'all' || getCategoryKey(tip.categoria) === filter);

  if (!latestTips.length) {
    container.innerHTML = '<div class="empty-state">No hay tips para esta categoría.</div>';
  } else {
    container.innerHTML = latestTips.map((tip) => renderTipCard(tip)).join('');
  }

  renderHistory();
}

function renderTipCard(tip) {
  const meta = categoryMeta[getCategoryKey(tip.categoria)] || categoryMeta.base;
  const confidence = Math.min(100, Math.max(0, numericValue(tip.confianza)));
  return `
    <article class="tip-card ${meta.className}">
      <div class="tip-card-top"><span class="category-label"><i class="category-dot ${meta.dot}"></i>${meta.label}</span><span>J${escapeHtml(tip.jornada ?? '—')}</span></div>
      <h3>${escapeHtml(tip.local)} <span>vs</span> ${escapeHtml(tip.visitante)}</h3>
      <div class="tip-prediction"><span>${escapeHtml(tip.tipo_apuesta || 'Predicción')}</span><strong>${escapeHtml(tip.prediccion || 'Pendiente')}</strong></div>
      <div class="confidence-row"><span>Confianza estimada</span><strong>${confidence}%</strong></div>
      <div class="confidence-bar"><span style="width:${confidence}%"></span></div>
      <details class="tip-reason"><summary>¿Por qué?</summary><p>${escapeHtml(tip.razonamiento || 'Sin razonamiento registrado.')}</p></details>
    </article>
  `;
}

function calculateHistoryStats(rows) {
  const settledRows = safeArray(rows).filter((row) => ['acertado', 'fallado'].includes(String(row.resultado || '').toLowerCase()));
  const hits = settledRows.filter((row) => String(row.resultado).toLowerCase() === 'acertado').length;
  return {
    total: settledRows.length,
    hits,
    accuracy: settledRows.length ? Math.round((hits / settledRows.length) * 100) : 0
  };
}

function renderHistory() {
  const metricsContainer = $('tips-history-metrics');
  const listContainer = $('tips-history-container');
  if (!metricsContainer || !listContainer) return;

  const rows = appState.history;
  const overall = calculateHistoryStats(rows);
  const categoryStats = Object.entries(categoryMeta).map(([category, meta]) => {
    const stats = calculateHistoryStats(rows.filter((row) => getCategoryKey(row.categoria) === category));
    return `<article class="history-metric ${meta.className}"><span class="category-label"><i class="category-dot ${meta.dot}"></i>${meta.label}</span><strong>${stats.accuracy}%</strong><small>${stats.hits}/${stats.total} comprobados</small></article>`;
  }).join('');

  metricsContainer.innerHTML = `
    <article class="history-metric history-overall"><span>Total comprobado</span><strong>${overall.accuracy}%</strong><small>${overall.hits}/${overall.total} aciertos</small></article>
    ${categoryStats}
  `;

  const historyRows = rows
    .sort((first, second) => numericValue(second.jornada) - numericValue(first.jornada))
    .slice(0, 60);

  if (!historyRows.length) {
    listContainer.innerHTML = '<div class="empty-state">Todavía no hay registros en el historial.</div>';
    return;
  }

  const notice = appState.historySource === 'fallback'
    ? '<div class="info-state">El historial se calcula con los marcadores de Supabase. Ejecuta el SQL incluido solo si quieres guardar resultados manuales.</div>'
    : '';

  listContainer.innerHTML = notice + historyRows.map((row) => {
    const result = String(row.resultado || 'pendiente').toLowerCase();
    const resultLabel = result === 'acertado' ? 'ACERTADO' : result === 'fallado' ? 'FALLADO' : 'PENDIENTE';
    return `
      <article class="history-row">
        <div><span class="history-jornada">J${escapeHtml(row.jornada ?? '—')}</span><strong>${escapeHtml(row.local)} vs ${escapeHtml(row.visitante)}</strong><small>${escapeHtml(row.prediccion || 'Predicción')} · ${escapeHtml(row.categoria || 'sin categoría')}</small></div>
        <span class="result-badge result-${result}">${resultLabel}</span>
      </article>
    `;
  }).join('');
}

function renderStandings() {
  const container = $('standings-container');
  if (!container) return;

  if (!appState.standings.length) {
    container.innerHTML = '<div class="empty-state">No se pudo cargar la tabla de posiciones.</div>';
    return;
  }

  container.innerHTML = `
    <div class="card-heading standings-heading"><div><span class="eyebrow">CLASIFICACIÓN</span><h2>Tabla de posiciones</h2></div><span class="table-note">Top 8 / zona de liguilla</span></div>
    <div class="table-scroll"><table class="standings-table"><thead><tr><th>#</th><th>Club</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th><th>Forma</th></tr></thead><tbody>
      ${appState.standings.map((row, index) => `
        <tr class="${index < 8 ? 'playoff-row' : ''}">
          <td><span class="position-number">${index + 1}</span></td>
          <td><div class="club-cell"><span class="team-mark ${index % 2 ? 'red-mark' : 'green-mark'}"></span><strong>${escapeHtml(row.club || row.nombre)}</strong></div></td>
          <td>${numericValue(row.pj)}</td><td>${numericValue(row.g)}</td><td>${numericValue(row.e_)}</td><td>${numericValue(row.p_)}</td><td>${numericValue(row.gf)}</td><td>${numericValue(row.gc)}</td><td>${numericValue(row.dg)}</td><td><strong class="points-cell">${numericValue(row.pts)}</strong></td>
          <td><div class="form-cell">${renderFormDots(row.club || row.nombre)}</div></td>
        </tr>
      `).join('')}
    </tbody></table></div>
  `;
}

function toggleFavorite(abbreviation) {
  if (!abbreviation) return;
  if (appState.favorites.includes(abbreviation)) {
    appState.favorites = appState.favorites.filter((item) => item !== abbreviation);
  } else {
    appState.favorites = [...appState.favorites, abbreviation];
  }
  localStorage.setItem('lma-favorite-teams', JSON.stringify(appState.favorites));
  renderFavorites();
  renderHome();
  renderCalendar();
}

function renderFavoriteChips(containerId) {
  const container = $(containerId);
  if (!container) return;
  const favoriteTeams = appState.favorites.map(getTeamByAbbreviation).filter(Boolean);
  container.innerHTML = favoriteTeams.length
    ? favoriteTeams.map((team) => `<button class="favorite-chip" type="button" data-action="set-view" data-view="calendario">${escapeHtml(team.nombre)}<span>›</span></button>`).join('')
    : '<span class="empty-chip">Elige equipos desde la sección Equipos.</span>';
}

function renderFavorites() {
  const selector = $('favorite-team-selector');
  const list = $('favorite-team-list');
  if (!selector || !list) return;

  selector.innerHTML = appState.teams.map((team) => `
    <button class="team-choice ${appState.favorites.includes(team.abreviatura) ? 'selected' : ''}" type="button" data-action="toggle-favorite" data-team="${escapeHtml(team.abreviatura)}">
      <span class="team-mark ${appState.favorites.includes(team.abreviatura) ? 'green-mark' : 'gray-mark'}"></span>${escapeHtml(team.nombre)}<span class="choice-star">★</span>
    </button>
  `).join('');

  const favoriteTeams = appState.favorites.map(getTeamByAbbreviation).filter(Boolean);
  list.innerHTML = favoriteTeams.length
    ? favoriteTeams.map((team) => `<div class="favorite-row"><span><span class="team-mark green-mark"></span>${escapeHtml(team.nombre)}</span><button type="button" class="remove-btn" data-action="toggle-favorite" data-team="${escapeHtml(team.abreviatura)}">Quitar</button></div>`).join('')
    : '<div class="empty-state">Aún no sigues ningún equipo.</div>';
}

function renderComparison() {
  const container = $('comparison-results');
  if (!container) return;
  const teamA = getTeamByAbbreviation(appState.compareA);
  const teamB = getTeamByAbbreviation(appState.compareB);
  if (!teamA || !teamB) {
    container.innerHTML = '<div class="empty-state">Selecciona dos equipos para comparar.</div>';
    return;
  }

  const statsA = appState.standings.find((row) => row.abreviatura === teamA.abreviatura);
  const statsB = appState.standings.find((row) => row.abreviatura === teamB.abreviatura);
  const h2h = getHeadToHead(teamA.nombre, teamB.nombre).slice(0, 10);

  container.innerHTML = `
    <div class="comparison-columns">
      ${renderComparisonTeam(teamA, statsA)}
      <div class="comparison-middle"><span>FORMA</span><div class="form-versus"><div>${renderFormDots(teamA.nombre)}</div><b>vs</b><div>${renderFormDots(teamB.nombre)}</div></div></div>
      ${renderComparisonTeam(teamB, statsB)}
    </div>
    <div class="h2h-section"><div class="section-inline-heading"><h3>Enfrentamientos disponibles</h3><span>${h2h.length} partidos</span></div>${renderHeadToHeadTable(h2h, teamA.nombre, teamB.nombre)}</div>
  `;
}

function renderComparisonTeam(team, stats) {
  const palmares = appState.palmares.find((item) => item.abreviatura === team.abreviatura);
  const trophies = palmares ? numericValue(palmares.liga_mx) + numericValue(palmares.copa_mx) + numericValue(palmares.concacaf) : 0;
  return `
    <div class="comparison-team"><div class="comparison-team-title"><span class="team-crest">${escapeHtml(team.abreviatura.slice(0, 3))}</span><h3>${escapeHtml(team.nombre)}</h3></div>
      <div class="comparison-stat-grid"><div><span>Posición</span><strong>${stats ? appState.standings.indexOf(stats) + 1 : '—'}</strong></div><div><span>Puntos</span><strong>${stats ? numericValue(stats.pts) : '—'}</strong></div><div><span>DG</span><strong>${stats ? numericValue(stats.dg) : '—'}</strong></div><div><span>Títulos registrados</span><strong>${trophies}</strong></div></div>
    </div>
  `;
}

function getHeadToHead(firstTeam, secondTeam) {
  const first = normalizeText(firstTeam);
  const second = normalizeText(secondTeam);
  return appState.matches
    .filter((match) => {
      const local = normalizeText(match.local);
      const visitor = normalizeText(match.visitante);
      return (local === first && visitor === second) || (local === second && visitor === first);
    })
    .sort((firstMatch, secondMatch) => new Date(secondMatch.fecha_hora_mx || 0) - new Date(firstMatch.fecha_hora_mx || 0));
}

function renderHeadToHeadTable(matches, firstTeam, secondTeam) {
  if (!matches.length) return '<div class="empty-state">Todavía no hay enfrentamientos entre estos equipos en los datos cargados.</div>';
  return `<div class="h2h-list">${matches.map((match) => `<div class="h2h-row"><span>${escapeHtml(formatShortDate(match.fecha_hora_mx))}</span><strong>${escapeHtml(match.local)} ${getScoreLabel(match)} ${escapeHtml(match.visitante)}</strong><span class="h2h-result">${getMatchOutcome(match) || '—'}</span></div>`).join('')}</div>`;
}

function renderStreaks() {
  const container = $('active-streaks');
  if (!container) return;
  const streaks = appState.teams.map((team) => {
    const matches = getFinishedMatchesForTeam(team.nombre);
    let unbeaten = 0;
    let scored = 0;
    for (const match of matches) {
      const result = getTeamResult(match, team.nombre);
      if (result === 'P') break;
      unbeaten += 1;
    }
    for (const match of matches) {
      const isLocal = normalizeText(match.local) === normalizeText(team.nombre);
      const goalsFor = isLocal ? numericValue(match.goles_local) : numericValue(match.goles_visitante);
      if (goalsFor === 0) break;
      scored += 1;
    }
    return { team, unbeaten, scored, form: getTeamForm(team.nombre) };
  }).sort((first, second) => second.unbeaten - first.unbeaten || second.scored - first.scored).slice(0, 8);

  container.innerHTML = streaks.length ? streaks.map((item) => `
    <article class="streak-card"><div class="streak-title"><span class="team-mark green-mark"></span><strong>${escapeHtml(item.team.nombre)}</strong><div class="form-cell">${renderFormDots(item.team.nombre)}</div></div><div class="streak-values"><div><strong>${item.unbeaten}</strong><span>sin perder</span></div><div><strong>${item.scored}</strong><span>anotando</span></div></div></article>
  `).join('') : '<div class="empty-state">Aún no hay suficientes partidos finalizados.</div>';
}

function renderPalmares(abbreviation) {
  const container = $('palmares-results');
  if (!container) return;
  if (!abbreviation) {
    container.innerHTML = '<div class="palmares-placeholder">Selecciona un equipo para consultar sus títulos.</div>';
    return;
  }
  const data = appState.palmares.find((item) => item.abreviatura === abbreviation);
  if (!data) {
    container.innerHTML = '<div class="empty-state">No hay palmarés registrado para este equipo.</div>';
    return;
  }
  const items = [
    ['Liga MX', data.liga_mx],
    ['Copa MX', data.copa_mx],
    ['Concacaf', data.concacaf],
    ['Leagues Cup', data.leagues_cup],
    ['Interamericana', data.interamericana],
    ['Campeones Cup', data.campeones_cup],
    ['Campeón de Campeones', data.campeon_campeones],
    ['Supercopa MX', data.supercopa_mx],
    ['Supercopa Liga MX', data.supercopa_liga_mx]
  ];
  const total = items.reduce((sum, item) => sum + numericValue(item[1]), 0);
  container.innerHTML = `<div class="palmares-total"><span>${escapeHtml(data.equipo_nombre || getTeamName(abbreviation))}</span><strong>${total} títulos registrados</strong></div><div class="palmares-mini-grid">${items.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${numericValue(value)}</strong></div>`).join('')}</div>`;
}

async function openTeamModal(abbreviation) {
  const modal = $('team-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  $('dt-container').innerHTML = '<div class="modal-loading">Cargando director técnico...</div>';
  $('roster-list-container').innerHTML = '<div class="modal-loading">Cargando plantilla...</div>';

  const [dtResponse, rosterResponse] = await Promise.all([
    supabaseClient.from('dt_por_equipo').select('*').eq('abreviatura', abbreviation).maybeSingle(),
    supabaseClient.from('jugadores_equipo').select('*').eq('abreviatura', abbreviation)
  ]);

  if (dtResponse.error || !dtResponse.data) {
    $('dt-container').innerHTML = '<div class="empty-state">No hay director técnico registrado.</div>';
  } else {
    const data = dtResponse.data;
    $('dt-container').innerHTML = `<div class="dt-card"><span class="eyebrow">DIRECTOR TÉCNICO</span><h2>${escapeHtml(data.dt_nombre)}</h2><p>${escapeHtml(data.nacionalidad || '')}${data.edad ? ` · ${numericValue(data.edad)} años` : ''}</p>${data.sistema_tactico ? `<strong>Sistema ${escapeHtml(data.sistema_tactico)}</strong>` : ''}<small>${escapeHtml(data.estilo_ofensivo || '')}</small></div>`;
  }

  if (rosterResponse.error || !rosterResponse.data?.length) {
    $('roster-list-container').innerHTML = '<div class="empty-state">No hay jugadores registrados.</div>';
    return;
  }

  const positionLabels = { POR: 'Porteros', DEF: 'Defensas', MED: 'Mediocampistas', DEL: 'Delanteros' };
  const players = safeArray(rosterResponse.data);
  $('roster-list-container').innerHTML = Object.entries(positionLabels).map(([position, label]) => {
    const positionPlayers = players.filter((player) => player.posicion === position);
    if (!positionPlayers.length) return '';
    return `<section class="roster-section"><h3>${label}</h3>${positionPlayers.map((player) => `<div class="player-card"><strong>${escapeHtml(player.numero ?? '—')}</strong><span>${escapeHtml(player.nombre)}</span><small>${escapeHtml(player.nacionalidad || '')}${player.edad ? ` · ${numericValue(player.edad)} años` : ''}</small></div>`).join('')}</section>`;
  }).join('');
}

function closeTeamModal() {
  $('team-modal')?.classList.add('hidden');
}

function getQuinielaMatches() {
  return getUpcomingMatches().slice(0, appState.quinielaSize);
}

function updateQuinielaPick(matchId, pick) {
  const current = appState.quinielaPicks[matchId] || ['1'];
  if (current.includes(pick)) {
    if (current.length > 1) appState.quinielaPicks[matchId] = current.filter((item) => item !== pick);
  } else {
    appState.quinielaPicks[matchId] = [...current, pick].slice(0, 3);
  }
  renderQuiniela();
}

function renderQuiniela() {
  const container = $('quiniela-matches');
  if (!container) return;
  const matches = getQuinielaMatches();
  const doubles = matches.filter((match) => (appState.quinielaPicks[match.id] || ['1']).length === 2).length;
  const triples = matches.filter((match) => (appState.quinielaPicks[match.id] || ['1']).length === 3).length;
  const combinations = matches.reduce((total, match) => total * (appState.quinielaPicks[match.id] || ['1']).length, 1);
  if ($('quiniela-doubles')) $('quiniela-doubles').textContent = doubles;
  if ($('quiniela-triples')) $('quiniela-triples').textContent = triples;
  if ($('quiniela-combinations')) $('quiniela-combinations').textContent = new Intl.NumberFormat('es-MX').format(combinations);
  if ($('quiniela-total-cost')) $('quiniela-total-cost').textContent = 'Gratis';

  if (!matches.length) {
    container.innerHTML = '<div class="empty-state">No hay partidos próximos disponibles para armar una quiniela.</div>';
    return;
  }

  const availabilityNote = matches.length < appState.quinielaSize ? `<div class="info-state">Solo hay ${matches.length} partidos próximos cargados; la quiniela se ampliará cuando agregues más fechas.</div>` : '';
  container.innerHTML = availabilityNote + matches.map((match, index) => {
    const picks = appState.quinielaPicks[match.id] || ['1'];
    return `<article class="quiniela-row"><span class="quiniela-number">${index + 1}</span><div class="quiniela-match"><strong>${escapeHtml(match.local)}</strong><span>vs</span><strong>${escapeHtml(match.visitante)}</strong><small>${escapeHtml(formatDate(match.fecha_hora_mx))}</small></div><div class="quiniela-picks">${['1', 'X', '2'].map((pick) => `<button class="pick-btn ${picks.includes(pick) ? 'selected' : ''}" type="button" data-action="quiniela-pick" data-match="${escapeHtml(match.id)}" data-pick="${pick}">${pick}<small>${pick === '1' ? 'Local' : pick === 'X' ? 'Empate' : 'Visita'}</small></button>`).join('')}</div></article>`;
  }).join('');
}

function getSimulatorMatches() {
  return getUpcomingMatches().slice(0, 21);
}

function updateSimulatorPick(matchId, pick) {
  if (pick) appState.simulatorPicks[matchId] = pick;
  else delete appState.simulatorPicks[matchId];
  renderSimulator();
}

function calculateSimulatedStandings() {
  const table = appState.standings.map((row) => ({
    abbreviation: row.abreviatura,
    club: row.club || row.nombre,
    pj: numericValue(row.pj),
    g: numericValue(row.g),
    e: numericValue(row.e_),
    p: numericValue(row.p_),
    gf: numericValue(row.gf),
    gc: numericValue(row.gc),
    dg: numericValue(row.dg),
    pts: numericValue(row.pts),
    currentPosition: appState.standings.indexOf(row) + 1
  }));
  const byAbbreviation = new Map(table.map((row) => [row.abbreviation, row]));

  getSimulatorMatches().forEach((match) => {
    const outcome = appState.simulatorPicks[match.id];
    if (!outcome) return;
    const local = byAbbreviation.get(getTeamAbbreviation(match.local));
    const visitor = byAbbreviation.get(getTeamAbbreviation(match.visitante));
    if (!local || !visitor) return;
    local.pj += 1;
    visitor.pj += 1;
    if (outcome === '1') {
      local.g += 1;
      visitor.p += 1;
      local.pts += 3;
    } else if (outcome === 'X') {
      local.e += 1;
      visitor.e += 1;
      local.pts += 1;
      visitor.pts += 1;
    } else {
      local.p += 1;
      visitor.g += 1;
      visitor.pts += 3;
    }
  });

  table.forEach((row) => { row.dg = row.gf - row.gc; });
  return table.sort((first, second) => second.pts - first.pts || second.dg - first.dg || second.gf - first.gf);
}

function renderSimulator() {
  const matchesContainer = $('simulator-matches');
  const resultsContainer = $('simulator-results');
  if (!matchesContainer || !resultsContainer) return;
  const matches = getSimulatorMatches();
  const currentCutoff = appState.standings[7]?.pts ?? appState.standings[appState.standings.length - 1]?.pts ?? 0;
  if ($('simulator-cutoff')) $('simulator-cutoff').textContent = `${numericValue(currentCutoff)} puntos`;

  matchesContainer.innerHTML = matches.length ? matches.map((match) => `<div class="sim-match-row"><div><strong>${escapeHtml(match.local)}</strong><span>vs</span><strong>${escapeHtml(match.visitante)}</strong><small>${escapeHtml(formatDate(match.fecha_hora_mx))}</small></div><select class="sim-select" data-simulator-match="${escapeHtml(match.id)}"><option value="">Sin cambio</option><option value="1">Gana local</option><option value="X">Empate</option><option value="2">Gana visitante</option></select></div>`).join('') : '<div class="empty-state">No hay partidos próximos para simular.</div>';
  matchesContainer.querySelectorAll('[data-simulator-match]').forEach((select) => {
    select.value = appState.simulatorPicks[select.dataset.simulatorMatch] || '';
    select.addEventListener('change', (event) => updateSimulatorPick(event.target.dataset.simulatorMatch, event.target.value));
  });

  const simulated = calculateSimulatedStandings();
  resultsContainer.innerHTML = simulated.length ? `<div class="simulator-result-heading"><span>Proyección con tus resultados</span><small>Las filas verdes quedan dentro del Top 8</small></div><div class="simulation-table">${simulated.map((row, index) => { const needed = Math.max(0, numericValue(currentCutoff) - row.pts + 1); return `<div class="simulation-row ${index < 8 ? 'inside-playoff' : ''}"><span class="simulation-position">${index + 1}</span><strong>${escapeHtml(row.club)}</strong><span>${row.pts} pts</span><span>${row.dg >= 0 ? '+' : ''}${row.dg} DG</span><span class="simulation-status">${index < 8 ? 'Dentro del Top 8' : `Necesita ${needed} pts`}</span></div>`; }).join('')}</div>` : '<div class="empty-state">La tabla simulada aparecerá cuando haya posiciones cargadas.</div>';
}

function registerPwa() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    appState.deferredInstallPrompt = event;
    $('install-app-btn')?.classList.remove('hidden');
  });
  window.addEventListener('appinstalled', () => {
    appState.deferredInstallPrompt = null;
    $('install-app-btn')?.classList.add('hidden');
  });
}

async function installPwa() {
  if (!appState.deferredInstallPrompt) return;
  appState.deferredInstallPrompt.prompt();
  await appState.deferredInstallPrompt.userChoice;
  appState.deferredInstallPrompt = null;
  $('install-app-btn')?.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', initializeApp);
