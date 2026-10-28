import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Stylised 3D car built from a side profile. Proportions follow the real body type,
// but it is an illustration: no brand logos, no number plates.
export type CarSpec = {
  L: number; W: number; r: number; wb: number; fo: number; y0: number; hood: number; belt: number; roof: number;
  ws: number; rf: number; rr: number; rb: number; tail: number; color: string; grille: "kidney" | "wide" | "vw"; rim: string; metal?: number;
};

export const SPECS: Record<string, CarSpec> = {
  bmw5: { L: 5.06, W: 1.9, r: 0.36, wb: 2.98, fo: 0.88, y0: 0.2, hood: 0.84, belt: 0.97, roof: 1.48, ws: 0.95, rf: 0.0, rr: -1.15, rb: -1.85, tail: 1.0, color: "#14171c", grille: "kidney", rim: "#3a3e44" },
  x5: { L: 4.92, W: 2.0, r: 0.41, wb: 2.98, fo: 0.9, y0: 0.32, hood: 1.04, belt: 1.18, roof: 1.76, ws: 0.95, rf: 0.2, rr: -1.95, rb: -2.25, tail: 1.2, color: "#80858c", grille: "kidney", rim: "#c7cbd1" },
  x3: { L: 4.75, W: 1.92, r: 0.39, wb: 2.86, fo: 0.85, y0: 0.3, hood: 1.0, belt: 1.12, roof: 1.68, ws: 0.9, rf: 0.15, rr: -1.85, rb: -2.15, tail: 1.14, color: "#e6e8eb", grille: "kidney", rim: "#2b2e33", metal: 0.15 },
  glc: { L: 4.72, W: 1.89, r: 0.39, wb: 2.89, fo: 0.82, y0: 0.29, hood: 0.99, belt: 1.1, roof: 1.64, ws: 0.92, rf: 0.12, rr: -1.75, rb: -2.12, tail: 1.12, color: "#14171c", grille: "wide", rim: "#c7cbd1" },
  golf: { L: 4.28, W: 1.79, r: 0.34, wb: 2.62, fo: 0.82, y0: 0.2, hood: 0.82, belt: 0.93, roof: 1.46, ws: 0.82, rf: 0.02, rr: -1.62, rb: -1.98, tail: 0.98, color: "#14171c", grille: "vw", rim: "#3a3d42" },
  troc: { L: 4.24, W: 1.82, r: 0.36, wb: 2.6, fo: 0.8, y0: 0.26, hood: 0.9, belt: 1.02, roof: 1.56, ws: 0.82, rf: 0.05, rr: -1.55, rb: -1.98, tail: 1.05, color: "#6e7279", grille: "vw", rim: "#c7cbd1" },
};

// studio reflections for the paint
export const Env: React.FC<{ intensity?: number }> = ({ intensity = 0.7 }) => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  scene.environmentIntensity = intensity;
  return null;
};

// camera driven by props every frame
export const Cam: React.FC<{ pos: [number, number, number]; look: [number, number, number]; fov?: number }> = ({ pos, look, fov }) => {
  const { camera } = useThree();
  camera.position.set(...pos);
  camera.lookAt(...look);
  const pc = camera as THREE.PerspectiveCamera;
  if (fov && pc.fov !== fov) { pc.fov = fov; pc.updateProjectionMatrix(); }
  return null;
};

let shadowTex: THREE.Texture | null = null;
export const softShadow = () => {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d")!; const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, "rgba(0,0,0,0.95)"); gr.addColorStop(0.55, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c); return shadowTex;
};

