import { Easing, interpolate } from "remotion";

export const C = {
  bg: "#06101d",
  ink: "#ffffff",
  dim: "#9fb0c6",
  green: "#19c26b",
  yellow: "#ffd23f",
  red: "#ff4b4b",
  card: "rgba(255,255,255,0.06)",
  line: "rgba(255,255,255,0.14)",
};

export const FONT = "Inter, sans-serif";

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0 → 1 over `dur` frames starting at `start`
export const rise = (frame: number, start: number, dur = 12) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: ease });

// fade + lift in, fade out at the end of the scene
export const enter = (frame: number, start: number, end?: number, dist = 40) => {
  const a = rise(frame, start);
  const b = end === undefined ? 1 : 1 - rise(frame, end - 8, 8);
  return { opacity: a * b, translate: `0px ${(1 - a) * dist}px` };
};

export const count = (frame: number, start: number, dur: number, to: number) =>
  interpolate(frame, [start, start + dur], [0, to], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });

export const de = (n: number, digits = 1) => n.toFixed(digits).replace(".", ",");
