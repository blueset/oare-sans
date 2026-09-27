import type { CSSProperties } from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame } from "../lib/Frame";
import { capBox, oare } from "../lib/fonts";
import { mod } from "../lib/math";

// Split-flaps flip fast, so this composition runs at 60 fps.
export const SPLIT_FLAP_FPS = 60;

const COLS = 10;
const ROWS = 6;
const TILE_W = 92;
const TILE_H = 150;
const GAP_X = 6;
const GAP_Y = 12;
const FONT_SIZE = 118;
const FLIP_FRAMES = 4;
const SLOT = Math.round(3.5 * SPLIT_FLAP_FPS);
const LABEL_DELAY = Math.round(0.5 * SPLIT_FLAP_FPS);

// `case` raises punctuation to capital height; `tnum` keeps the times aligned.
const FEATURES = '"case" 1, "tnum" 1';

type Message = { lines: string[]; wght: number; slnt: number; label: string };

const MESSAGES: Message[] = [
  { wght: 800, slnt: 0, label: "ExtraBold", lines: ["", "CONDENSED", "GEOMETRIC", "DISPLAY", "SANS-SERIF", ""] },
  { wght: 300, slnt: 0, label: "Light", lines: ["", "ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ&@?!", "0123456789", ""] },
  {
    wght: 600,
    slnt: 0,
    label: "SemiBold",
    lines: ["DEPARTURES", "08:45 OSLO", "09:10 RIGA", "09:35 LYON", "10:05 ŁÓDŹ", "11:20 KØGE"],
  },
  { wght: 400, slnt: -10, label: "Oblique", lines: ["", "VARIABLE", "9 WEIGHTS", "2 STYLES", "GF LATIN", "CORE"] },
];

export const SPLIT_FLAP_DURATION = SLOT * MESSAGES.length;

const FLICKER = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&@#?!%$€ÅÇÉÑÖØÜŁŚŽ");

const toGrid = (lines: string[]) =>
  Array.from({ length: ROWS }, (_, r) => {
    const chars = Array.from(lines[r] ?? "");
    const pad = Math.floor((COLS - chars.length) / 2);
    return Array.from({ length: COLS }, (_, c) => chars[c - pad] ?? " ");
  });

const GRIDS = MESSAGES.map((m) => toGrid(m.lines));

type Glyph = { char: string; wght: number; slnt: number };

/** The sequence of glyphs a tile flips through when moving from message k-1 to k. */
const flipSequence = (k: number, r: number, c: number): Glyph[] => {
  const prev = MESSAGES[mod(k - 1, MESSAGES.length)];
  const next = MESSAGES[k];
  const from: Glyph = { char: GRIDS[mod(k - 1, MESSAGES.length)][r][c], wght: prev.wght, slnt: prev.slnt };
  const to: Glyph = { char: GRIDS[k][r][c], wght: next.wght, slnt: next.slnt };
  if (from.char === " " && to.char === " ") return [from];
  const count = 5 + Math.floor(random(`n-${k}-${r}-${c}`) * 11);
  const flicker = Array.from({ length: count }, (_, i) => ({
    char: FLICKER[Math.floor(random(`f-${k}-${r}-${c}-${i}`) * FLICKER.length)],
    wght: next.wght,
    slnt: next.slnt,
  }));
  return [from, ...flicker, to];
};

const SEQUENCES = MESSAGES.map((_, k) =>
  Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => flipSequence(k, r, c))),
);

const DELAYS = MESSAGES.map((_, k) =>
  Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => c * 3 + r * 4 + Math.floor(random(`d-${k}-${r}-${c}`) * 10)),
  ),
);

const COLORS = { top: "#0c5d99", bottom: "#07518a", glyph: "#f3f6fa", seam: "rgba(0, 20, 40, 0.55)" };

