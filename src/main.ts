import { createRandom, lerp, moveByAngle, Event } from "./lib";
import { quadtree } from "d3-quadtree";

const { PI, sqrt, min, max, atan2, hypot } = Math;
const cnv = document.querySelector(`canvas`)!;
document.body.appendChild(cnv);
const ctx = cnv.getContext(`2d`)!;
const dpr = window.devicePixelRatio || 1;
let width = 0, height = 0, cx = 0, cy = 0;

function getVariationFromQuery(): number {
  const params = new URLSearchParams(window.location.search);
  const v = parseInt(params.get("variation") || "", 10);
  return Number.isNaN(v) ? 1 : v;
}

let variation = getVariationFromQuery();
let random = createRandom(variation);

type Particle = { x: number; y: number; vx: number; vy: number; type: number; visX: number; visY: number };
const rules: number[][] = [];
const particles: Particle[] = [];
let typesAmount = 6;

const resizeEvent = Event.create<void>();
const resetEvent = Event.create<void>();
const clickEvent = Event.create<void>();
const tickEvent = Event.create<void>();

resizeEvent.subscribe(() => {
  width = window.innerWidth;
  height = window.innerHeight;
  cx = width / 2;
  cy = height / 2;
  cnv.style.width = width + "px";
  cnv.style.height = height + "px";
  cnv.width = width * dpr;
  cnv.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
});

resetEvent.subscribe(() => {
  typesAmount = Math.floor(2 + random() * 6);
  for (let i = 0; i < typesAmount; i++) {
    rules[i] = [];
    for (let j = 0; j < typesAmount; j++) {
      rules[i][j] = 100 * (random() - 0.5);
    }
  }
  particles.length = 0;
  for (let i = 0; i < 3000; i++) {
    const angle = random() * PI * 2;
    const radius = min(width, height) / 2 * sqrt(random());
    const [x, y] = moveByAngle(0, 0, angle, radius);
    particles[i] = { x, y, vx: 0, vy: 0, type: i % typesAmount, visX: x, visY: y };
  }
});

clickEvent.subscribe(() => {
  variation++;
  const params = new URLSearchParams(window.location.search);
  params.set("variation", variation.toString());
  history.replaceState(null, "", "?" + params.toString());
  random = createRandom(variation);
  resetEvent();
});

tickEvent.subscribe(() => {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgb(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  ctx.setTransform(dpr, 0, 0, dpr, cx * dpr, cy * dpr);

  const qt = quadtree<Particle>().x(d => d.x).y(d => d.y).addAll(particles);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const { x, y, type } = p;
    const localRandom = createRandom(i);
    const radius = 50;

    qt.visit((node, x0, y0, x1, y1) => {
      if (x0 > x + radius || x1 < x - radius || y0 > y + radius || y1 < y - radius) return true;
      if (!("data" in node)) return false;
      const o = node.data;
      if (o && o !== p) {
        const dx = x - o.x;
        const dy = y - o.y;
        const distSq = dx * dx + dy * dy;
        const dist = sqrt(distSq);
        if (dist <= radius) {
          const g = rules[type][o.type];
          const clamped = distSq < 1 ? 1 : distSq;
          const angle = atan2(dy, dx);
          const force = (1 / max(clamped, 99)) * (-20 * lerp(-20, g, min(dist ** 0.8 * 0.03, 9)));
          const [nvx, nvy] = moveByAngle(p.vx, p.vy, angle, force);
          p.vx = nvx;
          p.vy = nvy;
        }
      }
      return false;
    });

    const dxCenter = -x;
    const dyCenter = -y;
    const distToCenter = sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
    if (distToCenter > 300) {
      const angle = atan2(dyCenter, dxCenter);
      const [cvx, cvy] = moveByAngle(0, 0, angle, (distToCenter - 300) * 0.02);
      p.vx += cvx;
      p.vy += cvy;
    }

    if (hypot(p.vx, p.vy) > 10) {
      p.vx = 0;
      p.vy = 0;
      const dist = sqrt(random()) * 100 + 100;
      const [nx, ny] = moveByAngle(p.x, p.y, random() * PI * 2, dist);
      p.x = nx;
      p.y = ny;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.2;
    p.vy *= 0.2;
    p.visX = lerp(p.visX, p.x, 0.2);
    p.visY = lerp(p.visY, p.y, 0.2);

    ctx.beginPath();
    const vs = hypot(p.visX - p.x, p.visX - p.x);
    const va = atan2(p.visY - p.y, p.visX - p.x) + PI / 2;
    ctx.ellipse(p.visX, p.visY, 6, lerp(6, 8, vs * 0.2), va, 0, 2 * PI);
    const hue = (360 / typesAmount) * p.type + localRandom() * 5;
    const sat = 50 + localRandom() * 10;
    const light = 50 + (localRandom() - 0.5) * 25;
    const alpha = 1 - vs * 0.01;
    ctx.fillStyle = `hsl(${hue},${sat}%,${light}%,${alpha})`;
    ctx.fill();
  }
});

let loopId: number;
let resizeTimer: ReturnType<typeof setTimeout>;

function startLoop() {
  loopId = setInterval(() => tickEvent(), 1000 / 60);
}

window.addEventListener("resize", () => {
  clearInterval(loopId);
  clearTimeout(resizeTimer);
  resizeEvent();
  resizeTimer = setTimeout(() => startLoop(), 10);
});

window.onclick = () => clickEvent();
resizeEvent();
resetEvent();
startLoop();
