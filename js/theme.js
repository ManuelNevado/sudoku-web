/**
 * Theme toggle — Central de Pasatiempos
 * Shared across all pages. Manages dark/light mode with localStorage persistence.
 */
const Theme = (() => {
  const STORAGE_KEY = 'cdp-theme';

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark');
    }
  }

  function toggle() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    updateIcons();
  }

  function updateIcons() {
    const isDark = document.body.classList.contains('dark');
    document.querySelectorAll('[data-theme-icon]').forEach(el => {
      const sunIcon = el.querySelector('[data-lucide="sun"]') || el.querySelector('.lucide-sun');
      const moonIcon = el.querySelector('[data-lucide="moon"]') || el.querySelector('.lucide-moon');
      if (sunIcon) sunIcon.style.display = isDark ? '' : 'none';
      if (moonIcon) moonIcon.style.display = isDark ? 'none' : '';
    });
  }

  function isDark() {
    return document.body.classList.contains('dark');
  }

  // Apply theme immediately (before DOMContentLoaded) to prevent flash
  init();

  return { toggle, updateIcons, isDark };
})();
