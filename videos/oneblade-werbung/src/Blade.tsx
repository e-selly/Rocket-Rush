import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export const LIME = "#c3ec1e";

// Studio reflections for the steel (static, no animation)
export const Studio: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  return null;
};

const roundedRect = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
};

// Stylised OneBlade-style 360 blade cartridge: housing, steel comb on both edges, lime 360 joint
export const Blade: React.FC<{ worn?: number; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number; glow?: number }> = ({ worn = 0, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, glow = 0 }) => {
  const geo = useMemo(() => {
    const housing = new THREE.ExtrudeGeometry(roundedRect(3.4, 0.95, 0.42), { depth: 0.34, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4, curveSegments: 16 });
    housing.translate(0, 0, -0.17);
    const plate = new THREE.ExtrudeGeometry(roundedRect(3.2, 0.62, 0.22), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 12 });
    const tooth = new THREE.BoxGeometry(0.026, 0.11, 0.045);
    return { housing, plate, tooth };
  }, []);
  const teeth = useMemo(() => {
    const t: [number, number][] = [];
    for (let x = -1.45; x <= 1.45; x += 0.052) { t.push([x, 0.355]); t.push([x, -0.355]); }
    return t;
  }, []);
  const steel = new THREE.Color("#d9dde2").lerp(new THREE.Color("#7c7f82"), worn);
  const lime = new THREE.Color(LIME).lerp(new THREE.Color("#6b6f60"), worn);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo.housing}>
        <meshStandardMaterial color="#26292d" metalness={0.35} roughness={0.42} />
      </mesh>
      {/* lime frame ends */}
      {[-1.62, 1.62].map((x) => (
        <mesh key={x} position={[x, 0, 0.0]}>
          <boxGeometry args={[0.12, 0.8, 0.46]} />
          <meshStandardMaterial color={lime} emissive={lime} emissiveIntensity={0.15 + glow * 0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* steel cutting element on top */}
      <mesh geometry={geo.plate} position={[0, 0, 0.23]}>
        <meshStandardMaterial color={steel} metalness={1} roughness={0.18 + worn * 0.5} envMapIntensity={1.4 - worn} />
      </mesh>
      <mesh position={[0, 0, 0.3]}>
        <boxGeometry args={[3.0, 0.04, 0.012]} />
        <meshStandardMaterial color="#1a1c1e" metalness={0.6} roughness={0.5} />
      </mesh>
      {teeth.map(([x, y], i) => (
        <mesh key={i} geometry={geo.tooth} position={[x, y, 0.27]}>
          <meshStandardMaterial color={steel} metalness={1} roughness={0.22 + worn * 0.5} />
        </mesh>
      ))}
      {/* 360 joint underneath */}
      <mesh position={[0, 0, -0.32]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.32, 0.08, 20, 48]} />
        <meshStandardMaterial color={lime} emissive={lime} emissiveIntensity={0.2 + glow * 0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, -0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.32, 32]} />
        <meshStandardMaterial color="#26292d" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
};
