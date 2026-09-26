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
    age: 18,
    teamAbbreviation: '',
    skill: 60,
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
    directorJobOffers: []
  };
}

function loadGameState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(gameStorageKey) || 'null');
    const state = savedState ? { ...defaultGameState(), ...savedState } : defaultGameState();
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
  return {
    id: player.id,
    key: directorPlayerKey({ ...player, abreviatura: teamAbbreviation || player.abreviatura }, index),
    name: player.nombre || player.name || `Jugador de cantera ${index + 1}`,
    position: player.posicion || player.position || 'Jugador',
    age,
    value,
    salary,
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
  gameState.directorDataLoaded = true;
  directorBuildOffers();
  gameState.directorMessage = roster.length
    ? `Plantilla cargada. Puedes negociar con jugadores registrados en Supabase.`
    : 'No se encontró plantilla pública para este club; se cargó una plantilla de demostración para probar el modo.';
  saveGameState();
  renderJuego();
}

function directorBuy(playerKey) {
  const player = gameState.directorMarket.find((item) => item.key === playerKey);
  if (!player || gameState.directorFired) return;
  if (!player.negotiationAvailable) {
    gameState.directorMessage = `${player.name} no está disponible para negociar en esta ventana.`;
  } else if (!player.releaseClause && !player.willingToJoin) {
    gameState.directorMessage = `${player.name} rechazó la oferta porque no quiere ir al club.`;
  } else {
    const fee = player.releaseClause || player.value;
    if (gameState.directorBudget < fee) {
      gameState.directorMessage = `No tienes presupuesto suficiente para fichar a ${player.name}.`;
      saveGameState();
      renderJuego();
      return;
    }
    gameState.directorBudget -= fee;
    gameState.directorFinances.transferBudget = Math.max(0, Number(gameState.directorFinances.transferBudget || 0) - fee);
    gameState.directorRoster.push({ ...player, value: fee, teamAbbreviation: gameState.teamAbbreviation, teamName: getGameTeam(gameState.teamAbbreviation)?.nombre || '' });
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
  gameState.directorBudget += offer.amount;
  gameState.directorFinances.transferBudget = Number(gameState.directorFinances.transferBudget || 0) + offer.amount;
  gameState.directorRoster = gameState.directorRoster.filter((player) => player.key !== offer.key);
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
  }
  syncDirectorFinance();
  saveGameState();
  renderJuego();
}

function drawSeasonOptions() {
  const footballOptions = shuffle([
    { id: 'training', icon: '💪', title: 'Entrenar fuerte', text: 'Aumentas tu nivel, pero existe riesgo de lesión.' },
    { id: 'technique', icon: '🎯', title: 'Perfeccionar tu técnica', text: 'Mejoras tu rendimiento ofensivo de forma segura.' },
    { id: 'transfer', icon: '🔁', title: 'Buscar otro equipo', text: 'Exploras una oportunidad diferente dentro de la Liga MX.' },
    { id: 'rest', icon: '🛌', title: 'Cuidar tu recuperación', text: 'Avanzas con una mejora pequeña y reduces el desgaste.' },
    { id: 'prohibited', icon: '⚠️', title: 'Usar una sustancia prohibida', text: 'Es una decisión ficticia de alto riesgo: puedes mejorar o recibir suspensión.' }
  ]).slice(0, 3);
  return footballOptions.concat([
    { id: 'family-stay', icon: '🏠', title: 'Quedarte por el proyecto', text: 'Tu familia no está a gusto, pero decides continuar: tu media baja 4 puntos.' },
    { id: 'family-transfer', icon: '🚗', title: 'Salir por tu familia', text: 'Pides cambiar de equipo y mantienes tu media actual.' },
    { id: 'family-loan', icon: '🤝', title: 'Buscar una cesión familiar', text: 'Negocias una cesión a otro club y mantienes tu media actual.' }
  ]);
}

function startPlayerMode() {
  const teams = shuffle(gameTeams()).slice(0, 3);
  gameState = { ...defaultGameState(), mode: 'player', phase: 'offers', startOptions: teams.map((team) => team.abreviatura) };
  saveGameState();
  renderJuego();
}

