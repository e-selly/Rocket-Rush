import { Composition, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Film, TOTAL } from "./Film";

for (const weight of ["400", "500", "600", "700", "800"]) {
  loadFont({ family: "Inter", url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`), weight });
}

export const RemotionRoot: React.FC = () => {
  return <Composition id="Schlafparalyse" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />;
};
