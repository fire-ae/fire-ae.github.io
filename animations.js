// animations.js
(() => {
  const CANVAS_ID = 'meteorCanvas';
  const COUNT = 10;            // number of meteors
  const SPEED_MIN = 0.2;       // slow range
  const SPEED_MAX = 0.8;
  const TRAIL_LENGTH = 12;     // how many points in the trail
  const FPS_LIMIT = 60;

  const canvas = document.getElementById(CANVAS_ID);
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let w = 0, h = 0, DPR = Math.max(1, window.devicePixelRatio || 1);
  let lastTime = performance.now();
  let accum = 0;
  const interval = 1000 / FPS_LIMIT;

  function resize() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  class Meteor {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      // Spawn randomly just off-screen or inside
      const side = Math.random();
      this.x = side < 0.6 ? Math.random() * w : (side < 0.8 ? -30 : w + 30);
      this.y = Math.random() * h * 0.7; // avoid bottom-heavy spawn
      // direction and speed
      const angle = (Math.PI / 8) + (Math.random() * Math.PI / 4); // mostly diagonal
      const dir = (Math.random() < 0.5) ? 1 : -1;
      this.vx = dir * (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)) * Math.cos(angle);
      this.vy = (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)) * Math.sin(angle) * 0.6;
      // visual
      this.headRadius = 3 + Math.random() * 2; // slightly bigger yellow sphere
      this.trail = []; // array of {x,y,alpha}
      // initial trail warm-up if initial so they appear instantly
      if (initial) {
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          this.trail.push({ x: this.x - this.vx * i * 2, y: this.y - this.vy * i * 2, a: 0.05 + (i / TRAIL_LENGTH) * 0.6 });
        }
      }
    }

    step(dt) {
      // dt in seconds
      this.x += this.vx * dt * 60;
      this.y += this.vy * dt * 60;

      // push current head to trail
      this.trail.unshift({ x: this.x, y: this.y, a: 0.9 });
      if (this.trail.length > TRAIL_LENGTH) this.trail.length = TRAIL_LENGTH;

      // fade trail alpha slightly
      for (let i = 0; i < this.trail.length; i++) {
        // older points are dimmer
        this.trail[i].a = Math.max(0, 0.03 + (1 - i / this.trail.length) * 0.9);
      }

      // respawn if fully out of bounds
      if (this.x < -100 || this.x > w + 100 || this.y < -100 || this.y > h + 100) {
        this.reset(false);
        // bias spawn to edge so they drift across screen
        if (Math.random() < 0.6) {
          this.x = Math.random() * w;
          this.y = -20 - Math.random() * 40;
          this.vx = (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)) * (Math.random() < 0.5 ? -1 : 1) * 0.6;
          this.vy = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
        }
      }
    }

    draw(ctx) {
      // draw trail as thin white lines with decreasing alpha and width
      ctx.lineCap = 'round';
      for (let i = 0; i < this.trail.length - 1; i++) {
        const p0 = this.trail[i];
        const p1 = this.trail[i + 1];
        const t = 1 - i / this.trail.length;
        ctx.strokeStyle = `rgba(255,255,255,${(p0.a * 0.9 * t).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.6, this.headRadius * 0.15 * t);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }

      // soft glow for head
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.headRadius * 3);
      grad.addColorStop(0, 'rgba(255,240,160,0.95)');
      grad.addColorStop(0.3, 'rgba(255,200,80,0.6)');
      grad.addColorStop(1, 'rgba(255,200,80,0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.headRadius * 3, 0, Math.PI * 2);
      ctx.fill();

      // solid yellow head
      ctx.fillStyle = 'rgba(255,220,100,1)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.headRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // create meteors
  const meteors = Array.from({ length: COUNT }, (_, i) => new Meteor());

  function clearCanvas() {
    // keep it fully transparent background => do not dim page
    ctx.clearRect(0, 0, w, h);
  }

  function loop(now) {
    const dtMs = now - lastTime;
    lastTime = now;
    accum += dtMs;
    // throttle to FPS_LIMIT to save CPU
    if (accum < interval) {
      requestAnimationFrame(loop);
      return;
    }
    const dt = accum / 1000;
    accum = 0;

    clearCanvas();

    // step & draw
    for (let m of meteors) {
      m.step(dt);
      m.draw(ctx);
    }

    requestAnimationFrame(loop);
  }

  // Ensure canvas sits above content visually but doesn't block interactions
  // If your CSS already sets #meteorCanvas, this will override safely.
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.style.mixBlendMode = 'screen'; // subtle blending with page (optional)

  // Start
  requestAnimationFrame(loop);
})();
