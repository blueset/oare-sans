import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { FPS } from "../lib/constants";
import { Frame } from "../lib/Frame";
import { INTER, oare } from "../lib/fonts";
import { mod } from "../lib/math";

type Entry = { language: string; word: string; wght: number; slnt: number };

// Only characters covered by Oare Sans (GF Latin Core) are used here.
const WORDS: Entry[] = [
  { language: "English", word: "World", wght: 900, slnt: 0 },
  { language: "Spanish", word: "Mundo", wght: 200, slnt: -10 },
  { language: "French", word: "Monde", wght: 600, slnt: 0 },
  { language: "German", word: "Welt", wght: 100, slnt: 0 },
  { language: "Swedish", word: "Värld", wght: 800, slnt: -10 },
  { language: "Polish", word: "Świat", wght: 400, slnt: 0 },
  { language: "Czech", word: "Svět", wght: 900, slnt: -10 },
  { language: "Hungarian", word: "Világ", wght: 300, slnt: 0 },
  { language: "Turkish", word: "Dünya", wght: 700, slnt: 0 },
  { language: "Afrikaans", word: "Wêreld", wght: 150, slnt: -10 },
  { language: "Albanian", word: "Botë", wght: 900, slnt: 0 },
  { language: "Catalan", word: "Món", wght: 500, slnt: -10 },
  { language: "Mandarin (Pinyin)", word: "Shìjiè", wght: 250, slnt: 0 },
  { language: "Hindi (romanized)", word: "Duniyā", wght: 800, slnt: 0 },
  { language: "Persian (romanized)", word: "Jahān", wght: 100, slnt: -10 },
  { language: "Turkmen", word: "Dünýä", wght: 650, slnt: 0 },
];

const BACKGROUND_WORDS = [
  ...WORDS.map((w) => w.word),
  "Heimur", "Lume", "Sekai", "Cîhan", "Honua", "Pasaulis", "Pasaule", "Dinja",
  "Dunia", "Mondo", "Mundua", "Domhan", "Máilbmi", "Maailma", "Svijet", "Mundus",
  "Umhlaba", "Ayé", "Pacha", "Verden", "Wereld", "Segye", "Daigdig", "Dunyo", "Byd",
];

const SLOT = Math.round(0.9 * FPS);
export const WORLD_DURATION = SLOT * WORDS.length;

const MAIN_SIZE = 300;
const GLYPH_OVERHANG = 0.3;
const ROW_SIZE = 104;
const ROW_PITCH = 136;
const ROW_COUNT = 11;
const ROW_WORDS = 9;

const GRADIENTS = [
  "linear-gradient(180deg, #00eaf6 10%, #00b4d2 90%)",
  "linear-gradient(180deg, #ffe033 10%, #ff9f00 90%)",
];

const rows = Array.from({ length: ROW_COUNT }, (_, r) =>
  Array.from({ length: ROW_WORDS }, (_, i) => ({
    word: BACKGROUND_WORDS[Math.floor(random(`word-${r}-${i}`) * BACKGROUND_WORDS.length)],
    wght: 100 + Math.round(random(`wght-${r}-${i}`) * 8) * 100,
    slnt: random(`slnt-${r}-${i}`) > 0.6 ? -10 : 0,
  })),
);

const BackgroundRows = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;

  return (
    <AbsoluteFill
      style={{
        maskImage:
          "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.12) 7%, rgba(0,0,0,0.9) 15%, rgba(0,0,0,0.35) 32%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.35) 68%, rgba(0,0,0,0.9) 100%)",
      }}
    >
      {rows.map((words, r) => {
        const leftward = r % 2 === 0;
        // Content is duplicated, so shifting by half of its width loops seamlessly.
        const x = leftward ? -50 * t : -50 + 50 * t;
        const copy = (key: string) =>
          words.map((w, i) => (
            <span key={`${key}-${i}`} style={{ ...oare(w.wght, w.slnt), paddingRight: "0.32em" }}>
              {w.word}
            </span>
          ));
        return (
          <div
            key={r}
            style={{
              position: "absolute",
              top: 18 + r * ROW_PITCH,
              left: 0,
              display: "inline-flex",
              whiteSpace: "pre",
              fontSize: ROW_SIZE,
              lineHeight: 1,
              color: "#1d3a50",
              transform: `translateX(${x}%)`,
            }}
          >
            {copy("a")}
            {copy("b")}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const MainWord = ({ entry, index, localFrame }: { entry: Entry; index: number; localFrame: number }) => {
  const chars = Array.from(entry.word);
  const startWeight = entry.wght >= 500 ? 100 : 900;
  const labelOpacity = interpolate(localFrame, [2, 8, SLOT - 6, SLOT], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          height: MAIN_SIZE * 1.3,
          // Clip only vertically (for the roll), so oblique overhangs past the first/last advance still show.
          overflowX: "visible",
          overflowY: "clip",
          fontSize: MAIN_SIZE,
          lineHeight: 1.3,
          whiteSpace: "pre",
          marginTop: -60,
        }}
      >
        {chars.map((char, j) => {
          const enter = interpolate(localFrame - j * 1.6, [0, 11], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const exit = interpolate(localFrame - (SLOT - 8) - j * 1.2, [0, 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });
          const y = (1 - enter) * 105 - exit * 105;
          const wght = startWeight + (entry.wght - startWeight) * enter;
          return (
            <span
              key={j}
              style={{
                ...oare(wght, entry.slnt),
                display: "inline-block",
                transform: `translateY(${y}%)`,
                // background-clip: text only paints inside the box, so widen it past the advance
                // (without affecting spacing) to cover glyph parts that lean outside it.
                padding: `0 ${GLYPH_OVERHANG}em`,
                margin: `0 -${GLYPH_OVERHANG}em`,
                backgroundImage: GRADIENTS[index % 2],
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: "50%",
          marginTop: MAIN_SIZE * 0.52,
          fontFamily: INTER,
          fontSize: 30,
          color: "#9aa4ab",
          opacity: labelOpacity,
          letterSpacing: "0.02em",
        }}
      >
        {entry.language}
      </div>
    </AbsoluteFill>
  );
};

export const WorldLanguages = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <Frame background="#161616" labelColor="#c9c9c9" right={`“World” in ${WORDS.length} languages`}>
      <BackgroundRows />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 62% 22% at 50% 47%, rgba(22,22,22,0.92), rgba(22,22,22,0))",
        }}
      />
      {WORDS.map((entry, i) => {
        const localFrame = mod(frame - i * SLOT, durationInFrames);
        // Keep the previous word mounted while its letters finish leaving.
        if (localFrame > SLOT + 8) return null;
        return <MainWord key={entry.word} entry={entry} index={i} localFrame={localFrame} />;
      })}
    </Frame>
  );
};
