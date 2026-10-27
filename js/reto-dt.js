(() => {
  const storageKey = 'futbol-mx-analisis-reto-dt-v1';
  const maxSubstitutions = 3;
  const formations = [
    { id: '4-3-3', label: '4-3-3 ofensivo', required: 11 },
    { id: '4-4-2', label: '4-4-2 equilibrado', required: 11 },
    { id: '4-2-3-1', label: '4-2-3-1 control', required: 11 },
    { id: '5-4-1', label: '5-4-1 conservador', required: 11 },
    { id: '3-4-3', label: '3-4-3 presión', required: 11 },
    { id: '4-4-1', label: '4-4-1 con diez', required: 10 },
    { id: '5-3-1', label: '5-3-1 repliegue', required: 10 }
  ];
  const difficulties = {
    amateur: { label: 'Amateur', rival: 6, uncertainty: .08, qualityBonus: 9 },
    professional: { label: 'Profesional', rival: 12, uncertainty: .04, qualityBonus: 5 },
    legend: { label: 'Leyenda', rival: 18, uncertainty: 0, qualityBonus: 1 }
  };
  const scenarios = [
    { id: 'comeback', title: 'Remontada imposible', text: 'Minuto 75. Tu equipo pierde 2-0 y necesita encontrar una grieta sin regalar la espalda.', minute: 75, for: 0, against: 2, rounds: 4 },
    { id: 'protect', title: 'Defiende la ventaja', text: 'Minuto 80. Ganas 1-0, pero el rival domina la posesión y aprieta cada salida.', minute: 80, for: 1, against: 0, rounds: 3 },
    { id: 'red-card', title: 'Expulsión inesperada', text: 'Minuto 60. Una tarjeta roja te deja con diez jugadores y obliga a reorganizar el plan.', minute: 60, for: 1, against: 1, rounds: 4 },
    { id: 'final', title: 'Final de Liguilla', text: 'Minuto 85. El partido decisivo está empatado: proteger o arriesgar también es una decisión.', minute: 85, for: 1, against: 1, rounds: 3 },
    { id: 'injury', title: 'Lesión de tu estrella', text: 'Tu jugador ofensivo más importante queda fuera y debes encontrar otra solución.', minute: 55, for: 1, against: 1, rounds: 4 },
    { id: 'rival-change', title: 'El rival cambia de táctica', text: 'El adversario modifica su formación y comienza a dominar el mediocampo.', minute: 52, for: 0, against: 0, rounds: 4 },
    { id: 'last-chance', title: 'Última oportunidad', text: 'Minuto 90. El partido está empatado y tienes una última secuencia ofensiva.', minute: 90, for: 1, against: 1, rounds: 3 },
    { id: 'classic', title: 'El Clásico', text: 'La rivalidad eleva la presión: cada decisión tiene impacto en el ambiente y el partido.', minute: 68, for: 0, against: 0, rounds: 4 }
  ];
  const state = {
    screen: 'setup',
    difficulty: 'professional',
    scenarioId: 'comeback',
    teamAbbreviation: '',
    opponentAbbreviation: '',
    useIdeal: false,
    formation: '4-3-3',
    minute: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    roundIndex: 0,
    maxRounds: 4,
    offense: 55,
    defense: 55,
    midfield: 55,
    fatigue: 18,
    emotion: 58,
    risk: 30,
    rivalPressure: 55,
    rivalPlan: 'bloque medio',
    activePlayers: [],
    bench: [],
    unavailable: [],
    substitutionsUsed: 0,
    decisions: [],
    events: [],
    performance: 0,
    message: '',
    seed: 0,
    rngStep: 0,
    history: [],
    rows: []
  };

  const el = (id) => document.getElementById(id);
  const escapeValue = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const clamp = (value, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, Math.round(value)));

  function gameTeams() {
    return typeof appState !== 'undefined' && Array.isArray(appState.teams) ? appState.teams : [];
  }

  function teamName(abbreviation) {
    return gameTeams().find((team) => team.abreviatura === abbreviation)?.nombre || abbreviation || 'Equipo';
  }

  function defaultState() {
    return { ...state, activePlayers: [], bench: [], unavailable: [], decisions: [], events: [], history: [], rows: [] };
  }

  function saveState() {
    const saved = { ...state, rows: [] };
    localStorage.setItem(storageKey, JSON.stringify(saved));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      Object.assign(state, saved, { rows: [] });
      ['activePlayers', 'bench', 'unavailable', 'decisions', 'events', 'history'].forEach((key) => { if (!Array.isArray(state[key])) state[key] = []; });
    } catch (error) {
      localStorage.removeItem(storageKey);
    }
  }

  function hashSeed(value) {
    return Array.from(String(value)).reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 2166136261) >>> 0;
  }

  function nextRandom() {
    state.seed = (state.seed + 0x6D2B79F5) >>> 0;
    let result = state.seed;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    state.rngStep += 1;
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  }

  function scenario() {
    return scenarios.find((item) => item.id === state.scenarioId) || scenarios[0];
  }

  function difficulty() {
    return difficulties[state.difficulty] || difficulties.professional;
  }

  function formationById(id) {
    return formations.find((formation) => formation.id === id) || formations[0];
  }

  function positionLabel(value) {
    const position = normalize(value);
    if (position.includes('por') || position.includes('arqu')) return 'POR';
    if (position.includes('def')) return 'DEF';
    if (position.includes('med') || position.includes('medio')) return 'MED';
    if (position.includes('del') || position.includes('ata') || position.includes('ext')) return 'DEL';
    return 'DEF';
  }

  function rowId(row, index) {
    return String(row.id || `${row.abreviatura || 'club'}-${row.nombre || index}-${row.numero || index}`).replace(/\s+/g, '-');
  }

  function normalizePlayer(row, index) {
    return {
      id: rowId(row, index),
      name: row.nombre || `Jugador ${index + 1}`,
      position: positionLabel(row.posicion),
      rawPosition: row.posicion || 'Defensa',
      abbreviation: row.abreviatura || '',
      teamName: teamName(row.abreviatura),
      number: row.numero || '',
      fatigue: 0
    };
  }

  function allPlayers() {
    return state.rows.map(normalizePlayer);
  }

  function onceIdealIds() {
    try {
      const saved = JSON.parse(localStorage.getItem('futbol-mx-analisis-once-ideal-v1') || '{}');
      return Array.isArray(saved.selectedPlayers) ? saved.selectedPlayers : [];
    } catch (error) {
      return [];
    }
  }

  function idealPlayers() {
    const ids = onceIdealIds();
    const players = allPlayers();
    return ids.map((id) => players.find((player) => player.id === id)).filter(Boolean).slice(0, 11);
  }

  function rosterForTeam(abbreviation) {
    return allPlayers().filter((player) => player.abbreviation === abbreviation);
  }

  function activeCount() {
    return state.activePlayers.length;
  }

  function addEvent(text, type = 'info') {
    state.events = [{ minute: state.minute, text, type }, ...state.events].slice(0, 12);
  }

  function buildChoices() {
    const reduced = activeCount() < 11;
    const alternativeFormation = reduced ? '4-4-1' : (state.roundIndex % 2 ? '4-2-3-1' : '4-4-2');
    const actionLibrary = {
      protect: { id: 'protect', label: 'Proteger el resultado', text: 'Junta líneas y reduce el riesgo en los minutos finales.', quality: 8, delta: { defense: 9, offense: -6, fatigue: 2, risk: -8 }, narrative: 'El equipo protege los espacios interiores y obliga al rival a centrar desde lejos.' },
      possession: { id: 'possession', label: 'Buscar posesión y paciencia', text: 'Reduce pérdidas, pero consume tiempo y energía.', quality: 7, delta: { midfield: 8, offense: 2, fatigue: 3, risk: -3 }, narrative: 'El equipo enlaza pases y baja la velocidad del partido; aparecen espacios, aunque el reloj sigue avanzando.' },
      wings: { id: 'wings', label: 'Jugar por las bandas', text: 'Sube la profundidad y expone los laterales.', quality: 6, delta: { offense: 9, defense: -5, fatigue: 5, risk: 8 }, narrative: 'Los laterales encuentran metros, pero el equipo queda más expuesto a transiciones.' },
      center: { id: 'center', label: 'Atacar por el centro', text: 'Busca superioridad cerca del área rival.', quality: 6, delta: { offense: 7, midfield: 5, fatigue: 4, risk: 5 }, narrative: 'El mediocampo junta líneas y genera una recepción peligrosa entre centrales.' },
      counter: { id: 'counter', label: 'Apostar por contraataques', text: 'Ataca el espacio que deja el rival al adelantar líneas.', quality: 7, delta: { offense: 8, defense: 4, fatigue: 3, risk: 7 }, narrative: 'La transición encuentra al rival desordenado, aunque cada pérdida puede ser peligrosa.' },
      pressure: { id: 'pressure', label: 'Aumentar la presión', text: 'Intenta recuperar cerca del área rival.', quality: 6, delta: { offense: 5, midfield: 5, fatigue: 8, risk: 6 }, narrative: 'La presión obliga al rival a jugar largo, pero tus jugadores comienzan a acusar el cansancio.' },
      highLine: { id: 'high-line', label: 'Subir la línea defensiva', text: 'Acorta el campo y aumenta la posibilidad de recuperar arriba.', quality: 6, delta: { offense: 4, defense: -7, midfield: 4, fatigue: 5, risk: 9 }, narrative: 'La línea se adelanta: ganas metros, aunque una pelota a la espalda puede ser peligrosa.' },
      lowLine: { id: 'low-line', label: 'Bajar la línea defensiva', text: 'Protege la espalda de los centrales y cede terreno.', quality: 7, delta: { defense: 8, offense: -3, fatigue: -2, risk: -5 }, narrative: 'El bloque se repliega y protege el área, pero concede más iniciativa al rival.' },
      tempo: { id: 'tempo', label: 'Cambiar el ritmo', text: 'Alterna pausas y aceleraciones para desordenar al adversario.', quality: 7, delta: { offense: 5, midfield: 4, fatigue: 4, risk: 3 }, narrative: 'El equipo alterna pausas con aceleraciones y el rival pierde referencias de marca.' },
      setPiece: { id: 'set-piece', label: 'Preparar el balón parado', text: 'Busca una jugada ensayada sin desordenar todo el equipo.', quality: 8, delta: { offense: 6, midfield: 1, fatigue: 1, risk: 2 }, narrative: 'El cuerpo técnico prepara una variante de balón parado y mejora la ocupación del área.' }
    };
    const stateOfMatch = state.goalsFor > state.goalsAgainst ? ['protect', 'lowLine'] : state.goalsFor < state.goalsAgainst ? ['wings', 'highLine'] : ['possession', 'tempo'];
    const rotating = state.roundIndex % 3 === 0 ? ['center', 'pressure'] : state.roundIndex % 3 === 1 ? ['counter', 'setPiece'] : ['wings', 'tempo'];
    const formationChoice = { id: `formation:${alternativeFormation}`, label: `Cambiar a ${alternativeFormation}`, text: reduced ? 'Usa un sistema válido con un jugador menos.' : 'Ajusta la estructura para ocupar mejor los espacios.', quality: 7, delta: { midfield: 4, offense: 3, fatigue: 2, risk: 2 }, narrative: `El equipo adopta un ${alternativeFormation}. La ocupación de espacios cambia y el rival necesita reajustar sus marcas.` };
    const tacticalChoices = [...stateOfMatch, ...rotating].map((id) => actionLibrary[id]).filter((choice, index, list) => list.findIndex((item) => item.id === choice.id) === index);
    const hasSubstitution = state.bench.length && state.substitutionsUsed < maxSubstitutions;
    const choices = [formationChoice, ...tacticalChoices.slice(0, hasSubstitution ? 3 : 4)];
    if (state.bench.length && state.substitutionsUsed < maxSubstitutions) {
      const substitute = state.bench[0];
      choices.push({ id: `substitute:${substitute.id}`, label: `Dar entrada a ${substitute.name}`, text: `Cambio ${state.substitutionsUsed + 1}/${maxSubstitutions}. Sale el jugador con más fatiga.`, quality: 8, delta: { offense: substitute.position === 'DEL' ? 6 : 2, defense: substitute.position === 'DEF' ? 5 : 1, fatigue: -7, risk: 0 }, narrative: `Entra ${substitute.name} para refrescar el plan. El jugador sustituido ya no podrá participar en este partido.` });
    }
    return choices.filter((choice, index, list) => list.findIndex((item) => item.id === choice.id) === index).slice(0, 5);
  }

  function actionMatchesSituation(action) {
    const current = state.goalsFor - state.goalsAgainst;
    if (state.scenarioId === 'protect' && action.id === 'protect') return 10;
    if (state.scenarioId === 'comeback' && current < 0 && ['wings', 'center', 'counter'].some((id) => action.id.includes(id))) return 8;
    if (state.scenarioId === 'red-card' && activeCount() < 11 && action.id.startsWith('formation:')) return 9;
    if (state.scenarioId === 'injury' && action.id.startsWith('substitute:')) return 9;
    if (state.scenarioId === 'final' && state.minute >= 84 && action.id === 'possession') return 7;
    return 0;
  }

  function applyPlayerChange(incomingId) {
    const incomingIndex = state.bench.findIndex((player) => player.id === incomingId);
    if (incomingIndex < 0 || state.substitutionsUsed >= maxSubstitutions || !state.activePlayers.length) return null;
    const outgoingIndex = state.activePlayers.reduce((best, player, index, players) => player.fatigue > players[best].fatigue ? index : best, 0);
    const outgoing = state.activePlayers.splice(outgoingIndex, 1)[0];
    const incoming = state.bench.splice(incomingIndex, 1)[0];
    incoming.fatigue = 0;
    state.activePlayers.push(incoming);
    state.unavailable.push({ ...outgoing, reason: 'Sustituido' });
    state.substitutionsUsed += 1;
    return { incoming, outgoing };
  }

  function resolveAction(action) {
    const beforeScore = `${state.goalsFor}-${state.goalsAgainst}`;
    const situationBonus = actionMatchesSituation(action);
    if (action.id.startsWith('formation:')) {
      const nextFormation = action.id.split(':')[1];
      if (formationById(nextFormation).required > activeCount()) {
        state.message = 'Esa formación requiere once jugadores activos y no se puede usar con tu plantilla actual.';
        return;
      }
      state.formation = nextFormation;
    }
    let narrative = action.narrative;
    if (action.id.startsWith('substitute:')) {
      const change = applyPlayerChange(action.id.split(':')[1]);
      if (!change) return;
      narrative = `${action.narrative} Sale ${change.outgoing.name} y entra ${change.incoming.name}.`;
    }
    Object.entries(action.delta || {}).forEach(([key, amount]) => {
      if (Object.prototype.hasOwnProperty.call(state, key)) state[key] = clamp(state[key] + amount, key === 'fatigue' ? 0 : 0, 100);
    });
    state.activePlayers.forEach((player) => { player.fatigue = clamp(player.fatigue + 2 + Math.round((state.fatigue - 45) / 22)); });
    const rivalAdjustment = state.goalsFor <= state.goalsAgainst ? difficulty().rival + 2 : -3;
    state.rivalPressure = clamp(state.rivalPressure + rivalAdjustment + (action.id === 'protect' ? 7 : 0));
    state.rivalPlan = state.rivalPressure > 70 ? 'bloque alto y presión' : state.rivalPressure < 38 ? 'bloque bajo' : 'bloque medio';
    const attackPower = state.offense * .48 + state.midfield * .24 + state.emotion * .1 + state.risk * .18;
    const resistance = 53 + difficulty().rival * .8 + state.rivalPressure * .16;
    const goalChance = Math.max(.05, Math.min(.72, .16 + (attackPower - resistance) / 100 + situationBonus / 100 - difficulty().uncertainty));
    const defensiveExposure = Math.max(.03, Math.min(.45, .08 + state.risk / 220 + (100 - state.defense) / 350 + (state.rivalPressure - 50) / 500));
    const draw = nextRandom();
    let moment = narrative;
    if (draw < goalChance && state.minute < 94) {
      state.goalsFor += 1;
      state.emotion = clamp(state.emotion + 8);
      moment += ' ¡La decisión produce una ocasión clara y llega el gol!';
    } else if (draw > 1 - defensiveExposure && state.minute < 94) {
      state.goalsAgainst += 1;
      state.emotion = clamp(state.emotion - 8);
      moment += ' El rival encuentra una transición y castiga el espacio concedido.';
    } else {
      state.emotion = clamp(state.emotion + (state.goalsFor >= state.goalsAgainst ? 2 : -1));
      moment += ' La jugada no termina en gol, pero cambia el ritmo del encuentro.';
    }
    const quality = clamp(54 + action.quality + situationBonus + difficulty().qualityBonus - Math.round(state.fatigue / 18) + Math.round(nextRandom() * 8 - 4), 0, 100);
    state.performance += quality;
    state.decisions.push({ minute: state.minute, label: action.label, quality, beforeScore, afterScore: `${state.goalsFor}-${state.goalsAgainst}`, formation: state.formation });
    addEvent(moment, state.goalsFor > Number(beforeScore.split('-')[0]) ? 'goal' : 'info');
    state.message = moment;
    const minuteAdvance = state.minute >= 88 ? 2 : 3 + Math.floor(nextRandom() * 4);
    state.minute = Math.min(94, state.minute + minuteAdvance);
    state.roundIndex += 1;
    if (state.roundIndex >= state.maxRounds || state.minute >= 94) finishChallenge();
    else saveState();
  }

  function finishChallenge() {
    const goalDifference = state.goalsFor - state.goalsAgainst;
    const resultBonus = goalDifference > 0 ? 18 : goalDifference === 0 ? 10 : 4;
    state.performance = clamp((state.performance / Math.max(1, state.decisions.length)) + resultBonus - Math.round(state.risk / 12) + Math.round(state.emotion / 18));
    state.screen = 'result';
    state.history = [{ id: `${Date.now()}-${state.seed}`, scenario: scenario().title, team: teamName(state.teamAbbreviation), opponent: teamName(state.opponentAbbreviation), score: `${state.goalsFor}-${state.goalsAgainst}`, performance: state.performance, difficulty: difficulty().label, date: new Date().toISOString(), decisions: state.decisions.length }, ...state.history].slice(0, 30);
    state.message = `Partido terminado: ${state.goalsFor}-${state.goalsAgainst}.`;
    saveState();
  }

  function startChallenge() {
    const team = el('dt-team')?.value || gameTeams()[0]?.abreviatura;
    const opponent = el('dt-opponent')?.value || gameTeams().find((item) => item.abreviatura !== team)?.abreviatura;
    const scenarioId = el('dt-scenario')?.value || scenarios[0].id;
    const formation = el('dt-formation')?.value || '4-3-3';
    const difficultyId = el('dt-difficulty')?.value || 'professional';
    const useIdeal = Boolean(el('dt-use-ideal')?.checked);
    const baseRoster = useIdeal ? idealPlayers() : rosterForTeam(team);
    if (!team || !opponent || baseRoster.length < 11) {
      state.message = useIdeal && idealPlayers().length < 11 ? 'Tu Once Ideal necesita 11 jugadores guardados para iniciar una simulación fantástica.' : 'El equipo seleccionado todavía no tiene 11 jugadores cargados en Supabase.';
      renderDtChallenge(el('game-container'));
      return;
    }
    const selectedScenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0];
    state.screen = 'playing';
    state.difficulty = difficultyId;
    state.scenarioId = selectedScenario.id;
    state.teamAbbreviation = team;
    state.opponentAbbreviation = opponent;
    state.useIdeal = useIdeal;
    state.seed = hashSeed(`${Date.now()}-${team}-${opponent}-${scenarioId}-${difficultyId}`);
    state.rngStep = 0;
    state.formation = formationById(formation).required <= 11 ? formation : '4-3-3';
    state.minute = selectedScenario.minute;
    state.goalsFor = selectedScenario.for;
    state.goalsAgainst = selectedScenario.against;
    state.roundIndex = 0;
    state.maxRounds = selectedScenario.rounds;
    state.offense = 55 + Math.round(nextRandom() * 8 - 4);
    state.defense = 55 + Math.round(nextRandom() * 8 - 4);
    state.midfield = 55 + Math.round(nextRandom() * 8 - 4);
    state.fatigue = 18 + Math.round(nextRandom() * 10);
    state.emotion = 58;
    state.risk = 30;
    state.rivalPressure = selectedScenario.id === 'protect' ? 76 : 55;
    state.rivalPlan = selectedScenario.id === 'rival-change' ? 'superioridad interior' : 'bloque medio';
    state.substitutionsUsed = 0;
    state.decisions = [];
    state.events = [];
    state.performance = 0;
    state.message = `${selectedScenario.text} Esta es una simulación ficticia: las variables son del juego, no un pronóstico oficial.`;
    state.activePlayers = baseRoster.slice(0, 11).map((player) => ({ ...player, fatigue: Math.round(nextRandom() * 25) }));
    state.bench = baseRoster.slice(11).map((player) => ({ ...player, fatigue: 0 }));
    state.unavailable = [];
    if (selectedScenario.id === 'red-card' || selectedScenario.id === 'injury') {
      const outgoing = state.activePlayers.splice(state.activePlayers.length - 1, 1)[0];
      if (outgoing) {
        state.unavailable.push({ ...outgoing, reason: selectedScenario.id === 'red-card' ? 'Expulsado' : 'Lesionado' });
        state.formation = '4-4-1';
        state.message += selectedScenario.id === 'red-card' ? ` ${outgoing.name} fue expulsado: solo tienes diez jugadores activos.` : ` ${outgoing.name} se lesionó: ya no puede participar.`;
      }
    }
    state.targetId = `${selectedScenario.id}-${state.seed}`;
    addEvent(state.message);
    saveState();
    renderDtChallenge(el('game-container'));
  }

  function resetChallenge() {
    const history = state.history || [];
    Object.assign(state, defaultState(), { history, screen: 'setup', message: '' });
    saveState();
    renderDtChallenge(el('game-container'));
  }

  function dtAction(actionId) {
    if (!actionId || state.screen !== 'playing') return;
    const action = buildChoices().find((choice) => choice.id === actionId);
    if (!action) return;
    resolveAction(action);
    renderDtChallenge(el('game-container'));
  }

  function renderTeamOptions() {
    const teams = gameTeams();
    const selectedTeam = state.teamAbbreviation || teams[0]?.abreviatura || '';
    const selectedOpponent = state.opponentAbbreviation || teams.find((team) => team.abreviatura !== selectedTeam)?.abreviatura || '';
    return { teams, selectedTeam, selectedOpponent };
  }

  function renderSetup(container) {
    const { teams, selectedTeam, selectedOpponent } = renderTeamOptions();
    const idealCount = idealPlayers().length;
    const resume = state.screen === 'playing' && state.targetId !== '';
    container.innerHTML = `<article class="dt-shell surface-card"><div class="dt-heading"><div><span class="eyebrow">SIMULACIÓN TÁCTICA</span><h2>Reto DT: tú decides el partido</h2><p>Asume el banquillo durante una situación difícil. Tus decisiones cambian el riesgo, el cansancio, la respuesta rival y el resultado.</p></div><div class="dt-whistle">⚽</div></div><div class="dt-disclaimer">Todos los partidos son ficticios y están identificados como simulaciones. Las variables no son pronósticos oficiales.</div><div class="dt-setup-grid"><label>Equipo<select id="dt-team">${teams.map((team) => `<option value="${escapeValue(team.abreviatura)}" ${team.abreviatura === selectedTeam ? 'selected' : ''}>${escapeValue(team.nombre)}</option>`).join('')}</select></label><label>Rival<select id="dt-opponent">${teams.filter((team) => team.abreviatura !== selectedTeam).map((team) => `<option value="${escapeValue(team.abreviatura)}" ${team.abreviatura === selectedOpponent ? 'selected' : ''}>${escapeValue(team.nombre)}</option>`).join('')}</select></label><label>Escenario<select id="dt-scenario">${scenarios.map((item) => `<option value="${item.id}" ${item.id === state.scenarioId ? 'selected' : ''}>${escapeValue(item.title)}</option>`).join('')}</select></label><label>Dificultad<select id="dt-difficulty">${Object.entries(difficulties).map(([id, item]) => `<option value="${id}" ${id === state.difficulty ? 'selected' : ''}>${item.label}</option>`).join('')}</select></label><label>Formación inicial<select id="dt-formation">${formations.filter((formation) => formation.required === 11).map((formation) => `<option value="${formation.id}" ${formation.id === state.formation ? 'selected' : ''}>${escapeValue(formation.label)}</option>`).join('')}</select></label><label class="dt-ideal-option"><span>Plantilla</span><span><input id="dt-use-ideal" type="checkbox" ${state.useIdeal ? 'checked' : ''} ${idealCount >= 11 ? '' : 'disabled'}> Usar Mi Once Ideal (${idealCount}/11)</span><small>${idealCount >= 11 ? 'Se marcará como simulación fantástica.' : 'Guarda 11 jugadores en Mi Once Ideal para habilitarla.'}</small></label></div><div class="dt-scenario-preview"><strong>${escapeValue((scenarios.find((item) => item.id === state.scenarioId) || scenarios[0]).title)}</strong><span>${escapeValue((scenarios.find((item) => item.id === state.scenarioId) || scenarios[0]).text)}</span><small>Rondas de decisión: ${(scenarios.find((item) => item.id === state.scenarioId) || scenarios[0]).rounds} · Jugadores disponibles: ${state.rows.length ? 'cargados desde Supabase' : 'cargando...'}</small></div><div class="dt-actions"><button class="primary-btn" type="button" data-dt-action="start" ${teams.length ? '' : 'disabled'}>${resume ? 'Comenzar nueva simulación' : 'Comenzar simulación'}</button>${resume ? '<button class="secondary-btn" type="button" data-dt-action="resume">Continuar partida pausada</button>' : ''}<button class="text-btn" type="button" data-game-action="reset-game">Volver a juegos</button></div>${state.message && state.screen === 'setup' ? `<div class="dt-feedback">${escapeValue(state.message)}</div>` : ''}${renderDtHistory()}</article>`;
  }

  function pitchPlayerPosition(index, total) {
    const columns = [50, 25, 50, 75, 18, 38, 62, 82, 30, 50, 70];
    const rows = [88, 72, 72, 72, 53, 53, 53, 53, 30, 30, 30];
    return { x: columns[index % columns.length], y: rows[index % rows.length] - Math.floor(index / 11) * 4 };
  }

  function renderPitch() {
    const players = state.activePlayers.slice(0, 11);
    return `<div class="dt-pitch"><div class="dt-pitch-center"></div><div class="dt-pitch-box"></div>${players.map((player, index) => { const position = pitchPlayerPosition(index, players.length); return `<div class="dt-pitch-player dt-position-${player.position.toLowerCase()}" style="--x:${position.x}%;--y:${position.y}%"><span>${escapeValue(player.name.split(' ').slice(-1)[0])}</span><small>${escapeValue(player.position)}</small></div>`; }).join('')}</div>`;
  }

  function renderMetrics() {
    const metrics = [['Ataque', state.offense], ['Defensa', state.defense], ['Mediocampo', state.midfield], ['Cansancio', state.fatigue], ['Ánimo', state.emotion], ['Riesgo', state.risk]];
    return `<div class="dt-metrics">${metrics.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong><i class="dt-meter-${normalize(label)}" style="width:${value}%"></i></div>`).join('')}</div>`;
  }

  function renderChoices() {
    const choices = buildChoices();
    return `<div class="dt-choice-grid">${choices.map((choice) => `<button class="dt-choice" type="button" data-dt-action="choice" data-dt-choice="${escapeValue(choice.id)}"><strong>${escapeValue(choice.label)}</strong><small>${escapeValue(choice.text)}</small></button>`).join('')}</div>`;
  }

  function renderPlaying(container) {
    const currentScenario = scenario();
    const choices = buildChoices();
    const score = `${state.goalsFor}-${state.goalsAgainst}`;
    const recentEvents = state.events.slice(0, 4);
    container.innerHTML = `<article class="dt-shell surface-card"><div class="dt-match-header"><div><span class="eyebrow">SIMULACIÓN FICTICIA · ${escapeValue(difficulty().label)}</span><h2>${escapeValue(currentScenario.title)}</h2><span>${escapeValue(teamName(state.teamAbbreviation))} vs ${escapeValue(teamName(state.opponentAbbreviation))}${state.useIdeal ? ' · Once Ideal fantástico' : ''}</span></div><div class="dt-scoreboard"><small>MINUTO</small><strong>${state.minute}'</strong><b>${score}</b><small>${escapeValue(teamName(state.teamAbbreviation))} · ${escapeValue(teamName(state.opponentAbbreviation))}</small></div></div><div class="dt-match-context"><span>Ronda ${state.roundIndex + 1}/${state.maxRounds}</span><span>Rival: ${escapeValue(state.rivalPlan)}</span><span>Cambios: ${state.substitutionsUsed}/${maxSubstitutions}</span><span>Activos: ${activeCount()}/11</span></div><div class="dt-game-grid"><section>${renderPitch()}${renderMetrics()}<div class="dt-players-status"><strong>Disponibilidad</strong><span>${state.bench.length} en banca · ${state.unavailable.length} fuera del partido</span></div></section><section class="dt-decision-panel"><span class="eyebrow">DECISIÓN ${state.roundIndex + 1}</span><h3>${escapeValue(currentScenario.text)}</h3><p class="dt-narration">${escapeValue(state.message)}</p><div class="dt-choice-note">Elige una orden. El rival reacciona y el motor resolverá una consecuencia controlada.</div>${renderChoices()}</section></div><div class="dt-timeline">${recentEvents.map((event) => `<div class="dt-event ${event.type}"><strong>${event.minute}'</strong><span>${escapeValue(event.text)}</span></div>`).join('')}</div><div class="dt-bottom-actions"><button class="text-btn" type="button" data-dt-action="pause">Pausar y volver</button><span>Estado guardado en este dispositivo.</span></div></article>`;
  }

  function recommendations() {
    const recommendationsList = [];
    if (state.risk > 65) recommendationsList.push('Equilibra el riesgo con posesión o una línea defensiva más baja.');
    if (state.fatigue > 70) recommendationsList.push('Gestiona mejor el cansancio: usa cambios y evita presionar todo el tiempo.');
    if (state.midfield < 45) recommendationsList.push('Refuerza el mediocampo cuando el rival gane la segunda jugada.');
    if (!recommendationsList.length) recommendationsList.push('Mantén la lectura del contexto y alterna ritmo, presión y posesión.');
    return recommendationsList.slice(0, 2);
  }

  function renderDtHistory() {
    if (!state.history.length) return '<div class="dt-history-empty">Aún no hay desafíos terminados.</div>';
    return `<div class="dt-history"><div class="dt-section-heading"><span class="eyebrow">HISTORIAL</span><strong>Últimos desafíos</strong></div>${state.history.slice(0, 5).map((item) => `<div><span>${escapeValue(item.scenario)}</span><strong>${escapeValue(item.score)}</strong><small>${item.performance}/100 · ${escapeValue(item.difficulty)}</small></div>`).join('')}</div>`;
  }

  function renderResult(container) {
    const won = state.goalsFor > state.goalsAgainst;
    const draw = state.goalsFor === state.goalsAgainst;
    const title = won ? 'Victoria táctica' : draw ? 'Empate trabajado' : 'Derrota con aprendizaje';
    const actionRows = state.decisions.map((decision) => `<div><strong>${decision.minute}' · ${escapeValue(decision.label)}</strong><span>${decision.beforeScore} → ${decision.afterScore} · ${decision.quality}/100</span></div>`).join('');
    container.innerHTML = `<article class="dt-shell surface-card dt-result"><div class="dt-result-badge">${won ? '✓' : draw ? '＝' : '↺'}</div><span class="eyebrow">INFORME FINAL · SIMULACIÓN</span><h2>${title}</h2><p>${escapeValue(teamName(state.teamAbbreviation))} ${state.goalsFor} - ${state.goalsAgainst} ${escapeValue(teamName(state.opponentAbbreviation))}</p><div class="dt-final-grid"><div><span>Desempeño DT</span><strong>${state.performance}/100</strong></div><div><span>Riesgo asumido</span><strong>${state.risk}/100</strong></div><div><span>Cambios</span><strong>${state.substitutionsUsed}/${maxSubstitutions}</strong></div><div><span>Formación final</span><strong>${escapeValue(state.formation)}</strong></div></div><div class="dt-result-columns"><section><div class="dt-section-heading"><span class="eyebrow">DECISIONES</span><strong>Lo que ordenaste</strong></div><div class="dt-decision-history">${actionRows || '<div>No hubo decisiones registradas.</div>'}</div></section><section><div class="dt-section-heading"><span class="eyebrow">RECOMENDACIONES</span><strong>Para el siguiente reto</strong></div><ul>${recommendations().map((recommendation) => `<li>${escapeValue(recommendation)}</li>`).join('')}</ul></section></div><div class="dt-actions"><button class="primary-btn" type="button" data-dt-action="new">Nuevo desafío</button><button class="secondary-btn" type="button" data-dt-action="setup">Cambiar configuración</button><button class="text-btn" type="button" data-game-action="reset-game">Volver a juegos</button></div></article>`;
  }

  function renderDtChallenge(container) {
    if (!container) return;
    if (!gameTeams().length) {
      container.innerHTML = '<article class="surface-card empty-state">Cargando los equipos de Liga MX...</article>';
      return;
    }
    if (state.screen === 'playing') return renderPlaying(container);
    if (state.screen === 'result') return renderResult(container);
    renderSetup(container);
  }

  function startDtMode() {
    gameState = { ...defaultGameState(), mode: 'dt-challenge', phase: 'dt-challenge' };
    loadState();
    saveGameState();
    renderJuego();
    loadDtRoster();
  }

  function handleDtClick(event) {
    const button = event.target.closest('[data-dt-action]');
    if (!button) return;
    const action = button.dataset.dtAction;
    if (action === 'start' || action === 'new') startChallenge();
    if (action === 'choice') dtAction(button.dataset.dtChoice);
    if (action === 'pause') { state.screen = 'setup'; state.message = 'Partida pausada. Puedes continuarla desde Reto DT.'; saveState(); renderDtChallenge(el('game-container')); }
    if (action === 'resume') { state.screen = 'playing'; renderDtChallenge(el('game-container')); }
    if (action === 'setup') { state.screen = 'setup'; state.message = ''; saveState(); renderDtChallenge(el('game-container')); }
  }

  async function loadDtRoster() {
    if (typeof supabaseClient === 'undefined') return;
    try {
      const response = await supabaseClient.from('jugadores_equipo').select('*').order('nombre');
      if (!response.error) state.rows = response.data || [];
    } catch (error) {
      state.rows = [];
    }
    if (gameState.phase === 'dt-challenge') renderDtChallenge(el('game-container'));
  }

  document.addEventListener('click', handleDtClick);
  window.startDtMode = startDtMode;
  window.renderDtChallenge = renderDtChallenge;
  loadState();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof gameState !== 'undefined' && gameState.phase === 'dt-challenge') {
        loadDtRoster();
        if (typeof renderJuego === 'function') renderJuego();
      }
    });
  }
})();
