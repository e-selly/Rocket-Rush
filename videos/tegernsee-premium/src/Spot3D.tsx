import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { Benefit, GOLD, Group, ModelLabel, SANS, SERIF, Shot, Sweep, clamp, rise, shadow } from "./Spot";
import { CountPrice, Flash, GoldDust, Kinetic, LightLeak, Punch, Sparks } from "./fx3d";
import { Cam, Car3D, Env, SPECS } from "./three/Car3D";
import { Diorama, HOUSE_A, LakeWorld, ShowroomWorld } from "./three/Worlds";
import TL from "./tl3d.json";
import captions from "./captions3d.json";

const smooth = Easing.inOut(Easing.cubic);
const lerp3 = (u: number, k: number[], v: number[][]) => [0, 1, 2].map((i) => interpolate(u, k, v.map((p) => p[i]), clamp)) as [number, number, number];

const Canvas: React.FC<{ children: React.ReactNode; fov?: number; env?: number }> = ({ children, fov = 30, env = 0.7 }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov, near: 0.1, far: 900 }} gl={{ antialias: true }} style={{ position: "absolute", inset: 0 }}>
      <Env intensity={env} />
      {children}
    </ThreeCanvas>
  );
};

const Note: React.FC = () => (
  <div style={{ position: "absolute", right: 48, top: 1500, fontFamily: SANS, fontSize: 22, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>Abbildung symbolisch</div>
);

// headlights blink on like a greeting
const blink = (f: number, at: number) => (f < at ? 0.05 : f < at + 3 ? 1 : f < at + 6 ? 0.15 : 1);

// ---------- scenes ----------
const Opening3D: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: d } = useVideoConfig();
  const u = interpolate(f, [0, d - 1], [0, 1], { ...clamp, easing: smooth });
  const x = -14 + f * 0.24;
  const s = SPECS.x5;
  const off = lerp3(u, [0, 0.42, 1], [[3.4, 0.5, 3.8], [5.2, 1.2, 9.5], [1.5, 3.4, 19]]);
  const look = lerp3(u, [0, 0.42, 1], [[1.7, 0.75, 0], [0.5, 1.6, 0], [0.3, 5.2, 0]]);
  return (
    <AbsoluteFill>
      <Canvas fov={42}>
        <Cam pos={[x + off[0], off[1], 3.4 + off[2]]} look={[x + look[0], look[1], 3.4 + look[2]]} />
        <LakeWorld>
          <Car3D spec={s} position={[x, 0.04 + Math.sin(f * 0.9) * 0.008, 3.4]} spin={x / s.r} lights={blink(f, 6)} />
        </LakeWorld>
      </Canvas>
      <LightLeak at={2} dur={60} strength={0.55} />
      <Sweep at={60} />
      <GoldDust count={18} opacity={0.45} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 290 }}>
        <Kinetic text="Dein Mietwagen." at={40} size={100} />
        <Kinetic text="Dein Tegernsee." at={58} size={100} color={GOLD} />
      </div>
    </AbsoluteFill>
  );
};

const Turntable: React.FC<{ car: keyof typeof SPECS; dir: 1 | -1; low?: boolean }> = ({ car, dir, low = false }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const u = f / durationInFrames;
  const s = SPECS[car];
  const base = low ? Math.PI + 0.55 : -0.55;
  const rot = base + dir * interpolate(u, [0, 1], [-0.5, 0.45], { easing: Easing.out(Easing.quad) });
  const punch = interpolate(f, [0, 16], [1.28, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) }) * interpolate(u, [0, 1], [1, 0.94]);
  const D = ((s.L * 0.85 + s.W * 0.6) / (2 * 0.142)) * 1.08 * punch;
  const h = (low ? 1.3 : 2.4) + Math.sin(u * Math.PI) * 0.35;
  const orbit = dir * interpolate(u, [0, 1], [0.18, -0.12]);
  return (
    <Canvas fov={28} env={1.15}>
      <Cam pos={[Math.sin(orbit) * D, h, Math.cos(orbit) * D]} look={[0, 0.78, 0]} />
      <ShowroomWorld radius={s.L * 0.6}>
        <Car3D spec={s} rotY={rot} lights={blink(f, 5)} />
      </ShowroomWorld>
    </Canvas>
  );
};

