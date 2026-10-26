import { useMemo } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import world from "world-atlas/countries-50m.json";

// Outline of Brazil from Natural Earth (world-atlas), drawn as an SVG path
export const useBrazilPath = (size: number) =>
  useMemo(() => {
    const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
    const all = feature(topo, topo.objects.countries);
    const br = all.features.find((f) => f.id === "076")!;
    const proj = geoMercator().fitSize([size, size], br);
    return geoPath(proj)(br) ?? "";
  }, [size]);

export const BrazilMap: React.FC<{ size: number; draw: number; fill: number; glow?: number; color?: string }> = ({ size, draw, fill, glow = 0, color = "#19c26b" }) => {
  const d = useBrazilPath(size);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="brfill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor="#0b6b3e" stopOpacity={0.35} />
        </linearGradient>
      </defs>
      <path d={d} fill="url(#brfill)" fillOpacity={fill} stroke={color} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw}
        style={{ filter: glow ? `drop-shadow(0 0 ${18 * glow}px ${color})` : undefined }} />
    </svg>
  );
};
