/* ──────────────────────────────────────────
   GitHub Actions Quiz · app.js
─────────────────────────────────────────── */

let questions = [];
let quizMode = 'exam'; // 'exam' | 'practice'
const userAnswers = {}; // { questionNumber: Set of selected keys }

// ── DOM refs ──────────────────────────────
const screens = {
  start: document.getElementById('screen-start'),
  quiz:  document.getElementById('screen-quiz'),
  results: document.getElementById('screen-results'),
};
const totalCountEl    = document.getElementById('total-count');
const examTitleEl     = document.getElementById('exam-title');
const progressBar     = document.getElementById('progress-bar');
const progressText    = document.getElementById('progress-text');
const questionsEl     = document.getElementById('questions-container');
const btnStart        = document.getElementById('btn-start');
const btnSubmit       = document.getElementById('btn-submit');
const btnRetake       = document.getElementById('btn-retake');
const btnReview       = document.getElementById('btn-review');
const btnWrong        = document.getElementById('btn-wrong');
const btnBack         = document.getElementById('btn-back');
const quizModeLabel   = document.getElementById('quiz-mode-label');
const reviewContainer = document.getElementById('review-container');
const jsonFileInput   = document.getElementById('json-file-input');
const dropZone        = document.getElementById('drop-zone');
const fileNameEl      = document.getElementById('file-name');
const loadErrorEl     = document.getElementById('load-error');
const btnModeExam     = document.getElementById('btn-mode-exam');
const btnModePractice = document.getElementById('btn-mode-practice');
const inputQFrom      = document.getElementById('input-q-from');
const inputQTo        = document.getElementById('input-q-to');
const inputQPick      = document.getElementById('input-q-pick');
const qCountDisplay   = document.getElementById('q-count-display');
const toggleShuffle   = document.getElementById('toggle-shuffle');

const scoreCircle     = document.getElementById('score-circle');
const scorePercent    = document.getElementById('score-percent');
const resultsTitle    = document.getElementById('results-title');
const resultsSubtitle = document.getElementById('results-subtitle');
const statCorrect     = document.getElementById('stat-correct');
const statWrong       = document.getElementById('stat-wrong');
const statTotal       = document.getElementById('stat-total');

// ── Load data ─────────────────────────────
function applyQuestions(data) {
  // Support both plain array (legacy) and new { exam_name, Questions } format
  let questionList, examName;
  if (Array.isArray(data)) {
    questionList = data;
    examName = null;
  } else if (data && Array.isArray(data.questions)) {
    questionList = data.questions;
    examName = data.exam_name || null;
  } else {
    throw new Error('Invalid format: expected an array or an object with a "Questions" array.');
  }

  if (questionList.length === 0) throw new Error('The JSON must contain at least one question.');
  if (!questionList[0].question || !questionList[0].answers || !questionList[0].correct_answers) {
    throw new Error('Invalid format: each question must have "question", "answers" and "correct_answers".');
  }

  questions = questionList;

  // Update exam name in the UI
  if (examName) {
    examTitleEl.textContent = examName;
    document.title = examName + ' · Quiz';
  } else {
    examTitleEl.textContent = 'GitHub Actions Certification';
    document.title = 'GitHub Actions Quiz';
  }
  totalCountEl.textContent = questions.length;
  // Update range inputs to match loaded questions
  inputQFrom.min = 1;  inputQFrom.max = questions.length;  inputQFrom.value = 1;
  inputQTo.min   = 1;  inputQTo.max   = questions.length;  inputQTo.value   = questions.length;
  inputQPick.min = 1;  inputQPick.max = questions.length;  inputQPick.value = questions.length;
  qCountDisplay.textContent = `(${questions.length})`;
  toggleShuffle.checked = false;
  btnStart.disabled = false;
  loadErrorEl.classList.add('hidden');
}

