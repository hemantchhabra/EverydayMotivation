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

// Palette — drawn from the concept's visual brief
const INK = "#0E0F14";
const FLOOR = "#15161D";
const SATIN = "#1E3FA6";
const ULTRA = "#5C82C8";
const SKY = "#A8C4ED";
const IRIS = "#8B5CB5";
const TWIG = "#C9A877";
const CREAM = "#E8DCC2";
const GRAY = "#7E828C";

// ── Swatch grid ─────────────────────────────────────────────────────────
// Each chip is a real object a satin bowerbird is known to incorporate.
// Hue chosen darkest-to-lightest so the grid reads as a curated palette.
type Chip = {
  label: string;
  hue: string;
  // animation order — chip drops in at this index along the grow span
  order: number;
  // material hint: 'matte' (petal/feather) vs 'gloss' (cap/plastic/glass)
  finish: "matte" | "gloss";
};

const CHIPS: Chip[] = [
  // row 0 (top) — deepest blues
  { label: "FEATHER", hue: "#16327E", order: 0, finish: "matte" },
  { label: "BERRY", hue: "#1E3FA6", order: 2, finish: "matte" },
  { label: "BOTTLE CAP", hue: "#264FBE", order: 1, finish: "gloss" },
  // row 1
  { label: "PEN LID", hue: "#3760C2", order: 4, finish: "gloss" },
  { label: "PETAL", hue: "#4A74CC", order: 3, finish: "matte" },
  { label: "STRAW", hue: "#5C82C8", order: 5, finish: "gloss" },
  // row 2
  { label: "GLASS", hue: "#6E94D2", order: 7, finish: "gloss" },
  { label: "SHELL", hue: "#82A3D9", order: 6, finish: "matte" },
  { label: "BEAD", hue: "#93B2E2", order: 8, finish: "gloss" },
  // row 3 (bottom) — palest blues (one slot held empty for the hero chip)
  { label: "RIBBON", hue: "#A8C4ED", order: 10, finish: "matte" },
  { label: "PARROT TAIL", hue: "#1E3FA6", order: 11, finish: "matte", /* hero — placed by the bird */ },
  { label: "PEG", hue: "#BDD1F0", order: 9, finish: "gloss" },
];

// ── Twig wall — a bundle of sticks running along the avenue's long axis ──
// Viewed top-down: each "wall" is a dense, slightly disorderly row of
// vertical twigs. Two layers (back & front) give it weave depth.
type Stick = {
  x: number;
  y: number;
  len: number;
  tilt: number;
  w: number;
  shade: string;
};
const TWIG_LIGHT = "#C9A877";
const TWIG_MID = "#A78448";
const TWIG_DARK = "#7C5E2E";

const buildWall = (
  cx: number,
  top: number,
  height: number,
  bandWidth: number,
): Stick[] => {
  const sticks: Stick[] = [];
  // Two layers of sticks for woven density
  const layers = [
    { count: 22, dx: -bandWidth * 0.28, shade: TWIG_DARK, lenBase: 110, w: 5.5 },
    { count: 24, dx: 0, shade: TWIG_MID, lenBase: 124, w: 6.4 },
    { count: 22, dx: bandWidth * 0.28, shade: TWIG_LIGHT, lenBase: 116, w: 5.8 },
  ];
  let seed = 1;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  layers.forEach((L, li) => {
    for (let i = 0; i < L.count; i++) {
      const u = (i + 0.5) / L.count;
      const jitter = rand() - 0.5;
      const y = top + u * height + jitter * 14;
      const len = L.lenBase + rand() * 36;
      const tilt = (rand() - 0.5) * 0.18;
      const w = L.w + rand() * 1.6;
      sticks.push({
        x: cx + L.dx + (rand() - 0.5) * 3,
        y,
        len,
        tilt,
        w,
        shade: L.shade,
      });
    }
  });
  return sticks;
};

