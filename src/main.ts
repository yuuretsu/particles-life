import { createRandom, lerp, moveByAngle } from "./lib";

const { PI, sqrt, min, max, atan2, hypot } = Math;

const canvas = document.querySelector(`canvas`)!;
document.body.appendChild(canvas);
const context = canvas.getContext(`2d`)!;

let variation = 1;
let random = createRandom(variation);

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
};

const rules: number[][] = [];
const particles: Particle[] = [];

const typesAmount = 6;

const drawCircle = (x: number, y: number) => {
  context.beginPath();
  context.arc(x, y, 4, 0, 2 * PI);
  context.fill();
};

const init = () => {
  random = createRandom(variation++);
  let width = (canvas.width = innerWidth);
  let height = (canvas.height = innerHeight);

  for (let i = 0; i < typesAmount; i++) {
    rules[i] = [];
    for (let j = 0; j < typesAmount; j++) {
      rules[i][j] = 200 * (random() - 0.5);
    }
  }

  for (let i = 0; i < 500; i++) {
    let angle = random() * PI * 2;
    let radius = 50 * sqrt(random());
    let [x, y] = moveByAngle(width / 2, height / 2, angle, radius);
    particles[i] = { x, y, vx: 0, vy: 0, type: i % typesAmount };
  }
};

onclick = init;
init();

setInterval(() => {
  const width = canvas.width;
  const height = canvas.height;
  context.fillStyle = "rgb(0,0,0,0.3)";
  context.fillRect(0, 0, width, height);

  for (const p of particles) {
    const { x, y, type } = p;

    for (const o of particles) {
      if (p !== o) {
        const g = rules[type][o.type];
        const dx = x - o.x;
        const dy = y - o.y;
        let distSq = dx ** 2 + dy ** 2;
        const dist = sqrt(distSq);

        if (dist <= 50) {
          distSq = distSq < 1 ? 1 : distSq;
          let angle = atan2(dy, dx);
          let force =
            (1 / max(distSq, 99)) *
            (-20 * lerp(-10, g, min(dist ** 0.8 * 0.03, 9)));
          let [nvx, nvy] = moveByAngle(p.vx, p.vy, angle, force);
          p.vx = nvx;
          p.vy = nvy;
        }
      }
    }

    if (hypot(p.vx, p.vy) > 10) {
      p.vx = 0;
      p.vy = 0;
      [p.x, p.y] = moveByAngle(p.x, p.y, random() * PI * 2, 100);
    }

    p.x += p.vx;
    p.y += p.vy;

    let damping = 0.2;
    p.vx *= damping;
    p.vy *= damping;

    const hue = 360 / typesAmount * p.type;
    context.fillStyle = `hsl(${hue}, 50%, 50%, .5)`;
    drawCircle(p.x, p.y);
  }
}, 1000 / 60);
