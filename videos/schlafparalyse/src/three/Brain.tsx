import { useMemo } from "react";
import * as THREE from "three";
import { noise3, rng } from "./common";

// Medical-hologram brain: cortex with gyri, cerebellum, brainstem + spinal cord.
// Highlights: awake (cortex glow), pons (REM atonia, red), visual (occipital flicker), block (barrier on the cord)
const vert = `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vP = position; vN = normalize(normalMatrix*normal); vec4 mv = viewMatrix*wp; vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
const frag = `
uniform vec3 base; uniform vec3 rimC; uniform float t; uniform float opacity;
uniform vec3 h0c; uniform vec3 h0col; uniform float h0r; uniform float h0i;
uniform vec3 h1c; uniform vec3 h1col; uniform float h1r; uniform float h1i;
uniform vec3 h2c; uniform vec3 h2col; uniform float h2r; uniform float h2i;
uniform float activity;
varying vec3 vN; varying vec3 vV; varying vec3 vP;
float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
void main(){
  float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
  vec3 c = base*0.35 + rimC*fr*1.1;
  c += h0col*h0i*(1.0-smoothstep(0.0,h0r,distance(vP,h0c)));
  c += h1col*h1i*(1.0-smoothstep(0.0,h1r,distance(vP,h1c)));
  c += h2col*h2i*(1.0-smoothstep(0.0,h2r,distance(vP,h2c)));
  float sp = step(0.992, hash(floor(vP*38.0) + floor(t*10.0)));
  c += vec3(0.7,0.85,1.0)*sp*activity;
  float a = (0.16 + fr*0.84) * opacity;
  gl_FragColor = vec4(c*a, 1.0);
}`;

type HL = { c: [number, number, number]; col: string; r: number; i: number };
const useMat = (t: number, opacity: number, hl: HL[], activity: number) => {
  const m = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: {
      base: { value: new THREE.Color("#3a6fb0") }, rimC: { value: new THREE.Color("#9fd2ff") }, t: { value: 0 }, opacity: { value: 1 }, activity: { value: 0 },
      h0c: { value: new THREE.Vector3() }, h0col: { value: new THREE.Color() }, h0r: { value: 1 }, h0i: { value: 0 },
      h1c: { value: new THREE.Vector3() }, h1col: { value: new THREE.Color() }, h1r: { value: 1 }, h1i: { value: 0 },
      h2c: { value: new THREE.Vector3() }, h2col: { value: new THREE.Color() }, h2r: { value: 1 }, h2i: { value: 0 },
    },
  }), []);
  m.uniforms.t.value = t; m.uniforms.opacity.value = opacity; m.uniforms.activity.value = activity;
  [0, 1, 2].forEach((k) => {
    const h = hl[k];
    m.uniforms[`h${k}i`].value = h ? h.i : 0;
    if (h) { (m.uniforms[`h${k}c`].value as THREE.Vector3).set(...h.c); (m.uniforms[`h${k}col`].value as THREE.Color).set(h.col); m.uniforms[`h${k}r`].value = h.r; }
  });
  return m;
};

const hemisphere = (side: 1 | -1) => {
  const g = new THREE.SphereGeometry(1, 150, 110);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone();
    let x = v.x * 0.44, y = v.y * 0.7, z = v.z * 1.0;
    if (x * side < 0) x *= 0.45; // flat medial face
    if (y < -0.25) y = -0.25 + (y + 0.25) * 0.55; // flatter base
    y -= 0.12 * Math.max(0, z) ** 2; // lower frontal pole
    y += 0.06 * Math.max(0, -z); // higher parietal/occipital
    y += 0.12 * Math.exp(-((z - 0.05) ** 2) * 6) * (v.y < 0 ? -1 : 0) * Math.max(0, x * side) * 2; // temporal lobe
    const q = n.clone().multiplyScalar(4.4);
    const r1 = 1 - Math.abs(noise3(q.x + side * 9, q.y, q.z));
    const r2 = 1 - Math.abs(noise3(q.x * 2.3 + 4, q.y * 2.3, q.z * 2.3));
    const d = 0.085 * r1 ** 4 + 0.03 * r2 ** 3 - 0.045;
    const len = Math.hypot(x, y, z) || 1;
    x += (x / len) * d; y += (y / len) * d; z += (z / len) * d;
    p.setXYZ(i, x + side * 0.225, y + 0.08, z);
  }
  g.computeVertexNormals();
  return g;
};

export const BRAIN_PTS = { cortexTop: [0, 0.75, 0.15] as [number, number, number], pons: [0, -0.48, -0.18] as [number, number, number], occipital: [0, 0.15, -0.95] as [number, number, number] };

export const Brain: React.FC<{ t: number; opacity: number; hl: HL[]; activity: number; rotY: number; signals: number; block: number }> = ({ t, opacity, hl, activity, rotY, signals, block }) => {
  const geos = useMemo(() => {
    const cere = new THREE.SphereGeometry(1, 120, 80);
    const p = cere.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const d = 1 + 0.018 * Math.sin(y * 42 + Math.sin(x * 3) * 2);
      p.setXYZ(i, x * 0.46 * d, y * 0.3 * d - 0.4, z * 0.36 * d - 0.62);
    }
    cere.computeVertexNormals();
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.25, -0.2), new THREE.Vector3(0, -0.6, -0.3), new THREE.Vector3(0, -1.2, -0.42), new THREE.Vector3(0, -2.0, -0.45), new THREE.Vector3(0, -2.9, -0.42)]);
    const stem = new THREE.TubeGeometry(curve, 120, 0.075, 24, false);
    return { l: hemisphere(-1), r: hemisphere(1), cere, stem, curve };
  }, []);
  const mat = useMat(t, opacity, hl, activity);
  const dots = useMemo(() => {
    const r = rng(3); const pts: number[] = [];
    const pa = geos.l.attributes.position as THREE.BufferAttribute, pb = geos.r.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 2600; i++) { const src = r() < 0.5 ? pa : pb; const k = Math.floor(r() * src.count); pts.push(src.getX(k), src.getY(k), src.getZ(k)); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); return g;
  }, [geos]);
  // nerve signals travelling down the cord; they stop at the barrier when blocked
  const barrierU = 0.42;
  const sig = Array.from({ length: 6 }, (_, k) => {
    const u = ((t * 0.45 + k / 6) % 1);
    const stopped = block > 0.5 && u > barrierU;
    const uu = stopped ? barrierU : u;
    const fade = stopped ? Math.max(0, 1 - (u - barrierU) * 6) : 1;
    return { p: geos.curve.getPointAt(Math.min(1, uu * 0.95 + 0.02)), a: fade * signals };
  });
  const bp = geos.curve.getPointAt(barrierU * 0.95 + 0.02);
  return (
    <group rotation={[0.08, rotY, 0]}>
      <mesh geometry={geos.l} material={mat} />
      <mesh geometry={geos.r} material={mat} />
      <mesh geometry={geos.cere} material={mat} />
      <mesh geometry={geos.stem} material={mat} />
      <points geometry={dots}><pointsMaterial size={0.012} color="#bfe3ff" transparent opacity={0.5 * opacity} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
      {sig.map((s, i) => s.a > 0.01 ? (
        <mesh key={i} position={s.p}><sphereGeometry args={[0.045, 16, 12]} /><meshBasicMaterial color={block > 0.5 ? "#ff5a4a" : "#bff0ff"} transparent opacity={s.a} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      ) : null)}
      {block > 0.01 ? (
        <group position={bp}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={1 + 0.08 * Math.sin(t * 8)}><torusGeometry args={[0.2, 0.014, 12, 64]} /><meshBasicMaterial color="#ff2b1f" transparent opacity={block} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.19, 48]} /><meshBasicMaterial color="#ff2b1f" transparent opacity={0.18 * block} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>
        </group>
      ) : null}
    </group>
  );
};

// particles flying out of the visual cortex and assembling into the shadow figure
export const Hallucination: React.FC<{ u: number; from: [number, number, number]; to: [number, number, number]; size: [number, number]; t: number }> = ({ u, from, to, size, t }) => {
  const targets = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 64; c.height = 160;
    const g = c.getContext("2d")!; g.fillStyle = "#fff";
    g.beginPath(); g.ellipse(32, 23, 10.5, 13.5, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(27, 35); g.bezierCurveTo(15, 40, 9, 50, 10, 75); g.bezierCurveTo(10.5, 105, 17.5, 130, 19, 160); g.lineTo(45, 160); g.bezierCurveTo(46.5, 130, 53.5, 105, 54, 75); g.bezierCurveTo(55, 50, 49, 40, 37, 35); g.closePath(); g.fill();
    const d = g.getImageData(0, 0, 64, 160).data; const pts: [number, number][] = [];
    for (let y = 0; y < 160; y += 2) for (let x = 0; x < 64; x += 2) if (d[(y * 64 + x) * 4 + 3] > 128) pts.push([x / 64 - 0.5, 1 - y / 160]);
    return pts;
  }, []);
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const arr = new Float32Array(targets.length * 3);
  const r = rng(9);
  targets.forEach(([x, y], i) => {
    const d = r() * 0.35, k = Math.min(1, Math.max(0, (u - d) / 0.65));
    const e = k * k * (3 - 2 * k);
    const tx = to[0] + x * size[0], ty = to[1] + y * size[1], tz = to[2];
    const wob = (1 - e) * 0.25;
    arr[i * 3] = from[0] + (tx - from[0]) * e + Math.sin(t * 3 + i) * wob;
    arr[i * 3 + 1] = from[1] + (ty - from[1]) * e + Math.cos(t * 2.3 + i * 0.7) * wob;
    arr[i * 3 + 2] = from[2] + (tz - from[2]) * e;
  });
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  if (u <= 0) return null;
  return <points geometry={geo}><pointsMaterial size={0.03} color="#c9d4ff" transparent opacity={Math.min(1, u * 2)} depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
};
