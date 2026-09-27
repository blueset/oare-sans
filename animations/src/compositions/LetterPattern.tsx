import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { HEIGHT, WIDTH } from "../lib/constants";
import { Frame } from "../lib/Frame";
import { capBox, oare } from "../lib/fonts";
import { TAU, mod } from "../lib/math";

const LETTERS = ["S", "a", "g", "&"];
const CELL = 120;
const COLS = WIDTH / CELL;
const ROWS = HEIGHT / CELL;
const FONT_SIZE = 132;

// Radial weight waves per loop; equals LETTERS.length so every cell shows each letter once per loop.
const WAVES = LETTERS.length;
const WAVELENGTH = 430;
const SLANT_WAVES = 2;
const SLANT_WAVELENGTH = 760;

const BG = "#cfdbcf";
const INK = "#0b660b";

export const LetterPattern = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;

  return (
    <Frame background={BG} labelColor="#123312" right={LETTERS.join(" · ")}>
      <AbsoluteFill>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const cx = (col + 0.5) * CELL;
          const cy = (row + 0.5) * CELL;
          const r = Math.hypot(cx - WIDTH / 2, cy - HEIGHT / 2);

          const phase = r / WAVELENGTH - WAVES * t;
          const wght = 100 + 800 * (0.5 + 0.5 * Math.cos(TAU * phase));
          const slantPhase = (cx + cy) / SLANT_WAVELENGTH - SLANT_WAVES * t;
          const slnt = -10 * (0.5 + 0.5 * Math.cos(TAU * slantPhase));
          // The glyph swaps exactly when the wave trough (Thin) passes, which hides the cut.
          const letter = LETTERS[mod(Math.floor(-phase + 0.5), LETTERS.length)];

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: col * CELL,
                top: row * CELL,
                width: CELL,
                height: CELL,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: FONT_SIZE,
                color: INK,
              }}
            >
              <span style={{ ...oare(wght, slnt), ...capBox, display: "block" }}>{letter}</span>
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: `linear-gradient(180deg, ${BG} 0px, ${BG} 64px, rgba(207,219,207,0) 150px)` }}
      />
    </Frame>
  );
};
