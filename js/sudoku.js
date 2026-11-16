/**
 * Sudoku Generator & Solver
 * Generates valid sudoku puzzles procedurally with configurable difficulty.
 */
const Sudoku = (() => {
  const EMPTY = 0;
  const SIZE = 9;
  const BOX = 3;

  // Difficulty presets: how many clues to leave
  const DIFFICULTY = {
    easy:   { min: 38, max: 45 },
    medium: { min: 30, max: 37 },
    hard:   { min: 22, max: 29 },
  };

  /** Create an empty 9x9 grid */
  function createGrid() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  }

  /** Deep copy a grid */
  function copyGrid(grid) {
    return grid.map(row => [...row]);
  }

  /** Shuffle an array in place (Fisher-Yates) */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Check if placing num at (row, col) is valid */
  function isValid(grid, row, col, num) {
    // Check row
    for (let c = 0; c < SIZE; c++) {
      if (grid[row][c] === num) return false;
    }
    // Check column
    for (let r = 0; r < SIZE; r++) {
      if (grid[r][col] === num) return false;
    }
    // Check 3x3 box
    const boxRow = Math.floor(row / BOX) * BOX;
    const boxCol = Math.floor(col / BOX) * BOX;
    for (let r = boxRow; r < boxRow + BOX; r++) {
      for (let c = boxCol; c < boxCol + BOX; c++) {
        if (grid[r][c] === num) return false;
      }
    }
    return true;
  }

  /** Fill the grid completely using backtracking with randomized candidates */
  function fillGrid(grid) {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (grid[row][col] === EMPTY) {
          const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const num of nums) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (fillGrid(grid)) return true;
              grid[row][col] = EMPTY;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  /** Count solutions (stops at 2 to check uniqueness) */
  function countSolutions(grid, limit = 2) {
    let count = 0;

    function solve(g) {
      if (count >= limit) return;
      for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
          if (g[row][col] === EMPTY) {
            for (let num = 1; num <= 9; num++) {
              if (isValid(g, row, col, num)) {
                g[row][col] = num;
                solve(g);
                g[row][col] = EMPTY;
              }
            }
            return;
          }
        }
      }
      count++;
    }

    solve(grid);
    return count;
  }

  /** Remove cells from a complete grid to create a puzzle with a unique solution */
  function removeCells(grid, clueCount) {
    const puzzle = copyGrid(grid);
    const positions = shuffle(
      Array.from({ length: SIZE * SIZE }, (_, i) => [Math.floor(i / SIZE), i % SIZE])
    );

    let remaining = SIZE * SIZE;

    for (const [row, col] of positions) {
      if (remaining <= clueCount) break;

      const backup = puzzle[row][col];
      puzzle[row][col] = EMPTY;

      if (countSolutions(copyGrid(puzzle)) !== 1) {
        puzzle[row][col] = backup;
      } else {
        remaining--;
      }
    }

    return puzzle;
  }

  /**
   * Generate a new sudoku puzzle.
   * @param {'easy'|'medium'|'hard'} difficulty
   * @returns {{ puzzle: number[][], solution: number[][] }}
   */
  function generate(difficulty = 'medium') {
    const { min, max } = DIFFICULTY[difficulty] || DIFFICULTY.medium;
    const clueCount = Math.floor(Math.random() * (max - min + 1)) + min;

    const solution = createGrid();
    fillGrid(solution);

    const puzzle = removeCells(solution, clueCount);

    return { puzzle, solution };
  }

  /** Check if the board is completely and correctly filled */
  function isComplete(grid, solution) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  }

  return { generate, isComplete, isValid, SIZE, EMPTY };
})();
