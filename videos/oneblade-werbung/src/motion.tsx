import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, glow } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);

// Big soft light blob that drifts behind everything (one per scene, colour per scene)
export const GlowBlob: React.FC<{ color: string; x?: number[]; y?: number[]; size?: number; strength?: number }> = ({ color, x = [420, 640], y = [700, 820], size = 900, strength = 0.55 }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cx = interpolate(f, [0, durationInFrames], x), cy = interpolate(f, [0, durationInFrames], y);
  const a = interpolate(f, [0, 10, durationInFrames - 8, durationInFrames], [0, strength, strength, 0], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle, ${color} 0%, ${color}55 35%, transparent 70%)`, opacity: a, filter: "blur(40px)" }} />
      <div style={{ position: "absolute", left: 140, right: 140, top: 1240, height: 160, borderRadius: "50%", background: `radial-gradient(ellipse, ${color}88, transparent 70%)`, opacity: a * 0.6, filter: "blur(30px)" }} />
    </AbsoluteFill>
  );
};

// Scene container: zooms in out of a blur, keeps a slow 3D camera drift, and zooms *through* the camera on exit
export const SceneWrap: React.FC<{ children: React.ReactNode; tilt?: number; noEnter?: boolean }> = ({ children, tilt = 1, noEnter = false }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const inn = noEnter ? 1 : interpolate(f, [0, 12], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(f, [durationInFrames - 9, durationInFrames], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const drift = f / durationInFrames;
  const scale = (0.9 + 0.1 * inn) * (1 + 0.045 * drift) * (1 + 0.35 * out);
  const blur = (1 - inn) * 14 + out * 22;
  return (
    <AbsoluteFill style={{ perspective: 1400 }}>
      <AbsoluteFill style={{ opacity: inn * (1 - out), filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        transform: `scale(${scale}) rotateX(${(2.5 - 5 * drift) * tilt}deg) rotateY(${(-2 + 4 * drift) * tilt}deg)` }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Words whip in from the right with a motion-blur smear; one word can be highlighted with an underline
export const WhipWords: React.FC<{ words: string[]; start: number; gap?: number; size?: number; hi?: number; color?: string; top: number }> = ({ words, start, gap = 5, size = 80, hi = -1, color = C.green, top }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ top, height: "auto", bottom: "auto", flexDirection: "row", justifyContent: "center", alignContent: "flex-start", alignItems: "flex-end", flexWrap: "wrap", gap: `0 ${size * 0.28}px`, padding: "0 70px", fontFamily: FONT }}>
      {words.map((w, i) => {
        const u = interpolate(f, [start + i * gap, start + i * gap + 9], [0, 1], { ...clamp, easing: ease });
        const isHi = i === hi;
        const line = interpolate(f, [start + i * gap + 8, start + i * gap + 18], [0, 1], { ...clamp, easing: ease });
        return (
          <div key={i} style={{ position: "relative", fontWeight: 900, fontSize: size, lineHeight: 1.12, color: isHi ? color : C.ink, opacity: u,
            translate: `${(1 - u) * 260}px 0px`, scale: `${1 + (1 - u) * 1.6} 1`, filter: u < 0.98 ? `blur(${(1 - u) * 10}px)` : undefined, textShadow: isHi ? glow(color, 0.5) : undefined }}>
            {w}
            {isHi ? <div style={{ position: "absolute", left: 0, bottom: size * 0.02, height: size * 0.07, width: `${line * 100}%`, background: color, borderRadius: 4, boxShadow: glow(color, 0.4) }} /> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// A phone that rises with a light ring, tilts into place and switches its screen on
export const Phone: React.FC<{ cy: number; children: React.ReactNode; color?: string; delay?: number; screenOn?: number }> = ({ cy, children, color = C.green, delay = 0, screenOn = 14 }) => {
  const f = useCurrentFrame() - delay;
  const u = interpolate(f, [0, 22], [0, 1], { ...clamp, easing: ease });
  const on = interpolate(f, [screenOn, screenOn + 8], [0, 1], clamp);
  const ring = interpolate(f, [0, 26], [0.6, 1.25], { ...clamp, easing: ease });
  const W = 430, H = 880;
  return (
    <AbsoluteFill style={{ perspective: 1600 }}>
      <div style={{ position: "absolute", left: 540 - 330, top: cy - 330, width: 660, height: 660, borderRadius: "50%", border: `3px solid ${color}`, opacity: (1 - u) * 0.9 + 0.12, scale: ring, boxShadow: `0 0 60px ${color}88, inset 0 0 60px ${color}55` }} />
      <div style={{ position: "absolute", left: 540 - W / 2, top: cy - H / 2, width: W, height: H, borderRadius: 64, background: "#0b0b0e", border: "10px solid #1d1d22",
        boxShadow: `0 40px 120px rgba(0,0,0,0.8), 0 0 80px ${color}55`, opacity: u,
        transform: `translateY(${(1 - u) * 260}px) rotateX(${(1 - u) * 28}deg) rotateY(${(1 - u) * -22}deg) rotateZ(${(1 - u) * 6}deg)`, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: W / 2 - 70, top: 14, width: 120, height: 34, borderRadius: 20, background: "#000", zIndex: 3 }} />
        <div style={{ position: "absolute", inset: 0, opacity: on, background: "linear-gradient(180deg,#141018,#0d0b10)", fontFamily: FONT, color: C.ink }}>{children}</div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.12), transparent 40%)", pointerEvents: "none" }} />
      </div>
    </AbsoluteFill>
  );
};

// Text that smears into a pill, becomes a notification toast, then collapses into a glowing dot
export const MorphToast: React.FC<{ start: number; top: number; title: string; body: string; color?: string }> = ({ start, top, title, body, color = C.green }) => {
  const f = useCurrentFrame() - start;
  if (f < 0) return null;
  const pill = interpolate(f, [0, 8], [0, 1], { ...clamp, easing: ease });
  const open = interpolate(f, [8, 18], [0, 1], { ...clamp, easing: ease });
  const shrink = interpolate(f, [44, 56], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const w = interpolate(open, [0, 1], [380, 860]) * (1 - shrink) + 46 * shrink;
  const h = interpolate(open, [0, 1], [60, 150]) * (1 - shrink) + 46 * shrink;
  return (
    <div style={{ position: "absolute", left: 540 - w / 2, top: top - h / 2, width: w, height: h, borderRadius: Math.min(h / 2, 40 + 30 * shrink), opacity: pill,
      background: shrink > 0.6 ? color : "rgba(28,28,32,0.95)", border: `3px solid ${color}`, boxShadow: glow(color, 0.6 + shrink), overflow: "hidden", fontFamily: FONT, display: "flex", alignItems: "center", gap: 24, padding: open > 0.5 && shrink < 0.3 ? "0 30px" : 0 }}>
      <div style={{ opacity: open * (1 - shrink * 3), display: "flex", alignItems: "center", gap: 24, minWidth: 0 }}>
        <div style={{ width: 84, height: 84, borderRadius: 20, background: color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#04140a", fontWeight: 900, fontSize: 48 }}>€</div>
        <div style={{ color: C.ink, whiteSpace: "nowrap" }}>
          <div style={{ fontWeight: 900, fontSize: 40 }}>{title}</div>
          <div style={{ fontWeight: 600, fontSize: 30, color: C.dim }}>{body}</div>
        </div>
      </div>
    </div>
  );
};
