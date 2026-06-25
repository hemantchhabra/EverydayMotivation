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
const INK = "#0E1014";
const BOARD = "#13161C";
const PHYSARUM = "#F4C430";
const PHYSARUM_GLOW = "#FFE99A";
const OAT = "#E8704A";
const GRAY = "#8A8F99";
const GRID = "#1F242D";
const GRID_MAJOR = "#2A303B";

// ── Map layout (coord space: 1080 × 800) ──────────────────────────────────
// A stylised Greater Tokyo arrangement. Tokyo sits a touch right-of-centre;
// outer prefectural cities radiate roughly to their real compass bearings.
type Node = { id: string; x: number; y: number; label: string };
const TOKYO: Node = { id: "tokyo", x: 540, y: 430, label: "Tokyo" };
const NODES: Node[] = [
  { id: "yokohama", x: 460, y: 555, label: "Yokohama" },
  { id: "kawasaki", x: 495, y: 510, label: "Kawasaki" },
  { id: "chiba", x: 740, y: 510, label: "Chiba" },
  { id: "funabashi", x: 670, y: 470, label: "Funabashi" },
  { id: "saitama", x: 520, y: 320, label: "Saitama" },
  { id: "kasukabe", x: 615, y: 290, label: "Kasukabe" },
  { id: "hachioji", x: 340, y: 490, label: "Hachioji" },
  { id: "tachikawa", x: 390, y: 425, label: "Tachikawa" },
  { id: "mito", x: 845, y: 295, label: "Mito" },
  { id: "utsunomiya", x: 610, y: 195, label: "Utsunomiya" },
  { id: "takasaki", x: 250, y: 320, label: "Takasaki" },
  { id: "maebashi", x: 195, y: 235, label: "Maebashi" },
  { id: "numazu", x: 200, y: 640, label: "Numazu" },
  { id: "choshi", x: 925, y: 565, label: "Choshi" },
  { id: "tateyama", x: 585, y: 730, label: "Tateyama" },
  { id: "odawara", x: 335, y: 660, label: "Odawara" },
];

type Edge = { from: string; to: string; w: number; delay: number };
const EDGES: Edge[] = [
  // Trunks radiating from Tokyo
  { from: "tokyo", to: "kawasaki", w: 14, delay: 0.0 },
  { from: "tokyo", to: "saitama", w: 13, delay: 0.05 },
  { from: "tokyo", to: "funabashi", w: 13, delay: 0.08 },
  { from: "tokyo", to: "tachikawa", w: 12, delay: 0.1 },
  { from: "kawasaki", to: "yokohama", w: 12, delay: 0.12 },
  { from: "funabashi", to: "chiba", w: 11, delay: 0.14 },

  // Secondary trunks
  { from: "saitama", to: "kasukabe", w: 9, delay: 0.2 },
  { from: "tachikawa", to: "hachioji", w: 9, delay: 0.22 },
  { from: "yokohama", to: "odawara", w: 9, delay: 0.25 },
  { from: "saitama", to: "tachikawa", w: 8, delay: 0.27 },
  { from: "kasukabe", to: "utsunomiya", w: 8, delay: 0.3 },
  { from: "chiba", to: "choshi", w: 8, delay: 0.32 },
  { from: "chiba", to: "tateyama", w: 8, delay: 0.35 },

  // Long radiants
  { from: "hachioji", to: "takasaki", w: 6, delay: 0.4 },
  { from: "takasaki", to: "maebashi", w: 6, delay: 0.45 },
  { from: "utsunomiya", to: "mito", w: 6, delay: 0.48 },
  { from: "odawara", to: "numazu", w: 6, delay: 0.5 },

  // Cross-links — the Physarum redundancy that gives fault-tolerance
  { from: "takasaki", to: "saitama", w: 4, delay: 0.6 },
  { from: "mito", to: "kasukabe", w: 4, delay: 0.62 },
  { from: "numazu", to: "hachioji", w: 4, delay: 0.65 },
  { from: "tateyama", to: "yokohama", w: 4, delay: 0.68 },
  { from: "kasukabe", to: "funabashi", w: 4, delay: 0.7 },
  { from: "maebashi", to: "takasaki", w: 3.5, delay: 0.72 },
  { from: "yokohama", to: "funabashi", w: 3.5, delay: 0.75 },
];

