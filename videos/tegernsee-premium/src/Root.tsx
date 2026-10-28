import { Composition, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Spot } from "./Spot";
import { DURATION_3D, Spot3D } from "./Spot3D";

for (const weight of ["400", "500", "600", "700", "800"]) {
  loadFont({ family: "Inter", url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`), weight });
}
for (const weight of ["600", "700"]) {
  loadFont({ family: "Playfair Display", url: staticFile(`fonts/playfair-display-latin-${weight}-normal.woff2`), weight });
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="TegernseeSpot" component={Spot} durationInFrames={44 * 30} fps={30} width={1080} height={1920} />
      <Composition id="TegernseeSpot3D" component={Spot3D} durationInFrames={DURATION_3D} fps={30} width={1080} height={1920} />
    </>
  );
};