function selectStartingTeam(abbreviation) {
  const team = getGameTeam(abbreviation);
  if (!team) return;
  gameState.teamAbbreviation = team.abreviatura;
  gameState.phase = 'career';
  gameState.seasonOptions = drawSeasonOptions();
  gameState.currentSeasonNote = `Comienzas tu carrera con ${team.nombre} a los 18 años.`;
  saveGameState();
  renderJuego();
}

function performSeasonAction(actionId) {
  if (gameState.actionUsed || gameState.phase !== 'career') return;
  const team = getGameTeam(gameState.teamAbbreviation);
  if (!team) return;

  gameState.actionUsed = true;
  gameState.injured = false;
  gameState.suspended = false;

  if (actionId === 'training') {
    gameState.skill += randomNumber(4, 8);
    if (Math.random() < 0.2) {
      gameState.injured = true;
      gameState.injuries += 1;
      gameState.skill -= 1;
      gameState.currentSeasonNote = 'Entrenaste fuerte, pero sufriste una lesión que redujo tu temporada.';
    } else {
      gameState.currentSeasonNote = 'El entrenamiento elevó tu nivel y ganaste la confianza del cuerpo técnico.';
    }
  }

  if (actionId === 'technique') {
    gameState.skill += randomNumber(2, 5);
    gameState.currentSeasonNote = 'Tu técnica mejoró y generaste más oportunidades de gol.';
  }

  if (actionId === 'transfer') {
    const otherTeams = gameTeams().filter((item) => item.abreviatura !== gameState.teamAbbreviation);
    const newTeam = shuffle(otherTeams)[0];
    if (newTeam) {
      gameState.teamAbbreviation = newTeam.abreviatura;
      gameState.currentSeasonNote = `Aceptaste una oportunidad y ahora juegas para ${newTeam.nombre}.`;
    }
  }

  if (actionId === 'family-stay') {
    gameState.skill -= 4;
    gameState.currentSeasonNote = 'Tu familia no se siente cómoda en la ciudad, pero decidiste quedarte por el proyecto. Tu media bajó 4 puntos.';
  }

  if (actionId === 'family-transfer' || actionId === 'family-loan') {
    const otherTeams = gameTeams().filter((item) => item.abreviatura !== gameState.teamAbbreviation);
    const newTeam = shuffle(otherTeams)[0];
    if (newTeam) {
      gameState.teamAbbreviation = newTeam.abreviatura;
      gameState.currentSeasonNote = actionId === 'family-transfer'
        ? `Saliste del equipo para cuidar a tu familia y ahora juegas para ${newTeam.nombre}. Tu media se mantiene.`
        : `Acordaste una cesión para cuidar a tu familia y jugarás para ${newTeam.nombre}. Tu media se mantiene.`;
    }
  }

  if (actionId === 'rest') {
    gameState.skill += 1;
    gameState.currentSeasonNote = 'Cuidaste tu recuperación y llegaste en mejores condiciones al cierre de temporada.';
  }

  if (actionId === 'prohibited') {
    if (Math.random() < 0.25) {
      gameState.suspended = true;
      gameState.skill -= 6;
      gameState.currentSeasonNote = 'La sustancia falló en el control ficticio del juego y recibiste una suspensión de un año.';
    } else {
      gameState.skill += 8;
      gameState.currentSeasonNote = 'Tu rendimiento subió temporalmente, pero quedaste bajo observación.';
    }
  }

  gameState.skill = Math.max(1, Math.min(99, gameState.skill));
  saveGameState();
  renderJuego();
}

