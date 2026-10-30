import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { mixHex, noise3, rng, useCanvasTex } from "./common";
import { Hand } from "./Hand";

// Room layout (metres): x -2.2..2.2, z -3.5 (far wall, door) .. 2.4 (headboard wall), y 0..2.6
// Bed: head at +z, foot at -z. Window with blinds on the left wall (x = -2.2).
export const BED = { x: 0.2, top: 0.56, head: 1.7, foot: -0.3, halfW: 0.8 };
export const HIP: [number, number, number] = [0.2, 0.62, 0.5];
export const HAND_POS: [number, number, number] = [0.74, 0.0, 0.72];

const smax = (a: number, b: number, k: number) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };
const bump = (x: number, z: number, cx: number, cz: number, rx: number, rz: number, h: number) => {
  const d = ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2;
  return d >= 1 ? 0 : h * Math.sqrt(1 - d);
};
// blanket height over the bed, body shape underneath; torso bump shrinks when sitting up
export const blanketHeight = (x: number, z: number, sit = 0) => {
  const base = BED.top + 0.035;
  let b = 0;
  b = smax(b, bump(x, z, BED.x, 0.92, 0.3, 0.38, 0.19 * (1 - sit)), 0.08);
  b = smax(b, bump(x, z, BED.x, 0.45, 0.27, 0.28, 0.16), 0.08);
  b = smax(b, bump(x, z, BED.x - 0.11, -0.05, 0.11, 0.48, 0.11), 0.06);
  b = smax(b, bump(x, z, BED.x + 0.11, -0.05, 0.11, 0.48, 0.11), 0.06);
  b = smax(b, bump(x, z, BED.x - 0.1, -0.3, 0.08, 0.1, 0.15), 0.05);
  b = smax(b, bump(x, z, BED.x + 0.12, -0.3, 0.08, 0.1, 0.15), 0.05);
  let h = base + b + 0.012 * noise3(x * 6, z * 6, 1) + 0.006 * noise3(x * 17, z * 17, 2);
  const ex = Math.abs(x - BED.x) - BED.halfW, ez = BED.foot - z;
  const over = Math.max(ex, ez, 0);
  if (over > 0) h = Math.max(0.22, base - over * 3.2 - over * over * 4) + 0.01 * noise3(x * 9, z * 9, 3);
  return h;
};

const Blanket: React.FC<{ sit: number }> = ({ sit }) => {
  const geo = useMemo(() => {
    const x0 = BED.x - BED.halfW - 0.18, x1 = BED.x + BED.halfW + 0.18, z0 = BED.foot - 0.2, z1 = 1.18;
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, 150, 150);
    g.rotateX(-Math.PI / 2);
    g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
    return g;
  }, []);
  useMemo(() => {
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      let h = blanketHeight(x, z, sit);
      if (z > 1.08) h += (z - 1.08) * 0.6; // folded top edge
      p.setY(i, h);
    }
    p.needsUpdate = true; geo.computeVertexNormals();
  }, [geo, sit]);
  return <mesh geometry={geo} castShadow receiveShadow><meshStandardMaterial color="#c9ced8" roughness={0.92} side={THREE.DoubleSide} /></mesh>;
};

// blinds stripes, used as light cookie for the moon and as the window look
const useStripes = () => useCanvasTex(128, 1024, (g) => {
  g.fillStyle = "#000"; g.fillRect(0, 0, 128, 1024);
  g.filter = "blur(5px)"; g.fillStyle = "#fff";
  for (let i = 0; i < 20; i++) g.fillRect(-10, 60 + i * 46, 148, 23);
  g.filter = "none";
  const v = g.createRadialGradient(64, 512, 100, 64, 512, 620); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,1)");
  g.fillStyle = v; g.fillRect(0, 0, 128, 1024);
}, []);

const MoonLight: React.FC<{ dawn: number }> = ({ dawn }) => {
  const stripes = useStripes();
  const light = useMemo(() => {
    const l = new THREE.SpotLight("#9db8ff", 30, 12, 0.42, 0.35, 0);
    l.position.set(-3.6, 2.7, 0.75);
    l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.0004; l.shadow.radius = 3;
    l.map = stripes;
    l.target.position.set(0.5, 0.4, 0.55);
    return l;
  }, [stripes]);
  light.color.set(mixHex("#8fb0ff", "#ffb36b", dawn));
  light.intensity = 16 + 34 * dawn;
  return (<><primitive object={light} /><primitive object={light.target} /></>);
};

