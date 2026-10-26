import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { LedPanel, Particles, Typer } from "./fx";
import { C, FONT, enter, glow, rise } from "./theme";

const Abs: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <AbsoluteFill style={{ top, height: "auto", alignItems: "center", fontFamily: FONT, color: C.ink, padding: "0 80px", textAlign: "center" }}>{children}</AbsoluteFill>
);
const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.dim }) => (
  <div style={{ fontWeight: 800, fontSize: 36, letterSpacing: "0.24em", color }}>{children}</div>
);
const Title: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 88, color = C.ink }) => (
  <div style={{ fontWeight: 900, fontSize: size, lineHeight: 1.04, letterSpacing: "-0.01em", color, textShadow: color === C.ink ? undefined : glow(color, 0.6) }}>{children}</div>
);
const useEnd = () => useVideoConfig().durationInFrames;

// 1 — Hook
export const Hook: React.FC = () => {
  const f = useCurrentFrame(); const end = useEnd();
  return (
    <>
      <LedPanel top={560} height={400} level={interpolate(f, [0, 60], [0.06, 0.18], { extrapolateRight: "clamp" })} />
      <Abs top={330}><div style={enter(f, -12, end)}><Typer text="Du willst Sachen verkaufen?" start={-10} cps={30} style={{ fontWeight: 800, fontSize: 64 }} /></div></Abs>
      <Abs top={600}><div style={{ ...enter(f, 46, end), fontWeight: 900, fontSize: 60, letterSpacing: "0.16em", textShadow: glow("#ffffff", 0.4) }}>SO FUNKTIONIERT</div></Abs>
      <Particles shape="word" size={960} cy={790} formAt={50} n={3200} seed={3} />
      <Abs top={900}><div style={{ ...enter(f, 72, end), fontWeight: 600, fontSize: 36, color: C.dim }}>früher „eBay Kleinanzeigen“</div></Abs>
    </>
  );
};

// 2 — Users counter on the LED wall
export const Users: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const end = useEnd();
  const u = interpolate(f, [6, 2.6 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const v = 32.8 * (1 - Math.pow(1 - u, 2.2));
  const col = u < 0.3 ? "#ffffff" : u < 0.6 ? C.orange : u < 0.9 ? C.purple : C.green;
  return (
    <>
      <div style={{ opacity: 1 - rise(f, end - 8, 8) }}><LedPanel top={520} height={440} level={0.12 + u * 0.88} /></div>
      <Abs top={380}><div style={enter(f, 0, end)}><Kicker color={C.ink}>JEDEN MONAT</Kicker></div></Abs>
      <Abs top={600}>
        <div style={{ ...enter(f, 2, end), fontWeight: 900, fontSize: 230, lineHeight: 1, color: col, textShadow: glow(col, 0.8), fontVariantNumeric: "tabular-nums" }}>{v.toFixed(1).replace(".", ",")}</div>
        <div style={{ ...enter(f, 4, end), fontWeight: 800, fontSize: 62, marginTop: 6 }}>Mio. Nutzer</div>
      </Abs>
      <Abs top={1040}><div style={{ ...enter(f, 2.4 * fps, end), fontWeight: 600, fontSize: 30, color: C.dim }}>Ø Jan–Jun 2026 · Angabe von Kleinanzeigen</div></Abs>
    </>
  );
};

// 3 — Step 1: create the ad
const Chip: React.FC<{ text: string; at: number; end: number; color?: string }> = ({ text, at, end, color = C.ink }) => {
  const f = useCurrentFrame();
  return <div style={{ ...enter(f, at, end, 20), padding: "16px 28px", borderRadius: 999, border: `3px solid ${color}`, fontWeight: 800, fontSize: 40, color, boxShadow: `0 0 18px ${color}55` }}>{text}</div>;
};
export const Step1: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const end = useEnd();
  return (
    <>
      <Abs top={290}><div style={enter(f, 0, end)}><Kicker>SCHRITT 1</Kicker></div></Abs>
      <Particles shape="camera" size={420} cy={600} seed={11} />
      <Abs top={850}><div style={enter(f, 8, end)}><Title>Anzeige aufgeben</Title></div></Abs>
      <Abs top={1000}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", width: 900 }}>
          <Chip text="Fotos" at={1.4 * fps} end={end} color={C.green} />
          <Chip text="Titel" at={2.1 * fps} end={end} />
          <Chip text="Beschreibung" at={2.6 * fps} end={end} />
          <Chip text="Preis" at={3.4 * fps} end={end} color={C.orange} />
        </div>
      </Abs>
    </>
  );
};