const useGeo = (s: CarSpec) => useMemo(() => {
  const f = s.L / 2 - 0.04, b = -s.L / 2 + 0.04, fwx = s.L / 2 - s.fo, rwx = fwx - s.wb, ar = s.r + 0.13;
  const body = new THREE.Shape();
  body.moveTo(b + 0.15, s.y0);
  body.lineTo(rwx - ar, s.y0);
  body.absarc(rwx, s.r, ar, Math.PI, 0, true);
  body.lineTo(fwx - ar, s.y0);
  body.absarc(fwx, s.r, ar, Math.PI, 0, true);
  body.lineTo(f - 0.22, s.y0);
  body.quadraticCurveTo(f, s.y0 + 0.02, f, s.y0 + 0.2);
  body.lineTo(f, s.hood - 0.24);
  body.quadraticCurveTo(f - 0.02, s.hood - 0.02, f - 0.5, s.hood + 0.04);
  body.quadraticCurveTo(s.ws + 0.5, s.belt, s.ws, s.belt);
  body.lineTo(s.rb, s.belt + 0.02);
  body.lineTo(b + 0.3, s.tail);
  body.quadraticCurveTo(b, s.tail - 0.02, b, s.tail - 0.25);
  body.lineTo(b, s.y0 + 0.14);
  body.quadraticCurveTo(b, s.y0, b + 0.15, s.y0);
  const bodyG = new THREE.ExtrudeGeometry(body, { depth: s.W - 0.3, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.08, bevelSegments: 8, curveSegments: 28 });
  bodyG.translate(0, 0, -(s.W - 0.3) / 2);

  const cw = s.W * 0.86 - 0.1;
  const cab = new THREE.Shape();
  cab.moveTo(s.ws - 0.02, s.belt - 0.06);
  cab.quadraticCurveTo(s.rf + (s.ws - s.rf) * 0.25, s.roof - 0.02, s.rf - 0.12, s.roof + 0.02);
  cab.quadraticCurveTo((s.rf + s.rr) / 2, s.roof + 0.07, s.rr + 0.1, s.roof);
  cab.quadraticCurveTo(s.rr - 0.05, s.roof - 0.02, s.rb + 0.02, s.belt - 0.06);
  cab.closePath();
  const cabG = new THREE.ExtrudeGeometry(cab, { depth: cw, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.03, bevelSegments: 6, curveSegments: 20 });
  cabG.translate(0, 0, -cw / 2);

  const glass = new THREE.Shape();
  const gx0 = s.ws - 0.1, gx1 = s.rb + 0.1, gyb = s.belt + 0.03, gyt = s.roof - 0.1;
  glass.moveTo(gx0, gyb);
  glass.quadraticCurveTo(s.rf + (s.ws - s.rf) * 0.25, gyt - 0.02, s.rf - 0.08, gyt);
  glass.lineTo(s.rr + 0.12, gyt - 0.01);
  glass.quadraticCurveTo(s.rr - 0.02, gyt - 0.03, gx1, gyb);
  glass.closePath();
  const gw = cw + 0.2;
  const glassG = new THREE.ExtrudeGeometry(glass, { depth: gw, bevelEnabled: true, bevelThickness: 0.0, bevelSize: 0.035, bevelSegments: 2 });
  glassG.translate(0, 0, -gw / 2);
  // windscreen + rear window: thin bands that follow the cabin curves, just proud of the surface
  const band = (p0: [number, number], c: [number, number], p2: [number, number], t0: number, t1: number) => {
    const pts: [number, number, number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const t = t0 + ((t1 - t0) * i) / 16;
      const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p2[0];
      const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p2[1];
      const tx = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p2[0] - c[0]);
      const ty = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p2[1] - c[1]);
      const n = Math.hypot(tx, ty);
      pts.push([x, y, ty / n, -tx / n]);
    }
    const sh = new THREE.Shape();
    pts.forEach(([x, y, nx, ny], i) => (i ? sh.lineTo(x + nx * 0.045, y + ny * 0.045) : sh.moveTo(x + nx * 0.045, y + ny * 0.045)));
    [...pts].reverse().forEach(([x, y, nx, ny]) => sh.lineTo(x - nx * 0.01, y - ny * 0.01));
    sh.closePath();
    const d = cw * 0.9;
    const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
    geo.translate(0, 0, -d / 2);
    return geo;
  };
  const wsG = band([s.ws - 0.02, s.belt - 0.06], [s.rf + (s.ws - s.rf) * 0.25, s.roof - 0.02], [s.rf - 0.12, s.roof + 0.02], 0.12, 0.9);
  const rwG = band([s.rr + 0.1, s.roof], [s.rr - 0.05, s.roof - 0.02], [s.rb + 0.02, s.belt - 0.06], 0.12, 0.85);
  return { bodyG, cabG, glassG, wsG, rwG, fwx, rwx, f, b, gx0, gx1 };
}, [s]);

