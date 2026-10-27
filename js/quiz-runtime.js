function startQuizMode() {
  gameState = { ...defaultGameState(), mode: 'quiz', phase: 'quiz', quizIndex: 0, quizScore: 0, quizAnswered: false, quizSelected: null, quizCorrect: false, quizCompleted: false, quizLives: 3, quizFireLives: 0, quizRefillAt: 0, quizSubscriptionPending: false };
  saveGameState();
  renderJuego();
}

function refreshQuizLives() {
  if (!gameState.quizRefillAt || Date.now() < gameState.quizRefillAt) return;
  gameState.quizLives = 3;
  gameState.quizFireLives = 0;
  gameState.quizRefillAt = 0;
  saveGameState();
}

function consumeQuizLife() {
  if (gameState.quizLives > 0) {
    gameState.quizLives -= 1;
  } else if (gameState.quizFireLives > 0) {
    gameState.quizFireLives -= 1;
  }
}

function submitQuizAnswer(optionIndex) {
  refreshQuizLives();
  if (gameState.phase !== 'quiz' || gameState.quizCompleted || gameState.quizCorrect || gameState.quizLives + gameState.quizFireLives <= 0) return;
  const question = window.futbolMexicanoQuiz[gameState.quizIndex];
  if (!question) return;
  const selected = Number(optionIndex);
  gameState.quizAnswered = true;
  gameState.quizSelected = selected;
  gameState.quizCorrect = selected === question.correct;
  if (gameState.quizCorrect) {
    gameState.quizScore += 1;
  } else {
    consumeQuizLife();
  }
  saveGameState();
  renderJuego();
}

function waitForQuizLives() {
  if (gameState.quizLives + gameState.quizFireLives > 0) return;
  gameState.quizRefillAt = Date.now() + 30 * 60 * 1000;
  saveGameState();
  renderJuego();
}

function openQuizSubscription() {
  gameState.quizSubscriptionPending = true;
  saveGameState();
  window.open('https://youtube.com/@mobiledroid_yt_oficial?si=N9sV6qNjM7Rt63Jx', '_blank', 'noopener,noreferrer');
  renderJuego();
}

function claimQuizSubscriptionLives() {
  if (!gameState.quizSubscriptionPending) return;
  gameState.quizLives = 3;
  gameState.quizFireLives = 2;
  gameState.quizSubscriptionPending = false;
  gameState.quizAnswered = false;
  gameState.quizSelected = null;
  gameState.quizCorrect = false;
  saveGameState();
  renderJuego();
}

function quizLifeMarkup() {
  const normalLives = Array.from({ length: 3 }, (_, index) => {
    const active = index < gameState.quizLives;
    return '<span class="quiz-heart ' + (active ? 'quiz-heart-mexican-' + index : 'quiz-heart-empty') + '" aria-hidden="true">♥</span>';
  }).join('');
  const fireLives = Array.from({ length: gameState.quizFireLives || 0 }, () => '<span class="quiz-heart quiz-heart-fire" aria-hidden="true">♥</span>').join('');
  return '<div class="quiz-lives" aria-label="' + (gameState.quizLives + gameState.quizFireLives) + ' vidas disponibles"><span class="quiz-lives-label">Vidas</span>' + normalLives + fireLives + '</div>';
}

function quizLivesModal() {
  refreshQuizLives();
  if (gameState.quizLives + gameState.quizFireLives > 0) return '';
  const waiting = gameState.quizRefillAt > Date.now();
  if (waiting) {
    window.setTimeout(() => {
      if (gameState.phase === 'quiz') {
        refreshQuizLives();
        renderJuego();
      }
    }, Math.max(1000, gameState.quizRefillAt - Date.now() + 100));
  }
  const remainingMinutes = waiting ? Math.ceil((gameState.quizRefillAt - Date.now()) / 60000) : 30;
  const subscriptionButton = gameState.quizSubscriptionPending
    ? '<button class="quiz-life-action quiz-life-action-subscribe" type="button" data-game-action="quiz-claim-subscription">Ya me suscribí · reclamar 5 vidas</button>'
    : '<button class="quiz-life-action quiz-life-action-subscribe" type="button" data-game-action="quiz-subscribe">Suscribirme al canal · ganar 5 vidas</button>';
  return '<div class="quiz-lives-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-lives-title"><div class="quiz-lives-dialog"><span class="eyebrow">RETO EN PAUSA</span><h2 id="quiz-lives-title">TE QUEDASTE SIN VIDAS</h2><p>' + (waiting ? 'Tus vidas se restablecerán aproximadamente en ' + remainingMinutes + ' minutos.' : 'Elige cómo quieres continuar con el cuestionario.') + '</p><div class="quiz-life-actions"><button class="quiz-life-action" type="button" data-game-action="quiz-wait-lives" ' + (waiting ? 'disabled' : '') + '>' + (waiting ? 'Vidas en recuperación' : 'Esperar 30 minutos · recuperar 3 vidas') + '</button>' + subscriptionButton + '<button class="quiz-life-action quiz-life-action-exit" type="button" data-game-action="reset-game">Salir del juego</button></div><small>La suscripción se abre en YouTube. Después de suscribirte, regresa y pulsa el botón para reclamar las vidas.</small></div></div>';
}

