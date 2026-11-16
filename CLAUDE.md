# CLAUDE.md

## Descripcion del proyecto

**Central de Pasatiempos** — plataforma web multi-juego con pasatiempos clasicos.
Desplegado en GitHub Pages: https://manuelnevado.github.io/sudoku-web/

## Tech stack

HTML + CSS + JavaScript vanilla. Sin framework, sin bundler.
- Fuente: Inter (Google Fonts, cargada en base.css)
- Iconos: Lucide (CDN, sin emojis en ningun sitio)
- Temas: claro/oscuro con CSS custom properties

## Estructura de archivos

```
index.html                      — Home (catalogo de juegos)
css/
  tokens.css                    — Design tokens (colores, spacing, tipografia, radii, sombras)
  base.css                      — Reset, import fuentes, body, utilidades
  components.css                — Header, footer, game cards, modal, botones compartidos
js/
  theme.js                      — Toggle tema claro/oscuro (localStorage key: cdp-theme)
  components.js                 — Inyecta header/footer en placeholders #site-header/#site-footer
games/
  sudoku/
    index.html                  — Pagina del juego Sudoku
    sudoku.js                   — Motor de generacion y validacion (modulo IIFE Sudoku, puro)
    sudoku-ui.js                — Controlador UI (modulo IIFE SudokuGame)
    sudoku.css                  — Estilos especificos del Sudoku
```

## Arquitectura

### Multi-page
- Cada juego es un HTML independiente en `games/<nombre>/`
- Carga CSS compartido (../../css/) + JS compartido (../../js/) + sus propios archivos
- Sin router, sin SPA — GitHub Pages sirve cada index.html directamente

### CSS en capas
1. `tokens.css` — Variables CSS (design system Warm Neutral + Amber)
2. `base.css` — Reset, tipografia, utilidades
3. `components.css` — Componentes compartidos
4. `games/<juego>/<juego>.css` — Estilos especificos del juego

### JS compartido
- `Theme` (theme.js) — Toggle tema, persistencia en localStorage, se ejecuta inmediatamente
- `Components` (components.js) — Inyecta header/footer, depende de Theme y Lucide
- Orden de carga: Lucide CDN → theme.js → components.js → JS del juego

### Convenciones para nuevos juegos
1. Crear `games/<nombre>/` con index.html, <nombre>.js, <nombre>-ui.js, <nombre>.css
2. Cargar CSS/JS compartido con rutas relativas (../../css/, ../../js/)
3. Llamar `Components.init('../../')` en DOMContentLoaded
4. Prefijo CSS: `.nombre-` para evitar conflictos (ej: `.sudoku-grid`, `.sudoku-cell`)
5. localStorage keys: `cdp-<nombre>-*`
6. Anadir card en index.html del home

## Design system

- **Paleta clara:** bg #faf8f5, card #fff, text #292118, accent #d97706 (amber)
- **Paleta oscura:** bg #1c1814, card #292218, text #e8e0d6, accent #f59e0b
- **Tipografia:** Inter, pesos 400-800, tamanos con clamp() (mobile-first)
- **Radii:** 12px cards, 8px botones, 4px inputs
- **Sombras:** warm-tinted (rgba con base 41,33,24)
- **Touch targets:** minimo 44px
- **Sin emojis** — usar Lucide icons siempre

## Sudoku: detalles

- **Sudoku** (games/sudoku/sudoku.js): Modulo puro sin DOM. Backtracking + Fisher-Yates + verificacion de solucion unica.
- **SudokuGame** (games/sudoku/sudoku-ui.js): UI con seleccion, input, notas, pistas, errores (max 3), timer, modal.
- Dificultad por pistas: Facil 38-45, Medio 30-37, Dificil 22-29

## Despliegue

GitHub Pages desde la rama `main`. Push a `main` actualiza automaticamente.
