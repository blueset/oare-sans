import type { CSSProperties } from "react";
import { Video } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CONTENT_WIDTH, HEIGHT, WIDTH } from "../lib/constants";
import { Frame } from "../lib/Frame";
import { WGHT_MAX, WGHT_MIN, capBox, oare } from "../lib/fonts";
import { TAU, mod } from "../lib/math";
import { type GlyphLine, useGlyphLayout } from "../lib/measure";

export type LettersAsWindowsProps = {
  lines: string[];
  /** Optional footage shown through the letters: a file in public/ or a URL. Empty = generated gradients. */
  videoSrc: string;
};

const CAP_HEIGHT = 0.7;
const LINE_GAP = 46;
const MAX_STACK_HEIGHT = HEIGHT - 300;
const LINE_DELAY = 0.18;
const GLYPH_DELAY = 0.05;

// Seconds → weight. Windows open fully (Black), close to slits (Thin), and open again.
const KEYFRAMES: [number, number][] = [
  [0, WGHT_MAX],
  [1.2, WGHT_MAX],
  [3.4, WGHT_MIN],
  [4.6, WGHT_MIN],
  [6.8, WGHT_MAX],
  [8, WGHT_MAX],
];
export const LETTERS_AS_WINDOWS_SECONDS = KEYFRAMES[KEYFRAMES.length - 1][0];

const BLOBS = [
  { color: "0, 229, 255", size: 900, fx: 1, fy: 1, px: 0, py: 0.25, rx: 360, ry: 520 },
  { color: "255, 214, 0", size: 820, fx: 1, fy: 2, px: 0.35, py: 0.1, rx: 400, ry: 480 },
  { color: "255, 109, 0", size: 760, fx: 2, fy: 1, px: 0.6, py: 0.7, rx: 340, ry: 560 },
  { color: "255, 45, 149", size: 740, fx: 1, fy: 1, px: 0.5, py: 0.9, rx: 420, ry: 420 },
  { color: "124, 77, 255", size: 880, fx: 1, fy: 2, px: 0.8, py: 0.55, rx: 300, ry: 520 },
  { color: "41, 121, 255", size: 700, fx: 2, fy: 1, px: 0.15, py: 0.4, rx: 380, ry: 380 },
];

const GradientScene = ({ t }: { t: number }) => (
  <AbsoluteFill style={{ background: "#070a1c" }}>
    {BLOBS.map((b, i) => {
      const x = WIDTH / 2 + b.rx * Math.sin(TAU * (b.fx * t + b.px));
      const y = HEIGHT / 2 + b.ry * Math.sin(TAU * (b.fy * t + b.py));
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - b.size / 2,
            top: y - b.size / 2,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${b.color}, 1) 0%, rgba(${b.color}, 0.55) 30%, rgba(${b.color}, 0) 68%)`,
            mixBlendMode: "screen",
          }}
        />
      );
    })}
    <div
      style={{
        position: "absolute",
        top: -200,
        bottom: -200,
        width: 700,
        left: -1500 + (WIDTH + 3000) * t,
        background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))",
        transform: "rotate(18deg)",
      }}
    />
  </AbsoluteFill>
);

type PlacedLine = GlyphLine & { fontSize: number; top: number; left: number };

// Each line is sized so it spans the content width at Black; the whole stack shrinks if too tall.
const placeLines = (lines: GlyphLine[]): PlacedLine[] => {
  const heightOf = (sizes: number[]) =>
    sizes.reduce((sum, fs) => sum + fs * CAP_HEIGHT, 0) + LINE_GAP * (lines.length - 1);
  let sizes = lines.map((line) => CONTENT_WIDTH / line.width);
  const scale = Math.min(1, MAX_STACK_HEIGHT / heightOf(sizes));
  sizes = sizes.map((fs) => fs * scale);
  let top = (HEIGHT - heightOf(sizes)) / 2 + 24;
  return lines.map((line, i) => {
    const placed = { ...line, fontSize: sizes[i], top, left: (WIDTH - sizes[i] * line.width) / 2 };
    top += sizes[i] * CAP_HEIGHT + LINE_GAP;
    return placed;
  });
};

// Glyphs are drawn one by one around their Black-weight centers, so lighter weights narrow in place.
const Glyphs = ({
  lines,
  weightOf,
  style,
}: {
  lines: PlacedLine[];
  weightOf: (line: number, glyph: number) => number;
  style: CSSProperties;
}) => (
  <>
    {lines.flatMap((line, i) =>
      line.chars.map((ch, j) => (
        <div
          key={`${i}-${j}`}
          style={{
            position: "absolute",
            top: line.top,
            left: line.left + line.fontSize * line.centers[j],
            transform: "translateX(-50%)",
            fontSize: line.fontSize,
            whiteSpace: "pre",
            ...oare(weightOf(i, j)),
            ...capBox,
            ...style,
          }}
        >
          {ch}
        </div>
      )),
    )}
  </>
);

export const LettersAsWindows = ({ lines, videoSrc }: LettersAsWindowsProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const layout = useGlyphLayout(lines, WGHT_MAX);
  if (!layout) return null;

  const placed = placeLines(layout);
  const weightOf = (line: number, glyph: number) =>
    interpolate(
      mod(frame / fps - line * LINE_DELAY - glyph * GLYPH_DELAY, LETTERS_AS_WINDOWS_SECONDS),
      KEYFRAMES.map(([s]) => s),
      KEYFRAMES.map(([, w]) => w),
      { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
  const t = frame / durationInFrames;

  return (
    <Frame background="#000000" labelColor="#bdbdbd" right={`wght ${Math.round(weightOf(0, 0))}`}>
      <AbsoluteFill style={{ isolation: "isolate" }}>
        {videoSrc ? (
          <Video
            src={videoSrc.startsWith("http") ? videoSrc : staticFile(videoSrc)}
            muted
            loop
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <GradientScene t={t} />
        )}
        {/*
          Multiplied over the scene: black hides it, white letters reveal it, and the dim Black-weight
          letters behind them show a faint "frosted" glimpse of each window's full size.
        */}
        <AbsoluteFill style={{ background: "#000000", mixBlendMode: "multiply" }}>
          <Glyphs lines={placed} weightOf={() => WGHT_MAX} style={{ color: "#1c1c1c" }} />
          <Glyphs lines={placed} weightOf={weightOf} style={{ color: "#ffffff" }} />
        </AbsoluteFill>
      </AbsoluteFill>
    </Frame>
  );
};