const GlyphFace = ({ glyph }: { glyph: Glyph }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      height: TILE_H,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: COLORS.glyph,
      fontSize: FONT_SIZE,
      whiteSpace: "pre",
    }}
  >
    <span style={{ ...oare(glyph.wght, glyph.slnt, FEATURES), ...capBox, display: "block" }}>{glyph.char}</span>
  </div>
);

const Half = ({ glyph, half, style }: { glyph: Glyph; half: "top" | "bottom"; style?: CSSProperties }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      width: TILE_W,
      top: half === "top" ? 0 : TILE_H / 2,
      height: TILE_H / 2,
      overflow: "hidden",
      background: half === "top" ? COLORS.top : COLORS.bottom,
      borderRadius: half === "top" ? "8px 8px 0 0" : "0 0 8px 8px",
      backfaceVisibility: "hidden",
      ...style,
    }}
  >
    <div style={{ position: "absolute", left: 0, width: TILE_W, height: TILE_H, top: half === "top" ? 0 : -TILE_H / 2 }}>
      <GlyphFace glyph={glyph} />
    </div>
  </div>
);

const Tile = ({ sequence, elapsed }: { sequence: Glyph[]; elapsed: number }) => {
  const flips = sequence.length - 1;
  const step = Math.floor(elapsed / FLIP_FRAMES);
  const settled = elapsed < 0 || step >= flips;

  if (settled) {
    const glyph = elapsed < 0 ? sequence[0] : sequence[flips];
    return (
      <>
        <Half glyph={glyph} half="top" />
        <Half glyph={glyph} half="bottom" />
      </>
    );
  }

  const current = sequence[step];
  const next = sequence[step + 1];
  const phase = (elapsed - step * FLIP_FRAMES) / FLIP_FRAMES;
  const falling = phase < 0.5;
  const angle = falling ? -180 * phase : 90 - 180 * (phase - 0.5);
  const shade = falling ? 1 - phase * 0.6 : 0.7 + (phase - 0.5) * 0.6;

  return (
    <>
      <Half glyph={next} half="top" />
      <Half glyph={current} half="bottom" />
      {falling ? (
        <Half
          glyph={current}
          half="top"
          style={{ transformOrigin: "50% 100%", transform: `rotateX(${angle}deg)`, filter: `brightness(${shade})` }}
        />
      ) : (
        <Half
          glyph={next}
          half="bottom"
          style={{ transformOrigin: "50% 0%", transform: `rotateX(${angle}deg)`, filter: `brightness(${shade})` }}
        />
      )}
    </>
  );
};

export const SplitFlap = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = Math.floor(mod(frame, durationInFrames) / SLOT);
  const slotFrame = frame - k * SLOT;
  // Keep describing the outgoing message until most tiles have started flipping.
  const labelMessage = MESSAGES[slotFrame < LABEL_DELAY ? mod(k - 1, MESSAGES.length) : k];

  const boardW = COLS * TILE_W + (COLS - 1) * GAP_X;
  const boardH = ROWS * TILE_H + (ROWS - 1) * GAP_Y;

  return (
    <Frame
      background="#cdd4db"
      labelColor="#1f2328"
      right={`${labelMessage.label} ${FONT_SIZE} px`}
    >
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: boardW, height: boardH, marginTop: 40 }}>
          {SEQUENCES[k].map((row, r) =>
            row.map((sequence, c) => (
              <div
                key={`${r}-${c}`}
                style={{
                  position: "absolute",
                  left: c * (TILE_W + GAP_X),
                  top: r * (TILE_H + GAP_Y),
                  width: TILE_W,
                  height: TILE_H,
                  perspective: 500,
                  borderRadius: 8,
                  boxShadow: "0 6px 14px rgba(0, 40, 80, 0.22)",
                }}
              >
                <Tile sequence={sequence} elapsed={slotFrame - DELAYS[k][r][c]} />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: TILE_H / 2 - 1,
                    height: 2,
                    background: COLORS.seam,
                  }}
                />
              </div>
            )),
          )}
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
