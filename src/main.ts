import { createRandom, lerp, moveByAngle } from "./lib";
import { Point, Rectangle, Quadtree } from "./lib/quadtree";

const { PI, sqrt, min, max, atan2, hypot } = Math;

const cnv = document.querySelector(`canvas`)!;
document.body.appendChild(cnv);
const ctx = cnv.getContext(`2d`)!;

function getVariationFromQuery(): number {
  const params = new URLSearchParams(window.location.search);
  const v = parseInt(params.get("variation") || "", 10);
  return Number.isNaN(v) ? 1 : v;
}

let variation = getVariationFromQuery();
let random = createRandom(variation);

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
  visX: number;
  visY: number;
};

const rules: number[][] = [];
const particles: Particle[] = [];
const typesAmount = 6;

const drawCircle = (x: number, y: number) => {
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, 2 * PI);
  ctx.fill();
};

function resetParticles() {
  const width = (cnv.width = innerWidth);
  const height = (cnv.height = innerHeight);

  for (let i = 0; i < typesAmount; i++) {
    rules[i] = [];
    for (let j = 0; j < typesAmount; j++) {
      rules[i][j] = 100 * (random() - 0.5);
    }
  }

  particles.length = 0;
  for (let i = 0; i < 3000; i++) {
    const angle = random() * PI * 2;
    const radius = Math.min(width, height) / 2 * sqrt(random());
    const [x, y] = moveByAngle(width / 2, height / 2, angle, radius);
    particles[i] = {
      x,
      y,
      vx: 0,
      vy: 0,
      type: i % typesAmount,
      visX: x,
      visY: y,
    };
  }
}

function handleClick() {
  variation++;
  const params = new URLSearchParams(window.location.search);
  params.set("variation", variation.toString());
  history.replaceState(null, "", "?" + params.toString());

  random = createRandom(variation);

  resetParticles();
}

window.onclick = handleClick;

resetParticles();

setInterval(() => {
  const width = cnv.width;
  const height = cnv.height;
  ctx.fillStyle = "rgb(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);

  const boundary = new Rectangle(width / 2, height / 2, width / 2, height / 2);
  const qt = new Quadtree<Particle>(boundary, 8);
  for (const p of particles) {
    qt.insert(new Point<Particle>(p.x, p.y, p));
  }

  for (const p of particles) {
    const { x, y, type } = p;
    const range = new Rectangle(x, y, 50, 50);
    const candidates = qt.query(range);
    for (const candidate of candidates) {
      const o = candidate.data;
      if (p === o) continue;
      const dx = x - o.x;
      const dy = y - o.y;
      const distSq = dx * dx + dy * dy;
      const dist = sqrt(distSq);
      if (dist <= 50) {
        const g = rules[type][o.type];
        const clampedDistSq = distSq < 1 ? 1 : distSq;
        const angle = atan2(dy, dx);
        const force =
          (1 / max(clampedDistSq, 99)) *
          (-20 * lerp(-20, g, min(dist ** 0.8 * 0.03, 9)));
        const [nvx, nvy] = moveByAngle(p.vx, p.vy, angle, force);
        p.vx = nvx;
        p.vy = nvy;
      }
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const dxCenter = centerX - p.x;
    const dyCenter = centerY - p.y;
    const distToCenter = sqrt(dxCenter * dxCenter + dyCenter * dyCenter);

    const attractionRadius = 300;
    if (distToCenter > attractionRadius) {
      const centerStrength = 0.02;
      const angleToCenter = atan2(dyCenter, dxCenter);
      const [cvx, cvy] = moveByAngle(0, 0, angleToCenter, (distToCenter - attractionRadius) * centerStrength);
      p.vx += cvx;
      p.vy += cvy;
    }


    if (hypot(p.vx, p.vy) > 10) {
      p.vx = 0;
      p.vy = 0;
      const dist = Math.sqrt(Math.random()) * 100 + 100;
      [p.x, p.y] = moveByAngle(p.x, p.y, random() * PI * 2, dist);
    }

    p.x += p.vx;
    p.y += p.vy;
    const damping = 0.2;
    p.vx *= damping;
    p.vy *= damping;
    p.visX = lerp(p.visX, p.x, 0.1);
    p.visY = lerp(p.visY, p.y, 0.1);
    const distToReal = hypot(p.visX - p.x, p.visY - p.y);
    const hue = (360 / typesAmount) * p.type;
    ctx.fillStyle = `hsl(${hue}, ${100 - distToReal * 5}%, ${50 + distToReal ** 2 * 0.1}%, ${1 - distToReal * 0.01})`;
    drawCircle(p.visX, p.visY);
    // ctx.beginPath();
    // ctx.moveTo(p.visX, p.visY);
    // ctx.lineTo(p.x, p.y);
    // ctx.strokeStyle = `hsl(${hue}, 100%, 50%, ${1 - distToReal * 0.02})`;
    // ctx.lineWidth = 4 - distToReal * 0.1;
    // ctx.lineCap = "round";
    // ctx.stroke();
  }
}, 1000 / 60);
