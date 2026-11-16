/**
 * Dino Runner Game Logic
 * Handles physics, collisions, obstacle spawning, scoring.
 */
const DinoEngine = (() => {
  const CANVAS_W = 600;
  const CANVAS_H = 160;
  const GROUND_Y = 130;

  // Physics
  const GRAVITY = 1800;
  const JUMP_VELOCITY = -600;
  const INITIAL_SPEED = 240;
  const MAX_SPEED = 700;
  const SPEED_INCREMENT = 0.4;

  // Spawn timing
  const MIN_SPAWN_INTERVAL = 0.5;
  const MAX_SPAWN_INTERVAL = 1.8;
  const BIRD_MIN_SCORE = 200;

  // Obstacle types
  const OBS_CACTUS_SMALL = 'cactus_small';
  const OBS_CACTUS_LARGE = 'cactus_large';
  const OBS_CACTUS_GROUP = 'cactus_group';
  const OBS_BIRD = 'bird';

  let state;

  function createState() {
    return {
      dino: {
        x: 40,
        y: GROUND_Y - Sprites.DINO_STANDING.height,
        vy: 0,
        jumping: false,
        ducking: false,
        width: Sprites.DINO_STANDING.width,
        height: Sprites.DINO_STANDING.height,
        frame: 0,
        frameTimer: 0
      },
      obstacles: [],
      clouds: [],
      stars: [],
      speed: INITIAL_SPEED,
      score: 0,
      highScore: loadHighScore(),
      groundOffset: 0,
      spawnTimer: 1.5,
      nextSpawnInterval: 1.5,
      gameOver: false,
      started: false,
      nightMode: false,
      nightTimer: 0,
      flashTimer: 0,
      animFrame: 0,
      animTimer: 0
    };
  }

  function reset() {
    const hi = state ? state.highScore : loadHighScore();
    state = createState();
    state.highScore = hi;
    return state;
  }

  function getState() {
    return state;
  }

  function jump() {
    if (!state || state.gameOver) return;
    if (!state.started) {
      state.started = true;
      return;
    }
    if (!state.dino.jumping) {
      state.dino.vy = JUMP_VELOCITY;
      state.dino.jumping = true;
      state.dino.ducking = false;
    }
  }

  function duck(active) {
    if (!state || state.gameOver || !state.started) return;
    if (state.dino.jumping && active) {
      // Fast fall when ducking in air
      state.dino.vy = Math.max(state.dino.vy, 400);
    }
    state.dino.ducking = active;
    if (active) {
      state.dino.width = Sprites.DINO_DUCKING.width;
      state.dino.height = Sprites.DINO_DUCKING.height;
      state.dino.y = GROUND_Y - Sprites.DINO_DUCKING.height;
    } else if (!state.dino.jumping) {
      state.dino.width = Sprites.DINO_STANDING.width;
      state.dino.height = Sprites.DINO_STANDING.height;
      state.dino.y = GROUND_Y - Sprites.DINO_STANDING.height;
    }
  }

  function update(dt) {
    if (!state || !state.started || state.gameOver) return;

    const s = state;

    // Speed increases over time
    s.speed = Math.min(MAX_SPEED, s.speed + SPEED_INCREMENT * dt * 60);

    // Score
    s.score += s.speed * dt * 0.04;

    // 100-point flash
    if (s.flashTimer > 0) {
      s.flashTimer -= dt;
    }
    const prevHundred = Math.floor((s.score - s.speed * dt * 0.04) / 100);
    const currHundred = Math.floor(s.score / 100);
    if (currHundred > prevHundred) {
      s.flashTimer = 0.3;
    }

    // Night mode toggle ~700 points
    s.nightTimer += dt;
    if (s.nightTimer > 20) {
      s.nightMode = !s.nightMode;
      s.nightTimer = 0;
    }

    // Ground scroll
    s.groundOffset += s.speed * dt;

    // Dino animation frame
    s.animTimer += dt;
    if (s.animTimer > 0.1) {
      s.animFrame = (s.animFrame + 1) % 2;
      s.animTimer = 0;
    }

    // Dino physics
    const dino = s.dino;
    if (dino.jumping) {
      dino.vy += GRAVITY * dt;
      dino.y += dino.vy * dt;

      const groundLevel = GROUND_Y - (dino.ducking ? Sprites.DINO_DUCKING.height : Sprites.DINO_STANDING.height);
      if (dino.y >= groundLevel) {
        dino.y = groundLevel;
        dino.vy = 0;
        dino.jumping = false;
        if (!dino.ducking) {
          dino.width = Sprites.DINO_STANDING.width;
          dino.height = Sprites.DINO_STANDING.height;
        }
      }
    }

    // Spawn obstacles
    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      spawnObstacle(s);
      const range = Math.max(0.4, MAX_SPAWN_INTERVAL - s.speed * 0.001);
      s.nextSpawnInterval = MIN_SPAWN_INTERVAL + Math.random() * range;
      s.spawnTimer = s.nextSpawnInterval;
    }

    // Update obstacles
    for (let i = s.obstacles.length - 1; i >= 0; i--) {
      const obs = s.obstacles[i];
      obs.x -= s.speed * dt;

      // Bird flap animation
      if (obs.type === OBS_BIRD) {
        obs.frameTimer = (obs.frameTimer || 0) + dt;
        if (obs.frameTimer > 0.2) {
          obs.frame = (obs.frame || 0) === 0 ? 1 : 0;
          obs.frameTimer = 0;
        }
      }

      // Remove off-screen
      if (obs.x + obs.width < -20) {
        s.obstacles.splice(i, 1);
        continue;
      }

      // Collision check
      if (checkCollision(dino, obs)) {
        s.gameOver = true;
        if (s.score > s.highScore) {
          s.highScore = Math.floor(s.score);
          saveHighScore(s.highScore);
        }
        return;
      }
    }

    // Clouds
    if (Math.random() < dt * 0.3 && s.clouds.length < 5) {
      s.clouds.push({
        x: CANVAS_W + 20,
        y: 10 + Math.random() * 40
      });
    }
    for (let i = s.clouds.length - 1; i >= 0; i--) {
      s.clouds[i].x -= s.speed * 0.2 * dt;
      if (s.clouds[i].x < -50) s.clouds.splice(i, 1);
    }

    // Stars (night mode)
    if (s.nightMode && Math.random() < dt * 0.5 && s.stars.length < 8) {
      s.stars.push({
        x: CANVAS_W + 10,
        y: 5 + Math.random() * 50
      });
    }
    for (let i = s.stars.length - 1; i >= 0; i--) {
      s.stars[i].x -= s.speed * 0.1 * dt;
      if (s.stars[i].x < -10) s.stars.splice(i, 1);
    }
  }

  function spawnObstacle(s) {
    const types = [OBS_CACTUS_SMALL, OBS_CACTUS_LARGE, OBS_CACTUS_GROUP];
    if (s.score >= BIRD_MIN_SCORE) types.push(OBS_BIRD);

    const type = types[Math.floor(Math.random() * types.length)];
    let obs = { type, x: CANVAS_W + 10, frame: 0, frameTimer: 0 };

    switch (type) {
      case OBS_CACTUS_SMALL:
        obs.width = Sprites.CACTUS_SMALL.width;
        obs.height = Sprites.CACTUS_SMALL.height;
        obs.y = GROUND_Y - obs.height;
        obs.groupCount = 1;
        break;
      case OBS_CACTUS_LARGE:
        obs.width = Sprites.CACTUS_LARGE.width;
        obs.height = Sprites.CACTUS_LARGE.height;
        obs.y = GROUND_Y - obs.height;
        break;
      case OBS_CACTUS_GROUP:
        const count = 2 + Math.floor(Math.random() * 2); // 2-3
        const dims = Sprites.CACTUS_GROUP(count);
        obs.width = dims.width;
        obs.height = dims.height;
        obs.y = GROUND_Y - obs.height;
        obs.groupCount = count;
        break;
      case OBS_BIRD:
        obs.width = Sprites.BIRD.width;
        obs.height = Sprites.BIRD.height;
        // Bird at two possible heights
        const birdHeights = [GROUND_Y - 60, GROUND_Y - 30];
        obs.y = birdHeights[Math.floor(Math.random() * birdHeights.length)];
        break;
    }

    s.obstacles.push(obs);
  }

  function checkCollision(dino, obs) {
    // AABB with some padding for forgiveness
    const pad = 6;
    const dx = dino.x + pad;
    const dy = dino.y + pad;
    const dw = dino.width - pad * 2;
    const dh = dino.height - pad * 2;

    const ox = obs.x + 2;
    const oy = obs.y + 2;
    const ow = obs.width - 4;
    const oh = obs.height - 4;

    return dx < ox + ow && dx + dw > ox && dy < oy + oh && dy + dh > oy;
  }

  function loadHighScore() {
    return parseInt(localStorage.getItem('cdp-dino-highscore') || '0', 10);
  }

  function saveHighScore(score) {
    localStorage.setItem('cdp-dino-highscore', String(score));
  }

  return {
    reset, getState, update, jump, duck,
    CANVAS_W, CANVAS_H, GROUND_Y
  };
})();
