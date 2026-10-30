import { useMemo } from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { Bedroom, HAND_POS } from "./three/Bedroom";
import { Brain, BRAIN_PTS, Hallucination } from "./three/Brain";
import { Cam, V3, lerpV } from "./three/common";
import { EyeShot } from "./Eye";
import marks from "./voice-marks.json";

export const LEAD = 0.3;
export const FPS = 30;
export const TOTAL = 1340;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const SANS = "Inter, sans-serif";
const RED = "#ff2b2b";

const Canvas3D: React.FC<{ children: React.ReactNode; fov?: number; shadows?: boolean }> = ({ children, fov = 45, shadows = true }) => {
  const { width, height } = useVideoConfig();
  return <ThreeCanvas width={width} height={height} shadows={shadows} camera={{ fov, near: 0.02, far: 80 }} gl={{ antialias: true }} style={{ position: "absolute", inset: 0 }}>{children}</ThreeCanvas>;
};

const useU = (a = 0, b?: number, e = ease) => {
  const f = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
  return interpolate(f, [a, b ?? durationInFrames - 1], [0, 1], { ...clamp, easing: e });
};

// ---------------- shots ----------------
const Establish: React.FC = () => {
  const f = useCurrentFrame(); const u = useU();
  return (
    <Canvas3D fov={44}>
      <Cam pos={lerpV([-1.7, 1.95, -3.0], [-0.95, 1.45, -1.55], u)} look={lerpV([0.3, 0.55, 0.9], [0.25, 0.62, 1.1], u)} />
      <Bedroom t={f / 30} breathe={Math.sin(f / 22) * 0.5 + 0.5} />
    </Canvas3D>
  );
};

const Sleeper: React.FC = () => {
  const f = useCurrentFrame(); const u = useU();
  return (
    <Canvas3D fov={40}>
      <Cam pos={lerpV([1.95, 1.2, -0.9], [1.25, 0.98, 0.25], u)} look={[0.2, 0.68, 1.25]} />
      <Bedroom t={f / 30} breathe={Math.sin(f / 22) * 0.5 + 0.5} />
    </Canvas3D>
  );
};

// point of view from the pillow; eyelids at the frame edges
const Lids: React.FC<{ open: number; blur: number }> = ({ open, blur }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: -200, right: -200, top: -1300 + (1 - open) * 1100, height: 1300, borderRadius: "0 0 50% 50%", background: "#000", filter: "blur(40px)" }} />
    <div style={{ position: "absolute", left: -200, right: -200, bottom: -1300 + (1 - open) * 1100, height: 1300, borderRadius: "50% 50% 0 0", background: "#000", filter: "blur(40px)" }} />
  </AbsoluteFill>
);

const POV: React.FC<{ look: [V3, V3]; figure?: (f: number) => { pos: V3; opacity: number; scale?: number } | undefined; dawn?: (f: number) => number; lids?: boolean; shake?: number; fov?: number }> = ({ look, figure, dawn, lids = false, shake = 0, fov = 52 }) => {
  const f = useCurrentFrame(); const u = useU();
  const sway = Math.sin(f / 24) * 0.012;
  const jit = shake * 0.01;
  const l = lerpV(look[0], look[1], u);
  const open = lids ? interpolate(f, [0, 8, 14, 20, 26], [0.45, 0.85, 0.55, 0.9, 1], clamp) : 1;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: lids ? `blur(${interpolate(f, [0, 30], [8, 0], clamp)}px)` : undefined }}>
      <Canvas3D fov={fov}>
        <Cam pos={[0.2 + Math.sin(f * 1.7) * jit, 0.8 + sway + Math.cos(f * 2.1) * jit, 1.42]} look={l} />
        <Bedroom t={f / 30} showSleeper={false} figure={figure?.(f)} dawn={dawn?.(f) ?? 0} fill={1.8} exposure={1.9} />
      </Canvas3D>
      </AbsoluteFill>
      {lids ? <Lids open={open} blur={0} /> : null}
    </AbsoluteFill>
  );
};

