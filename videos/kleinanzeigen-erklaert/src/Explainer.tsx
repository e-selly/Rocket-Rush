import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT } from "./theme";
import captions from "./captions.json";
import { Follow, Free, Hook, Secure, Step1, Step2, Step3, Users, Vb, Warning } from "./Scenes";

type Word = { t: string; s: number; e: number; hi: boolean };
type Group = { start: number; end: number; words: Word[] };

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const g = (captions as Group[]).find((c) => t >= c.start && t < c.end);
  if (!g) return null;
  const a = g.start < 0.05 && t < 0.2 ? 1 : interpolate(t, [g.start, g.start + 0.12, g.end - 0.1, g.end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ top: 1400, height: 240, alignItems: "center", fontFamily: FONT }}>
      <div style={{ opacity: a, width: 900, textAlign: "center", fontWeight: 800, fontSize: 56, lineHeight: 1.12 }}>
        {g.words.map((w, i) => (
          <span key={i} style={{ display: "inline-block", marginRight: 14, color: w.hi ? C.green : C.ink, opacity: t >= w.s ? 1 : 0.4, textShadow: w.hi && t >= w.s ? `0 0 18px ${C.green}88` : "0 3px 12px rgba(0,0,0,0.8)" }}>{w.t}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(1100px 1300px at 50% 42%, rgba(60,20,90,0.22), transparent 70%)", pointerEvents: "none" }} />
);

export const Explainer: React.FC = () => {
  const { fps } = useVideoConfig();
  const cuts = [117, 227, 368, 460, 575, 668, 795, 992, 1100];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Vignette />
      <Sequence name="Hook" from={0} durationInFrames={117}><Hook /></Sequence>
      <Sequence name="Nutzer" from={117} durationInFrames={110}><Users /></Sequence>
      <Sequence name="Schritt 1" from={227} durationInFrames={141}><Step1 /></Sequence>
      <Sequence name="Kostenlos" from={368} durationInFrames={92}><Free /></Sequence>
      <Sequence name="VB" from={460} durationInFrames={115}><Vb /></Sequence>
      <Sequence name="Schritt 2" from={575} durationInFrames={93}><Step2 /></Sequence>
      <Sequence name="Schritt 3" from={668} durationInFrames={127}><Step3 /></Sequence>
      <Sequence name="Sicher bezahlen" from={795} durationInFrames={197}><Secure /></Sequence>
      <Sequence name="Warnung" from={992} durationInFrames={108}><Warning /></Sequence>
      <Sequence name="Folgen" from={1100} durationInFrames={100}><Follow /></Sequence>
      <Captions />

      <Sequence name="Stimme" from={9} durationInFrames={39 * fps}><Audio src={staticFile("voice.mp3")} /></Sequence>
      <Audio src={staticFile("bed.mp3")} volume={0.13} />
      <Sequence name="SFX Tippen" from={0} durationInFrames={28}><Audio src={staticFile("typing.mp3")} volume={0.35} /></Sequence>
      <Sequence name="SFX Partikel Wort" from={50} durationInFrames={2 * fps}><Audio src={staticFile("sparkle.mp3")} volume={0.35} /></Sequence>
      <Sequence name="SFX Riser" from={60} durationInFrames={57}><Audio src={staticFile("riser.mp3")} trimBefore={8 * fps} volume={0.18} /></Sequence>
      {cuts.map((c, i) => (
        <Sequence key={c} name={`SFX Schnitt ${i + 1}`} from={c - 5} durationInFrames={fps}><Audio src={staticFile("whoosh-short.mp3")} volume={0.14} /></Sequence>
      ))}
      {[227, 575, 668, 795, 992, 1100].map((c, i) => (
        <Sequence key={`s${c}`} name={`SFX Funkeln ${i + 1}`} from={c + 4} durationInFrames={2 * fps}><Audio src={staticFile("sparkle.mp3")} volume={0.22} /></Sequence>
      ))}
      <Sequence name="SFX Kostenlos" from={374} durationInFrames={2 * fps}><Audio src={staticFile("chime.mp3")} volume={0.3} /></Sequence>
      <Sequence name="SFX Nachricht 1" from={575 + 15} durationInFrames={fps}><Audio src={staticFile("notification.mp3")} volume={0.3} /></Sequence>
      <Sequence name="SFX Nachricht 2" from={575 + 54} durationInFrames={fps}><Audio src={staticFile("notification.mp3")} volume={0.3} /></Sequence>
      <Sequence name="SFX Warnung" from={994} durationInFrames={fps}><Audio src={staticFile("error.mp3")} volume={0.28} /></Sequence>
      <Sequence name="SFX Button" from={227 + 126} durationInFrames={fps}><Audio src={staticFile("click-soft.mp3")} volume={0.45} /></Sequence>
      <Sequence name="SFX Antwort" from={575 + 72} durationInFrames={fps}><Audio src={staticFile("click-soft.mp3")} volume={0.3} /></Sequence>
      <Sequence name="SFX Verkauft" from={1100 + 36} durationInFrames={2 * fps}><Audio src={staticFile("chime.mp3")} volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
