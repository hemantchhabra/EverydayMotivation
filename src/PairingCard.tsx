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
const INK = "#0B0B10";
const CHITIN = "#17181F"; // body — slightly lighter than INK so silhouette reads
const PAPER = "#E6E1D2";
const PAPER_DIM = "#B5B0A0";
const VERMILION = "#E64A1F";
const AMBER = "#F2C065";
const GRAPHITE = "#5E6571";
const RULE = "#1C1D24";
const RULE_FAINT = "#15161C";

// ── Layout constants (1080 × 1350 portrait) ─────────────────────────────
// Top metadata band:  ~56
// Drawn frame inset:   60 / right 60
// Century ledger:      centered, y ~ 200..820
// Cicada hero:         centered on ledger
// Type lockup:         y ~ 900..1230
// Footer:              y ~ 1290

const FRAME = { x: 60, y: 130, w: 960, h: 740 };

// Century-ledger grid — 10 cols × 10 rows of year cells.
const COLS = 10;
const ROWS = 10;
const CELL_W = 78;
const CELL_H = 60;
const GRID_W = COLS * CELL_W; // 780
const GRID_H = ROWS * CELL_H; // 600
const GRID_X = (1080 - GRID_W) / 2; // 150
const GRID_Y = 200;

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

const yearKind = (n: number): "brood17" | "brood13" | "prime" | "plain" => {
  if (n % 17 === 0 && n > 0) return "brood17";
  if (n % 13 === 0 && n > 0) return "brood13";
  if (isPrime(n)) return "prime";
  return "plain";
};

// Emergence years in 1..100 for the 17-year cycle — the ones that pulse.
const BROOD17_YEARS = [17, 34, 51, 68, 85];

// ── Cicada silhouette ───────────────────────────────────────────────────
// Stylised dorsal view, centred at (0,0). Body axis vertical (head up).
// Coordinates roughly span -180..180 horizontally, -160..220 vertically.
const Cicada: React.FC<{
  wingOpacity: number;
  wingSpread: number; // 0..1
  bodyOpacity: number;
}> = ({ wingOpacity, wingSpread, bodyOpacity }) => {
  // Wing path (right side) — pear-shaped, strictly on the right of x=0
  // so the mirrored copy doesn't overlap the body centreline.
  const wingPath =
    "M 22 -72 C 86 -82, 152 -42, 168 28 C 178 96, 142 168, 86 186 C 56 194, 30 174, 24 138 C 18 96, 18 32, 22 -72 Z";
  // Vein curves for the right wing — Magicicada's diagnostic amber venation.
  const veinPaths = [
    "M 30 -58 C 70 -38, 116 4, 144 64",
    "M 30 -28 C 64 -8, 110 32, 144 96",
    "M 28 6 C 58 28, 100 68, 138 128",
    "M 30 42 C 54 64, 92 102, 128 154",
    "M 34 -48 C 96 -28, 144 4, 168 50",
    "M 32 80 C 56 100, 84 130, 110 168",
  ];
  const sweep = interpolate(wingSpread, [0, 1], [0.62, 1.0]);

  return (
    <g>
      {/* Wings — drawn first so they sit under the body. Translucent so
          the century ledger reads clean through the venation. */}
      <g opacity={wingOpacity}>
        {/* Right wing */}
        <g transform={`scale(${sweep}, 1)`}>
          <path
            d={wingPath}
            fill={AMBER}
            fillOpacity={0.045}
            stroke={AMBER}
            strokeOpacity={0.55}
            strokeWidth={1.3}
          />
          {veinPaths.map((d, i) => (
            <path
              key={`vr-${i}`}
              d={d}
              fill="none"
              stroke={AMBER}
              strokeOpacity={0.42}
              strokeWidth={1.0}
            />
          ))}
        </g>
        {/* Left wing — mirrored */}
        <g transform={`scale(${-sweep}, 1)`}>
          <path
            d={wingPath}
            fill={AMBER}
            fillOpacity={0.045}
            stroke={AMBER}
            strokeOpacity={0.55}
            strokeWidth={1.3}
          />
          {veinPaths.map((d, i) => (
            <path
              key={`vl-${i}`}
              d={d}
              fill="none"
              stroke={AMBER}
              strokeOpacity={0.42}
              strokeWidth={1.0}
            />
          ))}
        </g>
      </g>

      {/* Body */}
      <g opacity={bodyOpacity}>
        {/* Thorax shield */}
        <path
          d="M -32 -86 C -32 -116, -20 -136, 0 -136 C 20 -136, 32 -116, 32 -86 C 32 -60, 20 -52, 0 -52 C -20 -52, -32 -60, -32 -86 Z"
          fill={CHITIN}
          stroke={PAPER}
          strokeOpacity={0.32}
          strokeWidth={1.2}
        />
        {/* Head — slightly wider than tall, with eyes flanking */}
        <ellipse
          cx={0}
          cy={-148}
          rx={24}
          ry={16}
          fill={CHITIN}
          stroke={PAPER}
          strokeOpacity={0.32}
          strokeWidth={1.2}
        />
        {/* Compound eyes — the famous Magicicada vermilion */}
        <circle cx={-19} cy={-150} r={7} fill={VERMILION} />
        <circle cx={19} cy={-150} r={7} fill={VERMILION} />
        {/* Eye highlights */}
        <circle cx={-21} cy={-152} r={1.6} fill={AMBER} opacity={0.85} />
        <circle cx={17} cy={-152} r={1.6} fill={AMBER} opacity={0.85} />
        {/* Antennae — short, forward-sweeping bristles */}
        <path
          d="M -10 -160 C -18 -168, -26 -172, -32 -170"
          fill="none"
          stroke={PAPER}
          strokeOpacity={0.5}
          strokeWidth={1.2}
        />
        <path
          d="M 10 -160 C 18 -168, 26 -172, 32 -170"
          fill="none"
          stroke={PAPER}
          strokeOpacity={0.5}
          strokeWidth={1.2}
        />
        {/* Abdomen — segmented teardrop, tapers to point */}
        <path
          d="M -26 -52 C -34 -8, -22 78, 0 126 C 22 78, 34 -8, 26 -52 Z"
          fill={CHITIN}
          stroke={PAPER}
          strokeOpacity={0.32}
          strokeWidth={1.2}
        />
        {/* Segment lines on abdomen */}
        {[-30, -10, 14, 42, 72, 100].map((y, i) => {
          const t = (y + 30) / 130;
          const w = 24 * (1 - 0.55 * t);
          return (
            <line
              key={`seg-${i}`}
              x1={-w}
              y1={y}
              x2={w}
              y2={y}
              stroke={PAPER}
              strokeOpacity={0.2}
              strokeWidth={0.9}
            />
          );
        })}
        {/* Thorax centre rib */}
        <line
          x1={0}
          y1={-128}
          x2={0}
          y2={-56}
          stroke={PAPER}
          strokeOpacity={0.22}
          strokeWidth={0.9}
        />
      </g>
    </g>
  );
};

