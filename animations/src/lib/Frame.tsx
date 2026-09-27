import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { MARGIN } from "./constants";
import { INTER } from "./fonts";

type FrameProps = {
  background: string;
  labelColor: string;
  right: ReactNode;
  children: ReactNode;
};

/** Shared poster layout: background plus the "Oare Sans" / descriptor header labels. */
export const Frame = ({ background, labelColor, right, children }: FrameProps) => (
  <AbsoluteFill style={{ background, overflow: "hidden" }}>
    {children}
    <div
      style={{
        position: "absolute",
        top: 44,
        left: MARGIN,
        right: MARGIN,
        display: "flex",
        justifyContent: "space-between",
        fontFamily: INTER,
        fontSize: 24,
        lineHeight: 1.2,
        color: labelColor,
        fontVariantNumeric: "tabular-nums",
        zIndex: 100,
      }}
    >
      <span>Oare Sans</span>
      <span>{right}</span>
    </div>
  </AbsoluteFill>
);
