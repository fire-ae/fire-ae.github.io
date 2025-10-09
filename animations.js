// animations.js
(() => {
  const CANVAS_ID = 'meteorCanvas';
  const COUNT = 15;
  const SPEED_MIN = 5.8;
  const SPEED_MAX = 6.8;
  const TRAIL_LENGTH = 240;
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

  // one random global direction
  const showerAngle = Math.random() * Math.PI * 2;
  const angleSpread = Math.PI / 12; // ±15°

  class Meteor {
    constructor() { this.reset(true); }

    reset(initial = false) {
      const side = Math.random();
      this.x = side < 0.6 ? Math.random() * w : (side < 0.8 ? -30 : w + 30);
      this.y = Math.random() * h * 0.7;

      const angle = showerAngle + (Math.random() * angleSpread - angleSpread / 2);
      const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;

      // acceleration perpendicular to direction for gentle curve
      const accMag = (Math.random() * 0.015 + 0.005) * (Math.random() < 0.5 ? 1 : -1);
      this.ax = -Math.sin(angle) * accMag;
      this.ay = Math.cos(angle) * accMag;

      this.headRadiusBase = 1 + Math.random() * 2;
      this.trail = [];
      this.age = 0;
      this.maxAge = 108 + Math.random() * 24; // 1.8–2.2 s

      if (initial) {
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          this.trail.push({
            x: this.x - this.vx * i * 2,
            y: this.y - this.vy * i * 2,
            a: 0.05 + (i / TRAIL_LENGTH) * 0.6
          });
        }
      }
    }

    step(dt) {
      this.age++;
      this.vx += this.ax; // gradual curvature
      this.vy += this.ay;
      this.x += this.vx * dt * 60;
      this.y += this.vy * dt * 60;

      this.trail.unshift({ x: this.x, y: this.y, a: 0.9 });
      if (this.trail.length > TRAIL_LENGTH) this.trail.length = TRAIL_LENGTH;

      for (let i = 0; i < this.trail.length; i++) {
        this.trail[i].a = Math.max(0, 0.03 + (1 - i / this.trail.length) * 0.9);
      }

      const half = this.maxAge / 2;
      if (this.age < half) {
        this.headRadius = this.headRadiusBase * (0.5 + (this.age / half));
      } else {
        this.headRadius = this.headRadiusBase * (1.5 - (this.age - half) / half);
      }

      if (this.age > this.maxAge ||
          this.x < -100 || this.x > w + 100 || this.y < -100 || this.y > h + 100)
        this.reset(false);
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

  function loop(now) {
    const dtMs = now - lastTime;
    lastTime = now;
    accum += dtMs;
    if (accum < interval) { requestAnimationFrame(loop); return; }
    const dt = accum / 1000;
    accum = 0;
    ctx.clearRect(0, 0, w, h);
    for (const m of meteors) { m.step(dt); m.draw(ctx); }
    requestAnimationFrame(loop);
  }

  canvas.style = `
    position:fixed;
    top:0; left:0;
    width:100%; height:100%;
    pointer-events:none;
    z-index:9999;
    mix-blend-mode:screen;
  `;

  requestAnimationFrame(loop);
})();
