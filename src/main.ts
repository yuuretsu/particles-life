import { lerp, moveByAngle } from "./lib";

const { PI, sqrt, min, max, atan2, hypot } = Math;

const canvas = document.querySelector(`canvas`)!;
document.body.appendChild(canvas);
const context = canvas.getContext(`2d`)!;

let V = 1, S = V, m = 34359738337;
let random = () => (S = (185852 * S) % m) / m;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
};

const rules: number[][] = [];
const particles: Particle[] = [];



let drawCircle = (x: number, y: number) => {
  context.beginPath();
  context.arc(x, y, 4, 0, 2 * PI);
  context.fill();
};

let initialize = () => {
  S = V++ % m;
  let width = (canvas.width = innerWidth);
  let height = (canvas.height = innerHeight);

  for (let i = 0; i < 6; i++) {
    rules[i] = [];
    for (let j = 0; j < 6; j++) {
      rules[i][j] = 200 * (random() - 0.5);
    }
  }

  for (let i = 0; i < 500; i++) {
    let angle = random() * PI * 2;
    let radius = 50 * sqrt(random());
    let [x, y] = moveByAngle(width / 2, height / 2, angle, radius);
    particles[i] = { x, y, vx: 0, vy: 0, type: i % 6 };
  }
};

onclick = initialize;
initialize();

setInterval(() => {
  let width = canvas.width;
  let height = canvas.height;
  context.fillStyle = "rgb(0,0,0,0.3)";
  context.fillRect(0, 0, width, height);

  for (const p of particles) {
    let { x, y, type } = p;

    for (const o of particles) {
      if (p !== o) {
        let g = rules[type][o.type];
        let dx = x - o.x;
        let dy = y - o.y;
        let distSq = dx ** 2 + dy ** 2;
        let dist = sqrt(distSq);

        if (dist <= 50) {
          distSq = distSq < 1 ? 1 : distSq;
          let angle = atan2(dy, dx);
          let force = (1 / max(distSq, 99)) * (-20 * lerp(-10, g, min(dist ** 0.8 * 0.03, 9)));
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

    context.fillStyle = `hsl(${45 * p.type},50%,50%,.5)`;
    drawCircle(p.x, p.y);
  }
}, 1000 / 60);
