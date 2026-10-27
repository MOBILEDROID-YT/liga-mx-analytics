(() => {
  const storageKey = 'futbol-mx-analisis-futbolista-misterioso-v1';
  const maxAttempts = 6;
  const youtubeUrl = 'https://youtube.com/@mobiledroid_yt_oficial?si=N9sV6qNjM7Rt63Jx';
  const aliases = {
    'Duk': ['Luís Henriques de Barros Lopes'],
    'Uroš Đurđević': ['Uros Durdevic'],
    'Luis Ángel Malagón': ['Luis Angel Malagon'],
    'Érick Sánchez': ['Erick Sanchez'],
    'Érik Lira': ['Erik Lira'],
    'João Pedro': ['Joao Pedro'],
    'Sébastien Salles-Lamonge': ['Sebastien Salles-Lamonge'],
    'Alí Ávila': ['Ali Avila']
  };
  const seedGroups = {
    América: ['Luis Ángel Malagón', 'Israel Reyes', 'Kevin Álvarez', 'Érick Sánchez', 'Raphael Veiga', 'Alejandro Zendejas', 'Brian Rodríguez', 'Henry Martín'],
    Guadalajara: ['Raúl Rangel', 'Armando González', 'Luis Romo', 'Roberto Alvarado', 'Efraín Álvarez', 'Hugo Camberos', 'Ángel Sepúlveda', 'Brian Gutiérrez'],
    'Cruz Azul': ['Kevin Mier', 'Willer Ditta', 'Érik Lira', 'Carlos Rodríguez', 'José Paradela', 'Agustín Palavecino', 'Luka Romero', 'Gabriel Fernández'],
    'Tigres UANL': ['Nahuel Guzmán', 'Juan Brunetta', 'Diego Lainez', 'Fernando Gorriarán', 'Ozziel Herrera', 'Joaquim', 'Marcelo Flores', 'Rodrigo Aguirre'],
    Monterrey: ['Esteban Andrada', 'Gerardo Arteaga', 'Víctor Guzmán', 'Lucas Ocampos', 'Óliver Torres', 'Orbelín Pineda', 'Uroš Đurđević', 'Diego Rossi'],
    Toluca: ['Paulinho', 'Alexis Vega', 'Marcel Ruiz', 'Jesús Gallardo', 'Helinho', 'Jesús Angulo', 'Federico Pereira', 'Nicolás Castro'],
    'Pumas UNAM': ['Keylor Navas', 'Adalberto Carrasquilla', 'Pedro Vite', 'Álvaro Angulo', 'Rubén Duarte', 'Sebastián Córdova', 'Robert Morales'],
    Pachuca: ['Salomón Rondón', 'Oussama Idrissi', 'Carlos Moreno', 'Sergio Barreto', 'Rodolfo Pizarro', 'Alán Bautista', 'Kenedy'],
    Atlas: ['Camilo Vargas', 'Aldo Rocha', 'Gaddi Aguirre', 'Kevin Zenón', 'Duk'],
    Tijuana: ['Gilberto Mora', 'Ignacio Rivero', 'Jackson Porozo', 'Adonis Preciado', 'Ramiro Árciga'],
    León: ['Díber Cambindo', 'Ismael Díaz', 'Jordi Cortizo', 'Fernando Beltrán', 'Rodrigo Echeverría'],
    'Atlético de San Luis': ['João Pedro', 'Sébastien Salles-Lamonge', 'Benjamín Galdames', 'Anderson Duarte', 'Felipe Mora'],
    Necaxa: ['Alexis Peña', 'Lorenzo Faravelli', 'Julián Carranza', 'Kevin Rosero'],
    'FC Juárez': ['Sebastián Jurado', 'Óscar Estupiñán', 'Guilherme Castilho'],
    'Santos Laguna': ['Carlos Acevedo', 'Bruno Amione', 'Ramiro Sordo'],
    Querétaro: ['Guillermo Allison', 'Santiago Homenchenko', 'Alí Ávila'],
    Puebla: ['Facundo Almada', 'Heriberto Jurado', 'Carlos Baltazar'],
    Atlante: ['Óscar Jiménez', 'Jhojan Julio']
  };
  const seedCandidates = Object.entries(seedGroups).flatMap(([referenceClub, names]) => names.map((name) => ({ name, referenceClub })));
  const state = {
    screen: 'setup',
    difficulty: 'quick',
    targetId: '',
    attempts: 0,
    revealedClues: 1,
    guesses: [],
    feedback: '',
    feedbackType: '',
    selectedSuggestion: '',
    rows: [],
    candidates: [],
    stats: { started: 0, completed: 0, wins: 0, totalAttempts: 0, streak: 0, bestStreak: 0, usedIds: [], history: [] }
  };

  const el = (id) => document.getElementById(id);
  const escapeValue = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  function saveMysteryState() {
    localStorage.setItem(storageKey, JSON.stringify({ ...state, rows: [], candidates: [] }));
  }

  function loadMysteryState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      Object.assign(state, saved, { rows: [], candidates: [] });
      state.stats = { ...state.stats, ...(saved.stats || {}) };
      if (!Array.isArray(state.stats.usedIds)) state.stats.usedIds = [];
      if (!Array.isArray(state.stats.history)) state.stats.history = [];
    } catch (error) {
      localStorage.removeItem(storageKey);
    }
  }

  function teamName(abbreviation, fallback = 'Club registrado') {
    const teams = typeof appState !== 'undefined' && Array.isArray(appState.teams) ? appState.teams : [];
    return teams.find((team) => team.abreviatura === abbreviation)?.nombre || abbreviation || fallback;
  }

  function positionLabel(value) {
    const position = normalize(value);
    if (position.includes('por') || position.includes('arqu')) return 'portero';
    if (position.includes('def')) return 'defensa';
    if (position.includes('med') || position.includes('medio')) return 'mediocampista';
    if (position.includes('del') || position.includes('ata') || position.includes('ext')) return 'delantero';
    return 'futbolista de campo';
  }

  function safeId(value) {
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  }

  function findRosterRow(candidate) {
    const names = [candidate.name, ...(aliases[candidate.name] || [])].map(normalize);
    return state.rows.find((row) => names.includes(normalize(row.nombre))) || null;
  }

  function buildCandidate(candidate, row, index) {
    const id = String(row.id || `mystery-${safeId(candidate.name)}-${index}`);
    return {
      id,
      seedName: candidate.name,
      name: row.nombre || candidate.name,
      referenceClub: candidate.referenceClub,
      club: teamName(row.abreviatura, candidate.referenceClub),
      abbreviation: row.abreviatura || '',
      position: positionLabel(row.posicion),
      nationality: row.nacionalidad || '',
      age: row.edad || '',
      number: row.numero || '',
      difficulty: index < 40 ? 'easy' : index < 80 ? 'medium' : 'hard',
      source: 'Supabase · jugadores_equipo',
      verified: true
    };
  }

  function rebuildCandidates() {
    state.candidates = seedCandidates.map((candidate, index) => {
      const row = findRosterRow(candidate);
      return row ? buildCandidate(candidate, row, index) : { id: `pending-${safeId(candidate.name)}-${index}`, seedName: candidate.name, referenceClub: candidate.referenceClub, verified: false, pendingReason: 'No coincide con una ficha actual de Supabase.' };
    });
  }

  function eligibleCandidates() {
    let candidates = state.candidates.filter((candidate) => candidate.verified);
    if (state.difficulty !== 'quick' && state.difficulty !== 'daily') candidates = candidates.filter((candidate) => candidate.difficulty === state.difficulty);
    return candidates;
  }

  function targetCandidate() {
    return state.candidates.find((candidate) => candidate.id === state.targetId && candidate.verified);
  }

  function answerIdFromText(value) {
    const typed = normalize(value);
    return state.candidates.find((candidate) => candidate.verified && [candidate.name, ...(aliases[candidate.seedName] || [])].some((name) => normalize(name) === typed))?.id || '';
  }

  function clueList(candidate) {
    const nameWordCount = candidate.name.split(/\s+/).filter(Boolean).length;
    const clues = [
      `Su posición habitual registrada es ${candidate.position}.`,
      `Actualmente aparece en la plantilla de ${candidate.club}.`,
      candidate.nationality ? `Su nacionalidad registrada es ${candidate.nationality}.` : 'La nacionalidad no está disponible en la ficha actual.',
      candidate.number ? `Su ficha registra el dorsal ${candidate.number}.` : 'La ficha actual no registra un dorsal.',
      `Su nombre deportivo tiene ${nameWordCount} palabras y no se muestra hasta revelar la respuesta.`,
      candidate.age ? `La ficha actual registra ${candidate.age} años.` : 'La ficha actual no registra la edad.'
    ];
    return clues;
  }

  function todayKey() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
  }

  function dailyIndex(candidates) {
    const text = todayKey();
    const value = Array.from(text).reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) % 100000, 7);
    return candidates.length ? value % candidates.length : 0;
  }

  function chooseTarget() {
    const candidates = eligibleCandidates();
    if (!candidates.length) return null;
    if (state.difficulty === 'daily') return candidates[dailyIndex(candidates)];
    let available = candidates.filter((candidate) => !state.stats.usedIds.includes(candidate.id));
    if (!available.length) {
      state.stats.usedIds = [];
      available = candidates;
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  function displayStats() {
    const stats = state.stats;
    const accuracy = stats.completed ? Math.round((stats.wins / stats.completed) * 100) : 0;
    return `<div class="mystery-stats"><div><strong>${stats.started}</strong><span>Partidas</span></div><div><strong>${accuracy}%</strong><span>Aciertos</span></div><div><strong>${stats.totalAttempts ? (stats.totalAttempts / Math.max(1, stats.completed)).toFixed(1) : '0.0'}</strong><span>Intentos promedio</span></div><div><strong>${stats.bestStreak}</strong><span>Mejor racha</span></div></div>`;
  }

  function pendingSummary() {
    const playable = state.candidates.filter((candidate) => candidate.verified).length;
    const pending = state.candidates.length - playable;
    return `${playable} fichas jugables de 100 · ${pending} pendientes de coincidencia con Supabase`;
  }

  function renderSetup(container) {
    const candidates = eligibleCandidates();
    container.innerHTML = `<article class="mystery-shell surface-card"><div class="mystery-heading"><div><span class="eyebrow">NUEVO RETO</span><h2>El futbolista misterioso</h2><p>Lee las pistas, escribe el nombre correcto y descubre una ficha de la Liga MX antes de quedarte sin intentos.</p></div><div class="mystery-question-mark">?</div></div><div class="mystery-data-note">${escapeValue(pendingSummary())}. Las fichas pendientes no se usan para evitar datos inventados.</div><div class="mystery-mode-grid"><label><span>Dificultad</span><select id="mystery-difficulty"><option value="quick" ${state.difficulty === 'quick' ? 'selected' : ''}>Partida rápida</option><option value="easy" ${state.difficulty === 'easy' ? 'selected' : ''}>Fácil</option><option value="medium" ${state.difficulty === 'medium' ? 'selected' : ''}>Media</option><option value="hard" ${state.difficulty === 'hard' ? 'selected' : ''}>Difícil</option><option value="daily" ${state.difficulty === 'daily' ? 'selected' : ''}>Reto diario · ${todayKey()}</option></select></label><div class="mystery-mode-copy"><strong>${candidates.length ? '¿Listo para jugar?' : 'Faltan fichas jugables'}</strong><small>${candidates.length ? 'Cada error desbloquea una pista nueva. Tienes 6 intentos.' : 'Agrega o actualiza jugadores en jugadores_equipo para activar este modo.'}</small></div></div><div class="mystery-actions"><button class="primary-btn" type="button" data-mystery-action="new-round" ${candidates.length ? '' : 'disabled'}>Comenzar partida</button><button class="ghost-btn" type="button" data-mystery-action="reset-history">Reiniciar historial</button><button class="text-btn" type="button" data-game-action="reset-game">Volver a juegos</button></div>${displayStats()}</article>`;
  }

  function renderClues(candidate) {
    const clues = clueList(candidate);
    return clues.map((clue, index) => `<div class="mystery-clue ${index < state.revealedClues ? 'revealed' : 'locked'}"><span>${index < state.revealedClues ? '✓' : '🔒'}</span><p>${index < state.revealedClues ? escapeValue(clue) : 'Pista bloqueada: aparece después de un intento incorrecto.'}</p></div>`).join('');
  }

  function renderSuggestions(candidatePool) {
    const input = el('mystery-answer');
    const query = normalize(input?.value || '');
    const matches = query.length < 2 ? [] : candidatePool.filter((candidate) => normalize(candidate.name).includes(query)).slice(0, 6);
    const list = el('mystery-suggestions');
    if (!list) return;
    list.innerHTML = matches.map((candidate) => `<button type="button" data-mystery-action="suggest" data-mystery-id="${escapeValue(candidate.id)}"><strong>${escapeValue(candidate.name)}</strong><small>${escapeValue(candidate.club)}</small></button>`).join('');
    list.classList.toggle('visible', matches.length > 0);
  }

  function renderPlaying(container) {
    const candidate = targetCandidate();
    if (!candidate) return renderSetup(container);
    const candidates = eligibleCandidates();
    const remaining = maxAttempts - state.attempts;
    const guesses = state.guesses.map((id) => state.candidates.find((item) => item.id === id)?.name).filter(Boolean);
    container.innerHTML = `<article class="mystery-shell surface-card"><div class="mystery-topline"><div><span class="eyebrow">${state.difficulty === 'daily' ? 'RETO DIARIO' : 'PARTIDA ACTIVA'}</span><h2>¿Quién es el futbolista?</h2><p>La respuesta está entre los jugadores registrados en la plantilla.</p></div><div class="mystery-attempts"><strong>${remaining}</strong><span>intentos</span><div>${Array.from({ length: maxAttempts }, (_, index) => `<i class="${index < remaining ? 'active' : ''}"></i>`).join('')}</div></div></div><div class="mystery-play-layout"><section class="mystery-card"><div class="mystery-silhouette"><span>?</span></div><div class="mystery-clues">${renderClues(candidate)}</div></section><section class="mystery-answer-card"><label for="mystery-answer">Escribe tu respuesta</label><div class="mystery-answer-row"><input id="mystery-answer" type="search" autocomplete="off" placeholder="Nombre del futbolista..." value=""><button class="primary-btn" type="button" data-mystery-action="submit-guess">Comprobar</button></div><div id="mystery-suggestions" class="mystery-suggestions"></div>${state.feedback ? `<div class="mystery-feedback ${escapeValue(state.feedbackType)}">${escapeValue(state.feedback)}</div>` : ''}${guesses.length ? `<div class="mystery-previous"><strong>Intentos anteriores</strong>${guesses.map((guess) => `<span>${escapeValue(guess)}</span>`).join('')}</div>` : ''}<button class="text-btn" type="button" data-mystery-action="give-up">Rendirse y revelar respuesta</button></section></div><div class="mystery-bottom-actions"><button class="ghost-btn" type="button" data-game-action="reset-game">Salir del juego</button><span>Las pistas se basan únicamente en datos registrados.</span></div></article>`;
    const input = el('mystery-answer');
    input.addEventListener('input', () => { state.selectedSuggestion = ''; renderSuggestions(candidates); });
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); submitGuess(); } });
  }

  function renderResult(container) {
    const candidate = targetCandidate();
    if (!candidate) return renderSetup(container);
    const won = state.feedbackType === 'success';
    container.innerHTML = `<article class="mystery-shell surface-card mystery-result"><div class="mystery-result-badge">${won ? '✓' : '!'}</div><span class="eyebrow">${won ? '¡RESPUESTA CORRECTA!' : 'PARTIDA TERMINADA'}</span><h2>${won ? 'Lo descubriste' : 'La respuesta era'}</h2><div class="mystery-reveal"><div class="mystery-silhouette revealed"><span>⚽</span></div><div><strong>${escapeValue(candidate.name)}</strong><span>${escapeValue(candidate.club)} · ${escapeValue(candidate.position)}</span>${candidate.nationality ? `<span>${escapeValue(candidate.nationality)}</span>` : ''}</div></div><p>${won ? `Adivinaste en ${state.attempts} intento${state.attempts === 1 ? '' : 's'}.` : 'No pasa nada: aprende la pista y vuelve a intentarlo.'}</p><div class="mystery-actions"><button class="primary-btn" type="button" data-mystery-action="new-round">Jugar otra partida</button><button class="ghost-btn" type="button" data-mystery-action="back-setup">Elegir dificultad</button><button class="text-btn" type="button" data-game-action="reset-game">Volver a juegos</button></div>${displayStats()}</article>`;
  }

  function renderMystery(container) {
    if (!state.candidates.length) {
      container.innerHTML = '<article class="surface-card empty-state">Cargando jugadores verificables...</article>';
      return;
    }
    if (state.screen === 'playing') return renderPlaying(container);
    if (state.screen === 'result') return renderResult(container);
    renderSetup(container);
  }

  function startMysteryMode() {
    gameState = { ...defaultGameState(), mode: 'mystery', phase: 'mystery' };
    loadMysteryState();
    state.screen = 'setup';
    saveGameState();
    renderJuego();
    loadMysteryRoster();
  }

  function startNewRound() {
    const target = chooseTarget();
    if (!target) return;
    state.targetId = target.id;
    state.attempts = 0;
    state.revealedClues = 1;
    state.guesses = [];
    state.feedback = '';
    state.feedbackType = '';
    state.selectedSuggestion = '';
    state.screen = 'playing';
    state.stats.started += 1;
    if (state.difficulty !== 'daily') state.stats.usedIds = [...new Set([...state.stats.usedIds, target.id])];
    saveMysteryState();
    renderJuego();
  }

  function submitGuess() {
    const candidate = targetCandidate();
    const input = el('mystery-answer');
    if (!candidate || !input) return;
    const typed = normalize(input.value);
    const selected = state.selectedSuggestion || answerIdFromText(typed);
    if (!selected) {
      state.feedback = 'Selecciona un jugador de las sugerencias o escribe su nombre completo.';
      state.feedbackType = 'warning';
      renderJuego();
      return;
    }
    if (state.guesses.includes(selected)) {
      state.feedback = 'Ese jugador ya fue intentado. Elige otra respuesta.';
      state.feedbackType = 'warning';
      renderJuego();
      return;
    }
    state.guesses.push(selected);
    state.attempts += 1;
    if (selected === candidate.id) {
      state.feedback = '¡Acertaste!';
      state.feedbackType = 'success';
      state.screen = 'result';
      state.stats.completed += 1;
      state.stats.wins += 1;
      state.stats.totalAttempts += state.attempts;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
      state.stats.history = [{ id: candidate.id, name: candidate.name, result: 'acierto', attempts: state.attempts, date: new Date().toISOString() }, ...state.stats.history].slice(0, 100);
    } else {
      state.revealedClues = Math.min(6, state.revealedClues + 1);
      state.feedback = state.attempts >= maxAttempts ? `Se acabaron los intentos. La respuesta era ${candidate.name}.` : 'No es ese futbolista. Inténtalo de nuevo: se desbloqueó otra pista.';
      state.feedbackType = 'error';
      if (state.attempts >= maxAttempts) {
        state.screen = 'result';
        state.stats.completed += 1;
        state.stats.totalAttempts += state.attempts;
        state.stats.streak = 0;
        state.stats.history = [{ id: candidate.id, name: candidate.name, result: 'fallo', attempts: state.attempts, date: new Date().toISOString() }, ...state.stats.history].slice(0, 100);
      }
    }
    saveMysteryState();
    renderJuego();
  }

  function giveUp() {
    const candidate = targetCandidate();
    if (!candidate) return;
    state.attempts = maxAttempts;
    state.feedback = `Te rendiste. La respuesta era ${candidate.name}.`;
    state.feedbackType = 'error';
    state.screen = 'result';
    state.stats.completed += 1;
    state.stats.totalAttempts += state.attempts;
    state.stats.streak = 0;
    state.stats.history = [{ id: candidate.id, name: candidate.name, result: 'rendición', attempts: state.attempts, date: new Date().toISOString() }, ...state.stats.history].slice(0, 100);
    saveMysteryState();
    renderJuego();
  }

  function resetHistory() {
    state.stats = { started: 0, completed: 0, wins: 0, totalAttempts: 0, streak: 0, bestStreak: 0, usedIds: [], history: [] };
    saveMysteryState();
    renderJuego();
  }

  function handleMysteryClick(event) {
    const button = event.target.closest('[data-mystery-action]');
    if (!button) return;
    const action = button.dataset.mysteryAction;
    if (action === 'new-round') startNewRound();
    if (action === 'submit-guess') submitGuess();
    if (action === 'give-up') giveUp();
    if (action === 'reset-history') resetHistory();
    if (action === 'back-setup') { state.screen = 'setup'; state.targetId = ''; state.feedback = ''; saveMysteryState(); renderJuego(); }
    if (action === 'suggest') {
      state.selectedSuggestion = button.dataset.mysteryId;
      const candidate = state.candidates.find((item) => item.id === state.selectedSuggestion);
      if (el('mystery-answer')) el('mystery-answer').value = candidate?.name || '';
      if (el('mystery-suggestions')) el('mystery-suggestions').classList.remove('visible');
    }
  }

  async function loadMysteryRoster() {
    if (typeof supabaseClient === 'undefined') return;
    try {
      const response = await supabaseClient.from('jugadores_equipo').select('*').order('nombre');
      if (response.error) throw response.error;
      state.rows = response.data || [];
      rebuildCandidates();
      if (gameState.phase === 'mystery') renderJuego();
    } catch (error) {
      state.rows = [];
      rebuildCandidates();
      if (gameState.phase === 'mystery') renderJuego();
    }
  }

  document.addEventListener('click', handleMysteryClick);
  document.addEventListener('change', (event) => {
    if (event.target.id !== 'mystery-difficulty') return;
    state.difficulty = event.target.value;
    saveMysteryState();
  });

  window.startMysteryMode = startMysteryMode;
  window.renderMystery = renderMystery;
  loadMysteryState();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof gameState !== 'undefined' && gameState.phase === 'mystery') {
        loadMysteryRoster();
        if (typeof renderJuego === 'function') renderJuego();
      }
    });
  }
})();
