import React from 'react';
import { Composition } from 'remotion';
import { Wallpaper } from './Wallpaper';

export const Root: React.FC = () => (
  <Composition
    id="WallpaperStill"
    component={Wallpaper}
    durationInFrames={1}
    fps={30}
    width={2560}
    height={1440}
  />
);
