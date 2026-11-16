/**
 * Shared components — Central de Pasatiempos
 * Injects site header and footer into placeholder elements.
 */
const Components = (() => {
  /**
   * @param {string} basePath - Relative path to root (e.g., '../../' from games/sudoku/)
   */
  function init(basePath = '') {
    renderHeader(basePath);
    renderFooter();

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    Theme.updateIcons();
  }

  function renderHeader(basePath) {
    const el = document.getElementById('site-header');
    if (!el) return;

    const isDark = document.body.classList.contains('dark');

    el.innerHTML = `
      <nav class="site-header" role="navigation">
        <a href="${basePath ? basePath : '.'}" class="site-header__brand" aria-label="Inicio">
          <div class="site-header__logo">
            <i data-lucide="puzzle"></i>
          </div>
          <span class="site-header__title">Central de Pasatiempos</span>
        </a>
        <div class="site-header__actions">
          <button class="icon-btn" id="btn-theme" aria-label="Cambiar tema" data-theme-icon>
            <i data-lucide="sun" style="display:${isDark ? '' : 'none'}"></i>
            <i data-lucide="moon" style="display:${isDark ? 'none' : ''}"></i>
          </button>
        </div>
      </nav>
    `;

    document.getElementById('btn-theme').addEventListener('click', () => {
      Theme.toggle();
    });
  }

  function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;

    el.innerHTML = `
      <div class="site-footer">
        Hecho con <i data-lucide="heart"></i>
        <span>&mdash;</span>
        <a href="https://github.com/ManuelNevado/sudoku-web" target="_blank" rel="noopener">GitHub</a>
      </div>
    `;
  }

  function refreshIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    Theme.updateIcons();
  }

  return { init, refreshIcons };
})();
