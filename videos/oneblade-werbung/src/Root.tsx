import { Composition, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Ad } from "./Ad";

for (const weight of ["500", "700", "800", "900"]) {
  loadFont({ family: "Inter", url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`), weight });
}

export const RemotionRoot: React.FC = () => {
  return <Composition id="OneBladeWerbung" component={Ad} durationInFrames={28 * 30} fps={30} width={1080} height={1920} />;
};
