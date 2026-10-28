import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { Benefit, Captions, EndCard, GOLD, ModelLabel, PriceTag, SANS, SERIF, Shot, Sweep, clamp, ease, rise, shadow } from "./Spot";
import { Cam, Car3D, Env, SPECS } from "./three/Car3D";
import { Diorama, HOUSE_A, LakeWorld, ShowroomWorld } from "./three/Worlds";

const smooth = Easing.inOut(Easing.cubic);

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

// ---------- 3D scenes ----------
const Opening3D: React.FC = () => {
  const f = useCurrentFrame();
  const u = interpolate(f, [0, 137], [0, 1], { ...clamp, easing: smooth });
  const x = -20 + f * 0.27;
  const s = SPECS.x5;
  const cy = interpolate(u, [0, 1], [1.0, 3.2]), cz = interpolate(u, [0, 1], [13, 19]), cx = interpolate(u, [0, 1], [4.5, 1.5]);
  const ly = interpolate(u, [0, 1], [2.6, 5.2]);
  return (
    <AbsoluteFill>
      <Canvas fov={42}>
        <Cam pos={[x + cx, cy, 3.4 + cz]} look={[x + 0.3, ly, 3.4]} />
        <LakeWorld>
          <Car3D spec={s} position={[x, 0.04, 3.4]} spin={x / s.r} />
        </LakeWorld>
      </Canvas>
      <Sweep at={30} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", color: "#fff", textShadow: shadow }}>
        <div style={{ opacity: rise(f, 4), translate: `0px ${(1 - rise(f, 4)) * 20}px`, fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.05 }}>Dein Mietwagen.</div>
        <div style={{ opacity: rise(f, 16), translate: `0px ${(1 - rise(f, 16)) * 20}px`, fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.05, color: GOLD }}>Dein Tegernsee.</div>
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
  const rot = base + dir * interpolate(u, [0, 1], [-0.28, 0.28]);
  const D = ((s.L * 0.85 + s.W * 0.6) / (2 * 0.142)) * 1.08 * interpolate(u, [0, 1], [1.05, 0.98]);
  const h = low ? 1.3 : 2.4;
  const enter = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: ease });
  return (
    <Canvas fov={28} env={1.15}>
      <Cam pos={[0, h, D]} look={[0, 0.78, 0]} />
      <ShowroomWorld radius={s.L * 0.6}>
        <Car3D spec={s} rotY={rot} lights={enter} />
      </ShowroomWorld>
    </Canvas>
  );
};

const Benefits3D: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ha = HOUSE_A - 0.4, R = 6.95;
  const a = f < 100 ? interpolate(f, [0, 100], [ha - 2.4, ha - 0.32], { ...clamp, easing: Easing.out(Easing.cubic) })
    : f < 140 ? ha - 0.32 : interpolate(f, [140, 284], [ha - 0.32, ha + 4.6], { ...clamp, easing: Easing.in(Easing.quad) });
  const trailFrom = ha - 0.32;
  const trail = f < 4.8 * fps ? 0 : a - trailFrom;
  const th = interpolate(f, [0, 284], [-0.25, 0.55]);
  const s = SPECS.golf;
  return (
    <AbsoluteFill>
      <Canvas fov={44}>
        <Cam pos={[Math.sin(th) * 27, 15, Math.cos(th) * 27]} look={[0, 2.2, 0]} />
        <Diorama trail={trail} trailStart={trailFrom - Math.PI / 2} pin={interpolate(f, [16, 40], [0, 1], clamp) + (f > 40 ? (f - 40) / 120 : 0)} people={interpolate(f, [6.2 * fps, 6.2 * fps + 14], [0, 1], clamp)}>
          <Car3D spec={s} scale={0.62} position={[Math.sin(a) * R, 0.04, Math.cos(a) * R]} rotY={a} spin={(a * R) / (s.r * 0.62)} />
        </Diorama>
      </Canvas>
      <div style={{ position: "absolute", left: 80, right: 60, top: 165, fontFamily: SANS, textShadow: shadow }}>
        <Benefit text="Kostenlose Zustellung rund um den Tegernsee" at={0.4 * fps} idx={0} />
        <Benefit text="Unbegrenzte Kilometer" at={4.8 * fps} idx={1} />
        <Benefit text="Zusatzfahrer inklusive" at={6.2 * fps} idx={2} />
      </div>
    </AbsoluteFill>
  );
};

