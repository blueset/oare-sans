import { Composition, Folder } from "remotion";
import { FIT_TO_WIDTH_SECONDS, FitToWidth } from "./compositions/FitToWidth";
import { FLAGGER_DURATION, Flagger } from "./compositions/Flagger";
import { LetterPattern } from "./compositions/LetterPattern";
import { LETTERS_AS_WINDOWS_SECONDS, LettersAsWindows } from "./compositions/LettersAsWindows";
import { SpeedLean } from "./compositions/SpeedLean";
import { SPLIT_FLAP_DURATION, SPLIT_FLAP_FPS, SplitFlap } from "./compositions/SplitFlap";
import { SpotlightRipple } from "./compositions/SpotlightRipple";
import { Stacked3D } from "./compositions/Stacked3D";
import { WORLD_DURATION, WorldLanguages } from "./compositions/WorldLanguages";
import { FPS, HEIGHT, WIDTH } from "./lib/constants";

const size = { width: WIDTH, height: HEIGHT };

export const RemotionRoot = () => (
  <Folder name="Instagram-3x4">
    <Composition id="WorldLanguages" component={WorldLanguages} durationInFrames={WORLD_DURATION} fps={FPS} {...size} />
    <Composition
      id="SplitFlap"
      component={SplitFlap}
      durationInFrames={SPLIT_FLAP_DURATION}
      fps={SPLIT_FLAP_FPS}
      {...size}
    />
    <Composition id="SpotlightRipple" component={SpotlightRipple} durationInFrames={10 * FPS} fps={FPS} {...size} />
    <Composition
      id="FitToWidth"
      component={FitToWidth}
      durationInFrames={Math.round(FIT_TO_WIDTH_SECONDS * FPS)}
      fps={FPS}
      {...size}
    />
    <Composition id="SpeedLean" component={SpeedLean} durationInFrames={8 * FPS} fps={FPS} {...size} />
    <Composition
      id="Stacked3D"
      component={Stacked3D}
      durationInFrames={10 * FPS}
      fps={FPS}
      {...size}
      defaultProps={{ word: "Depth" }}
    />
    <Composition id="LetterPattern" component={LetterPattern} durationInFrames={10 * FPS} fps={FPS} {...size} />
    <Composition
      id="LettersAsWindows"
      component={LettersAsWindows}
      durationInFrames={Math.round(LETTERS_AS_WINDOWS_SECONDS * FPS)}
      fps={FPS}
      {...size}
      defaultProps={{ lines: ["OPEN", "YOUR", "EYES"], videoSrc: "" }}
    />
    <Composition id="Flagger" component={Flagger} durationInFrames={FLAGGER_DURATION} fps={FPS} {...size} />
  </Folder>
);