// faint volumetric beam with dust from the window
const Beam: React.FC<{ dawn: number; t: number }> = ({ dawn, t }) => {
  const geo = useMemo(() => {
    const from = new THREE.Vector3(-3.6, 2.7, 0.75), dir = new THREE.Vector3(0.5, 0.4, 0.55).sub(from).normalize();
    const near = [[-2.18, 0.95, 0.25], [-2.18, 2.05, 0.25], [-2.18, 2.05, 1.35], [-2.18, 0.95, 1.35]].map((p) => new THREE.Vector3(...(p as [number, number, number])));
    const far = near.map((p) => { const d = p.clone().sub(from).normalize(); return p.clone().add(d.multiplyScalar(3.6)); });
    void dir;
    const pos: number[] = [], uv: number[] = [];
    for (let k = 0; k < 4; k++) {
      const a = near[k], b = near[(k + 1) % 4], c = far[(k + 1) % 4], d = far[k];
      [a, b, c, a, c, d].forEach((v) => pos.push(v.x, v.y, v.z));
      uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    return g;
  }, []);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { col: { value: new THREE.Color() }, amt: { value: 0.05 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform vec3 col; uniform float amt; varying vec2 vUv; void main(){ float s=smoothstep(0.35,0.6,fract(vUv.x*13.0)); float f=(1.0-vUv.y)*smoothstep(0.0,0.1,vUv.y); gl_FragColor=vec4(col*amt*s*f,1.0); }",
  }), []);
  mat.uniforms.col.value.set(mixHex("#7f9ee8", "#ffb070", dawn));
  mat.uniforms.amt.value = 0.06 + 0.1 * dawn;
  const dust = useMemo(() => { const r = rng(5); return Array.from({ length: 140 }, () => [-1.9 + r() * 2.4, 0.5 + r() * 1.8, 0.1 + r() * 1.4, r()] as [number, number, number, number]); }, []);
  const dustGeo = useMemo(() => new THREE.BufferGeometry(), []);
  const arr = new Float32Array(dust.length * 3);
  dust.forEach(([x, y, z, s], i) => { arr[i * 3] = x + Math.sin(t * 0.3 + s * 9) * 0.08; arr[i * 3 + 1] = y + Math.sin(t * 0.2 + s * 5) * 0.06; arr[i * 3 + 2] = z + Math.cos(t * 0.25 + s * 7) * 0.08; });
  dustGeo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  return (
    <>
      <mesh geometry={geo} material={mat} />
      <points geometry={dustGeo}><pointsMaterial size={0.008} color={mixHex("#c7d6ff", "#ffd7a8", dawn)} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
    </>
  );
};

const Clock: React.FC = () => {
  const tex = useCanvasTex(256, 96, (g) => {
    g.fillStyle = "#050505"; g.fillRect(0, 0, 256, 96);
    g.fillStyle = "#ff2a1f"; g.shadowColor = "#ff2a1f"; g.shadowBlur = 14;
    g.font = "bold 70px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("03:12", 128, 50);
  }, []);
  return (
    <group position={[1.38, 0.62, 1.55]} rotation={[0, -2.6, 0]}>
      <mesh castShadow><boxGeometry args={[0.2, 0.08, 0.07]} /><meshStandardMaterial color="#111" roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.0355]}><planeGeometry args={[0.18, 0.065]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      <pointLight position={[0, 0.02, 0.15]} color="#ff2a1f" intensity={0.05} distance={1.2} decay={2} />
    </group>
  );
};

