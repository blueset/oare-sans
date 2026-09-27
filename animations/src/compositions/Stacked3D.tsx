import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame } from "../lib/Frame";
import { SLNT_MIN, WGHT_MAX, WGHT_MIN, capBox, oare } from "../lib/fonts";
import { TAU, pingPong } from "../lib/math";
import { useGlyphLayout } from "../lib/measure";

export type Stacked3DProps = { word: string };

const LAYERS = 36;
const LAYER_GAP = 7;
const MAX_FONT_SIZE = 330;
const MAX_WORD_WIDTH = 860;

export const Stacked3D = ({ word }: Stacked3DProps) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const layout = useGlyphLayout([word], WGHT_MAX);
  if (!layout) return null;

  const [{ chars, centers, width }] = layout;
  const fontSize = Math.min(MAX_FONT_SIZE, MAX_WORD_WIDTH / width);
  const t = frame / durationInFrames;

  const rotateY = 30 * Math.sin(TAU * t);
  const rotateX = 16 * Math.cos(TAU * t);
  // Midway through the loop the back of the stack leans into Oblique, twisting the extrusion.
  const twist = pingPong(t) ** 2;
  const depth = (LAYERS - 1) * LAYER_GAP;

  return (
    <Frame
      background="linear-gradient(180deg, #a3fbff 0%, #40e5ff 100%)"
      labelColor="#00355a"
      right={`wght ${WGHT_MIN}–${WGHT_MAX} · ${LAYERS} layers`}
    >
      <AbsoluteFill style={{ perspective: 2200, alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "relative",
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `translateY(30px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          }}
        >
          {Array.from({ length: LAYERS }, (_, i) => {
            const p = i / (LAYERS - 1);
            const color =
              i === 0 ? "#ffffff" : interpolateColors(p, [0, 0.35, 1], ["#d7fbff", "#1b8fc0", "#00406b"]);
            // Every layer keeps each glyph on its Black-weight center, so the extrusion tapers per letter.
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translateZ(${depth / 2 - i * LAYER_GAP}px)`,
                }}
              >
                {chars.map((ch, j) => (
                  <div
                    key={j}
                    style={{
                      position: "absolute",
                      left: (centers[j] - width / 2) * fontSize,
                      top: 0,
                      transform: "translate(-50%, -50%)",
                      fontSize,
                      whiteSpace: "pre",
                      color,
                      ...oare(WGHT_MIN + (WGHT_MAX - WGHT_MIN) * p, SLNT_MIN * twist * p),
                      ...capBox,
                    }}
                  >
                    {ch}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