// 4 — Free for private sellers
export const Free: React.FC = () => {
  const f = useCurrentFrame(); const end = useEnd();
  return (
    <>
      <Particles shape="euro" size={380} cy={560} color={C.green} seed={21} />
      <Abs top={800}><div style={enter(f, 6, end)}><Title size={190} color={C.green}>0 €</Title></div></Abs>
      <Abs top={1010}><div style={enter(f, 12, end)}><Typer text="für Privatleute" start={14} style={{ fontWeight: 800, fontSize: 60 }} /></div></Abs>
      <Abs top={1100}><div style={{ ...enter(f, 30, end), fontWeight: 600, fontSize: 34, color: C.dim }}>bei einer normalen Anzeige</div></Abs>
    </>
  );
};

// 5 — VB = Verhandlungsbasis
export const Vb: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const end = useEnd();
  return (
    <>
      <LedPanel top={430} height={360} level={0.16} />
      <Abs top={330}><div style={enter(f, 0, end)}><Kicker color={C.orange}>TIPP</Kicker></div></Abs>
      <Abs top={430}><div style={{ ...enter(f, 2, end), scale: interpolate(f, [0, 10], [1.25, 1], { extrapolateRight: "clamp" }) }}><Title size={300} color={C.orange}>VB</Title></div></Abs>
      <Abs top={790}><Typer text="= Verhandlungsbasis" start={0.5 * fps} cps={28} style={{ fontWeight: 900, fontSize: 70 }} /></Abs>
      <Abs top={940}>
        <div style={{ ...enter(f, 2.0 * fps, end), display: "flex", alignItems: "center", gap: 26, padding: "26px 36px", borderRadius: 26, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.14)" }}>
          <div style={{ fontWeight: 700, fontSize: 30, color: C.dim }}>BEISPIEL</div>
          <div style={{ fontWeight: 800, fontSize: 46 }}>Fahrrad</div>
          <div style={{ fontWeight: 900, fontSize: 52, color: C.orange }}>120 € VB</div>
        </div>
        <div style={{ ...enter(f, 2.4 * fps, end), marginTop: 26, fontWeight: 700, fontSize: 40 }}>Preis ist <span style={{ color: C.orange }}>verhandelbar</span></div>
      </Abs>
    </>
  );
};

// 6 — Step 2: chat
const Bubble: React.FC<{ text: string; me?: boolean; at: number; end: number }> = ({ text, me, at, end }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ ...enter(f, at, end, 16), alignSelf: me ? "flex-end" : "flex-start", maxWidth: 680, padding: "24px 32px", borderRadius: 34, borderBottomRightRadius: me ? 8 : 34, borderBottomLeftRadius: me ? 34 : 8,
      background: me ? C.green : "rgba(255,255,255,0.12)", color: me ? "#04140a" : C.ink, fontWeight: 700, fontSize: 42, textAlign: "left", marginTop: 18 }}>{text}</div>
  );
};
export const Step2: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const end = useEnd();
  return (
    <>
      <Abs top={290}><div style={enter(f, 0, end)}><Kicker>SCHRITT 2</Kicker></div></Abs>
      <Particles shape="chat" size={360} cy={560} seed={31} />
      <Abs top={790}><div style={enter(f, 8, end)}><Title>Chat in der App</Title></div></Abs>
      <Abs top={930}>
        <div style={{ width: 880, display: "flex", flexDirection: "column" }}>
          <Bubble text="Hallo! Ist das noch zu haben?" at={0.9 * fps} end={end} />
          <Bubble text="Ja! Wann passt es dir?" me at={1.8 * fps} end={end} />
        </div>
      </Abs>
    </>
  );
};

