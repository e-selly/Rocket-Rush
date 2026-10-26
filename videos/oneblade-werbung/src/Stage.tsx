import { ThreeCanvas } from "@remotion/three";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Blade, LIME, Studio } from "./Blade";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ss = (f: number, a: number, b: number) => { const u = interpolate(f, [a, b], [0, 1], clamp); return u * u * (3 - 2 * u); };

// One continuous 3D stage; poses are keyed to the scene cuts in frames
export const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = f / 30;

  // single hero blade
  const fresh = ss(f, 64, 84);
  const spin = ss(f, 64, 110) * Math.PI * 2;
  const fan = ss(f, 122, 150) * (1 - ss(f, 238, 258));          // 4-pack fan-out
  const flex = ss(f, 250, 270) * (1 - ss(f, 380, 395));          // 360 tilt demo
  const ph = (f - 250) * 0.09;
  const row = ss(f, 490, 515) * (1 - ss(f, 625, 640));            // 4 blades in a row (months)
  const hero = ss(f, 690, 720);
  const shake = f < 60 ? Math.sin(f * 1.7) * 0.015 : 0;

  const baseY = interpolate(f, [0, 60, 84, 390, 400, 490, 640, 700, 840], [-0.15, -0.1, 0.55, 0.55, 1.15, 1.15, 0.55, 0.45, 0.65], clamp);
  const baseScale = interpolate(f, [0, 60, 120, 390, 400, 640, 700, 840], [0.8, 0.84, 0.78, 0.78, 0.55, 0.55, 0.78, 0.86], clamp) * (1 - row * 0.999);
  const rotX = -0.62 + flex * Math.sin(ph) * 0.42 + hero * 0.1;
  const rotY = spin + t * 0.35 * (1 - flex) + flex * Math.cos(ph) * 0.42;
  const rotZ = -0.12 + flex * Math.sin(ph * 0.5) * 0.12 + shake;

  const pack = [-1.5, -0.5, 0.5, 1.5];
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 9], fov: 32 }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
      <Studio />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 6]} intensity={2.2} />
      <directionalLight position={[-5, -2, 3]} intensity={0.8} color={LIME} />
      <pointLight position={[0, -3, 2]} intensity={6 * fresh} color={LIME} distance={8} />

      {/* main blade (also the centre of the 4-pack) */}
      {fan < 0.999 && row < 0.999 ? (
        <Blade worn={1 - fresh} glow={fresh * (0.4 + hero * 0.6)} position={[0, baseY, 0]} rotation={[rotX, rotY, rotZ]} scale={baseScale * (1 - fan)} />
      ) : null}
      {fan > 0.001 ? pack.map((k, i) => (
        <Blade key={`p${i}`} glow={0.4} position={[k * 0.62 * fan, 0.35 + Math.abs(k) * -0.18 * fan, -Math.abs(k) * 0.3 * fan]}
          rotation={[-0.75, t * 0.25 + k * 0.32 * fan, k * 0.42 * fan]} scale={0.5 + 0.28 * (1 - fan)} />
      )) : null}
      {row > 0.001 ? pack.map((k, i) => (
        <Blade key={`r${i}`} glow={0.5} position={[k * 0.72 * row, 1.55 + (1 - row) * -0.6, 0]} rotation={[-1.1 + Math.sin(t * 2 + i) * 0.05, t * 0.6 + i, 0.0]} scale={0.2 * row} />
      )) : null}

      {/* 360 orbit ring during the flex demo */}
      {flex > 0.01 ? (
        <mesh position={[0, baseY, -0.2]} rotation={[1.1, 0, ph * 0.6]} scale={flex}>
          <torusGeometry args={[2.25, 0.025, 12, 160, Math.PI * 1.75]} />
          <meshStandardMaterial color={LIME} emissive={LIME} emissiveIntensity={1.4} />
        </mesh>
      ) : null}
    </ThreeCanvas>
  );
};