const Finale3D: React.FC = () => {
  const f = useCurrentFrame();
  const u = interpolate(f, [0, 176], [0, 1], { ...clamp, easing: smooth });
  const ph = interpolate(u, [0, 1], [0.6, 0.15]), D = interpolate(u, [0, 1], [13, 16.5]);
  return (
    <AbsoluteFill>
      <Canvas fov={42}>
        <Cam pos={[Math.sin(ph) * D, interpolate(u, [0, 1], [1.1, 2.4]), 2.5 + Math.cos(ph) * D]} look={[0, interpolate(u, [0, 1], [1.6, 3.4]), 2.5]} />
        <LakeWorld>
          <Car3D spec={SPECS.bmw5} position={[0, 0.04, 2.5]} rotY={-0.35} />
        </LakeWorld>
      </Canvas>
      <Sweep at={20} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", color: "#fff", textShadow: shadow, fontFamily: SANS }}>
        <div style={{ opacity: rise(f, 6), fontFamily: SERIF, fontWeight: 700, fontSize: 92, lineHeight: 1.05 }}>Worauf wartest du?</div>
        <div style={{ opacity: rise(f, 40), marginTop: 22, fontWeight: 600, fontSize: 48, color: GOLD, letterSpacing: "0.04em" }}>Jetzt Mietwagen buchen</div>
      </div>
      <Note />
    </AbsoluteFill>
  );
};

const EndBg: React.FC = () => (
  <AbsoluteFill style={{ filter: "blur(14px) brightness(0.34)", scale: 1.08 }}>
    <Canvas fov={42}>
      <Cam pos={[0, 4, 26]} look={[0, 7, -60]} />
      <LakeWorld />
    </Canvas>
  </AbsoluteFill>
);

const FLEET: { car: keyof typeof SPECS; brand: string; model: string }[] = [
  { car: "bmw5", brand: "BMW", model: "540d" },
  { car: "x5", brand: "BMW", model: "X5" },
  { car: "x3", brand: "BMW", model: "X3" },
  { car: "glc", brand: "Mercedes-Benz", model: "GLC 4Matic" },
  { car: "golf", brand: "Volkswagen", model: "Golf 8 R-Line" },
  { car: "troc", brand: "Volkswagen", model: "T-Roc" },
];
const PRICES: { car: keyof typeof SPECS; model: string; price: string }[] = [
  { car: "golf", model: "VW Golf 8 R-Line", price: "99" },
  { car: "troc", model: "VW T-Roc", price: "99" },
  { car: "glc", model: "Mercedes-Benz GLC", price: "109" },
  { car: "bmw5", model: "BMW 540d", price: "135" },
];

export const Spot3D: React.FC = () => {
  const { fps } = useVideoConfig();
  const fleetStart = 138, fleetLen = 48, priceStart = 426, priceLen = 51;
  const cuts = [138, ...FLEET.map((_, i) => fleetStart + i * fleetLen).slice(1), priceStart, ...PRICES.map((_, i) => priceStart + i * priceLen).slice(1), 630, 915, 1092];
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0d10" }}>
      <Sequence name="Einstieg" from={0} durationInFrames={138}><Shot whip={false}><Opening3D /></Shot></Sequence>
      {FLEET.map((c, i) => (
        <Sequence key={c.model} name={`Flotte ${c.model}`} from={fleetStart + i * fleetLen} durationInFrames={fleetLen}>
          <Shot dir={i % 2 ? -1 : 1}><Turntable car={c.car} dir={i % 2 ? -1 : 1} /><ModelLabel brand={c.brand} model={c.model} /><Note /></Shot>
        </Sequence>
      ))}
      {PRICES.map((c, i) => (
        <Sequence key={`p${c.model}`} name={`Preis ${c.model}`} from={priceStart + i * priceLen} durationInFrames={priceLen}>
          <Shot dir={i % 2 ? -1 : 1}><Turntable car={c.car} dir={i % 2 ? -1 : 1} low /><PriceTag price={c.price} model={c.model} /><Note /></Shot>
        </Sequence>
      ))}
      <Sequence name="Vorteile" from={630} durationInFrames={285}><Shot><Benefits3D /></Shot></Sequence>
      <Sequence name="Finale" from={915} durationInFrames={177}><Shot><Finale3D /></Shot></Sequence>
      <Sequence name="Endkarte" from={1092} durationInFrames={228}><Shot whip={false}><EndCard bg={<EndBg />} /></Shot></Sequence>
      <Sequence name="Untertitel" from={0} durationInFrames={1092} layout="none"><Captions /></Sequence>

      <Sequence name="Stimme" from={9} durationInFrames={40 * fps}><Audio src={staticFile("voice.mp3")} /></Sequence>
      <Audio src={staticFile("music.mp3")} volume={0.22} />
      {cuts.map((c, i) => <Sequence key={c} name={`SFX Schnitt ${i + 1}`} from={c - 5} durationInFrames={fps}><Audio src={staticFile("whoosh-short.mp3")} volume={0.1} /></Sequence>)}
      {[630 + 12, 630 + 144, 630 + 186].map((c, i) => <Sequence key={`b${c}`} name={`SFX Vorteil ${i + 1}`} from={c} durationInFrames={fps}><Audio src={staticFile("pop.mp3")} volume={0.22} /></Sequence>)}
      <Sequence name="SFX Preis" from={priceStart + 8} durationInFrames={2 * fps}><Audio src={staticFile("chime.mp3")} volume={0.2} /></Sequence>
      <Sequence name="SFX Endkarte" from={1092} durationInFrames={2 * fps}><Audio src={staticFile("impact-bass-1.mp3")} volume={0.25} /></Sequence>
    </AbsoluteFill>
  );
};
