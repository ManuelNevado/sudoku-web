/**
 * GeoQuiz Game Logic
 * Country selection, answer validation, scoring, streaks.
 */
const GeoEngine = (() => {
  let remaining = [];
  let current = null;
  let score = 0;
  let streak = 0;
  let bestStreak = loadBestStreak();
  let rounds = 0;

  function normalizeText(str) {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function reset() {
    remaining = shuffle([...Countries.DATA]);
    current = null;
    score = 0;
    streak = 0;
    rounds = 0;
    bestStreak = loadBestStreak();
  }

  function pickCountry() {
    if (remaining.length === 0) {
      remaining = shuffle([...Countries.DATA]);
    }
    current = remaining.pop();
    return current;
  }

  function getCurrent() {
    return current;
  }

  function generateFlagOptions(correctCountry, count) {
    count = count || 6;
    const options = [correctCountry];
    const others = Countries.DATA.filter(c => c.id !== correctCountry.id);
    const shuffled = shuffle(others);

    for (let i = 0; i < shuffled.length && options.length < count; i++) {
      // Avoid duplicate flags
      if (!options.some(o => o.flag === shuffled[i].flag)) {
        options.push(shuffled[i]);
      }
    }

    return shuffle(options);
  }

  function checkAnswers(guessName, guessCapital, guessFlag) {
    if (!current) return { name: false, capital: false, flag: false };

    const nameCorrect = normalizeText(guessName) === normalizeText(current.name);
    const capitalCorrect = normalizeText(guessCapital) === normalizeText(current.capital);
    const flagCorrect = guessFlag === current.id;

    const correct = (nameCorrect ? 1 : 0) + (capitalCorrect ? 1 : 0) + (flagCorrect ? 1 : 0);
    score += correct;
    rounds++;

    if (correct === 3) {
      streak++;
      if (streak > bestStreak) {
        bestStreak = streak;
        saveBestStreak(bestStreak);
      }
    } else {
      streak = 0;
    }

    return {
      name: nameCorrect,
      capital: capitalCorrect,
      flag: flagCorrect,
      perfect: correct === 3
    };
  }

  function getStats() {
    return { score, streak, bestStreak, rounds };
  }

  function filterSuggestions(input, list, max) {
    max = max || 5;
    if (!input) return [];
    const norm = normalizeText(input);
    return list
      .filter(item => normalizeText(item).includes(norm))
      .slice(0, max);
  }

  function loadBestStreak() {
    return parseInt(localStorage.getItem('cdp-geo-best-streak') || '0', 10);
  }

  function saveBestStreak(val) {
    localStorage.setItem('cdp-geo-best-streak', String(val));
  }

  return {
    reset, pickCountry, getCurrent, generateFlagOptions,
    checkAnswers, getStats, filterSuggestions, normalizeText
  };
})();