export const BowerbirdCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timing
  const introStart = fps * 0.2;
  const chipStagger = fps * 0.11;
  const heroEntry = fps * 2.3;

  // Title spring
  const titleSpring = spring({
    frame: frame - fps * 0.35,
    fps,
    config: { damping: 200, mass: 0.7 },
  });
  const hookOpacity = interpolate(
    frame,
    [fps * 1.0, fps * 1.9],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // ── Layout (1080 × 1350 portrait) ───────────────────────────────────
  // Top metadata band:        0..110
  // Stage area (bower & grid): 130..880
  // Title lockup:              905..
  // Footer:                    1290..
  const STAGE = { x: 60, y: 130, w: 960, h: 750 };

  // Grid geometry inside the stage
  const COLS = 3;
  const ROWS = 4;
  const GRID_PAD_X = 130; // distance from STAGE edges to grid (stick walls live in here)
  const GRID_PAD_TOP = 96;
  const GRID_PAD_BOTTOM = 70;
  const gridX = STAGE.x + GRID_PAD_X;
  const gridY = STAGE.y + GRID_PAD_TOP;
  const gridW = STAGE.w - GRID_PAD_X * 2;
  const gridH = STAGE.h - GRID_PAD_TOP - GRID_PAD_BOTTOM;
  const colW = gridW / COLS;
  const rowH = gridH / ROWS;
  const chipW = colW - 28;
  const chipH = rowH - 30;

  // Stick walls — two parallel bundles, hugging the inside of the stage
  const wallBandW = 70;
  const wallLeft = buildWall(
    STAGE.x + 78,
    STAGE.y + 80,
    STAGE.h - 160,
    wallBandW,
  );
  const wallRight = buildWall(
    STAGE.x + STAGE.w - 78,
    STAGE.y + 80,
    STAGE.h - 160,
    wallBandW,
  );

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
        <span style={{ color: SKY }}>2026 · 06 · 25</span>
      </div>

      <svg
        width={1080}
        height={1350}
        viewBox="0 0 1080 1350"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          {/* Stage backdrop — subtle vignette suggesting forest floor */}
          <radialGradient id="floor" cx="50%" cy="42%" r="68%">
            <stop offset="0%" stopColor="#181A22" />
            <stop offset="100%" stopColor={FLOOR} />
          </radialGradient>

          {/* Chip glosses */}
          <linearGradient id="chipGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.32} />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.18} />
          </linearGradient>
          <linearGradient id="chipMatte" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.18} />
          </linearGradient>

          {/* Hero chip iris glow */}
          <radialGradient id="irisGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={IRIS} stopOpacity={0.55} />
            <stop offset="100%" stopColor={IRIS} stopOpacity={0} />
          </radialGradient>

          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>

          {/* Twig texture — a single stick drawn as a soft tapered rectangle */}
          <linearGradient id="twigShade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7E6738" />
            <stop offset="45%" stopColor={TWIG} />
            <stop offset="100%" stopColor="#8A7140" />
          </linearGradient>
        </defs>

        {/* Stage backdrop */}
        <rect
          x={STAGE.x}
          y={STAGE.y}
          width={STAGE.w}
          height={STAGE.h}
          fill="url(#floor)"
        />

        {/* Hairline frame */}
        <rect
          x={STAGE.x + 0.5}
          y={STAGE.y + 0.5}
          width={STAGE.w - 1}
          height={STAGE.h - 1}
          fill="none"
          stroke="#262833"
          strokeWidth={1}
        />

        {/* Corner ticks in twig amber */}
        {(
          [
            [STAGE.x, STAGE.y, 1, 1],
            [STAGE.x + STAGE.w, STAGE.y, -1, 1],
            [STAGE.x, STAGE.y + STAGE.h, 1, -1],
            [STAGE.x + STAGE.w, STAGE.y + STAGE.h, -1, -1],
          ] as const
        ).map(([cx, cy, sx, sy], i) => (
          <g key={i} stroke={TWIG} strokeWidth={1.4} fill="none">
            <line x1={cx} y1={cy} x2={cx + sx * 24} y2={cy} />
            <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 24} />
          </g>
        ))}

        {/* Top-of-stage caption (right) */}
        <g
          transform={`translate(${STAGE.x + STAGE.w - 24}, ${STAGE.y + 40})`}
          fill={SKY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3}
          fontWeight={600}
          textAnchor="end"
        >
          <text>HUE FILTER · BLUE</text>
        </g>

        {/* ── BOWER WALLS ─────────────────────────────────────────── */}
        {/* Each "wall" is a dense bundle of stylised twigs. */}
        {[
          { wall: wallLeft, cx: STAGE.x + 78 },
          { wall: wallRight, cx: STAGE.x + STAGE.w - 78 },
        ].map(({ wall, cx: wcx }, wi) => (
          <g key={`wall-${wi}`}>
            {/* A faint shadow stripe behind the wall to ground it */}
            <rect
              x={wcx - 38}
              y={STAGE.y + 70}
              width={76}
              height={STAGE.h - 140}
              fill="#000"
              opacity={0.35}
              filter="url(#softShadow)"
            />
            {wall.map((s, i) => {
              const cx = s.x;
              const len = s.len;
              const y0 = s.y - len / 2;
              const tiltDeg = (s.tilt * 180) / Math.PI;
              return (
                <g
                  key={i}
                  transform={`rotate(${tiltDeg} ${cx} ${s.y})`}
                >
                  <rect
                    x={cx - s.w / 2}
                    y={y0}
                    width={s.w}
                    height={len}
                    rx={s.w / 2}
                    fill={s.shade}
                  />
                  {/* highlight stripe on the lit side */}
                  <rect
                    x={cx - s.w / 2 + 0.6}
                    y={y0 + 2}
                    width={1.1}
                    height={len - 4}
                    rx={0.55}
                    fill="#E9CC95"
                    opacity={0.5}
                  />
                  {/* a tiny darker knot */}
                  <circle
                    cx={cx}
                    cy={y0 + len * (0.28 + ((i * 13) % 40) / 100)}
                    r={s.w * 0.4}
                    fill="#3F2F15"
                    opacity={0.65}
                  />
                </g>
              );
            })}
          </g>
        ))}

        {/* ── SWATCH GRID ─────────────────────────────────────────── */}
        {CHIPS.map((chip, idx) => {
          const col = idx % COLS;
          const row = Math.floor(idx / COLS);
          const cx = gridX + col * colW + colW / 2;
          const cy = gridY + row * rowH + rowH / 2;
          const x = cx - chipW / 2;
          const y = cy - chipH / 2;

          const isHero = chip.label === "PARROT TAIL";

          // Per-chip spring drop
          const localStart = introStart + chip.order * chipStagger;
          const s = spring({
            frame: frame - localStart,
            fps,
            config: { damping: 14, mass: 0.6, stiffness: 130 },
          });
          const heroProgress = isHero
            ? Math.max(
                0,
                Math.min(1, (frame - heroEntry) / (fps * 0.6)),
              )
            : s;
          const visible = isHero ? heroProgress : s;
          const ty = interpolate(visible, [0, 1], [-26, 0]);
          const op = interpolate(visible, [0, 0.6, 1], [0, 1, 1]);

          // Hero pulse after landing
          const heroPulse = isHero
            ? Math.sin(
                Math.max(0, (frame - heroEntry - fps * 0.5) / fps) * 6,
              ) *
                0.5 +
              0.5
            : 0;

          return (
            <g
              key={chip.label}
              transform={`translate(0, ${ty})`}
              opacity={op}
            >
              {/* Hero iris glow halo */}
              {isHero && heroProgress > 0 && (
                <rect
                  x={x - 10}
                  y={y - 10}
                  width={chipW + 20}
                  height={chipH + 20}
                  rx={10}
                  fill="url(#irisGlow)"
                />
              )}

              {/* Chip shadow */}
              <rect
                x={x + 3}
                y={y + 6}
                width={chipW}
                height={chipH}
                rx={6}
                fill="#000"
                opacity={0.35}
                filter="url(#softShadow)"
              />
              {/* Chip body */}
              <rect
                x={x}
                y={y}
                width={chipW}
                height={chipH}
                rx={6}
                fill={chip.hue}
              />
              {/* Hero treatment: an iridescent satin sheen running diagonally,
                  to read as a "feather" rather than a paint chip. */}
              {isHero && (
                <>
                  <defs>
                    <linearGradient
                      id={`hero-sheen-${idx}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={SATIN} />
                      <stop offset="45%" stopColor="#3457C0" />
                      <stop offset="65%" stopColor={ULTRA} />
                      <stop offset="100%" stopColor="#0E2570" />
                    </linearGradient>
                  </defs>
                  <rect
                    x={x}
                    y={y}
                    width={chipW}
                    height={chipH}
                    rx={6}
                    fill={`url(#hero-sheen-${idx})`}
                  />
                  {/* Faint feather-vane ribs */}
                  {Array.from({ length: 9 }).map((_, k) => (
                    <line
                      key={k}
                      x1={x + 6}
                      y1={y + 6 + k * ((chipH - 30) / 8)}
                      x2={x + chipW - 6}
                      y2={y + 11 + k * ((chipH - 30) / 8)}
                      stroke="#0E2570"
                      strokeWidth={0.55}
                      opacity={0.32}
                    />
                  ))}
                </>
              )}
              {/* Surface lighting */}
              <rect
                x={x}
                y={y}
                width={chipW}
                height={chipH}
                rx={6}
                fill={
                  chip.finish === "gloss"
                    ? "url(#chipGloss)"
                    : "url(#chipMatte)"
                }
              />
              {/* Hairline border (iris-tinted on hero) */}
              <rect
                x={x + 0.5}
                y={y + 0.5}
                width={chipW - 1}
                height={chipH - 1}
                rx={6}
                fill="none"
                stroke={isHero ? IRIS : "#0A0B10"}
                strokeOpacity={isHero ? 0.95 : 0.45}
                strokeWidth={isHero ? 1.6 : 1}
              />

              {/* Label strip at the bottom of the chip */}
              <rect
                x={x}
                y={y + chipH - 22}
                width={chipW}
                height={22}
                rx={0}
                fill="#0A0B10"
                opacity={0.55}
              />
              <text
                x={x + 12}
                y={y + chipH - 7}
                fill={isHero ? "#E5D2F0" : CREAM}
                fontFamily={inter}
                fontSize={10.5}
                fontWeight={600}
                letterSpacing={2.2}
              >
                {chip.label}
              </text>
              {/* Hex code on the right of the strip */}
              <text
                x={x + chipW - 12}
                y={y + chipH - 7}
                textAnchor="end"
                fill={CREAM}
                opacity={0.55}
                fontFamily={inter}
                fontSize={9.5}
                letterSpacing={1.6}
              >
                {chip.hue.toUpperCase()}
              </text>

              {/* Material tick — tiny dot top-left */}
              <circle
                cx={x + 10}
                cy={y + 10}
                r={2.2}
                fill={chip.finish === "gloss" ? SKY : CREAM}
                opacity={0.8}
              />
            </g>
          );
        })}

        {/* ── BOWERBIRD — designer's mark, top-left of stage ─────── */}
        {(() => {
          const arrival = spring({
            frame: frame - fps * 0.2,
            fps,
            config: { damping: 200, mass: 0.8 },
          });
          // Cartouche position (top-left of stage)
          const cx = STAGE.x + 24;
          const cy = STAGE.y + 24;
          const cw = 320;
          const ch = 58;

          return (
            <g opacity={arrival}>
              {/* Subtle underline only — no background plate */}
              <line
                x1={cx}
                y1={cy + ch + 2}
                x2={cx + cw - 30}
                y2={cy + ch + 2}
                stroke={TWIG}
                strokeOpacity={0.55}
                strokeWidth={1}
              />
              {/* Bird icon — compact side profile, facing right toward the label */}
              <g transform={`translate(${cx + 30}, ${cy + 30})`}>
                {/* Tail — cocked up & back behind body */}
                <path
                  d="M -2 -2
                     C -14 -6 -22 -16 -22 -26
                     C -18 -22 -12 -16 -8 -10
                     C -6 -6 -4 -2 -2 -2 Z"
                  fill="#142E72"
                />
                {/* Body */}
                <ellipse cx={0} cy={0} rx={18} ry={13} fill={SATIN} />
                {/* Wing */}
                <path
                  d="M -8 -6 C 2 -10 12 -6 14 0 C 8 2 -2 2 -8 0 Z"
                  fill="#16327E"
                />
                {/* sheen along back */}
                <path
                  d="M -10 -10 C -2 -13 8 -12 14 -7"
                  fill="none"
                  stroke="#3F62C8"
                  strokeWidth={1.1}
                  opacity={0.75}
                />
                {/* Head */}
                <circle cx={16} cy={-7} r={8.4} fill={SATIN} />
                {/* Eye — violet iris */}
                <circle cx={19} cy={-8} r={2.2} fill={IRIS} />
                <circle cx={18.4} cy={-8.6} r={0.9} fill="#FFFFFF" />
                {/* Beak */}
                <path d="M 25 -7 L 30 -8 L 25 -5 Z" fill={CREAM} />
                {/* Legs */}
                <line
                  x1={-3}
                  y1={12}
                  x2={-3}
                  y2={18}
                  stroke="#0A0B10"
                  strokeWidth={1.4}
                />
                <line
                  x1={6}
                  y1={12}
                  x2={6}
                  y2={18}
                  stroke="#0A0B10"
                  strokeWidth={1.4}
                />
              </g>

              {/* Designer label */}
              <text
                x={cx + 76}
                y={cy + 26}
                fill={CREAM}
                fontFamily={inter}
                fontSize={11.5}
                fontWeight={600}
                letterSpacing={3.5}
              >
                PTILONORHYNCHUS VIOLACEUS
              </text>
              <text
                x={cx + 76}
                y={cy + 44}
                fill={GRAY}
                fontFamily={inter}
                fontSize={10}
                fontWeight={500}
                letterSpacing={4}
              >
                DESIGNER · IN RESIDENCE
              </text>
            </g>
          );
        })()}

        {/* Bottom-of-stage caption strip */}
        <g
          transform={`translate(${STAGE.x + 24}, ${STAGE.y + STAGE.h - 28})`}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3}
          fontWeight={500}
        >
          <text>FIG. 1 · FORECOURT INVENTORY · 12 OBJECT TYPES</text>
        </g>
        <g
          transform={`translate(${STAGE.x + STAGE.w - 24}, ${
            STAGE.y + STAGE.h - 28
          })`}
          fill={IRIS}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3}
          fontWeight={500}
          textAnchor="end"
        >
          <text>● HERO · PARROT TAIL</text>
        </g>
      </svg>

      {/* ── Type lockup ────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 915,
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
            color: SKY,
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
            Interior Designer
          </span>
        </div>

        <div
          style={{
            color: "#F4F4F6",
            fontFamily: playfair,
            fontWeight: 500,
            fontSize: 92,
            lineHeight: 0.96,
            letterSpacing: -1.6,
            fontStyle: "italic",
          }}
        >
          The bachelor's
          <br />
          mood board.
        </div>

        <div
          style={{
            marginTop: 28,
            color: "#C8CAD0",
            fontFamily: inter,
            fontSize: 19,
            lineHeight: 1.4,
            fontWeight: 400,
            maxWidth: 880,
            opacity: hookOpacity,
          }}
        >
          The male{" "}
          <span style={{ color: SKY, fontWeight: 600 }}>
            satin bowerbird
          </span>{" "}
          builds a stick avenue on the forest floor and decorates its
          forecourt almost exclusively with{" "}
          <span style={{ color: SKY, fontWeight: 600 }}>blue</span> objects —
          feathers, petals, berries, bottle caps. Females inspect the
          curation and choose accordingly.
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
        <span>Borgia · Animal Behaviour 33 (1985) 266–271</span>
        <span>
          <span style={{ color: IRIS }}>●</span> Iris = bird's eye
        </span>
      </div>
    </AbsoluteFill>
  );
};