const Wheel: React.FC<{ s: CarSpec; x: number; side: 1 | -1; spin: number }> = ({ s, x, side, spin }) => {
  const z = side * (s.W / 2 - 0.16);
  return (
    <group position={[x, s.r, z]}>
      <group rotation={[0, 0, -spin]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[s.r, s.r, 0.26, 40]} />
          <meshStandardMaterial color="#0e0f11" roughness={0.85} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.125]}>
          <cylinderGeometry args={[s.r * 0.7, s.r * 0.7, 0.02, 40]} />
          <meshStandardMaterial color="#1a1c1f" metalness={0.6} roughness={0.4} />
        </mesh>
        {[0, 1, 2, 3, 4].map((k) => (
          <mesh key={k} position={[0, 0, side * 0.14]} rotation={[0, 0, (k * Math.PI * 2) / 5]}>
            <boxGeometry args={[0.07, s.r * 1.3, 0.03]} />
            <meshStandardMaterial color={s.rim} metalness={1} roughness={0.22} />
          </mesh>
        ))}
        <mesh position={[0, 0, side * 0.13]}>
          <torusGeometry args={[s.r * 0.68, 0.025, 10, 40]} />
          <meshStandardMaterial color={s.rim} metalness={1} roughness={0.22} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.15]}>
          <cylinderGeometry args={[0.06, 0.06, 0.03, 20]} />
          <meshStandardMaterial color={s.rim} metalness={1} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

