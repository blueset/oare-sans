import { type SVGProps, useMemo } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { HEIGHT, MARGIN, WIDTH } from "../lib/constants";
import { FLAG_ICONS, GRID_ORDER, type IconId } from "../lib/flagIcons";
import { capBox, oare } from "../lib/fonts";
import { Frame } from "../lib/Frame";
import { useWidthTable, weightSteps, widthAt } from "../lib/measure";
import { lerp } from "../lib/math";

// Recreates the flagger from documentation/embed.html: a cyan flag with a slanted icon, and
// right-aligned oblique text sized so both lines together match the flag's height.

const BG = "#F3F5F5";
const INK = "#00161F";
const LABEL = "rgba(0, 22, 31, 0.55)";

const CAP = 0.7;
const LINE_GAP = 0.1; // The embed page's default line height, used as the gap between lines.
const BLOCK_EM = CAP * 2 + LINE_GAP;
const TAN_DEDENT = Math.tan((9.5 * Math.PI) / 180);
const FLAG_VB = { w: 222, h: 214 };
const FLAG_GAP = 8 / 300; // 0.5rem gap next to the page's 300px flag.
const MAX_FLAG_HEIGHT = 440;
const CENTER_Y = 700;

// Flag icon slot (flag SVG units), skewed like `transform: skew(-8deg, 0)` in the page.
const ICON = { x: 60, y: 8, size: 35 };
const ICON_SKEW = Math.tan((-8 * Math.PI) / 180);
const ICON_CX = ICON.x + ICON.size / 2;
const ICON_CY = ICON.y + ICON.size / 2;
const HOVER_PAD = 4.5;

// Picker popover, scaled up from the page's rem-based sizes.
const UI = 2.25;
const CELL = 32 * UI;
const CELL_GAP = 4 * UI;
const POP_PAD = 8 * UI;
const POP_BORDER = 2;
const COLS = 5;
const ROWS = Math.ceil(GRID_ORDER.length / COLS);
const POP_W = 2 * (POP_BORDER + POP_PAD) + COLS * CELL + (COLS - 1) * CELL_GAP;
const POP_H = 2 * (POP_BORDER + POP_PAD) + ROWS * CELL + (ROWS - 1) * CELL_GAP;

type Lines = readonly [string, string];
type Entry = { lines: Lines; wght: number; features?: string };
type Shuffle = Entry & { icon: IconId; hold: number };

const FIRST: Entry = { lines: ["HELLO", "WORLD"], wght: 200 };
// Every flag gets a fitting icon; "PROJECT SEKAI" with the music note is the easter egg, held no
// longer than its neighbours. Keep each word within PROJECT at Thin (~2.03em) or the flag shrinks.
const SHUFFLES: Shuffle[] = [
  { lines: ["BEEP", "BOOP"], wght: 900, icon: "bot", hold: 7 },
  { lines: ["COFFEE", "BREAK"], wght: 200, icon: "coffee", hold: 6 },
  { lines: ["PIZZA", "PARTY"], wght: 400, icon: "pizza", hold: 6 },
  { lines: ["GAME", "OVER"], wght: 800, icon: "games", hold: 5 },
  { lines: ["KING", "SIZE"], wght: 700, icon: "crown", hold: 5 },
  { lines: ["NIGHT", "OWL"], wght: 500, icon: "moon", hold: 5 },
  { lines: ["EARTH", "DAY"], wght: 300, icon: "earth", hold: 5 },
  { lines: ["CAT", "NAP"], wght: 900, icon: "cat", hold: 5 },
  { lines: ["BLAST", "OFF"], wght: 400, icon: "rocket", hold: 5 },
  { lines: ["GYM", "TEAM"], wght: 800, icon: "dumbbell", hold: 5 },
  { lines: ["SUPER", "STAR"], wght: 300, icon: "star", hold: 5 },
  { lines: ["BIG", "IDEA"], wght: 600, icon: "lightbulb", hold: 5 },
  { lines: ["PROJECT", "SEKAI"], wght: 100, icon: "music", hold: 5 },
  { lines: ["ROAD", "TRIP"], wght: 800, icon: "car", hold: 5 },
  { lines: ["LOL", "OK"], wght: 900, icon: "meme", hold: 5 },
  { lines: ["CHILL", "OUT"], wght: 400, icon: "snowflake", hold: 5 },
  { lines: ["BOW", "TIE"], wght: 500, icon: "bowtie", hold: 5 },
  { lines: ["CAMP", "FIRE"], wght: 600, icon: "fire", hold: 5 },
  { lines: ["BOOK", "CLUB"], wght: 200, icon: "book", hold: 5 },
  { lines: ["GOOD", "VIBES"], wght: 700, icon: "balloon", hold: 5 },
  { lines: ["BUG", "FIX"], wght: 900, icon: "bug", hold: 6 },
  { lines: ["JET", "LAG"], wght: 800, features: '"ss01"', icon: "airplane", hold: 6 },
  { lines: ["APPLE", "PIE"], wght: 400, icon: "apple", hold: 8 },
  { lines: ["PLANT", "MOM"], wght: 300, icon: "plant", hold: 14 },
];
const HERO: Entry = { lines: ["OARE", "SANS"], wght: 100 };