function advanceQuiz() {
  if (!gameState.quizAnswered || !gameState.quizCorrect) return;
  if (gameState.quizIndex >= window.futbolMexicanoQuiz.length - 1) {
    gameState.quizCompleted = true;
    saveGameState();
    renderJuego();
    return;
  }
  gameState.quizIndex += 1;
  gameState.quizAnswered = false;
  gameState.quizSelected = null;
  gameState.quizCorrect = false;
  saveGameState();
  renderJuego();
}

function quizOptionClass(index) {
  if (!gameState.quizAnswered) return '';
  if (gameState.quizCorrect && index === window.futbolMexicanoQuiz[gameState.quizIndex].correct) return 'quiz-option-correct';
  if (!gameState.quizCorrect && index === gameState.quizSelected) return 'quiz-option-incorrect';
  return '';
}

function renderQuiz(container) {
  refreshQuizLives();
  const questions = window.futbolMexicanoQuiz || [];
  if (gameState.quizCompleted) {
    const percentage = Math.round((gameState.quizScore / questions.length) * 100);
    container.innerHTML = [
      '<article class="game-panel surface-card quiz-panel quiz-complete-panel">',
      '<div class="quiz-complete-badge">🏆</div>',
      '<span class="eyebrow">RETO COMPLETADO</span>',
      '<h2>¡Terminaste el cuestionario!</h2>',
      '<p>Respondiste correctamente <strong>' + gameState.quizScore + ' de ' + questions.length + '</strong> preguntas (' + percentage + '%).</p>',
      '<div class="quiz-score-final"><strong>' + gameState.quizScore + '</strong><span>aciertos</span></div>',
      '<button class="primary-btn" type="button" data-game-action="quiz-restart">Volver al nivel 1</button>',
      '</article>'
    ].join('');
    return;
  }
  const question = questions[gameState.quizIndex];
  if (!question) {
    container.innerHTML = '<article class="surface-card empty-state">No se pudieron cargar las preguntas.</article>';
    return;
  }
  const progress = Math.round(((gameState.quizIndex + (gameState.quizCorrect ? 1 : 0)) / questions.length) * 100);
  const feedback = gameState.quizAnswered
    ? gameState.quizCorrect
      ? '<div class="quiz-feedback quiz-feedback-correct"><strong>¡Respuesta correcta!</strong><span>' + gameEscape(question.explanation) + '</span></div>'
      : '<div class="quiz-feedback quiz-feedback-incorrect"><strong>Respuesta incorrecta.</strong><span>Inténtalo de nuevo para superar este nivel.</span></div>'
    : '';
  const options = question.options.map((option, index) => '<button class="quiz-option ' + quizOptionClass(index) + '" type="button" data-game-action="quiz-answer" data-option-index="' + index + '"><span class="quiz-option-letter">' + String.fromCharCode(65 + index) + '</span><span>' + gameEscape(option) + '</span></button>').join('');
  container.innerHTML = [
    '<article class="game-panel surface-card quiz-panel">',
    '<div class="quiz-topline"><div><span class="eyebrow">NIVEL ' + question.level + ' DE ' + questions.length + '</span><h2>' + gameEscape(question.title) + '</h2></div><div class="quiz-status"><strong class="quiz-score">' + gameState.quizScore + ' aciertos</strong>' + quizLifeMarkup() + '</div></div>',
    '<div class="quiz-progress" aria-label="Progreso del cuestionario"><span style="width: ' + progress + '%"></span></div>',
    '<p class="quiz-question">' + gameEscape(question.question) + '</p>',
    '<div class="quiz-options">' + options + '</div>',
    feedback,
    gameState.quizAnswered && gameState.quizCorrect ? '<button class="primary-btn quiz-next-btn" type="button" data-game-action="quiz-next">Siguiente nivel →</button>' : '',
    '<button class="text-btn quiz-exit-btn" type="button" data-game-action="reset-game">Salir del cuestionario</button>',
    quizLivesModal(),
    '</article>'
  ].join('');
}
