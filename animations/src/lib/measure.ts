import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { OARE, oareReady } from "./fonts";

const MEASURE_SIZE = 200;

export type WidthTable = {
  weights: number[];
  /** widths[textIndex][weightIndex], in em (width per 1 px of font size). */
  widths: number[][];
};

/**
 * Measures each text's advance width across a set of weights once the font has loaded.
 * Rendering is blocked until the measurements are available.
 */
export const useWidthTable = (texts: string[], weights: number[], features?: string) => {
  const [handle] = useState(() => delayRender("Measuring Oare Sans text widths"));
  const [table, setTable] = useState<WidthTable | null>(null);

  useEffect(() => {
    let cancelled = false;
    oareReady
      .then(() => {
        const probe = document.createElement("span");
        Object.assign(probe.style, {
          position: "absolute",
          left: "-100000px",
          top: "0",
          visibility: "hidden",
          whiteSpace: "pre",
          fontFamily: OARE,
          fontSize: `${MEASURE_SIZE}px`,
          fontFeatureSettings: features ?? "normal",
        });
        document.body.appendChild(probe);
        const widths = texts.map((text) => {
          probe.textContent = text;
          return weights.map((w) => {
            probe.style.fontVariationSettings = `"wght" ${w}, "slnt" 0`;
            return probe.getBoundingClientRect().width / MEASURE_SIZE;
          });
        });
        probe.remove();
        if (!cancelled) {
          setTable({ weights, widths });
        }
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
    return () => {
      cancelled = true;
    };
    // Measurements only need to happen once per mount.
  }, []);

  return table;
};

/** Width (em) of text `index` at weight `wght`, linearly interpolated from the table. */
export const widthAt = (table: WidthTable, index: number, wght: number) => {
  const { weights } = table;
  const row = table.widths[index];
  if (wght <= weights[0]) return row[0];
  for (let i = 1; i < weights.length; i++) {
    if (wght <= weights[i]) {
      const t = (wght - weights[i - 1]) / (weights[i] - weights[i - 1]);
      return row[i - 1] + (row[i] - row[i - 1]) * t;
    }
  }
  return row[row.length - 1];
};

/** Weight at which text `index` is `targetEm` wide (clamped to the measured range). */
export const weightForWidth = (table: WidthTable, index: number, targetEm: number) => {
  const { weights } = table;
  const row = table.widths[index];
  if (targetEm <= row[0]) return weights[0];
  for (let i = 1; i < row.length; i++) {
    if (targetEm <= row[i]) {
      const t = (targetEm - row[i - 1]) / (row[i] - row[i - 1]);
      return weights[i - 1] + (weights[i] - weights[i - 1]) * t;
    }
  }
  return weights[weights.length - 1];
};

export const weightSteps = (from = 100, to = 900, step = 25) => {
  const steps: number[] = [];
  for (let w = from; w <= to; w += step) steps.push(w);
  return steps;
};

export type GlyphLine = {
  chars: string[];
  /** Kerned line advance width, in em. */
  width: number;
  /** Horizontal center of each character's advance, in em from the line start. */
  centers: number[];
};

/**
 * Measures where each character of each text sits (kerning included) at one weight, so glyphs
 * can be drawn individually and still line up with the typeset line at that weight.
 */
export const useGlyphLayout = (texts: string[], wght: number, features?: string) => {
  const [handle] = useState(() => delayRender("Measuring Oare Sans glyph positions"));
  const [lines, setLines] = useState<GlyphLine[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    oareReady
      .then(() => {
        const probe = document.createElement("span");
        Object.assign(probe.style, {
          position: "absolute",
          left: "0",
          top: "0",
          visibility: "hidden",
          whiteSpace: "pre",
          fontFamily: OARE,
          fontSize: `${MEASURE_SIZE}px`,
          fontFeatureSettings: features ?? "normal",
          fontVariationSettings: `"wght" ${wght}, "slnt" 0`,
        });
        document.body.appendChild(probe);
        const measured = texts.map((text) => {
          probe.textContent = text;
          const node = probe.firstChild!;
          const origin = probe.getBoundingClientRect().left;
          const range = document.createRange();
          const chars = Array.from(text);
          let offset = 0;
          const centers = chars.map((ch) => {
            range.setStart(node, offset);
            range.setEnd(node, offset + ch.length);
            offset += ch.length;
            const box = range.getBoundingClientRect();
            return (box.left + box.width / 2 - origin) / MEASURE_SIZE;
          });
          return { chars, width: probe.getBoundingClientRect().width / MEASURE_SIZE, centers };
        });
        probe.remove();
        if (!cancelled) {
          setLines(measured);
        }
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
    return () => {
      cancelled = true;
    };
    // Measurements only need to happen once per mount.
  }, []);

  return lines;
};
