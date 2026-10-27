(() => {
  const storagePrefix = 'futbol-mx-analisis-rangos-v1';
  const ranks = [
    { id: 'principiante', label: 'Principiante', minimum: 0, column: 0, row: 0 },
    { id: 'amateur', label: 'Amateur', minimum: 100, column: 1, row: 0 },
    { id: 'semi-profesional', label: 'Semi-profesional', minimum: 250, column: 2, row: 0 },
    { id: 'estrella', label: 'Estrella', minimum: 500, column: 3, row: 0 },
    { id: 'nivel-platino', label: 'Nivel platino', minimum: 1000, column: 4, row: 0 },
    { id: 'oro', label: 'Oro', minimum: 2000, column: 0, row: 1 },
    { id: 'diamante', label: 'Diamante', minimum: 3500, column: 1, row: 1 },
    { id: 'experto', label: 'Experto', minimum: 5500, column: 2, row: 1 },
    { id: 'veterano', label: 'Veterano', minimum: 8000, column: 3, row: 1 },
    { id: 'legendario', label: 'Legendario', minimum: 12000, column: 4, row: 1 }
  ];

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function currentUser(user = window.appState?.user) {
    if (user) return user;
    return typeof appState !== 'undefined' ? appState.user : null;
  }

  function storageKey(user = currentUser()) {
    return `${storagePrefix}:${user?.id || 'guest'}`;
  }

  function readProgress(user = currentUser()) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(user)) || '{}');
      return {
        points: Math.max(0, Number(saved.points) || 0),
        history: Array.isArray(saved.history) ? saved.history.slice(0, 40) : []
      };
    } catch (error) {
      return { points: 0, history: [] };
    }
  }

  function rankForPoints(points) {
    return ranks.reduce((current, rank) => points >= rank.minimum ? rank : current, ranks[0]);
  }

  function rankIndex(rank) {
    return Math.max(0, ranks.findIndex((item) => item.id === rank.id));
  }

  function formatPoints(points) {
    return Number(points).toLocaleString('es-MX');
  }

  function avatarMarkup(user) {
    const metadata = user?.user_metadata || {};
    const photo = metadata.avatar_url || metadata.picture || metadata.photo_url || '';
    if (photo) return `<img class="rank-avatar-photo" src="${escapeHtml(photo)}" alt="" referrerpolicy="no-referrer">`;
    const name = metadata.display_name || metadata.full_name || user?.email || 'Usuario';
    const initials = String(name).trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
    return `<span class="rank-avatar-fallback" aria-hidden="true">${escapeHtml(initials)}</span>`;
  }

  function badgeMarkup(user, size = 'compact') {
    const progress = readProgress(user);
    const rank = rankForPoints(progress.points);
    const title = `${rank.label} · ${formatPoints(progress.points)} puntos`;
    return `<div class="rank-badge rank-badge-${size}" title="${escapeHtml(title)}" aria-label="Rango ${escapeHtml(title)}"><span class="rank-badge-art" style="--rank-x:${rank.column * 25}%;--rank-y:${rank.row * 100}%"></span>${avatarMarkup(user)}</div>`;
  }

  function updateUserRankUI(user = currentUser()) {
    const progress = readProgress(user);
    const rank = rankForPoints(progress.points);
    const headerBadge = document.getElementById('auth-profile-badge');
    if (headerBadge) headerBadge.innerHTML = user ? badgeMarkup(user, 'compact') : '';
    const accountRank = document.getElementById('account-rank');
    if (!accountRank) return;
    if (!user) {
      accountRank.innerHTML = '';
      return;
    }
    const index = rankIndex(rank);
    const next = ranks[index + 1];
    const nextText = next ? `Te faltan ${formatPoints(next.minimum - progress.points)} puntos para ${next.label}.` : 'Has alcanzado el rango máximo.';
    accountRank.innerHTML = `<div class="account-rank-visual">${badgeMarkup(user, 'account')}</div><div class="account-rank-copy"><span class="eyebrow">PROGRESO DEL USUARIO</span><strong>${escapeHtml(rank.label)}</strong><span>${formatPoints(progress.points)} puntos</span><small>${escapeHtml(nextText)}</small></div>`;
  }

  function awardUserPoints(amount, reason = 'Actividad completada') {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    if (!value) return readProgress();
    const user = currentUser();
    const progress = readProgress(user);
    progress.points += value;
    progress.history.unshift({ points: value, reason: String(reason), date: new Date().toISOString() });
    progress.history = progress.history.slice(0, 40);
    localStorage.setItem(storageKey(user), JSON.stringify(progress));
    updateUserRankUI(user);
    window.dispatchEvent(new CustomEvent('user:points-changed', { detail: progress }));
    return progress;
  }

  window.awardUserPoints = awardUserPoints;
  window.getUserRankProgress = (user = currentUser()) => {
    const progress = readProgress(user);
    return { ...progress, rank: rankForPoints(progress.points), ranks };
  };
  window.updateUserRankUI = updateUserRankUI;
  window.addEventListener('auth:user-changed', (event) => updateUserRankUI(event.detail || currentUser()));
  document.addEventListener('DOMContentLoaded', () => updateUserRankUI());
})();
