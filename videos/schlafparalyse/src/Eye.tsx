import { useEffect, useMemo, useRef } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const R = (i: number, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

// extreme close-up of an eye in moonlight, drawn procedurally.
// open: 0 closed .. 1 wide; gaze: [-1..1, -1..1]; pupil: 0 small .. 1 dilated
export const Eye: React.FC<{ open: number; gaze: [number, number]; pupil: number; zoom: number; stripeShift: number }> = ({ open, gaze, pupil, zoom, stripeShift }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const grain = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 540; c.height = 960;
    const g = c.getContext("2d")!; const img = g.createImageData(540, 960);
    for (let i = 0; i < img.data.length; i += 4) { const v = 110 + R(i, 3) * 60; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0); return c;
  }, []);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    const W = 1080, H = 1920, cx = 540, cy = 930, ew = 430; // half eye width
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    g.translate(cx, cy); g.scale(zoom, zoom); g.rotate(-0.06); g.translate(-cx, -cy);

    // skin
    const sk = g.createRadialGradient(cx - 60, cy - 120, 50, cx, cy, 900);
    sk.addColorStop(0, "#6f5446"); sk.addColorStop(0.45, "#3d2c25"); sk.addColorStop(1, "#0b0807");
    g.fillStyle = sk; g.fillRect(-600, -600, W + 1200, H + 1200);
    // brow
    g.save(); g.lineCap = "round";
    for (let i = 0; i < 260; i++) {
      const t = R(i, 7), x = cx - 420 + t * 820, y = cy - 400 - Math.sin(t * Math.PI) * 90 + (R(i, 8) - 0.5) * 50;
      g.strokeStyle = `rgba(20,12,8,${0.5 + R(i, 9) * 0.5})`; g.lineWidth = 3 + R(i, 10) * 3;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 30, y - 18, x + 60 + R(i, 11) * 30, y - 8 + (t - 0.5) * 30); g.stroke();
    }
    g.restore();
    // upper lid crease + lower bag
    g.strokeStyle = "rgba(15,9,7,0.38)"; g.lineWidth = 22; g.filter = "blur(16px)";
    g.beginPath(); g.moveTo(cx - ew - 20, cy - 10); g.bezierCurveTo(cx - 200, cy - 260, cx + 220, cy - 270, cx + ew + 30, cy - 40); g.stroke();
    g.strokeStyle = "rgba(15,9,7,0.35)"; g.lineWidth = 30;
    g.beginPath(); g.moveTo(cx - ew + 40, cy + 120); g.bezierCurveTo(cx - 160, cy + 230, cx + 200, cy + 230, cx + ew - 20, cy + 110); g.stroke();
    g.filter = "none";

    // eye opening (almond); upper lid control rises with `open`
    const up = interpolate(open, [0, 1], [cy + 40, cy - 330]);
    const lo = cy + 150;
    const almond = new Path2D();
    almond.moveTo(cx - ew, cy + 30);
    almond.bezierCurveTo(cx - 220, up, cx + 220, up, cx + ew, cy + 10);
    almond.bezierCurveTo(cx + 230, lo, cx - 220, lo, cx - ew, cy + 30);
    almond.closePath();
    if (open > 0.02) {
      g.save(); g.clip(almond);
      const sc = g.createRadialGradient(cx, cy + 20, 40, cx, cy + 20, ew);
      sc.addColorStop(0, "#a9a7ad"); sc.addColorStop(0.55, "#7d7679"); sc.addColorStop(1, "#2a2223");
      g.fillStyle = sc; g.fillRect(cx - ew, cy - 350, ew * 2, 520);
      // veins
      g.lineWidth = 1.6;
      for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1, y0 = cy - 60 + R(i, 2) * 160, x0 = cx + side * (ew - 10);
        g.strokeStyle = `rgba(150,40,40,${0.18 + R(i, 3) * 0.25})`;
        g.beginPath(); g.moveTo(x0, y0);
        let x = x0, y = y0;
        for (let k = 0; k < 5; k++) { x -= side * (25 + R(i * 7 + k, 4) * 35); y += (R(i * 5 + k, 5) - 0.5) * 30; g.lineTo(x, y); }
        g.stroke();
      }
      // iris
      const ix = cx + gaze[0] * 120, iy = cy + 25 + gaze[1] * 40, ir = 158;
      const irg = g.createRadialGradient(ix, iy, 10, ix, iy, ir);
      irg.addColorStop(0, "#3a2614"); irg.addColorStop(0.35, "#7a5a32"); irg.addColorStop(0.75, "#4e3620"); irg.addColorStop(1, "#1a110a");
      g.fillStyle = irg; g.beginPath(); g.arc(ix, iy, ir, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 360; i++) {
        const a = (i / 360) * Math.PI * 2 + R(i, 6) * 0.02, r0 = ir * (0.3 + R(i, 7) * 0.15), r1 = ir * (0.75 + R(i, 8) * 0.25);
        g.strokeStyle = R(i, 9) > 0.5 ? `rgba(190,150,95,${0.12 + R(i, 10) * 0.25})` : `rgba(20,12,6,${0.15 + R(i, 10) * 0.3})`;
        g.lineWidth = 1 + R(i, 11) * 2;
        g.beginPath(); g.moveTo(ix + Math.cos(a) * r0, iy + Math.sin(a) * r0); g.lineTo(ix + Math.cos(a + 0.03) * r1, iy + Math.sin(a + 0.03) * r1); g.stroke();
      }
      g.strokeStyle = "rgba(10,6,3,0.85)"; g.lineWidth = 10; g.beginPath(); g.arc(ix, iy, ir - 4, 0, Math.PI * 2); g.stroke();
      // pupil
      const pr = interpolate(pupil, [0, 1], [42, 82]);
      const pg = g.createRadialGradient(ix, iy, pr * 0.2, ix, iy, pr * 1.05);
      pg.addColorStop(0, "#020202"); pg.addColorStop(0.92, "#050403"); pg.addColorStop(1, "rgba(5,4,3,0)");
      g.fillStyle = pg; g.beginPath(); g.arc(ix, iy, pr * 1.05, 0, Math.PI * 2); g.fill();
      // window reflection with blinds + catchlight
      g.save(); g.translate(ix - 62, iy - 66); g.rotate(-0.12);
      for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(205,220,255,${0.55 - k * 0.04})`; g.fillRect(0, k * 9, 46, 5); }
      g.restore();
      g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.arc(ix + 52, iy - 40, 6, 0, Math.PI * 2); g.fill();
      // lid shadow on the eyeball
      const ls = g.createLinearGradient(0, up + 60, 0, up + 230);
      ls.addColorStop(0, "rgba(10,6,5,0.9)"); ls.addColorStop(1, "rgba(10,6,5,0)");
      g.fillStyle = ls; g.fillRect(cx - ew, cy - 360, ew * 2, 560);
      const cs = g.createRadialGradient(cx, cy, ew * 0.55, cx, cy, ew * 1.05);
      cs.addColorStop(0, "rgba(0,0,0,0)"); cs.addColorStop(1, "rgba(0,0,0,0.65)");
      g.fillStyle = cs; g.fillRect(cx - ew, cy - 360, ew * 2, 560);
      g.restore();
      // wet lower lid line
      g.strokeStyle = "rgba(230,170,160,0.35)"; g.lineWidth = 5;
      g.beginPath(); g.moveTo(cx - ew + 30, cy + 40); g.bezierCurveTo(cx - 200, lo - 6, cx + 200, lo - 6, cx + ew - 30, cy + 22); g.stroke();
    }
    // lid edge + lashes
    g.strokeStyle = "rgba(12,7,5,0.95)"; g.lineWidth = 12; g.lineCap = "round";
    g.beginPath(); g.moveTo(cx - ew, cy + 30); g.bezierCurveTo(cx - 220, up, cx + 220, up, cx + ew, cy + 10); g.stroke();
    const bz = (t: number, p0: number, p1: number, p2: number, p3: number) => (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3;
    for (let i = 0; i < 120; i++) {
      const t = 0.04 + (i / 120) * 0.92 + (R(i, 12) - 0.5) * 0.008;
      const x = bz(t, cx - ew, cx - 220, cx + 220, cx + ew), y = bz(t, cy + 30, up, up, cy + 10);
      const len = (40 + R(i, 13) * 45) * (0.4 + Math.sin(t * Math.PI) * 0.8), dir = (t - 0.5) * 1.6;
      g.strokeStyle = `rgba(8,5,4,${0.75 + R(i, 14) * 0.25})`; g.lineWidth = 2.2 + R(i, 15) * 1.6;
      g.beginPath(); g.moveTo(x, y);
      if (open > 0.2) g.quadraticCurveTo(x + dir * len * 0.5, y - len * 0.75, x + dir * len, y - len * 0.9);
      else g.quadraticCurveTo(x + dir * len * 0.4, y + len * 0.55, x + dir * len * 0.9, y + len * 0.75);
      g.stroke();
    }
    for (let i = 0; i < 50; i++) {
      const t = 0.1 + (i / 50) * 0.8, x = bz(t, cx - ew, cx - 220, cx + 220, cx + ew), y = bz(t, cy + 30, lo, lo, cy + 10);
      g.strokeStyle = "rgba(10,6,5,0.6)"; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (t - 0.5) * 20, y + 14, x + (t - 0.5) * 40, y + 22 + R(i, 16) * 10); g.stroke();
    }
    // moonlight through blinds: cool stripes over everything
    g.save(); g.globalCompositeOperation = "screen"; g.filter = "blur(18px)";
    g.translate(cx, cy); g.rotate(-0.5); g.translate(-cx, -cy);
    for (let k = -8; k < 10; k++) {
      const y = cy + k * 120 + stripeShift;
      g.fillStyle = "rgba(110,140,210,0.3)"; g.fillRect(-400, y, 1900, 56);
    }
    g.restore(); g.filter = "none";
    // pores / grain
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 0.22; g.globalCompositeOperation = "overlay"; g.drawImage(grain, 0, 0, W, H);
    g.globalAlpha = 1; g.globalCompositeOperation = "multiply";
    g.fillStyle = "rgba(150,165,205,1)"; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "source-over";
    const vg = g.createRadialGradient(cx, cy, 250, cx, cy, 1150);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.85)");
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }, [open, gaze, pupil, zoom, stripeShift, grain]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} style={{ width: "100%", height: "100%", filter: "blur(0.8px) contrast(1.1) brightness(1.15)" }} /></AbsoluteFill>;
};

// helper for the scene timing (frames relative to the shot)
export const EyeShot: React.FC<{ openAt: number }> = ({ openAt }) => {
  const f = useCurrentFrame();
  const o1 = interpolate(f, [openAt, openAt + 4], [0, 0.35], clamp);
  const o2 = interpolate(f, [openAt + 9, openAt + 14], [0, 0.65], clamp);
  const open = Math.min(1, o1 + o2);
  const dart = f > openAt + 30 ? Math.sin((f - openAt - 30) * 0.18) * 0.55 : 0;
  return <Eye open={open} gaze={[dart, -0.1]} pupil={interpolate(f, [openAt, openAt + 40], [0.2, 0.85], clamp)} zoom={interpolate(f, [0, 80], [1.0, 1.12], clamp)} stripeShift={f * 0.6} />;
};