export const PairingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Animation tracks ───────────────────────────────────────────────
  // 0.00–1.40s : grid sweeps in row-by-row
  // 0.80–1.40s : cicada drops + wings unfurl (spring)
  // 1.20–2.10s : title block springs up
  // 1.60–2.40s : hook fades in
  // 2.80s+    : emergence cells pulse 17 → 34 → 51 → 68 → 85 in a loop

  const gridRowReveal = (row: number): number => {
    const start = row * 0.08; // staggered start
    const local = (frame / fps - start) / 0.5;
    return Math.max(0, Math.min(1, local));
  };

  const cicadaSpring = spring({
    frame: frame - fps * 0.7,
    fps,
    config: { damping: 18, mass: 1.1, stiffness: 110 },
  });
  const cicadaDrop = interpolate(cicadaSpring, [0, 1], [-40, 0]);
  const cicadaBody = interpolate(cicadaSpring, [0, 1], [0, 1]);

  const wingsSpring = spring({
    frame: frame - fps * 1.0,
    fps,
    config: { damping: 14, mass: 1.0, stiffness: 90 },
  });
  const wingOpacity = interpolate(wingsSpring, [0, 1], [0, 0.85]);

  const titleSpring = spring({
    frame: frame - fps * 1.2,
    fps,
    config: { damping: 200, mass: 0.8 },
  });

  const hookOpacity = interpolate(
    frame,
    [fps * 1.6, fps * 2.4],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Pulse cycle for emergence years: each year lights for 0.45s, gap 0.15s.
  const pulseStart = fps * 2.8;
  const pulsePer = fps * 0.55;
  const pulseIndex = Math.floor(
    ((frame - pulseStart) % (pulsePer * BROOD17_YEARS.length)) / pulsePer,
  );
  const pulseLocal = Math.max(
    0,
    ((frame - pulseStart) % pulsePer) / pulsePer,
  );
  const pulseStrength = (year: number): number => {
    if (frame < pulseStart) return 0;
    if (BROOD17_YEARS[pulseIndex] !== year) return 0;
    // Quick rise, slow fade.
    return Math.max(
      0,
      pulseLocal < 0.25
        ? pulseLocal / 0.25
        : 1 - (pulseLocal - 0.25) / 0.75,
    );
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <AbsoluteFill style={{ backgroundColor: INK, fontFamily: inter }}>
      <style>{fontCss}</style>

      {/* Subtle paper-grain vignette via overlay rect */}
      <svg
        width={1080}
        height={1350}
        viewBox="0 0 1080 1350"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient id="page-vignette" cx="50%" cy="44%" r="68%">
            <stop offset="0%" stopColor="#13141A" stopOpacity={1} />
            <stop offset="100%" stopColor={INK} stopOpacity={1} />
          </radialGradient>
          <radialGradient id="brood-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={VERMILION} stopOpacity={0.55} />
            <stop offset="100%" stopColor={VERMILION} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="amber-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={AMBER} stopOpacity={0.4} />
            <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
          </radialGradient>
          <filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <rect width={1080} height={1350} fill="url(#page-vignette)" />

        {/* Hairline corner crop marks — like a printed plate */}
        {(
          [
            [FRAME.x, FRAME.y, 1, 1],
            [FRAME.x + FRAME.w, FRAME.y, -1, 1],
            [FRAME.x, FRAME.y + FRAME.h, 1, -1],
            [FRAME.x + FRAME.w, FRAME.y + FRAME.h, -1, -1],
          ] as const
        ).map(([cx, cy, sx, sy], i) => (
          <g key={i} stroke={PAPER_DIM} strokeOpacity={0.45} strokeWidth={1}>
            <line x1={cx} y1={cy} x2={cx + sx * 22} y2={cy} />
            <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 22} />
          </g>
        ))}

        {/* ── Century ledger ──────────────────────────────────────── */}
        <g>
          {/* Faint inner border */}
          <rect
            x={GRID_X - 14}
            y={GRID_Y - 14}
            width={GRID_W + 28}
            height={GRID_H + 28}
            fill="none"
            stroke={RULE}
            strokeWidth={1}
          />
          {/* Major rules every 5 cells (50-year and mid lines) */}
          {[5].map((c) => (
            <line
              key={`vmaj-${c}`}
              x1={GRID_X + c * CELL_W}
              y1={GRID_Y}
              x2={GRID_X + c * CELL_W}
              y2={GRID_Y + GRID_H}
              stroke={RULE}
              strokeWidth={1}
            />
          ))}
          {[5].map((r) => (
            <line
              key={`hmaj-${r}`}
              x1={GRID_X}
              y1={GRID_Y + r * CELL_H}
              x2={GRID_X + GRID_W}
              y2={GRID_Y + r * CELL_H}
              stroke={RULE}
              strokeWidth={1}
            />
          ))}

          {/* Cells */}
          {Array.from({ length: 100 }, (_, i) => i + 1).map((year) => {
            const row = Math.floor((year - 1) / COLS);
            const col = (year - 1) % COLS;
            const cx = GRID_X + col * CELL_W + CELL_W / 2;
            const cy = GRID_Y + row * CELL_H + CELL_H / 2;
            const reveal = gridRowReveal(row);
            const kind = yearKind(year);
            const pulse = pulseStrength(year);

            const isBrood17 = kind === "brood17";
            const isBrood13 = kind === "brood13";

            const fill =
              kind === "brood17"
                ? VERMILION
                : kind === "brood13"
                  ? AMBER
                  : kind === "prime"
                    ? PAPER
                    : GRAPHITE;
            const labelOpacity =
              kind === "brood17" || kind === "brood13"
                ? 1
                : kind === "prime"
                  ? 0.72
                  : 0.38;

            return (
              <g
                key={year}
                opacity={reveal}
                transform={`translate(${cx}, ${cy})`}
              >
                {/* glow under brood cells */}
                {isBrood17 && (
                  <circle
                    r={30 + pulse * 12}
                    fill="url(#brood-glow)"
                    opacity={0.6 + pulse * 0.4}
                  />
                )}
                {isBrood13 && (
                  <circle r={26} fill="url(#amber-glow)" opacity={0.55} />
                )}
                {/* tick mark above number for brood cells */}
                {(isBrood17 || isBrood13) && (
                  <line
                    x1={0}
                    y1={-18}
                    x2={0}
                    y2={-12}
                    stroke={isBrood17 ? VERMILION : AMBER}
                    strokeWidth={1.4}
                  />
                )}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily={
                    isBrood17 || isBrood13 ? playfair : inter
                  }
                  fontStyle={isBrood17 || isBrood13 ? "italic" : "normal"}
                  fontWeight={isBrood17 || isBrood13 ? 500 : 500}
                  fontSize={isBrood17 ? 26 : isBrood13 ? 22 : 15}
                  letterSpacing={isBrood17 || isBrood13 ? 0 : 1.5}
                  fill={fill}
                  opacity={labelOpacity}
                >
                  {year.toString().padStart(2, "0")}
                </text>
              </g>
            );
          })}

          {/* Ledger header strip — outside top edge */}
          <g
            transform={`translate(${GRID_X}, ${GRID_Y - 36})`}
            fill={PAPER_DIM}
            fontFamily={inter}
            fontSize={11}
            fontWeight={500}
            letterSpacing={3.5}
          >
            <text>CENTURY LEDGER · YEARS 01–100</text>
            <text x={GRID_W} textAnchor="end">
              <tspan fill={VERMILION}>● </tspan>
              <tspan fill={PAPER_DIM}>17-YR</tspan>
              <tspan dx={16} fill={AMBER}>● </tspan>
              <tspan fill={PAPER_DIM}>13-YR</tspan>
            </text>
          </g>

          {/* Ledger footer caption */}
          <g
            transform={`translate(${GRID_X}, ${GRID_Y + GRID_H + 26})`}
            fill={PAPER_DIM}
            fontFamily={inter}
            fontSize={11}
            fontWeight={500}
            letterSpacing={3.5}
          >
            <text>FIG. 1 · BROOD EMERGENCES, 100 YR</text>
            <text x={GRID_W} textAnchor="end" opacity={0.78}>
              5 + 7 = 12 EVENTS · 0 OVERLAP
            </text>
          </g>

          {/* ── Cicada hero — centred slightly below grid centre so
              the head clears the upper brood row (13, 17). ──────── */}
          <g
            transform={`translate(${GRID_X + GRID_W / 2}, ${
              GRID_Y + GRID_H / 2 + 44 + cicadaDrop
            }) scale(0.94)`}
          >
            <Cicada
              wingOpacity={wingOpacity}
              wingSpread={wingsSpring}
              bodyOpacity={cicadaBody}
            />
          </g>
        </g>

        {/* Top metadata band — drawn as SVG text for crisp alignment */}
        <g
          fontFamily={inter}
          fontSize={12}
          fontWeight={500}
          letterSpacing={4.5}
          fill={PAPER_DIM}
        >
          <text x={80} y={72}>
            EVERYDAY MOTIVATION · NO. 003
          </text>
          <text x={1000} y={72} textAnchor="end" fill={VERMILION}>
            2026 · 06 · 30
          </text>
        </g>

        {/* Top hairline rule beneath metadata band */}
        <line
          x1={80}
          y1={92}
          x2={1000}
          y2={92}
          stroke={RULE}
          strokeWidth={1}
        />
      </svg>

      {/* ── Type lockup ────────────────────────────────────────────── */}
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
            color: VERMILION,
            fontFamily: inter,
            fontSize: 13,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 18,
            fontWeight: 600,
          }}
        >
          Role <span style={{ color: GRAPHITE, margin: "0 6px" }}>/</span>
          <span style={{ color: PAPER, letterSpacing: 5 }}>
            Number Theorist
          </span>
        </div>

        <div
          style={{
            color: PAPER,
            fontFamily: playfair,
            fontWeight: 500,
            fontSize: 84,
            lineHeight: 0.96,
            letterSpacing: -1.4,
            fontStyle: "italic",
          }}
        >
          The buried
          <br />
          number theorist.
        </div>

        <div
          style={{
            marginTop: 28,
            color: "#C8C4B6",
            fontFamily: inter,
            fontSize: 19,
            lineHeight: 1.42,
            fontWeight: 400,
            maxWidth: 880,
            opacity: hookOpacity,
          }}
        >
          For seventeen years the{" "}
          <span style={{ color: VERMILION, fontWeight: 600 }}>
            periodical cicada
          </span>{" "}
          stays underground, then erupts in a synchronised brood — on a cycle
          of <span style={{ color: VERMILION, fontWeight: 600 }}>17</span> (or{" "}
          <span style={{ color: AMBER, fontWeight: 600 }}>13</span>) years
          exactly. Both are prime, the leading hypothesis goes, because primes
          minimise the years a brood collides with shorter-period predators.
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
          color: PAPER_DIM,
          fontFamily: inter,
          fontSize: 11,
          letterSpacing: 3,
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        <span>Lloyd & Dybas, Evolution 20 (1966) · Goles et al., Complexity 7 (2001)</span>
        <span>
          <span style={{ color: VERMILION }}>●</span> Prime years only
        </span>
      </div>

      {/* Footer hairline rule */}
      <svg
        width={1080}
        height={1350}
        viewBox="0 0 1080 1350"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <line
          x1={80}
          y1={1265}
          x2={1000}
          y2={1265}
          stroke={RULE_FAINT}
          strokeWidth={1}
        />
      </svg>
    </AbsoluteFill>
  );
};

