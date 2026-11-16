/**
 * Wordle Game Logic
 * Pure functions, no DOM dependencies.
 */
const Wordle = (() => {
  const WORD_LENGTH = 5;
  const MAX_GUESSES = 6;

  const CORRECT = 'correct';
  const PRESENT = 'present';
  const ABSENT = 'absent';

  /**
   * Evaluate a guess against the answer.
   * Handles duplicate letters correctly:
   *   1. First pass: mark exact matches (correct)
   *   2. Second pass: mark present letters (only if answer has remaining unmatched instances)
   */
  function evaluateGuess(guess, answer) {
    const result = Array(WORD_LENGTH).fill(ABSENT);
    const answerChars = answer.split('');
    const guessChars = guess.split('');
    const remaining = [...answerChars];

    // First pass: exact matches
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessChars[i] === answerChars[i]) {
        result[i] = CORRECT;
        remaining[i] = null;
      }
    }

    // Second pass: present (wrong position)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (result[i] === CORRECT) continue;
      const idx = remaining.indexOf(guessChars[i]);
      if (idx !== -1) {
        result[i] = PRESENT;
        remaining[idx] = null;
      }
    }

    return result;
  }

  function isGameWon(result) {
    return result.every(r => r === CORRECT);
  }

  return { evaluateGuess, isGameWon, WORD_LENGTH, MAX_GUESSES, CORRECT, PRESENT, ABSENT };
})();
