import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import captions from "./captions.json";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const GOLD = "#e3c27a";
export const SANS = "Inter, sans-serif";
export const SERIF = "'Playfair Display', serif";
export const rise = (f: number, a: number, d = 14) => interpolate(f, [a, a + d], [0, 1], { ...clamp, easing: ease });
export const shadow = "0 4px 30px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.5)";

// ---------- building blocks ----------

// a real photo, filling 9:16: blurred copy as backdrop, the sharp photo with a slow Ken-Burns move on top
const Photo: React.FC<{ src: string; cover?: boolean; land?: boolean; zoom?: [number, number]; pan?: [number, number]; y?: number }> = ({ src, cover = false, land = false, zoom = [1.04, 1.12], pan = [0, 0], y = 0 }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const u = f / durationInFrames;
  const s = interpolate(u, [0, 1], zoom), x = interpolate(u, [0, 1], pan);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0d10", overflow: "hidden" }}>
      <Img src={staticFile(`photos/${src}`)} style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", objectFit: "cover", filter: "blur(38px) brightness(0.55) saturate(1.1)" }} />
      <Img src={staticFile(`photos/${src}`)} style={{ position: "absolute", left: 0, top: cover ? 0 : land ? 640 + y : 430 + y, width: 1080, height: cover ? 1920 : land ? 765 : 1300, objectFit: "cover", scale: s, translate: `${x}px 0px`,
        maskImage: cover ? undefined : "linear-gradient(180deg, transparent 0%, #000 10%, #000 86%, transparent 100%)", WebkitMaskImage: cover ? undefined : "linear-gradient(180deg, transparent 0%, #000 10%, #000 86%, transparent 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.7) 100%)" }} />
    </AbsoluteFill>
  );
};

