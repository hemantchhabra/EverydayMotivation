import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  useVideoConfig,
  interpolate,
  Easing,
  staticFile,
} from "remotion";

const inter = "Inter, system-ui, sans-serif";
const playfair = "'Playfair Display', Georgia, serif";

const fontCss = `
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url(${staticFile("fonts/inter-latin-400-normal.woff2")}) format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 500;
  font-display: block;
  src: url(${staticFile("fonts/inter-latin-500-normal.woff2")}) format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-display: block;
  src: url(${staticFile("fonts/inter-latin-600-normal.woff2")}) format('woff2');
}
@font-face {
  font-family: 'Playfair Display';
  font-style: normal;
  font-weight: 500;
  font-display: block;
  src: url(${staticFile("fonts/playfair-display-latin-500-normal.woff2")}) format('woff2');
}
@font-face {
  font-family: 'Playfair Display';
  font-style: italic;
  font-weight: 500;
  font-display: block;
  src: url(${staticFile("fonts/playfair-display-latin-500-italic.woff2")}) format('woff2');
}
`;

// Palette — taken from the concept's visual brief
const INK = "#0B0F1A";
const STAGE = "#10162A";
const QUARTZ = "#F3F1E8";
const QUARTZ_DIM = "#C9C6BA";
const AMETHYST = "#A98BD6";
const AMETHYST_DEEP = "#6E54A0";
const CITRINE = "#E3B23C";
const GRAY = "#7A8190";

// ── Layout (1080 × 1350 portrait) ────────────────────────────────────────
const FRAME = { x: 60, y: 130, w: 960, h: 700 };
// Crystal is offset LEFT of stage centre to create an asymmetric, transmitter-
// style composition.  Rings sweep outward to the right where the labels live.
const CX = FRAME.x + 250;
const CY = FRAME.y + 340;

// Each ring corresponds to a division of the 32,768 Hz source by 2^N.
// `angle` is the angle (in turns of π) at which the label sits relative to
// the crystal centre — fanned so labels do not overlap.
type Ring = {
  r: number;
  freq: string;
  div: string;
  angle: number;
  emph?: boolean;
};
const RINGS: Ring[] = [
  { r: 158, freq: "32,768 Hz", div: "÷ 2⁰  · SOURCE", angle: -0.30, emph: true },
  { r: 224, freq: "2,048 Hz", div: "÷ 2⁴", angle: -0.09 },
  { r: 290, freq: "128 Hz", div: "÷ 2⁸", angle: 0.03 },
  { r: 356, freq: "8 Hz", div: "÷ 2¹²", angle: 0.13 },
  { r: 420, freq: "1 Hz", div: "÷ 2¹⁵  · WATCH TICK", angle: 0.22, emph: true },
];

// ── Crystal geometry ──────────────────────────────────────────────────────
// A two-facet quartz prism with a three-facet pyramid termination.  All
// points are relative to (CX, CY).
const HW = 50;
const BODY_TOP_Y = -68;
const BODY_BOT_Y = 168;
const APEX_Y = -168;
const SPLIT_X = 16;

const PYRAMID_LEFT = `M ${-HW} ${BODY_TOP_Y} L 0 ${APEX_Y} L ${SPLIT_X} ${BODY_TOP_Y} Z`;
const PYRAMID_RIGHT = `M ${SPLIT_X} ${BODY_TOP_Y} L 0 ${APEX_Y} L ${HW} ${BODY_TOP_Y} Z`;
const BODY_FRONT = `M ${-HW} ${BODY_TOP_Y} L ${SPLIT_X} ${BODY_TOP_Y} L ${SPLIT_X} ${BODY_BOT_Y} L ${-HW} ${BODY_BOT_Y} Z`;
const BODY_SIDE = `M ${SPLIT_X} ${BODY_TOP_Y} L ${HW} ${BODY_TOP_Y} L ${HW} ${BODY_BOT_Y} L ${SPLIT_X} ${BODY_BOT_Y} Z`;
const CRYSTAL_OUTLINE = `M 0 ${APEX_Y} L ${HW} ${BODY_TOP_Y} L ${HW} ${BODY_BOT_Y} L ${-HW} ${BODY_BOT_Y} L ${-HW} ${BODY_TOP_Y} Z`;

