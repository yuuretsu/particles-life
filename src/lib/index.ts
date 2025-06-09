export const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

export let moveByAngle = (x: number, y: number, angle: number, distance: number) => [
  x + Math.cos(angle) * distance,
  y + Math.sin(angle) * distance,
];

export const createRandom = (seed: number) => {
  const m = 34359738337;
  return () => {
    seed = (185852 * seed) % m;
    return seed / m;
  }
};
