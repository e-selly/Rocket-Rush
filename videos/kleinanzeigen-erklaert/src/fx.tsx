import { useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, mulberry32 } from "./theme";

// ---------- shapes the particles assemble into (drawn white on a square canvas) ----------
type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;
const hole = (g: CanvasRenderingContext2D, fn: () => void) => { g.save(); g.globalCompositeOperation = "destination-out"; fn(); g.restore(); };
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
const circ = (g: CanvasRenderingContext2D, x: number, y: number, r: number) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };

export const SHAPES: Record<string, { w: number; h: number; draw: Draw }> = {
  camera: { w: 400, h: 400, draw: (g) => {
    rr(g, 50, 120, 300, 200, 34); rr(g, 140, 82, 120, 60, 16);
    hole(g, () => circ(g, 200, 220, 70)); circ(g, 200, 220, 42); hole(g, () => circ(g, 200, 220, 20)); circ(g, 305, 155, 12);
  } },
  chat: { w: 400, h: 400, draw: (g) => {
    rr(g, 40, 70, 320, 210, 44); g.beginPath(); g.moveTo(100, 260); g.lineTo(80, 345); g.lineTo(175, 275); g.fill();
    hole(g, () => { circ(g, 130, 175, 20); circ(g, 200, 175, 20); circ(g, 270, 175, 20); });
  } },
  box: { w: 400, h: 400, draw: (g) => {
    g.beginPath(); g.moveTo(200, 50); g.lineTo(350, 125); g.lineTo(350, 285); g.lineTo(200, 360); g.lineTo(50, 285); g.lineTo(50, 125); g.closePath(); g.fill();
    hole(g, () => { g.lineWidth = 10; g.lineJoin = "round"; g.strokeStyle = "#000"; g.beginPath(); g.moveTo(50, 125); g.lineTo(200, 200); g.lineTo(350, 125); g.moveTo(200, 200); g.lineTo(200, 360); g.stroke();
      g.lineWidth = 22; g.beginPath(); g.moveTo(125, 87); g.lineTo(275, 162); g.stroke(); });
  } },
  shield: { w: 400, h: 400, draw: (g) => {
    g.beginPath(); g.moveTo(200, 40); g.lineTo(335, 92); g.lineTo(335, 195); g.quadraticCurveTo(335, 305, 200, 365); g.quadraticCurveTo(65, 305, 65, 195); g.lineTo(65, 92); g.closePath(); g.fill();
    hole(g, () => { g.lineWidth = 34; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#000"; g.beginPath(); g.moveTo(135, 205); g.lineTo(185, 255); g.lineTo(270, 160); g.stroke(); });
  } },
  warning: { w: 400, h: 400, draw: (g) => {
    g.lineJoin = "round"; g.lineWidth = 40; g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(200, 60); g.lineTo(355, 330); g.lineTo(45, 330); g.closePath(); g.stroke(); g.fill();
    hole(g, () => { rr(g, 182, 140, 36, 110, 18); circ(g, 200, 290, 22); });
  } },
  euro: { w: 400, h: 400, draw: (g) => {
    g.lineWidth = 46; g.strokeStyle = "#fff"; g.lineCap = "round"; g.beginPath(); g.arc(215, 200, 120, Math.PI * 0.28, Math.PI * 1.72); g.stroke();
    rr(g, 45, 150, 200, 34, 17); rr(g, 45, 220, 200, 34, 17);
  } },
  star: { w: 400, h: 400, draw: (g) => {
    g.beginPath(); g.moveTo(200, 20); g.quadraticCurveTo(222, 178, 380, 200); g.quadraticCurveTo(222, 222, 200, 380); g.quadraticCurveTo(178, 222, 20, 200); g.quadraticCurveTo(178, 178, 200, 20); g.fill();
  } },
  word: { w: 1000, h: 220, draw: (g, w, h) => {
    g.font = `900 124px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("KLEINANZEIGEN", w / 2, h / 2 + 6);
  } },
};

const cache: Record<string, [number, number][]> = {};
function sample(key: string, n: number): [number, number][] {
  const id = `${key}:${n}`;
  if (cache[id]) return cache[id];
  const s = SHAPES[key];
  const c = document.createElement("canvas"); c.width = s.w; c.height = s.h;
  const g = c.getContext("2d")!; g.fillStyle = "#fff"; s.draw(g, s.w, s.h);
  const d = g.getImageData(0, 0, s.w, s.h).data; const pts: [number, number][] = [];
  for (let y = 0; y < s.h; y += 2) for (let x = 0; x < s.w; x += 2) if (d[(y * s.w + x) * 4 + 3] > 140) pts.push([x / s.w - 0.5, (y / s.h - 0.5) * (s.h / s.w)]);
  const r = mulberry32(key.length * 977 + n); const out: [number, number][] = [];
  for (let i = 0; i < n; i++) out.push(pts[Math.floor(r() * pts.length)] ?? [0, 0]);
  return (cache[id] = out);
}

// ---------- particles that swirl in, form a shape, shimmer and burst away ----------
export const Particles: React.FC<{ shape: string; size: number; cx?: number; cy: number; color?: string; n?: number; seed?: number; formAt?: number }> = ({ shape, size, cx = 540, cy, color = "#ffffff", n = 2600, seed = 1, formAt = 0 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pts = useMemo(() => sample(shape, n), [shape, n]);
  const rnd = useMemo(() => { const r = mulberry32(seed * 131 + 7); return pts.map(() => ({ a: r() * Math.PI * 2, d: 0.5 + r() * 0.9, delay: r() * 12, sz: 1.4 + r() * 2.2, al: 0.45 + r() * 0.55, ph: r() * 6.28, sw: r() < 0.5 ? 1 : -1 })); }, [pts, seed]);
  useLayoutEffect(() => {
    const cv = ref.current; if (!cv) return;
    const g = cv.getContext("2d")!; g.clearRect(0, 0, 1080, 1920);
    const out = Math.max(0, Math.min(1, (f - (durationInFrames - 14)) / 14)); const o = out * out;
    g.fillStyle = color;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = rnd[i];
      const u = Math.max(0, Math.min(1, (f - formAt - q.delay) / 26)); const e = 1 - Math.pow(1 - u, 3);
      // spiral in from a wide ring
      const ang = q.a + (1 - e) * 2.2 * q.sw;
      const sx = Math.cos(ang) * q.d * size * 1.4, sy = Math.sin(ang) * q.d * size * 1.4;
      let x = sx * (1 - e) + p[0] * size * e, y = sy * (1 - e) + p[1] * size * e;
      x += Math.sin(f * 0.11 + q.ph) * 1.6 * e; y += Math.cos(f * 0.09 + q.ph) * 1.6 * e;
      x += Math.cos(q.a) * o * size * 0.9 * q.d; y += Math.sin(q.a) * o * size * 0.9 * q.d - o * 60;
      g.globalAlpha = q.al * Math.min(1, u * 3 + 0.15) * (1 - o);
      g.fillRect(cx + x, cy + y, q.sz, q.sz);
    }
    g.globalAlpha = 1;
  }, [f, pts, rnd, size, cx, cy, color, durationInFrames, formAt]);
  return <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 24px ${color}66)` }} />;
};

// ---------- LED dot-matrix panel ----------
export const LedPanel: React.FC<{ top: number; height: number; level: number; palette?: string[] }> = ({ top, height, level, palette = [C.purple, C.blue, C.green, C.orange, "#ff5fa2", "#ffffff"] }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  useLayoutEffect(() => {
    const cv = ref.current; if (!cv) return; const g = cv.getContext("2d")!;
    g.clearRect(0, 0, 1080, height);
    const sp = 17, cols = Math.floor(1000 / sp), rows = Math.floor(height / sp);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i; const h = Math.sin(k * 12.9898 + 78.233) * 43758.5453; const r = h - Math.floor(h);
      const tw = 0.5 + 0.5 * Math.sin(f * (0.12 + r * 0.2) + r * 40);
      const lit = r < level;
      const col = lit && level > 0.25 ? palette[Math.floor(r * 997) % palette.length] : "#ffffff";
      g.globalAlpha = lit ? 0.25 + 0.6 * tw : 0.07;
      g.fillStyle = col; g.fillRect(40 + i * sp, j * sp, 3, 3);
    }
    g.globalAlpha = 1;
  }, [f, level, height, palette]);
  return <canvas ref={ref} width={1080} height={height} style={{ position: "absolute", left: 0, top, filter: "drop-shadow(0 0 3px rgba(255,255,255,0.5))" }} />;
};

// ---------- typewriter line ----------
export const Typer: React.FC<{ text: string; start: number; cps?: number; style?: React.CSSProperties; cursor?: boolean }> = ({ text, start, cps = 26, style, cursor = true }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.min(text.length, Math.floor(((f - start) / fps) * cps)));
  const done = n >= text.length;
  return (
    <div style={{ fontFamily: FONT, whiteSpace: "nowrap", ...style }}>
      {text.slice(0, n)}
      {cursor && f >= start && (!done || Math.floor(f / 15) % 2 === 0) ? <span style={{ opacity: 0.9, position: "absolute" }}>|</span> : null}
    </div>
  );
};