const InfinityKm: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const km = Math.round(interpolate(f, [at, at + 26], [0, 99999], { ...clamp, easing: Easing.in(Easing.cubic) }));
  const swap = f >= at + 26;
  const p = interpolate(f, [at + 26, at + 36], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  const a = interpolate(f, [at, at + 6], [0, 1], clamp);
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 540, textAlign: "center", opacity: a, fontFamily: SERIF, fontWeight: 700, color: GOLD, textShadow: `${shadow}, 0 0 30px rgba(227,194,122,0.6)` }}>
      {swap ? <span style={{ display: "inline-block", fontSize: 150, scale: 0.6 + 0.4 * p, lineHeight: 1 }}>∞ <span style={{ fontSize: 70 }}>km</span></span>
        : <span style={{ fontSize: 96, fontVariantNumeric: "tabular-nums", lineHeight: 1.4 }}>{km.toLocaleString("de-DE")} km</span>}
    </div>
  );
};

const Benefits3D: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: d } = useVideoConfig();
  const ha = HOUSE_A - 0.4, R = 6.95;
  const arrive = 105, leave = TL.b2 - 12;
  const a = f < arrive ? interpolate(f, [0, arrive], [ha - 2.4, ha - 0.32], { ...clamp, easing: Easing.out(Easing.cubic) })
    : f < leave ? ha - 0.32 : interpolate(f, [leave, d - 1], [ha - 0.32, ha + 4.8], { ...clamp, easing: Easing.in(Easing.quad) });
  const trailFrom = ha - 0.32;
  const trail = f < TL.b2 ? 0 : a - trailFrom;
  const th = interpolate(f, [0, d - 1], [-0.35, 0.6]);
  const el = interpolate(f, [0, 60], [1.2, 0.62], { ...clamp, easing: smooth });
  const dist = interpolate(f, [0, 60], [33, 28], { ...clamp, easing: smooth });
  const drop = 18, land = 34;
  const pinY = f < land ? interpolate(f, [drop, land], [7, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : Math.abs(Math.sin((f - land) * 0.35)) * 0.5 * Math.exp(-(f - land) / 10);
  const s = SPECS.golf;
  return (
    <AbsoluteFill>
      <Punch amount={0} shakeAt={land}>
        <Canvas fov={44}>
          <Cam pos={[Math.sin(th) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(th) * Math.cos(el) * dist]} look={[0, 4.2, 0]} />
          <Diorama trail={trail} trailStart={trailFrom - Math.PI / 2} pin={f >= drop ? 1 + (f - land) / 60 : 0} pinY={pinY} ripple={interpolate(f, [land, land + 24], [0, 1], clamp)}
            people={interpolate(f, [TL.b3, TL.b3 + 14], [0, 1], clamp)}>
            <Car3D spec={s} scale={0.62} position={[Math.sin(a) * R, 0.04, Math.cos(a) * R]} rotY={a} spin={(a * R) / (s.r * 0.62)} lights={1} />
          </Diorama>
        </Canvas>
      </Punch>
      <GoldDust count={14} opacity={0.35} />
      <div style={{ position: "absolute", left: 80, right: 60, top: 165, fontFamily: SANS, textShadow: shadow }}>
        <Benefit text="Kostenlose Zustellung rund um den Tegernsee" at={TL.b1} idx={0} />
        <Benefit text="Unbegrenzte Kilometer" at={TL.b2} idx={1} />
        <Benefit text="Zusatzfahrer inklusive" at={TL.b3} idx={2} />
      </div>
      <InfinityKm at={TL.b2 + 4} />
      <Sparks at={TL.b2 + 30} x={540} y={680} n={26} />
    </AbsoluteFill>
  );
};

const Finale3D: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: d } = useVideoConfig();
  const u = interpolate(f, [0, d - 1], [0, 1], { ...clamp, easing: smooth });
  const ph = interpolate(u, [0, 1], [0.75, 0.12]), D = interpolate(u, [0, 1], [11.5, 16.5]);
  const flash = (at: number) => interpolate(f, [at, at + 2, at + 7], [0, 1, 0], clamp);
  const hl = 1 + 3.5 * Math.max(flash(16), flash(26));
  return (
    <AbsoluteFill>
      <Canvas fov={42}>
        <Cam pos={[Math.sin(ph) * D, interpolate(u, [0, 1], [0.9, 2.4]), 2.5 + Math.cos(ph) * D]} look={[0, interpolate(u, [0, 1], [1.4, 3.4]), 2.5]} />
        <LakeWorld>
          <Car3D spec={SPECS.bmw5} position={[0, 0.04, 2.5]} rotY={-0.35} lights={hl} />
        </LakeWorld>
      </Canvas>
      <Flash at={16} peak={0.22} />
      <Flash at={26} peak={0.22} />
      <LightLeak at={40} dur={70} strength={0.45} />
      <GoldDust count={20} opacity={0.5} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, fontFamily: SANS }}>
        <Kinetic text="Worauf wartest du?" at={4} size={92} />
        <div style={{ opacity: rise(f, 40), translate: `0px ${(1 - rise(f, 40)) * 20}px`, marginTop: 18, textAlign: "center", fontWeight: 600, fontSize: 48, color: GOLD, letterSpacing: "0.04em", textShadow: shadow }}>Jetzt Mietwagen buchen</div>
      </div>
      <Note />
    </AbsoluteFill>
  );
};

