import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BrazilMap } from "../BrazilMap";
import { C, FONT, count, de, enter, rise } from "../theme";

const Stack: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <AbsoluteFill style={{ top: top + 90, height: "auto", alignItems: "center", fontFamily: FONT, color: C.ink, padding: "0 80px" }}>{children}</AbsoluteFill>
);
const Kicker: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.yellow, style }) => (
  <div style={{ fontWeight: 800, fontSize: 34, letterSpacing: "0.22em", color, textTransform: "uppercase", ...style }}>{children}</div>
);
const Headline: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 96, style }) => (
  <div style={{ fontWeight: 900, fontSize: size, lineHeight: 1.02, textAlign: "center", letterSpacing: "-0.01em", ...style }}>{children}</div>
);

// 1 — Hook: Brazil draws itself
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <AbsoluteFill style={{ alignItems: "center", top: 560 }}>
        <div style={{ scale: interpolate(f, [0, 3.4 * fps], [0.92, 1.04]) }}>
          <BrazilMap size={760} draw={rise(f, 0, 1.4 * fps)} fill={rise(f, 0.9 * fps, 20)} glow={rise(f, 1.2 * fps, 20)} />
        </div>
      </AbsoluteFill>
      <Stack top={250}>
        <div style={enter(f, 0)}><Kicker>Stichwahl · 25. Oktober 2026</Kicker></div>
        <div style={{ ...enter(f, 4), marginTop: 26 }}><Headline size={104}>BRASILIEN<br />HAT GEWÄHLT</Headline></div>
      </Stack>
    </>
  );
};

// 2 — The result
const Row: React.FC<{ name: string; value: number; color: string; start: number; win?: boolean }> = ({ name, value, color, start, win }) => {
  const f = useCurrentFrame();
  const v = count(f, start, 50, value);
  return (
    <div style={{ ...enter(f, start - 6), width: 920, marginTop: 46 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontWeight: 900, fontSize: 64 }}>{name}{win ? <span style={{ fontSize: 34, marginLeft: 18, color: C.bg, background: C.green, padding: "6px 16px", borderRadius: 12, verticalAlign: "middle" }}>SIEG</span> : null}</div>
        <div style={{ fontWeight: 900, fontSize: 112, color, fontVariantNumeric: "tabular-nums" }}>{de(v)}<span style={{ fontSize: 60 }}> %</span></div>
      </div>
      <div style={{ height: 26, borderRadius: 13, background: C.line, overflow: "hidden", marginTop: 10 }}>
        <div style={{ height: "100%", width: `${v}%`, background: color, borderRadius: 13 }} />
      </div>
    </div>
  );
};
export const Result: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <Stack top={330}>
      <div style={enter(f, 0, durationInFrames)}><Kicker>Endergebnis Stichwahl</Kicker></div>
      <div style={enter(f, 0, durationInFrames)}>
        <Row name="LULA" value={51.8} color={C.green} start={0.3 * fps} win />
        <Row name="F. BOLSONARO" value={48.2} color={C.yellow} start={4.3 * fps} />
      </div>
      <div style={{ ...enter(f, 4.6 * fps, durationInFrames), marginTop: 60, fontSize: 30, fontWeight: 500, color: C.dim }}>Quelle: Oberstes Wahlgericht (TSE), gerundet</div>
    </Stack>
  );
};

// 3 — Margin
export const Margin: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const v = count(f, 0.5 * fps, 1.4 * fps, 4.4);
  return (
    <Stack top={420}>
      <div style={enter(f, 0, durationInFrames)}><Kicker>Vorsprung</Kicker></div>
      <div style={{ ...enter(f, 3, durationInFrames), marginTop: 20 }}>
        <Headline size={210} style={{ color: C.green, fontVariantNumeric: "tabular-nums" }}>+{de(v)}</Headline>
      </div>
      <div style={{ ...enter(f, 8, durationInFrames), marginTop: 6 }}><Headline size={84}>MILLIONEN<br />STIMMEN</Headline></div>
    </Stack>
  );
};