async function loadDefaultQuestions() {
  try {
    const res = await fetch('questions.json');
    if (!res.ok) throw new Error('questions.json not found.');
    const data = await res.json();
    applyQuestions(data);
    fileNameEl.textContent = '✓ questions.json (default)';
    fileNameEl.classList.remove('hidden');
    dropZone.classList.add('loaded');
  } catch (e) {
    // Default file not available — user must load manually
    btnStart.disabled = true;
  }
}

function handleFileLoad(file) {
  if (!file) return;
  if (!file.name.endsWith('.json')) {
    showLoadError('Please select a valid .json file.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      applyQuestions(data);
      fileNameEl.textContent = `✓ ${file.name} (${questions.length} questions)`;
      fileNameEl.classList.remove('hidden');
      dropZone.classList.add('loaded');
    } catch (err) {
      showLoadError(err.message || 'Could not parse the JSON file.');
    }
  };
  reader.readAsText(file);
}

function showLoadError(msg) {
  loadErrorEl.textContent = '⚠ ' + msg;
  loadErrorEl.classList.remove('hidden');
  dropZone.classList.remove('loaded');
  fileNameEl.classList.add('hidden');
  btnStart.disabled = true;
}

// ── Navigation ────────────────────────────
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ── Build quiz UI ─────────────────────────
function buildQuiz() {
  questionsEl.innerHTML = '';

  // Clear previous answers
  Object.keys(userAnswers).forEach(k => delete userAnswers[k]);

  // Apply count and shuffle options
  const qFrom = Math.max(1, parseInt(inputQFrom.value, 10));
  const qTo   = Math.min(questions.length, parseInt(inputQTo.value, 10));
  let pool = questions.slice(qFrom - 1, qTo);
  if (toggleShuffle.checked) {
    pool = pool.sort(() => Math.random() - 0.5);
  }
  // Limit to picked count
  const pickCount = Math.min(pool.length, Math.max(1, parseInt(inputQPick.value, 10)));
  pool = pool.slice(0, pickCount);

  // Initialize answers map
  pool.forEach(q => {
    userAnswers[q.question_number] = new Set();
  });

  pool.forEach(q => {
    const isMulti = q.correct_answers.length > 1;
    const card = document.createElement('div');
    card.className = 'question-card';
    card.dataset.qnum = q.question_number;

    const multiTag = isMulti
      ? `<span class="multi-badge">Choose ${q.correct_answers.length}</span>`
      : '';

    const imageHtml = q.question_image
      ? `<div class="question-image-wrap"><img src="${q.question_image}" alt="Question image" class="question-image" /></div>`
      : '';

    card.innerHTML = `
      <div class="question-header">
        <span class="q-number">Q${q.question_number}</span>
        <span class="q-text">${escapeHtml(q.question)}${multiTag}</span>
      </div>
      ${imageHtml}
      <div class="answers-list"></div>
    `;

    const answersList = card.querySelector('.answers-list');

    q.answers.forEach(answer => {
      const type = isMulti ? 'checkbox' : 'radio';
      const label = document.createElement('label');
      label.className = 'answer-label';
      label.dataset.key = answer.key;
      label.innerHTML = `
        <input type="${type}" name="q${q.question_number}" value="${answer.key}" />
        <span class="answer-key">${answer.key}</span>
        <span class="answer-text">${escapeHtml(answer.text)}</span>
      `;

      const input = label.querySelector('input');
      input.addEventListener('change', () => onAnswerChange(q.question_number, answer.key, input.checked, isMulti, label));

      answersList.appendChild(label);
    });

    // Practice mode: show answer button
    if (quizMode === 'practice') {
      const btnReveal = document.createElement('button');
      btnReveal.className = 'btn-show-answer';
      btnReveal.textContent = '👁 Show Answer';
      btnReveal.addEventListener('click', () => {
        // Highlight correct answer labels
        q.correct_answers.forEach(key => {
          const lbl = card.querySelector(`.answer-label[data-key="${key}"]`);
          if (lbl) lbl.classList.add('practice-correct');
        });

        const revealDiv = document.createElement('div');
        revealDiv.className = 'practice-reveal';
        revealDiv.innerHTML = `<span class="reveal-label">✓ Correct answer${q.correct_answers.length > 1 ? 's' : ''}:</span><div class="reveal-keys"></div>`;
        const keysEl = revealDiv.querySelector('.reveal-keys');
        q.correct_answers.forEach(key => {
          const ans = q.answers.find(a => a.key === key);
          const item = document.createElement('div');
          item.style.display = 'flex';
          item.style.alignItems = 'flex-start';
          item.style.gap = '8px';
          item.innerHTML = `<span class="reveal-key-badge">${key}</span><span class="reveal-answer-text">${escapeHtml(ans ? ans.text : key)}</span>`;
          keysEl.appendChild(item);
        });

        // Hide button inside the reveal panel
        const btnHide = document.createElement('button');
        btnHide.className = 'btn-show-answer';
        btnHide.style.marginTop = '10px';
        btnHide.textContent = '🙈 Hide Answer';
        btnHide.addEventListener('click', () => {
          // Remove correct answer highlights
          q.correct_answers.forEach(key => {
            const lbl = card.querySelector(`.answer-label[data-key="${key}"]`);
            if (lbl) lbl.classList.remove('practice-correct');
          });
          revealDiv.remove();
          btnReveal.textContent = '👁 Show Answer';
          card.appendChild(btnReveal);
        });
        revealDiv.appendChild(btnHide);

        btnReveal.remove();
        card.appendChild(revealDiv);
      });
      card.appendChild(btnReveal);
    }

    questionsEl.appendChild(card);
  });

  updateProgress();
}