const EndCard3D: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = 1 + 0.035 * Math.sin(f / 4.5);
  const pop = (a: number) => interpolate(f, [a, a + 12], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  const shine = interpolate(f, [30, 58], [-30, 130], clamp);
  const ring = f > 24 && f < 44 ? Math.sin(f * 2.4) * 10 * (1 - (f - 24) / 20) : 0;
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: "#fff" }}>
      <AbsoluteFill style={{ filter: "blur(12px) brightness(0.36)", scale: 1.08 }}>
        <Canvas fov={42}>
          <Cam pos={[interpolate(f, [0, 200], [-3, 3]), 4, 26]} look={[0, 7, -60]} />
          <LakeWorld />
        </Canvas>
      </AbsoluteFill>
      <GoldDust count={30} opacity={0.6} />
      <AbsoluteFill style={{ alignItems: "center", textAlign: "center", paddingTop: 300 }}>
        <div style={{ width: 140 * rise(f, 2), height: 3, background: GOLD }} />
        <div style={{ marginTop: 34 }}>
          <Kinetic text="AUTOVERMIETUNG" at={4} size={84} stagger={0} />
          <Kinetic text="AM TEGERNSEE" at={9} size={84} stagger={3} />
        </div>
        <div style={{ opacity: rise(f, 16), marginTop: 18, fontWeight: 500, fontSize: 44, color: GOLD }}>Dein Mietwagen. Deine Freiheit.</div>
        <div style={{ scale: 0.6 + 0.4 * pop(22), opacity: Math.min(1, pop(22) * 2), marginTop: 90, display: "flex", alignItems: "center", gap: 22, position: "relative" }}>
          <svg width="62" height="62" viewBox="0 0 24 24" style={{ rotate: `${ring}deg` }}><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z" fill={GOLD} /></svg>
          <div style={{ fontWeight: 800, fontSize: 86, letterSpacing: "0.02em", backgroundImage: `linear-gradient(105deg, #fff ${shine - 12}%, ${GOLD} ${shine}%, #fff ${shine + 12}%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.6))" }}>08022 915 20 33</div>
        </div>
        <div style={{ opacity: rise(f, 34), translate: `0px ${(1 - rise(f, 34)) * 18}px`, marginTop: 46, fontWeight: 500, fontSize: 40, lineHeight: 1.35, color: "#e9e9e9" }}>Sanktjohanserstraße 19<br />83707 Bad Wiessee</div>
        <div style={{ opacity: rise(f, 40), translate: `0px ${(1 - rise(f, 40)) * 18}px`, marginTop: 26, fontWeight: 600, fontSize: 42 }}>autovermietungamtegernsee.de</div>
        <div style={{ opacity: Math.min(1, pop(48) * 2), scale: (0.7 + 0.3 * pop(48)) * pulse, marginTop: 70, padding: "28px 50px", borderRadius: 999, background: GOLD, color: "#16120a", fontWeight: 800, fontSize: 40, boxShadow: `0 0 ${30 + 20 * Math.sin(f / 4.5)}px rgba(227,194,122,0.55)` }}>Jetzt anrufen und Wunschauto reservieren!</div>
      </AbsoluteFill>
      <Sparks at={24} x={540} y={760} n={28} />
      <Flash at={0} peak={0.5} />
    </AbsoluteFill>
  );
};

// captions: active word pops in gold
const Captions3D: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const g = (captions as Group[]).find((c) => t >= c.start && t < c.end);
  if (!g) return null;
  const a = interpolate(t, [g.start, g.start + 0.1, g.end - 0.08, g.end], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ top: 1560, height: 170, alignItems: "center", fontFamily: SANS }}>
      <div style={{ opacity: a, translate: `0px ${(1 - a) * 12}px`, width: 900, textAlign: "center", fontWeight: 800, fontSize: 48, lineHeight: 1.2, color: "#fff", textShadow: "0 3px 14px rgba(0,0,0,0.95)" }}>
        {g.words.map((w, i) => {
          const on = t >= w.s && t < w.e + 0.08;
          const p = interpolate(t, [w.s, w.s + 0.12], [0, 1], clamp);
          return <span key={i} style={{ display: "inline-block", marginRight: 12, color: on ? GOLD : t >= w.s ? "#fff" : "rgba(255,255,255,0.55)", scale: on ? 1 + 0.12 * (1 - Math.abs(p * 2 - 1)) + 0.04 : 1 }}>{w.t}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const FLEET: { car: keyof typeof SPECS; brand: string; model: string }[] = [
  { car: "bmw5", brand: "BMW", model: "540d" },
  { car: "x5", brand: "BMW", model: "X5" },
  { car: "x3", brand: "BMW", model: "X3" },
  { car: "glc", brand: "Mercedes-Benz", model: "GLC 4Matic" },
  { car: "golf", brand: "Volkswagen", model: "Golf 8 R-Line" },
  { car: "troc", brand: "Volkswagen", model: "T-Roc" },
];
const PRICES: { car: keyof typeof SPECS; model: string; price: number }[] = [
  { car: "golf", model: "VW Golf 8 R-Line", price: 99 },
  { car: "troc", model: "VW T-Roc", price: 99 },
  { car: "glc", model: "Mercedes-Benz GLC", price: 109 },
  { car: "bmw5", model: "BMW 540d", price: 135 },
];

export const DURATION_3D = TL.total;

export const Spot3D: React.FC = () => {
  const { fps } = useVideoConfig();
  const split = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => Math.round(a + ((b - a) * i) / n));
  const fl = split(TL.fleet, TL.price, FLEET.length), pr = split(TL.price, TL.benefits, PRICES.length);
  const cuts = [...fl.slice(0, -1), ...pr.slice(0, -1), TL.benefits, TL.finale, TL.end];
  const landings = pr.slice(0, -1).map((p) => p + 20);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0d10" }}>
      <Sequence name="Einstieg" from={0} durationInFrames={TL.fleet}><Shot whip={false}><Opening3D /></Shot></Sequence>
      {FLEET.map((c, i) => (
        <Sequence key={c.model} name={`Flotte ${c.model}`} from={fl[i]} durationInFrames={fl[i + 1] - fl[i]}>
          <Shot dir={i % 2 ? -1 : 1}><Turntable car={c.car} dir={i % 2 ? -1 : 1} /><Sweep at={9} /><GoldDust count={10} opacity={0.35} /><ModelLabel brand={c.brand} model={c.model} /><Note /></Shot>
        </Sequence>
      ))}
      {PRICES.map((c, i) => (
        <Sequence key={`p${c.model}`} name={`Preis ${c.model}`} from={pr[i]} durationInFrames={pr[i + 1] - pr[i]}>
          <Shot dir={i % 2 ? -1 : 1}>
            <Punch amount={0} shakeAt={20}><Turntable car={c.car} dir={i % 2 ? -1 : 1} low /></Punch>
            <GoldDust count={10} opacity={0.35} />
            <CountPrice price={c.price} model={c.model} />
            <Sparks at={20} x={560} y={300} />
            <Flash at={20} peak={0.18} />
            <Note />
          </Shot>
        </Sequence>
      ))}
      <Sequence name="Vorteile" from={TL.benefits} durationInFrames={TL.finale - TL.benefits}><Shot><Benefits3D /></Shot></Sequence>
      <Sequence name="Finale" from={TL.finale} durationInFrames={TL.end - TL.finale}><Shot><Finale3D /></Shot></Sequence>
      <Sequence name="Endkarte" from={TL.end} durationInFrames={TL.total - TL.end}><Shot whip={false}><EndCard3D /></Shot></Sequence>
      <Sequence name="Untertitel" from={0} durationInFrames={TL.end} layout="none"><Captions3D /></Sequence>

      <Audio src={staticFile("voice3d.mp3")} />
      <Audio src={staticFile("music.mp3")} volume={(f) => interpolate(f, [0, 20, TL.end - 30, TL.end, TL.total - 30, TL.total], [0, 0.22, 0.22, 0.34, 0.3, 0], clamp)} />
      <Sequence name="SFX Intro" from={0} durationInFrames={3 * fps}><Audio src={staticFile("whoosh-cinematic.mp3")} volume={0.18} /></Sequence>
      {cuts.map((c, i) => <Sequence key={c} name={`SFX Schnitt ${i + 1}`} from={c - 5} durationInFrames={fps}><Audio src={staticFile("whoosh-short.mp3")} volume={0.12} /></Sequence>)}
      {landings.map((c) => <Sequence key={`l${c}`} name="SFX Preis" from={c} durationInFrames={2 * fps}><Audio src={staticFile("chime.mp3")} volume={0.16} /></Sequence>)}
      {[TL.b1, TL.b2, TL.b3].map((c) => <Sequence key={`b${c}`} name="SFX Vorteil" from={TL.benefits + c} durationInFrames={fps}><Audio src={staticFile("pop.mp3")} volume={0.22} /></Sequence>)}
      <Sequence name="SFX Pin" from={TL.benefits + 34} durationInFrames={fps}><Audio src={staticFile("impact-bass-1.mp3")} volume={0.12} /></Sequence>
      <Sequence name="SFX Unendlich" from={TL.benefits + TL.b2 + 30} durationInFrames={2 * fps}><Audio src={staticFile("sparkle.mp3")} volume={0.2} /></Sequence>
      <Sequence name="SFX Lichthupe" from={TL.finale + 16} durationInFrames={fps}><Audio src={staticFile("click-soft.mp3")} volume={0.3} /></Sequence>
      <Sequence name="SFX Riser" from={TL.end - 45} durationInFrames={2 * fps}><Audio src={staticFile("riser.mp3")} volume={0.14} /></Sequence>
      <Sequence name="SFX Endkarte" from={TL.end} durationInFrames={2 * fps}><Audio src={staticFile("impact-bass-1.mp3")} volume={0.28} /></Sequence>
      <Sequence name="SFX Nummer" from={TL.end + 24} durationInFrames={2 * fps}><Audio src={staticFile("sparkle.mp3")} volume={0.14} /></Sequence>
    </AbsoluteFill>
  );
};
