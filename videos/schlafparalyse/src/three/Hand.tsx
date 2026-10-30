import { noise3 } from "./common";

// Right hand resting palm-down. Wrist at origin, fingers along local +x, back of hand up (+y).
// finger: effort to move (0..1) -> tiny lifts that never really happen; tremor: fine shaking; grip: closing into a fist.
const FINGERS = [
  { z: 0.03, len: [0.046, 0.027, 0.021], r: 0.0098, ph: 0.3 },
  { z: 0.01, len: [0.05, 0.031, 0.023], r: 0.0102, ph: 1.7 },
  { z: -0.01, len: [0.047, 0.029, 0.022], r: 0.0097, ph: 2.9 },
  { z: -0.029, len: [0.037, 0.022, 0.019], r: 0.0086, ph: 4.2 },
];

const Seg: React.FC<{ len: number; r: number; children?: React.ReactNode; bend: number; skin: React.ReactNode }> = ({ len, r, children, bend, skin }) => (
  <group rotation={[0, 0, -bend]}>
    <mesh position={[len / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow>
      <capsuleGeometry args={[r, len, 6, 12]} />
      {skin}
    </mesh>
    <group position={[len, 0, 0]}>{children}</group>
  </group>
);

export const Hand: React.FC<{ position: [number, number, number]; rotY: number; finger: number; tremor: number; grip: number; t: number; scale?: number }> = ({ position, rotY, finger, tremor, grip, t, scale = 1 }) => {
  const skin = <meshPhysicalMaterial color="#b08470" roughness={0.58} sheen={0.5} sheenColor="#ffc9b0" clearcoat={0.08} />;
  const shake = (k: number) => tremor * 0.035 * noise3(t * 9 + k, k * 3.1, 0.5);
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[scale, scale, -scale]}>
      {/* forearm + sleeve */}
      <mesh position={[-0.13, 0.016, 0.0]} rotation={[0, 0, -Math.PI / 2 + 0.06]} scale={[1, 1, 0.8]} castShadow receiveShadow><capsuleGeometry args={[0.03, 0.2, 8, 16]} />{skin}</mesh>
      <mesh position={[-0.36, 0.03, 0.0]} rotation={[0, 0, -Math.PI / 2 + 0.06]} castShadow receiveShadow><capsuleGeometry args={[0.05, 0.22, 8, 16]} /><meshStandardMaterial color="#2c3038" roughness={0.9} /></mesh>
      {/* palm */}
      <mesh position={[0.045, 0.014, 0]} scale={[0.052, 0.017, 0.042]} castShadow receiveShadow><sphereGeometry args={[1, 32, 20]} />{skin}</mesh>
      <mesh position={[0.08, 0.013, 0.0]} scale={[0.02, 0.014, 0.043]} castShadow><sphereGeometry args={[1, 20, 12]} />{skin}</mesh>
      {FINGERS.map((fg, i) => {
        const lift = finger * (0.06 + 0.06 * Math.sin(t * (5 + i) + fg.ph)) * (0.5 + 0.5 * Math.sin(t * 1.3 + fg.ph * 2));
        const b0 = 0.12 - lift + grip * 1.1 + shake(i);
        const b1 = 0.35 + grip * 1.3 + shake(i + 5) * 0.5;
        const b2 = 0.25 + grip * 1.0;
        return (
          <group key={i} position={[0.088, 0.016, fg.z]} rotation={[0, (i - 1.5) * -0.05, 0]}>
            <Seg len={fg.len[0]} r={fg.r} bend={b0} skin={skin}>
              <Seg len={fg.len[1]} r={fg.r * 0.93} bend={b1} skin={skin}>
                <Seg len={fg.len[2]} r={fg.r * 0.86} bend={b2} skin={skin} />
              </Seg>
            </Seg>
          </group>
        );
      })}
      {/* thumb */}
      <group position={[0.02, 0.008, 0.04]} rotation={[0.5, 0.75 - grip * 0.5, 0]}>
        <Seg len={0.04} r={0.012} bend={0.1 + grip * 0.5 - finger * 0.04 * Math.sin(t * 4) + shake(9)} skin={skin}>
          <Seg len={0.032} r={0.011} bend={0.25 + grip * 0.6} skin={skin} />
        </Seg>
      </group>
    </group>
  );
};
