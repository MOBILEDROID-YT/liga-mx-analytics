function startQuizMode() {
  gameState = { ...defaultGameState(), mode: 'quiz', phase: 'quiz', quizIndex: 0, quizScore: 0, quizAnswered: false, quizSelected: null, quizCorrect: false, quizCompleted: false };
  saveGameState();
  renderJuego();
}

function submitQuizAnswer(optionIndex) {
  if (gameState.phase !== 'quiz' || gameState.quizAnswered || gameState.quizCompleted) return;
  const question = window.futbolMexicanoQuiz[gameState.quizIndex];
  if (!question) return;
  const selected = Number(optionIndex);
  gameState.quizAnswered = true;
  gameState.quizSelected = selected;
  gameState.quizCorrect = selected === question.correct;
  if (gameState.quizCorrect) gameState.quizScore += 1;
  saveGameState();
  renderJuego();
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
    '<div class="quiz-topline"><div><span class="eyebrow">NIVEL ' + question.level + ' DE ' + questions.length + '</span><h2>' + gameEscape(question.title) + '</h2></div><strong class="quiz-score">' + gameState.quizScore + ' aciertos</strong></div>',
    '<div class="quiz-progress" aria-label="Progreso del cuestionario"><span style="width: ' + progress + '%"></span></div>',
    '<p class="quiz-question">' + gameEscape(question.question) + '</p>',
    '<div class="quiz-options">' + options + '</div>',
    feedback,
    gameState.quizAnswered && gameState.quizCorrect ? '<button class="primary-btn quiz-next-btn" type="button" data-game-action="quiz-next">Siguiente nivel →</button>' : '',
    '<button class="text-btn quiz-exit-btn" type="button" data-game-action="reset-game">Salir del cuestionario</button>',
    '</article>'
  ].join('');
}