// 4 — Historic fourth term
export const Historic: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const years = ["2002", "2006", "2022", "2026"];
  return (
    <Stack top={300}>
      <div style={enter(f, 0, durationInFrames)}><Kicker>Erstmals in Brasilien</Kicker></div>
      <div style={{ ...enter(f, 3, durationInFrames), display: "flex", alignItems: "center", gap: 30, marginTop: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 300, color: C.yellow, lineHeight: 1 }}>4.</div>
        <Headline size={78} style={{ textAlign: "left" }}>DEMO-<br />KRATISCHE<br />WAHL</Headline>
      </div>
      <div style={{ display: "flex", gap: 22, marginTop: 40 }}>
        {years.map((y, i) => {
          const on = rise(f, (0.6 + i * 0.55) * fps, 10);
          return (
            <div key={y} style={{ ...enter(f, (0.4 + i * 0.55) * fps, durationInFrames, 20), width: 200, padding: "22px 0", borderRadius: 22, textAlign: "center",
              background: `rgba(25,194,107,${0.12 + 0.5 * on * (i === 3 ? 1 : 0.35)})`, border: `2px solid ${i === 3 ? C.green : C.line}`, fontWeight: 800, fontSize: 44 }}>{y}</div>
          );
        })}
      </div>
      <div style={{ ...enter(f, 2.8 * fps, durationInFrames), marginTop: 46, fontSize: 40, fontWeight: 700, color: C.dim }}>Lula ist 80 Jahre alt</div>
    </Stack>
  );
};

// 5 — The twist
export const Twist: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const stamp = rise(f, 2, 8);
  const shake = f < 14 ? Math.sin(f * 2.7) * 10 * (1 - f / 14) : 0;
  return (
    <Stack top={380}>
      <div style={enter(f, 0, durationInFrames)}><Kicker color={C.red}>Doch dann</Kicker></div>
      <div style={{ marginTop: 34, opacity: stamp * (1 - rise(f, durationInFrames - 8, 8)), scale: interpolate(stamp, [0, 1], [1.4, 1]), rotate: "-4deg", translate: `${shake}px 0px`,
        border: `8px solid ${C.red}`, borderRadius: 26, padding: "26px 40px" }}>
        <Headline size={88} style={{ color: C.red }}>ERKENNT<br />ERGEBNIS<br />NICHT AN</Headline>
      </div>
      <div style={{ ...enter(f, 2.3 * fps, durationInFrames), marginTop: 56 }}><Headline size={60}>Bolsonaro fordert<br /><span style={{ color: C.yellow }}>Annullierung der Wahl</span></Headline></div>
    </Stack>
  );
};

// 6 — The accusation: polls open two hours longer
export const Clock: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const h = interpolate(f, [1.2 * fps, 4.2 * fps], [17, 19], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hourA = ((h % 12) / 12) * 360, minA = ((h % 1) * 360);
  const R = 230;
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [R + (R - 34) * Math.sin((a * Math.PI) / 180), R - (R - 34) * Math.cos((a * Math.PI) / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M ${R} ${R} L ${x0} ${y0} A ${R - 34} ${R - 34} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
  };
  return (
    <Stack top={250}>
      <div style={enter(f, 0, durationInFrames)}><Kicker>Sein Vorwurf</Kicker></div>
      <div style={{ ...enter(f, 3, durationInFrames), marginTop: 18 }}><Headline size={64}>Wahllokale länger offen</Headline></div>
      <div style={{ ...enter(f, 6, durationInFrames), marginTop: 40, position: "relative" }}>
        <svg width={R * 2} height={R * 2}>
          <circle cx={R} cy={R} r={R - 6} fill="rgba(255,255,255,0.05)" stroke={C.ink} strokeWidth={6} />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={R} y1={18} x2={R} y2={i % 3 === 0 ? 52 : 40} stroke={C.ink} strokeWidth={i % 3 === 0 ? 7 : 4} transform={`rotate(${i * 30} ${R} ${R})`} />
          ))}
          {h > 17.01 ? <path d={arc(150, hourA)} fill={C.yellow} fillOpacity={0.35} /> : null}
          <line x1={R} y1={R} x2={R} y2={R - 120} stroke={C.ink} strokeWidth={14} strokeLinecap="round" transform={`rotate(${hourA} ${R} ${R})`} />
          <line x1={R} y1={R} x2={R} y2={R - 180} stroke={C.yellow} strokeWidth={8} strokeLinecap="round" transform={`rotate(${minA} ${R} ${R})`} />
          <circle cx={R} cy={R} r={14} fill={C.ink} />
        </svg>
      </div>
      <div style={{ ...enter(f, 3.2 * fps, durationInFrames), marginTop: 30, display: "flex", gap: 24, alignItems: "baseline" }}>
        <div style={{ fontWeight: 900, fontSize: 120, color: C.yellow }}>+2 STD.</div>
      </div>
      <div style={{ ...enter(f, 3.6 * fps, durationInFrames), fontSize: 38, fontWeight: 600, color: C.dim }}>17:00 → 19:00 Uhr (Brasília)</div>
    </Stack>
  );
};

