export const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

export let moveByAngle = (x: number, y: number, angle: number, distance: number) => [
  x + Math.cos(angle) * distance,
  y + Math.sin(angle) * distance,
];

export const createRandom = (seed: number) => {
    return function() {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
};