const ENTRIES: Entry[] = [FIRST, ...SHUFFLES, HERO];
const WORDS = Array.from(new Set(ENTRIES.flatMap((e) => e.lines)));
const WEIGHTS = weightSteps(100, 900, 100);

const INSTANCE_NAMES: Record<number, string> = {
  100: "Thin Oblique",
  200: "ExtraLight Oblique",
  300: "Light Oblique",
  400: "Oblique",
  500: "Medium Oblique",
  600: "SemiBold Oblique",
  700: "Bold Oblique",
  800: "ExtraBold Oblique",
  900: "Black Oblique",
};

type Step = {
  f: number;
  lines: Lines;
  wght: number;
  features?: string;
  icon: IconId;
  iconF: number;
  iconSpring: boolean;
};

/** Keystroke-level script of the whole loop, plus the frames of the cursor interaction. */
const SCRIPT = (() => {
  const steps: Step[] = [];
  let f = 0;
  let s: Step = {
    f: 0,
    lines: ["", ""],
    wght: HERO.wght,
    icon: "logo",
    iconF: -1000,
    iconSpring: false,
  };
  const commit = (patch: Partial<Step>) => {
    s = { ...s, ...patch, f };
    steps.push(s);
  };
  const key = (patch: Partial<Step>, duration: number) => {
    commit(patch);
    f += duration;
  };
  const type = ({ lines, wght, features }: Entry, rhythm: number[], enterPause: number) => {
    let k = 0;
    for (const li of [0, 1] as const) {
      if (li === 1) f += enterPause;
      for (let c = 1; c <= lines[li].length; c++) {
        const next: [string, string] = [s.lines[0], s.lines[1]];
        next[li] = lines[li].slice(0, c);
        key({ lines: next, wght, features }, rhythm[k++ % rhythm.length]);
      }
    }
  };
  const erase = (perKey: number) => {
    for (const li of [1, 0] as const) {
      const word = s.lines[li];
      for (let c = word.length - 1; c >= 0; c--) {
        const next: [string, string] = [s.lines[0], s.lines[1]];
        next[li] = word.slice(0, c);
        key({ lines: next }, perKey);
      }
    }
  };

  commit({});
  f += 12;
  type(FIRST, [2], 4);
  f += 10;
  for (const { lines, wght, features, icon, hold } of SHUFFLES) {
    key({ lines, wght, features, icon, iconF: f, iconSpring: false }, hold);
  }
  erase(1);
  f += 14;
  type(HERO, [8, 7, 9, 7], 12);

  const enter = f + 2;
  const arriveIcon = enter + 28;
  const clickIcon = arriveIcon + 8;
  const open = clickIcon + 3;
  const leaveIcon = clickIcon + 12;
  const arriveBrowse = leaveIcon + 16;
  const leaveBrowse = arriveBrowse + 6;
  const arriveLogo = leaveBrowse + 18;
  const clickLogo = arriveLogo + 7;
  const pick = clickLogo + 3;
  const leaveLogo = pick + 12;
  const exit = leaveLogo + 26;

  f = pick;
  commit({ icon: "logo", iconF: pick, iconSpring: true });
  f = exit + 40;
  erase(1);
  f += 14;
  const duration = f;

  return {
    steps,
    duration,
    t: { enter, arriveIcon, clickIcon, open, leaveIcon, arriveBrowse, leaveBrowse, arriveLogo, clickLogo, pick, leaveLogo, exit },
  };
})();

