/**
 * Dino Runner Sprites
 * Pixel art drawn with canvas primitives. No external images needed.
 */
const Sprites = (() => {

  // --- Dino ---
  function drawDino(ctx, x, y, ducking, frame) {
    ctx.fillStyle = '#535353';

    if (ducking) {
      // Ducking dino: wider, shorter
      // Body
      ctx.fillRect(x, y + 16, 44, 14);
      // Head
      ctx.fillRect(x + 34, y + 10, 14, 12);
      // Eye (white)
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 42, y + 12, 4, 4);
      ctx.fillStyle = '#535353';
      // Eye pupil
      ctx.fillRect(x + 44, y + 12, 2, 4);
      // Mouth
      ctx.fillRect(x + 46, y + 18, 4, 2);
      // Legs (alternating animation)
      if (frame % 2 === 0) {
        ctx.fillRect(x + 6, y + 30, 4, 10);
        ctx.fillRect(x + 20, y + 30, 4, 6);
      } else {
        ctx.fillRect(x + 6, y + 30, 4, 6);
        ctx.fillRect(x + 20, y + 30, 4, 10);
      }
    } else {
      // Standing/running dino
      // Body
      ctx.fillRect(x + 8, y + 6, 20, 24);
      // Head
      ctx.fillRect(x + 18, y, 20, 18);
      // Eye (white)
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 30, y + 4, 4, 4);
      ctx.fillStyle = '#535353';
      // Eye pupil
      ctx.fillRect(x + 32, y + 4, 2, 4);
      // Mouth
      ctx.fillRect(x + 36, y + 12, 4, 2);
      // Tail
      ctx.fillRect(x, y + 10, 10, 6);
      ctx.fillRect(x - 4, y + 8, 6, 4);
      // Arms
      ctx.fillRect(x + 22, y + 20, 6, 8);
      // Legs (alternating animation for running)
      if (frame % 2 === 0) {
        ctx.fillRect(x + 10, y + 30, 6, 14);
        ctx.fillRect(x + 10, y + 42, 8, 2);
        ctx.fillRect(x + 22, y + 30, 6, 8);
      } else {
        ctx.fillRect(x + 10, y + 30, 6, 8);
        ctx.fillRect(x + 22, y + 30, 6, 14);
        ctx.fillRect(x + 22, y + 42, 8, 2);
      }
    }
  }

  // Hitbox dimensions
  const DINO_STANDING = { width: 36, height: 44 };
  const DINO_DUCKING = { width: 50, height: 28 };

  // --- Cactus ---
  function drawCactusSmall(ctx, x, y) {
    ctx.fillStyle = '#535353';
    // Trunk
    ctx.fillRect(x + 4, y, 8, 36);
    // Left arm
    ctx.fillRect(x, y + 10, 6, 4);
    ctx.fillRect(x, y + 6, 4, 8);
    // Right arm
    ctx.fillRect(x + 10, y + 16, 6, 4);
    ctx.fillRect(x + 12, y + 12, 4, 8);
  }

  function drawCactusLarge(ctx, x, y) {
    ctx.fillStyle = '#535353';
    // Trunk
    ctx.fillRect(x + 6, y, 12, 44);
    // Left arm
    ctx.fillRect(x, y + 14, 8, 6);
    ctx.fillRect(x, y + 8, 4, 12);
    // Right arm
    ctx.fillRect(x + 16, y + 20, 8, 6);
    ctx.fillRect(x + 20, y + 14, 4, 12);
  }

  function drawCactusGroup(ctx, x, y, count) {
    for (let i = 0; i < count; i++) {
      drawCactusSmall(ctx, x + i * 16, y);
    }
  }

  const CACTUS_SMALL = { width: 16, height: 36 };
  const CACTUS_LARGE = { width: 24, height: 44 };
  const CACTUS_GROUP = (n) => ({ width: n * 16, height: 36 });

  // --- Bird (Pterodactyl) ---
  function drawBird(ctx, x, y, frame) {
    ctx.fillStyle = '#535353';
    // Body
    ctx.fillRect(x + 6, y + 8, 24, 8);
    // Head/beak
    ctx.fillRect(x + 28, y + 8, 12, 4);
    // Eye
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 26, y + 8, 3, 3);
    ctx.fillStyle = '#535353';
    // Tail
    ctx.fillRect(x, y + 10, 8, 4);

    // Wings (flapping animation)
    if (frame % 2 === 0) {
      // Wings up
      ctx.fillRect(x + 10, y, 4, 10);
      ctx.fillRect(x + 18, y + 2, 4, 8);
    } else {
      // Wings down
      ctx.fillRect(x + 10, y + 14, 4, 10);
      ctx.fillRect(x + 18, y + 14, 4, 8);
    }
  }

  const BIRD = { width: 40, height: 24 };

  // --- Ground ---
  function drawGround(ctx, offset, canvasWidth, groundY) {
    ctx.fillStyle = '#535353';
    ctx.fillRect(0, groundY, canvasWidth, 1);

    // Ground texture (small bumps)
    const spacing = 20;
    for (let x = -offset % spacing; x < canvasWidth; x += spacing) {
      const bumpW = 2 + (Math.abs(Math.sin(x * 0.3)) * 4) | 0;
      const bumpH = 1 + (Math.abs(Math.cos(x * 0.5)) * 2) | 0;
      ctx.fillRect(x, groundY + 2, bumpW, bumpH);
    }
  }

  // --- Cloud ---
  function drawCloud(ctx, x, y) {
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(x, y + 4, 36, 8);
    ctx.fillRect(x + 4, y, 12, 4);
    ctx.fillRect(x + 20, y + 2, 10, 4);
  }

  // --- Stars (for night mode) ---
  function drawStar(ctx, x, y) {
    ctx.fillStyle = '#535353';
    ctx.fillRect(x, y, 2, 2);
    ctx.fillRect(x - 2, y + 2, 2, 2);
    ctx.fillRect(x + 2, y + 2, 2, 2);
    ctx.fillRect(x, y + 4, 2, 2);
  }

  // --- Moon (for night mode) ---
  function drawMoon(ctx, x, y) {
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    // Crescent cutout
    ctx.fillStyle = '#535353';
    ctx.beginPath();
    ctx.arc(x + 6, y - 2, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Game Over text ---
  function drawGameOver(ctx, centerX, centerY) {
    ctx.fillStyle = '#535353';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('G A M E  O V E R', centerX, centerY - 10);

    // Restart icon (circular arrow)
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 20, 12, 0.3, Math.PI * 1.8);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(centerX + 10, centerY + 12);
    ctx.lineTo(centerX + 14, centerY + 18);
    ctx.lineTo(centerX + 6, centerY + 18);
    ctx.fill();
  }

  // --- Score ---
  function drawScore(ctx, score, highScore, canvasWidth) {
    ctx.fillStyle = '#535353';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'right';

    const scoreStr = String(Math.floor(score)).padStart(5, '0');
    const hiStr = String(Math.floor(highScore)).padStart(5, '0');

    if (highScore > 0) {
      ctx.fillText(`HI ${hiStr}  ${scoreStr}`, canvasWidth - 10, 20);
    } else {
      ctx.fillText(scoreStr, canvasWidth - 10, 20);
    }
  }

  // --- Start screen ---
  function drawStartScreen(ctx, centerX, centerY) {
    // Draw static dino
    drawDino(ctx, centerX - 18, centerY - 30, false, 0);
    ctx.fillStyle = '#535353';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pulsa para jugar', centerX, centerY + 30);
  }

  return {
    drawDino, drawCactusSmall, drawCactusLarge, drawCactusGroup,
    drawBird, drawGround, drawCloud, drawStar, drawMoon,
    drawGameOver, drawScore, drawStartScreen,
    DINO_STANDING, DINO_DUCKING, CACTUS_SMALL, CACTUS_LARGE, CACTUS_GROUP, BIRD
  };
})();