function onAnswerChange(qnum, key, checked, isMulti, label) {
  const set = userAnswers[qnum];

  if (!isMulti) {
    // Radio: clear all, mark just this
    set.clear();
    set.add(key);

    // Visually deselect all siblings
    const card = label.closest('.question-card');
    card.querySelectorAll('.answer-label').forEach(l => l.classList.remove('selected'));
    label.classList.add('selected');
  } else {
    // Checkbox
    if (checked) {
      set.add(key);
      label.classList.add('selected');
    } else {
      set.delete(key);
      label.classList.remove('selected');
    }
  }

  updateProgress();
}

function updateProgress() {
  const rendered = Object.keys(userAnswers);
  const answered = rendered.filter(k => userAnswers[k]?.size > 0).length;
  const pct = rendered.length ? Math.round((answered / rendered.length) * 100) : 0;
  progressBar.style.setProperty('--pct', pct + '%');
  progressText.textContent = `${answered} / ${rendered.length} answered`;
}

// ── Score ─────────────────────────────────
function calculateScore() {
  let correct = 0;
  Object.keys(userAnswers).forEach(qnum => {
    const q = questions.find(q => q.question_number === parseInt(qnum));
    if (!q) return;
    const selected = userAnswers[qnum];
    const correctSet = new Set(q.correct_answers);
    const isCorrect =
      selected.size === correctSet.size &&
      [...selected].every(k => correctSet.has(k));
    if (isCorrect) correct++;
  });
  return correct;
}