// 7 — Context: who asked, who decided
const Card: React.FC<{ label: string; text: React.ReactNode; start: number; end: number; accent: string }> = ({ label, text, start, end, accent }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ ...enter(f, start, end), width: 920, marginTop: 40, padding: "38px 44px", borderRadius: 30, background: C.card, borderLeft: `10px solid ${accent}` }}>
      <div style={{ fontWeight: 800, fontSize: 32, letterSpacing: "0.18em", color: accent }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 60, lineHeight: 1.12, marginTop: 12 }}>{text}</div>
    </div>
  );
};
export const Context: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <Stack top={360}>
      <div style={enter(f, 0, durationInFrames)}><Kicker>Der Hintergrund</Kicker></div>
      <Card label="ANTRAG" text={<>kam von <span style={{ color: C.yellow }}>Lulas Lager</span></>} start={4} end={durationInFrames} accent={C.yellow} />
      <Card label="RICHTER CRISTIANO ZANIN" text={<>war früher <span style={{ color: C.yellow }}>Lulas Anwalt</span></>} start={1.6 * fps} end={durationInFrames} accent={C.red} />
    </Stack>
  );
};

// 8 — Assessment
export const Odds: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const needle = interpolate(rise(f, 0.4 * fps, 1.6 * fps), [0, 1], [-80, -58]);
  const R = 300;
  return (
    <Stack top={380}>
      <div style={enter(f, 0, durationInFrames)}><Kicker>Annullierung?</Kicker></div>
      <div style={{ ...enter(f, 4, durationInFrames), marginTop: 40 }}>
        <svg width={R * 2} height={R + 30}>
          <defs>
            <linearGradient id="g" x1="0" x2="1"><stop offset="0%" stopColor={C.green} /><stop offset="50%" stopColor={C.yellow} /><stop offset="100%" stopColor={C.red} /></linearGradient>
          </defs>
          <path d={`M 30 ${R} A ${R - 30} ${R - 30} 0 0 1 ${2 * R - 30} ${R}`} fill="none" stroke="url(#g)" strokeWidth={46} strokeLinecap="round" opacity={0.85} />
          <line x1={R} y1={R} x2={R} y2={70} stroke={C.ink} strokeWidth={12} strokeLinecap="round" transform={`rotate(${needle} ${R} ${R})`} />
          <circle cx={R} cy={R} r={22} fill={C.ink} />
        </svg>
      </div>
      <div style={{ ...enter(f, 1.4 * fps, durationInFrames), marginTop: 30 }}><Headline size={96} style={{ color: C.green }}>UNWAHR-<br />SCHEINLICH</Headline></div>
      <div style={{ ...enter(f, 2.0 * fps, durationInFrames), marginTop: 26, fontSize: 38, fontWeight: 600, color: C.dim }}>laut Beobachtern · bei 4,4 Mio. Stimmen Vorsprung</div>
    </Stack>
  );
};

// 9 — What's next
export const Next: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <Stack top={460}>
      <div style={enter(f, 0, durationInFrames)}><Kicker>Wie geht es weiter?</Kicker></div>
      <div style={{ ...enter(f, 3, durationInFrames), marginTop: 40, width: 520, borderRadius: 36, overflow: "hidden", background: C.card, textAlign: "center" }}>
        <div style={{ background: C.green, padding: "22px 0", fontWeight: 900, fontSize: 52, color: C.bg }}>AMTSANTRITT</div>
        <div style={{ padding: "34px 0 40px", fontWeight: 900, fontSize: 96 }}>JANUAR<br /><span style={{ color: C.yellow }}>2027</span></div>
      </div>
    </Stack>
  );
};

// 10 — Question to the viewer
export const Question: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const pulse = (k: number) => 1 + 0.03 * Math.sin((f / fps) * 4 + k);
  return (
    <Stack top={360}>
      <div style={enter(f, 0, durationInFrames)}><Kicker>Was meinst du?</Kicker></div>
      <div style={{ ...enter(f, 6, durationInFrames), marginTop: 50, width: 900, padding: "40px 0", borderRadius: 30, textAlign: "center", border: `5px solid ${C.green}`, scale: pulse(0) }}>
        <Headline size={70}>BERECHTIGTER<br />PROTEST</Headline>
      </div>
      <div style={{ ...enter(f, 12, durationInFrames), marginTop: 26, fontWeight: 900, fontSize: 48, color: C.dim }}>ODER</div>
      <div style={{ ...enter(f, 18, durationInFrames), marginTop: 26, width: 900, padding: "40px 0", borderRadius: 30, textAlign: "center", border: `5px solid ${C.red}`, scale: pulse(2) }}>
        <Headline size={70}>SCHLECHTER<br />VERLIERER</Headline>
      </div>
      <div style={{ ...enter(f, 1.6 * fps, durationInFrames), marginTop: 50, fontSize: 40, fontWeight: 700 }}>Schreib es in die Kommentare</div>
    </Stack>
  );
};
