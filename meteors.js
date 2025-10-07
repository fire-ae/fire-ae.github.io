
// === CONFIGURATION ===
const NUM_METEORS = 8;           // number of meteors
const USE_IMAGE = false;         // true → use custom image
const IMAGE_SRC = "spctel2.jpeg" // path to your image
const TRAIL_LENGTH = 20;         // trail fade persistence
const SPEED_RANGE = [2, 5];      // min–max speed
const SIZE = 20;                 // circle size or image size

// === SETUP ===
const canvas = document.getElementById("meteorCanvas");
const ctx = canvas.getContext("2d");
let meteors = [];
let img = new Image();
img.src = IMAGE_SRC;

function resizeCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// === METEOR CLASS ===
class Meteor {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * SPEED_RANGE[1];
    this.vy = (Math.random() - 0.5) * SPEED_RANGE[1];
    this.trail = [];
  }
  update() {
    this.trail.push({x: this.x, y: this.y});
    if (this.trail.length > TRAIL_LENGTH) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;

    // Bounce off edges
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }
  draw() {
    // Draw trail
    for (let i = 0; i < this.trail.length; i++) {
      let alpha = i / this.trail.length;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 220, 100, ${alpha * 0.5})`;
      ctx.arc(this.trail[i].x, this.trail[i].y, SIZE * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw main body
    if (USE_IMAGE) {
      ctx.drawImage(img, this.x - SIZE / 2, this.y - SIZE / 2, SIZE, SIZE);
    } else {
      ctx.beginPath();
      ctx.fillStyle = "rgba(255, 255, 180, 1)";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ffaa33";
      ctx.arc(this.x, this.y, SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

// === INITIALIZE ===
for (let i = 0; i < NUM_METEORS; i++) meteors.push(new Meteor());

// === ANIMATE ===
function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  meteors.forEach(m => { m.update(); m.draw(); });
  requestAnimationFrame(animate);
}
animate();