// the real car, cut out of its photo and set into a lakeside showroom: soft lake backdrop, dark floor, contact shadow, reflection
const Showroom: React.FC<{ car: string; dir?: 1 | -1; width?: number }> = ({ car, dir = 1, width = 1040 }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const u = f / durationInFrames;
  const s = interpolate(u, [0, 1], [1, 1.06]);
  const x = interpolate(f, [0, 18], [70 * dir, 0], { ...clamp, easing: ease });
  const bg = interpolate(u, [0, 1], [1.08, 1.0]);
  const src = staticFile(`cut/${car}.png`);
  const sweep = interpolate(f, [10, 34], [-40, 140], clamp);
  const floor = 1420;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0d10", overflow: "hidden" }}>
      <Img src={staticFile("cut/lake-bg.jpg")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1138, objectFit: "cover", scale: bg, translate: `${-x * 0.3}px 0px`, filter: "brightness(0.62) saturate(0.95)",
        maskImage: "linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)", WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 24%, rgba(0,0,0,0.15) 48%, rgba(11,13,16,0.92) 62%, #0b0d10 76%)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 620px 220px at 540px ${floor - 10}px, rgba(227,194,122,0.16), transparent 70%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: floor - 2, height: 2, background: `linear-gradient(90deg, transparent, rgba(227,194,122,0.35), transparent)` }} />
      <div style={{ position: "absolute", left: 540 - width / 2, width, top: 0, height: 1920, translate: `${x}px 0px`, scale: s, transformOrigin: `50% ${floor}px` }}>
        <div style={{ position: "absolute", left: width * 0.04, right: width * 0.04, top: floor - 34, height: 60, borderRadius: "50%", background: "rgba(0,0,0,0.85)", filter: "blur(18px)" }} />
        <div style={{ position: "absolute", left: 0, width, bottom: 1920 - floor }}>
          <Img src={src} style={{ display: "block", width }} />
          <div style={{ position: "absolute", inset: 0, maskImage: `url(${src})`, WebkitMaskImage: `url(${src})`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%",
            background: `linear-gradient(105deg, transparent ${sweep - 14}%, rgba(255,240,215,0.32) ${sweep}%, transparent ${sweep + 14}%)`, mixBlendMode: "screen" }} />
        </div>
        <div style={{ position: "absolute", left: 0, width, top: floor, opacity: 0.22, maskImage: "linear-gradient(180deg, #000 0%, transparent 32%)", WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 32%)" }}>
          <Img src={src} style={{ display: "block", width, scale: "1 -1", filter: "blur(2px)" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// soft light sweep across the frame (premium shine)
export const Sweep: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const u = interpolate(f, [at, at + 22], [-0.3, 1.3], clamp);
  if (u <= -0.3 || u >= 1.3) return null;
  return <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${u * 100 - 18}%, rgba(255,240,210,0.22) ${u * 100}%, transparent ${u * 100 + 18}%)`, mixBlendMode: "screen" }} />;
};

// shot wrapper: slides/blur-whips in and out
export const Shot: React.FC<{ children: React.ReactNode; dir?: 1 | -1; whip?: boolean }> = ({ children, dir = 1, whip = true }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const a = interpolate(f, [0, 8], [0, 1], { ...clamp, easing: ease });
  const b = interpolate(f, [durationInFrames - 6, durationInFrames], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const x = whip ? (1 - a) * 220 * dir - b * 220 * dir : 0;
  const blur = whip ? (1 - a) * 16 + b * 16 : 0;
  return <AbsoluteFill style={{ opacity: Math.min(1, a * 1.4) * (1 - b * 0.6), translate: `${x}px 0px`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>;
};

export const ModelLabel: React.FC<{ brand: string; model: string; top?: number }> = ({ brand, model, top = 175 }) => {
  const f = useCurrentFrame();
  const a = rise(f, 6), b = rise(f, 10);
  return (
    <div style={{ position: "absolute", left: 80, top, color: "#fff", fontFamily: SANS, textShadow: shadow }}>
      <div style={{ width: 90 * a, height: 3, background: GOLD, marginBottom: 18 }} />
      <div style={{ opacity: a, fontWeight: 600, fontSize: 34, letterSpacing: "0.22em", color: GOLD }}>{brand.toUpperCase()}</div>
      <div style={{ opacity: b, translate: `${(1 - b) * 30}px 0px`, fontFamily: SERIF, fontWeight: 700, fontSize: 92, lineHeight: 1.02 }}>{model}</div>
    </div>
  );
};

export const PriceTag: React.FC<{ price: string; model: string }> = ({ price, model }) => {
  const f = useCurrentFrame();
  const a = rise(f, 4), b = interpolate(f, [8, 18], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 165, textAlign: "center", color: "#fff", fontFamily: SANS, textShadow: shadow }}>
      <div style={{ opacity: a, fontWeight: 600, fontSize: 40, letterSpacing: "0.08em" }}>{model}</div>
      <div style={{ opacity: b, scale: 0.85 + 0.15 * b, marginTop: 8, display: "inline-flex", alignItems: "baseline", gap: 18 }}>
        <span style={{ fontWeight: 500, fontSize: 52, color: GOLD }}>ab</span>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 190, lineHeight: 1 }}>{price} €</span>
        <span style={{ fontWeight: 500, fontSize: 48, color: "#e8e8e8" }}>/ Tag</span>
      </div>
    </div>
  );
};

// card for a fleet car we have no photo of: elegant type over the blurred lake, never a fake car image
const TypeCard: React.FC<{ brand: string; model: string; price?: string }> = ({ brand, model, price }) => {
  const f = useCurrentFrame();
  const a = rise(f, 4), b = rise(f, 9);
  return (
    <AbsoluteFill>
      <Img src={staticFile("photos/see-glb-gold.jpg")} style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", objectFit: "cover", filter: "blur(30px) brightness(0.5)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: SANS, textAlign: "center", textShadow: shadow }}>
        <div style={{ opacity: a, fontWeight: 600, fontSize: 36, letterSpacing: "0.24em", color: GOLD }}>{brand.toUpperCase()}</div>
        <div style={{ opacity: b, scale: 0.94 + 0.06 * b, fontFamily: SERIF, fontWeight: 700, fontSize: 116, lineHeight: 1.02, marginTop: 14 }}>{model}</div>
        {price ? (
          <div style={{ opacity: rise(f, 12), marginTop: 30, display: "inline-flex", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontWeight: 500, fontSize: 52, color: GOLD }}>ab</span>
            <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 180, lineHeight: 1 }}>{price} €</span>
            <span style={{ fontWeight: 500, fontSize: 48 }}>/ Tag</span>
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- scenes ----------
const Opening: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Photo src="see-glb.jpg" land zoom={[1.32, 1.12]} pan={[70, -10]} />
      <Sweep at={30} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", color: "#fff", textShadow: shadow }}>
        <div style={{ opacity: rise(f, 4), translate: `0px ${(1 - rise(f, 4)) * 20}px`, fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.05 }}>Dein Mietwagen.</div>
        <div style={{ opacity: rise(f, 16), translate: `0px ${(1 - rise(f, 16)) * 20}px`, fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.05, color: GOLD }}>Dein Tegernsee.</div>
      </div>
    </AbsoluteFill>
  );
};

const FLEET: { photo?: string; brand: string; model: string; zoom?: [number, number]; pan?: [number, number] }[] = [
  { photo: "bmw5", brand: "BMW", model: "540d", zoom: [1.12, 1.02], pan: [30, -30] },
  { photo: "x5", brand: "BMW", model: "X5", zoom: [1.02, 1.12] },
  { photo: "x3", brand: "BMW", model: "X3", zoom: [1.12, 1.03], pan: [-30, 20] },
  { brand: "Mercedes-Benz", model: "GLC 4Matic" },
  { photo: "golf", brand: "Volkswagen", model: "Golf 8 R-Line", zoom: [1.03, 1.13] },
  { photo: "troc", brand: "Volkswagen", model: "T-Roc", zoom: [1.13, 1.03], pan: [20, -20] },
];
const PRICES: { photo?: string; model: string; price: string }[] = [
  { photo: "golf", model: "VW Golf 8 R-Line", price: "99" },
  { photo: "troc", model: "VW T-Roc", price: "99" },
  { model: "Mercedes-Benz GLC", price: "109" },
  { photo: "bmw5", model: "BMW 540d", price: "135" },
];

export const Benefit: React.FC<{ text: string; at: number; idx: number }> = ({ text, at, idx }) => {
  const f = useCurrentFrame();
  const a = rise(f, at, 12);
  return (
    <div style={{ opacity: a, translate: `${(1 - a) * -40}px 0px`, display: "flex", alignItems: "center", gap: 26, marginTop: idx ? 26 : 0 }}>
      <div style={{ width: 66, height: 66, borderRadius: 33, border: `3px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(0,0,0,0.25)" }}>
        <svg width="34" height="34" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={30 * (1 - rise(f, at + 4, 10))} /></svg>
      </div>
      <div style={{ fontWeight: 700, fontSize: 52, lineHeight: 1.1, color: "#fff" }}>{text}</div>
    </div>
  );
};
const Benefits: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={Math.round(4.6 * fps)} layout="none"><Showroom car="glb" width={940} /></Sequence>
      <Sequence from={Math.round(4.6 * fps)} layout="none"><Photo src="see-glb-gold.jpg" land zoom={[1.15, 1.28]} pan={[40, -20]} /></Sequence>
      <div style={{ position: "absolute", left: 80, right: 60, top: 165, fontFamily: SANS, textShadow: shadow }}>
        <Benefit text="Kostenlose Zustellung rund um den Tegernsee" at={0.4 * fps} idx={0} />
        <Benefit text="Unbegrenzte Kilometer" at={4.8 * fps} idx={1} />
        <Benefit text="Zusatzfahrer inklusive" at={6.2 * fps} idx={2} />
      </div>
    </AbsoluteFill>
  );
};

