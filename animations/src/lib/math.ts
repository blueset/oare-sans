export const TAU = Math.PI * 2;

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Positive modulo, so looping maths works for negative inputs too. */
export const mod = (value: number, n: number) => ((value % n) + n) % n;

/** 0 → 1 → 0 over one loop, easing in and out at the ends. */
export const pingPong = (t: number) => 0.5 - 0.5 * Math.cos(TAU * t);
