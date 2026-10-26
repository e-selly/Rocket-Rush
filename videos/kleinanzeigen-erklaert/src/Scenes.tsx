import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { LedPanel, Particles, Typer } from "./fx";
import { GlowBlob, MorphToast, Phone, SceneWrap, WhipWords } from "./motion";
import { C, FONT, enter, glow } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });

const Abs: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <AbsoluteFill style={{ top, height: "auto", alignItems: "center", fontFamily: FONT, color: C.ink, padding: "0 80px", textAlign: "center" }}>{children}</AbsoluteFill>
);
const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.dim }) => (
  <div style={{ fontWeight: 800, fontSize: 36, letterSpacing: "0.24em", color }}>{children}</div>
);
const Title: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 88, color = C.ink }) => (
  <div style={{ fontWeight: 900, fontSize: size, lineHeight: 1.04, letterSpacing: "-0.01em", color, textShadow: color === C.ink ? undefined : glow(color, 0.6) }}>{children}</div>
);

// 1 — Hook: words whip in, then the name assembles from particles
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <GlowBlob color={C.purple} x={[300, 760]} y={[520, 820]} size={1000} strength={0.4} />
      <SceneWrap noEnter>
        <LedPanel top={600} height={380} level={interpolate(f, [0, 60], [0.06, 0.2], clamp)} />
        <WhipWords words={["Du", "willst", "Sachen", "verkaufen?"]} start={-9} gap={5} size={86} hi={3} top={300} />
        <WhipWords words={["SO", "FUNKTIONIERT"]} start={44} gap={4} size={56} top={640} />
        <Particles shape="word" size={960} cy={810} formAt={50} n={3200} seed={3} />
        <Abs top={920}><div style={enter(f, 72)}><div style={{ fontWeight: 600, fontSize: 36, color: C.dim }}>früher „eBay Kleinanzeigen“</div></div></Abs>
      </SceneWrap>
    </>
  );
};

// 2 — Users counter on the LED wall
export const Users: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const u = interpolate(f, [6, 2.6 * fps], [0, 1], clamp);
  const v = 32.8 * (1 - Math.pow(1 - u, 2.2));
  const col = u < 0.3 ? "#ffffff" : u < 0.6 ? C.orange : u < 0.9 ? C.purple : C.green;
  const hit = interpolate(f, [2.6 * fps, 2.6 * fps + 6, 2.6 * fps + 16], [1, 1.12, 1], clamp);
  return (
    <>
      <GlowBlob color={col} x={[540, 540]} y={[760, 740]} size={1100} strength={0.35} />
      <SceneWrap>
        <LedPanel top={520} height={440} level={0.12 + u * 0.88} />
        <Abs top={380}><Kicker color={C.ink}>JEDEN MONAT</Kicker></Abs>
        <Abs top={590}>
          <div style={{ fontWeight: 900, fontSize: 230, lineHeight: 1, color: col, textShadow: glow(col, 0.8), fontVariantNumeric: "tabular-nums", scale: hit,
            filter: u < 0.95 ? `blur(${(1 - u) * 1.5}px)` : undefined }}>{v.toFixed(1).replace(".", ",")}</div>
          <div style={{ fontWeight: 800, fontSize: 62, marginTop: 6 }}>Mio. Nutzer</div>
        </Abs>
        <Abs top={1040}><div style={{ ...enter(f, 2.4 * fps), fontWeight: 600, fontSize: 30, color: C.dim }}>Ø Jan–Jun 2026 · Angabe von Kleinanzeigen</div></Abs>
      </SceneWrap>
    </>
  );
};