function showResults() {
  const correct = calculateScore();
  const total = Object.keys(userAnswers).length;
  const wrong = total - correct;
  const pct = Math.round((correct / total) * 100);

  scorePercent.textContent = pct + '%';
  statCorrect.textContent = correct;
  statWrong.textContent = wrong;
  statTotal.textContent = total;

  scoreCircle.classList.remove('pass', 'fail', 'warn');
  if (pct >= 75) {
    scoreCircle.classList.add('pass');
    resultsTitle.textContent = '🎉 Great job!';
    resultsSubtitle.textContent = `You passed with ${pct}%. You're well prepared for the GitHub Actions certification.`;
  } else if (pct >= 50) {
    scoreCircle.classList.add('warn');
    resultsTitle.textContent = '📚 Keep studying!';
    resultsSubtitle.textContent = `You scored ${pct}%. Review the incorrect answers and try again.`;
  } else {
    scoreCircle.classList.add('fail');
    resultsTitle.textContent = '💪 Keep practicing!';
    resultsSubtitle.textContent = `You scored ${pct}%. Don't give up — review the material and retake the quiz.`;
  }

  reviewContainer.classList.add('hidden');
  reviewContainer.dataset.filter = '';
  btnReview.textContent = 'Review Answers';
  btnWrong.textContent  = 'Show Wrong Answers';
  showScreen('results');
}

// ── Review ────────────────────────────────
function buildReview(wrongOnly = false) {
  reviewContainer.innerHTML = wrongOnly ? '<h3>Wrong Answers</h3>' : '<h3>Answer Review</h3>';

  Object.keys(userAnswers).forEach(qnum => {
    const q = questions.find(q => q.question_number === parseInt(qnum));
    if (!q) return;
    const selected = userAnswers[q.question_number];
    const correctSet = new Set(q.correct_answers);
    const isCorrect =
      selected.size === correctSet.size &&
      [...selected].every(k => correctSet.has(k));

    if (wrongOnly && isCorrect) return;

    const card = document.createElement('div');
    card.className = `review-card ${isCorrect ? 'correct' : 'incorrect'}`;

    const badgeClass = isCorrect ? 'badge-correct' : 'badge-incorrect';
    const badgeText  = isCorrect ? '✓ Correct' : '✗ Incorrect';

    const reviewImageHtml = q.question_image
      ? `<div class="question-image-wrap"><img src="${q.question_image}" alt="Question image" class="question-image" /></div>`
      : '';

    card.innerHTML = `
      <div class="q-header">
        <span class="q-number">Q${q.question_number}</span>
        <span class="review-badge ${badgeClass}">${badgeText}</span>
      </div>
      <p style="font-size:0.9rem;margin-bottom:14px;color:var(--text)">${escapeHtml(q.question)}</p>
      ${reviewImageHtml}
      <div class="review-options"></div>
    `;

    const optionsEl = card.querySelector('.review-options');

    q.answers.forEach(answer => {
      const wasSelected = selected.has(answer.key);
      const isAnsCorrect = correctSet.has(answer.key);

      let cls = 'review-option';
      if (wasSelected && isAnsCorrect) cls += ' was-selected is-correct';
      else if (wasSelected && !isAnsCorrect) cls += ' was-selected is-wrong';
      else if (!wasSelected && isAnsCorrect) cls += ' is-correct';

      const opt = document.createElement('div');
      opt.className = cls;
      opt.innerHTML = `
        <span class="answer-key">${answer.key}</span>
        <span class="answer-text">${escapeHtml(answer.text)}</span>
      `;
      optionsEl.appendChild(opt);
    });

    reviewContainer.appendChild(card);
  });
}