// Outer-city labels (id → placement direction and offset px)
type LabelPlacement = {
  id: string;
  text: string;
  dx: number;
  dy: number;
  anchor: "start" | "middle" | "end";
};
const LABELS: LabelPlacement[] = [
  { id: "yokohama", text: "YOKOHAMA", dx: -14, dy: 4, anchor: "end" },
  { id: "chiba", text: "CHIBA", dx: 16, dy: 4, anchor: "start" },
  { id: "saitama", text: "SAITAMA", dx: -14, dy: 4, anchor: "end" },
  { id: "mito", text: "MITO", dx: 16, dy: 4, anchor: "start" },
  { id: "utsunomiya", text: "UTSUNOMIYA", dx: 16, dy: 4, anchor: "start" },
  { id: "maebashi", text: "MAEBASHI", dx: -14, dy: 4, anchor: "end" },
  { id: "numazu", text: "NUMAZU", dx: -14, dy: 4, anchor: "end" },
  { id: "tateyama", text: "TATEYAMA", dx: 0, dy: 22, anchor: "middle" },
  { id: "choshi", text: "CHOSHI", dx: -14, dy: -10, anchor: "end" },
];

const nodeById = (id: string): Node =>
  id === "tokyo" ? TOKYO : (NODES.find((n) => n.id === id) as Node);

const hashSeed = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) * 16777619;
  }
  return ((h >>> 0) % 1000) / 1000;
};