const Finale: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Photo src="see-glb-gold.jpg" land zoom={[1.45, 1.1]} pan={[-60, 0]} />
      <Sweep at={20} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", color: "#fff", textShadow: shadow, fontFamily: SANS }}>
        <div style={{ opacity: rise(f, 6), fontFamily: SERIF, fontWeight: 700, fontSize: 92, lineHeight: 1.05 }}>Worauf wartest du?</div>
        <div style={{ opacity: rise(f, 40), marginTop: 22, fontWeight: 600, fontSize: 48, color: GOLD, letterSpacing: "0.04em" }}>Jetzt Mietwagen buchen</div>
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{ bg?: React.ReactNode }> = ({ bg }) => {
  const f = useCurrentFrame();
  const pulse = 1 + 0.03 * Math.sin(f / 5);
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: "#fff" }}>
      {bg ?? <Img src={staticFile("photos/see-glb-gold.jpg")} style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", objectFit: "cover", filter: "blur(26px) brightness(0.32)" }} />}
      <AbsoluteFill style={{ alignItems: "center", textAlign: "center", paddingTop: 300 }}>
        <div style={{ opacity: rise(f, 2), width: 140 * rise(f, 2), height: 3, background: GOLD }} />
        <div style={{ opacity: rise(f, 4), marginTop: 34, fontFamily: SERIF, fontWeight: 700, fontSize: 84, lineHeight: 1.08 }}>AUTOVERMIETUNG<br />AM TEGERNSEE</div>
        <div style={{ opacity: rise(f, 10), marginTop: 24, fontWeight: 500, fontSize: 44, color: GOLD }}>Dein Mietwagen. Deine Freiheit.</div>
        <div style={{ opacity: rise(f, 18), scale: 0.9 + 0.1 * rise(f, 18), marginTop: 90, display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="62" height="62" viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z" fill={GOLD} /></svg>
          <div style={{ fontWeight: 800, fontSize: 86, letterSpacing: "0.02em" }}>08022 915 20 33</div>
        </div>
        <div style={{ opacity: rise(f, 26), marginTop: 46, fontWeight: 500, fontSize: 40, lineHeight: 1.35, color: "#e9e9e9" }}>Sanktjohanserstraße 19<br />83707 Bad Wiessee</div>
        <div style={{ opacity: rise(f, 32), marginTop: 26, fontWeight: 600, fontSize: 42 }}>autovermietungamtegernsee.de</div>
        <div style={{ opacity: rise(f, 40), scale: pulse, marginTop: 70, padding: "28px 50px", borderRadius: 999, background: GOLD, color: "#16120a", fontWeight: 800, fontSize: 40 }}>Jetzt anrufen und Wunschauto reservieren!</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type Word = { t: string; s: number; e: number };
type Group = { start: number; end: number; words: Word[] };
export const Captions: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const g = (captions as Group[]).find((c) => t >= c.start && t < c.end);
  if (!g) return null;
  const a = interpolate(t, [g.start, g.start + 0.12, g.end - 0.1, g.end], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ top: 1560, height: 160, alignItems: "center", fontFamily: SANS }}>
      <div style={{ opacity: a, width: 880, textAlign: "center", fontWeight: 600, fontSize: 42, lineHeight: 1.18, color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
        {g.words.map((w, i) => <span key={i} style={{ opacity: t >= w.s ? 1 : 0.5 }}>{w.t} </span>)}
      </div>
    </AbsoluteFill>
  );
};

export const Spot: React.FC = () => {
  const { fps } = useVideoConfig();
  const fleetStart = 138, fleetLen = 48, priceStart = 426, priceLen = 51;
  const cuts = [138, ...FLEET.map((_, i) => fleetStart + i * fleetLen).slice(1), priceStart, ...PRICES.map((_, i) => priceStart + i * priceLen).slice(1), 630, 915, 1092];
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0d10" }}>
      <Sequence name="Einstieg" from={0} durationInFrames={138}><Shot whip={false}><Opening /></Shot></Sequence>
      {FLEET.map((c, i) => (
        <Sequence key={c.model} name={`Flotte ${c.model}`} from={fleetStart + i * fleetLen} durationInFrames={fleetLen}>
          <Shot dir={i % 2 ? -1 : 1}>{c.photo ? <><Showroom car={c.photo} dir={i % 2 ? -1 : 1} /><ModelLabel brand={c.brand} model={c.model} /></> : <TypeCard brand={c.brand} model={c.model} />}</Shot>
        </Sequence>
      ))}
      {PRICES.map((c, i) => (
        <Sequence key={`p${c.model}`} name={`Preis ${c.model}`} from={priceStart + i * priceLen} durationInFrames={priceLen}>
          <Shot dir={i % 2 ? -1 : 1}>{c.photo ? <><Showroom car={c.photo} dir={i % 2 ? -1 : 1} /><PriceTag price={c.price} model={c.model} /></> : <TypeCard brand="Mercedes-Benz" model="GLC" price={c.price} />}</Shot>
        </Sequence>
      ))}
      <Sequence name="Vorteile" from={630} durationInFrames={285}><Shot><Benefits /></Shot></Sequence>
      <Sequence name="Finale" from={915} durationInFrames={177}><Shot><Finale /></Shot></Sequence>
      <Sequence name="Endkarte" from={1092} durationInFrames={228}><Shot whip={false}><EndCard /></Shot></Sequence>
      <Sequence name="Untertitel" from={0} durationInFrames={1092} layout="none"><Captions /></Sequence>

      <Sequence name="Stimme" from={9} durationInFrames={40 * fps}><Audio src={staticFile("voice.mp3")} /></Sequence>
      <Audio src={staticFile("music.mp3")} volume={0.22} />
      {cuts.map((c, i) => <Sequence key={c} name={`SFX Schnitt ${i + 1}`} from={c - 5} durationInFrames={fps}><Audio src={staticFile("whoosh-short.mp3")} volume={0.1} /></Sequence>)}
      {[630 + 12, 630 + 144, 630 + 186].map((c, i) => <Sequence key={`b${c}`} name={`SFX Vorteil ${i + 1}`} from={c} durationInFrames={fps}><Audio src={staticFile("pop.mp3")} volume={0.22} /></Sequence>)}
      <Sequence name="SFX Preis" from={priceStart + 8} durationInFrames={2 * fps}><Audio src={staticFile("chime.mp3")} volume={0.2} /></Sequence>
      <Sequence name="SFX Endkarte" from={1092} durationInFrames={2 * fps}><Audio src={staticFile("impact-bass-1.mp3")} volume={0.25} /></Sequence>
    </AbsoluteFill>
  );
};
