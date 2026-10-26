import { Easing, interpolate } from "remotion";

export const C = { bg: "#050307", ink: "#ffffff", dim: "#a8a3b3", green: "#3dff7a", orange: "#ffa53d", purple: "#c64dff", red: "#ff4b5c", blue: "#4fd1ff" };
export const FONT = "Inter, sans-serif";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const rise = (f: number, start: number, dur = 12) => interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing: ease });
export const enter = (f: number, start: number, end?: number, dist = 30) => {
  const a = rise(f, start);
  const b = end === undefined ? 1 : 1 - rise(f, end - 8, 8);
  return { opacity: a * b, translate: `0px ${(1 - a) * dist}px` };
};
export const glow = (color: string, k = 1) => `0 0 ${18 * k}px ${color}, 0 0 ${46 * k}px ${color}`;

export function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
