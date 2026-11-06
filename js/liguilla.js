(function () {
  const phaseLabels = {
    quarter: 'Cuartos de final',
    semi: 'Semifinales',
    final: 'Final'
  };

  function state() {
    return typeof appState !== 'undefined' ? appState : { standings: [], matches: [] };
  }

  function escapeValue(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function normalizeValue(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function teamName(row, seed) {
    return row?.club || row?.nombre || row?.equipo || row?.team || `Equipo ${seed}`;
  }

  function seedTeam(standings, seed) {
    const row = standings[seed - 1];
    return row ? { seed, name: teamName(row, seed), row } : { seed, name: `Por definir (${seed}°)`, row: null };
  }

  function phaseName(match) {
    return normalizeValue([
      match?.fase,
      match?.ronda,
      match?.etapa,
      match?.competencia,
      match?.tipo_competencia,
      match?.nombre_competencia
    ].filter(Boolean).join(' '));
  }

  function isPlayoffMatch(match) {
    const phase = phaseName(match);
    return phase.includes('cuarto') || phase.includes('semifinal') || phase.includes('final') || phase.includes('liguilla');
  }

  function matchLeg(match) {
    const value = normalizeValue([match?.fase, match?.ronda, match?.etapa, match?.instancia].filter(Boolean).join(' '));
    if (value.includes('vuelta') || value.includes('2')) return 'Vuelta';
    if (value.includes('ida') || value.includes('1')) return 'Ida';
    return '';
  }

  function findExistingMatch(teamA, teamB, phase, leg) {
    const matches = state().matches || [];
    const targetPhase = normalizeValue(phase);
    return matches.find((match) => {
      if (!isPlayoffMatch(match)) return false;
      const matchPhase = phaseName(match);
      if (!matchPhase.includes(targetPhase)) return false;
      if (leg && matchLeg(match) && matchLeg(match) !== leg) return false;
      const local = normalizeValue(match.local);
      const visitor = normalizeValue(match.visitante);
      const firstPair = local === normalizeValue(teamA) && visitor === normalizeValue(teamB);
      const secondPair = local === normalizeValue(teamB) && visitor === normalizeValue(teamA);
      return firstPair || secondPair;
    });
  }

  function scoreLabel(match) {
    if (!match) return 'Pendiente';
    const hasHome = match.goles_local !== null && match.goles_local !== undefined && String(match.goles_local) !== '';
    const hasAway = match.goles_visitante !== null && match.goles_visitante !== undefined && String(match.goles_visitante) !== '';
    return hasHome && hasAway ? `${match.goles_local} - ${match.goles_visitante}` : 'Pendiente';
  }

  function legRow(teamA, teamB, phase, leg) {
    const match = findExistingMatch(teamA, teamB, phase, leg);
    return `<div class="playoff-leg"><span>${leg}</span><strong>${escapeValue(scoreLabel(match))}</strong></div>`;
  }

  function seriesCard(series) {
    return `
      <article class="playoff-series">
        <div class="playoff-series-heading"><span>${escapeValue(series.label)}</span><small>${escapeValue(series.seedLabel)}</small></div>
        <div class="playoff-teams"><strong>${escapeValue(series.teamA)}</strong><span>vs</span><strong>${escapeValue(series.teamB)}</strong></div>
        <div class="playoff-legs">
          ${legRow(series.teamA, series.teamB, series.phase, 'Ida')}
          ${legRow(series.teamA, series.teamB, series.phase, 'Vuelta')}
        </div>
      </article>
    `;
  }

  function placeholderSeries(label, teamA, teamB, phase) {
    return seriesCard({
      label,
      seedLabel: 'Esperando resultados',
      teamA,
      teamB,
      phase
    });
  }

  function renderLiguilla() {
    const container = document.getElementById('liguilla-container');
    const status = document.getElementById('liguilla-status');
    if (!container || !status) return;

    const standings = Array.isArray(state().standings) ? state().standings : [];
    if (!standings.length) {
      status.className = 'playoff-status warning';
      status.textContent = 'La llave aparecerá cuando se cargue la tabla de posiciones.';
      container.innerHTML = '<div class="empty-state">Todavía no hay posiciones disponibles.</div>';
      return;
    }

    const qualified = Array.from({ length: 8 }, (_, index) => seedTeam(standings, index + 1));
    const complete = standings.length >= 8;
    const qf = [
      { label: 'Serie 1', seedLabel: '1° vs 8°', teamA: qualified[0].name, teamB: qualified[7].name, phase: 'cuartos' },
      { label: 'Serie 2', seedLabel: '2° vs 7°', teamA: qualified[1].name, teamB: qualified[6].name, phase: 'cuartos' },
      { label: 'Serie 3', seedLabel: '3° vs 6°', teamA: qualified[2].name, teamB: qualified[5].name, phase: 'cuartos' },
      { label: 'Serie 4', seedLabel: '4° vs 5°', teamA: qualified[3].name, teamB: qualified[4].name, phase: 'cuartos' }
    ];

    const qfWinnerA = 'Ganador de Serie 1';
    const qfWinnerB = 'Ganador de Serie 4';
    const qfWinnerC = 'Ganador de Serie 2';
    const qfWinnerD = 'Ganador de Serie 3';

    status.className = `playoff-status ${complete ? 'success' : 'warning'}`;
    status.innerHTML = complete
      ? '<strong>Llave provisional activa.</strong> Se recalcula cuando cambie la tabla de posiciones.'
      : '<strong>Liguilla incompleta.</strong> Faltan equipos para construir las ocho posiciones clasificadas.';

    container.innerHTML = `
      <div class="playoff-board-note"><span>FORMATO</span><strong>Top 8 · Cuartos y semifinales a ida y vuelta · Final a partido único</strong></div>
      <div class="playoff-columns">
        <section class="playoff-column playoff-column-quarter">
          <div class="playoff-column-heading"><span class="eyebrow">CUARTOS</span><h2>${phaseLabels.quarter}</h2><small>1° vs 8° · 2° vs 7° · 3° vs 6° · 4° vs 5°</small></div>
          ${qf.map((series) => seriesCard(series)).join('')}
        </section>
        <section class="playoff-column playoff-column-semi">
          <div class="playoff-column-heading"><span class="eyebrow">SEMIFINALES</span><h2>${phaseLabels.semi}</h2><small>Se habilitan al concluir cuartos</small></div>
          ${placeholderSeries('Semifinal 1', qfWinnerA, qfWinnerB, 'semifinal')}
          ${placeholderSeries('Semifinal 2', qfWinnerC, qfWinnerD, 'semifinal')}
        </section>
        <section class="playoff-column playoff-column-final">
          <div class="playoff-column-heading"><span class="eyebrow">CAMPEONATO</span><h2>${phaseLabels.final}</h2><small>Partido único</small></div>
          <article class="playoff-final-card">
            <span class="playoff-final-cup" aria-hidden="true">🏆</span>
            <span class="eyebrow">GRAN FINAL</span>
            <strong>Ganador de Semifinal 1</strong>
            <span>vs</span>
            <strong>Ganador de Semifinal 2</strong>
            <div class="playoff-final-score">Pendiente</div>
          </article>
        </section>
      </div>
      <p class="playoff-disclaimer">La llave utiliza la tabla de posiciones disponible en la aplicación. Las semifinales y la final permanecerán pendientes hasta que existan sus resultados en los datos cargados.</p>
    `;
  }

  window.renderLiguilla = renderLiguilla;
})();
