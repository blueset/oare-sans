import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CONTENT_WIDTH, HEIGHT, WIDTH } from "../lib/constants";
import { Frame } from "../lib/Frame";
import { INTER, WGHT_MAX, WGHT_MIN, oare } from "../lib/fonts";
import { useWidthTable, weightForWidth, weightSteps } from "../lib/measure";

const WORDS = ["Institutionalization", "Accomplishments", "Underemployment", "Purposefulness", "Hypothesizing"];
const WEIGHTS = weightSteps(WGHT_MIN, WGHT_MAX, 25);

const LABEL_H = 26;
const LABEL_GAP = 10;
const ROW_GAP = 30;
const LINE_HEIGHT = 1.02;
const ACCENT = "#0d99ff";

// Seconds → how open the box is (1 = widest, 0 = narrowest that Thin can still fill).
const KEYFRAMES: [number, number][] = [
  [0, 1],
  [1, 1],
  [3, 0],
  [4.2, 0],
  [5.4, 0.55],
  [6.4, 0.3],
  [8.4, 1],
  [10, 1],
];

const Handle = ({ x, y }: { x: number; y: number }) => (
  <div
    style={{
      position: "absolute",
      left: x - 8,
      top: y - 8,
      width: 16,
      height: 16,
      background: "#ffffff",
      border: `2.5px solid ${ACCENT}`,
      boxSizing: "border-box",
    }}
  />
);

export const FitToWidth = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const table = useWidthTable(WORDS, WEIGHTS);
  if (!table) return null;

  const last = WEIGHTS.length - 1;
  const fontSizes = WORDS.map((_, i) => CONTENT_WIDTH / table.widths[i][last]);
  const minWidth = Math.max(...WORDS.map((_, i) => fontSizes[i] * table.widths[i][0]));

  const openness = interpolate(
    frame / fps,
    KEYFRAMES.map(([s]) => s),
    KEYFRAMES.map(([, v]) => v),
    { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const boxWidth = minWidth + (CONTENT_WIDTH - minWidth) * openness;
  const boxLeft = (WIDTH - boxWidth) / 2;

  const rowHeights = fontSizes.map((fs) => LABEL_H + LABEL_GAP + fs * LINE_HEIGHT);
  const stackHeight = rowHeights.reduce((a, b) => a + b, 0) + ROW_GAP * (WORDS.length - 1);
  const stackTop = (HEIGHT - stackHeight) / 2 + 30;

  let y = stackTop;
  const rows = WORDS.map((word, i) => {
    const top = y;
    y += rowHeights[i] + ROW_GAP;
    const wght = weightForWidth(table, i, boxWidth / fontSizes[i]);
    return { word, top, fontSize: fontSizes[i], wght };
  });

  const boxTop = stackTop - 18;
  const boxBottom = stackTop + stackHeight + 10;
  const midY = (boxTop + boxBottom) / 2;

  return (
    <Frame background="#f7f9f8" labelColor="#151515" right="Fit to width">
      <AbsoluteFill>
        {rows.map((row, i) => (
          <div key={row.word}>
            {i > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: row.top - ROW_GAP / 2,
                  height: 1.5,
                  background: "#8a8f8d",
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                top: row.top,
                left: boxLeft,
                width: boxWidth,
                display: "flex",
                justifyContent: "space-between",
                fontFamily: INTER,
                fontSize: 20,
                lineHeight: `${LABEL_H}px`,
                color: "#5f6563",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span>{Math.round(row.fontSize)} px</span>
              <span>wght {Math.round(row.wght)}</span>
            </div>
            <div
              style={{
                position: "absolute",
                top: row.top + LABEL_H + LABEL_GAP,
                left: WIDTH / 2,
                transform: "translateX(-50%)",
                whiteSpace: "pre",
                fontSize: row.fontSize,
                lineHeight: LINE_HEIGHT,
                color: "#151515",
                ...oare(row.wght),
              }}
            >
              {row.word}
            </div>
          </div>
        ))}

        <div
          style={{
            position: "absolute",
            left: boxLeft,
            top: boxTop,
            width: boxWidth,
            height: boxBottom - boxTop,
            outline: `2px solid ${ACCENT}`,
          }}
        />
        {[boxTop, midY, boxBottom].flatMap((hy) => [
          <Handle key={`l-${hy}`} x={boxLeft} y={hy} />,
          <Handle key={`r-${hy}`} x={boxLeft + boxWidth} y={hy} />,
        ])}
        <div
          style={{
            position: "absolute",
            left: WIDTH / 2,
            top: boxBottom + 18,
            transform: "translateX(-50%)",
            background: ACCENT,
            color: "#ffffff",
            fontFamily: INTER,
            fontWeight: 500,
            fontSize: 20,
            lineHeight: "20px",
            padding: "7px 12px",
            borderRadius: 6,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(boxWidth)} × {Math.round(boxBottom - boxTop)}
        </div>
      </AbsoluteFill>
    </Frame>
  );
};

// Exposed for Root so the composition length always matches the keyframes.
export const FIT_TO_WIDTH_SECONDS = KEYFRAMES[KEYFRAMES.length - 1][0];