// 7 — Step 3: hand-over
const Option: React.FC<{ title: string; sub: string; at: number; end: number; color: string }> = ({ title, sub, at, end, color }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ ...enter(f, at, end, 20), width: 420, padding: "34px 20px", borderRadius: 30, border: `3px solid ${color}`, background: "rgba(255,255,255,0.04)", boxShadow: `0 0 26px ${color}44` }}>
      <div style={{ fontWeight: 900, fontSize: 54, color }}>{title}</div>
      <div style={{ fontWeight: 600, fontSize: 32, color: C.dim, marginTop: 8 }}>{sub}</div>
    </div>
  );
};
export const Step3: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const end = useEnd();
  return (
    <>
      <Abs top={290}><div style={enter(f, 0, end)}><Kicker>SCHRITT 3</Kicker></div></Abs>
      <Particles shape="box" size={380} cy={570} color={C.orange} seed={41} />
      <Abs top={800}><div style={enter(f, 8, end)}><Title>Die Übergabe</Title></div></Abs>
      <Abs top={950}>
        <div style={{ display: "flex", gap: 30 }}>
          <Option title="Abholung" sub="persönlich treffen" at={1.6 * fps} end={end} color={C.ink} />
          <Option title="Versand" sub="per Paket" at={2.6 * fps} end={end} color={C.orange} />
        </div>
      </Abs>
    </>
  );
};

// 8 — "Sicher bezahlen" escrow flow
export const Secure: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const end = useEnd();
  const m = interpolate(f, [2.2 * fps, 3.4 * fps, 4.4 * fps, 5.4 * fps], [0, 0.5, 0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const nodes = ["Käufer", "Treuhand", "Verkäufer"];
  return (
    <>
      <Abs top={250}><div style={enter(f, 0, end)}><Kicker color={C.blue}>NUR BEIM VERSAND</Kicker></div></Abs>
      <Particles shape="shield" size={340} cy={500} color={C.blue} seed={51} />
      <Abs top={710}><div style={enter(f, 8, end)}><Title color={C.blue}>Sicher bezahlen</Title></div></Abs>
      <Abs top={880}>
        <div style={{ ...enter(f, 1.4 * fps, end), position: "relative", width: 900, height: 150 }}>
          <div style={{ position: "absolute", left: 90, right: 90, top: 46, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.18)" }} />
          <div style={{ position: "absolute", left: 90 + m * 720 - 22, top: 27, width: 44, height: 44, borderRadius: 22, background: C.green, boxShadow: glow(C.green, 0.5), color: "#04140a", fontWeight: 900, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>€</div>
          {nodes.map((n, i) => (
            <div key={n} style={{ position: "absolute", left: 90 + i * 360 - 150, width: 300, top: 92, fontWeight: 800, fontSize: 38, color: i === 1 ? C.blue : C.ink }}>{n}</div>
          ))}
        </div>
      </Abs>
      <Abs top={1070}><div style={{ ...enter(f, 3.0 * fps, end), fontWeight: 700, fontSize: 38, color: C.dim }}>Auszahlung erst nach Bestätigung</div></Abs>
      <Abs top={1150}><div style={{ ...enter(f, 4.6 * fps, end), padding: "16px 30px", borderRadius: 999, background: C.blue, color: "#03121a", fontWeight: 900, fontSize: 42 }}>Gebühr zahlt der Käufer</div></Abs>
    </>
  );
};

// 9 — Scam warning
export const Warning: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const end = useEnd();
  const shake = f < 12 ? Math.sin(f * 2.4) * 8 * (1 - f / 12) : 0;
  return (
    <>
      <Abs top={290}><div style={enter(f, 0, end)}><Kicker color={C.red}>GANZ WICHTIG</Kicker></div></Abs>
      <Particles shape="warning" size={360} cy={560} color={C.red} seed={61} />
      <Abs top={800}>
        <div style={{ ...enter(f, 6, end), translate: `${shake}px 0px` }}><Title color={C.red}>Nie über fremde<br />Links bezahlen</Title></div>
        <div style={{ ...enter(f, 1.6 * fps, end), marginTop: 30, fontWeight: 800, fontSize: 48 }}>Alles in der App lassen</div>
      </Abs>
    </>
  );
};

// 10 — Follow
export const Follow: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <>
      <Particles shape="star" size={360} cy={600} seed={71} />
      <Abs top={840}><Typer text="Folg mir für mehr" start={4} cps={24} cursor={false} style={{ fontWeight: 700, fontSize: 52 }} /></Abs>
      <Abs top={920}><div style={{ ...enter(f, 0.8 * fps), fontWeight: 900, fontSize: 104, color: C.green, textShadow: glow(C.green, 0.7) }}>Erklärungen</div></Abs>
      <Abs top={1060}><div style={{ ...enter(f, 1.4 * fps), fontWeight: 600, fontSize: 36, color: C.dim }}>wie diese</div></Abs>
    </>
  );
};
