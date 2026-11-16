/**
 * Wordle Game UI Controller
 * Depends on: Wordle (wordle.js), WordList (words.js), Components, Theme, Lucide
 */
const WordleGame = (() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let board = [];       // 6 rows of 5 letters (strings)
  let results = [];     // 6 rows of 5 states
  let currentRow = 0;
  let currentCol = 0;
  let answer = '';
  let gameOver = false;
  let keyStates = {};   // letter -> best state

  const STORAGE_STATE = 'cdp-wordle-state';
  const STORAGE_STATS = 'cdp-wordle-stats';

  function init() {
    Components.init('../../');
    answer = WordList.getWordOfDay();
    renderGrid();
    renderKeyboard();
    bindEvents();
    loadState();
    Components.refreshIcons();
  }

  // --- Grid ---

  function renderGrid() {
    const grid = $('#wordle-grid');
    grid.innerHTML = '';
    for (let r = 0; r < Wordle.MAX_GUESSES; r++) {
      const row = document.createElement('div');
      row.className = 'wordle-row';
      for (let c = 0; c < Wordle.WORD_LENGTH; c++) {
        const cell = document.createElement('div');
        cell.className = 'wordle-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        const span = document.createElement('span');
        cell.appendChild(span);
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
  }

  function getCell(row, col) {
    return $(`.wordle-cell[data-row="${row}"][data-col="${col}"]`);
  }

  function setCellLetter(row, col, letter) {
    const cell = getCell(row, col);
    const span = cell.querySelector('span');
    span.textContent = letter.toUpperCase();
    cell.classList.toggle('wordle-cell--filled', letter !== '');
  }

  // --- Keyboard ---

  function renderKeyboard() {
    const kb = $('#wordle-keyboard');
    kb.innerHTML = '';
    const rows = [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l','ñ'],
      ['enter','z','x','c','v','b','n','m','backspace']
    ];

    rows.forEach(keys => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'wordle-kb-row';
      keys.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'wordle-key';
        btn.dataset.key = key;

        if (key === 'enter') {
          btn.classList.add('wordle-key--wide');
          btn.innerHTML = '<i data-lucide="corner-down-left"></i>';
        } else if (key === 'backspace') {
          btn.classList.add('wordle-key--wide');
          btn.innerHTML = '<i data-lucide="delete"></i>';
        } else {
          btn.textContent = key.toUpperCase();
        }

        btn.addEventListener('click', () => handleKey(key));
        rowDiv.appendChild(btn);
      });
      kb.appendChild(rowDiv);
    });
  }

  function updateKeyState(letter, state) {
    const priority = { absent: 0, present: 1, correct: 2 };
    const current = keyStates[letter];
    if (!current || priority[state] > priority[current]) {
      keyStates[letter] = state;
    }
    const btn = $(`.wordle-key[data-key="${letter}"]`);
    if (btn) {
      btn.classList.remove('wordle-key--correct', 'wordle-key--present', 'wordle-key--absent');
      btn.classList.add(`wordle-key--${keyStates[letter]}`);
    }
  }

  // --- Input ---

  function bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (gameOver) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        handleKey('enter');
      } else if (e.key === 'Backspace') {
        handleKey('backspace');
      } else {
        const letter = e.key.toLowerCase();
        if (/^[a-zñ]$/.test(letter)) {
          handleKey(letter);
        }
      }
    });
  }

  function handleKey(key) {
    if (gameOver) return;

    if (key === 'enter') {
      submitGuess();
    } else if (key === 'backspace') {
      deleteLetter();
    } else {
      inputLetter(key);
    }
  }

  function inputLetter(letter) {
    if (currentCol >= Wordle.WORD_LENGTH) return;
    if (!board[currentRow]) board[currentRow] = [];
    board[currentRow][currentCol] = letter;
    setCellLetter(currentRow, currentCol, letter);

    // Pop animation
    const cell = getCell(currentRow, currentCol);
    cell.classList.add('wordle-cell--pop');
    setTimeout(() => cell.classList.remove('wordle-cell--pop'), 100);

    currentCol++;
  }

  function deleteLetter() {
    if (currentCol <= 0) return;
    currentCol--;
    board[currentRow][currentCol] = '';
    setCellLetter(currentRow, currentCol, '');
  }

  function submitGuess() {
    if (currentCol < Wordle.WORD_LENGTH) {
      shakeRow(currentRow);
      showToast('Faltan letras');
      return;
    }

    const guess = board[currentRow].join('');

    if (!WordList.isValidWord(guess)) {
      shakeRow(currentRow);
      showToast('Palabra no valida');
      return;
    }

    const result = Wordle.evaluateGuess(guess, answer);
    results[currentRow] = result;

    revealRow(currentRow, result, () => {
      // Update keyboard colors
      for (let i = 0; i < Wordle.WORD_LENGTH; i++) {
        updateKeyState(guess[i], result[i]);
      }

      const won = Wordle.isGameWon(result);
      if (won) {
        bounceRow(currentRow);
        gameOver = true;
        saveState();
        updateStats(true);
        setTimeout(() => endGame(true), 1600);
      } else if (currentRow >= Wordle.MAX_GUESSES - 1) {
        gameOver = true;
        saveState();
        updateStats(false);
        setTimeout(() => endGame(false), 400);
      } else {
        currentRow++;
        currentCol = 0;
        saveState();
      }
    });
  }

  // --- Animations ---

  function revealRow(row, result, onComplete) {
    const delay = 300;
    for (let c = 0; c < Wordle.WORD_LENGTH; c++) {
      const cell = getCell(row, c);
      setTimeout(() => {
        cell.classList.add('wordle-cell--flip');
        setTimeout(() => {
          cell.classList.add(`wordle-cell--${result[c]}`);
          cell.classList.remove('wordle-cell--flip');
          cell.classList.add('wordle-cell--revealed');
        }, 250);
      }, c * delay);
    }

    setTimeout(() => {
      if (onComplete) onComplete();
    }, Wordle.WORD_LENGTH * delay + 250);
  }

  function shakeRow(row) {
    const rowEl = $(`.wordle-row:nth-child(${row + 1})`);
    if (rowEl) {
      rowEl.classList.add('wordle-row--shake');
      setTimeout(() => rowEl.classList.remove('wordle-row--shake'), 500);
    }
  }

  function bounceRow(row) {
    const delay = 100;
    for (let c = 0; c < Wordle.WORD_LENGTH; c++) {
      const cell = getCell(row, c);
      setTimeout(() => {
        cell.classList.add('wordle-cell--bounce');
      }, c * delay);
    }
  }

  // --- Toast ---

  function showToast(message) {
    let toast = $('#wordle-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'wordle-toast';
      toast.className = 'wordle-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 1500);
  }

  // --- End Game ---

  function endGame(won) {
    const modal = $('#modal');
    const title = $('#modal-title');
    const msg = $('#modal-message');
    const icon = $('#modal-icon');

    if (won) {
      const messages = ['Genial', 'Increible', 'Gran jugada', 'Bien hecho', 'Por poco', 'Uf, justo'];
      title.textContent = messages[currentRow] || 'Completado';
      msg.textContent = `Has adivinado en ${currentRow + 1} de ${Wordle.MAX_GUESSES} intentos.`;
      icon.innerHTML = '<i data-lucide="trophy"></i>';
      icon.className = 'modal__icon';
    } else {
      title.textContent = 'No has acertado';
      msg.textContent = `La palabra era: ${answer.toUpperCase()}`;
      icon.innerHTML = '<i data-lucide="frown"></i>';
      icon.className = 'modal__icon modal__icon--error';
    }

    Components.refreshIcons();
    modal.classList.add('visible');

    $('#modal-btn').onclick = () => {
      modal.classList.remove('visible');
    };
  }

  // --- localStorage ---

  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function saveState() {
    const state = {
      date: getTodayKey(),
      board,
      results,
      currentRow,
      currentCol,
      gameOver,
      keyStates
    };
    localStorage.setItem(STORAGE_STATE, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_STATE);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.date !== getTodayKey()) {
        localStorage.removeItem(STORAGE_STATE);
        return;
      }

      board = state.board || [];
      results = state.results || [];
      currentRow = state.currentRow || 0;
      currentCol = state.currentCol || 0;
      gameOver = state.gameOver || false;
      keyStates = state.keyStates || {};

      // Restore grid visuals
      for (let r = 0; r < results.length; r++) {
        if (!results[r]) continue;
        for (let c = 0; c < Wordle.WORD_LENGTH; c++) {
          if (board[r] && board[r][c]) {
            setCellLetter(r, c, board[r][c]);
            const cell = getCell(r, c);
            cell.classList.add(`wordle-cell--${results[r][c]}`, 'wordle-cell--revealed');
          }
        }
      }

      // Restore current row letters (not yet submitted)
      if (!gameOver && board[currentRow]) {
        for (let c = 0; c < currentCol; c++) {
          if (board[currentRow][c]) {
            setCellLetter(currentRow, c, board[currentRow][c]);
          }
        }
      }

      // Restore keyboard colors
      for (const [letter, state] of Object.entries(keyStates)) {
        const btn = $(`.wordle-key[data-key="${letter}"]`);
        if (btn) {
          btn.classList.add(`wordle-key--${state}`);
        }
      }

      // If game was over, show modal again after short delay
      if (gameOver) {
        const won = results[currentRow - 1] && Wordle.isGameWon(results[currentRow - 1]);
        // Don't auto-show modal on reload, let user see the board
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_STATE);
    }
  }

  function updateStats(won) {
    let stats;
    try {
      stats = JSON.parse(localStorage.getItem(STORAGE_STATS)) || {};
    } catch {
      stats = {};
    }
    stats.played = (stats.played || 0) + 1;
    stats.won = (stats.won || 0) + (won ? 1 : 0);
    stats.streak = won ? (stats.streak || 0) + 1 : 0;
    stats.maxStreak = Math.max(stats.maxStreak || 0, stats.streak);
    localStorage.setItem(STORAGE_STATS, JSON.stringify(stats));
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', WordleGame.init);
