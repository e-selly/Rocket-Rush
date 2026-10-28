import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { GOLD, SERIF, clamp, shadow } from "./Spot";

const R = (i: number, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

// floating golden bokeh, drifting upward
export const GoldDust: React.FC<{ count?: number; opacity?: number }> = ({ count = 26, opacity = 0.55 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: count }, (_, i) => {
        const sz = 6 + R(i, 2) * 22, sp = 0.4 + R(i, 3) * 1.1;
        const y = ((R(i, 4) * 2100 - f * sp * 2) % 2100 + 2100) % 2100 - 90;
        const x = R(i, 5) * 1080 + Math.sin(f / (30 + R(i, 6) * 40) + i) * 30;
        const tw = 0.5 + 0.5 * Math.sin(f / (8 + R(i, 7) * 10) + i * 2);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: sz, height: sz, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,226,160,${0.9 * tw}) 0%, rgba(227,194,122,0) 70%)`, opacity, filter: sz > 18 ? "blur(2px)" : undefined }} />;
      })}
    </AbsoluteFill>
  );
};

// warm light leak drifting across the frame
export const LightLeak: React.FC<{ at: number; dur?: number; strength?: number }> = ({ at, dur = 40, strength = 0.5 }) => {
  const f = useCurrentFrame();
  const u = interpolate(f, [at, at + dur], [0, 1], clamp);
  if (u <= 0 || u >= 1) return null;
  const a = Math.sin(u * Math.PI) * strength;
  const x = interpolate(u, [0, 1], [-30, 130]);
  return <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: a, background: `radial-gradient(ellipse 60% 45% at ${x}% 30%, rgba(255,190,110,0.9), rgba(255,120,60,0.25) 45%, transparent 75%)` }} />;
};

export const Flash: React.FC<{ at: number; color?: string; peak?: number }> = ({ at, color = "255,236,200", peak = 0.6 }) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [at, at + 2, at + 12], [0, peak, 0], clamp);
  if (a <= 0) return null;
  return <AbsoluteFill style={{ pointerEvents: "none", background: `rgba(${color},${a})`, mixBlendMode: "screen" }} />;
};

// golden sparks bursting from a point
export const Sparks: React.FC<{ at: number; x: number; y: number; n?: number }> = ({ at, x, y, n = 22 }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > 30) return null;
  const u = t / 30;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * Math.PI * 2 + R(i, 9) * 0.4, sp = 180 + R(i, 8) * 260;
        const d = sp * Easing.out(Easing.cubic)(u);
        const px = x + Math.cos(ang) * d, py = y + Math.sin(ang) * d + 120 * u * u;
        const s = (1 - u) * (5 + R(i, 7) * 6);
        return <div key={i} style={{ position: "absolute", left: px - s, top: py - s, width: s * 2, height: s * 2, borderRadius: "50%", background: "#ffe7b0", boxShadow: `0 0 ${s * 3}px ${GOLD}`, opacity: 1 - u }} />;
      })}
    </AbsoluteFill>
  );
};

// words rise out of a mask, one after another, with a little blur and overshoot
export const Kinetic: React.FC<{ text: string; at: number; size: number; color?: string; stagger?: number; font?: string; weight?: number }> = ({ text, at, size, color = "#fff", stagger = 4, font = SERIF, weight = 700 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${size * 0.26}px`, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.08, color, textShadow: shadow }}>
      {text.split(" ").map((w, i) => {
        const p = interpolate(f, [at + i * stagger, at + i * stagger + 14], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.45, 0.64, 1) });
        const o = interpolate(f, [at + i * stagger, at + i * stagger + 6], [0, 1], clamp);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.12 }}>
            <span style={{ display: "inline-block", opacity: o, translate: `0px ${(1 - p) * size * 0.9}px`, rotate: `${(1 - p) * 6}deg`, filter: p < 0.98 ? `blur(${(1 - Math.min(1, p)) * 8}px)` : undefined }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

// counting price with pop on landing
export const CountPrice: React.FC<{ price: number; model: string; at?: number }> = ({ price, model, at = 4 }) => {
  const f = useCurrentFrame();
  const land = at + 16;
  const v = Math.round(interpolate(f, [at, land], [0, price], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const pop = interpolate(f, [land, land + 4, land + 12], [1, 1.16, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const a = interpolate(f, [0, 8], [0, 1], clamp);
  const glow = interpolate(f, [land, land + 3, land + 20], [0, 1, 0.25], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 165, textAlign: "center", color: "#fff", fontFamily: "Inter, sans-serif", textShadow: shadow }}>
      <div style={{ opacity: a, fontWeight: 600, fontSize: 40, letterSpacing: "0.08em", translate: `0px ${(1 - a) * 16}px` }}>{model}</div>
      <div style={{ opacity: a, scale: pop, marginTop: 8, display: "inline-flex", alignItems: "baseline", gap: 18 }}>
        <span style={{ fontWeight: 500, fontSize: 52, color: GOLD }}>ab</span>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 190, lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: `${shadow}, 0 0 ${40 * glow}px rgba(227,194,122,${0.9 * glow})` }}>{v} €</span>
        <span style={{ fontWeight: 500, fontSize: 48, color: "#e8e8e8" }}>/ Tag</span>
      </div>
    </div>
  );
};

// camera punch: quick zoom settle at the start of a shot, optional shake
export const Punch: React.FC<{ children: React.ReactNode; amount?: number; shakeAt?: number }> = ({ children, amount = 0.07, shakeAt }) => {
  const f = useCurrentFrame();
  const s = 1 + amount * (1 - interpolate(f, [0, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const k = shakeAt === undefined ? 0 : interpolate(f, [shakeAt, shakeAt + 12], [1, 0], clamp) * (f >= shakeAt ? 1 : 0);
  const dx = k * 10 * Math.sin(f * 2.7), dy = k * 8 * Math.cos(f * 3.3);
  return <AbsoluteFill style={{ scale: s, translate: `${dx}px ${dy}px` }}>{children}</AbsoluteFill>;
};
