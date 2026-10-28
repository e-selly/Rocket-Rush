import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

// deterministic pseudo-random
export const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const Mirror: React.FC<{ geo: THREE.BufferGeometry; position: [number, number, number]; color?: number; res?: [number, number] }> = ({ geo, position, color = 0x8a949e, res = [540, 960] }) => {
  const m = useMemo(() => {
    const r = new Reflector(geo, { textureWidth: res[0], textureHeight: res[1], color, clipBias: 0.003 });
    r.rotation.x = -Math.PI / 2;
    return r;
  }, [geo, color, res]);
  m.position.set(...position);
  return <primitive object={m} />;
};

const SkyBg: React.FC<{ stops: [number, string][]; fog?: [string, number, number] }> = ({ stops, fog }) => {
  const { scene } = useThree();
  useMemo(() => {
    const c = document.createElement("canvas"); c.width = 4; c.height = 512;
    const g = c.getContext("2d")!; const gr = g.createLinearGradient(0, 0, 0, 512);
    stops.forEach(([p, col]) => gr.addColorStop(p, col));
    g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    scene.background = t;
    scene.fog = fog ? new THREE.Fog(fog[0], fog[1], fog[2]) : null;
  }, [scene]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

// heightfield ridge: x across, z depth; vertex colours by height
const Ridge: React.FC<{ z0: number; z1: number; peak: number; seed: number; snow?: number; low: string; high: string }> = ({ z0, z1, peak, seed, snow, low, high }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(520, Math.abs(z1 - z0), 260, 50);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, (z0 + z1) / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const cols: number[] = [];
    const cl = new THREE.Color(low), ch = new THREE.Color(high), cs = new THREE.Color("#eef2f6"), tmp = new THREE.Color();
    const ph = seed * 1.7;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const d = (z0 - z) / Math.abs(z1 - z0); // 0 at front edge, 1 at back
      const env = Math.sin(Math.min(1, Math.max(0, d)) * Math.PI) ** 0.8;
      const ridge = 0.62 + 0.22 * Math.sin(x * 0.031 + ph) + 0.12 * Math.sin(x * 0.083 + ph * 2) + 0.06 * Math.sin(x * 0.21 + z * 0.15 + ph);
      const h = Math.max(0, peak * env * ridge);
      p.setY(i, h);
      const k = Math.min(1, h / peak);
      tmp.copy(cl).lerp(ch, k);
      if (snow && h > snow) tmp.lerp(cs, Math.min(1, (h - snow) / 4));
      cols.push(tmp.r, tmp.g, tmp.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    return g;
  }, [z0, z1, peak, seed, snow, low, high]);
  return <mesh geometry={geo}><meshStandardMaterial vertexColors roughness={0.95} /></mesh>;
};

const Tree: React.FC<{ p: [number, number, number]; h: number; kind: 0 | 1 }> = ({ p, h, kind }) => (
  <group position={p}>
    <mesh position={[0, h * 0.15, 0]}><cylinderGeometry args={[0.08 * h / 4, 0.12 * h / 4, h * 0.3, 6]} /><meshStandardMaterial color="#3b2a1d" /></mesh>
    {kind === 0 ? (
      <mesh position={[0, h * 0.6, 0]}><coneGeometry args={[h * 0.24, h * 0.8, 7]} /><meshStandardMaterial color="#1f3d27" flatShading roughness={1} /></mesh>
    ) : (
      <mesh position={[0, h * 0.62, 0]}><icosahedronGeometry args={[h * 0.3, 1]} /><meshStandardMaterial color="#c9772b" flatShading roughness={1} /></mesh>
    )}
  </group>
);

// ---------- the lake (Tegernsee-style: lake, forested hills, alpine peaks, shore road) ----------
export const LakeWorld: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const lakeGeo = useMemo(() => new THREE.PlaneGeometry(520, 150), []);
  const trees = useMemo(() => {
    const r = rng(7); const t: { p: [number, number, number]; h: number; kind: 0 | 1 }[] = [];
    for (let x = -120; x < 120; x += 5 + r() * 6) t.push({ p: [x, 0, -2.6 - r() * 1.2], h: 3 + r() * 3, kind: r() < 0.3 ? 1 : 0 });
    return t;
  }, []);
  const dashes = useMemo(() => Array.from({ length: 60 }, (_, i) => -180 + i * 6), []);
  return (
    <>
      <SkyBg stops={[[0, "#1c3150"], [0.45, "#6f8aa8"], [0.62, "#e9c393"], [0.7, "#f3d3a6"], [1, "#f3d3a6"]]} fog={["#b4c2cf", 110, 380]} />
      <hemisphereLight args={["#c4d6ee", "#3d4a2b", 1.0]} />
      <directionalLight position={[-40, 22, -80]} intensity={2.6} color="#ffd29a" />
      <directionalLight position={[12, 10, 25]} intensity={0.9} color="#fff1df" />
      <Ridge z0={-58} z1={-110} peak={16} seed={1} low="#29432c" high="#3d5a3c" />
      <Ridge z0={-95} z1={-200} peak={58} seed={3} snow={44} low="#3e5560" high="#6f7f8c" />
      <Mirror geo={lakeGeo} position={[0, 0, -78]} color={0x8fa0ad} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -78]}><planeGeometry args={[520, 150]} /><meshBasicMaterial color="#1f4558" transparent opacity={0.28} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 26]}><planeGeometry args={[520, 60]} /><meshStandardMaterial color="#56703a" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, -3.6]}><planeGeometry args={[520, 1.4]} /><meshStandardMaterial color="#8d846f" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 2.5]}><planeGeometry args={[520, 4.2]} /><meshStandardMaterial color="#2a2c30" roughness={0.75} /></mesh>
      {dashes.map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.045, 2.5]}><planeGeometry args={[2.6, 0.12]} /><meshBasicMaterial color="#e9e6dc" /></mesh>)}
      {trees.map((t, i) => <Tree key={i} {...t} />)}
      {children}
    </>
  );
};

