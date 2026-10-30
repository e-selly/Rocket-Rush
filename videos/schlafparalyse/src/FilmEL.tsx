import { AbsoluteFill, Freeze, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Captions, FPS, Film, LEAD } from "./Film";
import warp from "./warp.json";
import marksEl from "./voice-marks-el.json";

// The film retimed onto the ElevenLabs narration: every output frame shows the original frame
// that belongs to the same spot in the script (piecewise-linear between sentence starts).
const toOld = (f: number) => interpolate(f, warp.new, warp.old, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
export const TOTAL_EL = warp.total;

export const FilmEL: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Freeze frame={Math.round(toOld(f))}><Film withAudio={false} withCaptions={false} /></Freeze>
      <Captions data={marksEl as [number, number, string][]} hidden={(k) => { const o = toOld(k); return (o >= 556 && o < 623) || o >= 1182; }} />
      <Sequence name="Stimme" from={Math.round(LEAD * FPS)}><Audio src={staticFile("voice_el.mp3")} /></Sequence>
      <Audio src={staticFile("sound_el.wav")} />
    </AbsoluteFill>
  );
};