// ── Helpers ───────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Event listeners ───────────────────────
btnStart.addEventListener('click', () => {
  buildQuiz();
  quizModeLabel.textContent = quizMode === 'practice' ? '📖 Practice Mode' : '🎓 Exam Mode';
  showScreen('quiz');
  // In practice mode the submit/score flow is hidden
  const submitArea = document.querySelector('.submit-area');
  submitArea.style.display = quizMode === 'practice' ? 'none' : '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

btnSubmit.addEventListener('click', () => {
  const rendered = Object.keys(userAnswers);
  const answered = rendered.filter(k => userAnswers[k]?.size > 0).length;
  const unanswered = rendered.length - answered;

  if (unanswered > 0) {
    const ok = confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
    if (!ok) return;
  }

  showResults();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

btnBack.addEventListener('click', () => {
  if (confirm('Go back to the start screen? Your current answers will be lost.')) {
    showScreen('start');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

btnRetake.addEventListener('click', () => {
  // Reset answers
  questions.forEach(q => { userAnswers[q.question_number] = new Set(); });
  buildQuiz();
  showScreen('quiz');
  const submitArea = document.querySelector('.submit-area');
  submitArea.style.display = quizMode === 'practice' ? 'none' : '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

btnReview.addEventListener('click', () => {
  const isOpen = !reviewContainer.classList.contains('hidden');
  const wasAll = reviewContainer.dataset.filter === 'all';
  if (isOpen && wasAll) {
    reviewContainer.classList.add('hidden');
    reviewContainer.dataset.filter = '';
    btnReview.textContent = 'Review Answers';
  } else {
    buildReview(false);
    reviewContainer.dataset.filter = 'all';
    reviewContainer.classList.remove('hidden');
    btnReview.textContent = 'Hide Review';
    btnWrong.textContent = 'Show Wrong Answers';
    reviewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

btnWrong.addEventListener('click', () => {
  const currentFilter = reviewContainer.dataset.filter;
  if (currentFilter === 'wrong') {
    // Currently showing wrong only → switch to all
    buildReview(false);
    reviewContainer.dataset.filter = 'all';
    reviewContainer.classList.remove('hidden');
    btnWrong.textContent = 'Show Wrong Answers';
    btnReview.textContent = 'Hide Review';
    reviewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    // Showing all or hidden → switch to wrong only
    buildReview(true);
    reviewContainer.dataset.filter = 'wrong';
    reviewContainer.classList.remove('hidden');
    btnWrong.textContent = 'Show All Answers';
    btnReview.textContent = 'Review Answers';
    reviewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ── Mode selector ─────────────────────────
[btnModeExam, btnModePractice].forEach(btn => {
  btn.addEventListener('click', () => {
    quizMode = btn.dataset.mode;
    btnModeExam.classList.toggle('active', quizMode === 'exam');
    btnModePractice.classList.toggle('active', quizMode === 'practice');
    btnStart.textContent = quizMode === 'practice' ? 'Start Practice' : 'Start Quiz';
  });
});

function updateQCountDisplay() {
  const from  = Math.max(1, parseInt(inputQFrom.value, 10) || 1);
  const to    = Math.min(parseInt(inputQTo.max, 10), parseInt(inputQTo.value, 10) || 1);
  const rangeSize = Math.max(0, to - from + 1);
  qCountDisplay.textContent = `(${rangeSize})`;
  // Clamp pick to range size
  inputQPick.max = rangeSize;
  if (parseInt(inputQPick.value, 10) > rangeSize) inputQPick.value = rangeSize;
  if (parseInt(inputQPick.value, 10) < 1) inputQPick.value = 1;
  if (from > to) inputQTo.value = from;
}

inputQFrom.addEventListener('input', () => {
  if (parseInt(inputQFrom.value) > parseInt(inputQTo.value)) inputQTo.value = inputQFrom.value;
  updateQCountDisplay();
});

inputQTo.addEventListener('input', () => {
  if (parseInt(inputQTo.value) < parseInt(inputQFrom.value)) inputQFrom.value = inputQTo.value;
  updateQCountDisplay();
});

inputQPick.addEventListener('input', () => {
  const rangeSize = Math.max(0, parseInt(inputQTo.value, 10) - parseInt(inputQFrom.value, 10) + 1);
  if (parseInt(inputQPick.value, 10) > rangeSize) inputQPick.value = rangeSize;
  if (parseInt(inputQPick.value, 10) < 1) inputQPick.value = 1;
});

// ── File input & drag-and-drop ───────────
jsonFileInput.addEventListener('change', () => {
  handleFileLoad(jsonFileInput.files[0]);
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  handleFileLoad(file);
});

// ── Init ──────────────────────────────────
(async () => {
  await loadDefaultQuestions();
  showScreen('start');
})();
