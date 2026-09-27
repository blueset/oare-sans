import type { CSSProperties } from "react";
import { loadFont } from "@remotion/fonts";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { staticFile } from "remotion";

export const OARE = "Oare Sans";

export const oareReady = loadFont({
  family: OARE,
  url: staticFile("fonts/OareSans-Regular-VF.woff2"),
  weight: "100 900",
  style: "oblique 0deg 10deg",
});

// Posters use Inter for their small header labels.
export const INTER = loadInter("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
}).fontFamily;

export const WGHT_MIN = 100;
export const WGHT_MAX = 900;
export const SLNT_MIN = -10;

/** Oare Sans at an exact point in the design space (wght 100–900, slnt −10–0). */
export const oare = (wght: number, slnt = 0, features?: string): CSSProperties => ({
  fontFamily: OARE,
  fontVariationSettings: `"wght" ${wght.toFixed(2)}, "slnt" ${slnt.toFixed(3)}`,
  ...(features ? { fontFeatureSettings: features } : {}),
});

/** Trims the line box to cap height and baseline so flexbox centers the capitals optically. */
export const capBox = {
  textBoxTrim: "trim-both",
  textBoxEdge: "cap alphabetic",
} as unknown as CSSProperties;

export const formatSlnt = (slnt: number) => {
  const value = Math.abs(slnt) < 0.05 ? 0 : slnt;
  return value < 0 ? `−${Math.abs(value).toFixed(1)}` : value.toFixed(1);
};