export const Car3D: React.FC<{ spec: CarSpec; position?: [number, number, number]; rotY?: number; spin?: number; scale?: number; lights?: number; shadow?: boolean }> = ({ spec: s, position = [0, 0, 0], rotY = 0, spin = 0, scale = 1, lights = 1, shadow = true }) => {
  const g = useGeo(s);
  const paint = <meshPhysicalMaterial color={s.color} metalness={s.metal ?? 0.6} roughness={0.28} clearcoat={1} clearcoatRoughness={0.03} />;
  const gy = s.y0 + (s.hood - s.y0) * 0.6;
  const glassM = <meshPhysicalMaterial color="#05070a" metalness={0.2} roughness={0.04} clearcoat={1} clearcoatRoughness={0.02} />;
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      {shadow ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <planeGeometry args={[s.L * 1.18, s.W * 1.45]} />
          <meshBasicMaterial map={softShadow()} transparent depthWrite={false} />
        </mesh>
      ) : null}
      <mesh geometry={g.bodyG}>{paint}</mesh>
      <mesh geometry={g.cabG}>{paint}</mesh>
      <mesh geometry={g.glassG}>{glassM}</mesh>
      <mesh geometry={g.wsG}>{glassM}</mesh>
      <mesh geometry={g.rwG}>{glassM}</mesh>
      {/* B-pillar */}
      {[1, -1].map((side) => (
        <mesh key={`b${side}`} position={[(g.gx0 + g.gx1) / 2 + 0.15, (s.belt + s.roof) / 2, side * (s.W * 0.43 + 0.065)]}>
          <boxGeometry args={[0.09, s.roof - s.belt - 0.06, 0.02]} />
          {glassM}
        </mesh>
      ))}
      {/* side skirts + belt trim */}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[(g.fwx + g.rwx) / 2, s.y0 + 0.05, side * (s.W / 2 + 0.005)]}>
            <boxGeometry args={[g.fwx - g.rwx - 2 * (s.r + 0.12), 0.1, 0.02]} />
            <meshStandardMaterial color="#0c0d0f" roughness={0.6} />
          </mesh>
          <mesh position={[(s.ws + s.rb) / 2, s.belt - 0.02, side * (s.W * 0.43 + 0.05)]}>
            <boxGeometry args={[s.ws - s.rb, 0.025, 0.02]} />
            <meshStandardMaterial color="#b9bdc3" metalness={1} roughness={0.2} />
          </mesh>
          {/* mirror */}
          <mesh position={[s.ws - 0.12, s.belt + 0.12, side * (s.W / 2 + 0.06)]}>
            <boxGeometry args={[0.2, 0.13, 0.2]} />
            {paint}
          </mesh>
          {/* headlight */}
          <mesh position={[g.f + 0.04, s.hood - 0.22, side * s.W * 0.33]} rotation={[0, side * 0.2, 0]}>
            <boxGeometry args={[0.06, 0.05, 0.34]} />
            <meshStandardMaterial color="#ffffff" emissive="#eef3ff" emissiveIntensity={2.2 * lights} />
          </mesh>
        </group>
      ))}
      {/* tail light bar */}
      <mesh position={[g.b - 0.11, s.tail - 0.2, 0]}>
        <boxGeometry args={[0.05, 0.07, s.W * 0.9]} />
        <meshStandardMaterial color="#5a0b0b" emissive="#ff2a22" emissiveIntensity={1.8 * lights} />
      </mesh>
      {/* grille (body-type, no badges) */}
      {s.grille === "kidney" ? [1, -1].map((side) => (
        <mesh key={side} position={[g.f + 0.12, gy, side * 0.17]}>
          <boxGeometry args={[0.03, 0.28, 0.26]} />
          <meshStandardMaterial color="#08090b" metalness={0.7} roughness={0.35} />
        </mesh>
      )) : null}
      {s.grille === "wide" ? (
        <group position={[g.f + 0.12, gy, 0]}>
          <mesh><boxGeometry args={[0.03, 0.3, s.W * 0.5]} /><meshStandardMaterial color="#08090b" metalness={0.7} roughness={0.35} /></mesh>
          {[-0.08, 0, 0.08].map((y) => (
            <mesh key={y} position={[0.02, y, 0]}><boxGeometry args={[0.012, 0.018, s.W * 0.48]} /><meshStandardMaterial color="#d6d9de" metalness={1} roughness={0.15} /></mesh>
          ))}
        </group>
      ) : null}
      {s.grille === "vw" ? (
        <group position={[g.f + 0.12, s.hood - 0.17, 0]}>
          <mesh><boxGeometry args={[0.03, 0.12, s.W * 0.4]} /><meshStandardMaterial color="#08090b" metalness={0.7} roughness={0.35} /></mesh>
          <mesh position={[0.02, 0.07, 0]}><boxGeometry args={[0.012, 0.012, s.W * 0.62]} /><meshStandardMaterial color="#eef3ff" emissive="#eef3ff" emissiveIntensity={1.2 * lights} /></mesh>
        </group>
      ) : null}
      <mesh position={[g.f + 0.11, s.y0 + 0.2, 0]}>
        <boxGeometry args={[0.03, 0.14, s.W * 0.62]} />
        <meshStandardMaterial color="#08090b" roughness={0.5} />
      </mesh>
      {[1, -1].map((side) => (
        <group key={`w${side}`}>
          <Wheel s={s} x={g.fwx} side={side as 1 | -1} spin={spin} />
          <Wheel s={s} x={g.rwx} side={side as 1 | -1} spin={spin} />
        </group>
      ))}
    </group>
  );
};