function finishSeason() {
  if (!gameState.actionUsed || gameState.phase !== 'career') return;
  const team = getGameTeam(gameState.teamAbbreviation);
  if (!team) return;

  const performance = Math.max(1, Math.round((gameState.skill - 42) / 8) + randomNumber(1, 5));
  const goals = gameState.suspended ? 0 : Math.max(0, gameState.injured ? Math.floor(performance / 2) : performance);
  const assists = gameState.suspended ? 0 : Math.max(0, gameState.injured ? Math.floor(performance / 2) : randomNumber(1, performance + 3));
  const trophies = drawPlayerTrophies(gameState.skill, gameState.suspended);
  const titles = trophies.length;

  gameState.history.push({ age: gameState.age, team: team.nombre, goals, assists, titles, trophies });
  gameState.careerGoals += goals;
  gameState.careerAssists += assists;
  gameState.careerTitles += titles;
  gameState.careerTournaments = [...(gameState.careerTournaments || []), ...trophies.map((name) => ({ age: gameState.age, name }))];

  if (gameState.age >= 40) {
    gameState.phase = 'finished';
    gameState.currentSeasonNote = `Terminaste tu carrera con ${gameState.careerGoals} goles, ${gameState.careerAssists} asistencias y ${gameState.careerTitles} títulos.`;
  } else {
    gameState.age += 1;
    gameState.actionUsed = false;
    gameState.injured = false;
    gameState.suspended = false;
    gameState.seasonOptions = drawSeasonOptions();
    gameState.currentSeasonNote = `Comienza tu temporada a los ${gameState.age} años.`;
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
          <span class="game-role-icon">⚽</span><strong>Jugador</strong><small>Construye una carrera de los 18 a los 40 años.</small>
        </button>
        <button class="game-role-card" type="button" data-game-action="start-director">
          <span class="game-role-icon">📋</span><strong>Director deportivo</strong><small>Fichajes, presupuesto y decisiones del club.</small><em>Jugar ahora</em>
        </button>
      </div>
    </article>
  `;
}

function renderPlayerOffers(container) {
  const options = gameState.startOptions.map(getGameTeam).filter(Boolean);
  container.innerHTML = `
    <article class="game-panel surface-card">
      <div class="game-panel-heading"><div><span class="eyebrow">PRIMER CONTRATO</span><h2>Elige dónde comenzar</h2></div><span class="game-season-badge">18 AÑOS</span></div>
      <p>Estos son tres equipos aleatorios que te ofrecen iniciar tu carrera.</p>
      <div class="game-team-options">${options.map((team) => `<button class="game-team-option" type="button" data-game-action="select-team" data-team="${gameEscape(team.abreviatura)}"><strong>${gameEscape(team.nombre)}</strong><small>Contrato de desarrollo · Temporada 1</small><span>Elegir equipo →</span></button>`).join('')}</div>
      <button class="text-btn" type="button" data-game-action="start-player">Volver a sortear opciones</button>
    </article>
  `;
}

function renderPlayerCareer(container) {
  const team = getGameTeam(gameState.teamAbbreviation);
  const options = gameState.seasonOptions || [];
  const history = [...gameState.history].reverse();
  const tournaments = [...(gameState.careerTournaments || [])].reverse();
  const trophySummary = tournaments.length ? `<div class="game-trophy-summary"><strong>Trofeos ganados</strong>${tournaments.map((trophy) => `<span>${trophy.age} años · ${gameEscape(trophy.name)}</span>`).join('')}</div>` : '<div class="game-trophy-summary"><strong>Trofeos ganados</strong><span>Aún no has ganado torneos.</span></div>';
  container.innerHTML = `
    <div class="game-career-layout">
      <article class="game-profile surface-card">
        <span class="eyebrow">CARRERA DE JUGADOR</span>
        <div class="game-profile-top"><div class="game-avatar">${gameState.age}</div><div><h2>${gameEscape(team?.nombre || 'Equipo pendiente')}</h2><p>Tu jugador ficticio · Temporada ${gameState.history.length + 1}</p></div></div>
        <div class="game-stat-grid"><div><span>Edad</span><strong>${gameState.age}</strong></div><div><span>Nivel</span><strong>${gameState.skill}</strong></div><div><span>Goles</span><strong>${gameState.careerGoals}</strong></div><div><span>Asistencias</span><strong>${gameState.careerAssists}</strong></div><div><span>Títulos</span><strong>${gameState.careerTitles}</strong></div><div><span>Lesiones</span><strong>${gameState.injuries}</strong></div></div>
        <p class="game-save-note">Partida guardada en este navegador.</p>
        <button class="text-btn" type="button" data-game-action="reset-game">Reiniciar carrera</button>
      </article>
      <article class="game-panel surface-card">
        <div class="game-panel-heading"><div><span class="eyebrow">DECISIÓN DE TEMPORADA</span><h2>¿Qué harás este año?</h2></div><span class="game-season-badge">${gameState.age} AÑOS</span></div>
        <p class="game-event-note">${gameEscape(gameState.currentSeasonNote)}</p>
        ${gameState.phase === 'finished' ? `<div class="game-finished"><strong>¡Carrera completada!</strong><p>${gameEscape(gameState.currentSeasonNote)}</p>${trophySummary}<button class="primary-btn" type="button" data-game-action="reset-game">Comenzar otra carrera</button></div>` : gameState.actionUsed ? `<div class="game-action-complete"><strong>Decisión registrada</strong><p>Revisa el resumen y cierra la temporada para avanzar.</p><button class="primary-btn" type="button" data-game-action="finish-season">Cerrar temporada</button></div>` : `<div class="game-action-grid">${options.map((option) => `<button class="game-action-card" type="button" data-game-action="season-action" data-action-id="${gameEscape(option.id)}"><span>${option.icon}</span><strong>${gameEscape(option.title)}</strong><small>${gameEscape(option.text)}</small></button>`).join('')}</div>`}
      </article>
    </div>
    <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">PALMARÉS Y ESTADÍSTICAS</span><h2>Tu historia temporada a temporada</h2></div><span>${history.length} temporadas</span></div>${history.length ? `<div class="game-history-list">${history.map((season) => `<div class="game-history-row"><strong>${season.age} años</strong><span>${gameEscape(season.team)}</span><span>${season.goals} goles</span><span>${season.assists} asistencias</span><span>${season.trophies?.length ? season.trophies.map((name) => gameEscape(name)).join(', ') : 'Sin títulos'}</span></div>`).join('')}</div>` : '<div class="empty-state">Tu primera temporada aparecerá aquí.</div>'}</article>
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

function renderDirectorDashboard(container) {
  const team = getGameTeam(gameState.teamAbbreviation);
  if (!gameState.directorDataLoaded) {
    container.innerHTML = '<article class="surface-card empty-state">Cargando plantilla y mercado de jugadores...</article>';
    return;
  }
  const market = gameState.directorMarket || [];
  const offers = gameState.directorOffers || [];
  const roster = gameState.directorRoster || [];
  const profile = gameState.directorClubProfile || directorClubProfile(team);
  const finance = gameState.directorFinances || defaultGameState().directorFinances;
  const query = String(gameState.directorMarketQuery || '').trim().toLowerCase();
  const visibleMarket = market.filter((player) => !query || `${player.name} ${player.teamName} ${player.position}`.toLowerCase().includes(query));
  const marketToRender = visibleMarket.slice(0, 12);
  const history = [...(gameState.directorHistory || [])].reverse();
  const budgetWarning = gameState.directorBudget < 100000 ? '<div class="director-alert director-alert-danger">La directiva te despidió por bajar de 100 mil pesos.</div>' : gameState.directorBudget < 500000 ? '<div class="director-alert">Advertencia: tienes menos de 500 mil pesos y tu puesto está en riesgo.</div>' : '';
  const disabled = gameState.directorFired ? 'disabled' : '';
  container.innerHTML = `
    <div class="director-dashboard-layout">
      <article class="game-profile surface-card">
        <span class="eyebrow">MODO DIRECTOR DEPORTIVO</span>
        <div class="game-profile-top"><div class="game-avatar">${gameState.directorSeason}</div><div><h2>${gameEscape(team?.nombre || 'Club')}</h2><p>Temporada ${gameState.directorSeason} · Balance del club</p></div></div>
        <div class="director-budget"><span>Caja del club · pesos ficticios</span><strong>${directorMoney(gameState.directorBudget)}</strong></div>
        ${budgetWarning}
        <div class="game-stat-grid"><div><span>Jugadores</span><strong>${roster.length}</strong></div><div><span>Cantera</span><strong>Nivel ${gameState.directorYouthLevel}</strong></div><div><span>Reputación</span><strong>${profile.reputation}</strong></div><div><span>Objetivo</span><strong>${gameEscape(profile.boardObjective)}</strong></div></div>
        <div class="director-club-profile"><strong>Perfil ${gameEscape(profile.clubType)}</strong><span>${gameEscape(profile.city)} · ${gameEscape(profile.region)} · Fundación ${profile.foundation}</span><span>${gameEscape(profile.stadium)} · Capacidad ${profile.capacity.toLocaleString('es-MX')}</span><span>Instalaciones ${profile.facilities}/10 · Academia ${profile.academy}/10 · Scouting ${profile.scouting}/10</span><span>Patrocinadores: ${profile.sponsors.map((sponsor) => gameEscape(sponsor)).join(', ')}</span><span>TV: ${gameEscape(profile.tvContract)} · Valor de plantilla ${directorMoney(profile.squadValue)}</span></div>
        <div class="director-finance-list"><div><span>Fichajes</span><strong>${directorMoney(finance.transferBudget)}</strong></div><div><span>Salarios</span><strong>${directorMoney(finance.wageBudget)}</strong></div><div><span>Deuda</span><strong>${directorMoney(finance.debt)}</strong></div><div><span>Ingresos previstos</span><strong>${directorMoney(finance.projectedIncome)}</strong></div></div>
        <p class="game-event-note">${gameEscape(gameState.directorMessage)}</p>
        <div class="director-controls"><button class="primary-btn" type="button" data-game-action="director-simulate" ${disabled}>Simular temporada</button><button class="ghost-btn" type="button" data-game-action="director-sponsorship" ${gameState.directorTvDeal || gameState.directorFired ? 'disabled' : ''}>Firmar patrocinio +$4 M</button><button class="ghost-btn" type="button" data-game-action="director-academy" ${disabled}>Invertir cantera -$2 M</button></div>
        <div class="director-management-grid"><div><strong>Taquilla</strong><span>${directorMoney(gameState.directorTicketPrice)} por entrada</span><div><button class="text-btn" type="button" data-game-action="director-ticket-down" ${disabled}>-$50</button><button class="text-btn" type="button" data-game-action="director-ticket-up" ${disabled}>+$50</button></div></div><div><strong>Merchandising</strong><span>Nivel ${gameState.directorMerchandisingLevel}</span><button class="text-btn" type="button" data-game-action="director-merchandising" ${disabled}>Invertir $1 M</button></div><div><strong>Cuerpo técnico</strong><span>DT ${gameState.directorStaff.coach.level} · Scout ${gameState.directorStaff.scout.level} · Médico ${gameState.directorStaff.medical.level}</span><div><button class="text-btn" type="button" data-game-action="director-hire-staff" data-staff-type="coach" ${disabled}>Mejorar DT</button><button class="text-btn" type="button" data-game-action="director-hire-staff" data-staff-type="scout" ${disabled}>Mejorar scout</button><button class="text-btn" type="button" data-game-action="director-hire-staff" data-staff-type="medical" ${disabled}>Mejorar médico</button></div></div><div><strong>Instalaciones</strong><span>Centro ${gameState.directorInstallationLevels.training} · Médico ${gameState.directorInstallationLevels.medical} · General ${gameState.directorInstallationLevels.facilities}</span><div><button class="text-btn" type="button" data-game-action="director-installation" data-installation="training" ${disabled}>Entrenamiento</button><button class="text-btn" type="button" data-game-action="director-installation" data-installation="medical" ${disabled}>Médico</button><button class="text-btn" type="button" data-game-action="director-installation" data-installation="facilities" ${disabled}>General</button></div></div></div>
        <button class="text-btn" type="button" data-game-action="reset-game">Salir y reiniciar partida</button>
      </article>
      <article class="game-panel surface-card">
        <div class="game-panel-heading"><div><span class="eyebrow">MERCADO NACIONAL E INTERNACIONAL</span><h2>Buscar jugadores</h2></div><span>${visibleMarket.length}/${market.length} opciones</span></div>
        <input class="director-market-search" type="search" placeholder="Buscar jugador, posición o club..." value="${gameEscape(gameState.directorMarketQuery || '')}" data-game-input="director-market-search">
        <div class="director-market-grid">${marketToRender.length ? marketToRender.map((player) => `<div class="director-market-card"><div><strong>${gameEscape(player.name)}</strong><small>${gameEscape(player.position)} · ${gameEscape(player.teamName)} · ${player.age} años</small><small>${player.releaseClause ? `Cláusula ${directorMoney(player.releaseClause)}` : player.negotiationAvailable ? (player.willingToJoin ? 'Oferta negociable' : 'Puede rechazar') : 'No disponible esta ventana'}</small></div><button class="primary-btn" type="button" data-game-action="director-buy" data-player-key="${gameEscape(player.key)}" ${disabled || !player.negotiationAvailable ? 'disabled' : ''}>${player.releaseClause ? `Pagar ${directorMoney(player.releaseClause)}` : `Ofertar ${directorMoney(player.value)}`}</button></div>`).join('') : '<div class="empty-state">No hay jugadores que coincidan con tu búsqueda.</div>'}${visibleMarket.length > marketToRender.length ? `<p class="game-save-note">Se muestran 12 resultados. Refina tu búsqueda para encontrar un jugador específico.</p>` : ''}</div>
      </article>
    </div>
    <div class="director-lower-grid">
      <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">OFERTAS POR TU PLANTILLA</span><h2>Decide si vendes</h2></div></div>${offers.length ? `<div class="director-offer-list">${offers.map((offer) => `<div class="director-market-card"><div><strong>${gameEscape(offer.name)}</strong><small>${gameEscape(offer.buyerTeam)} ofrece ${directorMoney(offer.amount)}</small></div><button class="ghost-btn" type="button" data-game-action="director-sell" data-offer-id="${gameEscape(offer.offerId)}" ${disabled}>Aceptar venta</button></div>`).join('')}</div>` : '<div class="empty-state">Todavía no hay ofertas por tus jugadores.</div>'}</article>
      <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">PLANTILLA ACTUAL</span><h2>Jugadores del club</h2></div><span>${roster.length} registrados</span></div><div class="director-roster-list">${roster.slice(0, 10).map((player) => `<div><strong>${gameEscape(player.name)}${player.onLoan ? ' · cedido' : ''}</strong><span>${gameEscape(player.position)} · Salario ${directorMoney(player.salary)} · Valor ${directorMoney(player.value)} ${!player.onLoan ? `<button class="text-btn" type="button" data-game-action="director-loan" data-player-key="${gameEscape(player.key)}" ${disabled}>Ceder</button>` : `<small>Regresa T${player.loanReturnSeason}</small>`}</span></div>`).join('')}</div>${roster.length > 10 ? `<p class="game-save-note">Se muestran 10 de ${roster.length} jugadores.</p>` : ''}${gameState.directorLoans?.length ? `<div class="director-loan-list"><strong>Préstamos activos e históricos</strong>${gameState.directorLoans.slice(-5).reverse().map((loan) => `<span>${gameEscape(loan.player)} → ${gameEscape(loan.club)} · ${directorMoney(loan.fee)}</span>`).join('')}</div>` : ''}</article>
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
  if (gameState.phase === 'offers') renderPlayerOffers(container);
  if (gameState.phase === 'career' || gameState.phase === 'finished') renderPlayerCareer(container);
  if (gameState.phase === 'director-preview') renderDirectorPreview(container);
  if (gameState.phase === 'director-choose-team') renderDirectorTeamChoice(container);
  if (gameState.phase === 'director-dashboard') renderDirectorDashboard(container);
  if (gameState.phase === 'director-job-offers') renderDirectorJobOffers(container);
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
  if (action === 'director-take-job') directorTakeJob(button.dataset.team);
  if (action === 'reset-game') resetGame();
  if (action === 'director-info') {
    startDirectorMode();
  }
});

document.addEventListener('change', (event) => {
  if (event.target.dataset.gameInput !== 'director-market-search') return;
  gameState.directorMarketQuery = event.target.value;
  renderJuego();
});

window.renderJuego = renderJuego;
window.addEventListener('DOMContentLoaded', renderJuego);