export const PairingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1 Hz beat for the central pulse — slowed slightly so the loop reads calm.
  const beatPeriod = fps * 1.4;
  const beatPhase = (frame % beatPeriod) / beatPeriod;
  const beatPulse = Math.exp(-beatPhase * 6) * (1 - beatPhase);

  // Crystal entrance
  const crystalSpring = spring({
    frame,
    fps,
    config: { damping: 200, mass: 1.2 },
  });

  // Type reveal
  const roleOpacity = interpolate(frame, [fps * 0.4, fps * 1.0], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSpring = spring({
    frame: frame - fps * 0.55,
    fps,
    config: { damping: 200, mass: 0.9 },
  });
  const hookOpacity = interpolate(frame, [fps * 1.1, fps * 1.9], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ringReveal = (i: number) => {
    const start = fps * (0.4 + i * 0.15);
    const end = start + fps * 0.7;
    return interpolate(frame, [start, end], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  return (
    <AbsoluteFill style={{ backgroundColor: INK, fontFamily: inter }}>
      <style>{fontCss}</style>

      {/* Top metadata band */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 80,
          right: 80,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          color: GRAY,
          fontFamily: inter,
          fontSize: 13,
          letterSpacing: 4.5,
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        <span>Everyday Motivation · No. 003</span>
        <span style={{ color: CITRINE }}>2026 · 06 · 26</span>
      </div>

      <svg
        width={1080}
        height={1350}
        viewBox="0 0 1080 1350"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient id="stage-vignette" cx="36%" cy="48%" r="65%">
            <stop offset="0%" stopColor={STAGE} stopOpacity={1} />
            <stop offset="100%" stopColor={INK} stopOpacity={1} />
          </radialGradient>

          {/* Crystal face shading */}
          <linearGradient id="quartz-front" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBFAF3" />
            <stop offset="55%" stopColor={QUARTZ} />
            <stop offset="100%" stopColor={QUARTZ_DIM} />
          </linearGradient>
          <linearGradient id="quartz-side" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={AMETHYST} />
            <stop offset="100%" stopColor={AMETHYST_DEEP} />
          </linearGradient>
          <linearGradient
            id="quartz-pyramid-l"
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor={QUARTZ} />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
          <linearGradient
            id="quartz-pyramid-r"
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={AMETHYST} />
            <stop offset="100%" stopColor="#D9C8F5" />
          </linearGradient>

          <radialGradient id="crystal-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={QUARTZ} stopOpacity={0.45} />
            <stop offset="55%" stopColor={CITRINE} stopOpacity={0.08} />
            <stop offset="100%" stopColor={CITRINE} stopOpacity={0} />
          </radialGradient>

          {/* Left-fade mask for the rings — left side fades into stage */}
          <linearGradient id="ring-fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000" stopOpacity={0} />
            <stop offset="22%" stopColor="#000" stopOpacity={0} />
            <stop offset="40%" stopColor="#FFF" stopOpacity={1} />
            <stop offset="100%" stopColor="#FFF" stopOpacity={1} />
          </linearGradient>
          <mask id="ring-mask">
            <rect
              x={FRAME.x}
              y={FRAME.y}
              width={FRAME.w}
              height={FRAME.h}
              fill="url(#ring-fade)"
            />
          </mask>

          <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>

          <clipPath id="stage-clip">
            <rect
              x={FRAME.x}
              y={FRAME.y}
              width={FRAME.w}
              height={FRAME.h}
            />
          </clipPath>
        </defs>

        {/* Stage backdrop */}
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.w}
          height={FRAME.h}
          fill="url(#stage-vignette)"
        />

        <rect
          x={FRAME.x + 0.5}
          y={FRAME.y + 0.5}
          width={FRAME.w - 1}
          height={FRAME.h - 1}
          fill="none"
          stroke="#1A2238"
          strokeWidth={1}
        />

        {/* Corner crop marks */}
        {(
          [
            [FRAME.x, FRAME.y, 1, 1],
            [FRAME.x + FRAME.w, FRAME.y, -1, 1],
            [FRAME.x, FRAME.y + FRAME.h, 1, -1],
            [FRAME.x + FRAME.w, FRAME.y + FRAME.h, -1, -1],
          ] as const
        ).map(([cx, cy, sx, sy], i) => (
          <g key={i} stroke={CITRINE} strokeWidth={1.5} fill="none">
            <line x1={cx} y1={cy} x2={cx + sx * 26} y2={cy} />
            <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 26} />
          </g>
        ))}

        {/* Top fig label */}
        <text
          x={FRAME.x + 30}
          y={FRAME.y + 36}
          fill={GRAY}
          fontFamily={inter}
          fontWeight={600}
          fontSize={11}
          letterSpacing={3.5}
        >
          FIG. 1 · PIEZOELECTRIC OSCILLATION · TUNING-FORK CUT
        </text>

        {/* Right-edge axis tag */}
        <text
          x={FRAME.x + FRAME.w - 30}
          y={FRAME.y + 36}
          textAnchor="end"
          fill={GRAY}
          fontFamily={inter}
          fontWeight={600}
          fontSize={11}
          letterSpacing={3.5}
        >
          FREQUENCY  ·  ÷ 2 PER STEP
        </text>

        {/* Stage contents */}
        <g clipPath="url(#stage-clip)">
          {/* Concentric rings — masked so the left side fades into the stage */}
          <g mask="url(#ring-mask)">
            {RINGS.map((ring, i) => {
              const reveal = ringReveal(i);
              const stroke = ring.emph
                ? i === 0
                  ? CITRINE
                  : QUARTZ
                : AMETHYST;
              const opacity = (ring.emph ? 0.95 : 0.55) * reveal;
              return (
                <circle
                  key={`ring-${i}`}
                  cx={CX}
                  cy={CY}
                  r={ring.r}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={ring.emph ? 1.6 : 1}
                  strokeOpacity={opacity}
                  strokeDasharray={ring.emph ? undefined : "2 7"}
                />
              );
            })}
          </g>

          {/* Ring labels — placed at a fanned angle around each ring so the
              callout stack reads top-to-bottom without overlap. */}
          {RINGS.map((ring, i) => {
            const reveal = ringReveal(i);
            const lx = CX + ring.r * Math.cos(Math.PI * ring.angle);
            const ly = CY + ring.r * Math.sin(Math.PI * ring.angle);
            const isSource = i === 0;
            const isWatchTick = i === RINGS.length - 1;
            return (
              <g
                key={`lbl-${i}`}
                transform={`translate(${lx + 16}, ${ly + 4})`}
                opacity={reveal}
              >
                {/* leader tick into the ring */}
                <line
                  x1={-14}
                  y1={-2}
                  x2={-2}
                  y2={-2}
                  stroke={isSource ? CITRINE : ring.emph ? QUARTZ : GRAY}
                  strokeOpacity={0.85}
                  strokeWidth={1.1}
                />
                {isSource ? (
                  <>
                    <text
                      fill={CITRINE}
                      fontFamily={playfair}
                      fontStyle="italic"
                      fontWeight={500}
                      fontSize={32}
                      letterSpacing={-0.5}
                    >
                      32,768 Hz
                    </text>
                    <text
                      y={20}
                      fill={GRAY}
                      fontFamily={inter}
                      fontSize={10.5}
                      fontWeight={600}
                      letterSpacing={3.2}
                    >
                      SOURCE  ·  ÷ 2⁰
                    </text>
                  </>
                ) : isWatchTick ? (
                  <>
                    <text
                      fill={QUARTZ}
                      fontFamily={playfair}
                      fontStyle="italic"
                      fontWeight={500}
                      fontSize={22}
                      letterSpacing={-0.3}
                    >
                      1 Hz
                    </text>
                    <text
                      y={18}
                      fill={CITRINE}
                      fontFamily={inter}
                      fontSize={10.5}
                      fontWeight={600}
                      letterSpacing={3.2}
                    >
                      ÷ 2¹⁵  ·  WATCH TICK
                    </text>
                  </>
                ) : (
                  <>
                    <text
                      fill={QUARTZ_DIM}
                      fontFamily={inter}
                      fontSize={13}
                      fontWeight={600}
                      letterSpacing={2.2}
                    >
                      {ring.freq}
                    </text>
                    <text
                      y={16}
                      fill={GRAY}
                      fontFamily={inter}
                      fontSize={10}
                      fontWeight={500}
                      letterSpacing={2.6}
                    >
                      {ring.div}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Expanding pulse rings — fired on each beat from the crystal */}
          {[0, 1, 2].map((k) => {
            const phase = (beatPhase + k / 3) % 1;
            const r =
              160 + phase * (RINGS[RINGS.length - 1].r - 160 + 30);
            const op = (1 - phase) * 0.5 * crystalSpring;
            return (
              <circle
                key={`pulse-${k}`}
                cx={CX}
                cy={CY}
                r={r}
                fill="none"
                stroke={CITRINE}
                strokeWidth={1.5}
                strokeOpacity={op}
                mask="url(#ring-mask)"
                filter="url(#ring-glow)"
              />
            );
          })}

          {/* Crystal glow halo */}
          <circle
            cx={CX}
            cy={CY - 8}
            r={140 + beatPulse * 10}
            fill="url(#crystal-glow)"
            opacity={(0.9 + beatPulse * 0.1) * crystalSpring}
          />

          {/* Crystal */}
          <g
            transform={`translate(${CX}, ${CY}) scale(${
              0.96 + crystalSpring * 0.04 + beatPulse * 0.018
            })`}
            opacity={crystalSpring}
          >
            <ellipse
              cx={0}
              cy={BODY_BOT_Y + 22}
              rx={HW + 12}
              ry={10}
              fill="#000"
              opacity={0.5}
            />

            <path d={BODY_SIDE} fill="url(#quartz-side)" />
            <path d={BODY_FRONT} fill="url(#quartz-front)" />
            <path d={PYRAMID_RIGHT} fill="url(#quartz-pyramid-r)" />
            <path d={PYRAMID_LEFT} fill="url(#quartz-pyramid-l)" />

            <path
              d={`M ${SPLIT_X} ${BODY_TOP_Y} L ${SPLIT_X} ${BODY_BOT_Y}`}
              stroke="#7E6BAA"
              strokeWidth={1}
              opacity={0.7}
            />
            <path
              d={`M ${SPLIT_X} ${BODY_TOP_Y} L 0 ${APEX_Y}`}
              stroke="#FFFFFF"
              strokeWidth={1}
              opacity={0.5}
            />

            <path
              d={CRYSTAL_OUTLINE}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={1.2}
              opacity={0.55}
            />

            <path
              d={`M ${-HW + 12} ${BODY_TOP_Y + 14} L ${-HW + 12} ${
                BODY_BOT_Y - 24
              }`}
              stroke="#FFFFFF"
              strokeWidth={2.6}
              strokeLinecap="round"
              opacity={0.55}
            />

            {/* Electrode leads — citrine tick lines on either side of the base */}
            <g
              stroke={CITRINE}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.95}
            >
              <line
                x1={-22}
                y1={BODY_BOT_Y + 4}
                x2={-22}
                y2={BODY_BOT_Y + 32}
              />
              <line
                x1={22}
                y1={BODY_BOT_Y + 4}
                x2={22}
                y2={BODY_BOT_Y + 32}
              />
            </g>
          </g>

          {/* "OBJECT" tag — anchored bottom-left of stage, separate from crystal */}
          <g
            transform={`translate(${FRAME.x + 30}, ${FRAME.y + FRAME.h - 56})`}
            opacity={crystalSpring}
          >
            <text
              fill={QUARTZ_DIM}
              fontFamily={inter}
              fontWeight={600}
              fontSize={12}
              letterSpacing={4}
            >
              QUARTZ · SiO₂
            </text>
            <text
              y={18}
              fill={GRAY}
              fontFamily={inter}
              fontWeight={500}
              fontSize={10}
              letterSpacing={3}
            >
              TRIGONAL  ·  HEXAGONAL HABIT
            </text>
          </g>

          {/* Bottom-right caption inside the stage */}
          <g
            transform={`translate(${FRAME.x + FRAME.w - 30}, ${
              FRAME.y + FRAME.h - 38
            })`}
            opacity={crystalSpring}
          >
            <text
              textAnchor="end"
              fill={GRAY}
              fontFamily={inter}
              fontSize={11}
              letterSpacing={3}
              fontWeight={500}
            >
              CURIE · 1880
            </text>
            <text
              y={18}
              textAnchor="end"
              fill={GRAY}
              fontFamily={inter}
              fontSize={11}
              letterSpacing={3}
              fontWeight={500}
            >
              SEIKO ASTRON · 1969
            </text>
          </g>
        </g>
      </svg>

      {/* ── Type lockup ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 880,
          opacity: roleOpacity,
        }}
      >
        <div
          style={{
            color: CITRINE,
            fontFamily: inter,
            fontSize: 13,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 18,
            fontWeight: 600,
          }}
        >
          Role <span style={{ color: GRAY, margin: "0 4px" }}>/</span>
          <span style={{ color: "#EDEDEF", letterSpacing: 5 }}>
            Concert Conductor
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 920,
          opacity: titleSpring,
          transform: `translateY(${interpolate(
            titleSpring,
            [0, 1],
            [18, 0],
          )}px)`,
        }}
      >
        <div
          style={{
            color: "#F4F4F6",
            fontFamily: playfair,
            fontWeight: 500,
            fontSize: 96,
            lineHeight: 0.92,
            letterSpacing: -1.6,
            fontStyle: "italic",
          }}
        >
          The crystal
          <br />
          conductor.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 1130,
          color: "#C8CAD0",
          fontFamily: inter,
          fontSize: 19,
          lineHeight: 1.42,
          fontWeight: 400,
          maxWidth: 880,
          opacity: hookOpacity,
        }}
      >
        Given a tiny voltage, a sliver of{" "}
        <span style={{ color: QUARTZ, fontWeight: 600 }}>quartz</span> bends
        and rebounds at exactly{" "}
        <span style={{ color: CITRINE, fontWeight: 600 }}>32,768 Hz</span> —
        the 2¹⁵ piezoelectric heartbeat behind every quartz watch since 1969
        and most digital clocks on Earth.
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          color: GRAY,
          fontFamily: inter,
          fontSize: 11,
          letterSpacing: 3,
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        <span>EverydayMotivation  ·  Daily Pairing  ·  No. 003</span>
        <span>
          <span style={{ color: CITRINE }}>●</span> 32,768 ÷ 2¹⁵ = 1 Hz
        </span>
      </div>
    </AbsoluteFill>
  );
};
