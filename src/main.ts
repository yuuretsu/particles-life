import { createRandom, lerp, moveByAngle } from "./lib";
import { Point, Rectangle, Quadtree } from "./lib/quadtree";

const { PI, sqrt, min, max, atan2, hypot } = Math;

const cnv = document.querySelector(`canvas`)!;
document.body.appendChild(cnv);
const ctx = cnv.getContext(`2d`)!;

let variation = 1;
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

const init = () => {
  random = createRandom(variation++);
  const width = (cnv.width = innerWidth);
  const height = (cnv.height = innerHeight);
  for (let i = 0; i < typesAmount; i++) {
    rules[i] = [];
    for (let j = 0; j < typesAmount; j++) {
      rules[i][j] = 200 * (random() - 0.5);
    }
  }
  particles.length = 0;
  for (let i = 0; i < 1000; i++) {
    const angle = random() * PI * 2;
    const radius = 50 * sqrt(random());
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
};

onclick = init;
init();

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
          (-20 * lerp(-10, g, min(dist ** 0.8 * 0.03, 9)));
        const [nvx, nvy] = moveByAngle(p.vx, p.vy, angle, force);
        p.vx = nvx;
        p.vy = nvy;
      }
    }
    if (hypot(p.vx, p.vy) > 10) {
      p.vx = 0;
      p.vy = 0;
      [p.x, p.y] = moveByAngle(p.x, p.y, random() * PI * 2, 100);
    }
    p.x += p.vx;
    p.y += p.vy;
    const damping = 0.2;
    p.vx *= damping;
    p.vy *= damping;
    p.visX = lerp(p.visX, p.x, 0.1);
    p.visY = lerp(p.visY, p.y, 0.1);
    const hue = (360 / typesAmount) * p.type;
    ctx.fillStyle = `hsl(${hue}, 50%, 50%, .5)`;
    drawCircle(p.visX, p.visY);
  }
}, 1000 / 60);
