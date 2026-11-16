/**
 * Dino Runner UI Controller
 * Manages canvas rendering, input, and game loop.
 */
const DinoGame = (() => {
  const $ = (sel) => document.querySelector(sel);

  let canvas, ctx;
  let lastTime = 0;
  let animId = null;
  let scale = 1;

  function init() {
    Components.init('../../');
    setupCanvas();
    bindEvents();
    DinoEngine.reset();
    drawStartScreen();
    Components.refreshIcons();
  }

  function setupCanvas() {
    canvas = $('#dino-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = DinoEngine.CANVAS_W;
    canvas.height = DinoEngine.CANVAS_H;
    resizeCanvas();
  }

  function resizeCanvas() {
    const container = $('#dino-container');
    if (!container) return;
    const containerW = container.clientWidth;
    scale = containerW / DinoEngine.CANVAS_W;
    canvas.style.width = containerW + 'px';
    canvas.style.height = (DinoEngine.CANVAS_H * scale) + 'px';
  }

  function bindEvents() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      const s = DinoEngine.getState();
      if (!s) return;

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (s.gameOver) {
          restart();
        } else {
          DinoEngine.jump();
        }
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        DinoEngine.duck(true);
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowDown') {
        DinoEngine.duck(false);
      }
    });

    // Touch/click
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleTap(e);
    }, { passive: false });

    canvas.addEventListener('click', (e) => {
      handleTap(e);
    });

    // Touch duck: second finger or bottom half tap
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    // Resize
    window.addEventListener('resize', resizeCanvas);
  }

  function handleTap(e) {
    const s = DinoEngine.getState();
    if (!s) return;

    if (s.gameOver) {
      restart();
    } else if (!s.started) {
      DinoEngine.jump();
      startLoop();
    } else {
      DinoEngine.jump();
    }
  }

  function restart() {
    DinoEngine.reset();
    startLoop();
  }

  function startLoop() {
    if (animId) cancelAnimationFrame(animId);
    lastTime = 0;
    animId = requestAnimationFrame(gameLoop);
  }

  function stopLoop() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = timestamp;

    const s = DinoEngine.getState();
    DinoEngine.update(dt);
    render(s);

    if (s.gameOver) {
      renderGameOver(s);
      stopLoop();
      return;
    }

    animId = requestAnimationFrame(gameLoop);
  }

  // --- Rendering ---

  function render(s) {
    // Background
    if (s.nightMode) {
      ctx.fillStyle = '#1a1a1a';
    } else {
      ctx.fillStyle = '#f7f7f7';
    }
    ctx.fillRect(0, 0, DinoEngine.CANVAS_W, DinoEngine.CANVAS_H);

    // Update sprite colors for night mode
    if (s.nightMode) {
      setNightColors();
    } else {
      setDayColors();
    }

    // Stars (night mode)
    if (s.nightMode) {
      s.stars.forEach(star => Sprites.drawStar(ctx, star.x, star.y));
    }

    // Clouds
    s.clouds.forEach(cloud => Sprites.drawCloud(ctx, cloud.x, cloud.y));

    // Ground
    Sprites.drawGround(ctx, s.groundOffset, DinoEngine.CANVAS_W, DinoEngine.GROUND_Y);

    // Obstacles
    s.obstacles.forEach(obs => {
      switch (obs.type) {
        case 'cactus_small':
          Sprites.drawCactusSmall(ctx, obs.x, obs.y);
          break;
        case 'cactus_large':
          Sprites.drawCactusLarge(ctx, obs.x, obs.y);
          break;
        case 'cactus_group':
          Sprites.drawCactusGroup(ctx, obs.x, obs.y, obs.groupCount);
          break;
        case 'bird':
          Sprites.drawBird(ctx, obs.x, obs.y, obs.frame || 0);
          break;
      }
    });

    // Dino
    Sprites.drawDino(ctx, s.dino.x, s.dino.y, s.dino.ducking, s.animFrame);

    // Score (flash effect)
    if (s.flashTimer > 0 && Math.floor(s.flashTimer * 10) % 2 === 0) {
      // Blinking during flash
    } else {
      Sprites.drawScore(ctx, s.score, s.highScore, DinoEngine.CANVAS_W);
    }
  }

  function renderGameOver(s) {
    Sprites.drawGameOver(ctx, DinoEngine.CANVAS_W / 2, DinoEngine.CANVAS_H / 2);
  }

  function drawStartScreen() {
    const s = DinoEngine.getState();
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, DinoEngine.CANVAS_W, DinoEngine.CANVAS_H);
    Sprites.drawGround(ctx, 0, DinoEngine.CANVAS_W, DinoEngine.GROUND_Y);
    Sprites.drawStartScreen(ctx, DinoEngine.CANVAS_W / 2, DinoEngine.CANVAS_H / 2);
    Sprites.drawScore(ctx, 0, s.highScore, DinoEngine.CANVAS_W);
  }

  // Night/day color helpers
  function setNightColors() {
    // We modify sprite fill colors by overriding before draw
    // Since sprites use ctx.fillStyle directly, we save/restore approach
    // For simplicity, sprites already use #535353 which works in both modes
    // We just need clouds to be darker at night
  }

  function setDayColors() {
    // Default colors
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', DinoGame.init);
