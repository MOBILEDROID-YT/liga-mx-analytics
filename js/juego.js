const gameStorageKey = 'futbol-mx-analisis-pro-game-v1';

let gameState = loadGameState();
let directorPlayerPool = [];

function gameElement(id) {
  return document.getElementById(id);
}

function gameEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function gameTeams() {
  return typeof appState !== 'undefined' && Array.isArray(appState.teams) ? appState.teams : [];
}

function randomNumber(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function defaultGameState() {
  return {
    mode: '',
    phase: 'intro',
    age: 16,
    teamAbbreviation: '',
    skill: 60,
    playerName: '',
    playerNationality: '',
    playerPosition: '',
    playerFoot: 'Derecho',
    playerProfile: '',
    playerStage: 'academy',
    playerRole: 'Canterano',
    playerAttributes: {
      tecnica: 55,
      pase: 55,
      regate: 55,
      velocidad: 55,
      tiro: 55,
      defensa: 55,
      fisico: 55,
      vision: 55,
      resistencia: 55,
      mentalidad: 55
    },
    playerHidden: {
      potential: 75,
      professionalism: 60,
      discipline: 70,
      consistency: 60,
      personality: 60
    },
    playerCoachTrust: 45,
    playerPopularity: 8,
    playerFanRelation: 15,
    playerMorale: 75,
    playerFitness: 90,
    playerFatigue: 0,
    playerForm: 60,
    playerCurrentMatch: null,
    playerSeasonStats: { appearances: 0, starts: 0, goals: 0, assists: 0, minutes: 0, cards: 0 },
    playerClubs: [],
    playerNews: [],
    playerBigMoments: [],
    playerDecisions: [],
    playerRelations: [],
    playerAgent: { name: 'Agente por conocer', reputation: 25, commission: 5 },
    playerContract: null,
    playerMarketValue: 0,
    playerSuspendedYears: 0,
    careerGoals: 0,
    careerAssists: 0,
    careerTitles: 0,
    careerTournaments: [],
    injuries: 0,
    seasonOptions: [],
    actionUsed: false,
    currentSeasonNote: '',
    injured: false,
    suspended: false,
    history: [],
    startOptions: [],
    directorSeason: 1,
    directorBudget: 30000000,
    directorRoster: [],
    directorLineup: [],
    directorMarket: [],
    directorOffers: [],
    directorTransfers: [],
    directorHistory: [],
    directorYouthLevel: 0,
    directorTvDeal: false,
    directorDataLoaded: false,
    directorFired: false,
    directorMessage: '',
    directorMarketQuery: '',
    directorClubProfile: null,
    directorTicketPrice: 300,
    directorMerchandisingLevel: 1,
    directorInstallationLevels: { facilities: 1, training: 1, medical: 1 },
    directorStaff: {
      coach: { name: 'Cuerpo técnico base', level: 1, salary: 1200000 },
      scout: { name: 'Red de scouting base', level: 1, salary: 700000 },
      medical: { name: 'Departamento médico base', level: 1, salary: 700000 }
    },
    directorLoans: [],
    directorFinances: {
      cash: 30000000,
      transferBudget: 18000000,
      wageBudget: 12000000,
      debt: 0,
      tvIncome: 0,
      sponsorshipIncome: 0,
      matchdayIncome: 0,
      merchandisingIncome: 0,
      wageExpense: 0,
      maintenanceExpense: 0,
      projectedIncome: 0,
      projectedExpenses: 0
    },
    directorSeasonReports: [],
    directorJobOffers: [],
    directorPosition: 1,
    directorFanSatisfaction: 60,
    directorNews: [],
    directorDecisions: [],
    directorResolvedDecisions: [],
    directorMatchReport: null,
    directorPlayedMatches: [],
    directorRecord: { played: 0, wins: 0, draws: 0, losses: 0, points: 0 },
    directorClubHistory: [],
    directorCareerSeasons: 0,
    directorMaxSeasons: 60,
    directorNegotiation: null
  };
}

function loadGameState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(gameStorageKey) || 'null');
    const state = savedState ? { ...defaultGameState(), ...savedState } : defaultGameState();
    state.playerAttributes = { ...defaultGameState().playerAttributes, ...(state.playerAttributes || {}) };
    state.playerHidden = { ...defaultGameState().playerHidden, ...(state.playerHidden || {}) };
    state.playerSeasonStats = { ...defaultGameState().playerSeasonStats, ...(state.playerSeasonStats || {}) };
    state.playerAgent = { ...defaultGameState().playerAgent, ...(state.playerAgent || {}) };
    if (state.mode === 'player' && state.phase === 'career' && !state.actionUsed && state.seasonOptions.length < 6) state.seasonOptions = drawSeasonOptions();
    return state;
  } catch {
    return defaultGameState();
  }
}

function saveGameState() {
  localStorage.setItem(gameStorageKey, JSON.stringify(gameState));
}

function getGameTeam(abbreviation) {
  return gameTeams().find((team) => team.abreviatura === abbreviation);
}

function directorIsChivas() {
  return String(getGameTeam(gameState.teamAbbreviation)?.nombre || '').toLowerCase().includes('chivas');
}

function directorIsMexican(player) {
  if (typeof player.isMexican === 'boolean') return player.isMexican;
  return !player.nationality || /mexic/.test(String(player.nationality).toLowerCase());
}

function directorForeignCount() {
  return gameState.directorRoster.filter((player) => !directorIsMexican(player)).length;
}

function directorStartingLineup() {
  const available = gameState.directorRoster.filter((player) => !player.onLoan);
  const mexicanPlayers = available.filter((player) => directorIsMexican(player));
  const foreignPlayers = available.filter((player) => !directorIsMexican(player));
  return [...mexicanPlayers.slice(0, 4), ...foreignPlayers.slice(0, 7), ...mexicanPlayers.slice(4)].slice(0, 11).map((player) => player.key);
}

