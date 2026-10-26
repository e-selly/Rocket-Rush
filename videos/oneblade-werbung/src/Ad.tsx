import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Stage } from "./Stage";
import { WhipWords } from "./motion";
import { C, FONT, enter, glow } from "./theme";
import captions from "./captions.json";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
const L = C.green;

const Abs: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <AbsoluteFill style={{ top, height: "auto", bottom: "auto", alignItems: "center", fontFamily: FONT, color: C.ink, padding: "0 70px", textAlign: "center", ...style }}>{children}</AbsoluteFill>
);
const Chip: React.FC<{ children: React.ReactNode; at: number; solid?: boolean }> = ({ children, at, solid }) => {
  const f = useCurrentFrame(); const p = pop(f, at);
  return <div style={{ opacity: Math.min(1, p * 1.4), scale: 0.6 + 0.4 * p, padding: "16px 30px", borderRadius: 999, border: `3px solid ${L}`, background: solid ? L : "rgba(195,236,30,0.08)", color: solid ? "#0d1200" : C.ink, fontWeight: 900, fontSize: 42, boxShadow: `0 0 26px ${L}55` }}>{children}</div>;
};
// fades a whole scene layer in/out with a little blur
const Layer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 7, durationInFrames], [0, 1], clamp);
  return <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 12}px)` : undefined, scale: 1 + out * 0.08 }}>{children}</AbsoluteFill>;
};

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const fresh = interpolate(f, [64, 84], [0, 1], clamp);
  const x = 540 + Math.sin(f / 40) * 120, y = 760 + Math.cos(f / 55) * 80;
  return (
    <AbsoluteFill style={{ backgroundColor: "#060806" }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 900px at ${x}px ${y}px, rgba(195,236,30,${0.32 * fresh}), rgba(120,130,110,${0.12 * (1 - fresh)}) 30%, transparent 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(1200px 700px at 50% 120%, rgba(195,236,30,0.12), transparent 70%)", opacity: fresh }} />
    </AbsoluteFill>
  );
};

const Flash: React.FC<{ at: number[] }> = ({ at }) => {
  const f = useCurrentFrame();
  const a = Math.max(0, ...at.map((t) => interpolate(f, [t - 2, t, t + 8], [0, 0.55, 0], clamp)));
  return a > 0 ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, rgba(230,255,150,${a}), rgba(195,236,30,${a * 0.4}) 40%, transparent 75%)` }} /> : null;
};

type Word = { t: string; s: number; e: number; hi: boolean };
type Group = { start: number; end: number; words: Word[] };
const Captions: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const g = (captions as Group[]).find((c) => t >= c.start && t < c.end);
  if (!g) return null;
  const a = g.start < 0.05 && t < 0.2 ? 1 : interpolate(t, [g.start, g.start + 0.12, g.end - 0.1, g.end], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ top: 1470, height: 200, alignItems: "center", fontFamily: FONT }}>
      <div style={{ opacity: a, width: 900, textAlign: "center", fontWeight: 800, fontSize: 50, lineHeight: 1.12 }}>
        {g.words.map((w, i) => <span key={i} style={{ display: "inline-block", marginRight: 13, color: w.hi ? L : C.ink, opacity: t >= w.s ? 1 : 0.4, textShadow: "0 3px 12px rgba(0,0,0,0.85)" }}>{w.t}</span>)}
      </div>
    </AbsoluteFill>
  );
};

