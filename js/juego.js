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
    directorMessage: ''
  };
}

function loadGameState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(gameStorageKey) || 'null');
    return savedState ? { ...defaultGameState(), ...savedState } : defaultGameState();
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function directorPlayerKey(player, index = 0) {
  return String(player.id || `${player.abreviatura || player.teamAbbreviation || 'jugador'}-${player.nombre || player.name || index}`).replaceAll(' ', '-');
}

function directorMapPlayer(player, teamAbbreviation, index = 0) {
  const team = getGameTeam(teamAbbreviation || player.abreviatura);
  const age = Number(player.edad || player.age) || randomNumber(18, 30);
  const value = Number(player.valor || player.value) || randomNumber(700000, 4500000);
  return {
    id: player.id,
    key: directorPlayerKey({ ...player, abreviatura: teamAbbreviation || player.abreviatura }, index),
    name: player.nombre || player.name || `Jugador de cantera ${index + 1}`,
    position: player.posicion || player.position || 'Jugador',
    age,
    value,
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
  const candidates = shuffle(directorPlayerPool
    .filter((player) => player.abreviatura && player.abreviatura !== gameState.teamAbbreviation)
    .map((player, index) => directorMapPlayer(player, player.abreviatura, index)));
  const market = candidates.length ? candidates.slice(0, 3) : shuffle(otherTeams).slice(0, 3).map((team, index) => directorMapPlayer({ nombre: `Talento juvenil ${index + 1}`, posicion: 'Jugador', edad: randomNumber(18, 22) }, team.abreviatura, index));
  gameState.directorMarket = market;
  gameState.directorOffers = shuffle(gameState.directorRoster).slice(0, 3).map((player, index) => {
    const buyer = shuffle(otherTeams)[index % Math.max(1, otherTeams.length)];
    return { ...player, offerId: `offer-${player.key}`, buyerTeam: buyer?.nombre || 'Club interesado', amount: Math.round(player.value * (1.1 + Math.random() * 0.65)) };
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
  gameState.directorDataLoaded = false;
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
  if (gameState.directorBudget < player.value) {
    gameState.directorMessage = `No tienes presupuesto suficiente para fichar a ${player.name}.`;
  } else {
    gameState.directorBudget -= player.value;
    gameState.directorRoster.push({ ...player, teamAbbreviation: gameState.teamAbbreviation, teamName: getGameTeam(gameState.teamAbbreviation)?.nombre || '' });
    gameState.directorTransfers.push({ type: 'Fichaje', player: player.name, amount: -player.value, season: gameState.directorSeason });
    gameState.directorMessage = `Fichaste a ${player.name} por ${directorMoney(player.value)}.`;
    directorBuildOffers();
  }
  saveGameState();
  renderJuego();
}

function directorSell(offerId) {
  const offer = gameState.directorOffers.find((item) => item.offerId === offerId);
  if (!offer || gameState.directorFired) return;
  gameState.directorBudget += offer.amount;
  gameState.directorRoster = gameState.directorRoster.filter((player) => player.key !== offer.key);
  gameState.directorTransfers.push({ type: 'Venta', player: offer.name, amount: offer.amount, season: gameState.directorSeason });
  gameState.directorMessage = `${offer.buyerTeam} ofreció ${directorMoney(offer.amount)} por ${offer.name}. Venta aceptada.`;
  directorBuildOffers();
  saveGameState();
  renderJuego();
}

function directorSponsorship() {
  if (gameState.directorTvDeal || gameState.directorFired) return;
  gameState.directorBudget += 4000000;
  gameState.directorTvDeal = true;
  gameState.directorTransfers.push({ type: 'Patrocinio televisivo', player: 'Acuerdo de temporada', amount: 4000000, season: gameState.directorSeason });
  gameState.directorMessage = 'Firmaste el patrocinio televisivo de la temporada por 4 millones de dólares.';
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
    gameState.directorYouthLevel += 1;
    gameState.directorTransfers.push({ type: 'Fuerzas básicas', player: `Nivel ${gameState.directorYouthLevel}`, amount: -cost, season: gameState.directorSeason });
    gameState.directorMessage = 'Invertiste 2 millones en fuerzas básicas. El nivel de cantera aumentó.';
  }
  saveGameState();
  renderJuego();
}

function directorSimulateSeason() {
  if (gameState.directorFired) return;
  const tvIncome = gameState.directorTvDeal ? 4000000 : 0;
  const performanceBonus = randomNumber(0, 3000000) + gameState.directorYouthLevel * 500000;
  const operatingCost = randomNumber(800000, 2200000);
  const change = tvIncome + performanceBonus - operatingCost;
  gameState.directorBudget += change;
  gameState.directorHistory.push({ season: gameState.directorSeason, change, budget: gameState.directorBudget });
  gameState.directorSeason += 1;
  gameState.directorTvDeal = false;
  gameState.directorMessage = `Temporada simulada: ${change >= 0 ? '+' : ''}${directorMoney(change)} en el balance.`;
  if (gameState.directorBudget < 100000) {
    gameState.directorFired = true;
    gameState.directorMessage = 'El presupuesto bajó de 100 mil dólares y la directiva te despidió.';
  } else {
    directorBuildOffers();
  }
  saveGameState();
  renderJuego();
}

function drawSeasonOptions() {
  return shuffle([
    { id: 'training', icon: '💪', title: 'Entrenar fuerte', text: 'Aumentas tu nivel, pero existe riesgo de lesión.' },
    { id: 'technique', icon: '🎯', title: 'Perfeccionar tu técnica', text: 'Mejoras tu rendimiento ofensivo de forma segura.' },
    { id: 'transfer', icon: '🔁', title: 'Buscar otro equipo', text: 'Exploras una oportunidad diferente dentro de la Liga MX.' },
    { id: 'rest', icon: '🛌', title: 'Cuidar tu recuperación', text: 'Avanzas con una mejora pequeña y reduces el desgaste.' },
    { id: 'prohibited', icon: '⚠️', title: 'Usar una sustancia prohibida', text: 'Es una decisión ficticia de alto riesgo: puedes mejorar o recibir suspensión.' }
  ]).slice(0, 3);
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

  if (actionId === 'rest') {
    gameState.skill += 1;
    gameState.currentSeasonNote = 'Cuidaste tu recuperación y llegaste en mejores condiciones al cierre de temporada.';
  }

  if (actionId === 'prohibited') {
    gameState.skill += 8;
    if (Math.random() < 0.25) {
      gameState.suspended = true;
      gameState.currentSeasonNote = 'La sustancia falló en el control ficticio del juego y recibiste una suspensión de un año.';
    } else {
      gameState.currentSeasonNote = 'Tu rendimiento subió temporalmente, pero quedaste bajo observación.';
    }
  }

  gameState.skill = Math.min(99, gameState.skill);
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
  const titles = !gameState.suspended && gameState.skill >= 72 && Math.random() < 0.18 ? 1 : 0;

  gameState.history.push({ age: gameState.age, team: team.nombre, goals, assists, titles });
  gameState.careerGoals += goals;
  gameState.careerAssists += assists;
  gameState.careerTitles += titles;

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
        ${gameState.phase === 'finished' ? `<div class="game-finished"><strong>¡Carrera completada!</strong><p>${gameEscape(gameState.currentSeasonNote)}</p><button class="primary-btn" type="button" data-game-action="reset-game">Comenzar otra carrera</button></div>` : gameState.actionUsed ? `<div class="game-action-complete"><strong>Decisión registrada</strong><p>Revisa el resumen y cierra la temporada para avanzar.</p><button class="primary-btn" type="button" data-game-action="finish-season">Cerrar temporada</button></div>` : `<div class="game-action-grid">${options.map((option) => `<button class="game-action-card" type="button" data-game-action="season-action" data-action-id="${gameEscape(option.id)}"><span>${option.icon}</span><strong>${gameEscape(option.title)}</strong><small>${gameEscape(option.text)}</small></button>`).join('')}</div>`}
      </article>
    </div>
    <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">PALMARÉS Y ESTADÍSTICAS</span><h2>Tu historia temporada a temporada</h2></div><span>${history.length} temporadas</span></div>${history.length ? `<div class="game-history-list">${history.map((season) => `<div class="game-history-row"><strong>${season.age} años</strong><span>${gameEscape(season.team)}</span><span>${season.goals} goles</span><span>${season.assists} asistencias</span><span>${season.titles} títulos</span></div>`).join('')}</div>` : '<div class="empty-state">Tu primera temporada aparecerá aquí.</div>'}</article>
  `;
}

function renderDirectorTeamChoice(container) {
  const teams = gameTeams();
  container.innerHTML = `
    <article class="game-panel surface-card">
      <div class="game-panel-heading"><div><span class="eyebrow">MODO DIRECTOR DEPORTIVO</span><h2>Elige el club que dirigirás</h2></div><span class="game-season-badge">$30 M USD</span></div>
      <p>Comienzas la primera temporada con un presupuesto de 30 millones de dólares. Las plantillas se leen desde los jugadores registrados en Supabase.</p>
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
  const history = [...(gameState.directorHistory || [])].reverse();
  const budgetWarning = gameState.directorBudget < 100000 ? '<div class="director-alert director-alert-danger">La directiva te despidió por bajar de 100 mil dólares.</div>' : gameState.directorBudget < 500000 ? '<div class="director-alert">Advertencia: tienes menos de 500 mil dólares y tu puesto está en riesgo.</div>' : '';
  const disabled = gameState.directorFired ? 'disabled' : '';
  container.innerHTML = `
    <div class="director-dashboard-layout">
      <article class="game-profile surface-card">
        <span class="eyebrow">MODO DIRECTOR DEPORTIVO</span>
        <div class="game-profile-top"><div class="game-avatar">${gameState.directorSeason}</div><div><h2>${gameEscape(team?.nombre || 'Club')}</h2><p>Temporada ${gameState.directorSeason} · Balance del club</p></div></div>
        <div class="director-budget"><span>Presupuesto disponible</span><strong>${directorMoney(gameState.directorBudget)}</strong></div>
        ${budgetWarning}
        <div class="game-stat-grid"><div><span>Jugadores</span><strong>${roster.length}</strong></div><div><span>Cantera</span><strong>Nivel ${gameState.directorYouthLevel}</strong></div><div><span>Temporada</span><strong>${gameState.directorSeason}</strong></div></div>
        <p class="game-event-note">${gameEscape(gameState.directorMessage)}</p>
        <div class="director-controls"><button class="primary-btn" type="button" data-game-action="director-simulate" ${disabled}>Simular temporada</button><button class="ghost-btn" type="button" data-game-action="director-sponsorship" ${gameState.directorTvDeal || gameState.directorFired ? 'disabled' : ''}>Firmar patrocinio +$4 M</button><button class="ghost-btn" type="button" data-game-action="director-academy" ${disabled}>Invertir cantera -$2 M</button></div>
        <button class="text-btn" type="button" data-game-action="reset-game">Salir y reiniciar partida</button>
      </article>
      <article class="game-panel surface-card">
        <div class="game-panel-heading"><div><span class="eyebrow">MERCADO DE FICHAJES</span><h2>Jugadores disponibles</h2></div><span>${market.length} opciones</span></div>
        <div class="director-market-grid">${market.length ? market.map((player) => `<div class="director-market-card"><div><strong>${gameEscape(player.name)}</strong><small>${gameEscape(player.position)} · ${gameEscape(player.teamName)} · ${player.age} años</small></div><button class="primary-btn" type="button" data-game-action="director-buy" data-player-key="${gameEscape(player.key)}" ${disabled}>Fichar ${directorMoney(player.value)}</button></div>`).join('') : '<div class="empty-state">No hay jugadores disponibles.</div>'}</div>
      </article>
    </div>
    <div class="director-lower-grid">
      <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">OFERTAS POR TU PLANTILLA</span><h2>Decide si vendes</h2></div></div>${offers.length ? `<div class="director-offer-list">${offers.map((offer) => `<div class="director-market-card"><div><strong>${gameEscape(offer.name)}</strong><small>${gameEscape(offer.buyerTeam)} ofrece ${directorMoney(offer.amount)}</small></div><button class="ghost-btn" type="button" data-game-action="director-sell" data-offer-id="${gameEscape(offer.offerId)}" ${disabled}>Aceptar venta</button></div>`).join('')}</div>` : '<div class="empty-state">Todavía no hay ofertas por tus jugadores.</div>'}</article>
      <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">PLANTILLA ACTUAL</span><h2>Jugadores del club</h2></div><span>${roster.length} registrados</span></div><div class="director-roster-list">${roster.slice(0, 10).map((player) => `<div><strong>${gameEscape(player.name)}</strong><span>${gameEscape(player.position)} · Valor ${directorMoney(player.value)}</span></div>`).join('')}</div>${roster.length > 10 ? `<p class="game-save-note">Se muestran 10 de ${roster.length} jugadores.</p>` : ''}</article>
    </div>
    <article class="game-history surface-card"><div class="game-panel-heading"><div><span class="eyebrow">HISTORIAL FINANCIERO</span><h2>Movimientos y temporadas</h2></div></div>${history.length ? `<div class="game-history-list">${history.map((item) => `<div class="game-history-row"><strong>Temporada ${item.season}</strong><span>${item.change >= 0 ? '+' : ''}${directorMoney(item.change)}</span><span>Balance ${directorMoney(item.budget)}</span></div>`).join('')}</div>` : '<div class="empty-state">Los movimientos aparecerán aquí.</div>'}</article>
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
  if (action === 'director-simulate') directorSimulateSeason();
  if (action === 'reset-game') resetGame();
  if (action === 'director-info') {
    startDirectorMode();
  }
});

window.renderJuego = renderJuego;
window.addEventListener('DOMContentLoaded', renderJuego);