function directorMoney(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function directorClubProfile(team) {
  const name = String(team?.nombre || '').toLowerCase();
  const largeClub = /america|chivas|toluca|pumas|monterrey|tigres|cruz azul/.test(name);
  const competitiveClub = /leon|pachuca|atlas|tijuana/.test(name);
  const sellerClub = /necaxa/.test(name);
  const clubType = largeClub ? 'Grande' : competitiveClub ? 'Competitivo' : sellerClub ? 'Vendedor' : 'Pequeño';
  const reputation = largeClub ? 88 : competitiveClub ? 74 : sellerClub ? 62 : 55;
  return {
    clubType,
    city: team?.ciudad || 'México',
    region: team?.estado || 'México',
    foundation: largeClub ? 1916 : 1950,
    reputation,
    fans: largeClub ? 2800000 : competitiveClub ? 1100000 : 550000,
    stadium: 'Estadio principal del club',
    capacity: largeClub ? 70000 : competitiveClub ? 38000 : 26000,
    attendance: largeClub ? 0.82 : competitiveClub ? 0.68 : 0.52,
    ticketPrice: largeClub ? 420 : competitiveClub ? 300 : 220,
    facilities: largeClub ? 8 : competitiveClub ? 6 : 4,
    academy: sellerClub ? 8 : largeClub ? 7 : 5,
    training: largeClub ? 8 : competitiveClub ? 6 : 4,
    medical: largeClub ? 8 : 5,
    scouting: sellerClub ? 8 : largeClub ? 7 : 4,
    boardObjective: largeClub ? 'Competir por el campeonato' : competitiveClub ? 'Clasificar a fase final' : 'Evitar los últimos lugares',
    sponsors: ['NovaTel', 'Banco Horizonte', 'TecnoPlus'],
    tvContract: 'Red Fútbol MX',
    squadValue: largeClub ? 52000000 : competitiveClub ? 34000000 : 19000000
  };
}

function syncDirectorFinance() {
  const profile = gameState.directorClubProfile || directorClubProfile(getGameTeam(gameState.teamAbbreviation));
  const finance = gameState.directorFinances || {};
  const ticketPrice = Number(gameState.directorTicketPrice || profile.ticketPrice || 300);
  const attendance = Math.max(.3, Math.min(.95, Number(profile.attendance || .55) - Math.max(0, ticketPrice - Number(profile.ticketPrice || 300)) / 1800 + Math.max(0, Number(profile.ticketPrice || 300) - ticketPrice) / 2400));
  const salaryExpense = (gameState.directorRoster || []).filter((player) => !player.onLoan).reduce((total, player) => total + Number(player.salary || 0), 0) + Object.values(gameState.directorStaff || {}).reduce((total, staff) => total + Number(staff.salary || 0), 0);
  const maintenanceExpense = Number(profile.facilities || 1) * 150000 + Number(profile.training || 1) * 120000 + Number(profile.medical || 1) * 100000;
  const tvIncome = Number(finance.tvIncome || profile.reputation * 100000);
  const sponsorshipIncome = Number(finance.sponsorshipIncome || profile.reputation * 70000);
  const matchdayIncome = Math.round(Number(profile.capacity || 26000) * attendance * ticketPrice * 17);
  const merchandisingIncome = Math.round(Number(profile.fans || 550000) * (4 + Number(gameState.directorMerchandisingLevel || 1) * 2));
  gameState.directorFinances = {
    ...finance,
    cash: gameState.directorBudget,
    tvIncome,
    sponsorshipIncome,
    matchdayIncome,
    merchandisingIncome,
    wageExpense: salaryExpense,
    maintenanceExpense,
    projectedIncome: tvIncome + sponsorshipIncome + matchdayIncome + merchandisingIncome,
    projectedExpenses: salaryExpense + maintenanceExpense + Number(finance.debt || 0),
    ticketPrice,
    attendance
  };
}

function directorAddNews(category, text) {
  gameState.directorNews = [{ id: `${Date.now()}-${Math.random()}`, category, text, season: gameState.directorSeason }, ...(gameState.directorNews || [])].slice(0, 12);
}

function directorAddDecision(id, title, text, options) {
  if ((gameState.directorDecisions || []).some((decision) => decision.id === id)) return;
  gameState.directorDecisions = [...(gameState.directorDecisions || []), { id, title, text, options }];
}

function directorMatchHasTeam(match, teamName) {
  const normalize = (value) => String(value || '').toLowerCase().replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  const target = normalize(teamName);
  if (!target) return false;
  return [match.local, match.visitante].filter(Boolean).some((value) => {
    const candidate = normalize(value);
    return candidate.includes(target) || target.includes(candidate);
  });
}

function directorNextMatch() {
  const team = getGameTeam(gameState.teamAbbreviation);
  const upcoming = typeof getUpcomingMatches === 'function' ? getUpcomingMatches() : [];
  const teamMatch = upcoming.find((match) => directorMatchHasTeam(match, team?.nombre) && !gameState.directorPlayedMatches.includes(String(match.id)));
  if (teamMatch) return teamMatch;
  const opponent = shuffle(gameTeams().filter((item) => item.abreviatura !== gameState.teamAbbreviation))[0];
  return opponent ? { id: `simulated-${gameState.directorSeason}-${gameState.directorRecord.played}`, local: team?.nombre || 'Tu club', visitante: opponent.nombre, fecha_hora_mx: new Date().toISOString(), synthetic: true } : null;
}

function directorPrepareDashboard() {
  if (!gameState.directorNews.length) directorAddNews('Club', `La directiva presentó tu proyecto al frente de ${getGameTeam(gameState.teamAbbreviation)?.nombre || 'el club'}.`);
  const decisionId = `season-plan-${gameState.directorSeason}`;
  if (!gameState.directorResolvedDecisions.includes(decisionId)) directorAddDecision(decisionId, 'Define el plan de temporada', 'La directiva quiere saber qué prioridad tendrá tu proyecto.', [
    { id: 'competitive', label: 'Competir por resultados', text: 'Sube la presión, pero mejora la reputación si funciona.' },
    { id: 'youth', label: 'Apostar por jóvenes', text: 'Cuesta dinero y desarrolla la cantera.' },
    { id: 'financial', label: 'Cuidar las finanzas', text: 'Obtienes estabilidad, pero la afición espera más ambición.' }
  ]);
}

function directorGenerateRandomEvent() {
  const eventId = `event-${gameState.directorSeason}-${gameState.directorCareerSeasons}`;
  if (gameState.directorResolvedDecisions.includes(eventId)) return;
  const event = shuffle([
    { title: 'Problemas financieros', text: 'El club detectó un déficit inesperado antes de la próxima ventana.', options: [{ id: 'sell', label: 'Reducir gastos', text: 'Caja +$500,000; la afición pierde confianza.' }, { id: 'loan', label: 'Solicitar crédito', text: 'Caja +$1M; aumenta la deuda.' }, { id: 'sponsor', label: 'Buscar patrocinador', text: 'Ingreso menor pero sin deuda.' }] },
    { title: 'Oferta extranjera', text: 'Un equipo de otra región quiere contratar a uno de tus jugadores.', options: [{ id: 'accept', label: 'Aceptar', text: 'Recibes dinero, pero pierdes calidad.' }, { id: 'reject', label: 'Rechazar', text: 'Conservas al jugador y la afición lo valora.' }, { id: 'renew', label: 'Renovar primero', text: 'Mejoras la relación, con un costo salarial.' }] },
    { title: 'Juvenil prometedor', text: 'Un jugador de cantera está destacando en los entrenamientos.', options: [{ id: 'promote', label: 'Subirlo al primer equipo', text: 'Aumenta la cantera y la ilusión.' }, { id: 'loan-youth', label: 'Cederlo', text: 'Desarrollo progresivo sin ocupar un lugar.' }, { id: 'renew-youth', label: 'Renovarlo', text: 'Proteges su futuro con un pequeño costo.' }] }
  ])[0];
  directorAddDecision(eventId, event.title, event.text, event.options);
}

function directorResolveDecision(decisionId, optionId) {
  const decision = gameState.directorDecisions.find((item) => item.id === decisionId);
  if (!decision || gameState.directorFired) return;
  if (decisionId.startsWith('season-plan-')) {
    if (optionId === 'competitive') {
      gameState.directorClubProfile.reputation = Math.min(100, gameState.directorClubProfile.reputation + 2);
      gameState.directorFanSatisfaction = Math.min(100, gameState.directorFanSatisfaction + 3);
      gameState.directorMessage = 'La directiva aprobó un plan ambicioso. La presión aumentó, pero la afición respondió con ilusión.';
      directorAddNews('Directiva', 'El club apostará por competir desde la primera jornada.');
    }
    if (optionId === 'youth') {
      const cost = 1000000;
      if (gameState.directorBudget < cost) {
        gameState.directorMessage = 'No puedes financiar el plan de cantera con la caja actual.';
        saveGameState();
        renderJuego();
        return;
      }
      gameState.directorBudget -= cost;
      gameState.directorYouthLevel += 1;
      gameState.directorClubProfile.academy = Math.min(10, gameState.directorClubProfile.academy + 1);
      gameState.directorFanSatisfaction = Math.min(100, gameState.directorFanSatisfaction + 2);
      gameState.directorMessage = 'Elegiste apostar por jóvenes. La inversión tardará en dar frutos.';
      directorAddNews('Cantera', 'La directiva aprobó un nuevo plan de desarrollo juvenil.');
    }
    if (optionId === 'financial') {
      gameState.directorFanSatisfaction = Math.max(0, gameState.directorFanSatisfaction - 2);
      gameState.directorBudget += 500000;
      gameState.directorMessage = 'Reduciste gastos iniciales y mejoraste la caja, aunque la afición esperaba fichajes.';
      directorAddNews('Finanzas', 'El club priorizará la estabilidad económica esta temporada.');
    }
  }
  if (decisionId.startsWith('event-')) {
    if (optionId === 'sell') { gameState.directorBudget += 500000; gameState.directorFanSatisfaction = Math.max(0, gameState.directorFanSatisfaction - 4); gameState.directorMessage = 'Reduciste gastos y protegiste la caja, pero la afición esperaba otra respuesta.'; }
    if (optionId === 'loan') { gameState.directorBudget += 1000000; gameState.directorFinances.debt += 1000000; gameState.directorMessage = 'Solicitaste un crédito. La caja mejoró, pero tendrás una deuda que pagar.'; }
    if (optionId === 'sponsor') { gameState.directorFinances.sponsorshipIncome += 1500000; gameState.directorMessage = 'Un patrocinador ficticio aceptó apoyar al club con una aportación especial.'; }
    if (optionId === 'accept') { gameState.directorBudget += 3000000; gameState.directorFanSatisfaction = Math.max(0, gameState.directorFanSatisfaction - 8); gameState.directorMessage = 'Aceptaste una oferta extranjera y recibiste dinero, pero debilitaste la plantilla.'; }
    if (optionId === 'reject') { gameState.directorFanSatisfaction = Math.min(100, gameState.directorFanSatisfaction + 3); gameState.directorMessage = 'Rechazaste la oferta y la afición celebró conservar al jugador.'; }
    if (optionId === 'renew') { gameState.directorFinances.wageExpense += 400000; gameState.directorMessage = 'Renovaste al jugador y aumentaste el gasto salarial anual.'; }
    if (optionId === 'promote') { gameState.directorYouthLevel += 1; gameState.directorFanSatisfaction = Math.min(100, gameState.directorFanSatisfaction + 3); gameState.directorMessage = 'Promoviste al juvenil y abriste una nueva historia de cantera.'; }
    if (optionId === 'loan-youth') { gameState.directorMessage = 'El juvenil salió cedido para sumar minutos y regresará con más experiencia.'; }
    if (optionId === 'renew-youth') { gameState.directorBudget -= 250000; gameState.directorMessage = 'Renovaste al juvenil antes de que otros clubes intentaran llevárselo.'; }
    directorAddNews('Evento', gameState.directorMessage);
  }
  gameState.directorResolvedDecisions = [...(gameState.directorResolvedDecisions || []), decisionId];
  gameState.directorDecisions = gameState.directorDecisions.filter((item) => item.id !== decisionId);
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorSimulateMatch() {
  if (gameState.directorFired) return;
  const match = directorNextMatch();
  if (!match) return;
  const matchKey = String(match.id);
  if (gameState.directorPlayedMatches.includes(matchKey)) {
    gameState.directorMessage = 'Ese partido ya fue simulado.';
    saveGameState();
    renderJuego();
    return;
  }
  const team = getGameTeam(gameState.teamAbbreviation);
  const normalizeTeam = (value) => String(value || '').toLowerCase().replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  const isHome = normalizeTeam(match.local).includes(normalizeTeam(team?.nombre)) || normalizeTeam(team?.nombre).includes(normalizeTeam(match.local));
  const opponent = isHome ? match.visitante : match.local;
  const strength = Number(gameState.directorClubProfile?.reputation || 55) + gameState.directorRoster.length * .35 + Number(gameState.directorStaff?.coach?.level || 1) * 4 + Number(gameState.directorFanSatisfaction || 60) * .1 + randomNumber(-12, 12) + (isHome ? 5 : 0);
  const rivalStrength = randomNumber(48, 84);
  const chance = strength / Math.max(1, strength + rivalStrength);
  const roll = Math.random();
  const result = roll < chance * .62 ? 'win' : roll < chance * .62 + .23 ? 'draw' : 'loss';
  const ourGoals = result === 'win' ? randomNumber(1, 3) : result === 'draw' ? randomNumber(0, 2) : randomNumber(0, 1);
  const rivalGoals = result === 'win' ? randomNumber(0, Math.max(0, ourGoals - 1)) : result === 'draw' ? ourGoals : randomNumber(Math.max(1, ourGoals), 3);
  const scorer = shuffle(gameState.directorRoster.filter((player) => !player.onLoan))[0];
  const injury = Math.random() < .12 ? shuffle(gameState.directorRoster.filter((player) => !player.onLoan))[0] : null;
  const attendance = Math.round(Number(gameState.directorFinances?.matchdayIncome || 0) / Math.max(1, gameState.directorTicketPrice || 1));
  const report = { matchKey, opponent, isHome, score: `${ourGoals}-${rivalGoals}`, result, possession: randomNumber(42, 64), shots: randomNumber(7, 18), shotsOnTarget: randomNumber(3, 9), cards: randomNumber(1, 5), scorer: scorer?.name || 'La plantilla', injury: injury?.name || '', attendance };
  gameState.directorMatchReport = report;
  gameState.directorPlayedMatches.push(matchKey);
  gameState.directorRecord.played += 1;
  if (result === 'win') { gameState.directorRecord.wins += 1; gameState.directorRecord.points += 3; gameState.directorFanSatisfaction = Math.min(100, gameState.directorFanSatisfaction + 4); gameState.directorClubProfile.reputation = Math.min(100, gameState.directorClubProfile.reputation + 1); }
  if (result === 'draw') { gameState.directorRecord.draws += 1; gameState.directorRecord.points += 1; }
  if (result === 'loss') { gameState.directorRecord.losses += 1; gameState.directorFanSatisfaction = Math.max(0, gameState.directorFanSatisfaction - 4); gameState.directorClubProfile.reputation = Math.max(0, gameState.directorClubProfile.reputation - 1); }
  gameState.directorPosition = Math.max(1, Math.min(18, 18 - Math.floor(gameState.directorRecord.points / 3)));
  gameState.directorBudget += Math.round(Number(gameState.directorFinances?.matchdayIncome || 0) / 17);
  if (injury) { injury.onLoan = false; injury.form = Math.max(40, Number(injury.form || 70) - 10); }
  directorAddNews('Partido', `${team?.nombre || 'El club'} ${report.score} ${opponent}. ${result === 'win' ? 'La afición celebra la victoria.' : result === 'draw' ? 'El equipo rescató un punto.' : 'La prensa cuestiona el resultado.'}`);
  gameState.directorMessage = `Partido simulado contra ${opponent}: ${report.score}.`;
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function playerTournamentNames() {
  return ['Liga Mexicana Profesional', 'Copa Mexicana', 'Campeón de Campeones', 'Leagues Cup Ficticia', 'Concachampions Ficticia'];
}

function drawPlayerTrophies(skill, suspended) {
  if (suspended || Math.random() > Math.min(.75, .08 + skill / 180)) return [];
  const names = shuffle(playerTournamentNames());
  const maximum = skill >= 86 && Math.random() < .32 ? 3 : skill >= 70 && Math.random() < .5 ? 2 : 1;
  return names.slice(0, maximum);
}

function directorPlayerKey(player, index = 0) {
  return String(player.id || `${player.abreviatura || player.teamAbbreviation || 'jugador'}-${player.nombre || player.name || index}`).replaceAll(' ', '-');
}

function directorMapPlayer(player, teamAbbreviation, index = 0) {
  const team = getGameTeam(teamAbbreviation || player.abreviatura);
  const age = Number(player.edad || player.age) || randomNumber(18, 30);
  const value = Number(player.valor || player.value) || randomNumber(700000, 4500000);
  const releaseClause = Number(player.clausula || player.releaseClause) || (Math.random() < .28 ? (Math.random() < .5 ? 15000000 : 20000000) : 0);
  const salary = Number(player.salario || player.salary) || randomNumber(250000, 850000);
  const nationality = player.nacionalidad || player.nationality || 'Mexicana';
  return {
    id: player.id,
    key: directorPlayerKey({ ...player, abreviatura: teamAbbreviation || player.abreviatura }, index),
    name: player.nombre || player.name || `Jugador de cantera ${index + 1}`,
    position: player.posicion || player.position || 'Jugador',
    age,
    value,
    salary,
    nationality,
    isMexican: /mexic/.test(String(nationality).toLowerCase()),
    releaseClause,
    negotiationAvailable: player.disponible_negociar !== false && Math.random() > .2,
    willingToJoin: Math.random() > .28,
    teamAbbreviation: teamAbbreviation || player.abreviatura || '',
    teamName: team?.nombre || 'Equipo de origen'
  };
}

function directorFallbackPlayers(teamAbbreviation) {
  return ['Portero titular', 'Defensa central', 'Mediocampista creativo', 'Extremo derecho', 'Delantero centro']
    .map((name, index) => directorMapPlayer({ nombre: name, posicion: 'Plantilla', edad: 19 + index }, teamAbbreviation, index));
}

async function loadDirectorPlayers() {
  if (typeof supabaseClient === 'undefined') return [];
  const { data, error } = await supabaseClient.from('jugadores_equipo').select('*');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

function directorBuildOffers() {
  const otherTeams = gameTeams().filter((team) => team.abreviatura !== gameState.teamAbbreviation);
  const rosterKeys = new Set((gameState.directorRoster || []).map((player) => player.key));
  const candidates = shuffle(directorPlayerPool
    .filter((player) => player.abreviatura && player.abreviatura !== gameState.teamAbbreviation)
    .map((player, index) => directorMapPlayer(player, player.abreviatura, index))
    .filter((player) => !rosterKeys.has(player.key)));
  const market = candidates.length ? candidates : shuffle(otherTeams).map((team, index) => directorMapPlayer({ nombre: `Talento juvenil ${index + 1}`, posicion: 'Jugador', edad: randomNumber(18, 22) }, team.abreviatura, index));
  gameState.directorMarket = market;
  const saleableRoster = gameState.directorRoster.filter((player) => !player.onLoan);
  const offerCount = randomNumber(0, Math.min(8, saleableRoster.length));
  gameState.directorOffers = shuffle(saleableRoster).slice(0, offerCount).map((player, index) => {
    const buyer = shuffle(otherTeams)[index % Math.max(1, otherTeams.length)];
    return { ...player, offerId: `offer-${player.key}`, buyerTeam: buyer?.nombre || 'Club interesado', amount: Math.round(player.value * (1.1 + Math.random() * 0.65)), offerSeason: gameState.directorSeason };
  });
}

function startDirectorMode() {
  gameState = { ...defaultGameState(), mode: 'director', phase: 'director-choose-team', directorMessage: 'Elige el club que vas a dirigir.' };
  directorPlayerPool = [];
  saveGameState();
  renderJuego();
}

async function selectDirectorTeam(abbreviation) {
  const team = getGameTeam(abbreviation);
  if (!team) return;
  gameState.teamAbbreviation = team.abreviatura;
  gameState.phase = 'director-dashboard';
  gameState.directorFired = false;
  gameState.directorDataLoaded = false;
  gameState.directorClubProfile = directorClubProfile(team);
  gameState.directorTicketPrice = gameState.directorClubProfile.ticketPrice;
  gameState.directorMerchandisingLevel = 1;
  gameState.directorInstallationLevels = { facilities: gameState.directorClubProfile.facilities, training: gameState.directorClubProfile.training, medical: gameState.directorClubProfile.medical };
  gameState.directorStaff = {
    coach: { name: 'Cuerpo técnico base', level: 1, salary: 1200000 },
    scout: { name: 'Red de scouting base', level: 1, salary: 700000 },
    medical: { name: 'Departamento médico base', level: 1, salary: 700000 }
  };
  gameState.directorLoans = [];
  gameState.directorPosition = 1;
  gameState.directorFanSatisfaction = 60;
  gameState.directorNews = [];
  gameState.directorDecisions = [];
  gameState.directorResolvedDecisions = [];
  gameState.directorMatchReport = null;
  gameState.directorPlayedMatches = [];
  gameState.directorRecord = { played: 0, wins: 0, draws: 0, losses: 0, points: 0 };
  gameState.directorClubHistory = [];
  gameState.directorCareerSeasons = 0;
  gameState.directorNegotiation = null;
  gameState.directorBudget = 30000000;
  gameState.directorFinances = {
    ...defaultGameState().directorFinances,
    cash: gameState.directorBudget,
    transferBudget: 18000000,
    wageBudget: 12000000,
    tvIncome: gameState.directorClubProfile.reputation * 100000,
    sponsorshipIncome: gameState.directorClubProfile.reputation * 70000,
    matchdayIncome: Math.round(gameState.directorClubProfile.capacity * gameState.directorClubProfile.attendance * gameState.directorClubProfile.ticketPrice),
    merchandisingIncome: gameState.directorClubProfile.fans * 4
  };
  syncDirectorFinance();
  gameState.directorSeasonReports = [];
  gameState.directorJobOffers = [];
  gameState.directorMessage = `Cargando la plantilla actual de ${team.nombre}...`;
  saveGameState();
  renderJuego();
  try {
    directorPlayerPool = await loadDirectorPlayers();
  } catch {
    directorPlayerPool = [];
  }
  const roster = directorPlayerPool
    .filter((player) => player.abreviatura === team.abreviatura)
    .map((player, index) => directorMapPlayer(player, team.abreviatura, index));
  gameState.directorRoster = roster.length ? roster : directorFallbackPlayers(team.abreviatura);
  gameState.directorLineup = directorStartingLineup();
  gameState.directorDataLoaded = true;
  directorBuildOffers();
  gameState.directorMessage = roster.length
    ? `Plantilla cargada. Puedes negociar con jugadores registrados en Supabase.`
    : 'No se encontró plantilla pública para este club; se cargó una plantilla de demostración para probar el modo.';
  directorPrepareDashboard();
  saveGameState();
  renderJuego();
}

function directorStartNegotiation(playerKey) {
  const player = gameState.directorMarket.find((item) => item.key === playerKey);
  if (!player || gameState.directorFired) return;
  if (!player.negotiationAvailable) {
    gameState.directorMessage = `${player.name} no está disponible para negociar en esta ventana.`;
  } else {
    gameState.directorNegotiation = { playerKey, stage: 'interest', offer: player.value };
    gameState.directorMessage = `El scouting recomienda estudiar el fichaje de ${player.name}.`;
  }
  saveGameState();
  renderJuego();
}

function directorContactClub() {
  if (!gameState.directorNegotiation) return;
  gameState.directorNegotiation.stage = 'contacted';
  gameState.directorMessage = 'El club vendedor aceptó escuchar una propuesta inicial.';
  saveGameState();
  renderJuego();
}

function directorAskPrice() {
  if (!gameState.directorNegotiation) return;
  gameState.directorNegotiation.stage = 'price-known';
  const player = gameState.directorMarket.find((item) => item.key === gameState.directorNegotiation.playerKey);
  gameState.directorMessage = player?.releaseClause ? `El representante informa que la cláusula es de ${directorMoney(player.releaseClause)}.` : `El club solicita ${directorMoney(player?.value || 0)} por el jugador.`;
  saveGameState();
  renderJuego();
}

function directorSubmitNegotiation() {
  const negotiation = gameState.directorNegotiation;
  if (!negotiation) return;
  const player = gameState.directorMarket.find((item) => item.key === negotiation.playerKey);
  if (!player) return;
  const requested = player.releaseClause || player.value;
  const offer = Number(negotiation.offer) || 0;
  if (offer < requested) {
    negotiation.stage = 'counter';
    gameState.directorMessage = `El club rechazó tu oferta y pide al menos ${directorMoney(requested)}.`;
    saveGameState();
    renderJuego();
    return;
  }
  if (!player.releaseClause && !player.willingToJoin) {
    gameState.directorNegotiation = null;
    gameState.directorMessage = `${player.name} rechazó el proyecto aunque igualaste el precio.`;
    directorAddNews('Mercado', `${player.name} decidió no aceptar la propuesta del club.`);
    saveGameState();
    renderJuego();
    return;
  }
  gameState.directorNegotiation = null;
  directorBuy(player.key, offer);
}

function directorBuy(playerKey, negotiatedFee = null) {
  const player = gameState.directorMarket.find((item) => item.key === playerKey);
  if (!player || gameState.directorFired) return;
  if (gameState.directorRoster.length >= 30) {
    gameState.directorMessage = 'La plantilla alcanzó el máximo de 30 jugadores registrados.';
  } else if (directorIsChivas() && !directorIsMexican(player)) {
    gameState.directorMessage = 'Chivas solo puede contratar jugadores mexicanos en este simulador.';
  } else if (!directorIsMexican(player) && directorForeignCount() >= 9) {
    gameState.directorMessage = 'Ya tienes el máximo de 9 extranjeros permitidos en la plantilla.';
  } else if (!player.negotiationAvailable) {
    gameState.directorMessage = `${player.name} no está disponible para negociar en esta ventana.`;
  } else if (!player.releaseClause && !player.willingToJoin) {
    gameState.directorMessage = `${player.name} rechazó la oferta porque no quiere ir al club.`;
  } else {
    const fee = negotiatedFee || player.releaseClause || player.value;
    if (gameState.directorBudget < fee) {
      gameState.directorMessage = `No tienes presupuesto suficiente para fichar a ${player.name}.`;
      saveGameState();
      renderJuego();
      return;
    }
    gameState.directorBudget -= fee;
    gameState.directorFinances.transferBudget = Math.max(0, Number(gameState.directorFinances.transferBudget || 0) - fee);
    gameState.directorRoster.push({ ...player, value: fee, teamAbbreviation: gameState.teamAbbreviation, teamName: getGameTeam(gameState.teamAbbreviation)?.nombre || '' });
    gameState.directorLineup = directorStartingLineup();
    gameState.directorTransfers.push({ type: 'Fichaje', player: player.name, amount: -fee, season: gameState.directorSeason });
    gameState.directorMessage = player.releaseClause
      ? `Pagaste la cláusula de ${player.name} por ${directorMoney(fee)}.`
      : `Fichaste a ${player.name} por ${directorMoney(fee)}.`;
    directorBuildOffers();
  }
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorSell(offerId) {
  const offer = gameState.directorOffers.find((item) => item.offerId === offerId);
  if (!offer || gameState.directorFired) return;
  if (gameState.directorRoster.length <= 22) {
    gameState.directorMessage = 'No puedes aceptar esta venta: la plantilla debe conservar al menos 22 jugadores.';
    saveGameState();
    renderJuego();
    return;
  }
  gameState.directorBudget += offer.amount;
  gameState.directorFinances.transferBudget = Number(gameState.directorFinances.transferBudget || 0) + offer.amount;
  gameState.directorRoster = gameState.directorRoster.filter((player) => player.key !== offer.key);
  gameState.directorLineup = directorStartingLineup();
  gameState.directorTransfers.push({ type: 'Venta', player: offer.name, amount: offer.amount, season: gameState.directorSeason });
  gameState.directorMessage = `${offer.buyerTeam} ofreció ${directorMoney(offer.amount)} por ${offer.name}. Venta aceptada.`;
  directorBuildOffers();
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorSponsorship() {
  if (gameState.directorTvDeal || gameState.directorFired) return;
  gameState.directorTvDeal = true;
  gameState.directorFinances.tvIncome = Number(gameState.directorFinances.tvIncome || 0) + 4000000;
  gameState.directorTransfers.push({ type: 'Patrocinio televisivo', player: 'Acuerdo de temporada', amount: 4000000, season: gameState.directorSeason });
  gameState.directorMessage = 'Firmaste el patrocinio televisivo de la temporada por 4 millones de pesos ficticios.';
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorAcademy() {
  if (gameState.directorFired) return;
  const cost = 2000000;
  if (gameState.directorBudget < cost) {
    gameState.directorMessage = 'No tienes presupuesto suficiente para invertir en fuerzas básicas.';
  } else {
    gameState.directorBudget -= cost;
    gameState.directorFinances.cash = gameState.directorBudget;
    gameState.directorYouthLevel += 1;
    gameState.directorTransfers.push({ type: 'Fuerzas básicas', player: `Nivel ${gameState.directorYouthLevel}`, amount: -cost, season: gameState.directorSeason });
    gameState.directorMessage = 'Invertiste 2 millones en fuerzas básicas. El nivel de cantera aumentó.';
  }
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorLoanPlayer(playerKey) {
  const player = gameState.directorRoster.find((item) => item.key === playerKey);
  if (!player || player.onLoan || gameState.directorFired) return;
  const destination = shuffle(gameTeams().filter((team) => team.abreviatura !== gameState.teamAbbreviation))[0];
  const fee = randomNumber(250, 900) * 1000;
  player.onLoan = true;
  player.loanReturnSeason = gameState.directorSeason + 1;
  player.loanClub = destination?.nombre || 'Club asociado';
  gameState.directorLineup = directorStartingLineup();
  gameState.directorBudget += fee;
  gameState.directorLoans.push({ player: player.name, club: player.loanClub, fee, season: gameState.directorSeason, returnSeason: player.loanReturnSeason });
  gameState.directorTransfers.push({ type: 'Préstamo', player: player.name, amount: fee, season: gameState.directorSeason });
  gameState.directorMessage = `Cediste a ${player.name} a ${player.loanClub} por ${directorMoney(fee)}. Regresará en la temporada ${player.loanReturnSeason}.`;
  directorBuildOffers();
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorHireStaff(type) {
  if (gameState.directorFired) return;
  const labels = { coach: 'cuerpo técnico', scout: 'red de scouting', medical: 'departamento médico' };
  const staff = gameState.directorStaff[type];
  if (!staff || staff.level >= 3) return;
  const cost = (staff.level + 1) * 1200000;
  if (gameState.directorBudget < cost) {
    gameState.directorMessage = `No tienes presupuesto para mejorar el ${labels[type]}.`;
  } else {
    staff.level += 1;
    staff.salary += 350000;
    staff.name = `${labels[type].replace(/^./, (letter) => letter.toUpperCase())} nivel ${staff.level}`;
    gameState.directorBudget -= cost;
    if (type === 'coach') gameState.directorClubProfile.training = Math.min(10, gameState.directorClubProfile.training + 1);
    if (type === 'scout') gameState.directorClubProfile.scouting = Math.min(10, gameState.directorClubProfile.scouting + 1);
    if (type === 'medical') gameState.directorClubProfile.medical = Math.min(10, gameState.directorClubProfile.medical + 1);
    gameState.directorTransfers.push({ type: 'Mejora de staff', player: staff.name, amount: -cost, season: gameState.directorSeason });
    gameState.directorMessage = `Mejoraste el ${labels[type]} por ${directorMoney(cost)}.`;
  }
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorChangeTicket(direction) {
  if (gameState.directorFired) return;
  const current = Number(gameState.directorTicketPrice || 300);
  const next = Math.max(100, Math.min(900, current + (direction === 'up' ? 50 : -50)));
  gameState.directorTicketPrice = next;
  gameState.directorMessage = `El precio promedio de entrada ahora es ${directorMoney(next)}. La asistencia proyectada se actualizó.`;
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorUpgradeMerchandising() {
  if (gameState.directorFired) return;
  const cost = 1000000;
  if (gameState.directorBudget < cost) {
    gameState.directorMessage = 'No tienes presupuesto para mejorar el merchandising.';
  } else if (gameState.directorMerchandisingLevel >= 5) {
    gameState.directorMessage = 'El merchandising ya alcanzó el nivel máximo.';
  } else {
    gameState.directorBudget -= cost;
    gameState.directorMerchandisingLevel += 1;
    gameState.directorTransfers.push({ type: 'Merchandising', player: `Nivel ${gameState.directorMerchandisingLevel}`, amount: -cost, season: gameState.directorSeason });
    gameState.directorMessage = `Mejoraste el merchandising al nivel ${gameState.directorMerchandisingLevel}.`;
  }
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorUpgradeInstallation(category) {
  if (gameState.directorFired) return;
  const labels = { facilities: 'instalaciones', training: 'centro de entrenamiento', medical: 'departamento médico' };
  const current = Number(gameState.directorInstallationLevels[category] || 1);
  if (current >= 10) return;
  const cost = current * 700000;
  if (gameState.directorBudget < cost) {
    gameState.directorMessage = `No tienes presupuesto para mejorar el ${labels[category]}.`;
  } else {
    gameState.directorBudget -= cost;
    gameState.directorInstallationLevels[category] = current + 1;
    gameState.directorClubProfile[category] = Math.min(10, Number(gameState.directorClubProfile[category] || current) + 1);
    gameState.directorTransfers.push({ type: 'Instalaciones', player: `${labels[category]} nivel ${current + 1}`, amount: -cost, season: gameState.directorSeason });
    gameState.directorMessage = `Mejoraste el ${labels[category]} por ${directorMoney(cost)}.`;
  }
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorDrawTrophies(position) {
  const trophies = [];
  if (position <= 1) trophies.push('Liga Mexicana Profesional');
  if (position <= 4 && Math.random() < .32) trophies.push('Copa Mexicana');
  if (position <= 5 && Math.random() < .22) trophies.push('Leagues Cup Ficticia');
  if (position <= 6 && Math.random() < .18) trophies.push('Concachampions Ficticia');
  if (trophies.length && Math.random() < .15) trophies.push('Campeón de Campeones');
  return trophies;
}

function directorGenerateJobOffers() {
  gameState.directorJobOffers = shuffle(gameTeams().filter((team) => team.abreviatura !== gameState.teamAbbreviation)).slice(0, 2).map((team) => ({
    teamAbbreviation: team.abreviatura,
    teamName: team.nombre,
    budget: randomNumber(12, 32) * 1000000,
    objective: directorClubProfile(team).boardObjective
  }));
}

async function directorTakeJob(abbreviation) {
  const offer = gameState.directorJobOffers.find((item) => item.teamAbbreviation === abbreviation);
  if (!offer) return;
  await selectDirectorTeam(abbreviation);
  gameState.directorBudget = offer.budget;
  gameState.directorFinances.cash = offer.budget;
  gameState.directorMessage = `Aceptaste el proyecto de ${offer.teamName}. La directiva espera: ${offer.objective}.`;
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function directorSimulateSeason() {
  if (gameState.directorFired) return;
  if (gameState.directorCareerSeasons >= gameState.directorMaxSeasons) {
    gameState.phase = 'director-career-finished';
    gameState.directorMessage = `Completaste el límite de ${gameState.directorMaxSeasons} temporadas.`;
    saveGameState();
    renderJuego();
    return;
  }
  const finance = gameState.directorFinances || {};
  const performanceBonus = randomNumber(0, 3000000) + gameState.directorYouthLevel * 500000;
  const operatingCost = Number(finance.projectedExpenses || 0) + randomNumber(800000, 2200000);
  const seasonIncome = Number(finance.projectedIncome || 0) + performanceBonus;
  const change = seasonIncome - operatingCost;
  gameState.directorBudget += change;
  const profile = gameState.directorClubProfile || directorClubProfile(getGameTeam(gameState.teamAbbreviation));
  const position = Math.max(1, Math.min(18, randomNumber(3, 18) - Math.round((profile.reputation - 50) / 15) - Math.min(2, gameState.directorYouthLevel)));
  const trophies = directorDrawTrophies(position);
  const journalistNote = position >= 13 && position <= 15 ? 'La prensa especializada considera que tu desempeño como director deportivo deja que desear.' : position >= 16 ? 'La prensa cuestiona severamente la planeación deportiva y la directiva perdió la paciencia.' : '';
  const report = { season: gameState.directorSeason, position, trophies, change, budget: gameState.directorBudget, note: journalistNote };
  gameState.directorHistory.push(report);
  gameState.directorSeasonReports.push(report);
  gameState.directorClubHistory.push({ season: gameState.directorSeason, position, trophies, budget: gameState.directorBudget });
  gameState.directorPosition = position;
  gameState.directorCareerSeasons += 1;
  gameState.directorDecisions = [];
  gameState.directorPlayedMatches = [];
  gameState.directorMatchReport = null;
  if (position <= 4) gameState.directorFanSatisfaction = Math.min(100, gameState.directorFanSatisfaction + 6);
  if (position >= 13) gameState.directorFanSatisfaction = Math.max(0, gameState.directorFanSatisfaction - 6);
  directorAddNews('Temporada', `El club terminó en el lugar ${position}. ${trophies.length ? `Ganó ${trophies.join(', ')}.` : 'No levantó trofeos.'}`);
  gameState.directorSeason += 1;
  gameState.directorTvDeal = false;
  gameState.directorRoster.forEach((player) => {
    if (player.onLoan && player.loanReturnSeason <= gameState.directorSeason) {
      player.onLoan = false;
      player.loanClub = '';
      player.loanReturnSeason = null;
    }
  });
  gameState.directorMessage = `Temporada terminada en el lugar ${position}. ${trophies.length ? `Ganaste: ${trophies.join(', ')}.` : 'No ganaste trofeos.'} ${journalistNote}`;
  if (position >= 16 || gameState.directorBudget < 100000) {
    gameState.directorFired = true;
    directorGenerateJobOffers();
    gameState.phase = 'director-job-offers';
    gameState.directorMessage = position >= 16 ? 'Terminaste entre los lugares 16 y 18 y la directiva te despidió.' : 'El presupuesto bajó de 100 mil pesos y la directiva te despidió.';
  } else {
    directorBuildOffers();
    directorPrepareDashboard();
    directorGenerateRandomEvent();
    if (gameState.directorCareerSeasons >= gameState.directorMaxSeasons) {
      gameState.phase = 'director-career-finished';
      gameState.directorMessage = `Completaste el límite de ${gameState.directorMaxSeasons} temporadas al frente del club.`;
    }
  }
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function playerClamp(value, minimum = 1, maximum = 99) {
  return Math.max(minimum, Math.min(maximum, Math.round(Number(value) || 0)));
}

function playerAttributeAverage() {
  const attributes = Object.values(gameState.playerAttributes || {});
  return attributes.length ? Math.round(attributes.reduce((sum, value) => sum + Number(value || 0), 0) / attributes.length) : Number(gameState.skill || 1);
}

function playerRecalculateSkill() {
  gameState.skill = playerClamp(playerAttributeAverage());
  gameState.playerMarketValue = Math.round(Math.max(10000, gameState.skill * 25000 + Number(gameState.age || 16) * 15000));
}

function playerAdjustAttributes(changes) {
  Object.entries(changes).forEach(([attribute, amount]) => {
    if (Object.prototype.hasOwnProperty.call(gameState.playerAttributes, attribute)) gameState.playerAttributes[attribute] = playerClamp(gameState.playerAttributes[attribute] + amount);
  });
  playerRecalculateSkill();
}

function playerAdjustOverall(amount) {
  const attributes = Object.keys(gameState.playerAttributes || {});
  attributes.forEach((attribute) => { gameState.playerAttributes[attribute] = playerClamp(gameState.playerAttributes[attribute] + amount); });
  playerRecalculateSkill();
}

function playerStageLabel() {
  return ({ academy: 'Fuerzas básicas', loan: 'Cedido', bench: 'Primer equipo · suplente', firstTeam: 'Primer equipo · titular' })[gameState.playerStage] || 'Canterano';
}

function playerProfileLabel() {
  return ({ creative: 'Creador', finisher: 'Finalizador', defensive: 'Defensivo', speedster: 'Extremo veloz', boxToBox: 'Todoterreno' })[gameState.playerProfile] || 'En formación';
}

function playerAddNews(text, category = 'Carrera') {
  gameState.playerNews = [{ id: `${Date.now()}-${Math.random()}`, age: gameState.age, category, text }, ...(gameState.playerNews || [])].slice(0, 12);
}

function playerTransferToRandomTeam(note) {
  const newTeam = shuffle(gameTeams().filter((item) => item.abreviatura !== gameState.teamAbbreviation))[0];
  if (!newTeam) return;
  gameState.teamAbbreviation = newTeam.abreviatura;
  gameState.playerClubs = [...new Set([...(gameState.playerClubs || []), newTeam.nombre])];
  gameState.currentSeasonNote = `${note} Ahora estás con ${newTeam.nombre}.`;
  playerAddNews(gameState.currentSeasonNote, 'Mercado');
}

function playerNextMatch() {
  const team = getGameTeam(gameState.teamAbbreviation);
  if (!team || typeof appState === 'undefined') return null;
  const normalize = (value) => String(value || '').toLowerCase().replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  const teamName = normalize(team.nombre);
  return (appState.matches || []).find((match) => {
    const status = normalize(match.estado);
    if (status.includes('finaliz') || status.includes('termin')) return false;
    return [match.local, match.visitante].some((name) => normalize(name).includes(teamName) || teamName.includes(normalize(name)));
  }) || null;
}

function playerPositionOptions() {
  return ['Portero', 'Defensa central', 'Lateral', 'Mediocampista', 'Extremo', 'Delantero'];
}

function playerProfileOptions() {
  return [
    { id: 'creative', label: 'Creador', text: 'Pase, visión y regate.' },
    { id: 'finisher', label: 'Finalizador', text: 'Tiro, velocidad y movimientos ofensivos.' },
    { id: 'defensive', label: 'Defensivo', text: 'Defensa, físico y disciplina táctica.' },
    { id: 'speedster', label: 'Extremo veloz', text: 'Velocidad, regate y resistencia.' },
    { id: 'boxToBox', label: 'Todoterreno', text: 'Equilibrio entre ataque, defensa y resistencia.' }
  ];
}

function playerBuildAttributes(position, profile) {
  const keys = ['tecnica', 'pase', 'regate', 'velocidad', 'tiro', 'defensa', 'fisico', 'vision', 'resistencia', 'mentalidad'];
  const attributes = Object.fromEntries(keys.map((key) => [key, randomNumber(47, 62)]));
  const modifiers = {
    creative: { pase: 8, vision: 8, regate: 5 },
    finisher: { tiro: 9, velocidad: 5, tecnica: 4 },
    defensive: { defensa: 9, fisico: 6, mentalidad: 5 },
    speedster: { velocidad: 9, regate: 7, resistencia: 5 },
    boxToBox: { resistencia: 8, fisico: 5, pase: 4 }
  };
  const positionModifiers = {
    Portero: { defensa: 8, mentalidad: 5, tecnica: 3 },
    'Defensa central': { defensa: 8, fisico: 6, mentalidad: 3 },
    Lateral: { defensa: 5, velocidad: 5, resistencia: 4 },
    Mediocampista: { pase: 5, vision: 5, resistencia: 4 },
    Extremo: { velocidad: 6, regate: 6, tiro: 3 },
    Delantero: { tiro: 8, tecnica: 5, velocidad: 4 }
  };
  [modifiers[profile] || {}, positionModifiers[position] || {}].forEach((group) => Object.entries(group).forEach(([key, amount]) => { attributes[key] += amount; }));
  return Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, playerClamp(value)]));
}

function drawSeasonOptions() {
  const senior = gameState.age >= 18 && gameState.playerStage !== 'academy';
  const mainOptions = senior ? [
    { id: 'training', icon: '💪', title: 'Entrenar fuerte', text: 'Subes atributos, pero existe riesgo de lesión.' },
    { id: 'technique', icon: '🎯', title: 'Perfeccionar tu técnica', text: 'Mejoras técnica, pase y regate.' },
    { id: 'physical', icon: '🏋️', title: 'Trabajar el físico', text: 'Ganas velocidad y resistencia con riesgo moderado.' },
    { id: 'relation-coach', icon: '🗣️', title: 'Hablar con el entrenador', text: 'Buscas más confianza y minutos.' },
    { id: 'agent', icon: '📞', title: 'Reunirte con tu representante', text: 'Mejoras tus opciones de contrato o transferencia.' },
    { id: 'prohibited', icon: '⚠️', title: 'Usar una sustancia prohibida', text: 'Decisión ficticia de alto riesgo: puedes mejorar o recibir un año de suspensión.' },
    { id: 'rest', icon: '🛌', title: 'Cuidar tu recuperación', text: 'Reduces fatiga y proteges tu estado físico.' },
    { id: 'transfer', icon: '🔁', title: 'Buscar otro equipo', text: 'Exploras una oportunidad diferente dentro de la liga.' }
  ] : [
    { id: 'academy-train', icon: '⚽', title: 'Entrenar con la academia', text: 'Mejoras tus fundamentos y llamas la atención del club.' },
    { id: 'academy-tournament', icon: '🏆', title: 'Jugar torneo juvenil', text: 'Buscas destacar y sumar experiencia competitiva.' },
    { id: 'academy-study', icon: '📚', title: 'Estudiar táctica', text: 'Mejoras visión, mentalidad y disciplina.' },
    { id: 'relation-coach', icon: '🗣️', title: 'Hablar con el entrenador', text: 'Construyes confianza dentro de las fuerzas básicas.' },
    { id: 'rest', icon: '🛌', title: 'Cuidar tu recuperación', text: 'Reduces fatiga y proteges tu desarrollo.' },
    { id: 'transfer', icon: '🔁', title: 'Buscar otra academia', text: 'Exploras un proyecto juvenil distinto.' }
  ];
  return shuffle(mainOptions).slice(0, 3).concat([
    { id: 'family-stay', icon: '🏠', title: 'Quedarte por el proyecto', text: 'Tu familia no está a gusto, pero continúas: tu media baja 4 puntos.' },
    { id: 'family-transfer', icon: '🚗', title: 'Salir por tu familia', text: 'Cambias de equipo y tu media se mantiene.' },
    { id: 'family-loan', icon: '🤝', title: 'Buscar una cesión familiar', text: 'Buscas una cesión y mantienes tu media actual.' }
  ]);
}

function startPlayerMode() {
  gameState = { ...defaultGameState(), mode: 'player', phase: 'player-create' };
  saveGameState();
  renderJuego();
}

function createPlayerProfile(data) {
  const name = String(data.name || '').trim();
  const nationality = String(data.nationality || '').trim();
  const validLetters = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
  if (name.length < 2 || nationality.length < 2 || !validLetters.test(name) || !validLetters.test(nationality)) {
    gameState.currentSeasonNote = 'Escribe nombre y nacionalidad usando únicamente letras y espacios.';
    saveGameState();
    renderJuego();
    return;
  }
  const position = playerPositionOptions().includes(data.position) ? data.position : 'Mediocampista';
  const profile = playerProfileOptions().some((item) => item.id === data.profile) ? data.profile : 'boxToBox';
  const attributes = playerBuildAttributes(position, profile);
  const teams = shuffle(gameTeams()).slice(0, 3);
  gameState = {
    ...defaultGameState(),
    mode: 'player',
    phase: 'offers',
    playerName: name,
    playerNationality: nationality,
    playerPosition: position,
    playerFoot: data.foot === 'Izquierdo' ? 'Izquierdo' : 'Derecho',
    playerProfile: profile,
    playerAttributes: attributes,
    playerHidden: { potential: randomNumber(72, 96), professionalism: randomNumber(45, 85), discipline: randomNumber(50, 90), consistency: randomNumber(45, 82), personality: randomNumber(45, 85) },
    startOptions: teams.map((team) => team.abreviatura),
    currentSeasonNote: `${name} tiene 16 años y busca su primera oportunidad en una academia.`
  };
  playerRecalculateSkill();
  saveGameState();
  renderJuego();
}

function selectStartingTeam(abbreviation) {
  const team = getGameTeam(abbreviation);
  if (!team) return;
  gameState.teamAbbreviation = team.abreviatura;
  gameState.playerStage = 'academy';
  gameState.playerRole = 'Canterano';
  gameState.playerClubs = [team.nombre];
  gameState.phase = 'career';
  gameState.seasonOptions = drawSeasonOptions();
  gameState.currentSeasonNote = `Comienzas tu formación con ${team.nombre} a los 16 años. Todavía perteneces a las fuerzas básicas.`;
  playerAddNews(gameState.currentSeasonNote, 'Academia');
  saveGameState();
  renderJuego();
}

function playerApplyInjury() {
  gameState.injured = true;
  gameState.injuries += 1;
  gameState.playerFitness = Math.max(35, gameState.playerFitness - 20);
  gameState.playerCoachTrust = Math.max(0, gameState.playerCoachTrust - 2);
  playerAdjustOverall(-1);
}

function performSeasonAction(actionId) {
  if (gameState.actionUsed || gameState.phase !== 'career') return;
  if (!getGameTeam(gameState.teamAbbreviation)) return;
  gameState.actionUsed = true;
  gameState.injured = false;
  gameState.suspended = false;
  gameState.playerCurrentMatch = null;
  gameState.playerFatigue = Math.min(100, gameState.playerFatigue + 8);

  if (actionId === 'academy-train') { playerAdjustAttributes({ tecnica: 3, pase: 2, mentalidad: 1 }); gameState.playerCoachTrust += 5; gameState.currentSeasonNote = 'El trabajo en la academia mejoró tus fundamentos y el entrenador comenzó a seguirte de cerca.'; }
  if (actionId === 'academy-tournament') { playerAdjustAttributes({ tecnica: 2, tiro: 2, mentalidad: 3 }); gameState.playerCoachTrust += 8; gameState.playerPopularity += 4; gameState.currentSeasonNote = 'Destacaste en un torneo juvenil y varios visores anotaron tu nombre.'; }
  if (actionId === 'academy-study') { playerAdjustAttributes({ vision: 3, mentalidad: 3, pase: 1 }); gameState.playerHidden.professionalism += 4; gameState.currentSeasonNote = 'Estudiaste táctica y comprendiste mejor tus responsabilidades dentro del campo.'; }
  if (actionId === 'training') { playerAdjustAttributes({ fisico: 3, resistencia: 3, mentalidad: 2 }); if (Math.random() < .2) { playerApplyInjury(); gameState.currentSeasonNote = 'Entrenaste fuerte, pero sufriste una lesión. Tu media baja 1 punto y perderás ritmo.'; } else gameState.currentSeasonNote = 'El entrenamiento elevó tu nivel y ganaste la confianza del cuerpo técnico.'; }
  if (actionId === 'technique') { playerAdjustAttributes({ tecnica: 3, pase: 3, regate: 2 }); gameState.currentSeasonNote = 'Tu técnica mejoró y generaste más oportunidades para el equipo.'; }
  if (actionId === 'physical') { playerAdjustAttributes({ velocidad: 3, resistencia: 3, fisico: 2 }); if (Math.random() < .15) { playerApplyInjury(); gameState.currentSeasonNote = 'El trabajo físico dio resultados, aunque una lesión te quitó parte del año.'; } else gameState.currentSeasonNote = 'Tu potencia física y resistencia mejoraron de manera visible.'; }
  if (actionId === 'relation-coach') { gameState.playerCoachTrust = Math.min(100, gameState.playerCoachTrust + 12); gameState.playerMorale = Math.min(100, gameState.playerMorale + 4); gameState.currentSeasonNote = 'Hablaste con el entrenador, entendiste su plan y ganaste confianza.'; }
  if (actionId === 'agent') { gameState.playerAgent = { ...gameState.playerAgent, reputation: Math.min(100, gameState.playerAgent.reputation + 8) }; gameState.playerCurrentMatch = null; gameState.currentSeasonNote = 'Tu representante comenzó a explorar contratos, préstamos y oportunidades de mercado.'; }
  if (actionId === 'rest') { gameState.playerFatigue = Math.max(0, gameState.playerFatigue - 25); gameState.playerFitness = Math.min(100, gameState.playerFitness + 8); gameState.playerMorale = Math.min(100, gameState.playerMorale + 3); gameState.currentSeasonNote = 'Priorizaste la recuperación y llegaste con mejor estado físico al cierre del año.'; }
  if (actionId === 'transfer') playerTransferToRandomTeam('Aceptaste una oportunidad en otro proyecto');
  if (actionId === 'family-stay') { playerAdjustOverall(-4); gameState.playerMorale = Math.max(0, gameState.playerMorale - 12); gameState.currentSeasonNote = 'Tu familia no se siente cómoda en la ciudad, pero decidiste quedarte. Tu media bajó 4 puntos.'; }
  if (actionId === 'family-transfer') { playerTransferToRandomTeam('Saliste del equipo para cuidar a tu familia. Tu media se mantiene.'); gameState.playerMorale = Math.min(100, gameState.playerMorale + 5); }
  if (actionId === 'family-loan') { gameState.playerStage = 'loan'; playerTransferToRandomTeam('Acordaste una cesión para cuidar a tu familia. Tu media se mantiene.'); }
  if (actionId === 'prohibited') {
    if (Math.random() < .25) { gameState.suspended = true; gameState.playerSuspendedYears = 1; gameState.playerCoachTrust = Math.max(0, gameState.playerCoachTrust - 18); playerAdjustOverall(-6); gameState.currentSeasonNote = 'Fallaste un control ficticio y recibiste una suspensión de un año. Tu media bajó 6 puntos.'; playerAddNews(gameState.currentSeasonNote, 'Disciplina'); }
    else { playerAdjustOverall(8); gameState.playerHidden.discipline = Math.max(0, gameState.playerHidden.discipline - 10); gameState.currentSeasonNote = 'Tu rendimiento subió temporalmente, pero quedaste bajo observación disciplinaria.'; }
  }
  gameState.playerCoachTrust = playerClamp(gameState.playerCoachTrust, 0, 100);
  gameState.playerPopularity = playerClamp(gameState.playerPopularity, 0, 100);
  gameState.playerMorale = playerClamp(gameState.playerMorale, 0, 100);
  playerRecalculateSkill();
  playerAddNews(gameState.currentSeasonNote);
  saveGameState();
  renderJuego();
}

function playerSimulateMatch() {
  if (gameState.phase !== 'career' || gameState.age < 18 || gameState.actionUsed || gameState.playerStage === 'academy') return;
  const team = getGameTeam(gameState.teamAbbreviation);
  const match = playerNextMatch();
  const opponent = match ? ([match.local, match.visitante].find((name) => String(name).toLowerCase().includes(String(team?.nombre || '').toLowerCase()) === false) || 'Rival de liga') : 'Rival de preparación';
  const strength = gameState.skill + gameState.playerForm * .25 + gameState.playerCoachTrust * .15 + randomNumber(-12, 12);
  const result = strength > 76 ? 'Victoria' : strength > 62 ? 'Empate' : 'Derrota';
  const goals = result === 'Victoria' ? randomNumber(1, 3) : result === 'Empate' ? randomNumber(0, 1) : 0;
  const assists = gameState.playerPosition === 'Delantero' ? randomNumber(0, 1) : randomNumber(0, 2);
  const score = result === 'Victoria' ? `${goals}-${randomNumber(0, Math.max(0, goals - 1))}` : result === 'Empate' ? `${goals}-${goals}` : `0-${randomNumber(1, 3)}`;
  gameState.actionUsed = true;
  gameState.playerSeasonStats.appearances += 1;
  gameState.playerSeasonStats.starts += gameState.playerStage === 'firstTeam' ? 1 : 0;
  gameState.playerSeasonStats.goals += goals;
  gameState.playerSeasonStats.assists += assists;
  gameState.playerSeasonStats.minutes += randomNumber(35, 90);
  gameState.playerCurrentMatch = { opponent, score, result, goals, assists, minutes: gameState.playerSeasonStats.minutes, report: `Participaste como ${gameState.playerStage === 'firstTeam' ? 'titular' : 'suplente'} y dejaste buenas sensaciones.` };
  gameState.playerCoachTrust = playerClamp(gameState.playerCoachTrust + (result === 'Victoria' ? 5 : result === 'Empate' ? 2 : -2), 0, 100);
  gameState.playerPopularity = playerClamp(gameState.playerPopularity + (goals + assists) * 3 + (result === 'Victoria' ? 2 : 0), 0, 100);
  gameState.currentSeasonNote = `Informe: ${team?.nombre || 'Tu equipo'} ${score} ${opponent}. ${goals ? `Participaste en ${goals} gol${goals === 1 ? '' : 'es'}.` : 'Trabajaste para el equipo.'}`;
  playerAddNews(gameState.currentSeasonNote, 'Partido');
  saveGameState();
  renderJuego();
}

function playerEvaluatePromotion() {
  const score = gameState.skill * .55 + gameState.playerCoachTrust * .2 + gameState.playerHidden.professionalism * .15 + gameState.playerHidden.consistency * .1 + randomNumber(-8, 8);
  if (score >= 74) { gameState.playerStage = 'firstTeam'; gameState.playerRole = 'Titular'; gameState.currentSeasonNote = 'El club te promovió al primer equipo como una de sus grandes promesas.'; }
  else if (score >= 63) { gameState.playerStage = 'bench'; gameState.playerRole = 'Suplente'; gameState.currentSeasonNote = 'Te promovieron al primer equipo, aunque tendrás que luchar por minutos.'; }
  else if (score >= 51) { gameState.playerStage = 'loan'; gameState.playerRole = 'Cedido'; playerTransferToRandomTeam('El club decidió cederte para que sumes experiencia'); }
  else { gameState.playerStage = 'academy'; gameState.playerRole = 'Canterano'; gameState.currentSeasonNote = 'Continuarás un año más en fuerzas básicas para completar tu formación.'; }
  gameState.playerContract = { salary: Math.round(gameState.skill * 6500), years: 3, type: gameState.playerStage === 'academy' ? 'Formativo' : 'Primer contrato profesional' };
  playerAddNews(gameState.currentSeasonNote, 'Promoción');
}

function finishSeason() {
  if (!gameState.actionUsed || gameState.phase !== 'career') return;
  const team = getGameTeam(gameState.teamAbbreviation);
  if (!team) return;
  const performance = Math.max(0, Math.round((gameState.skill - 42) / 8) + randomNumber(0, 4));
  const generatedGoals = gameState.age < 18 || gameState.suspended || gameState.playerStage === 'academy' ? randomNumber(0, Math.min(3, performance)) : performance;
  const generatedAssists = gameState.age < 18 || gameState.suspended || gameState.playerStage === 'academy' ? randomNumber(0, 3) : randomNumber(1, Math.max(2, performance + 2));
  const goals = gameState.playerSeasonStats.goals || (gameState.injured ? Math.floor(generatedGoals / 2) : generatedGoals);
  const assists = gameState.playerSeasonStats.assists || (gameState.injured ? Math.floor(generatedAssists / 2) : generatedAssists);
  const trophies = drawPlayerTrophies(gameState.skill, gameState.suspended || gameState.age < 18 || gameState.playerStage === 'academy');
  const titles = trophies.length;
  const seasonStats = { ...gameState.playerSeasonStats, goals, assists, appearances: gameState.playerSeasonStats.appearances || (gameState.age >= 18 && gameState.playerStage !== 'academy' ? randomNumber(4, 18) : randomNumber(2, 8)) };
  gameState.history.push({ age: gameState.age, team: team.nombre, stage: playerStageLabel(), goals, assists, titles, trophies, stats: seasonStats });
  gameState.careerGoals += goals;
  gameState.careerAssists += assists;
  gameState.careerTitles += titles;
  gameState.careerTournaments = [...(gameState.careerTournaments || []), ...trophies.map((name) => ({ age: gameState.age, name }))];
  gameState.playerBigMoments = [...(gameState.playerBigMoments || []), ...trophies.map((name) => `${gameState.age} años: ganaste ${name}`)].slice(-20);
  playerAddNews(`${gameState.age} años: ${goals} goles, ${assists} asistencias y ${titles} títulos con ${team.nombre}.`, 'Temporada');

  if (gameState.age >= 40) {
    gameState.phase = 'finished';
    gameState.currentSeasonNote = `Te retiraste a los 40 años con ${gameState.careerGoals} goles, ${gameState.careerAssists} asistencias y ${gameState.careerTitles} títulos.`;
  } else {
    const previousAge = gameState.age;
    gameState.age += 1;
    gameState.actionUsed = false;
    gameState.injured = false;
    gameState.suspended = false;
    gameState.playerSuspendedYears = 0;
    gameState.playerCurrentMatch = null;
    gameState.playerSeasonStats = { appearances: 0, starts: 0, goals: 0, assists: 0, minutes: 0, cards: 0 };
    gameState.playerFatigue = Math.max(0, gameState.playerFatigue - 12);
    if (previousAge === 17) playerEvaluatePromotion();
    else gameState.currentSeasonNote = `Comienza tu temporada a los ${gameState.age} años como ${playerStageLabel().toLowerCase()}.`;
    gameState.seasonOptions = drawSeasonOptions();
  }
  saveGameState();
  renderJuego();
}

function resetGame() {
  gameState = defaultGameState();
  saveGameState();
  renderJuego();
}

function renderGameIntro(container) {
  container.innerHTML = `
    <article class="game-intro surface-card">
      <span class="eyebrow">ELIGE TU CAMINO</span>
      <h2>¿Cómo quieres vivir el fútbol?</h2>
      <p>Empieza una partida y toma decisiones que cambiarán tu historia.</p>
      <div class="game-role-grid">
        <button class="game-role-card" type="button" data-game-action="start-player">
          <span class="game-role-icon">⚽</span><strong>Jugador</strong><small>Crea un futbolista y construye una carrera de los 16 a los 40 años.</small>
        </button>
        <button class="game-role-card" type="button" data-game-action="start-director">
          <span class="game-role-icon">📋</span><strong>Director deportivo</strong><small>Fichajes, presupuesto y decisiones del club.</small><em>Jugar ahora</em>
        </button>
      </div>
    </article>
  `;
}

function renderPlayerCreate(container) {
  const positions = playerPositionOptions();
  const profiles = playerProfileOptions();
  container.innerHTML = `
    <article class="game-panel surface-card player-create-panel">
      <div class="game-panel-heading"><div><span class="eyebrow">CREA TU FUTBOLISTA</span><h2>Tu carrera comienza en la academia</h2></div><span class="game-season-badge">16 AÑOS</span></div>
      <p>Escribe únicamente letras. El jugador será ficticio y comenzará su historia en las fuerzas básicas.</p>
      <form class="player-create-form" data-game-form="player-create">
        <label>Nombre del jugador<input name="name" type="text" minlength="2" maxlength="40" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+" autocomplete="off" required placeholder="Ej. Diego Hernández"></label>
        <label>Nacionalidad<input name="nationality" type="text" minlength="2" maxlength="30" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+" autocomplete="off" required placeholder="Ej. Mexicana"></label>
        <label>Posición<select name="position">${positions.map((position) => `<option value="${gameEscape(position)}">${gameEscape(position)}</option>`).join('')}</select></label>
        <label>Pie dominante<select name="foot"><option>Derecho</option><option>Izquierdo</option></select></label>
        <label class="player-create-wide">Perfil<select name="profile">${profiles.map((profile) => `<option value="${gameEscape(profile.id)}">${gameEscape(profile.label)} · ${gameEscape(profile.text)}</option>`).join('')}</select></label>
        <button class="primary-btn player-create-wide" type="submit">Crear jugador y ver ofertas</button>
      </form>
    </article>
  `;
}

function renderPlayerOffers(container) {
  const options = gameState.startOptions.map(getGameTeam).filter(Boolean);
  container.innerHTML = `
    <article class="game-panel surface-card">
      <div class="game-panel-heading"><div><span class="eyebrow">PRIMERA OPORTUNIDAD</span><h2>${gameEscape(gameState.playerName)}</h2></div><span class="game-season-badge">16 AÑOS</span></div>
      <p>${gameEscape(gameState.playerNationality)} · ${gameEscape(gameState.playerPosition)} · Perfil ${gameEscape(playerProfileLabel())}. Estas son tres academias aleatorias que pueden iniciar tu historia.</p>
      <div class="game-team-options">${options.map((team) => `<button class="game-team-option" type="button" data-game-action="select-team" data-team="${gameEscape(team.abreviatura)}"><strong>${gameEscape(team.nombre)}</strong><small>Fuerzas básicas · Desarrollo juvenil</small><span>Elegir academia →</span></button>`).join('')}</div>
      <button class="text-btn" type="button" data-game-action="start-player">Crear otro jugador</button>
    </article>
  `;
}

function renderPlayerCareer(container) {
  const team = getGameTeam(gameState.teamAbbreviation);
  const options = gameState.seasonOptions || [];
  const history = [...gameState.history].reverse();
  const tournaments = [...(gameState.careerTournaments || [])].reverse();
  const trophySummary = tournaments.length ? `<div class="game-trophy-summary"><strong>Trofeos ganados</strong>${tournaments.map((trophy) => `<span>${trophy.age} años · ${gameEscape(trophy.name)}</span>`).join('')}</div>` : '<div class="game-trophy-summary"><strong>Trofeos ganados</strong><span>Aún no has ganado torneos.</span></div>';
  const attributes = Object.entries(gameState.playerAttributes || {});
  const attributeLabels = { tecnica: 'Técnica', pase: 'Pase', regate: 'Regate', velocidad: 'Velocidad', tiro: 'Tiro', defensa: 'Defensa', fisico: 'Físico', vision: 'Visión', resistencia: 'Resistencia', mentalidad: 'Mentalidad' };
  const nextMatch = playerNextMatch();
  const matchOpponent = nextMatch ? `${nextMatch.local} vs ${nextMatch.visitante}` : 'No hay partido cargado; puedes jugar un amistoso ficticio.';
  const news = (gameState.playerNews || []).slice(0, 5);
  const contractText = gameState.playerContract ? `${gameState.playerContract.type} · ${directorMoney(gameState.playerContract.salary)} al año · ${gameState.playerContract.years} años` : 'Contrato formativo por definir';
  container.innerHTML = `
    <div class="game-career-layout">
      <article class="game-profile surface-card">
        <span class="eyebrow">CARRERA DE JUGADOR</span>
        <div class="game-profile-top"><div class="game-avatar">${gameState.age}</div><div><h2>${gameEscape(gameState.playerName || 'Jugador')}</h2><p>${gameEscape(team?.nombre || 'Equipo pendiente')} · ${gameEscape(playerStageLabel())}</p></div></div>
        <div class="game-stat-grid"><div><span>Edad</span><strong>${gameState.age}</strong></div><div><span>Media</span><strong>${gameState.skill}</strong></div><div><span>Goles</span><strong>${gameState.careerGoals}</strong></div><div><span>Asistencias</span><strong>${gameState.careerAssists}</strong></div><div><span>Títulos</span><strong>${gameState.careerTitles}</strong></div><div><span>Lesiones</span><strong>${gameState.injuries}</strong></div><div><span>Confianza DT</span><strong>${gameState.playerCoachTrust}/100</strong></div><div><span>Popularidad</span><strong>${gameState.playerPopularity}/100</strong></div></div>
        <div class="player-detail-list"><span><strong>Posición:</strong> ${gameEscape(gameState.playerPosition)} · Pie ${gameEscape(gameState.playerFoot)}</span><span><strong>Perfil:</strong> ${gameEscape(playerProfileLabel())}</span><span><strong>Contrato:</strong> ${gameEscape(contractText)}</span><span><strong>Representante:</strong> ${gameEscape(gameState.playerAgent?.name || 'Por conocer')}</span></div>
        <p class="game-save-note">La partida se guarda en este navegador.</p>
        <button class="text-btn" type="button" data-game-action="reset-game">Reiniciar carrera</button>
      </article>
      <article class="game-panel surface-card">
        <div class="game-panel-heading"><div><span class="eyebrow">DECISIÓN DE TEMPORADA</span><h2>¿Qué harás este año?</h2></div><span class="game-season-badge">${gameState.age} AÑOS · ${gameEscape(playerStageLabel())}</span></div>
        <p class="game-event-note">${gameEscape(gameState.currentSeasonNote)}</p>
        ${gameState.phase === 'finished' ? `<div class="game-finished"><strong>¡Carrera completada a los 40 años!</strong><p>${gameEscape(gameState.currentSeasonNote)}</p>${trophySummary}<button class="primary-btn" type="button" data-game-action="reset-game">Comenzar otra carrera</button></div>` : gameState.actionUsed ? `<div class="game-action-complete"><strong>Decisión registrada</strong><p>Revisa el resumen y cierra la temporada para avanzar.</p>${gameState.playerCurrentMatch ? `<div class="player-match-report"><strong>${gameEscape(gameState.playerCurrentMatch.score)} vs ${gameEscape(gameState.playerCurrentMatch.opponent)}</strong><span>${gameEscape(gameState.playerCurrentMatch.report)}</span><span>${gameState.playerCurrentMatch.goals} goles · ${gameState.playerCurrentMatch.assists} asistencias · ${gameState.playerCurrentMatch.minutes} minutos</span></div>` : ''}<button class="primary-btn" type="button" data-game-action="finish-season">Cerrar temporada</button></div>` : `<div class="player-status-strip"><span>Estado físico ${gameState.playerFitness}/100</span><span>Ánimo ${gameState.playerMorale}/100</span><span>Fatiga ${gameState.playerFatigue}/100</span></div><div class="game-action-grid">${options.map((option) => `<button class="game-action-card" type="button" data-game-action="season-action" data-action-id="${gameEscape(option.id)}"><span>${option.icon}</span><strong>${gameEscape(option.title)}</strong><small>${gameEscape(option.text)}</small></button>`).join('')}</div>${gameState.age >= 18 && gameState.playerStage !== 'academy' ? `<div class="player-match-panel"><strong>Próximo partido</strong><span>${gameEscape(matchOpponent)}</span><button class="ghost-btn" type="button" data-game-action="player-simulate-match">Simular partido</button></div>` : ''}`}
      </article>
    </div>
    <div class="player-dashboard-grid">
      <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">DESARROLLO</span><h2>Atributos visibles</h2></div><span>Potencial oculto</span></div><div class="player-attributes-grid">${attributes.map(([key, value]) => `<div><span>${gameEscape(attributeLabels[key] || key)}</span><strong>${value}</strong><i style="width:${value}%"></i></div>`).join('')}</div></article>
      <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">VIDA PROFESIONAL</span><h2>Entorno</h2></div></div><div class="player-career-facts"><span><strong>Clubes:</strong> ${gameEscape((gameState.playerClubs || []).join(' · ') || 'Academia')}</span><span><strong>Relación con afición:</strong> ${gameState.playerFanRelation}/100</span><span><strong>Agente:</strong> reputación ${gameState.playerAgent?.reputation || 0}/100</span><span><strong>Valor estimado:</strong> ${directorMoney(gameState.playerMarketValue)}</span></div>${news.length ? `<div class="player-news-list">${news.map((item) => `<span><strong>${gameEscape(item.category)}</strong> · ${gameEscape(item.text)}</span>`).join('')}</div>` : ''}</article>
    </div>
    <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">PALMARÉS Y ESTADÍSTICAS</span><h2>Tu historia temporada a temporada</h2></div><span>${history.length} temporadas</span></div>${history.length ? `<div class="game-history-list">${history.map((season) => `<div class="game-history-row"><strong>${season.age} años</strong><span>${gameEscape(season.team)} · ${gameEscape(season.stage || '')}</span><span>${season.goals} goles</span><span>${season.assists} asistencias</span><span>${season.trophies?.length ? season.trophies.map((name) => gameEscape(name)).join(', ') : 'Sin títulos'}</span></div>`).join('')}</div>` : '<div class="empty-state">Tu primera temporada aparecerá aquí.</div>'}</article>
  `;
}

function renderDirectorTeamChoice(container) {
  const teams = gameTeams();
  container.innerHTML = `
    <article class="game-panel surface-card">
      <div class="game-panel-heading"><div><span class="eyebrow">MODO DIRECTOR DEPORTIVO</span><h2>Elige el club que dirigirás</h2></div><span class="game-season-badge">$30 M MXN</span></div>
      <p>Comienzas la primera temporada con un presupuesto ficticio de 30 millones de pesos. Las plantillas se leen desde los jugadores registrados en Supabase.</p>
      <div class="director-team-grid">${teams.map((team) => `<button class="director-team-card" type="button" data-game-action="select-director-team" data-team="${gameEscape(team.abreviatura)}"><strong>${gameEscape(team.nombre)}</strong><small>Elegir club →</small></button>`).join('')}</div>
      <button class="text-btn" type="button" data-game-action="reset-game">Volver a elegir modo</button>
    </article>
  `;
}

function renderDirectorDecisionCenter() {
  const decisions = gameState.directorDecisions || [];
  return `<article class="game-history surface-card director-decision-center"><div class="game-panel-heading"><div><span class="eyebrow">CENTRO DE DECISIONES</span><h2>Situaciones pendientes</h2></div><span>${decisions.length} pendientes</span></div>${decisions.length ? decisions.map((decision) => `<div class="director-decision-card"><strong>${gameEscape(decision.title)}</strong><p>${gameEscape(decision.text)}</p><div>${decision.options.map((option) => `<button class="primary-btn" type="button" data-game-action="director-decision" data-decision-id="${gameEscape(decision.id)}" data-option-id="${gameEscape(option.id)}">${gameEscape(option.label)}</button><small>${gameEscape(option.text)}</small>`).join('')}</div></div>`).join('') : '<div class="empty-state">No hay decisiones pendientes.</div>'}</article>`;
}

function renderDirectorNews() {
  const news = (gameState.directorNews || []).slice(0, 5);
  return `<article class="game-history surface-card director-news"><div class="game-panel-heading"><div><span class="eyebrow">NOTICIAS DEL CLUB</span><h2>El mundo reacciona</h2></div><span>${news.length} recientes</span></div>${news.length ? news.map((item) => `<div class="director-news-row"><strong>${gameEscape(item.category)}</strong><span>${gameEscape(item.text)}</span></div>`).join('') : '<div class="empty-state">Las noticias aparecerán al tomar decisiones.</div>'}</article>`;
}

function renderDirectorMatchReport() {
  const report = gameState.directorMatchReport;
  if (!report) return `<article class="game-history surface-card director-match-card"><div class="game-panel-heading"><div><span class="eyebrow">PRÓXIMO PARTIDO</span><h2>Listo para simular</h2></div></div><p>Simula el próximo partido para conocer el resultado, asistencia e incidencias.</p><button class="primary-btn" type="button" data-game-action="director-simulate-match">Simular próximo partido</button></article>`;
  return `<article class="game-history surface-card director-match-card"><div class="game-panel-heading"><div><span class="eyebrow">INFORME DEL PARTIDO</span><h2>${gameEscape(report.score)} vs ${gameEscape(report.opponent)}</h2></div><span>${gameEscape(report.result)}</span></div><div class="director-match-report-grid"><div><span>Posesión</span><strong>${report.possession}%</strong></div><div><span>Tiros</span><strong>${report.shots}</strong></div><div><span>A puerta</span><strong>${report.shotsOnTarget}</strong></div><div><span>Tarjetas</span><strong>${report.cards}</strong></div><div><span>Asistencia</span><strong>${report.attendance.toLocaleString('es-MX')}</strong></div><div><span>Figura</span><strong>${gameEscape(report.scorer)}</strong></div></div>${report.injury ? `<p class="director-alert">Lesión: ${gameEscape(report.injury)} queda bajo observación médica.</p>` : ''}<button class="primary-btn" type="button" data-game-action="director-simulate-match">Simular siguiente partido</button></article>`;
}

function renderDirectorNegotiation() {
  const negotiation = gameState.directorNegotiation;
  if (!negotiation) return '';
  const player = gameState.directorMarket.find((item) => item.key === negotiation.playerKey);
  if (!player) return '';
  const requested = player.releaseClause || player.value;
  const canAsk = negotiation.stage === 'interest' || negotiation.stage === 'contacted';
  return `<article class="director-negotiation-card"><div><span class="eyebrow">NEGOCIACIÓN</span><h3>${gameEscape(player.name)}</h3><p>${gameEscape(player.position)} · ${gameEscape(player.teamName)} · ${gameEscape(player.nationality)}</p></div><strong>Precio solicitado: ${directorMoney(requested)}</strong>${canAsk ? `<div class="director-negotiation-actions"><button class="primary-btn" type="button" data-game-action="director-contact-club">Contactar al club</button><button class="ghost-btn" type="button" data-game-action="director-ask-price">Preguntar precio</button></div>` : `<label>Tu oferta<input type="number" min="0" step="100000" value="${gameEscape(negotiation.offer || requested)}" data-game-input="director-offer"></label><div class="director-negotiation-actions"><button class="primary-btn" type="button" data-game-action="director-submit-negotiation">Enviar oferta</button><button class="ghost-btn" type="button" data-game-action="director-cancel-negotiation">Cancelar</button></div>${negotiation.stage === 'counter' ? '<small>El club presentó una contraoferta. Ajusta el monto para continuar.</small>' : ''}`}</article>`;
}

function renderDirectorCareerFinished(container) {
  const history = [...(gameState.directorClubHistory || [])].reverse();
  container.innerHTML = `<article class="game-panel surface-card"><span class="eyebrow">CARRERA COMPLETADA</span><h2>Terminaste ${gameState.directorMaxSeasons} temporadas</h2><p>${gameEscape(gameState.directorMessage)}</p><div class="game-history-list">${history.slice(0, 12).map((item) => `<div class="game-history-row"><strong>T${item.season}</strong><span>Lugar ${item.position}</span><span>${item.trophies.length ? item.trophies.map((trophy) => gameEscape(trophy)).join(', ') : 'Sin trofeos'}</span><span>${directorMoney(item.budget)}</span></div>`).join('')}</div><button class="primary-btn" type="button" data-game-action="reset-game">Comenzar nueva carrera</button></article>`;
}

function renderDirectorDashboard(container) {
  const team = getGameTeam(gameState.teamAbbreviation);
  if (!gameState.directorDataLoaded) {
    container.innerHTML = '<article class="surface-card empty-state">Cargando plantilla y mercado de jugadores...</article>';
    return;
  }
  directorPrepareDashboard();
  const market = gameState.directorMarket || [];
  const offers = gameState.directorOffers || [];
  const roster = gameState.directorRoster || [];
  const profile = gameState.directorClubProfile || directorClubProfile(team);
  const finance = gameState.directorFinances || defaultGameState().directorFinances;
  if (!(gameState.directorLineup || []).length && roster.length) {
    gameState.directorLineup = directorStartingLineup();
    saveGameState();
  }
  const query = String(gameState.directorMarketQuery || '').trim().toLowerCase();
  const visibleMarket = market.filter((player) => !query || `${player.name} ${player.teamName} ${player.position}`.toLowerCase().includes(query));
  const marketToRender = visibleMarket.slice(0, 12);
  const history = [...(gameState.directorHistory || [])].reverse();
  const foreignCount = directorForeignCount();
  const startingForeignCount = (gameState.directorLineup || []).filter((key) => {
    const player = roster.find((item) => item.key === key);
    return player && !directorIsMexican(player);
  }).length;
  const nextMatch = directorNextMatch();
  const nextMatchText = nextMatch ? `${nextMatch.local} vs ${nextMatch.visitante}` : 'Sin partido cargado';
  const budgetWarning = gameState.directorBudget < 100000 ? '<div class="director-alert director-alert-danger">La directiva te despidió por bajar de 100 mil pesos.</div>' : gameState.directorBudget < 500000 ? '<div class="director-alert">Advertencia: tienes menos de 500 mil pesos y tu puesto está en riesgo.</div>' : '';
  const disabled = gameState.directorFired ? 'disabled' : '';
  container.innerHTML = `
    ${renderDirectorDecisionCenter()}
    ${renderDirectorNews()}
    ${renderDirectorMatchReport()}
    <div class="director-dashboard-layout">
      <article class="game-profile surface-card">
        <span class="eyebrow">MODO DIRECTOR DEPORTIVO</span>
        <div class="game-profile-top"><div class="game-avatar">${gameState.directorSeason}</div><div><h2>${gameEscape(team?.nombre || 'Club')}</h2><p>Temporada ${gameState.directorSeason} · Balance del club</p></div></div>
        <div class="director-budget"><span>Caja del club · pesos ficticios</span><strong>${directorMoney(gameState.directorBudget)}</strong></div>
        ${budgetWarning}
        <div class="game-stat-grid"><div><span>Jugadores</span><strong>${roster.length}/30</strong></div><div><span>Extranjeros</span><strong>${foreignCount}/9</strong></div><div><span>Titulares extranjeros</span><strong>${startingForeignCount}/7</strong></div><div><span>Posición</span><strong>${gameState.directorPosition}/18</strong></div><div><span>Afición</span><strong>${gameState.directorFanSatisfaction}/100</strong></div><div><span>Reputación</span><strong>${profile.reputation}</strong></div><div><span>Cantera</span><strong>Nivel ${gameState.directorYouthLevel}</strong></div><div><span>Objetivo</span><strong>${gameEscape(profile.boardObjective)}</strong></div></div>
        <div class="director-club-profile"><strong>Perfil ${gameEscape(profile.clubType)}</strong><span>${gameEscape(profile.city)} · ${gameEscape(profile.region)} · Fundación ${profile.foundation}</span><span>${gameEscape(profile.stadium)} · Capacidad ${profile.capacity.toLocaleString('es-MX')}</span><span>Instalaciones ${profile.facilities}/10 · Academia ${profile.academy}/10 · Scouting ${profile.scouting}/10</span><span>Patrocinadores: ${profile.sponsors.map((sponsor) => gameEscape(sponsor)).join(', ')}</span><span>TV: ${gameEscape(profile.tvContract)} · Valor de plantilla ${directorMoney(profile.squadValue)}</span></div>
        <div class="director-finance-list"><div><span>Fichajes</span><strong>${directorMoney(finance.transferBudget)}</strong></div><div><span>Salarios</span><strong>${directorMoney(finance.wageBudget)}</strong></div><div><span>Gasto salarial</span><strong>${directorMoney(finance.wageExpense)}</strong></div><div><span>Deuda</span><strong>${directorMoney(finance.debt)}</strong></div><div><span>Ingresos previstos</span><strong>${directorMoney(finance.projectedIncome)}</strong></div><div><span>Próximo partido</span><strong>${gameEscape(nextMatchText)}</strong></div></div>
        <p class="game-event-note">${gameEscape(gameState.directorMessage)}</p>
        <div class="director-controls"><button class="primary-btn" type="button" data-game-action="director-simulate" ${disabled}>Simular temporada</button><button class="ghost-btn" type="button" data-game-action="director-sponsorship" ${gameState.directorTvDeal || gameState.directorFired ? 'disabled' : ''}>Firmar patrocinio +$4 M</button><button class="ghost-btn" type="button" data-game-action="director-academy" ${disabled}>Invertir cantera -$2 M</button></div>
        <div class="director-management-grid"><div><strong>Taquilla</strong><span>${directorMoney(gameState.directorTicketPrice)} por entrada</span><div><button class="text-btn" type="button" data-game-action="director-ticket-down" ${disabled}>-$50</button><button class="text-btn" type="button" data-game-action="director-ticket-up" ${disabled}>+$50</button></div></div><div><strong>Merchandising</strong><span>Nivel ${gameState.directorMerchandisingLevel}</span><button class="text-btn" type="button" data-game-action="director-merchandising" ${disabled}>Invertir $1 M</button></div><div><strong>Cuerpo técnico</strong><span>DT ${gameState.directorStaff.coach.level} · Scout ${gameState.directorStaff.scout.level} · Médico ${gameState.directorStaff.medical.level}</span><div><button class="text-btn" type="button" data-game-action="director-hire-staff" data-staff-type="coach" ${disabled}>Mejorar DT</button><button class="text-btn" type="button" data-game-action="director-hire-staff" data-staff-type="scout" ${disabled}>Mejorar scout</button><button class="text-btn" type="button" data-game-action="director-hire-staff" data-staff-type="medical" ${disabled}>Mejorar médico</button></div></div><div><strong>Instalaciones</strong><span>Centro ${gameState.directorInstallationLevels.training} · Médico ${gameState.directorInstallationLevels.medical} · General ${gameState.directorInstallationLevels.facilities}</span><div><button class="text-btn" type="button" data-game-action="director-installation" data-installation="training" ${disabled}>Entrenamiento</button><button class="text-btn" type="button" data-game-action="director-installation" data-installation="medical" ${disabled}>Médico</button><button class="text-btn" type="button" data-game-action="director-installation" data-installation="facilities" ${disabled}>General</button></div></div></div>
        <button class="text-btn" type="button" data-game-action="reset-game">Salir y reiniciar partida</button>
      </article>
      <article class="game-panel surface-card">
        <div class="game-panel-heading"><div><span class="eyebrow">MERCADO NACIONAL E INTERNACIONAL</span><h2>Buscar jugadores</h2></div><span>${visibleMarket.length}/${market.length} opciones</span></div>
        <input class="director-market-search" type="search" placeholder="Buscar jugador, posición o club..." value="${gameEscape(gameState.directorMarketQuery || '')}" data-game-input="director-market-search">
        ${renderDirectorNegotiation()}
        <div class="director-market-grid">${marketToRender.length ? marketToRender.map((player) => `<div class="director-market-card"><div><strong>${gameEscape(player.name)}</strong><small>${gameEscape(player.position)} · ${gameEscape(player.teamName)} · ${player.age} años · ${gameEscape(player.nationality)}</small><small>${player.releaseClause ? `Cláusula ${directorMoney(player.releaseClause)}` : player.negotiationAvailable ? (player.willingToJoin ? 'Oferta negociable' : 'Puede rechazar') : 'No disponible esta ventana'}</small></div><button class="primary-btn" type="button" data-game-action="director-start-negotiation" data-player-key="${gameEscape(player.key)}" ${disabled || !player.negotiationAvailable ? 'disabled' : ''}>Abrir negociación</button></div>`).join('') : '<div class="empty-state">No hay jugadores que coincidan con tu búsqueda.</div>'}${visibleMarket.length > marketToRender.length ? `<p class="game-save-note">Se muestran 12 resultados. Refina tu búsqueda para encontrar un jugador específico.</p>` : ''}</div>
      </article>
    </div>
    <div class="director-lower-grid">
      <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">OFERTAS POR TU PLANTILLA</span><h2>Decide si vendes</h2></div></div>${offers.length ? `<div class="director-offer-list">${offers.map((offer) => `<div class="director-market-card"><div><strong>${gameEscape(offer.name)}</strong><small>${gameEscape(offer.buyerTeam)} ofrece ${directorMoney(offer.amount)}</small></div><button class="primary-btn director-accept-sale" type="button" data-game-action="director-sell" data-offer-id="${gameEscape(offer.offerId)}" ${disabled || roster.length <= 22 ? 'disabled' : ''}>${roster.length <= 22 ? 'Mínimo 22 jugadores' : 'Aceptar venta'}</button></div>`).join('')}</div>` : '<div class="empty-state">Todavía no hay ofertas por tus jugadores.</div>'}<p class="game-save-note">La plantilla debe conservar al menos 22 jugadores.</p></article>
      <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">PLANTILLA ACTUAL</span><h2>Jugadores del club</h2></div><span>${roster.length} registrados</span></div><div class="director-roster-list">${roster.slice(0, 10).map((player) => `<div><strong>${gameEscape(player.name)}${player.onLoan ? ' · cedido' : ''}</strong><span>${gameEscape(player.position)} · ${gameEscape(player.nationality)} · Salario ${directorMoney(player.salary)} · Valor ${directorMoney(player.value)} ${!player.onLoan ? `<button class="text-btn" type="button" data-game-action="director-loan" data-player-key="${gameEscape(player.key)}" ${disabled}>Ceder</button>` : `<small>Regresa T${player.loanReturnSeason}</small>`}</span></div>`).join('')}</div>${roster.length > 10 ? `<p class="game-save-note">Se muestran 10 de ${roster.length} jugadores.</p>` : ''}${gameState.directorLoans?.length ? `<div class="director-loan-list"><strong>Préstamos activos e históricos</strong>${gameState.directorLoans.slice(-5).reverse().map((loan) => `<span>${gameEscape(loan.player)} → ${gameEscape(loan.club)} · ${directorMoney(loan.fee)}</span>`).join('')}</div>` : ''}</article>
    </div>
      <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">HISTORIAL FINANCIERO Y DEPORTIVO</span><h2>Temporadas simuladas</h2></div></div>${history.length ? `<div class="game-history-list">${history.map((item) => `<div class="game-history-row"><strong>Temporada ${item.season}</strong><span>Lugar ${item.position}</span><span>${item.trophies?.length ? item.trophies.map((name) => gameEscape(name)).join(', ') : 'Sin trofeos'}</span><span>${item.change >= 0 ? '+' : ''}${directorMoney(item.change)}</span><small>${gameEscape(item.note || '')}</small></div>`).join('')}</div>` : '<div class="empty-state">Los movimientos y resultados aparecerán aquí.</div>'}</article>
  `;
}

function renderDirectorJobOffers(container) {
  container.innerHTML = `
    <article class="game-panel surface-card">
      <span class="eyebrow">NUEVO DESAFÍO</span>
      <h2>La directiva terminó tu proyecto</h2>
      <p>${gameEscape(gameState.directorMessage)} Solo tienes dos ofertas para continuar tu carrera.</p>
      <div class="director-job-grid">${(gameState.directorJobOffers || []).map((offer) => `<button class="director-team-card" type="button" data-game-action="director-take-job" data-team="${gameEscape(offer.teamAbbreviation)}"><strong>${gameEscape(offer.teamName)}</strong><small>Presupuesto inicial ${directorMoney(offer.budget)}</small><small>Objetivo: ${gameEscape(offer.objective)}</small><span>Aceptar oferta →</span></button>`).join('')}</div>
      <button class="text-btn" type="button" data-game-action="reset-game">Terminar partida</button>
    </article>
  `;
}

function renderDirectorPreview(container) {
  container.innerHTML = `
    <article class="game-intro surface-card">
      <span class="eyebrow">MODO DIRECTOR DEPORTIVO</span>
      <h2>Modo director deportivo</h2>
      <p>Elige un club, administra 30 millones de dólares y toma el control del mercado.</p>
      <button class="primary-btn" type="button" data-game-action="start-director">Comenzar partida</button>
    </article>
  `;
}

function renderJuego() {
  const container = gameElement('game-container');
  if (!container) return;
  if (!gameTeams().length) {
    container.innerHTML = '<article class="surface-card empty-state">Cargando los 18 equipos desde Supabase...</article>';
    return;
  }
  if (gameState.phase === 'intro') renderGameIntro(container);
  if (gameState.phase === 'player-create') renderPlayerCreate(container);
  if (gameState.phase === 'offers') renderPlayerOffers(container);
  if (gameState.phase === 'career' || gameState.phase === 'finished') renderPlayerCareer(container);
  if (gameState.phase === 'director-preview') renderDirectorPreview(container);
  if (gameState.phase === 'director-choose-team') renderDirectorTeamChoice(container);
  if (gameState.phase === 'director-dashboard') renderDirectorDashboard(container);
  if (gameState.phase === 'director-job-offers') renderDirectorJobOffers(container);
  if (gameState.phase === 'director-career-finished') renderDirectorCareerFinished(container);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-game-action]');
  if (!button) return;
  const action = button.dataset.gameAction;
  if (action === 'start-player') startPlayerMode();
  if (action === 'start-director') startDirectorMode();
  if (action === 'select-team') selectStartingTeam(button.dataset.team);
  if (action === 'select-director-team') selectDirectorTeam(button.dataset.team);
  if (action === 'season-action') performSeasonAction(button.dataset.actionId);
  if (action === 'player-simulate-match') playerSimulateMatch();
  if (action === 'finish-season') finishSeason();
  if (action === 'director-buy') directorBuy(button.dataset.playerKey);
  if (action === 'director-sell') directorSell(button.dataset.offerId);
  if (action === 'director-sponsorship') directorSponsorship();
  if (action === 'director-academy') directorAcademy();
  if (action === 'director-loan') directorLoanPlayer(button.dataset.playerKey);
  if (action === 'director-hire-staff') directorHireStaff(button.dataset.staffType);
  if (action === 'director-ticket-up') directorChangeTicket('up');
  if (action === 'director-ticket-down') directorChangeTicket('down');
  if (action === 'director-merchandising') directorUpgradeMerchandising();
  if (action === 'director-installation') directorUpgradeInstallation(button.dataset.installation);
  if (action === 'director-simulate') directorSimulateSeason();
  if (action === 'director-simulate-match') directorSimulateMatch();
  if (action === 'director-decision') directorResolveDecision(button.dataset.decisionId, button.dataset.optionId);
  if (action === 'director-start-negotiation') directorStartNegotiation(button.dataset.playerKey);
  if (action === 'director-contact-club') directorContactClub();
  if (action === 'director-ask-price') directorAskPrice();
  if (action === 'director-submit-negotiation') directorSubmitNegotiation();
  if (action === 'director-cancel-negotiation') { gameState.directorNegotiation = null; saveGameState(); renderJuego(); }
  if (action === 'director-take-job') directorTakeJob(button.dataset.team);
  if (action === 'reset-game') resetGame();
  if (action === 'director-info') {
    startDirectorMode();
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-game-form="player-create"]');
  if (!form) return;
  event.preventDefault();
  createPlayerProfile(Object.fromEntries(new FormData(form).entries()));
});

document.addEventListener('change', (event) => {
  if (event.target.dataset.gameInput === 'director-market-search') gameState.directorMarketQuery = event.target.value;
  if (event.target.dataset.gameInput === 'director-offer' && gameState.directorNegotiation) gameState.directorNegotiation.offer = Number(event.target.value) || 0;
  if (!['director-market-search', 'director-offer'].includes(event.target.dataset.gameInput)) return;
  renderJuego();
});

window.renderJuego = renderJuego;
window.addEventListener('DOMContentLoaded', renderJuego);