// a person: torso, arms, neck, head; lying when sit=0, upright when sit=1. Face looks along local -z.
export const Sleeper: React.FC<{ sit: number; breathe: number }> = ({ sit, breathe }) => {
  const skin = <meshPhysicalMaterial color="#a77f6a" roughness={0.62} sheen={0.4} sheenColor="#ffcab0" />;
  const shirt = <meshStandardMaterial color="#2c3038" roughness={0.9} />;
  const a = Math.PI / 2 * (1 - sit) + 0.12 * sit;
  const sh = 1 + breathe * 0.025;
  return (
    <group position={HIP} rotation={[a, 0, 0]}>
      <mesh position={[0, 0.27, 0]} scale={[1.3 * sh, 1, 0.72 * sh]} castShadow><capsuleGeometry args={[0.15, 0.3, 8, 20]} />{shirt}</mesh>
      {[1, -1].map((s) => (
        <group key={s} position={[s * 0.21, 0.45 + breathe * 0.01, 0]} rotation={[0.05 - 0.25 * sit, 0, s * 0.12]}>
          <mesh position={[0, -0.15, 0]} castShadow><capsuleGeometry args={[0.048, 0.24, 6, 12]} />{shirt}</mesh>
          <mesh position={[0, -0.4, -0.06 * sit]} rotation={[-0.6 * sit, 0, 0]} castShadow><capsuleGeometry args={[0.04, 0.22, 6, 12]} />{skin}</mesh>
        </group>
      ))}
      <mesh position={[0, 0.55, 0.0]} castShadow><cylinderGeometry args={[0.048, 0.055, 0.12, 16]} />{skin}</mesh>
      <group position={[0, 0.69, 0.01]}>
        <mesh scale={[0.9, 1.06, 1.06]} castShadow><sphereGeometry args={[0.1, 32, 24]} />{skin}</mesh>
        <mesh position={[0, 0.025, 0.018]} scale={[0.95, 1.0, 1.02]} castShadow><sphereGeometry args={[0.104, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} /><meshStandardMaterial color="#1c140f" roughness={0.75} /></mesh>
        <mesh position={[0, -0.005, -0.104]} rotation={[-Math.PI / 2 - 0.25, 0, 0]} castShadow><coneGeometry args={[0.016, 0.04, 12]} />{skin}</mesh>
        <mesh position={[0, -0.07, -0.06]} scale={[1, 0.7, 1]} castShadow><sphereGeometry args={[0.05, 20, 16]} />{skin}</mesh>
        {[1, -1].map((s) => <mesh key={s} position={[s * 0.093, -0.005, 0.005]} scale={[0.4, 1, 0.7]}><sphereGeometry args={[0.03, 12, 10]} />{skin}</mesh>)}
      </group>
    </group>
  );
};

// the shadow figure: soft-edged tall silhouette on a camera-facing plane
export const useFigureTex = () => useCanvasTex(256, 640, (g) => {
  g.filter = "blur(7px)";
  g.fillStyle = "#000";
  g.beginPath(); g.ellipse(128, 92, 42, 54, 0, 0, Math.PI * 2); g.fill();
  g.beginPath();
  g.moveTo(108, 140); g.bezierCurveTo(60, 160, 36, 200, 40, 300); g.bezierCurveTo(42, 420, 70, 520, 76, 640);
  g.lineTo(180, 640); g.bezierCurveTo(186, 520, 214, 420, 216, 300); g.bezierCurveTo(220, 200, 196, 160, 148, 140); g.closePath(); g.fill();
}, []);

export const Figure: React.FC<{ pos: [number, number, number]; opacity: number; t: number; scale?: number }> = ({ pos, opacity, t, scale = 1 }) => {
  const tex = useFigureTex();
  const { camera } = useThree();
  if (opacity <= 0.001) return null;
  const flick = 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7.3);
  return (
    <mesh position={pos} quaternion={camera.quaternion} scale={[0.75 * scale, 1.9 * scale, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity * flick} depthWrite={false} color="#000" />
    </mesh>
  );
};

export type RoomProps = { exposure?: number; fill?: number; showSleeper?: boolean; showHand?: boolean; dawn?: number; sit?: number; breathe?: number; t: number; figure?: { pos: [number, number, number]; opacity: number; scale?: number }; finger?: number; tremor?: number; grip?: number; fogDensity?: number };

export const Bedroom: React.FC<RoomProps> = ({ exposure = 1, fill = 1, showSleeper = true, showHand = true, dawn = 0, sit = 0, breathe = 0, t, figure, finger = 0, tremor = 0, grip = 0, fogDensity = 0.09 }) => {
  const { scene, gl } = useThree();
  gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.toneMappingExposure = exposure;
  const fogCol = mixHex("#04060b", "#2a1a12", dawn);
  if (!(scene.fog instanceof THREE.FogExp2)) scene.fog = new THREE.FogExp2(fogCol, fogDensity);
  (scene.fog as THREE.FogExp2).color.set(fogCol); (scene.fog as THREE.FogExp2).density = fogDensity;
  scene.background = new THREE.Color(fogCol);
  const wall = <meshStandardMaterial color={mixHex("#4a5160", "#6b5a50", dawn)} roughness={0.95} />;
  const slats = useMemo(() => Array.from({ length: 14 }, (_, i) => 0.98 + i * 0.077), []);
  const glowTex = useCanvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(140,160,200,0.55)"); gr.addColorStop(0.5, "rgba(80,95,130,0.15)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }, []);
  return (
    <>
      <hemisphereLight args={[mixHex("#2a3a5e", "#ffcf9e", dawn), "#07080b", (0.45 - 0.37 * dawn) * fill]} />
      <MoonLight dawn={dawn} />
      <Beam dawn={dawn} t={t} />
      {/* floor, walls, ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[4.4, 5.9]} /><meshStandardMaterial color="#3a2b20" roughness={0.65} /></mesh>
      <mesh position={[0, 2.6, -0.55]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[4.4, 5.9]} />{wall}</mesh>
      <mesh position={[0, 1.3, -3.5]} receiveShadow><planeGeometry args={[4.4, 2.6]} />{wall}</mesh>
      <mesh position={[0, 1.3, 2.4]} rotation={[0, Math.PI, 0]} receiveShadow><planeGeometry args={[4.4, 2.6]} />{wall}</mesh>
      <mesh position={[2.2, 1.3, -0.55]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><planeGeometry args={[5.9, 2.6]} />{wall}</mesh>
      {/* left wall with window opening (built from 4 pieces) */}
      <group position={[-2.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[-1.875, 1.3, 0]} receiveShadow><planeGeometry args={[1.05, 2.6]} />{wall}</mesh>
        <mesh position={[1.625, 1.3, 0]} receiveShadow><planeGeometry args={[3.75, 2.6]} />{wall}</mesh>
        <mesh position={[-0.8, 0.475, 0]} receiveShadow><planeGeometry args={[1.1, 0.95]} />{wall}</mesh>
        <mesh position={[-0.8, 2.35, 0]} receiveShadow><planeGeometry args={[1.1, 0.5]} />{wall}</mesh>
      </group>
      {/* night/dawn sky behind the window + blinds */}
      <mesh position={[-2.6, 1.5, 0.8]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[2.5, 2]} /><meshBasicMaterial color={mixHex("#3a5488", "#fff0d8", dawn)} toneMapped={false} /></mesh>
      {slats.map((y) => <mesh key={y} position={[-2.16, y, 0.8]} rotation={[0.5, 0, 0]} castShadow><boxGeometry args={[0.01, 0.05, 1.12]} /><meshStandardMaterial color="#cfd2d6" roughness={0.6} /></mesh>)}
      {/* door, ajar, with a faint hallway light gap */}
      <mesh position={[1.32, 1.02, -3.52]}><planeGeometry args={[0.9, 2.04]} /><meshBasicMaterial color={mixHex("#56637d", "#3a2f27", dawn)} toneMapped={false} /></mesh>
      <mesh position={[1.25, 1.1, -3.3]}><planeGeometry args={[2.6, 3.2]} /><meshBasicMaterial map={glowTex} transparent opacity={0.55 * (1 - dawn)} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      <pointLight position={[1.3, 1.6, -3.9]} color="#8fa3c9" intensity={1.6 * (1 - dawn)} distance={5} decay={1.5} />
      <group position={[0.87, 0, -3.48]} rotation={[0, 1.15, 0]}>
        <mesh position={[0.43, 1.02, 0]} castShadow receiveShadow><boxGeometry args={[0.86, 2.02, 0.04]} /><meshStandardMaterial color="#5a5d63" roughness={0.7} /></mesh>
        <mesh position={[0.78, 1.0, 0.04]}><sphereGeometry args={[0.025, 12, 10]} /><meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.3} /></mesh>
      </group>
            {/* bed */}
      <mesh position={[BED.x, 0.2, (BED.head + BED.foot) / 2 - 0.05]} castShadow receiveShadow><boxGeometry args={[1.76, 0.3, 2.2]} /><meshStandardMaterial color="#2a1f18" roughness={0.6} /></mesh>
      <mesh position={[BED.x, 0.45, (BED.head + BED.foot) / 2]} castShadow receiveShadow><boxGeometry args={[1.62, 0.22, 2.02]} /><meshStandardMaterial color="#b9bec8" roughness={0.9} /></mesh>
      <mesh position={[BED.x, 0.85, BED.head + 0.12]} castShadow receiveShadow><boxGeometry args={[1.8, 1.1, 0.08]} /><meshStandardMaterial color="#2a1f18" roughness={0.55} /></mesh>
      <mesh position={[BED.x, 0.64, 1.47]} scale={[0.36, 0.08, 0.2]} castShadow receiveShadow><sphereGeometry args={[1, 32, 16]} /><meshStandardMaterial color="#d6d9df" roughness={0.9} /></mesh>
      <Blanket sit={sit} />
      {showSleeper ? <Sleeper sit={sit} breathe={breathe} /> : null}
      {showHand ? <Hand position={[HAND_POS[0], blanketHeight(HAND_POS[0], HAND_POS[2]) + 0.012, HAND_POS[2]]} rotY={Math.PI / 2} finger={finger} tremor={tremor} grip={grip} t={t} /> : null}
      {/* nightstand + clock */}
      <mesh position={[1.38, 0.29, 1.55]} castShadow receiveShadow><boxGeometry args={[0.45, 0.58, 0.4]} /><meshStandardMaterial color="#2a1f18" roughness={0.6} /></mesh>
      <Clock />
      {figure ? <Figure {...figure} t={t} /> : null}
    </>
  );
};
