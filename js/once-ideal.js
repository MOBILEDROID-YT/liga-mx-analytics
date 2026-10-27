(() => {
  const storageKey = 'futbol-mx-analisis-once-ideal-v1';
  const maxSquadSize = 28;
  const roleLabels = {
    POR: 'Portero',
    LI: 'Lateral izquierdo',
    LD: 'Lateral derecho',
    DFC: 'Defensa central',
    DEF: 'Defensa',
    MCD: 'Mediocentro defensivo',
    MC: 'Mediocentro',
    MCO: 'Mediapunta',
    MI: 'Volante izquierdo',
    MD: 'Volante derecho',
    EI: 'Extremo izquierdo',
    ED: 'Extremo derecho',
    SD: 'Segundo delantero',
    DC: 'Delantero centro'
  };

  const formationTemplates = [
    ['4-3-3', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MC', 'MCD', 'MC'], ['EI', 'DC', 'ED']]],
    ['4-4-2', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MI', 'MC', 'MC', 'MD'], ['DC', 'DC']]],
    ['4-2-3-1', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD', 'MCD'], ['MI', 'MCO', 'MD'], ['DC']]],
    ['4-1-4-1', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD'], ['MI', 'MC', 'MC', 'MD'], ['DC']]],
    ['4-3-1-2', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MC', 'MCD', 'MC'], ['MCO'], ['DC', 'DC']]],
    ['4-1-2-3', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD'], ['MC', 'MC'], ['EI', 'DC', 'ED']]],
    ['4-2-4', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD', 'MCD'], ['EI', 'DC', 'DC', 'ED']]],
    ['4-3-2-1', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MC', 'MCD', 'MC'], ['MCO', 'MCO'], ['DC']]],
    ['4-4-1-1', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MI', 'MC', 'MC', 'MD'], ['MCO'], ['DC']]],
    ['4-5-1', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MI', 'MC', 'MCD', 'MC', 'MD'], ['DC']]],
    ['3-4-3', [['POR'], ['DFC', 'DFC', 'DFC'], ['MI', 'MC', 'MC', 'MD'], ['EI', 'DC', 'ED']]],
    ['3-4-2-1', [['POR'], ['DFC', 'DFC', 'DFC'], ['MI', 'MC', 'MC', 'MD'], ['MCO', 'MCO'], ['DC']]],
    ['3-5-2', [['POR'], ['DFC', 'DFC', 'DFC'], ['MI', 'MC', 'MCD', 'MC', 'MD'], ['DC', 'DC']]],
    ['3-4-1-2', [['POR'], ['DFC', 'DFC', 'DFC'], ['MI', 'MC', 'MC', 'MD'], ['MCO'], ['DC', 'DC']]],
    ['3-3-3-1', [['POR'], ['DFC', 'DFC', 'DFC'], ['MC', 'MCD', 'MC'], ['EI', 'DC', 'ED'], ['DC']]],
    ['3-2-4-1', [['POR'], ['DFC', 'DFC', 'DFC'], ['MCD', 'MCD'], ['MI', 'MC', 'MC', 'MD'], ['DC']]],
    ['5-3-2', [['POR'], ['LI', 'DFC', 'DFC', 'DFC', 'LD'], ['MC', 'MCD', 'MC'], ['DC', 'DC']]],
    ['5-4-1', [['POR'], ['LI', 'DFC', 'DFC', 'DFC', 'LD'], ['MI', 'MC', 'MC', 'MD'], ['DC']]],
    ['5-2-1-2', [['POR'], ['LI', 'DFC', 'DFC', 'DFC', 'LD'], ['MCD', 'MCD'], ['MCO'], ['DC', 'DC']]],
    ['5-2-3', [['POR'], ['LI', 'DFC', 'DFC', 'DFC', 'LD'], ['MCD', 'MCD'], ['EI', 'DC', 'ED']]],
    ['5-3-1-1', [['POR'], ['LI', 'DFC', 'DFC', 'DFC', 'LD'], ['MC', 'MCD', 'MC'], ['MCO'], ['DC']]],
    ['4-2-2-2', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD', 'MCD'], ['MCO', 'MCO'], ['DC', 'DC']]],
    ['4-3-3 defensivo', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD', 'MC', 'MC'], ['EI', 'DC', 'ED']]],
    ['4-2-1-3', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD', 'MCD'], ['MCO'], ['EI', 'DC', 'ED']]],
    ['4-1-3-2', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD'], ['MI', 'MCO', 'MD'], ['DC', 'DC']]],
    ['4-3-2-1 estrecho', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MC', 'MCD', 'MC'], ['MCO', 'MCO'], ['DC']]],
    ['2-3-5', [['POR'], ['DFC', 'DFC'], ['MI', 'MC', 'MD'], ['MCO'], ['EI', 'DC', 'DC', 'ED']]],
    ['3-1-4-2', [['POR'], ['DFC', 'DFC', 'DFC'], ['MCD'], ['MI', 'MC', 'MC', 'MD'], ['DC', 'DC']]],
    ['4-4-2 diamante', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD'], ['MI', 'MD'], ['MCO'], ['DC', 'DC']]],
    ['4-3-3 estrecho', [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MC', 'MCD', 'MC'], ['SD', 'DC', 'SD']]]
  ].map(([id, rows]) => ({ id, rows }));

  const state = {
    formationId: '4-3-3',
    teamName: 'Mi Once Ideal',
    coachName: 'Mi entrenador',
    captain: '',
    penalty: '',
    freeKick: '',
    corners: '',
    selectedPlayers: [],
    slots: Array(11).fill(''),
    savedLineups: [],
    players: [],
    teamFilter: '',
    search: ''
  };

  const el = (id) => document.getElementById(id);
  const escapeValue = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  function getTemplate() {
    return formationTemplates.find((formation) => formation.id === state.formationId) || formationTemplates[0];
  }

  function getTeamName(abbreviation) {
    const teams = typeof appState !== 'undefined' && Array.isArray(appState.teams) ? appState.teams : [];
    return teams.find((team) => team.abreviatura === abbreviation)?.nombre || abbreviation || 'Club sin dato';
  }

  function normalizePosition(value) {
    const position = normalize(value);
    if (position.includes('por') || position.includes('portero') || position.includes('arquero')) return 'POR';
    if (position.includes('med') || position.includes('medio') || position.includes('volante')) return 'MED';
    if (position.includes('del') || position.includes('ata') || position.includes('extremo')) return 'DEL';
    return 'DEF';
  }

  function positionClass(position) {
    if (position === 'POR' || position === 'DEF') return 'once-ideal-player-green';
    if (position === 'MED') return 'once-ideal-player-white';
    return 'once-ideal-player-cyan';
  }

  function playerById(id) {
    return state.players.find((player) => player.id === id);
  }

  function selectedPlayers() {
    return state.selectedPlayers.map(playerById).filter(Boolean);
  }

  function loadSavedState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      Object.assign(state, {
        formationId: saved.formationId || state.formationId,
        teamName: saved.teamName || state.teamName,
        coachName: saved.coachName || state.coachName,
        captain: saved.captain || '',
        penalty: saved.penalty || '',
        freeKick: saved.freeKick || '',
        corners: saved.corners || '',
        selectedPlayers: Array.isArray(saved.selectedPlayers) ? saved.selectedPlayers.slice(0, maxSquadSize) : [],
        slots: Array.isArray(saved.slots) ? saved.slots.slice(0, 11) : Array(11).fill(''),
        savedLineups: Array.isArray(saved.savedLineups) ? saved.savedLineups.slice(0, 12) : []
      });
    } catch (error) {
      localStorage.removeItem(storageKey);
    }
  }

  function persistState() {
    localStorage.setItem(storageKey, JSON.stringify({
      formationId: state.formationId,
      teamName: state.teamName,
      coachName: state.coachName,
      captain: state.captain,
      penalty: state.penalty,
      freeKick: state.freeKick,
      corners: state.corners,
      selectedPlayers: state.selectedPlayers,
      slots: state.slots,
      savedLineups: state.savedLineups
    }));
  }

  function setStatus(message, type = '') {
    const status = el('once-ideal-status');
    if (!status) return;
    status.textContent = message;
    status.className = `once-ideal-status ${type}`.trim();
  }

  function renderFormationSelect() {
    const select = el('once-ideal-formation');
    if (!select) return;
    select.innerHTML = formationTemplates.map((formation) => `<option value="${escapeValue(formation.id)}" ${formation.id === state.formationId ? 'selected' : ''}>${escapeValue(formation.id)}</option>`).join('');
  }

  function renderTeamFilter() {
    const select = el('once-ideal-team-filter');
    if (!select) return;
    const abbreviations = [...new Set(state.players.map((player) => player.teamAbbreviation).filter(Boolean))];
    select.innerHTML = `<option value="">Todos los clubes</option>${abbreviations.map((abbreviation) => `<option value="${escapeValue(abbreviation)}" ${state.teamFilter === abbreviation ? 'selected' : ''}>${escapeValue(getTeamName(abbreviation))}</option>`).join('')}`;
  }

  function renderRoleSelect(id, currentValue) {
    const select = el(id);
    if (!select) return;
    const options = selectedPlayers();
    if (currentValue && !options.some((player) => player.id === currentValue)) currentValue = '';
    select.innerHTML = `<option value="">Sin asignar</option>${options.map((player) => `<option value="${escapeValue(player.id)}" ${currentValue === player.id ? 'selected' : ''}>${escapeValue(player.name)} · ${escapeValue(player.positionLabel)}</option>`).join('')}`;
  }

  function renderRoleSelects() {
    renderRoleSelect('once-ideal-captain', state.captain);
    renderRoleSelect('once-ideal-penalty', state.penalty);
    renderRoleSelect('once-ideal-free-kick', state.freeKick);
    renderRoleSelect('once-ideal-corners', state.corners);
  }

  function flattenRoles() {
    const roles = [];
    getTemplate().rows.forEach((row, rowIndex) => row.forEach((role, columnIndex) => roles.push({ role, rowIndex, columnIndex, rowSize: row.length })));
    return roles;
  }

  function slotPosition(meta, rowCount) {
    const wideX = rowCount === 1 ? 50 : 8 + (meta.rowIndex / (rowCount - 1)) * 84;
    const wideY = meta.rowSize === 1 ? 50 : 13 + (meta.columnIndex / (meta.rowSize - 1)) * 74;
    return { wideX, wideY, tallX: wideY, tallY: wideX };
  }

  function renderSlots() {
    const slots = el('once-ideal-slots');
    if (!slots) return;
    const roles = flattenRoles();
    if (state.slots.length !== roles.length) state.slots = Array(roles.length).fill('');
    const rowCount = getTemplate().rows.length;
    slots.innerHTML = roles.map((meta, index) => {
      const position = slotPosition(meta, rowCount);
      const player = playerById(state.slots[index]);
      const playerName = player?.name || 'Libre';
      const playerClass = player ? positionClass(player.position) : '';
      return `<div class="once-ideal-slot ${player ? 'filled' : ''}" data-once-slot="${index}" style="--wide-x:${position.wideX}%;--wide-y:${position.wideY}%;--tall-x:${position.tallX}%;--tall-y:${position.tallY}%" title="${escapeValue(roleLabels[meta.role] || meta.role)}">
        <button class="once-ideal-star ${playerClass}" type="button" data-once-action="${player ? 'remove-slot' : 'empty-slot'}" data-slot-index="${index}" aria-label="${player ? `Quitar ${escapeValue(player.name)}` : `Posición ${escapeValue(roleLabels[meta.role] || meta.role)}`}" draggable="${player ? 'true' : 'false'}">
          <span class="once-ideal-star-glyph">★</span><span class="once-ideal-slot-name">${escapeValue(playerName)}</span><small>${escapeValue(meta.role)}</small>
        </button>
      </div>`;
    }).join('');
    const filled = state.slots.filter(Boolean).length;
    el('once-ideal-slot-count').textContent = `${filled}/${roles.length} titulares`;
  }

  function renderRoster() {
    const roster = el('once-ideal-roster');
    if (!roster) return;
    const search = normalize(state.search);
    const visible = state.players.filter((player) => {
      const teamName = getTeamName(player.teamAbbreviation);
      const matchesSearch = !search || normalize(`${player.name} ${teamName} ${player.positionLabel}`).includes(search);
      const matchesTeam = !state.teamFilter || player.teamAbbreviation === state.teamFilter;
      return matchesSearch && matchesTeam;
    });
    el('once-ideal-roster-count').textContent = `${visible.length} jugadores · ${state.selectedPlayers.length}/${maxSquadSize} añadidos`;
    if (!visible.length) {
      roster.innerHTML = '<div class="once-ideal-empty">No hay jugadores con ese filtro.</div>';
      return;
    }
    roster.innerHTML = visible.map((player) => {
      const selected = state.selectedPlayers.includes(player.id);
      const teamName = getTeamName(player.teamAbbreviation);
      return `<article class="once-ideal-player-card ${selected ? 'selected' : ''}" draggable="true" data-once-player-id="${escapeValue(player.id)}">
        <div class="once-ideal-player-card-main"><span class="once-ideal-player-position ${positionClass(player.position)}">${escapeValue(player.position)}</span><div><strong>${escapeValue(player.name)}</strong><small>${escapeValue(teamName)}${player.numero ? ` · #${escapeValue(player.numero)}` : ''}</small></div></div>
        <button class="once-ideal-player-button" type="button" data-once-action="${selected ? 'remove-player' : 'add-player'}" data-player-id="${escapeValue(player.id)}">${selected ? 'Quitar' : 'Añadir'}</button>
        ${selected ? `<button class="once-ideal-place-button" type="button" data-once-action="place-player" data-player-id="${escapeValue(player.id)}">Colocar</button>` : ''}
      </article>`;
    }).join('');
  }

  function renderSavedLineups() {
    const container = el('once-ideal-saved');
    if (!container) return;
    if (!state.savedLineups.length) {
      container.innerHTML = '<p class="once-ideal-empty">Todavía no has guardado una plantilla.</p>';
      return;
    }
    container.innerHTML = state.savedLineups.map((lineup) => `<div class="once-ideal-saved-item"><div><strong>${escapeValue(lineup.teamName)}</strong><small>${escapeValue(lineup.formationId)} · ${escapeValue(lineup.savedAt || '')}</small></div><span><button type="button" data-once-action="load-lineup" data-lineup-id="${escapeValue(lineup.id)}">Cargar</button><button type="button" data-once-action="delete-lineup" data-lineup-id="${escapeValue(lineup.id)}" aria-label="Eliminar plantilla">×</button></span></div>`).join('');
  }

  function renderChallenge() {
    const challenge = el('once-ideal-challenge');
    if (!challenge) return;
    const players = state.slots.map(playerById).filter(Boolean);
    const clubs = new Set(players.map((player) => player.teamAbbreviation).filter(Boolean));
    const completed = players.length === 11 && clubs.size >= 4;
    challenge.innerHTML = `<span class="eyebrow">RETO SEMANAL</span><strong>${completed ? '¡Reto completado!' : 'Mezcla cuatro clubes'}</strong><p>${completed ? 'Tu once combina talento de al menos cuatro equipos.' : 'Completa los 11 titulares usando jugadores de cuatro clubes distintos.'}</p>`;
    challenge.classList.toggle('complete', completed);
  }

  function renderBoardHeader() {
    el('once-ideal-board-title').textContent = state.teamName || 'Mi Once Ideal';
    el('once-ideal-board-coach').textContent = `Dirige: ${state.coachName || 'Mi entrenador'}`;
  }

  function renderAll() {
    renderFormationSelect();
    renderTeamFilter();
    renderRoleSelects();
    renderSlots();
    renderRoster();
    renderSavedLineups();
    renderChallenge();
    renderBoardHeader();
  }

  function addPlayer(id) {
    if (!playerById(id)) return;
    if (state.selectedPlayers.includes(id)) return placePlayer(id);
    if (state.selectedPlayers.length >= maxSquadSize) {
      setStatus('Has alcanzado el límite de 28 jugadores.', 'error');
      return;
    }
    state.selectedPlayers.push(id);
    setStatus('Jugador añadido a tu plantilla.', 'success');
    persistState();
    renderAll();
  }

  function placePlayer(id) {
    if (!state.selectedPlayers.includes(id)) {
      addPlayer(id);
      return;
    }
    const openSlot = state.slots.findIndex((slot) => !slot);
    if (openSlot < 0) {
      setStatus('Las 11 posiciones ya están ocupadas. Quita un jugador para cambiarlo.', 'error');
      return;
    }
    state.slots[openSlot] = id;
    persistState();
    renderAll();
  }

  function removePlayer(id) {
    state.selectedPlayers = state.selectedPlayers.filter((playerId) => playerId !== id);
    state.slots = state.slots.map((slot) => slot === id ? '' : slot);
    ['captain', 'penalty', 'freeKick', 'corners'].forEach((key) => { if (state[key] === id) state[key] = ''; });
    persistState();
    renderAll();
  }

  function removeSlot(index) {
    if (Number.isInteger(index)) {
      state.slots[index] = '';
      persistState();
      renderAll();
    }
  }

  function assignPlayerToSlot(playerId, index) {
    if (!playerById(playerId)) return;
    if (!state.selectedPlayers.includes(playerId)) {
      if (state.selectedPlayers.length >= maxSquadSize) return setStatus('Has alcanzado el límite de 28 jugadores.', 'error');
      state.selectedPlayers.push(playerId);
    }
    if (index < 0 || index >= state.slots.length) index = state.slots.findIndex((slot) => !slot);
    if (index < 0) return setStatus('Las 11 posiciones ya están ocupadas.', 'error');
    state.slots[index] = playerId;
    persistState();
    renderAll();
  }

  function saveLineup() {
    const lineup = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      teamName: state.teamName || 'Mi Once Ideal',
      coachName: state.coachName || 'Mi entrenador',
      formationId: state.formationId,
      captain: state.captain,
      penalty: state.penalty,
      freeKick: state.freeKick,
      corners: state.corners,
      selectedPlayers: [...state.selectedPlayers],
      slots: [...state.slots],
      savedAt: new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(new Date())
    };
    state.savedLineups = [lineup, ...state.savedLineups].slice(0, 12);
    persistState();
    renderSavedLineups();
    setStatus('Plantilla guardada en este dispositivo.', 'success');
  }

  function loadLineup(id) {
    const lineup = state.savedLineups.find((saved) => saved.id === id);
    if (!lineup) return;
    Object.assign(state, {
      teamName: lineup.teamName || 'Mi Once Ideal',
      coachName: lineup.coachName || 'Mi entrenador',
      formationId: formationTemplates.some((formation) => formation.id === lineup.formationId) ? lineup.formationId : '4-3-3',
      captain: lineup.captain || '',
      penalty: lineup.penalty || '',
      freeKick: lineup.freeKick || '',
      corners: lineup.corners || '',
      selectedPlayers: Array.isArray(lineup.selectedPlayers) ? lineup.selectedPlayers.slice(0, maxSquadSize) : [],
      slots: Array.isArray(lineup.slots) ? lineup.slots.slice(0, 11) : Array(11).fill('')
    });
    syncInputs();
    persistState();
    renderAll();
  }

  function deleteLineup(id) {
    state.savedLineups = state.savedLineups.filter((lineup) => lineup.id !== id);
    persistState();
    renderSavedLineups();
  }

  function syncInputs() {
    if (el('once-ideal-team-name')) el('once-ideal-team-name').value = state.teamName;
    if (el('once-ideal-coach-name')) el('once-ideal-coach-name').value = state.coachName;
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  async function exportLineup(orientation) {
    const isTall = orientation === 'tall';
    const width = isTall ? 900 : 1600;
    const height = isTall ? 1600 : 900;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const background = await loadImage(isTall ? 'assets/once-ideal-pitch-tall.png' : 'assets/once-ideal-pitch-wide.png');
    if (background) context.drawImage(background, 0, 0, width, height);
    else {
      context.fillStyle = '#0b0b0b';
      context.fillRect(0, 0, width, height);
    }
    context.fillStyle = 'rgba(0, 0, 0, .26)';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    context.font = '800 38px Arial';
    context.fillText(state.teamName || 'Mi Once Ideal', width / 2, 54);
    context.font = '500 20px Arial';
    context.fillText(`${state.formationId} · Dirige: ${state.coachName || 'Mi entrenador'}`, width / 2, 84);
    const roles = flattenRoles();
    const rowCount = getTemplate().rows.length;
    roles.forEach((meta, index) => {
      const position = slotPosition(meta, rowCount);
      const x = (isTall ? position.tallX : position.wideX) / 100 * width;
      const y = (isTall ? position.tallY : position.wideY) / 100 * height;
      const player = playerById(state.slots[index]);
      context.fillStyle = '#f6bd38';
      context.font = 'bold 74px Arial';
      context.fillText('★', x, y + 23);
      context.fillStyle = player ? (player.position === 'MED' ? '#fff' : player.position === 'DEL' ? '#8ee9ff' : '#49d98f') : 'rgba(255,255,255,.85)';
      context.font = '800 18px Arial';
      const name = player?.name || 'LIBRE';
      const shortName = name.length > 20 ? `${name.slice(0, 19)}…` : name;
      context.fillText(shortName, x, y + 52);
      context.fillStyle = 'rgba(255,255,255,.85)';
      context.font = '600 13px Arial';
      context.fillText(meta.role, x, y + 70);
    });
    const link = document.createElement('a');
    link.download = `mi-once-ideal-${isTall ? '9x16' : '16x9'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setStatus(`Imagen ${isTall ? '9:16' : '16:9'} exportada correctamente.`, 'success');
  }

  function bindEvents() {
    el('once-ideal-formation').addEventListener('change', (event) => {
      state.formationId = event.target.value;
      const nextLength = flattenRoles().length;
      state.slots = [...state.slots.slice(0, nextLength), ...Array(Math.max(0, nextLength - state.slots.length)).fill('')];
      persistState();
      renderAll();
    });
    [['once-ideal-team-name', 'teamName'], ['once-ideal-coach-name', 'coachName']].forEach(([id, key]) => el(id).addEventListener('input', (event) => {
      state[key] = event.target.value;
      persistState();
      renderBoardHeader();
    }));
    [['once-ideal-captain', 'captain'], ['once-ideal-penalty', 'penalty'], ['once-ideal-free-kick', 'freeKick'], ['once-ideal-corners', 'corners']].forEach(([id, key]) => el(id).addEventListener('change', (event) => {
      state[key] = event.target.value;
      persistState();
    }));
    el('once-ideal-search').addEventListener('input', (event) => { state.search = event.target.value; renderRoster(); });
    el('once-ideal-team-filter').addEventListener('change', (event) => { state.teamFilter = event.target.value; renderRoster(); });
    el('once-ideal-save').addEventListener('click', saveLineup);
    el('once-ideal-export-wide').addEventListener('click', () => exportLineup('wide'));
    el('once-ideal-export-tall').addEventListener('click', () => exportLineup('tall'));

    document.addEventListener('click', (event) => {
      const action = event.target.closest('[data-once-action]');
      if (!action) return;
      const actionName = action.dataset.onceAction;
      if (actionName === 'add-player') addPlayer(action.dataset.playerId);
      if (actionName === 'remove-player') removePlayer(action.dataset.playerId);
      if (actionName === 'place-player') placePlayer(action.dataset.playerId);
      if (actionName === 'remove-slot') removeSlot(Number(action.dataset.slotIndex));
      if (actionName === 'load-lineup') loadLineup(action.dataset.lineupId);
      if (actionName === 'delete-lineup') deleteLineup(action.dataset.lineupId);
    });
    document.addEventListener('dragstart', (event) => {
      const playerCard = event.target.closest('[data-once-player-id]');
      const slot = event.target.closest('[data-once-slot]');
      const playerId = playerCard?.dataset.oncePlayerId || (slot ? state.slots[Number(slot.dataset.onceSlot)] : '');
      if (playerId && event.dataTransfer) event.dataTransfer.setData('text/plain', playerId);
    });
    document.addEventListener('dragover', (event) => {
      if (event.target.closest('[data-once-slot]') || event.target.closest('#once-ideal-board')) event.preventDefault();
    });
    document.addEventListener('drop', (event) => {
      const slot = event.target.closest('[data-once-slot]');
      const board = event.target.closest('#once-ideal-board');
      if (!slot && !board) return;
      event.preventDefault();
      const playerId = event.dataTransfer?.getData('text/plain');
      if (playerId) assignPlayerToSlot(playerId, slot ? Number(slot.dataset.onceSlot) : -1);
    });
  }

  async function loadPlayers() {
    if (typeof supabaseClient === 'undefined') {
      setStatus('No se pudo conectar con el catálogo de jugadores.', 'error');
      return;
    }
    try {
      const response = await supabaseClient.from('jugadores_equipo').select('*').order('nombre');
      if (response.error) throw response.error;
      state.players = (response.data || []).map((row, index) => {
        const id = String(row.id || `${row.abreviatura || 'club'}-${row.nombre || index}-${row.numero || index}`).replace(/\s+/g, '-');
        const position = normalizePosition(row.posicion);
        return {
          id,
          name: row.nombre || 'Jugador sin nombre',
          position,
          positionLabel: row.posicion || roleLabels[position] || position,
          teamAbbreviation: row.abreviatura || '',
          teamName: getTeamName(row.abreviatura),
          numero: row.numero || '',
          age: row.edad || '',
          nationality: row.nacionalidad || ''
        };
      });
      const ids = new Set(state.players.map((player) => player.id));
      state.selectedPlayers = state.selectedPlayers.filter((id) => ids.has(id)).slice(0, maxSquadSize);
      state.slots = state.slots.map((id) => ids.has(id) && state.selectedPlayers.includes(id) ? id : '');
      renderAll();
      setStatus(`${state.players.length} jugadores disponibles de los clubes registrados.`, 'success');
    } catch (error) {
      setStatus('No se pudo cargar la plantilla de jugadores. Revisa la conexión con Supabase.', 'error');
      el('once-ideal-roster').innerHTML = '<div class="once-ideal-empty">No se pudo cargar el catálogo.</div>';
    }
  }

  function init() {
    if (!el('once-ideal-board')) return;
    loadSavedState();
    renderFormationSelect();
    syncInputs();
    bindEvents();
    renderAll();
    loadPlayers();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
