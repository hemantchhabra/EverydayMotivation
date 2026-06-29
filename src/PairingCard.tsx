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
const ABYSS = "#06111C";
const OCEAN = "#1E3548";
const OCEAN_DEEP = "#0E2030";
const SILICA = "#E9DCBE";
const SILICA_HI = "#F6ECC9";
const LIGHT = "#FFC766";
const LIGHT_HOT = "#FFE6B0";
const GRAY = "#7E8A98";
const GRID = "#14283C";
const GRID_MAJOR = "#1B3349";

// ── Sponge cage geometry ─────────────────────────────────────────────────
// A tall, slightly tapered cylindrical lattice. We render it as an
// engineer's wireframe schematic: vertical struts + horizontal rings +
// two crossing diagonal families (the real Euplectella has two helical
// strut families wrapping the cage).
const CAGE_W_TOP = 280; // open mouth (wider at top)
const CAGE_W_BOT = 200; // narrower at base
const CAGE_H = 460;
const RING_COUNT = 9;
const VERT_COUNT = 14;
const DIAG_COUNT = 11;

const widthAt = (t: number): number =>
  CAGE_W_TOP + (CAGE_W_BOT - CAGE_W_TOP) * t;

type VStrut = { x0: number; x1: number; depth: number };
const vStruts: VStrut[] = Array.from({ length: VERT_COUNT }).map((_, i) => {
  const theta = (i / VERT_COUNT) * Math.PI * 2;
  // Map theta to a fraction across the cage width (orthographic projection).
  const cosT = Math.cos(theta);
  return {
    x0: (cosT * CAGE_W_TOP) / 2,
    x1: (cosT * CAGE_W_BOT) / 2,
    depth: Math.sin(theta), // -1..1 (back..front)
  };
});