// ---------- scenes ----------
const Hook: React.FC = () => (
  <Layer>
    <WhipWords words={["Dein", "OneBlade", "schneidet", "nicht", "mehr?"]} start={-9} gap={4} size={88} hi={3} color={C.red} top={250} />
  </Layer>
);
const Fresh: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Layer>
      <WhipWords words={["Zeit", "für"]} start={0} gap={3} size={64} top={1060} />
      <Abs top={1140}><div style={{ ...enter(f, 6), fontWeight: 900, fontSize: 112, letterSpacing: "-0.02em", color: L, textShadow: glow(L, 0.8), scale: 0.85 + 0.15 * pop(f, 6) }}>FRISCHE<br />KLINGEN</div></Abs>
    </Layer>
  );
};
const Product: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <Layer>
      <Abs top={200}><div style={{ ...enter(f, 0), fontWeight: 800, fontSize: 36, letterSpacing: "0.3em", color: L }}>ORIGINAL PHILIPS</div></Abs>
      <Abs top={255}><div style={{ ...enter(f, 4), fontWeight: 900, fontSize: 116, lineHeight: 1 }}>OneBlade <span style={{ color: L, textShadow: glow(L, 0.6) }}>360</span></div></Abs>
      <Abs top={385}><div style={{ ...enter(f, 8), fontWeight: 700, fontSize: 52, color: C.dim }}>Ersatzklingen</div></Abs>
      <Abs top={1130}><div style={{ display: "flex", gap: 20 }}><Chip at={2.6 * fps} solid>4er-Pack</Chip><Chip at={3.0 * fps}>QP440/50</Chip></div></Abs>
    </Layer>
  );
};
const Flex: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <Layer>
      <Abs top={190}><div style={{ ...enter(f, 0), fontWeight: 900, fontSize: 220, lineHeight: 1, color: L, textShadow: glow(L, 0.9), scale: 0.8 + 0.2 * pop(f, 0) }}>360°</div></Abs>
      <WhipWords words={["bewegt", "sich", "in", "alle", "Richtungen"]} start={0.6 * fps} gap={3} size={56} hi={4} top={1150} />
      <Abs top={1310}><div style={{ ...enter(f, 2.6 * fps), fontWeight: 700, fontSize: 40, color: C.dim }}>folgt deinen Gesichtskonturen</div></Abs>
    </Layer>
  );
};
const Uses: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const words = ["TRIMMEN", "STYLEN", "RASIEREN"];
  return (
    <Layer>
      <Abs top={790}>
        {words.map((w, i) => {
          const at = [0, 0.45, 0.9][i] * fps; const p = pop(f, at);
          return <div key={w} style={{ opacity: Math.min(1, p * 1.5), translate: `${(1 - p) * 200 * (i % 2 ? -1 : 1)}px 0px`, fontWeight: 900, fontSize: 108, lineHeight: 1.05, color: i === 2 ? L : C.ink, textShadow: i === 2 ? glow(L, 0.6) : undefined, filter: p < 0.95 ? `blur(${(1 - p) * 8}px)` : undefined }}>{w}</div>;
        })}
      </Abs>
      <Abs top={1180}><div style={{ display: "flex", gap: 20 }}><Chip at={1.6 * fps}>Jede Haarlänge</Chip><Chip at={2.3 * fps}>Nass & trocken</Chip></div></Abs>
    </Layer>
  );
};
const Months: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const xs = [-1.5, -0.5, 0.5, 1.5].map((k) => 540 + k * 0.72 * 372);
  const n = Math.round(interpolate(f, [2.0 * fps, 3.4 * fps], [4, 16], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
  return (
    <Layer>
      <Abs top={170}><div style={{ ...enter(f, 0), fontWeight: 800, fontSize: 36, letterSpacing: "0.2em", color: C.dim }}>JEDE KLINGE BIS ZU</div></Abs>
      {xs.map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x - 90, width: 180, top: 520, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 40, color: C.ink, opacity: pop(f, 0.4 * fps + i * 5), scale: 0.6 + 0.4 * pop(f, 0.4 * fps + i * 5) }}>4 Mon.</div>
      ))}
      <Abs top={660}>
        <div style={{ ...enter(f, 1.8 * fps), fontWeight: 800, fontSize: 48, color: C.dim }}>Vorrat für bis zu</div>
        <div style={{ ...enter(f, 1.9 * fps), fontWeight: 900, fontSize: 300, lineHeight: 1, color: L, textShadow: glow(L, 0.9), fontVariantNumeric: "tabular-nums" }}>{n}</div>
        <div style={{ ...enter(f, 2.0 * fps), fontWeight: 900, fontSize: 92 }}>MONATE</div>
      </Abs>
      <Abs top={1330}><div style={{ ...enter(f, 2.6 * fps), fontWeight: 500, fontSize: 26, color: C.dim }}>*bei 2 vollständigen Rasuren pro Woche, laut Hersteller</div></Abs>
    </Layer>
  );
};
const Original: React.FC = () => {
  const f = useCurrentFrame();
  const p = pop(f, 2);
  const shake = f > 2 && f < 12 ? Math.sin(f * 3) * 6 : 0;
  return (
    <Layer>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)", opacity: interpolate(f, [0, 6], [0, 1], clamp) }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", top: -140 }}>
        <div style={{ position: "relative", width: 560, height: 560, opacity: Math.min(1, p * 1.5), scale: 1.6 - 0.6 * p, rotate: `${-8 + shake}deg` }}>
          <svg width={560} height={560} viewBox="0 0 560 560" style={{ position: "absolute", inset: 0, rotate: `${f * 1.2}deg` }}>
            <defs><path id="ring" d="M280,280 m-220,0 a220,220 0 1,1 440,0 a220,220 0 1,1 -440,0" /></defs>
            <text fill={L} fontFamily="Inter" fontWeight={900} fontSize={40} letterSpacing={12}><textPath href="#ring">ORIGINAL · PHILIPS · ORIGINAL · PHILIPS ·</textPath></text>
          </svg>
          <div style={{ position: "absolute", inset: 90, borderRadius: "50%", border: `8px solid ${L}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT, boxShadow: `0 0 50px ${L}66, inset 0 0 40px ${L}33`, background: "rgba(10,14,4,0.85)" }}>
            <div style={{ fontWeight: 900, fontSize: 96, color: L, lineHeight: 1 }}>100%</div>
            <div style={{ fontWeight: 900, fontSize: 56, color: C.ink }}>ORIGINAL</div>
          </div>
        </div>
      </AbsoluteFill>
      <Abs top={1150}><div style={{ ...enter(f, 12), fontWeight: 900, fontSize: 70 }}>Keine Kopie.</div></Abs>
    </Layer>
  );
};
const Cta: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const pulse = 1 + 0.04 * Math.sin(f / 4);
  const sweep = interpolate(f % 50, [0, 50], [-40, 140]);
  return (
    <AbsoluteFill>
      <Abs top={200}><div style={{ ...enter(f, 0), fontWeight: 900, fontSize: 84, lineHeight: 1.05 }}>OneBlade <span style={{ color: L, textShadow: glow(L, 0.6) }}>360</span><br /><span style={{ fontSize: 50, color: C.dim }}>Ersatzklingen · 4er-Pack</span></div></Abs>
      <Abs top={1110}>
        <div style={{ ...enter(f, 6), scale: pulse * (0.7 + 0.3 * pop(f, 6)), padding: "34px 90px", borderRadius: 999, fontWeight: 900, fontSize: 66, color: "#0d1200",
          backgroundImage: `linear-gradient(100deg, ${L} ${sweep - 25}%, #f4ffd0 ${sweep}%, ${L} ${sweep + 25}%)`, boxShadow: glow(L, 0.9) }}>JETZT BESTELLEN</div>
      </Abs>
      <Abs top={1262}><div style={{ ...enter(f, 0.8 * fps), fontWeight: 800, fontSize: 48 }}>Link in der Bio</div></Abs>
      <Abs top={1360}><div style={{ ...enter(f, 1.4 * fps), fontWeight: 500, fontSize: 25, color: C.dim }}>Passend für OneBlade & OneBlade Pro – bitte Modellnummer prüfen</div></Abs>
    </AbsoluteFill>
  );
};

export const Ad: React.FC = () => {
  const { fps } = useVideoConfig();
  const cuts = [64, 122, 247, 390, 490, 635, 698];
  return (
    <AbsoluteFill style={{ backgroundColor: "#060806" }}>
      <Background />
      <Stage />
      <Flash at={[64, 122, 698]} />
      <Sequence name="Hook" from={0} durationInFrames={64}><Hook /></Sequence>
      <Sequence name="Frisch" from={64} durationInFrames={58}><Fresh /></Sequence>
      <Sequence name="Produkt" from={122} durationInFrames={125}><Product /></Sequence>
      <Sequence name="360" from={247} durationInFrames={143}><Flex /></Sequence>
      <Sequence name="Anwendung" from={390} durationInFrames={100}><Uses /></Sequence>
      <Sequence name="Monate" from={490} durationInFrames={145}><Months /></Sequence>
      <Sequence name="Original" from={635} durationInFrames={63}><Original /></Sequence>
      <Sequence name="CTA" from={698} durationInFrames={142}><Cta /></Sequence>
      {/* captions hide during the end card */}
      <Sequence name="Untertitel" from={0} durationInFrames={698} layout="none"><Captions /></Sequence>

      <Sequence name="Stimme" from={9} durationInFrames={26 * fps}><Audio src={staticFile("voice.mp3")} /></Sequence>
      <Audio src={staticFile("bed.mp3")} volume={0.16} />
      <Sequence name="SFX Hook" from={0} durationInFrames={2 * fps}><Audio src={staticFile("impact-bass-2.mp3")} volume={0.35} /></Sequence>
      <Sequence name="SFX Riser" from={28} durationInFrames={36}><Audio src={staticFile("riser.mp3")} trimBefore={8.8 * fps} volume={0.25} /></Sequence>
      <Sequence name="SFX Frisch" from={63} durationInFrames={2 * fps}><Audio src={staticFile("whoosh-cinematic.mp3")} volume={0.35} /></Sequence>
      <Sequence name="SFX Frisch Hit" from={66} durationInFrames={2 * fps}><Audio src={staticFile("impact-bass-1.mp3")} volume={0.4} /></Sequence>
      {cuts.slice(1).map((c, i) => (
        <Sequence key={c} name={`SFX Schnitt ${i + 1}`} from={c - 5} durationInFrames={fps}><Audio src={staticFile("whoosh-short.mp3")} volume={0.16} /></Sequence>
      ))}
      <Sequence name="SFX 4er" from={122 + 78} durationInFrames={fps}><Audio src={staticFile("pop.mp3")} volume={0.35} /></Sequence>
      <Sequence name="SFX 360" from={248} durationInFrames={2 * fps}><Audio src={staticFile("sparkle.mp3")} volume={0.3} /></Sequence>
      {[0, 14, 27].map((d) => <Sequence key={d} name={`SFX Wort ${d}`} from={390 + d} durationInFrames={fps}><Audio src={staticFile("click-soft.mp3")} volume={0.3} /></Sequence>)}
      {[12, 17, 22, 27].map((d) => <Sequence key={`m${d}`} name={`SFX Monat ${d}`} from={490 + d} durationInFrames={fps}><Audio src={staticFile("pop.mp3")} volume={0.22} /></Sequence>)}
      <Sequence name="SFX Siegel" from={637} durationInFrames={2 * fps}><Audio src={staticFile("impact-bass-1.mp3")} volume={0.45} /></Sequence>
      <Sequence name="SFX CTA" from={698} durationInFrames={2 * fps}><Audio src={staticFile("sparkle.mp3")} volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
