// animations.js
(() => {
  const CANVAS_ID = 'meteorCanvas';
  const COUNT = 15;            // number of meteors
  const SPEED_MIN = 3.8;       // slow range
  const SPEED_MAX = 6.8;
  const TRAIL_LENGTH = 240;     // how many points in the trail
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
      const side = Math.random();
      this.x = side < 0.6 ? Math.random() * w : (side < 0.8 ? -30 : w + 30);
      this.y = Math.random() * h * 0.7;
      const angle = (Math.PI / 8) + (Math.random() * Math.PI / 4);
      const dir = (Math.random() < 0.5) ? 1 : -1;
      this.vx = dir * (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)) * Math.cos(angle);
      this.vy = (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)) * Math.sin(angle) * 0.6;

      this.headRadiusBase = 1 + Math.random() * 2;
      this.trail = [];
      this.age = 0;
      this.maxAge = 108 + Math.random() * 24; // 1.8–2.2 seconds at 60fps

      if (initial) {
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          this.trail.push({ x: this.x - this.vx * i * 2, y: this.y - this.vy * i * 2, a: 0.05 + (i / TRAIL_LENGTH) * 0.6 });
        }
      }
    }

    step(dt) {
      this.age++;
      this.x += this.vx * dt * 60;
      this.y += this.vy * dt * 60;

      this.trail.unshift({ x: this.x, y: this.y, a: 0.9 });
      if (this.trail.length > TRAIL_LENGTH) this.trail.length = TRAIL_LENGTH;

      for (let i = 0; i < this.trail.length; i++) {
        this.trail[i].a = Math.max(0, 0.03 + (1 - i / this.trail.length) * 0.9);
      }

      // Head grows then shrinks
      const half = this.maxAge / 2;
      if (this.age < half) {
        this.headRadius = this.headRadiusBase * (0.5 + (this.age / half));
      } else {
        this.headRadius = this.headRadiusBase * (1.5 - (this.age - half) / half);
      }

      if (this.age > this.maxAge) this.reset(false);

      // respawn if out-of-bounds
      if (this.x < -100 || this.x > w + 100 || this.y < -100 || this.y > h + 100) {
        this.reset(false);
        if (Math.random() < 0.6) {
          this.x = Math.random() * w;
          this.y = -20 - Math.random() * 40;
          this.vx = (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)) * (Math.random() < 0.5 ? -1 : 1) * 0.6;
          this.vy = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
        }
      }
    }

    draw(ctx) {
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

      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.headRadius * 3);
      grad.addColorStop(0, 'rgba(255,240,160,0.95)');
      grad.addColorStop(0.3, 'rgba(255,200,80,0.6)');
      grad.addColorStop(1, 'rgba(255,200,80,0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.headRadius * 3, 0, Math.PI * 2);
      ctx.fill();

      if (this.headRadius > 0.2) {
        ctx.fillStyle = 'rgba(255,220,100,1)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.headRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const meteors = Array.from({ length: COUNT }, () => new Meteor());

  function clearCanvas() {
    ctx.clearRect(0, 0, w, h);
  }

  function loop(now) {
    const dtMs = now - lastTime;
    lastTime = now;
    accum += dtMs;
    if (accum < interval) {
      requestAnimationFrame(loop);
      return;
    }
    const dt = accum / 1000;
    accum = 0;

    clearCanvas();

    for (let m of meteors) {
      m.step(dt);
      m.draw(ctx);
    }

    requestAnimationFrame(loop);
  }

  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.style.mixBlendMode = 'screen';

  requestAnimationFrame(loop);
})();
