import React from "react";
import { Composition } from "remotion";
import { BowerbirdCard } from "./BowerbirdCard";

export const Root: React.FC = () => {
  return (
    <Composition
      id="PairingCard"
      component={BowerbirdCard}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1350}
    />
  );
};
