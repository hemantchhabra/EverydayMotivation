import React from "react";
import { Composition } from "remotion";
import { PairingCard } from "./PairingCard";
import { BombardierBeetleCard } from "./BombardierBeetleCard";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="PairingCard"
        component={PairingCard}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="BombardierBeetleCard"
        component={BombardierBeetleCard}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1350}
      />
    </>
  );
};
