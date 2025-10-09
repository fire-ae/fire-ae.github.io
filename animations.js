// animations.js
(() => {
  const CANVAS_ID = 'meteorCanvas';
  const COUNT = 2;
  const SPEED_MIN = 14.8;
  const SPEED_MAX = 17.8;
  const TRAIL_LENGTH = 240;
  const FPS_LIMIT = 60;
  const DURATION = 500000; // total duration in ms

  const canvas = document.getElementById(CANVAS_ID);
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let w = 0, h = 0, DPR = Math.max(1, window.devicePixelRatio || 1);
  let lastTime = performance.now();
  let accum = 0;
  const interval = 1000 / FPS_LIMIT;
  let stopAnimation = false;

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

  // Random prevailing angle for this session
  const baseAngle = (Math.PI / 8) + Math.random() * (Math.PI / 4);

  class Meteor {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x = Math.random() * w;
      this.y = -20 - Math.random() * 40;
this.vx = (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)) * Math.cos(baseAngle);
this.vy = (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)) * Math.sin(baseAngle);
      this.curve = (Math.random() - 0.5) * 0.15; // slight parabolic curvature
      this.headRadius = 1 + Math.random() * 2;
      this.trail = [];
      if (initial) {
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          this.trail.push({ x: this.x - this.vx * i * 2, y: this.y - this.vy * i * 2, a: 0.05 + (i / TRAIL_LENGTH) * 0.6 });
        }
      }
    }

    step(dt) {
      this.x += this.vx * dt * 60;
      this.y += (this.vy + this.curve * this.x * 0.01) * dt * 60;
      this.trail.unshift({ x: this.x, y: this.y, a: 0.9 });
      if (this.trail.length > TRAIL_LENGTH) this.trail.length = TRAIL_LENGTH;

      for (let i = 0; i < this.trail.length; i++) {
        this.trail[i].a = Math.max(0, 0.03 + (1 - i / this.trail.length) * 0.9);
      }

      if (this.x < -100 || this.x > w + 100 || this.y < -100 || this.y > h + 100) {
        this.reset(false);
      }
    }

    draw(ctx, alphaMultiplier = 1) {
      ctx.lineCap = 'round';
      for (let i = 0; i < this.trail.length - 1; i++) {
        const p0 = this.trail[i];
        const p1 = this.trail[i + 1];
        const t = 1 - i / this.trail.length;
        ctx.strokeStyle = `rgba(255,255,255,${(p0.a * 0.9 * t * alphaMultiplier).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.6, this.headRadius * 0.15 * t);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }

      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.headRadius * 3);
      grad.addColorStop(0, `rgba(255,240,160,${0.95*alphaMultiplier})`);
      grad.addColorStop(0.3, `rgba(255,200,80,${0.6*alphaMultiplier})`);
      grad.addColorStop(1, `rgba(255,200,80,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.headRadius * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,220,100,${1*alphaMultiplier})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.headRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const meteors = Array.from({ length: COUNT }, () => new Meteor());

  function clearCanvas() {
    ctx.clearRect(0, 0, w, h);
  }

  let startTime = performance.now();

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

    let elapsed = now - startTime;
    let alphaMultiplier = 1;
    if (elapsed > DURATION) {
      alphaMultiplier = Math.max(0, 1 - (elapsed - DURATION)/1000); // fade out in 1s
      if(alphaMultiplier <= 0) return; // stop completely
    }

    for (let m of meteors) m.draw(ctx, alphaMultiplier);
    if(elapsed < DURATION) {
      for (let m of meteors) m.step(dt);
    }

    requestAnimationFrame(loop);
  }

  // Canvas positioning
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
