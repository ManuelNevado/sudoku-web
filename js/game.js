/**
 * Sudoku Game UI Controller
 */
const Game = (() => {
  let puzzle = [];
  let solution = [];
  let board = [];       // current player state
  let notes = [];       // 9x9 array of Sets
  let selected = null;  // { row, col }
  let difficulty = 'medium';
  let timerInterval = null;
  let seconds = 0;
  let notesMode = false;
  let gameOver = false;
  let mistakes = 0;
  const MAX_MISTAKES = 3;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function init() {
    renderBoard();
    bindEvents();
    newGame();
  }

  /** Build the 9x9 grid DOM */
  function renderBoard() {
    const grid = $('#grid');
    grid.innerHTML = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        const value = document.createElement('span');
        value.className = 'cell-value';
        cell.appendChild(value);

        const notesDiv = document.createElement('div');
        notesDiv.className = 'cell-notes';
        for (let n = 1; n <= 9; n++) {
          const noteSpan = document.createElement('span');
          noteSpan.dataset.note = n;
          noteSpan.textContent = '';
          notesDiv.appendChild(noteSpan);
        }
        cell.appendChild(notesDiv);

        grid.appendChild(cell);
      }
    }
  }

  /** Bind all event listeners */
  function bindEvents() {
    // Cell clicks
    $('#grid').addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell || gameOver) return;
      const row = +cell.dataset.row;
      const col = +cell.dataset.col;
      selectCell(row, col);
    });

    // Number pad
    $$('.num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (gameOver) return;
        const num = +btn.dataset.num;
        if (num === 0) {
          eraseCurrent();
        } else {
          inputNumber(num);
        }
      });
    });

    // Controls
    $('#btn-new').addEventListener('click', newGame);
    $('#btn-notes').addEventListener('click', toggleNotes);
    $('#btn-undo').addEventListener('click', eraseCurrent);
    $('#btn-hint').addEventListener('click', giveHint);

    // Difficulty selector
    $$('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        difficulty = btn.dataset.diff;
        $$('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        newGame();
      });
    });

    // Theme toggle
    $('#btn-theme').addEventListener('click', toggleTheme);

    // Keyboard input
    document.addEventListener('keydown', handleKeydown);
  }

  function handleKeydown(e) {
    if (gameOver) return;

    if (e.key >= '1' && e.key <= '9') {
      inputNumber(+e.key);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      eraseCurrent();
    } else if (e.key === 'n' || e.key === 'N') {
      toggleNotes();
    } else if (e.key === 'ArrowUp' && selected) {
      selectCell(Math.max(0, selected.row - 1), selected.col);
    } else if (e.key === 'ArrowDown' && selected) {
      selectCell(Math.min(8, selected.row + 1), selected.col);
    } else if (e.key === 'ArrowLeft' && selected) {
      selectCell(selected.row, Math.max(0, selected.col - 1));
    } else if (e.key === 'ArrowRight' && selected) {
      selectCell(selected.row, Math.min(8, selected.col + 1));
    }
  }

  /** Start a new game */
  function newGame() {
    const loadingOverlay = $('#loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.add('visible');

    // Use setTimeout so the UI can repaint with the loading overlay before heavy computation
    setTimeout(() => {
      const data = Sudoku.generate(difficulty);
      puzzle = data.puzzle;
      solution = data.solution;
      board = puzzle.map(row => [...row]);
      notes = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new Set())
      );
      selected = null;
      gameOver = false;
      mistakes = 0;
      notesMode = false;

      stopTimer();
      seconds = 0;
      updateTimerDisplay();
      startTimer();

      updateMistakes();
      updateNotesBtn();
      updateBoard();
      clearSelection();

      if (loadingOverlay) loadingOverlay.classList.remove('visible');
    }, 50);
  }

  /** Select a cell */
  function selectCell(row, col) {
    selected = { row, col };
    updateBoard();
  }

  function clearSelection() {
    selected = null;
    $$('.cell').forEach(c => {
      c.classList.remove('selected', 'highlighted', 'same-number', 'same-box');
    });
  }

  /** Input a number into the selected cell */
  function inputNumber(num) {
    if (!selected) return;
    const { row, col } = selected;
    if (puzzle[row][col] !== 0) return; // given cell

    if (notesMode) {
      if (notes[row][col].has(num)) {
        notes[row][col].delete(num);
      } else {
        notes[row][col].add(num);
      }
      board[row][col] = 0;
    } else {
      notes[row][col].clear();
      board[row][col] = num;

      if (num !== solution[row][col]) {
        mistakes++;
        updateMistakes();
        animateError(row, col);
        if (mistakes >= MAX_MISTAKES) {
          endGame(false);
          return;
        }
      } else {
        // Remove this number from notes in same row, col, box
        clearNotesFor(row, col, num);
      }

      if (Sudoku.isComplete(board, solution)) {
        endGame(true);
        return;
      }
    }

    updateBoard();
  }

  /** Clear notes that conflict with a placed number */
  function clearNotesFor(row, col, num) {
    for (let i = 0; i < 9; i++) {
      notes[row][i].delete(num);
      notes[i][col].delete(num);
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        notes[r][c].delete(num);
      }
    }
  }

  /** Erase the current cell */
  function eraseCurrent() {
    if (!selected) return;
    const { row, col } = selected;
    if (puzzle[row][col] !== 0) return;
    board[row][col] = 0;
    notes[row][col].clear();
    updateBoard();
  }

  /** Give a hint: fill one empty cell */
  function giveHint() {
    if (gameOver) return;
    // Find empty cells
    const emptyCells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) emptyCells.push([r, c]);
      }
    }
    if (emptyCells.length === 0) return;

    const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[r][c] = solution[r][c];
    notes[r][c].clear();
    clearNotesFor(r, c, solution[r][c]);
    selected = { row: r, col: c };

    // Animate hint
    const cell = getCell(r, c);
    if (cell) {
      cell.classList.add('hint-reveal');
      setTimeout(() => cell.classList.remove('hint-reveal'), 600);
    }

    if (Sudoku.isComplete(board, solution)) {
      endGame(true);
      return;
    }

    updateBoard();
  }

  /** Toggle notes mode */
  function toggleNotes() {
    notesMode = !notesMode;
    updateNotesBtn();
  }

  function updateNotesBtn() {
    const btn = $('#btn-notes');
    btn.classList.toggle('active', notesMode);
  }

  /** Toggle dark/light theme */
  function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('sudoku-theme', isDark ? 'dark' : 'light');
    const icon = $('#btn-theme .btn-icon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  }

  /** Load saved theme preference */
  function loadTheme() {
    const saved = localStorage.getItem('sudoku-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark');
      const icon = $('#btn-theme .btn-icon');
      if (icon) icon.textContent = '☀️';
    }
  }

  /** Update the visual board */
  function updateBoard() {
    const cells = $$('.cell');
    const selectedNum = selected && board[selected.row]?.[selected.col];

    cells.forEach(cell => {
      const r = +cell.dataset.row;
      const c = +cell.dataset.col;
      const val = board[r][c];
      const isGiven = puzzle[r][c] !== 0;
      const valueSpan = cell.querySelector('.cell-value');
      const notesDiv = cell.querySelector('.cell-notes');

      // Reset classes
      cell.className = 'cell';

      // Given cell
      if (isGiven) cell.classList.add('given');

      // Value
      if (val !== 0) {
        valueSpan.textContent = val;
        notesDiv.style.display = 'none';
        valueSpan.style.display = '';

        // Check if wrong
        if (!isGiven && val !== solution[r][c]) {
          cell.classList.add('error');
        }
      } else {
        valueSpan.textContent = '';
        valueSpan.style.display = 'none';
        notesDiv.style.display = '';

        // Render notes
        notesDiv.querySelectorAll('span').forEach(s => {
          const n = +s.dataset.note;
          s.textContent = notes[r][c].has(n) ? n : '';
        });
      }

      // Highlighting
      if (selected) {
        if (r === selected.row && c === selected.col) {
          cell.classList.add('selected');
        } else if (r === selected.row || c === selected.col) {
          cell.classList.add('highlighted');
        } else if (
          Math.floor(r / 3) === Math.floor(selected.row / 3) &&
          Math.floor(c / 3) === Math.floor(selected.col / 3)
        ) {
          cell.classList.add('same-box');
        }

        // Highlight same numbers
        if (selectedNum && selectedNum !== 0 && val === selectedNum && !(r === selected.row && c === selected.col)) {
          cell.classList.add('same-number');
        }
      }
    });

    // Update number pad completion
    updateNumPad();
  }

  /** Dim numbers that are fully placed (9 instances) */
  function updateNumPad() {
    for (let num = 1; num <= 9; num++) {
      let count = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === num && board[r][c] === solution[r][c]) count++;
        }
      }
      const btn = document.querySelector(`.num-btn[data-num="${num}"]`);
      if (btn) btn.classList.toggle('completed', count >= 9);
    }
  }

  /** Get cell DOM element */
  function getCell(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  }

  /** Animate error */
  function animateError(row, col) {
    const cell = getCell(row, col);
    if (cell) {
      cell.classList.add('shake');
      setTimeout(() => cell.classList.remove('shake'), 500);
    }
  }

  /** Update mistakes counter */
  function updateMistakes() {
    $('#mistakes').textContent = `${mistakes}/${MAX_MISTAKES}`;
    if (mistakes > 0) {
      $('#mistakes').classList.add('has-mistakes');
    }
  }

  /** Timer functions */
  function startTimer() {
    timerInterval = setInterval(() => {
      seconds++;
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function updateTimerDisplay() {
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    $('#timer').textContent = `${min}:${sec}`;
  }

  /** End game */
  function endGame(won) {
    gameOver = true;
    stopTimer();

    const modal = $('#modal');
    const title = $('#modal-title');
    const msg = $('#modal-message');

    if (won) {
      title.textContent = '🎉 ¡Felicidades!';
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      msg.textContent = `Has completado el sudoku en ${min}m ${sec}s`;
      // Celebration animation
      document.getElementById('grid').classList.add('win-animation');
    } else {
      title.textContent = '😔 Game Over';
      msg.textContent = `Has cometido ${MAX_MISTAKES} errores. ¡Inténtalo de nuevo!`;
    }

    modal.classList.add('visible');
    $('#modal-btn').onclick = () => {
      modal.classList.remove('visible');
      document.getElementById('grid').classList.remove('win-animation');
      newGame();
    };
  }

  // Initialize theme on load
  loadTheme();

  return { init };
})();

document.addEventListener('DOMContentLoaded', Game.init);