// ---------- showroom: dark glossy floor, gold turntable ring, warm backdrop glow ----------
let glowTex: THREE.Texture | null = null;
const glow = () => {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!; const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(227,194,122,0.55)"); gr.addColorStop(0.45, "rgba(150,110,60,0.18)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace; return glowTex;
};

export const ShowroomWorld: React.FC<{ radius: number; children?: React.ReactNode }> = ({ radius, children }) => {
  const floorGeo = useMemo(() => new THREE.CircleGeometry(60, 64), []);
  return (
    <>
      <SkyBg stops={[[0, "#0b0d10"], [0.32, "#1b1e24"], [0.5, "#23262c"], [0.62, "#15171b"], [1, "#0b0d10"]]} fog={["#1d2025", 22, 60]} />
      <hemisphereLight args={["#dfe8ff", "#15130f", 0.8]} />
      <directionalLight position={[5, 9, 7]} intensity={2.8} />
      <directionalLight position={[-6, 4, 6]} intensity={1.2} color="#fff4e2" />
      <directionalLight position={[-4, 5, -9]} intensity={3.2} color="#e8c27e" />
      <directionalLight position={[7, 3, -6]} intensity={1.4} color="#9fb8ff" />
      <mesh position={[0, 2.4, -14]}><planeGeometry args={[30, 14]} /><meshBasicMaterial map={glow()} transparent opacity={0.6} depthWrite={false} fog={false} /></mesh>
      <Mirror geo={floorGeo} position={[0, 0, 0]} color={0x6b6f75} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}><circleGeometry args={[60, 64]} /><meshBasicMaterial color="#0b0d10" transparent opacity={0.8} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}><circleGeometry args={[radius, 96]} /><meshBasicMaterial color="#2a2722" transparent opacity={0.35} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}><ringGeometry args={[radius - 0.035, radius, 128]} /><meshBasicMaterial color="#e3c27a" /></mesh>
      {children}
    </>
  );
};

