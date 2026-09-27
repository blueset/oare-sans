import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HEIGHT, MARGIN } from "../lib/constants";
import { Frame } from "../lib/Frame";
import { INTER, SLNT_MIN, capBox, formatSlnt, oare } from "../lib/fonts";
import { clamp, mod } from "../lib/math";

const ROWS = [
  { word: "Sprint", wght: 900 },
  { word: "Swerve", wght: 700 },
  { word: "Rush", wght: 500 },
  { word: "Glide", wght: 300 },
  { word: "Drift", wght: 100 },
];

const TOP = 130;
const ROW_H = (HEIGHT - TOP - 60) / ROWS.length;
const FONT_SIZE = 200;
const TRAVEL = 1500;
const ROW_STAGGER = 0.07;
// Speed (px per frame) at which the slant reaches the full −10.
const FULL_LEAN_SPEED = 48;

const INK = "#141414";
const MUTED = "#a08c67";

/** Horizontal position over one loop: rush in and brake, rest, then accelerate away. */
const positionAt = (cycle: number) => {
  const c = mod(cycle, 1);
  if (c < 0.3) {
    return interpolate(c, [0, 0.3], [-TRAVEL, 0], { easing: Easing.out(Easing.cubic) });
  }
  if (c < 0.55) return 0;
  if (c < 0.85) {
    return interpolate(c, [0.55, 0.85], [0, TRAVEL], { easing: Easing.in(Easing.cubic) });
  }
  return TRAVEL;
};

const Streaks = ({ speed }: { speed: number }) => {
  const strength = clamp(speed / FULL_LEAN_SPEED);
  if (strength < 0.02) return null;
  const lines = [
    { y: 0.22, h: 5, len: 1 },
    { y: 0.45, h: 8, len: 0.7 },
    { y: 0.66, h: 4, len: 1.25 },
    { y: 0.86, h: 6, len: 0.85 },
  ];
  return (
    <>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            right: "100%",
            marginRight: 24 + i * 10,
            top: `${l.y * 100}%`,
            width: speed * 9 * l.len,
            height: l.h,
            borderRadius: l.h,
            background: `linear-gradient(90deg, rgba(160,140,103,0), ${MUTED})`,
            opacity: strength,
          }}
        />
      ))}
    </>
  );
};

export const SpeedLean = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <Frame background="linear-gradient(180deg, #f5e8a8 0%, #f9c97a 100%)" labelColor={INK} right="Slant follows speed">
      <AbsoluteFill>
        {ROWS.map((row, r) => {
          const cycle = frame / durationInFrames - r * ROW_STAGGER;
          const epsilon = 0.5 / durationInFrames;
          const x = positionAt(cycle);
          const speed = Math.max(
            0,
            (positionAt(cycle + epsilon) - positionAt(cycle - epsilon)) / (2 * epsilon * durationInFrames),
          );
          const slnt = SLNT_MIN * clamp(speed / FULL_LEAN_SPEED);
          const top = TOP + r * ROW_H;
          return (
            <div key={row.word}>
              <div
                style={{
                  position: "absolute",
                  top: top + 6,
                  left: MARGIN,
                  right: MARGIN,
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: INTER,
                  fontSize: 20,
                  color: MUTED,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <span>wght {row.wght}</span>
                <span>slnt {formatSlnt(slnt)}</span>
              </div>
              <div
                style={{
                  position: "absolute",
                  top,
                  height: ROW_H,
                  left: 0,
                  right: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 24,
                }}
              >
                <div style={{ position: "relative", transform: `translateX(${x}px)` }}>
                  <Streaks speed={speed} />
                  <div
                    style={{
                      ...oare(row.wght, slnt),
                      ...capBox,
                      fontSize: FONT_SIZE,
                      color: INK,
                      whiteSpace: "pre",
                    }}
                  >
                    {row.word}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </Frame>
  );
};
