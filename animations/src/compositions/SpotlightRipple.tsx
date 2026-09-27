import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { MARGIN, WIDTH } from "../lib/constants";
import { Frame } from "../lib/Frame";
import { capBox, oare } from "../lib/fonts";
import { TAU } from "../lib/math";

const COLS = 16;
const ROWS = 14;
const TOP = 150;
const BOTTOM = 1370;
const CELL_W = (WIDTH - MARGIN * 2) / COLS;
const CELL_H = (BOTTOM - TOP) / ROWS;
const FONT_SIZE = 90;

const RADIUS = 150;
const TRAIL_SAMPLES = 32;

const PANGRAMS =
  "SPHINX OF BLACK QUARTZ JUDGE MY VOW THE FIVE BOXING WIZARDS JUMP QUICKLY PACK MY BOX WITH FIVE DOZEN LIQUOR JUGS HOW VEXINGLY QUICK DAFT ZEBRAS JUMP ";

const LETTERS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const char = PANGRAMS[i % PANGRAMS.length];
  return char === " " ? "·" : char;
});

/** Figure-eight path that closes on itself once per loop. */
const spotAt = (t: number) => ({
  x: WIDTH / 2 + 350 * Math.sin(TAU * t + 0.4),
  y: (TOP + BOTTOM) / 2 + 470 * Math.sin(TAU * 2 * t),
});

export const SpotlightRipple = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;

  const trail = Array.from({ length: TRAIL_SAMPLES }, (_, k) => ({
    ...spotAt(t - k / durationInFrames),
    strength: (1 - k / TRAIL_SAMPLES) ** 2,
  }));
  const spot = trail[0];

  return (
    <Frame background="#140d1c" labelColor="#b9a8cc" right="wght 100–900 · slnt 0 to −10">
      <div
        style={{
          position: "absolute",
          left: spot.x - 360,
          top: spot.y - 360,
          width: 720,
          height: 720,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168, 118, 255, 0.30) 0%, rgba(168, 118, 255, 0.08) 38%, rgba(168, 118, 255, 0) 65%)",
        }}
      />
      <AbsoluteFill>
        {LETTERS.map((char, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const cx = MARGIN + (col + 0.5) * CELL_W;
          const cy = TOP + (row + 0.5) * CELL_H;
          let influence = 0;
          for (const p of trail) {
            const d2 = (cx - p.x) ** 2 + (cy - p.y) ** 2;
            influence = Math.max(influence, Math.exp(-d2 / RADIUS ** 2) * p.strength);
          }
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: cx - CELL_W,
                top: cy - CELL_H / 2,
                width: CELL_W * 2,
                height: CELL_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: FONT_SIZE,
                color: interpolateColors(influence, [0, 0.45, 1], ["#3b2b4e", "#9a78d4", "#f7f0ff"]),
                transform: `scale(${1 + influence * 0.14})`,
              }}
            >
              <span style={{ ...oare(100 + 800 * influence, -10 * influence), ...capBox, display: "block" }}>{char}</span>
            </div>
          );
        })}
      </AbsoluteFill>
    </Frame>
  );
};
