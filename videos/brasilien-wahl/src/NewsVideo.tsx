import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { BrazilMap } from "./BrazilMap";
import { C, FONT } from "./theme";
import captions from "./captions.json";
import { Clock, Context, Historic, Hook, Margin, Next, Odds, Question, Result, Twist } from "./scenes/Scenes";

type Word = { t: string; s: number; e: number; hi: boolean };
type Group = { start: number; end: number; words: Word[] };

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const red = interpolate(f, [19.9 * fps, 20.3 * fps, 24.3 * fps, 24.6 * fps], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(1200px 900px at 50% 38%, rgba(25,194,107,${0.16 * (1 - red)}), rgba(255,75,75,${0.2 * red}) 0%, transparent 70%)` }} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.035) 2px, transparent 2px)", backgroundSize: "90px 90px", translate: `0px ${-(f * 0.4) % 90}px` }} />
      {f > 3.2 * fps ? (
        <AbsoluteFill style={{ alignItems: "center", top: 420, opacity: 0.1 }}>
          <BrazilMap size={1000} draw={1} fill={1} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const Header: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ height: 160, top: 90, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "0 80px", fontFamily: FONT, opacity: interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" }) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ background: C.red, color: C.ink, fontWeight: 900, fontSize: 32, letterSpacing: "0.12em", padding: "10px 20px", borderRadius: 10 }}>NEWS</div>
        <div style={{ color: C.ink, fontWeight: 700, fontSize: 32 }}>Brasilien</div>
      </div>
      <div style={{ color: C.dim, fontWeight: 600, fontSize: 30 }}>26.10.2026</div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 18, height: 5, borderRadius: 3, background: C.line }}>
        <div style={{ height: "100%", width: `${(f / (durationInFrames - 1)) * 100}%`, background: C.yellow, borderRadius: 3 }} />
      </div>
    </AbsoluteFill>
  );
};

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const g = (captions as Group[]).find((c) => t >= c.start && t < c.end);
  if (!g) return null;
  const a = interpolate(t, [g.start, g.start + 0.15, g.end - 0.1, g.end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ top: 1390, height: 260, alignItems: "center", justifyContent: "flex-start", fontFamily: FONT }}>
      <div style={{ opacity: a, translate: `0px ${(1 - a) * 16}px`, width: 920, textAlign: "center", fontWeight: 800, fontSize: 64, lineHeight: 1.1, color: C.ink, textShadow: "0 4px 18px rgba(0,0,0,0.8)" }}>
        {g.words.map((w, i) => {
          const on = t >= w.s;
          return (
            <span key={i} style={{ display: "inline-block", marginRight: 16, color: w.hi ? C.yellow : C.ink, opacity: on ? 1 : 0.45, scale: w.hi && t >= w.s && t < w.s + 0.18 ? 1.08 : 1 }}>{w.t}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const NewsVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const cuts = [100, 352, 445, 600, 735, 895, 1010, 1127, 1194];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Background />
      <Sequence name="Hook" from={0} durationInFrames={100}><Hook /></Sequence>
      <Sequence name="Ergebnis" from={100} durationInFrames={252}><Result /></Sequence>
      <Sequence name="Vorsprung" from={352} durationInFrames={93}><Margin /></Sequence>
      <Sequence name="Historisch" from={445} durationInFrames={155}><Historic /></Sequence>
      <Sequence name="Wendung" from={600} durationInFrames={135}><Twist /></Sequence>
      <Sequence name="Uhr" from={735} durationInFrames={160}><Clock /></Sequence>
      <Sequence name="Hintergrund" from={895} durationInFrames={115}><Context /></Sequence>
      <Sequence name="Einschaetzung" from={1010} durationInFrames={117}><Odds /></Sequence>
      <Sequence name="Ausblick" from={1127} durationInFrames={67}><Next /></Sequence>
      <Sequence name="Frage" from={1194} durationInFrames={156}><Question /></Sequence>
      <Header />
      <Captions />

      <Sequence name="Stimme" from={9} durationInFrames={43 * fps}><Audio src={staticFile("voice.mp3")} volume={1} /></Sequence>
      <Audio src={staticFile("newsbed.mp3")} volume={0.2} />
      <Sequence name="SFX Intro" from={0} durationInFrames={2 * fps}><Audio src={staticFile("impact-bass-1.mp3")} volume={0.4} /></Sequence>
      {cuts.map((c, i) => (
        <Sequence key={c} name={`SFX Schnitt ${i + 1}`} from={c - 6} durationInFrames={fps}><Audio src={staticFile("whoosh-short.mp3")} volume={0.18} /></Sequence>
      ))}
      <Sequence name="SFX Riser" from={510} durationInFrames={90}><Audio src={staticFile("riser.mp3")} trimBefore={7 * fps} volume={0.22} /></Sequence>
      <Sequence name="SFX Glitch" from={600} durationInFrames={fps}><Audio src={staticFile("glitch-1.mp3")} volume={0.3} /></Sequence>
      <Sequence name="SFX Stempel" from={602} durationInFrames={2 * fps}><Audio src={staticFile("impact-bass-2.mp3")} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};