export const PairingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = Math.max(0, frame) / fps;

  // Phases (seconds):
  // 0.0–1.4 : photon rises from seabed along anchor fiber into cage base
  // 0.4–2.4 : cage rings + struts illuminate from bottom up
  // 1.4–2.6 : diagonals trace in (helical light-piping pattern)
  // 2.6+    : steady; gentle photon loop
  const cageT = Math.min(1, Math.max(0, (t - 0.4) / 2.0));
  const diagT = Math.min(1, Math.max(0, (t - 1.4) / 1.2));

  const photonProgress = interpolate(t, [0, 1.4], [0, 1], {
    easing: Easing.bezier(0.2, 0.7, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const loopActive = t > 1.4;
  const loopT = ((t - 1.4) % 3.0) / 3.0;

  const titleSpring = spring({
    frame: frame - fps * 1.0,
    fps,
    config: { damping: 200, mass: 0.8 },
  });
  const hookOpacity = interpolate(frame, [fps * 1.6, fps * 2.6], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Page layout (1080 × 1350 portrait) ──────────────────────────────
  const FRAME = { x: 60, y: 130, w: 960, h: 750 };

  // Cage placed on the LEFT third of the frame so the right has room for
  // the engineering callout. Anchor fiber + seabed stay clear of frame edge.
  const CAGE_CX = FRAME.x + 280;
  const CAGE_TOP_Y = FRAME.y + 60;
  const CAGE_BOTTOM_Y = CAGE_TOP_Y + CAGE_H;
  const ANCHOR_LENGTH = 168;
  const SEABED_Y = CAGE_BOTTOM_Y + ANCHOR_LENGTH;

  // Photon Y along anchor (rises seabed → cage base)
  const photonY = SEABED_Y - photonProgress * (ANCHOR_LENGTH - 4);
  // Loop: rises from seabed up through cage, then resets
  const loopY = SEABED_Y - loopT * (ANCHOR_LENGTH + CAGE_H * 0.92);

  const ringYs = Array.from({ length: RING_COUNT }).map(
    (_, i) => (i / (RING_COUNT - 1)) * CAGE_H
  );

  return (
    <AbsoluteFill style={{ backgroundColor: ABYSS, fontFamily: inter }}>
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
        <span style={{ color: LIGHT }}>2026 · 06 · 29</span>
      </div>

      <svg
        width={1080}
        height={1350}
        viewBox="0 0 1080 1350"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern
            id="grid"
            x={FRAME.x}
            y={FRAME.y}
            width={40}
            height={40}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M 40 0 L 0 0 0 40`}
              fill="none"
              stroke={GRID}
              strokeWidth={1}
            />
          </pattern>
          <pattern
            id="grid-major"
            x={FRAME.x}
            y={FRAME.y}
            width={160}
            height={160}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M 160 0 L 0 0 0 160`}
              fill="none"
              stroke={GRID_MAJOR}
              strokeWidth={1}
            />
          </pattern>

          <radialGradient id="board-vignette" cx="30%" cy="40%" r="85%">
            <stop offset="0%" stopColor={OCEAN} stopOpacity={1} />
            <stop offset="60%" stopColor={OCEAN_DEEP} stopOpacity={1} />
            <stop offset="100%" stopColor={ABYSS} stopOpacity={1} />
          </radialGradient>

          <linearGradient id="fiber-fill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={SILICA} stopOpacity={0.5} />
            <stop offset="60%" stopColor={SILICA_HI} stopOpacity={0.95} />
            <stop offset="100%" stopColor={SILICA_HI} stopOpacity={1} />
          </linearGradient>

          <linearGradient id="cage-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LIGHT} stopOpacity={0.12} />
            <stop offset="100%" stopColor={LIGHT} stopOpacity={0.02} />
          </linearGradient>

          <radialGradient id="photon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={LIGHT_HOT} stopOpacity={1} />
            <stop offset="40%" stopColor={LIGHT} stopOpacity={0.7} />
            <stop offset="100%" stopColor={LIGHT} stopOpacity={0} />
          </radialGradient>

          <filter id="hot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" />
          </filter>

          <filter id="silica-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Schematic board */}
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.w}
          height={FRAME.h}
          fill="url(#board-vignette)"
        />
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.w}
          height={FRAME.h}
          fill="url(#grid)"
          opacity={0.7}
        />
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.w}
          height={FRAME.h}
          fill="url(#grid-major)"
          opacity={0.9}
        />

        {/* Inner thin border */}
        <rect
          x={FRAME.x + 0.5}
          y={FRAME.y + 0.5}
          width={FRAME.w - 1}
          height={FRAME.h - 1}
          fill="none"
          stroke="#23394F"
          strokeWidth={1}
        />

        {/* Corner crop marks (warm silica tone) */}
        {(
          [
            [FRAME.x, FRAME.y, 1, 1],
            [FRAME.x + FRAME.w, FRAME.y, -1, 1],
            [FRAME.x, FRAME.y + FRAME.h, 1, -1],
            [FRAME.x + FRAME.w, FRAME.y + FRAME.h, -1, -1],
          ] as const
        ).map(([cx, cy, sx, sy], i) => (
          <g key={i} stroke={LIGHT} strokeWidth={1.6} fill="none">
            <line x1={cx} y1={cy} x2={cx + sx * 30} y2={cy} />
            <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 30} />
          </g>
        ))}

        {/* Specimen label — far right of frame, clear of the cage */}
        <text
          x={FRAME.x + FRAME.w - 26}
          y={FRAME.y + 36}
          textAnchor="end"
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3.6}
          fontWeight={500}
        >
          CLASS HEXACTINELLIDA · GLASS SPONGE
        </text>

        {/* ── Cage volume tint (subtle inner light) ─────────────────── */}
        <g opacity={cageT}>
          <path
            d={`M ${CAGE_CX - CAGE_W_TOP / 2} ${CAGE_TOP_Y}
                L ${CAGE_CX + CAGE_W_TOP / 2} ${CAGE_TOP_Y}
                L ${CAGE_CX + CAGE_W_BOT / 2} ${CAGE_BOTTOM_Y}
                L ${CAGE_CX - CAGE_W_BOT / 2} ${CAGE_BOTTOM_Y} Z`}
            fill="url(#cage-fill)"
          />
        </g>

        {/* ── Horizontal rings (build from base up — light climbs) ── */}
        {ringYs.map((dy, i) => {
          const yAbs = CAGE_TOP_Y + dy;
          const tFrac = dy / CAGE_H;
          const r = widthAt(tFrac) / 2;
          // Reveal order: bottom ring first (i = RING_COUNT-1)
          const orderFrac = 1 - i / (RING_COUNT - 1);
          const reveal = Math.min(
            1,
            Math.max(0, (cageT - orderFrac * 0.7) * 3.5)
          );
          // Photon-driven highlight: pulse passes each ring once
          const litByLoop = loopActive
            ? (() => {
                const ringPhase = (CAGE_H - dy) / (CAGE_H + ANCHOR_LENGTH);
                const d = Math.abs(loopT - ringPhase);
                return Math.max(0, 1 - d * 6);
              })()
            : 0;
          return (
            <g key={`ring-${i}`} opacity={reveal}>
              {/* glow */}
              <ellipse
                cx={CAGE_CX}
                cy={yAbs}
                rx={r}
                ry={r * 0.22}
                fill="none"
                stroke={LIGHT}
                strokeOpacity={0.45 * litByLoop}
                strokeWidth={4}
                filter="url(#hot-glow)"
              />
              {/* core ring */}
              <ellipse
                cx={CAGE_CX}
                cy={yAbs}
                rx={r}
                ry={r * 0.22}
                fill="none"
                stroke={SILICA_HI}
                strokeOpacity={0.85}
                strokeWidth={1.6}
                filter="url(#silica-glow)"
              />
            </g>
          );
        })}

        {/* ── Vertical struts ──────────────────────────────────────── */}
        {vStruts.map((s, i) => {
          const isFront = s.depth > 0;
          const reveal = Math.min(
            1,
            Math.max(0, (cageT - 0.05 - i * 0.015) * 4)
          );
          const opa = isFront ? 0.9 : 0.22;
          return (
            <line
              key={`v-${i}`}
              x1={CAGE_CX + s.x0}
              y1={CAGE_TOP_Y}
              x2={CAGE_CX + s.x1}
              y2={CAGE_BOTTOM_Y}
              stroke={SILICA}
              strokeOpacity={opa * reveal}
              strokeWidth={isFront ? 1.5 : 1}
              filter={isFront ? "url(#silica-glow)" : undefined}
            />
          );
        })}

        {/* ── Diagonal helical struts (front-facing only, both senses) */}
        {Array.from({ length: DIAG_COUNT }).map((_, i) => {
          const startT = i / (DIAG_COUNT - 1); // 0..1, where each diag starts on top rim
          const r0 = widthAt(0) / 2;
          // Right-handed diagonal
          const x0R = CAGE_CX + (startT - 0.5) * 2 * r0;
          const x1R = CAGE_CX + (Math.min(1, startT + 0.55) - 0.5) * widthAt(0.7);
          const y0R = CAGE_TOP_Y;
          const y1R = CAGE_TOP_Y + Math.min(1, 0.55) * CAGE_H;
          // Reveal staggered after rings
          const reveal = Math.min(1, Math.max(0, (diagT - i * 0.06) * 4));
          // Only draw front-facing diagonals (avoid back clutter)
          const isFrontR = (startT - 0.5) * (Math.min(1, startT + 0.55) - 0.5) > -0.25;
          return (
            <g key={`d-${i}`} opacity={reveal}>
              {isFrontR && (
                <line
                  x1={x0R}
                  y1={y0R}
                  x2={x1R}
                  y2={y1R}
                  stroke={SILICA_HI}
                  strokeOpacity={0.55}
                  strokeWidth={1.1}
                />
              )}
              {/* Left-handed mirror */}
              {(() => {
                const xMir0 = CAGE_CX - (x0R - CAGE_CX);
                const xMir1 = CAGE_CX - (x1R - CAGE_CX);
                return (
                  <line
                    x1={xMir0}
                    y1={y0R}
                    x2={xMir1}
                    y2={y1R}
                    stroke={SILICA_HI}
                    strokeOpacity={0.55}
                    strokeWidth={1.1}
                  />
                );
              })()}
            </g>
          );
        })}

        {/* Mouth rim — bright open osculum */}
        <g opacity={Math.min(1, cageT * 2)}>
          <ellipse
            cx={CAGE_CX}
            cy={CAGE_TOP_Y}
            rx={CAGE_W_TOP / 2}
            ry={CAGE_W_TOP * 0.11}
            fill={ABYSS}
            fillOpacity={0.85}
          />
          <ellipse
            cx={CAGE_CX}
            cy={CAGE_TOP_Y}
            rx={CAGE_W_TOP / 2}
            ry={CAGE_W_TOP * 0.11}
            fill="none"
            stroke={SILICA_HI}
            strokeWidth={2}
            filter="url(#silica-glow)"
          />
        </g>

        {/* Base rim */}
        <g opacity={Math.min(1, cageT * 2)}>
          <ellipse
            cx={CAGE_CX}
            cy={CAGE_BOTTOM_Y}
            rx={CAGE_W_BOT / 2}
            ry={CAGE_W_BOT * 0.13}
            fill="none"
            stroke={SILICA}
            strokeOpacity={0.85}
            strokeWidth={1.6}
            filter="url(#silica-glow)"
          />
        </g>

        {/* ── Anchor fiber (single basal spicule) ───────────────────── */}
        <g>
          {/* outer silica cladding */}
          <rect
            x={CAGE_CX - 5}
            y={CAGE_BOTTOM_Y}
            width={10}
            height={ANCHOR_LENGTH}
            fill={SILICA}
            opacity={0.18}
            rx={5}
          />
          {/* inner core */}
          <rect
            x={CAGE_CX - 1.5}
            y={CAGE_BOTTOM_Y}
            width={3}
            height={ANCHOR_LENGTH}
            fill="url(#fiber-fill)"
            opacity={0.9}
          />
          {/* tiny ladder ticks along fiber, suggesting waveguide segments */}
          {Array.from({ length: 8 }).map((_, i) => {
            const ty = CAGE_BOTTOM_Y + 16 + (i / 7) * (ANCHOR_LENGTH - 32);
            return (
              <line
                key={`tick-${i}`}
                x1={CAGE_CX - 8}
                y1={ty}
                x2={CAGE_CX + 8}
                y2={ty}
                stroke={SILICA}
                strokeOpacity={0.18}
                strokeWidth={1}
              />
            );
          })}
          {/* basal splay into seabed */}
          {[-1, -0.5, 0.5, 1].map((k, i) => (
            <line
              key={`anchor-${i}`}
              x1={CAGE_CX}
              y1={SEABED_Y - 4}
              x2={CAGE_CX + k * 22}
              y2={SEABED_Y + 12}
              stroke={SILICA}
              strokeOpacity={0.6}
              strokeWidth={1}
            />
          ))}
        </g>

        {/* Seabed line (well clear of frame border) */}
        <line
          x1={FRAME.x + 30}
          y1={SEABED_Y}
          x2={FRAME.x + FRAME.w - 30}
          y2={SEABED_Y}
          stroke={GRAY}
          strokeWidth={1}
          strokeDasharray="3 6"
          opacity={0.55}
        />
        <text
          x={FRAME.x + FRAME.w - 36}
          y={SEABED_Y - 10}
          textAnchor="end"
          fill={GRAY}
          fontFamily={inter}
          fontSize={10}
          letterSpacing={2.6}
          fontWeight={500}
        >
          SEABED · ~1 KM · 4 °C
        </text>

        {/* Vertical scale tick on far left of cage */}
        <g
          transform={`translate(${CAGE_CX - CAGE_W_TOP / 2 - 56}, ${CAGE_TOP_Y})`}
          stroke={GRAY}
          fill={GRAY}
          fontFamily={inter}
          fontSize={10}
          letterSpacing={2.6}
          fontWeight={500}
        >
          <line x1={0} y1={0} x2={0} y2={CAGE_H} strokeWidth={1.2} />
          <line x1={-5} y1={0} x2={5} y2={0} strokeWidth={1.2} />
          <line
            x1={-3}
            y1={CAGE_H / 2}
            x2={3}
            y2={CAGE_H / 2}
            strokeWidth={1.2}
          />
          <line x1={-5} y1={CAGE_H} x2={5} y2={CAGE_H} strokeWidth={1.2} />
          <text x={-10} y={CAGE_H / 2 + 3} stroke="none" textAnchor="end">
            20 CM
          </text>
        </g>

        {/* ── Photon traveling up the anchor fiber (intro) ─────────── */}
        {!loopActive && (
          <g>
            <circle
              cx={CAGE_CX}
              cy={photonY}
              r={42}
              fill="url(#photon-glow)"
              filter="url(#hot-glow)"
              opacity={0.85}
            />
            <circle
              cx={CAGE_CX}
              cy={photonY}
              r={18}
              fill="url(#photon-glow)"
            />
            <circle cx={CAGE_CX} cy={photonY} r={5} fill={LIGHT_HOT} />
          </g>
        )}

        {/* ── Loop photon: rises seabed → cage → mouth ─────────────── */}
        {loopActive && (
          <g opacity={Math.min(1, (t - 1.4) * 2)}>
            <circle
              cx={CAGE_CX}
              cy={loopY}
              r={38}
              fill="url(#photon-glow)"
              filter="url(#hot-glow)"
              opacity={0.8}
            />
            <circle
              cx={CAGE_CX}
              cy={loopY}
              r={14}
              fill="url(#photon-glow)"
            />
            <circle cx={CAGE_CX} cy={loopY} r={4} fill={LIGHT_HOT} />
          </g>
        )}

        {/* ── Engineering callout: cross-section of a spicule ──────── */}
        {(() => {
          const cx = FRAME.x + FRAME.w - 170;
          const cy = FRAME.y + 200;
          const op = Math.min(1, Math.max(0, (t - 1.8) * 2));
          // Leader from the right rim of the cage at 60% down (below the
          // diagonals which end at 55%), routed up-and-right through empty
          // negative space to the callout circle. Stays clear of the
          // SPECIFICATION block which sits lower.
          const leadFromX = CAGE_CX + widthAt(0.6) / 2;
          const leadFromY = CAGE_TOP_Y + 0.6 * CAGE_H;
          const leadKinkX = cx - 70;
          const leadKinkY = leadFromY;
          return (
            <g opacity={op}>
              <line
                x1={leadFromX}
                y1={leadFromY}
                x2={leadKinkX}
                y2={leadKinkY}
                stroke={LIGHT}
                strokeOpacity={0.7}
                strokeWidth={1}
              />
              <line
                x1={leadKinkX}
                y1={leadKinkY}
                x2={cx - 38}
                y2={cy + 36}
                stroke={LIGHT}
                strokeOpacity={0.7}
                strokeWidth={1}
              />
              <circle
                cx={leadFromX}
                cy={leadFromY}
                r={2.5}
                fill={LIGHT}
              />
              {/* Cross-section: concentric silica layers + bright core */}
              <circle cx={cx} cy={cy} r={52} fill={ABYSS} />
              <circle
                cx={cx}
                cy={cy}
                r={52}
                fill="none"
                stroke={SILICA}
                strokeOpacity={0.3}
                strokeWidth={1}
              />
              <circle
                cx={cx}
                cy={cy}
                r={38}
                fill="none"
                stroke={SILICA}
                strokeOpacity={0.55}
                strokeWidth={1.1}
              />
              <circle
                cx={cx}
                cy={cy}
                r={24}
                fill="none"
                stroke={SILICA_HI}
                strokeOpacity={0.9}
                strokeWidth={1.4}
                filter="url(#silica-glow)"
              />
              <circle
                cx={cx}
                cy={cy}
                r={14}
                fill={LIGHT}
                fillOpacity={0.25}
              />
              <circle
                cx={cx}
                cy={cy}
                r={8}
                fill={LIGHT_HOT}
                filter="url(#hot-glow)"
              />
              <circle cx={cx} cy={cy} r={3.5} fill="#FFFFFF" />

              {/* Tick labels */}
              <g
                fill={GRAY}
                fontFamily={inter}
                fontSize={10}
                letterSpacing={2.4}
                fontWeight={500}
              >
                <line
                  x1={cx + 8}
                  y1={cy - 72}
                  x2={cx + 8}
                  y2={cy - 9}
                  stroke={GRAY}
                  strokeWidth={1}
                />
                <text x={cx + 16} y={cy - 72} textAnchor="start" fill={LIGHT}>
                  CORE
                </text>
                <text x={cx + 16} y={cy - 58} textAnchor="start">
                  GUIDED LIGHT
                </text>

                <line
                  x1={cx + 26}
                  y1={cy + 4}
                  x2={cx + 64}
                  y2={cy + 4}
                  stroke={GRAY}
                  strokeWidth={1}
                />
                <text x={cx + 70} y={cy + 8} textAnchor="start">
                  BIOSILICA
                </text>
                <text x={cx + 70} y={cy + 22} textAnchor="start">
                  CLADDING
                </text>

                <text
                  x={cx}
                  y={cy + 78}
                  textAnchor="middle"
                  fill={SILICA}
                  fontSize={10}
                  letterSpacing={3}
                >
                  FIG. 2 · SPICULE SECTION
                </text>
              </g>
            </g>
          );
        })()}

        {/* ── Specs strip, right side, beneath callout ─────────────── */}
        <g
          transform={`translate(${FRAME.x + FRAME.w - 280}, ${FRAME.y + 380})`}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11.5}
          letterSpacing={3}
          fontWeight={500}
          opacity={Math.min(1, Math.max(0, (t - 2.0) * 2))}
        >
          <text y={0} fill={SILICA} letterSpacing={3.6}>
            SPECIFICATION
          </text>
          <line
            x1={0}
            y1={12}
            x2={222}
            y2={12}
            stroke={SILICA}
            strokeOpacity={0.35}
            strokeWidth={1}
          />
          <text y={36}>
            λ
            <tspan dx={10} fill={GRAY}>
              VIS — NEAR-IR
            </tspan>
          </text>
          <text y={60}>SYNTHESIS · 4 °C SEAWATER</text>
          <text y={84}>VS. SiO₂ FIBER · &gt; 1000 °C</text>
          <text y={108}>ATTENUATION · COMPARABLE</text>
        </g>

        {/* Caption strip just below the schematic frame */}
        <g
          transform={`translate(${FRAME.x}, ${FRAME.y + FRAME.h + 22})`}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3}
          fontWeight={500}
        >
          <text>FIG. 1 · BASAL ANCHOR FIBER GUIDES LIGHT INTO LATTICE</text>
          <text
            x={FRAME.w}
            textAnchor="end"
            fill={LIGHT}
            opacity={0.85}
          >
            VENUS' FLOWER BASKET · PACIFIC, ABYSSAL
          </text>
        </g>
      </svg>

      {/* ── Type lockup ────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 945,
          opacity: titleSpring,
          transform: `translateY(${interpolate(
            titleSpring,
            [0, 1],
            [16, 0],
          )}px)`,
        }}
      >
        <div
          style={{
            color: LIGHT,
            fontFamily: inter,
            fontSize: 13,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 18,
            fontWeight: 600,
          }}
        >
          Role <span style={{ color: GRAY, margin: "0 4px" }}>/</span>
          <span style={{ color: "#F0E9D6", letterSpacing: 5 }}>
            Fiber-Optic Engineer
          </span>
        </div>

        <div
          style={{
            color: "#F4ECD2",
            fontFamily: playfair,
            fontWeight: 500,
            fontSize: 82,
            lineHeight: 0.96,
            letterSpacing: -1.4,
            fontStyle: "italic",
          }}
        >
          The deep-sea
          <br />
          cable spinner.
        </div>

        <div
          style={{
            marginTop: 28,
            color: "#CFC9B9",
            fontFamily: inter,
            fontSize: 19,
            lineHeight: 1.42,
            fontWeight: 400,
            maxWidth: 880,
            opacity: hookOpacity,
          }}
        >
          A kilometer down in the Pacific,{" "}
          <span style={{ color: LIGHT, fontWeight: 600 }}>
            Euplectella aspergillum
          </span>{" "}
          spins a basal anchor of biosilica that guides light along its
          length like commercial telecom fiber — only grown at 4 °C, not
          a thousand degrees in a furnace.
        </div>
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
        <span>Sundar et al. · Nature 424 (2003) 899–900</span>
        <span>
          <span style={{ color: LIGHT }}>●</span> Photon — guided
        </span>
      </div>
    </AbsoluteFill>
  );
};