export const FLAGGER_DURATION = SCRIPT.duration;

const stepAt = (frame: number) => {
  const { steps } = SCRIPT;
  let lo = 0;
  let hi = steps.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (steps[mid].f <= frame) lo = mid;
    else hi = mid - 1;
  }
  return steps[lo];
};

type Point = { x: number; y: number };

const clamped = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Icon = ({ id, fill, ...rest }: { id: IconId; fill: string } & SVGProps<SVGSVGElement>) => (
  <svg viewBox={FLAG_ICONS[id].viewBox} {...rest}>
    <path d={FLAG_ICONS[id].d} fill={fill} />
  </svg>
);

const Cursor = ({ at, press }: { at: Point; press: number }) => {
  const scale = UI;
  return (
    <svg
      viewBox="0 0 24 28"
      width={24 * scale}
      height={28 * scale}
      style={{
        position: "absolute",
        left: at.x - 3 * scale,
        top: at.y - 2 * scale,
        overflow: "visible",
        transform: `scale(${1 - 0.12 * press})`,
        transformOrigin: `${3 * scale}px ${2 * scale}px`,
        filter: "drop-shadow(0 4px 6px rgba(0, 22, 31, 0.3))",
        zIndex: 30,
      }}
    >
      <path
        d="M3 2L3 21.5L8 16.8L11.4 24.6L14.6 23.2L11.3 15.6L18.2 15.6Z"
        fill="#111"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Flagger = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const table = useWidthTable(WORDS, WEIGHTS);

  const layout = useMemo(() => {
    if (!table) return null;
    const width = ({ lines, wght }: Entry) =>
      Math.max(...lines.map((word) => widthAt(table, WORDS.indexOf(word), wght)));
    const maxW = Math.max(...ENTRIES.map(width));
    const heroW = width(HERO);
    const flagAspect = FLAG_VB.w / FLAG_VB.h;
    // Largest flag that keeps the widest pair inside the margin while "OARE SANS" is centered.
    const H = Math.min(
      MAX_FLAG_HEIGHT,
      (WIDTH / 2 - MARGIN) / (maxW / BLOCK_EM + (FLAG_GAP + flagAspect - heroW / BLOCK_EM) / 2),
    );
    const fs = H / BLOCK_EM;
    const flagW = flagAspect * H;
    const gap = FLAG_GAP * H;
    const flagLeft = WIDTH / 2 + (heroW * fs + gap + flagW) / 2 - flagW;
    const top = CENTER_Y - H / 2;
    const k = H / FLAG_VB.h;
    const toPx = (x: number, y: number): Point => ({ x: flagLeft + (x + ICON_SKEW * y) * k, y: top + y * k });

    const hoverTop = ICON.y - HOVER_PAD;
    const hoverBottom = ICON.y + ICON.size + HOVER_PAD;
    const hoverBox = {
      left: toPx(ICON.x - HOVER_PAD, hoverBottom).x,
      right: toPx(ICON.x + ICON.size + HOVER_PAD, hoverTop).x,
      top: top + hoverTop * k,
      bottom: top + hoverBottom * k,
    };
    const popLeft = Math.min(hoverBox.left, WIDTH - MARGIN - POP_W);
    const popTop = hoverBox.bottom + 0.35 * 16 * UI;
    const cell = (i: number) => {
      const x = popLeft + POP_BORDER + POP_PAD + (i % COLS) * (CELL + CELL_GAP);
      const y = popTop + POP_BORDER + POP_PAD + Math.floor(i / COLS) * (CELL + CELL_GAP);
      return { x, y, cx: x + CELL / 2, cy: y + CELL / 2 };
    };
    const iconCenter = toPx(ICON_CX, ICON_CY);
    const browse = cell(GRID_ORDER.indexOf("music"));
    const logo = cell(GRID_ORDER.indexOf("logo"));

    return {
      H,
      fs,
      flagW,
      flagLeft,
      textRight: flagLeft - gap,
      baseline: top + H,
      top,
      hoverBox,
      popLeft,
      popTop,
      cell,
      path: {
        start: { x: WIDTH + 80, y: top + H + 340 },
        icon: { x: iconCenter.x + 14, y: iconCenter.y + 18 },
        browse: { x: browse.cx + 20, y: browse.cy + 22 },
        logo: { x: logo.cx + 18, y: logo.cy + 20 },
        end: { x: WIDTH + 80, y: popTop + POP_H + 220 },
      },
    };
  }, [table]);

  const st = stepAt(frame);
  if (!layout) {
    return (
      <Frame background={BG} labelColor={LABEL} right={INSTANCE_NAMES[st.wght]}>
        {null}
      </Frame>
    );
  }
  const { H, fs, flagW, flagLeft, textRight, baseline, top, hoverBox, popLeft, popTop, cell, path } = layout;
  const { t } = SCRIPT;

  const lineBaseline = (li: 0 | 1) => baseline - (li === 0 ? (CAP + LINE_GAP) * fs : 0);
  // Slant-aware dedent: each line shifts right by its baseline height above the bottom × tan 9.5°.
  const lineDedent = (li: 0 | 1) => (baseline - lineBaseline(li)) * TAN_DEDENT;

  // Cursor path: glide in, click the flag icon, browse the grid, pick the logo, glide out.
  const segments: { from: Point; to: Point; start: number; end: number; ease: (x: number) => number; arc: number }[] = [
    { from: path.start, to: path.icon, start: t.enter, end: t.arriveIcon, ease: Easing.bezier(0.2, 0.7, 0.3, 1), arc: 0.1 },
    { from: path.icon, to: path.browse, start: t.leaveIcon, end: t.arriveBrowse, ease: Easing.bezier(0.45, 0, 0.25, 1), arc: -0.12 },
    { from: path.browse, to: path.logo, start: t.leaveBrowse, end: t.arriveLogo, ease: Easing.bezier(0.45, 0, 0.25, 1), arc: 0.1 },
    { from: path.logo, to: path.end, start: t.leaveLogo, end: t.exit, ease: Easing.bezier(0.6, 0, 0.8, 0.4), arc: -0.08 },
  ];
  let cursor: Point | null = null;
  if (frame >= t.enter && frame <= t.exit) {
    for (const seg of segments) {
      if (frame < seg.start) {
        cursor = seg.from;
        break;
      }
      if (frame <= seg.end) {
        const e = seg.ease((frame - seg.start) / (seg.end - seg.start));
        const dx = seg.to.x - seg.from.x;
        const dy = seg.to.y - seg.from.y;
        const bow = Math.sin(Math.PI * e) * seg.arc;
        cursor = { x: lerp(seg.from.x, seg.to.x, e) - dy * bow, y: lerp(seg.from.y, seg.to.y, e) + dx * bow };
        break;
      }
    }
  }
  const clicks = [t.clickIcon, t.clickLogo];
  const press = Math.max(...clicks.map((c) => (frame >= c && frame < c + 6 ? Math.sin((Math.PI * (frame - c)) / 6) : 0)));

  const openP = interpolate(frame, [t.open, t.open + 7], [0, 1], { ...clamped, easing: Easing.out(Easing.cubic) });
  const closeP = interpolate(frame, [t.pick, t.pick + 6], [0, 1], { ...clamped, easing: Easing.in(Easing.quad) });
  const popVisible = openP * (1 - closeP);

  const within = (p: Point | null, box: { left: number; right: number; top: number; bottom: number }) =>
    !!p && p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom;
  const flagHover = within(cursor, hoverBox);
  const hoveredCell =
    popVisible > 0.5
      ? GRID_ORDER.findIndex((_, i) => {
          const c = cell(i);
          return within(cursor, { left: c.x, right: c.x + CELL, top: c.y, bottom: c.y + CELL });
        })
      : -1;

  const iconAge = frame - st.iconF;
  const iconScale = st.iconSpring
    ? 0.5 + 0.5 * spring({ frame: iconAge, fps, config: { damping: 9, stiffness: 180, mass: 0.7 } })
    : interpolate(iconAge, [0, 3], [0.82, 1], clamped);

  return (
    <Frame background={BG} labelColor={LABEL} right={INSTANCE_NAMES[st.wght]}>
      {([0, 1] as const).map((li) => (
        <div
          key={li}
          style={{
            position: "absolute",
            right: WIDTH - (textRight + lineDedent(li)),
            bottom: HEIGHT - lineBaseline(li),
            fontSize: fs,
            lineHeight: 1,
            whiteSpace: "pre",
            color: INK,
            ...oare(st.wght, -10, st.features),
            ...capBox,
          }}
        >
          {st.lines[li]}
        </div>
      ))}

      <svg
        viewBox={`0 0 ${FLAG_VB.w} ${FLAG_VB.h}`}
        style={{ position: "absolute", left: flagLeft, top, width: flagW, height: H, overflow: "visible" }}
      >
        <defs>
          <linearGradient id="flagGradient" x1="45.903" y1="-5.91406" x2="45.903" y2="208.243" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5EA" />
            <stop offset="1" stopColor="#00B5CC" />
          </linearGradient>
          <linearGradient id="iconGradient" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#0069A5" />
            <stop offset="1" stopColor="#004E81" />
          </linearGradient>
        </defs>
        <path d="M32.09 0.0317383H40.96L8.87 213.962H0L32.09 0.0317383Z" fill="url(#flagGradient)" />
        <path
          d="M146.21 13.402C148.4 -1.13804 83.8 0.0219644 48.93 0.0219644L36 86.192C69.36 84.252 135.5 84.192 133.21 99.462C132.07 107.042 127.68 106.752 127.11 110.542C125.59 120.682 198.05 116.162 208.26 115.062L186.4 72.122L221.1 28.832C203.63 30.642 138.63 33.772 139.99 24.682C140.72 19.812 145.4 19.122 146.21 13.402Z"
          fill="url(#flagGradient)"
        />
        <g transform="skewX(-8)">
          <rect
            x={ICON.x - HOVER_PAD}
            y={ICON.y - HOVER_PAD}
            width={ICON.size + 2 * HOVER_PAD}
            height={ICON.size + 2 * HOVER_PAD}
            rx={5}
            fill={INK}
            fillOpacity={flagHover ? 0.1 : 0}
            stroke={INK}
            strokeOpacity={0.5 * popVisible}
            strokeWidth={1.2}
          />
          <g transform={`translate(${ICON_CX} ${ICON_CY}) scale(${iconScale}) translate(${-ICON_CX} ${-ICON_CY})`}>
            <Icon id={st.icon} fill="url(#iconGradient)" x={ICON.x} y={ICON.y} width={ICON.size} height={ICON.size} />
          </g>
        </g>
      </svg>

      {popVisible > 0 && (
        <div
          style={{
            position: "absolute",
            left: popLeft,
            top: popTop,
            width: POP_W,
            height: POP_H,
            boxSizing: "border-box",
            padding: POP_PAD,
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            gridAutoRows: CELL,
            gap: CELL_GAP,
            background: "#fff",
            border: `${POP_BORDER}px solid rgba(0, 22, 31, 0.3)`,
            borderRadius: 6 * UI,
            boxShadow: "0 14px 40px rgba(0, 22, 31, 0.16)",
            opacity: popVisible,
            transform: `translateY(${-10 * (1 - openP)}px) scale(${0.96 + 0.04 * openP - 0.03 * closeP})`,
            transformOrigin: "top left",
            zIndex: 20,
          }}
        >
          {GRID_ORDER.map((id, i) => (
            <div
              key={id}
              style={{
                boxSizing: "border-box",
                padding: 4 * UI,
                borderRadius: 4 * UI,
                background: hoveredCell === i ? "rgba(0, 22, 31, 0.1)" : "transparent",
                outline: id === st.icon ? `${2 * UI}px solid ${INK}` : "none",
                outlineOffset: -UI,
              }}
            >
              <Icon id={id} fill={INK} width="100%" height="100%" style={{ display: "block" }} />
            </div>
          ))}
        </div>
      )}

      {clicks.map((c) => {
        const p = (frame - c) / 14;
        if (!cursor || p < 0 || p > 1) return null;
        const r = 10 + 38 * Easing.out(Easing.quad)(p);
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: cursor.x - r,
              top: cursor.y - r,
              width: 2 * r,
              height: 2 * r,
              borderRadius: "50%",
              border: `3px solid ${INK}`,
              opacity: 0.35 * (1 - p),
              zIndex: 25,
            }}
          />
        );
      })}

      {cursor && <Cursor at={cursor} press={press} />}
    </Frame>
  );
};