export const HAND_CAM = { pos: [HAND_POS[0] - 0.1, 0.665, HAND_POS[2] - 0.62] as V3, look: [HAND_POS[0] + 0.01, 0.635, HAND_POS[2] - 0.05] as V3 };
const HandClose: React.FC<{ effort: (f: number) => number; grip?: (f: number) => number; dawn?: number; push?: [number, number] }> = ({ effort, grip, dawn = 0, push = [0, 1] }) => {
  const f = useCurrentFrame(); const u = useU();
  const z = interpolate(u, [0, 1], push);
  const pos = lerpV(HAND_CAM.pos, [HAND_CAM.pos[0] + 0.03, HAND_CAM.pos[1] - 0.005, HAND_CAM.pos[2] + 0.12], z);
  return (
    <Canvas3D fov={28}>
      <Cam pos={pos} look={HAND_CAM.look} roll={-0.03} />
      <Bedroom t={f / 30} finger={effort(f)} tremor={effort(f)} grip={grip?.(f) ?? 0} dawn={dawn} />
    </Canvas3D>
  );
};

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const g = f < 14 || (f > 30 && f < 34) ? 1 : 0.25;
  const jx = Math.sin(f * 7.1) * 10 * g, jy = Math.cos(f * 5.3) * 4 * g;
  const word = "SCHLAFPARALYSE";
  const txt = { fontFamily: SANS, fontWeight: 800, fontSize: 86, letterSpacing: "0.05em" } as const;
  return (
    <AbsoluteFill style={{ background: "#000", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", scale: 0.85 + 0.15 * p, opacity: p }}>
        <div style={{ ...txt, position: "absolute", color: RED, translate: `${jx}px ${jy}px`, opacity: 0.85, mixBlendMode: "screen" }}>{word}</div>
        <div style={{ ...txt, position: "absolute", color: "#38e1ff", translate: `${-jx * 0.7}px ${-jy}px`, opacity: 0.55, mixBlendMode: "screen" }}>{word}</div>
        <div style={{ ...txt, position: "relative", color: "#fff" }}>{word}</div>
      </div>
      <div style={{ marginTop: 34, opacity: interpolate(f, [12, 24], [0, 1], clamp), fontFamily: SANS, fontWeight: 500, fontSize: 36, letterSpacing: "0.32em", color: "rgba(255,255,255,0.75)" }}>WACH – ABER GELÄHMT</div>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 5px)", mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
};

const Label: React.FC<{ at: number; text: string; color?: string; top: number }> = ({ at, text, color = "#cfe8ff", top }) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [at, at + 12], [0, 1], clamp);
  const w = interpolate(f, [at, at + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 90, top, opacity: a, fontFamily: SANS, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: color, boxShadow: `0 0 18px ${color}` }} />
        <div style={{ fontWeight: 700, fontSize: 40, letterSpacing: "0.14em", textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>{text}</div>
      </div>
      <div style={{ marginTop: 14, marginLeft: 32, width: 560 * w, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
};

const BrainScene: React.FC<{ phase: "rem" | "real" }> = ({ phase }) => {
  const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig();
  const t = f / 30;
  const u = interpolate(f, [0, d - 1], [0, 1], { ...clamp, easing: ease });
  const fadeIn = interpolate(f, [0, 14], [0, 1], clamp);
  let cam: V3, look: V3, hl, block = 0, signals = 0, activity = 0.4, hall = 0;
  if (phase === "rem") {
    const awake = interpolate(f, [0, 20], [0, 1], clamp) * interpolate(f, [70, 95], [1, 0.45], clamp);
    const rem = interpolate(f, [70, 90], [0, 1], clamp);
    cam = lerpV([3.2, 1.6, 4.2], [4.6, -0.2, 1.4], u); look = lerpV([0, 0.05, 0], [0, -0.75, -0.25], u);
    hl = [{ c: BRAIN_PTS.cortexTop, col: "#d6ecff", r: 1.0, i: 1.1 * awake }, { c: BRAIN_PTS.pons, col: "#ff3a2a", r: 0.5, i: 1.6 * rem * (0.75 + 0.25 * Math.sin(t * 7)) }];
    block = rem; signals = interpolate(f, [60, 80], [0, 1], clamp); activity = 1.0 * awake + 0.3;
  } else {
    cam = lerpV([4.4, 0.6, 0.6], [2.8, 0.7, -3.6], u); look = lerpV([0, -0.1, -0.2], [0.1, -0.2, -1.4], u);
    const vis = interpolate(f, [5, 25], [0, 1], clamp) * (0.7 + 0.3 * Math.sin(t * 13) * Math.sin(t * 5));
    hl = [{ c: BRAIN_PTS.occipital, col: "#b38cff", r: 0.7, i: 1.5 * vis }, { c: BRAIN_PTS.pons, col: "#ff3a2a", r: 0.45, i: 0.5 }];
    activity = 1.2; hall = interpolate(f, [20, 95], [0, 1], clamp);
  }
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, #0e1d33 0%, #03060c 62%, #000 100%)", opacity: fadeIn }}>
      <Canvas3D fov={36} shadows={false}>
        <Cam pos={cam} look={look} />
        <Brain t={t} opacity={1} rotY={0} hl={hl} activity={activity} signals={signals} block={block} />
        {phase === "real" ? <Hallucination u={hall} from={BRAIN_PTS.occipital} to={[0.25, -1.9, -2.6]} size={[1.0, 2.6]} t={t} /> : null}
      </Canvas3D>
      {phase === "rem" ? (
        <>
          <Label at={6} text="BEWUSSTSEIN: WACH" top={230} />
          <Label at={78} text="REM-SCHLAF: MUSKELN BLOCKIERT" color={RED} top={330} />
        </>
      ) : (
        <>
          <Label at={8} text="SEHRINDE: AKTIV" color="#b38cff" top={230} />
          <Label at={45} text="WAHRNEHMUNG WIRKT ECHT" color="#e6e0ff" top={330} />
        </>
      )}
    </AbsoluteFill>
  );
};

const Morning: React.FC<{ offset?: number }> = ({ offset = 0 }) => {
  const f = useCurrentFrame() + offset; const u = interpolate(f, [0, 124], [0, 1], { ...clamp, easing: ease });
  const sit = interpolate(f, [8, 52], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const breathe = Math.max(0, Math.sin((f - 50) / 14)) * (f > 50 ? 1 : 0);
  return (
    <Canvas3D fov={44}>
      <Cam pos={lerpV([2.0, 0.78, 0.55], [1.75, 0.85, 0.75], u)} look={[-1.4, 1.35, 0.8]} />
      <Bedroom t={f / 30} sit={sit} breathe={breathe} dawn={interpolate(f, [0, 60], [0.6, 1], clamp)} showHand={false} fogDensity={0.06} fill={0.4} />
    </Canvas3D>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const a = (k: number) => interpolate(f, [k, k + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pulse = 1 + 0.04 * Math.sin(f / 5);
  return (
    <AbsoluteFill style={{ background: "#000", alignItems: "center", fontFamily: SANS, color: "#fff" }}>
      <AbsoluteFill style={{ opacity: 0.45 }}>
        <Canvas3D fov={36} shadows={false}>
          <Cam pos={[Math.sin(f / 90) * 4.6, 0.4, Math.cos(f / 90) * 4.6]} look={[0, -0.3, 0]} />
          <Brain t={f / 30} opacity={0.8} rotY={0} hl={[{ c: BRAIN_PTS.pons, col: "#ff3a2a", r: 0.5, i: 0.8 }]} activity={0.6} signals={0} block={0} />
        </Canvas3D>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.2), rgba(0,0,0,0.85) 70%)" }} />
      <div style={{ marginTop: 560, opacity: a(4), translate: `0px ${(1 - a(4)) * 30}px`, fontWeight: 500, fontSize: 44, letterSpacing: "0.3em", color: "rgba(255,255,255,0.8)" }}>FOLGE</div>
      <div style={{ marginTop: 18, opacity: a(10), scale: 0.9 + 0.1 * a(10), fontWeight: 800, fontSize: 96, letterSpacing: "0.02em" }}>Gedanken<span style={{ color: RED }}>experiment</span></div>
      <div style={{ marginTop: 34, opacity: a(22), width: 820, textAlign: "center", fontWeight: 500, fontSize: 42, lineHeight: 1.35, color: "rgba(255,255,255,0.85)" }}>für mehr Dinge, die du vielleicht noch nicht wusstest.</div>
      <div style={{ marginTop: 70, opacity: a(36), scale: pulse, padding: "26px 64px", borderRadius: 999, border: `3px solid ${RED}`, fontWeight: 800, fontSize: 44, letterSpacing: "0.08em", boxShadow: `0 0 ${30 + 15 * Math.sin(f / 5)}px rgba(255,43,43,0.45)` }}>+ FOLGEN</div>
    </AbsoluteFill>
  );
};

// ---------------- overlays ----------------
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const tiles = useMemo(() => Array.from({ length: 4 }, (_, k) => {
    const c = document.createElement("canvas"); c.width = 360; c.height = 640;
    const g = c.getContext("2d")!; const img = g.createImageData(360, 640);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.floor((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453 % 1 + 1) % 1 * 255); img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0); return c.toDataURL();
  }), []);
  return <AbsoluteFill style={{ backgroundImage: `url(${tiles[f % 4]})`, backgroundSize: "1080px 1920px", opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none" }} />;
};

const Vignette: React.FC<{ beat: number }> = ({ beat }) => (
  <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) ${55 - beat * 10}%, rgba(0,0,0,${0.75 + beat * 0.15}) 100%)` }} />
);

// heartbeat strength over time (frames) → vignette pulse
const heartAt = (f: number) => {
  if (f < 365 || f > 556) return 0;
  const bpm = interpolate(f, [365, 560], [70, 120], clamp);
  const ph = ((f / 30) * bpm / 60) % 1;
  const k = interpolate(f, [365, 420, 560, 600], [0.3, 0.6, 1, 0.6], clamp);
  return k * (Math.exp(-ph * 18) + 0.6 * Math.exp(-Math.max(0, ph - 0.18) * 18) * (ph > 0.18 ? 1 : 0));
};

// captions: white, key words in red, no box
const KEY = /^(wach|bewegen|Augen|Zimmer|Geräusche|sprechen|Arme|dunkle|Gestalt|Schlafparalyse|Bewusstsein|Muskelblockade|REM-Schlafs|Gehirn|real|ungefährlich|beängstigend|Verrückte|passieren|Gedankenexperiment|früher)$/;
type M = [number, number, string];
const toWords = (data: M[]) => data.flatMap(([s, e, txt]) => {
  const n = txt.length; let pos = 0;
  return txt.split(" ").map((w) => { const a = s + (e - s) * pos / n, b = s + (e - s) * (pos + w.length) / n; pos += w.length + 1; return { w, s: a + LEAD, e: b + LEAD, line: txt }; });
});
const defaultWords = toWords(marks as M[]);
export const Captions: React.FC<{ data?: M[]; hidden?: (f: number) => boolean }> = ({ data, hidden }) => {
  const f = useCurrentFrame(); const t = f / 30;
  const words = useMemo(() => (data ? toWords(data) : defaultWords), [data]);
  if (hidden ? hidden(f) : (f >= 556 && f < 623) || f >= 1182) return null;
  const cur = words.findIndex((x) => t >= x.s - 0.05 && t < x.e + 0.35);
  if (cur < 0) return null;
  // show a chunk of up to 4 words around the current word, within the same sentence
  const line = words[cur].line;
  const same = words.map((x, i) => ({ ...x, i })).filter((x) => x.line === line);
  const idx = same.findIndex((x) => x.i === cur);
  const start = Math.floor(idx / 4) * 4;
  const chunk = same.slice(start, start + 4);
  return (
    <AbsoluteFill style={{ top: 1470, height: 220, alignItems: "center", pointerEvents: "none" }}>
      <div style={{ width: 920, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 60, lineHeight: 1.15, textShadow: "0 3px 18px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.8)" }}>
        {chunk.map((x) => {
          const clean = x.w.replace(/[.,:!?]/g, "");
          const isKey = KEY.test(clean);
          const on = x.i === cur;
          const p = interpolate(t, [x.s, x.s + 0.12], [0, 1], clamp);
          return <span key={x.i} style={{ display: "inline-block", marginRight: 16, color: isKey ? RED : "#fff", opacity: t >= x.s ? 1 : 0.35, scale: on ? 1 + 0.08 * (1 - Math.abs(p * 2 - 1)) : 1 }}>{x.w}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const Fade: React.FC<{ from: number; to: number; at: number; dur: number; color?: string }> = ({ from, to, at, dur, color = "#000" }) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [at, at + dur], [from, to], clamp);
  if (a <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: a, pointerEvents: "none" }} />;
};

// ---------------- timeline ----------------
export const Film: React.FC<{ withAudio?: boolean; withCaptions?: boolean }> = ({ withAudio = true, withCaptions = true }) => {
  const f = useCurrentFrame();
  const beat = heartAt(f);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence name="1 Schlafzimmer" from={0} durationInFrames={150}><Establish /></Sequence>
      <Sequence name="1b Schläfer" from={150} durationInFrames={74}><Sleeper /></Sequence>
      <Sequence name="2 Augen öffnen" from={224} durationInFrames={40}><EyeShot openAt={10} /></Sequence>
      <Sequence name="3 POV Zimmer" from={264} durationInFrames={44}><POV lids look={[[0.1, 2.6, 0.3], [-1.6, 1.5, 0.5]]} /></Sequence>
      <Sequence name="4 POV Geräusche" from={308} durationInFrames={58}><POV look={[[-1.2, 1.4, -0.6], [1.15, 1.05, -3.2]]} /></Sequence>
      <Sequence name="5 Hände" from={366} durationInFrames={80}><HandClose effort={(k) => interpolate(k, [0, 20, 70], [0.2, 1, 1], clamp)} push={[0, 1]} /></Sequence>
      <Sequence name="6 Gestalt" from={446} durationInFrames={110}>
        <POV shake={1} fov={50} look={[[1.05, 1.0, -3.2], [1.2, 1.05, -3.0]]} figure={(k) => ({ pos: [1.25, 0.98 + 0.0, interpolate(k, [0, 119], [-3.15, -2.75], clamp)], opacity: interpolate(k, [6, 70], [0, 0.95], clamp) })} />
      </Sequence>
      <Sequence name="6b Sprung" from={556} durationInFrames={7}>
        <POV shake={3} fov={50} look={[[1.0, 1.05, -2.0], [1.0, 1.05, -2.0]]} figure={() => ({ pos: [0.9, 1.0, -1.1], opacity: 1, scale: 1.0 })} />
      </Sequence>
      <Sequence name="7 Titel" from={563} durationInFrames={60}><Title /></Sequence>
      <Sequence name="8 Gehirn REM" from={623} durationInFrames={168}><BrainScene phase="rem" /></Sequence>
      <Sequence name="9 Gehirn real" from={791} durationInFrames={128}><BrainScene phase="real" /></Sequence>
      <Sequence name="10 Gestalt löst sich" from={919} durationInFrames={80}>
        <POV fov={50} look={[[1.2, 1.05, -3.0], [0.9, 1.0, -3.0]]} figure={(k) => ({ pos: [1.25, 0.98, -2.8], opacity: interpolate(k, [0, 60], [0.9, 0], clamp) })} dawn={(k) => interpolate(k, [20, 80], [0, 0.35], clamp)} />
      </Sequence>
      <Sequence name="10b Hand bewegt sich" from={999} durationInFrames={60}><HandClose effort={() => 0.15} grip={(k) => interpolate(k, [8, 40], [0, 0.65], { ...clamp, easing: ease })} dawn={0.45} push={[0.5, 1]} /></Sequence>
      <Sequence name="11 Morgen" from={1059} durationInFrames={101}><Morning /></Sequence>
      <Sequence name="11b Aufblitzen" from={1160} durationInFrames={4}>
        <POV fov={50} look={[[1.2, 1.05, -3.0], [1.2, 1.05, -3.0]]} figure={() => ({ pos: [1.25, 0.98, -2.9], opacity: 1 })} dawn={() => 0.5} />
      </Sequence>
      <Sequence name="11c Morgen" from={1164} durationInFrames={20}><Morning offset={105} /></Sequence>
      <Sequence name="12 Folgen" from={1184} durationInFrames={TOTAL - 1184}><EndCard /></Sequence>

      <Vignette beat={beat} />
      <Grain />
      <Fade from={1} to={0} at={0} dur={30} />
      <Fade from={0} to={1} at={TOTAL - 20} dur={20} />
      {withCaptions ? <Captions /> : null}
      {withAudio ? <Sequence name="Stimme" from={Math.round(LEAD * FPS)}><Audio src={staticFile("voice.mp3")} /></Sequence> : null}
      {withAudio ? <Audio src={staticFile("sound.wav")} /> : null}
    </AbsoluteFill>
  );
};
