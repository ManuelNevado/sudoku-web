/**
 * Sudoku Game UI Controller
 * Depends on: Sudoku (sudoku.js), Components (../../js/components.js), Theme (../../js/theme.js), Lucide
 */
const SudokuGame = (() => {
  let puzzle = [];
  let solution = [];
  let board = [];
  let notes = [];
  let selected = null;
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
    Components.init('../../');
    renderBoard();
    bindEvents();
    newGame();
  }

  function renderBoard() {
    const grid = $('#sudoku-grid');
    grid.innerHTML = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        const value = document.createElement('span');
        value.className = 'sudoku-cell__value';
        cell.appendChild(value);

        const notesDiv = document.createElement('div');
        notesDiv.className = 'sudoku-cell__notes';
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

  function bindEvents() {
    $('#sudoku-grid').addEventListener('click', (e) => {
      const cell = e.target.closest('.sudoku-cell');
      if (!cell || gameOver) return;
      selectCell(+cell.dataset.row, +cell.dataset.col);
    });

    $$('.sudoku-num-btn').forEach(btn => {
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

    $('#btn-new').addEventListener('click', newGame);
    $('#btn-notes').addEventListener('click', toggleNotes);
    $('#btn-erase').addEventListener('click', eraseCurrent);
    $('#btn-hint').addEventListener('click', giveHint);

    $$('.sudoku-difficulty__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        difficulty = btn.dataset.diff;
        $$('.sudoku-difficulty__btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        newGame();
      });
    });

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

  function newGame() {
    const overlay = $('#sudoku-loading');
    if (overlay) overlay.classList.add('visible');

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

      if (overlay) overlay.classList.remove('visible');
    }, 50);
  }

  function selectCell(row, col) {
    selected = { row, col };
    updateBoard();
  }

  function clearSelection() {
    selected = null;
    $$('.sudoku-cell').forEach(c => {
      c.classList.remove('selected', 'highlighted', 'same-number', 'same-box');
    });
  }

  function inputNumber(num) {
    if (!selected) return;
    const { row, col } = selected;
    if (puzzle[row][col] !== 0) return;

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
        clearNotesFor(row, col, num);
      }

      if (Sudoku.isComplete(board, solution)) {
        endGame(true);
        return;
      }
    }

    updateBoard();
  }

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

  function eraseCurrent() {
    if (!selected) return;
    const { row, col } = selected;
    if (puzzle[row][col] !== 0) return;
    board[row][col] = 0;
    notes[row][col].clear();
    updateBoard();
  }

  function giveHint() {
    if (gameOver) return;
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

  function toggleNotes() {
    notesMode = !notesMode;
    updateNotesBtn();
  }

  function updateNotesBtn() {
    const btn = $('#btn-notes');
    btn.classList.toggle('active', notesMode);
  }

  function updateBoard() {
    const cells = $$('.sudoku-cell');
    const selectedNum = selected && board[selected.row]?.[selected.col];

    cells.forEach(cell => {
      const r = +cell.dataset.row;
      const c = +cell.dataset.col;
      const val = board[r][c];
      const isGiven = puzzle[r][c] !== 0;
      const valueSpan = cell.querySelector('.sudoku-cell__value');
      const notesDiv = cell.querySelector('.sudoku-cell__notes');

      cell.className = 'sudoku-cell';

      if (isGiven) cell.classList.add('given');

      if (val !== 0) {
        valueSpan.textContent = val;
        notesDiv.style.display = 'none';
        valueSpan.style.display = '';

        if (!isGiven && val !== solution[r][c]) {
          cell.classList.add('error');
        }
      } else {
        valueSpan.textContent = '';
        valueSpan.style.display = 'none';
        notesDiv.style.display = '';

        notesDiv.querySelectorAll('span').forEach(s => {
          const n = +s.dataset.note;
          s.textContent = notes[r][c].has(n) ? n : '';
        });
      }

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

        if (selectedNum && selectedNum !== 0 && val === selectedNum && !(r === selected.row && c === selected.col)) {
          cell.classList.add('same-number');
        }
      }
    });

    updateNumPad();
  }

  function updateNumPad() {
    for (let num = 1; num <= 9; num++) {
      let count = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === num && board[r][c] === solution[r][c]) count++;
        }
      }
      const btn = document.querySelector(`.sudoku-num-btn[data-num="${num}"]`);
      if (btn) btn.classList.toggle('completed', count >= 9);
    }
  }

  function getCell(row, col) {
    return document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
  }

  function animateError(row, col) {
    const cell = getCell(row, col);
    if (cell) {
      cell.classList.add('shake');
      setTimeout(() => cell.classList.remove('shake'), 500);
    }
  }

  function updateMistakes() {
    const el = $('#sudoku-mistakes');
    el.textContent = `${mistakes}/${MAX_MISTAKES}`;
    el.classList.toggle('sudoku-stats__value--error', mistakes > 0);
  }

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
    $('#sudoku-timer').textContent = `${min}:${sec}`;
  }

  function endGame(won) {
    gameOver = true;
    stopTimer();

    const modal = $('#modal');
    const title = $('#modal-title');
    const msg = $('#modal-message');
    const icon = $('#modal-icon');

    if (won) {
      title.textContent = 'Completado';
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      msg.textContent = `Has completado el sudoku en ${min}m ${sec}s`;
      icon.innerHTML = '<i data-lucide="trophy"></i>';
      icon.className = 'modal__icon';
      $('#sudoku-grid').classList.add('win-animation');
    } else {
      title.textContent = 'Fin del juego';
      msg.textContent = `Has cometido ${MAX_MISTAKES} errores. Intentalo de nuevo.`;
      icon.innerHTML = '<i data-lucide="frown"></i>';
      icon.className = 'modal__icon modal__icon--error';
    }

    Components.refreshIcons();
    modal.classList.add('visible');

    $('#modal-btn').onclick = () => {
      modal.classList.remove('visible');
      $('#sudoku-grid').classList.remove('win-animation');
      newGame();
    };
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', SudokuGame.init);
