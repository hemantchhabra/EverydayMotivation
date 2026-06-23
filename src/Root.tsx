import React from "react";
import { Composition } from "remotion";
import { PairingCard, PairingCardProps } from "./PairingCard";

const defaultProps: PairingCardProps = {
  object: "Lichen",
  role: "Diplomat",
  date: "2026-06-23",
  statement:
    "Lichen exists only because a fungus and an alga negotiated an honest exchange: shelter for sugar, structure for energy, neither viable alone. It teaches that the most enduring partnerships aren't built on similarity but on what each party can actually deliver — find the counterpart whose surplus matches your gap, and together you can colonize bare rock.",
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PairingCard"
      component={PairingCard}
      durationInFrames={1}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
    />
  );
};
