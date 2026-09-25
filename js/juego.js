const gameStorageKey = 'futbol-mx-analisis-pro-game-v1';

let gameState = loadGameState();

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
    startOptions: []
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
        <button class="game-role-card game-role-disabled" type="button" data-game-action="director-info">
          <span class="game-role-icon">📋</span><strong>Director deportivo</strong><small>Fichajes, presupuesto y decisiones del club.</small><em>Próximamente</em>
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

function renderDirectorPreview(container) {
  container.innerHTML = `
    <article class="game-intro surface-card">
      <span class="eyebrow">PRÓXIMA FASE</span>
      <h2>Modo director deportivo</h2>
      <p>Esta fase incluirá presupuesto inicial de 30 millones de dólares, fichajes, ofertas por tus jugadores, patrocinios y fuerzas básicas.</p>
      <button class="ghost-btn" type="button" data-game-action="reset-game">Volver a elegir modo</button>
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
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-game-action]');
  if (!button) return;
  const action = button.dataset.gameAction;
  if (action === 'start-player') startPlayerMode();
  if (action === 'select-team') selectStartingTeam(button.dataset.team);
  if (action === 'season-action') performSeasonAction(button.dataset.actionId);
  if (action === 'finish-season') finishSeason();
  if (action === 'reset-game') resetGame();
  if (action === 'director-info') {
    gameState.phase = 'director-preview';
    saveGameState();
    renderJuego();
  }
});

window.renderJuego = renderJuego;
window.addEventListener('DOMContentLoaded', renderJuego);