export const HOUSE_A = 3.6;
// ---------- diorama: round lake, ring road, low-poly peaks, a house with a delivery pin ----------
export const Diorama: React.FC<{ children?: React.ReactNode; trail: number; trailStart: number; pin: number; pinY?: number; ripple?: number; people: number }> = ({ children, trail, trailStart, pin, pinY = 0, ripple = 0, people }) => {
  const lakeGeo = useMemo(() => new THREE.CircleGeometry(5.6, 64), []);
  const peaks = useMemo(() => {
    const r = rng(11); const p: { a: number; d: number; h: number; s: number; c: string }[] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + r() * 0.2;
      if (Math.abs(a - HOUSE_A) < 0.55) continue; // keep the view to the house open
      p.push({ a, d: 10 + r() * 1.8, h: 2.4 + r() * 3.2, s: 1.4 + r() * 1.1, c: r() < 0.5 ? "#3e5a48" : "#56707a" });
    }
    return p;
  }, []);
  const trees = useMemo(() => {
    const r = rng(23); const t: { p: [number, number, number]; h: number; kind: 0 | 1 }[] = [];
    for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2; const d = 8.2 + r() * 1.6; if (Math.abs(a - HOUSE_A) < 0.35 && d < 9.4) continue; t.push({ p: [Math.sin(a) * d, 0, Math.cos(a) * d], h: 0.7 + r() * 0.6, kind: r() < 0.3 ? 1 : 0 }); }
    for (let i = 0; i < 14; i++) { const a = r() * Math.PI * 2; const d = 5.9 + r() * 0.2; t.push({ p: [Math.sin(a) * d, 0, Math.cos(a) * d], h: 0.5 + r() * 0.4, kind: 0 }); }
    return t;
  }, []);
  const ha = HOUSE_A; // house angle
  return (
    <>
      <color attach="background" args={["#0b0d10"]} />
      <hemisphereLight args={["#dfe8ff", "#2a2418", 0.9]} />
      <directionalLight position={[-8, 14, 6]} intensity={2.4} color="#ffe2b8" />
      <directionalLight position={[6, 6, -10]} intensity={1.6} color="#e3c27a" />
      <mesh position={[0, -0.7, 0]}><cylinderGeometry args={[13, 12.4, 1.4, 96]} /><meshStandardMaterial color="#2a2219" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}><circleGeometry args={[13, 96]} /><meshStandardMaterial color="#55703a" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><circleGeometry args={[6.0, 64]} /><meshStandardMaterial color="#9a8f76" roughness={1} /></mesh>
      <Mirror geo={lakeGeo} position={[0, 0.02, 0]} color={0x7f97a6} res={[512, 512]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><circleGeometry args={[5.6, 64]} /><meshBasicMaterial color="#3f7f98" transparent opacity={0.55} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><ringGeometry args={[6.4, 7.5, 128]} /><meshStandardMaterial color="#2a2c30" roughness={0.8} /></mesh>
      {/* gold driven-distance trail: keeps growing (unlimited km) */}
      {trail > 0.001 ? (
        <mesh rotation={[-Math.PI / 2, 0, trailStart]} position={[0, 0.05, 0]}>
          <ringGeometry args={[6.9, 7.0, 160, 1, 0, Math.min(Math.PI * 2, trail)]} />
          <meshBasicMaterial color="#e3c27a" />
        </mesh>
      ) : null}
      {peaks.map((p, i) => (
        <group key={i} position={[Math.sin(p.a) * p.d, 0, Math.cos(p.a) * p.d]}>
          <mesh position={[0, p.h / 2, 0]}><coneGeometry args={[p.s * 1.5, p.h, 7]} /><meshStandardMaterial color={p.c} flatShading roughness={1} /></mesh>
          {p.h > 4 ? <mesh position={[0, p.h * 0.86, 0]}><coneGeometry args={[p.s * 1.5 * 0.28, p.h * 0.28, 7]} /><meshStandardMaterial color="#eef2f6" flatShading /></mesh> : null}
        </group>
      ))}
      {trees.map((t, i) => <Tree key={i} {...t} />)}
      {/* house + delivery pin */}
      <group position={[Math.sin(ha) * 8.6, 0, Math.cos(ha) * 8.6]} rotation={[0, ha, 0]}>
        <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.5, 0.9, 1.1]} /><meshStandardMaterial color="#efe6d6" /></mesh>
        <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.12, 0.6, 4]} /><meshStandardMaterial color="#6b3a26" flatShading /></mesh>
        {ripple > 0 && ripple < 1 ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} scale={0.6 + ripple * 3.2}>
            <ringGeometry args={[0.9, 1.0, 64]} />
            <meshBasicMaterial color="#e3c27a" transparent opacity={1 - ripple} />
          </mesh>
        ) : null}
        <group position={[0, 2.3 + pinY + Math.sin(pin * 6) * 0.12 * (pin > 1 ? 1 : 0), 0]} scale={pin > 0 ? 1 : 0}>
          <mesh position={[0, 0.35, 0]}><sphereGeometry args={[0.36, 24, 16]} /><meshStandardMaterial color="#e3c27a" emissive="#e3c27a" emissiveIntensity={0.6} metalness={0.4} roughness={0.3} /></mesh>
          <mesh position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.3, 0.6, 20]} /><meshStandardMaterial color="#e3c27a" emissive="#e3c27a" emissiveIntensity={0.6} metalness={0.4} roughness={0.3} /></mesh>
          <mesh position={[0, 0.35, 0.3]}><sphereGeometry args={[0.13, 16, 12]} /><meshStandardMaterial color="#0b0d10" /></mesh>
        </group>
        {/* two drivers (extra driver included) */}
        {[-0.35, 0.35].map((x, i) => (
          <group key={i} position={[x, 0, -0.95]} scale={Math.min(1, Math.max(0, people * 2 - i * 0.6))}>
            <mesh position={[0, 0.32, 0]}><capsuleGeometry args={[0.13, 0.32, 6, 12]} /><meshStandardMaterial color={i ? "#e3c27a" : "#f2efe8"} /></mesh>
            <mesh position={[0, 0.72, 0]}><sphereGeometry args={[0.12, 16, 12]} /><meshStandardMaterial color={i ? "#e3c27a" : "#f2efe8"} /></mesh>
          </group>
        ))}
      </group>
      {children}
    </>
  );
};