// 3 — Step 1: a phone rises, the listing form fills itself in
const Field: React.FC<{ label: string; children: React.ReactNode; at: number; active?: boolean }> = ({ label, children, at, active }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ ...enter(f, at, undefined, 16), margin: "14px 26px 0", padding: "14px 18px", borderRadius: 18, background: "rgba(255,255,255,0.06)", border: `2px solid ${active ? C.green : "rgba(255,255,255,0.1)"}`, textAlign: "left" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.dim }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4, minHeight: 36 }}>{children}</div>
    </div>
  );
};
export const Step1: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const tiles = ["#3dff7a", "#4fd1ff", "#ffa53d"];
  const lines = interpolate(f, [2.8 * fps, 3.5 * fps], [0, 1], clamp);
  const press = interpolate(f, [4.2 * fps, 4.35 * fps, 4.5 * fps], [1, 0.92, 1], clamp);
  return (
    <>
      <GlowBlob color={C.green} x={[380, 620]} y={[760, 700]} size={950} strength={0.45} />
      <SceneWrap tilt={0.6}>
        <Abs top={200}><Kicker>SCHRITT 1</Kicker></Abs>
        <Phone cy={770}>
          <div style={{ padding: "70px 26px 0", fontWeight: 900, fontSize: 36, textAlign: "left" }}>Anzeige aufgeben</div>
          <div style={{ display: "flex", gap: 14, margin: "20px 26px 0" }}>
            {tiles.map((c, i) => (
              <div key={c} style={{ width: 112, height: 112, borderRadius: 20, scale: pop(f, 1.4 * fps + i * 5), background: `linear-gradient(135deg, ${c}, ${c}33)`, boxShadow: `0 0 24px ${c}66` }} />
            ))}
          </div>
          <Field label="Titel" at={1.9 * fps} active={f > 2.0 * fps && f < 2.8 * fps}><Typer text="Fahrrad, 28 Zoll" start={2.0 * fps} cps={22} cursor={false} /></Field>
          <Field label="Beschreibung" at={2.6 * fps} active={f > 2.8 * fps && f < 3.6 * fps}>
            {[0.9, 0.7, 0.8].map((w, i) => <div key={i} style={{ height: 10, borderRadius: 5, marginTop: 8, background: "rgba(255,255,255,0.28)", width: `${Math.max(0, Math.min(1, lines * 3 - i)) * w * 100}%` }} />)}
          </Field>
          <Field label="Preis" at={3.4 * fps} active={f > 3.6 * fps}>
            <span style={{ color: C.orange }}><Typer text="120 € VB" start={3.6 * fps} cps={16} cursor={false} style={{ display: "inline" }} /></span>
          </Field>
          <div style={{ ...enter(f, 3.9 * fps), margin: "24px 26px 0", padding: "20px 0", borderRadius: 999, background: C.green, color: "#04140a", fontWeight: 900, fontSize: 30, scale: press, boxShadow: glow(C.green, 0.4) }}>Anzeige aufgeben</div>
        </Phone>
      </SceneWrap>
    </>
  );
};

// 4 — Free for private sellers
export const Free: React.FC = () => {
  const f = useCurrentFrame();
  const sweep = interpolate(f, [16, 40], [-30, 130], clamp);
  return (
    <>
      <GlowBlob color={C.green} x={[540, 520]} y={[640, 700]} size={900} strength={0.4} />
      <SceneWrap>
        <Particles shape="euro" size={380} cy={540} color={C.green} seed={21} />
        <Abs top={780}>
          <div style={{ ...enter(f, 6), scale: pop(f, 6) * 0.2 + 0.8 }}>
            <div style={{ fontWeight: 900, fontSize: 200, lineHeight: 1, color: "transparent", backgroundImage: `linear-gradient(100deg, ${C.green} ${sweep - 20}%, #eafff1 ${sweep}%, ${C.green} ${sweep + 20}%)`, backgroundClip: "text", WebkitBackgroundClip: "text", filter: `drop-shadow(0 0 22px ${C.green})` }}>0 €</div>
          </div>
        </Abs>
        <Abs top={1010}><Typer text="für Privatleute" start={14} style={{ fontWeight: 800, fontSize: 60 }} /></Abs>
        <Abs top={1100}><div style={{ ...enter(f, 30), fontWeight: 600, fontSize: 34, color: C.dim }}>bei einer normalen Anzeige</div></Abs>
      </SceneWrap>
    </>
  );
};