const edgePath = (e: Edge): string => {
  const a = nodeById(e.from);
  const b = nodeById(e.to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const seed = hashSeed(e.from + "|" + e.to);
  const bend = (seed - 0.5) * 0.18 * len;
  const mx = (a.x + b.x) / 2 + nx * bend;
  const my = (a.y + b.y) / 2 + ny * bend;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
};

const edgeLen = (e: Edge): number => {
  const a = nodeById(e.from);
  const b = nodeById(e.to);
  return Math.hypot(b.x - a.x, b.y - a.y) * 1.05;
};

export const SlimeMoldCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const growSpan = fps * 2.6;
  const t = Math.max(0, frame) / growSpan;

  const pulseProgress = (frame % (fps * 4)) / (fps * 4);

  const titleSpring = spring({
    frame: frame - fps * 0.4,
    fps,
    config: { damping: 200, mass: 0.8 },
  });

  const hookOpacity = interpolate(frame, [fps * 1.0, fps * 1.9], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Page layout (1080 × 1350 portrait) ──────────────────────────────
  // Top metadata band: 0..110
  // Drafting frame      : 130..841 (h 711, w 960; aspect 1.35 = 1080/800)
  // Title block         : 880..
  // Hook                : ~1095..
  // Footer              : 1280..
  const FRAME = { x: 60, y: 130, w: 960, h: 711 };
  const MAP_W = 1080;
  const MAP_H = 800;
  const scale = FRAME.w / MAP_W; // = FRAME.h / MAP_H

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
        <span>Everyday Motivation · No. 002</span>
        <span style={{ color: PHYSARUM }}>2026 · 06 · 24</span>
      </div>

      {/* Drafting frame + map */}
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
            width={48 * scale}
            height={48 * scale}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${48 * scale} 0 L 0 0 0 ${48 * scale}`}
              fill="none"
              stroke={GRID}
              strokeWidth={1}
            />
          </pattern>
          <pattern
            id="grid-major"
            x={FRAME.x}
            y={FRAME.y}
            width={192 * scale}
            height={192 * scale}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${192 * scale} 0 L 0 0 0 ${192 * scale}`}
              fill="none"
              stroke={GRID_MAJOR}
              strokeWidth={1}
            />
          </pattern>

          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={OAT} stopOpacity={0.55} />
            <stop offset="100%" stopColor={OAT} stopOpacity={0} />
          </radialGradient>

          <radialGradient id="board-vignette" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#161A22" stopOpacity={1} />
            <stop offset="100%" stopColor={BOARD} stopOpacity={1} />
          </radialGradient>

          <filter id="tube-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Drafting board */}
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
        />
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.w}
          height={FRAME.h}
          fill="url(#grid-major)"
        />

        {/* Inner thin border */}
        <rect
          x={FRAME.x + 0.5}
          y={FRAME.y + 0.5}
          width={FRAME.w - 1}
          height={FRAME.h - 1}
          fill="none"
          stroke="#2B313C"
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
          <g key={i} stroke={OAT} strokeWidth={1.5} fill="none">
            <line x1={cx} y1={cy} x2={cx + sx * 26} y2={cy} />
            <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 26} />
          </g>
        ))}

        {/* N marker */}
        <g
          transform={`translate(${FRAME.x + 26}, ${FRAME.y + 30})`}
          fill={GRAY}
          fontFamily={inter}
          fontWeight={600}
          fontSize={11}
          letterSpacing={3}
        >
          <text textAnchor="start">N</text>
          <line
            x1={5}
            y1={6}
            x2={5}
            y2={24}
            stroke={GRAY}
            strokeWidth={1.2}
          />
          <polygon points={`2,9 5,2 8,9`} fill={OAT} />
        </g>

        {/* Scale bar */}
        <g
          transform={`translate(${FRAME.x + FRAME.w - 160}, ${
            FRAME.y + FRAME.h - 28
          })`}
          stroke={GRAY}
          fill={GRAY}
          fontFamily={inter}
          fontSize={10}
          letterSpacing={3}
          fontWeight={500}
        >
          <line x1={0} y1={0} x2={100} y2={0} strokeWidth={1.2} />
          <line x1={0} y1={-5} x2={0} y2={5} strokeWidth={1.2} />
          <line x1={50} y1={-3} x2={50} y2={3} strokeWidth={1.2} />
          <line x1={100} y1={-5} x2={100} y2={5} strokeWidth={1.2} />
          <text x={110} y={4} stroke="none">
            50 KM
          </text>
        </g>

        {/* Map content: scale 1080×800 coords into FRAME */}
        <g transform={`translate(${FRAME.x}, ${FRAME.y}) scale(${scale})`}>
          {/* Edges: outer glow layer first */}
          {EDGES.map((e, i) => {
            const len = edgeLen(e);
            const localT = (t - e.delay) / 0.18;
            const grow = Math.max(0, Math.min(1, localT));
            const eased = 1 - Math.pow(1 - grow, 3);
            const dashOffset = len * (1 - eased);
            return (
              <path
                key={`glow-${i}`}
                d={edgePath(e)}
                stroke={PHYSARUM}
                strokeWidth={e.w + 6}
                strokeOpacity={0.18 * eased}
                fill="none"
                strokeLinecap="round"
                filter="url(#tube-glow)"
                strokeDasharray={len}
                strokeDashoffset={dashOffset}
              />
            );
          })}
          {/* Edges: cores */}
          {EDGES.map((e, i) => {
            const len = edgeLen(e);
            const localT = (t - e.delay) / 0.18;
            const grow = Math.max(0, Math.min(1, localT));
            const eased = 1 - Math.pow(1 - grow, 3);
            const dashOffset = len * (1 - eased);
            return (
              <g key={`core-${i}`}>
                <path
                  d={edgePath(e)}
                  stroke={PHYSARUM}
                  strokeWidth={e.w}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={len}
                  strokeDashoffset={dashOffset}
                />
                <path
                  d={edgePath(e)}
                  stroke={PHYSARUM_GLOW}
                  strokeWidth={Math.max(1, e.w - 4)}
                  strokeOpacity={0.55}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={len}
                  strokeDashoffset={dashOffset}
                />
              </g>
            );
          })}

          {/* Pulse along main trunk */}
          {t > 0.9 &&
            (() => {
              const trunk = ["tokyo", "kawasaki", "yokohama", "odawara"].map(
                nodeById,
              );
              const segs = trunk
                .slice(1)
                .map((n, i) => Math.hypot(n.x - trunk[i].x, n.y - trunk[i].y));
              const total = segs.reduce((a, b) => a + b, 0);
              const along = pulseProgress * total;
              let acc = 0;
              let p = trunk[0];
              for (let i = 0; i < segs.length; i++) {
                if (acc + segs[i] >= along) {
                  const f = (along - acc) / segs[i];
                  p = {
                    id: "p",
                    label: "",
                    x: trunk[i].x + (trunk[i + 1].x - trunk[i].x) * f,
                    y: trunk[i].y + (trunk[i + 1].y - trunk[i].y) * f,
                  };
                  break;
                }
                acc += segs[i];
              }
              const fadeIn = Math.min(1, (t - 0.9) * 4);
              return (
                <g opacity={fadeIn}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={14}
                    fill={PHYSARUM_GLOW}
                    opacity={0.35}
                  />
                  <circle cx={p.x} cy={p.y} r={5} fill="#FFFFFF" />
                </g>
              );
            })()}

          {/* Nodes (oat flakes) */}
          {[TOKYO, ...NODES].map((n) => {
            const isCenter = n.id === "tokyo";
            const apparition = Math.min(
              1,
              Math.max(0, t - (isCenter ? 0 : 0.04)) * 3,
            );
            const r = isCenter ? 12 : 6;
            return (
              <g key={n.id} opacity={apparition}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r * 2.8}
                  fill="url(#node-glow)"
                />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={OAT}
                  stroke={INK}
                  strokeWidth={isCenter ? 3 : 2}
                />
              </g>
            );
          })}

          {/* Outer-city labels */}
          {LABELS.map((l) => {
            const n = nodeById(l.id);
            const op = Math.min(1, Math.max(0, t - 0.5) * 2);
            return (
              <text
                key={`lbl-${l.id}`}
                x={n.x + l.dx}
                y={n.y + l.dy}
                textAnchor={l.anchor}
                fill={GRAY}
                fontFamily={inter}
                fontSize={11}
                fontWeight={500}
                letterSpacing={2.4}
                opacity={op}
              >
                {l.text}
              </text>
            );
          })}

          {/* Tokyo callout — leader into the empty NE quadrant */}
          <g opacity={Math.min(1, Math.max(0, t - 0.05) * 3)}>
            <line
              x1={TOKYO.x + 10}
              y1={TOKYO.y - 6}
              x2={TOKYO.x + 130}
              y2={TOKYO.y - 80}
              stroke={OAT}
              strokeWidth={1.2}
            />
            <line
              x1={TOKYO.x + 130}
              y1={TOKYO.y - 80}
              x2={TOKYO.x + 180}
              y2={TOKYO.y - 80}
              stroke={OAT}
              strokeWidth={1.2}
            />
            <rect
              x={TOKYO.x + 178}
              y={TOKYO.y - 92}
              width={94}
              height={24}
              rx={2}
              fill={INK}
              stroke={OAT}
              strokeWidth={1.2}
            />
            <text
              x={TOKYO.x + 225}
              y={TOKYO.y - 76}
              textAnchor="middle"
              fill={OAT}
              fontFamily={inter}
              fontSize={11}
              fontWeight={600}
              letterSpacing={3.5}
            >
              TOKYO
            </text>
          </g>
        </g>

        {/* Caption strip just below the drafting frame */}
        <g
          transform={`translate(${FRAME.x}, ${FRAME.y + FRAME.h + 22})`}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3}
          fontWeight={500}
        >
          <text>FIG. 1 · TUBE NETWORK GROWN BY P. POLYCEPHALUM, 26 H</text>
          <text
            x={FRAME.w}
            textAnchor="end"
            fill={PHYSARUM}
            opacity={0.85}
          >
            REPLICA OF TOKYO RAIL TOPOLOGY
          </text>
        </g>
      </svg>

      {/* ── Type lockup ────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 905,
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
            color: PHYSARUM,
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
            Urban Planner
          </span>
        </div>

        <div
          style={{
            color: "#F4F4F6",
            fontFamily: playfair,
            fontWeight: 500,
            fontSize: 84,
            lineHeight: 0.96,
            letterSpacing: -1.4,
            fontStyle: "italic",
          }}
        >
          The brainless
          <br />
          city planner.
        </div>

        <div
          style={{
            marginTop: 30,
            color: "#C8CAD0",
            fontFamily: inter,
            fontSize: 19,
            lineHeight: 1.4,
            fontWeight: 400,
            maxWidth: 880,
            opacity: hookOpacity,
          }}
        >
          Given oat flakes at the locations of 36 cities around Tokyo,{" "}
          <span style={{ color: PHYSARUM, fontWeight: 600 }}>
            Physarum polycephalum
          </span>{" "}
          — a single-celled slime mold with no nervous system — grew a
          transport network whose length, efficiency, and fault-tolerance
          matched the Greater Tokyo rail system.
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
        <span>Tero et al. · Science 327 (2010) 439–442</span>
        <span>
          <span style={{ color: OAT }}>●</span> Oat flake = City
        </span>
      </div>
    </AbsoluteFill>
  );
};