// 5 — VB: listings in perspective with a rack-focus onto the one with "VB"
const LISTINGS = [
  { t: "Sofa, grau", p: "80 € VB", c: "#c64dff" },
  { t: "Fahrrad, 28 Zoll", p: "120 € VB", c: "#3dff7a" },
  { t: "Stehlampe", p: "15 €", c: "#4fd1ff" },
  { t: "Kinderwagen", p: "60 € VB", c: "#ffa53d" },
];
export const Vb: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const focus = interpolate(f, [0.6 * fps, 1.6 * fps], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const scroll = interpolate(f, [0, 3.6 * fps], [40, -40]);
  return (
    <>
      <GlowBlob color={C.orange} x={[300, 700]} y={[900, 860]} size={950} strength={0.4} />
      <SceneWrap tilt={0.4}>
        <Abs top={330}><div style={{ ...enter(f, 0), display: "flex", alignItems: "baseline", gap: 26 }}><Title size={150} color={C.orange}>VB</Title><Typer text="= Verhandlungsbasis" start={0.3 * fps} cps={30} style={{ fontWeight: 900, fontSize: 52 }} /></div></Abs>
        <AbsoluteFill style={{ perspective: 1200 }}>
          <div style={{ position: "absolute", left: 150, top: 600 + scroll, width: 780, transform: "rotateX(22deg) rotateY(-14deg) rotateZ(2deg)", transformStyle: "preserve-3d" }}>
            {LISTINGS.map((l, i) => {
              const isF = i === 1; const k = isF ? focus : 0;
              const vb = l.p.includes("VB");
              return (
                <div key={l.t} style={{ ...enter(f, 4 + i * 4, undefined, 40), display: "flex", alignItems: "center", gap: 22, marginTop: 18, padding: "18px 24px", borderRadius: 26,
                  background: isF ? `rgba(255,255,255,${0.06 + 0.06 * k})` : "rgba(255,255,255,0.05)", border: `2px solid ${isF ? `rgba(255,165,61,${0.2 + 0.8 * k})` : "rgba(255,255,255,0.08)"}`,
                  scale: 1 + 0.08 * k, translate: `${-40 * k}px 0px`, filter: !isF ? `blur(${focus * 4}px)` : undefined, opacity: !isF ? 1 - 0.45 * focus : 1, boxShadow: isF ? `0 0 ${50 * k}px rgba(255,165,61,${0.45 * k})` : undefined }}>
                  <div style={{ width: 92, height: 92, borderRadius: 20, background: `linear-gradient(135deg, ${l.c}, ${l.c}22)`, flexShrink: 0 }} />
                  <div style={{ flex: 1, textAlign: "left", fontFamily: FONT }}>
                    <div style={{ fontWeight: 800, fontSize: 36, color: C.ink }}>{l.t}</div>
                    <div style={{ fontWeight: 900, fontSize: 40, color: vb ? C.orange : C.ink, marginTop: 2, textShadow: isF ? glow(C.orange, 0.4 * k) : undefined }}>{l.p}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
        <Abs top={1250}><div style={{ ...enter(f, 2.2 * fps), fontWeight: 800, fontSize: 44 }}>Preis ist <span style={{ color: C.orange }}>verhandelbar</span></div></Abs>
      </SceneWrap>
    </>
  );
};

// 6 — Step 2: chat on the phone, a notification drops in
const Bubble: React.FC<{ text: string; me?: boolean; at: number }> = ({ text, me, at }) => {
  const f = useCurrentFrame();
  const p = pop(f, at);
  return (
    <div style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: 300, padding: "16px 20px", borderRadius: 26, borderBottomRightRadius: me ? 6 : 26, borderBottomLeftRadius: me ? 26 : 6,
      background: me ? C.green : "rgba(255,255,255,0.12)", color: me ? "#04140a" : C.ink, fontWeight: 700, fontSize: 28, textAlign: "left", marginTop: 14, scale: p, opacity: Math.min(1, p * 1.5), transformOrigin: me ? "right bottom" : "left bottom" }}>{text}</div>
  );
};
export const Step2: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const drop = interpolate(f, [0.5 * fps, 0.5 * fps + 10, 1.6 * fps, 1.6 * fps + 8], [-160, 0, 0, -160], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const dots = f > 1.25 * fps && f < 1.8 * fps;
  return (
    <>
      <GlowBlob color={C.green} x={[700, 380]} y={[640, 800]} size={950} strength={0.42} />
      <SceneWrap tilt={0.6}>
        <Abs top={200}><Kicker>SCHRITT 2</Kicker></Abs>
        <Phone cy={770} delay={-6} screenOn={4}>
          <div style={{ position: "absolute", left: 18, right: 18, top: 60 + drop, padding: "16px 18px", borderRadius: 22, background: "rgba(40,40,46,0.96)", display: "flex", gap: 14, alignItems: "center", zIndex: 2, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: C.green, flexShrink: 0 }} />
            <div style={{ textAlign: "left" }}><div style={{ fontWeight: 800, fontSize: 24 }}>Neue Nachricht</div><div style={{ fontSize: 22, color: C.dim }}>Ist das noch zu haben?</div></div>
          </div>
          <div style={{ padding: "70px 26px 16px", fontWeight: 900, fontSize: 32, textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Fahrrad, 28 Zoll · <span style={{ color: C.orange }}>120 € VB</span></div>
          <div style={{ display: "flex", flexDirection: "column", padding: "10px 24px" }}>
            <Bubble text="Hallo! Ist das noch zu haben?" at={0.9 * fps} />
            {dots ? <div style={{ alignSelf: "flex-end", marginTop: 14, padding: "14px 20px", borderRadius: 22, background: "rgba(61,255,122,0.25)", fontSize: 30, letterSpacing: 4 }}>{"•".repeat(1 + (Math.floor(f / 5) % 3))}</div> : null}
            <Bubble text="Ja! Wann passt es dir?" me at={1.8 * fps} />
            <Bubble text="Morgen um 18 Uhr?" at={2.4 * fps} />
          </div>
        </Phone>
      </SceneWrap>
    </>
  );
};

// 7 — Step 3: hand-over options flip in
const Option: React.FC<{ title: string; sub: string; at: number; color: string }> = ({ title, sub, at, color }) => {
  const f = useCurrentFrame();
  const u = interpolate(f, [at, at + 14], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return (
    <div style={{ width: 420, padding: "34px 20px", borderRadius: 30, border: `3px solid ${color}`, background: "rgba(255,255,255,0.04)", boxShadow: `0 0 ${30 * u}px ${color}55`, opacity: u, transform: `perspective(900px) rotateY(${(1 - u) * 85}deg)` }}>
      <div style={{ fontWeight: 900, fontSize: 54, color }}>{title}</div>
      <div style={{ fontWeight: 600, fontSize: 32, color: C.dim, marginTop: 8 }}>{sub}</div>
    </div>
  );
};
export const Step3: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <>
      <GlowBlob color={C.orange} x={[540, 560]} y={[560, 760]} size={900} strength={0.4} />
      <SceneWrap>
        <Abs top={250}><Kicker>SCHRITT 3</Kicker></Abs>
        <Particles shape="box" size={380} cy={560} color={C.orange} seed={41} />
        <Abs top={800}><div style={enter(f, 8)}><Title>Die Übergabe</Title></div></Abs>
        <Abs top={950}>
          <div style={{ display: "flex", gap: 30 }}>
            <Option title="Abholung" sub="persönlich treffen" at={1.6 * fps} color={C.ink} />
            <Option title="Versand" sub="per Paket" at={2.6 * fps} color={C.orange} />
          </div>
        </Abs>
      </SceneWrap>
    </>
  );
};

// 8 — "Sicher bezahlen" escrow flow with a glowing coin and trail
export const Secure: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const m = interpolate(f, [2.2 * fps, 3.4 * fps, 4.4 * fps, 5.4 * fps], [0, 0.5, 0.5, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const nodes = ["Käufer", "Treuhand", "Verkäufer"];
  const trail = [0.06, 0.12, 0.18, 0.24];
  return (
    <>
      <GlowBlob color={C.blue} x={[400, 680]} y={[560, 780]} size={950} strength={0.42} />
      <SceneWrap>
        <Abs top={250}><Kicker color={C.blue}>NUR BEIM VERSAND</Kicker></Abs>
        <Particles shape="shield" size={340} cy={500} color={C.blue} seed={51} />
        <Abs top={710}><WhipWords words={["Sicher", "bezahlen"]} start={6} size={92} hi={1} color={C.blue} top={0} /></Abs>
        <Abs top={890}>
          <div style={{ ...enter(f, 1.4 * fps), position: "relative", width: 900, height: 150 }}>
            <div style={{ position: "absolute", left: 90, right: 90, top: 46, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.18)" }} />
            <div style={{ position: "absolute", left: 90, top: 46, height: 6, borderRadius: 3, width: m * 720, background: C.green, boxShadow: glow(C.green, 0.4) }} />
            {trail.map((d, i) => (
              <div key={i} style={{ position: "absolute", left: 90 + Math.max(0, m - d * 0.4) * 720 - 14, top: 35, width: 28, height: 28, borderRadius: 14, background: C.green, opacity: 0.35 - i * 0.08, filter: "blur(4px)" }} />
            ))}
            <div style={{ position: "absolute", left: 90 + m * 720 - 24, top: 25, width: 48, height: 48, borderRadius: 24, background: C.green, boxShadow: glow(C.green, 0.7), color: "#04140a", fontWeight: 900, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>€</div>
            {nodes.map((n, i) => (
              <div key={n} style={{ position: "absolute", left: 90 + i * 360 - 150, width: 300, top: 92, fontWeight: 800, fontSize: 38, color: i === 1 ? C.blue : C.ink, scale: Math.abs(m - i * 0.5) < 0.08 ? 1.12 : 1 }}>{n}</div>
            ))}
          </div>
        </Abs>
        <Abs top={1070}><div style={{ ...enter(f, 3.0 * fps), fontWeight: 700, fontSize: 38, color: C.dim }}>Auszahlung erst nach Bestätigung</div></Abs>
        <Abs top={1150}><div style={{ opacity: pop(f, 4.6 * fps), scale: 0.6 + 0.4 * pop(f, 4.6 * fps), padding: "16px 30px", borderRadius: 999, background: C.blue, color: "#03121a", fontWeight: 900, fontSize: 42, boxShadow: glow(C.blue, 0.4) }}>Gebühr zahlt der Käufer</div></Abs>
      </SceneWrap>
    </>
  );
};

// 9 — Scam warning with an RGB-split glitch and a struck-out fake link
export const Warning: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const g = f < 14 || (f > 40 && f < 46) ? 1 : 0;
  const j = g ? Math.sin(f * 3.1) * 8 : 0;
  const strike = interpolate(f, [1.6 * fps, 1.9 * fps], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return (
    <>
      <GlowBlob color={C.red} x={[540, 540]} y={[560, 700]} size={1000} strength={0.45} />
      <SceneWrap>
        <Abs top={250}><Kicker color={C.red}>GANZ WICHTIG</Kicker></Abs>
        <Particles shape="warning" size={340} cy={530} color={C.red} seed={61} />
        <Abs top={760}>
          <div style={{ translate: `${j}px 0px`, textShadow: g ? "6px 0 0 rgba(0,200,255,0.8), -6px 0 0 rgba(255,0,80,0.8)" : glow(C.red, 0.6), fontWeight: 900, fontSize: 84, lineHeight: 1.04, color: C.red }}>Nie über fremde<br />Links bezahlen</div>
        </Abs>
        <Abs top={1000}>
          <div style={{ ...enter(f, 0.9 * fps), position: "relative", padding: "20px 34px", borderRadius: 20, background: "rgba(255,75,92,0.12)", border: "2px solid rgba(255,75,92,0.5)", fontFamily: "monospace", fontSize: 38, color: "#ffb3bd" }}>
            zahlung-sicher-xy.link/pay
            <div style={{ position: "absolute", left: 20, top: "50%", height: 6, borderRadius: 3, width: `${strike * 92}%`, background: C.red, boxShadow: glow(C.red, 0.4) }} />
          </div>
          <div style={{ ...enter(f, 2.2 * fps), marginTop: 30, fontWeight: 800, fontSize: 48 }}>Alles in der App lassen</div>
        </Abs>
      </SceneWrap>
    </>
  );
};

// 10 — Follow: kinetic words, then the line smears into a toast that collapses into a dot
export const Follow: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const smear = interpolate(f, [1.2 * fps, 1.2 * fps + 8], [0, 1], clamp);
  return (
    <>
      <GlowBlob color={C.green} x={[300, 760]} y={[820, 760]} size={1000} strength={0.5} />
      <Particles shape="star" size={300} cy={500} seed={71} />
      <AbsoluteFill style={{ opacity: 1 - smear, scale: `${1 - smear * 0.7} ${1 - smear * 0.85}`, filter: smear > 0 ? `blur(${smear * 8}px)` : undefined }}>
        <WhipWords words={["Folg", "mir", "für", "mehr"]} start={2} gap={4} size={64} top={760} />
        <WhipWords words={["Erklärungen"]} start={18} size={104} hi={0} top={850} />
      </AbsoluteFill>
      <MorphToast start={1.2 * fps} top={900} title="Verkauft!" body="Fahrrad, 28 Zoll · 120 €" />
    </>
  );
};
