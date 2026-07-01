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

// Palette — from the wood-frog / cryogenicist visual brief
const INK = "#0B1721";
const BOARD = "#152332";
const ICE = "#B9DDEB";
const ICE_GLOW = "#E8F4FA";
const FROG = "#A26A38";
const FROG_DARK = "#5B3E22";
const FROG_BELLY = "#E4D3B0";
const GLUCOSE = "#F5C264";
const GRAY = "#7C8892";
const GRID = "#1B2836";
const GRID_MAJOR = "#25384C";

// ── Specimen frame (portrait 1080×1350, top metadata + type lockup below) ──
const FRAME = { x: 60, y: 130, w: 960, h: 720 };

// ── Hexagon geometry ──────────────────────────────────────────────────
// A pointy-top hexagon centred inside the frame.
const HEX_CENTER = { x: FRAME.x + FRAME.w / 2, y: FRAME.y + FRAME.h / 2 + 4 };
const HEX_R = 300; // circumradius

const hexPoints = (cx: number, cy: number, r: number): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    // pointy-top: start angle -90°
    const a = (-Math.PI / 2) + i * (Math.PI / 3);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
};
const HEX = hexPoints(HEX_CENTER.x, HEX_CENTER.y, HEX_R);
const HEX_INNER = hexPoints(HEX_CENTER.x, HEX_CENTER.y, HEX_R - 12);
const HEX_PATH = (pts: [number, number][]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") + " Z";

// ── Frog silhouette (top-down, anatomical) ────────────────────────────
// Drawn in a local 400×420 coord space, origin at top-left; body faces up.
// Constructed as separate layered parts (back legs behind body, body,
// front legs, head, eye bulges) so joints and proportion read clearly.
const FROG_W = 400;
const FROG_H = 420;

// Head silhouette — wedge with rounded snout at top and cheek bulges for
// the eyes on either side.
const FROG_HEAD_PATH = `
  M 200 62
  C 226 62 246 72 254 96
  C 258 108 258 124 254 134
  C 246 148 220 154 200 154
  C 180 154 154 148 146 134
  C 142 124 142 108 146 96
  C 154 72 174 62 200 62
  Z
`;

// Body silhouette — an ovoid tapering slightly toward the pelvis.
const FROG_BODY_PATH = `
  M 200 128
  C 236 128 258 158 260 208
  C 262 250 254 296 240 320
  C 228 340 210 344 200 344
  C 190 344 172 340 160 320
  C 146 296 138 250 140 208
  C 142 158 164 128 200 128
  Z
`;

// Back-leg thigh: broad diagonal ellipse (drawn behind body).
// Right thigh (mirror for left).
const FROG_THIGH_R = {
  cx: 292, cy: 235, rx: 68, ry: 40, rot: 30,
};
const FROG_THIGH_L = {
  cx: 108, cy: 235, rx: 68, ry: 40, rot: -30,
};

// Back-leg shin: narrower ellipse folded forward from the thigh.
const FROG_SHIN_R = {
  cx: 292, cy: 305, rx: 20, ry: 50, rot: -18,
};
const FROG_SHIN_L = {
  cx: 108, cy: 305, rx: 20, ry: 50, rot: 18,
};

// Back-foot: elongated paddle with hints of webbed toes.
const FROG_FOOT_R_PATH = `
  M 268 348
  C 260 344 254 344 250 354
  C 244 368 250 384 260 384
  C 270 384 274 380 278 372
  C 282 364 288 358 296 356
  C 304 354 310 348 308 342
  C 306 336 296 340 288 344
  C 282 346 274 348 268 348
  Z
`;
// (We'll mirror the left foot at render time.)

// Front-leg: small, angled forward from the shoulder.
const FROG_ARM_R = {
  cx: 250, cy: 172, rx: 14, ry: 30, rot: 34,
};
const FROG_ARM_L = {
  cx: 150, cy: 172, rx: 14, ry: 30, rot: -34,
};
// Front-hand: sits right at the arm terminus, not floating.
const FROG_HAND_R = { cx: 268, cy: 196, r: 10 };
const FROG_HAND_L = { cx: 132, cy: 196, r: 10 };

// Eye bulge (raised dome). One for each side.
const FROG_EYE_BULGE_R = { cx: 226, cy: 92, r: 19 };
const FROG_EYE_BULGE_L = { cx: 174, cy: 92, r: 19 };

// Dark eye mask — wood-frog "bandit stripe": a dark crescent that runs
// from the snout through each eye and tapers behind. Two mirrored bands.
const FROG_MASK_L_PATH = `
  M 152 92
  C 156 78 168 74 178 78
  C 190 82 196 90 196 98
  C 196 106 190 112 180 112
  C 168 112 156 108 152 100
  C 150 96 150 94 152 92
  Z
`;
const FROG_MASK_R_PATH = `
  M 248 92
  C 244 78 232 74 222 78
  C 210 82 204 90 204 98
  C 204 106 210 112 220 112
  C 232 112 244 108 248 100
  C 250 96 250 94 248 92
  Z
`;

// Belly midline — a subtle lighter ellipse down the centre.
const FROG_BELLY_PATH = `
  M 200 178
  C 214 180 222 200 222 232
  C 222 268 214 302 206 320
  C 202 330 198 330 194 320
  C 186 302 178 268 178 232
  C 178 200 186 180 200 178
  Z
`;

// ── Ice dendrites ─────────────────────────────────────────────────────
// One dendrite = a straight spine from the hexagon wall inward, with two
// symmetrical branches at ~55° coming off at fractional positions along
// the spine, and shorter sub-branches on those. Length is chosen so no
// dendrite crosses the frog silhouette (they stop just outside it).
type Dendrite = {
  x0: number; y0: number;   // starting point on hexagon wall
  x1: number; y1: number;   // tip inside chamber
  len: number;
  branches: { at: number; len: number; side: 1 | -1 }[];
  delay: number;
};

const buildDendrites = (): Dendrite[] => {
  const out: Dendrite[] = [];
  // 6 hex edges; on each edge place 3 dendrites, evenly along the edge,
  // each pointing to the hex center but stopping short of it.
  for (let e = 0; e < 6; e++) {
    const a = HEX[e];
    const b = HEX[(e + 1) % 6];
    for (let k = 1; k <= 3; k++) {
      const t = k / 4;
      const x0 = a[0] + (b[0] - a[0]) * t;
      const y0 = a[1] + (b[1] - a[1]) * t;
      // vector toward center
      const dx = HEX_CENTER.x - x0;
      const dy = HEX_CENTER.y - y0;
      const d = Math.hypot(dx, dy);
      // ice grows inward to ~62 % of the way to center (misses the frog)
      const reach = d * 0.6 + (k === 2 ? 12 : 0);
      const nx = dx / d;
      const ny = dy / d;
      const x1 = x0 + nx * reach;
      const y1 = y0 + ny * reach;
      const branches: Dendrite["branches"] = [];
      // Two branch pairs at 30% and 60% along the spine
      for (const at of [0.32, 0.6]) {
        const bl = reach * (at === 0.32 ? 0.22 : 0.14);
        branches.push({ at, len: bl, side: 1 });
        branches.push({ at, len: bl, side: -1 });
      }
      out.push({
        x0,
        y0,
        x1,
        y1,
        len: reach,
        branches,
        delay: 0.05 + (e * 3 + k) * 0.02,
      });
    }
  }
  return out;
};
const DENDRITES = buildDendrites();

// ── Small hex-tile snowflake dust: subtle background flakes inside the
// chamber but well away from the frog. Deterministic positions.
type Flake = { x: number; y: number; r: number; rot: number; opacity: number };
const FLAKES: Flake[] = (() => {
  const out: Flake[] = [];
  // Hand-placed to avoid the frog silhouette (roughly a 400×420 area
  // centered on HEX_CENTER, shifted down 6 to match the frog's placement).
  const spots: [number, number, number, number][] = [
    // [dx, dy, r, opacity*100]
    [-230, -110, 5, 55],
    [-195, 155, 4, 45],
    [-165, -190, 3, 60],
    [ 200, -140, 5, 50],
    [ 175, 170, 4, 55],
    [ 235, -20, 3, 45],
    [-245, 30, 3, 40],
    [ 245, 60, 4, 45],
    [ 130, -220, 3, 45],
    [-135, 210, 3, 40],
    [ 80, -260, 3, 35],
    [-90, -250, 3, 35],
    [ 30, 260, 4, 40],
    [-30, 265, 3, 35],
  ];
  spots.forEach(([dx, dy, r, o], i) => {
    out.push({
      x: HEX_CENTER.x + dx,
      y: HEX_CENTER.y + dy + 6,
      r,
      rot: (i * 37) % 60,
      opacity: o / 100,
    });
  });
  return out;
})();

// Tiny six-point snowflake glyph, centered at origin.
const Snowflake: React.FC<{ r: number }> = ({ r }) => (
  <g>
    {[0, 60, 120].map((deg) => (
      <line
        key={deg}
        x1={-r}
        y1={0}
        x2={r}
        y2={0}
        transform={`rotate(${deg})`}
        stroke={ICE}
        strokeWidth={1}
        strokeLinecap="round"
      />
    ))}
    {[0, 60, 120].map((deg) => (
      <g key={`b-${deg}`} transform={`rotate(${deg})`}>
        <line
          x1={r * 0.55}
          y1={0}
          x2={r * 0.75}
          y2={r * 0.28}
          stroke={ICE}
          strokeWidth={0.8}
          strokeLinecap="round"
        />
        <line
          x1={r * 0.55}
          y1={0}
          x2={r * 0.75}
          y2={-r * 0.28}
          stroke={ICE}
          strokeWidth={0.8}
          strokeLinecap="round"
        />
        <line
          x1={-r * 0.55}
          y1={0}
          x2={-r * 0.75}
          y2={r * 0.28}
          stroke={ICE}
          strokeWidth={0.8}
          strokeLinecap="round"
        />
        <line
          x1={-r * 0.55}
          y1={0}
          x2={-r * 0.75}
          y2={-r * 0.28}
          stroke={ICE}
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      </g>
    ))}
  </g>
);

// ── ECG trace ─────────────────────────────────────────────────────────
// Draw one QRS blip near the left, then flatline to the right. The line
// length is fixed; the "trace" grows with time.
const ecgPath = (w: number): string => {
  // Coordinate space: y=0 baseline, blip at x=w*0.22
  const bx = w * 0.22;
  return [
    `M 0 0`,
    `L ${bx - 20} 0`,
    `L ${bx - 12} -6`,
    `L ${bx - 4} 22`,
    `L ${bx + 4} -34`,
    `L ${bx + 12} 10`,
    `L ${bx + 20} 0`,
    `L ${w} 0`,
  ].join(" ");
};

// Small droplet-of-glucose glyph (hexagonal ring implying a sugar molecule).
const GlucoseGlyph: React.FC<{ r: number }> = ({ r }) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (-Math.PI / 2) + i * (Math.PI / 3);
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const d =
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") +
    " Z";
  return (
    <g>
      <path d={d} fill="none" stroke={GLUCOSE} strokeWidth={1.4} />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={1.6} fill={GLUCOSE} />
      ))}
    </g>
  );
};

export const PairingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const growSpan = fps * 2.6;
  const t = Math.max(0, frame) / growSpan;

  const titleSpring = spring({
    frame: frame - fps * 0.5,
    fps,
    config: { damping: 200, mass: 0.8 },
  });

  const hookOpacity = interpolate(frame, [fps * 1.1, fps * 2.0], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Temperature counter: 0 °C → −6 °C over the ice growth window.
  const tempFrac = Math.min(1, Math.max(0, t));
  const tempEased = 1 - Math.pow(1 - tempFrac, 3);
  const tempValue = -6 * tempEased;

  // ECG progress: normal blip + flatline reveal.
  const ecgProgress = interpolate(frame, [fps * 0.3, fps * 2.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Frost "misting" on the frog: from 0 to 0.65 (65 % of body water iced).
  const frostFrac = Math.min(0.65, tempEased * 0.65);

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
        <span style={{ color: ICE }}>2026 · 07 · 01</span>
      </div>

      {/* Specimen frame + hex chamber */}
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
            width={48}
            height={48}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke={GRID}
              strokeWidth={1}
            />
          </pattern>
          <pattern
            id="grid-major"
            x={FRAME.x}
            y={FRAME.y}
            width={192}
            height={192}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 192 0 L 0 0 0 192"
              fill="none"
              stroke={GRID_MAJOR}
              strokeWidth={1}
            />
          </pattern>

          <radialGradient id="chamber-vignette" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0F1A26" stopOpacity={1} />
            <stop offset="100%" stopColor="#0A131C" stopOpacity={1} />
          </radialGradient>

          <radialGradient id="hex-inner" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#0E1B29" stopOpacity={1} />
            <stop offset="100%" stopColor="#08111B" stopOpacity={1} />
          </radialGradient>

          <filter id="ice-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <clipPath id="hex-clip">
            <path d={HEX_PATH(HEX_INNER)} />
          </clipPath>
        </defs>

        {/* Specimen board */}
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.w}
          height={FRAME.h}
          fill="url(#chamber-vignette)"
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
          stroke="#243342"
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
          <g key={i} stroke={ICE} strokeWidth={1.5} fill="none">
            <line x1={cx} y1={cy} x2={cx + sx * 26} y2={cy} />
            <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 26} />
          </g>
        ))}

        {/* Frame top-left label */}
        <text
          x={FRAME.x + 26}
          y={FRAME.y + 36}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          fontWeight={600}
          letterSpacing={3.2}
        >
          CRYO-CHAMBER · SPECIMEN 003
        </text>

        {/* Frame top-right: chamber ID */}
        <text
          x={FRAME.x + FRAME.w - 26}
          y={FRAME.y + 36}
          textAnchor="end"
          fill={ICE}
          fontFamily={inter}
          fontSize={11}
          fontWeight={600}
          letterSpacing={3.2}
        >
          FIELD SITE · INTERIOR ALASKA
        </text>

        {/* ── Hexagon chamber outline ─────────────────────────────── */}
        <path d={HEX_PATH(HEX)} fill="url(#hex-inner)" />

        {/* Faint concentric hexagons — the "scale rings" of the chamber */}
        {[0.85, 0.7, 0.55, 0.4].map((k, i) => (
          <path
            key={i}
            d={HEX_PATH(hexPoints(HEX_CENTER.x, HEX_CENTER.y, HEX_R * k))}
            fill="none"
            stroke={GRID_MAJOR}
            strokeWidth={1}
          />
        ))}

        {/* Chamber outline — the "glass" */}
        <path
          d={HEX_PATH(HEX)}
          fill="none"
          stroke={ICE}
          strokeOpacity={0.55}
          strokeWidth={1.6}
        />
        <path
          d={HEX_PATH(HEX_INNER)}
          fill="none"
          stroke={ICE}
          strokeOpacity={0.18}
          strokeWidth={1}
        />

        {/* Vertex markers on the outer hex */}
        {HEX.map(([x, y], i) => (
          <g key={`v-${i}`}>
            <circle cx={x} cy={y} r={4} fill={INK} stroke={ICE} strokeWidth={1.5} />
          </g>
        ))}

        {/* Everything inside the chamber is clipped to the inner hex */}
        <g clipPath="url(#hex-clip)">
          {/* Subtle radial frost haze centered on the frog */}
          <circle
            cx={HEX_CENTER.x}
            cy={HEX_CENTER.y + 6}
            r={230}
            fill={ICE}
            opacity={0.04}
          />

          {/* Background snowflake dust */}
          {FLAKES.map((f, i) => (
            <g
              key={`fl-${i}`}
              transform={`translate(${f.x}, ${f.y}) rotate(${f.rot})`}
              opacity={f.opacity * Math.min(1, Math.max(0, t - 0.35) * 2)}
            >
              <Snowflake r={f.r} />
            </g>
          ))}

          {/* Dendrites — outer glow layer */}
          {DENDRITES.map((d, i) => {
            const localT = (t - d.delay) / 0.32;
            const grow = Math.max(0, Math.min(1, localT));
            const eased = 1 - Math.pow(1 - grow, 3);
            const dashOffset = d.len * (1 - eased);
            return (
              <line
                key={`dg-${i}`}
                x1={d.x0}
                y1={d.y0}
                x2={d.x1}
                y2={d.y1}
                stroke={ICE}
                strokeWidth={4.5}
                strokeOpacity={0.12 * eased}
                strokeLinecap="round"
                filter="url(#ice-glow)"
                strokeDasharray={d.len}
                strokeDashoffset={dashOffset}
              />
            );
          })}

          {/* Dendrites — core stroke + branches */}
          {DENDRITES.map((d, i) => {
            const localT = (t - d.delay) / 0.32;
            const grow = Math.max(0, Math.min(1, localT));
            const eased = 1 - Math.pow(1 - grow, 3);
            const dashOffset = d.len * (1 - eased);
            // Branch direction: perpendicular to spine
            const dx = d.x1 - d.x0;
            const dy = d.y1 - d.y0;
            const dlen = Math.hypot(dx, dy);
            const px = -dy / dlen;
            const py = dx / dlen;
            return (
              <g key={`dc-${i}`}>
                <line
                  x1={d.x0}
                  y1={d.y0}
                  x2={d.x1}
                  y2={d.y1}
                  stroke={ICE}
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeDasharray={d.len}
                  strokeDashoffset={dashOffset}
                />
                {/* highlight */}
                <line
                  x1={d.x0}
                  y1={d.y0}
                  x2={d.x1}
                  y2={d.y1}
                  stroke={ICE_GLOW}
                  strokeOpacity={0.55}
                  strokeWidth={0.6}
                  strokeLinecap="round"
                  strokeDasharray={d.len}
                  strokeDashoffset={dashOffset}
                />
                {/* branches — reveal after the spine passes their anchor */}
                {d.branches.map((br, j) => {
                  const ax = d.x0 + dx * br.at;
                  const ay = d.y0 + dy * br.at;
                  const bx = ax + px * br.side * br.len;
                  const by = ay + py * br.side * br.len;
                  const bGrow = Math.max(0, Math.min(1, (eased - br.at) * 3));
                  const bLen = Math.hypot(bx - ax, by - ay);
                  const bOffset = bLen * (1 - bGrow);
                  return (
                    <line
                      key={`b-${i}-${j}`}
                      x1={ax}
                      y1={ay}
                      x2={bx}
                      y2={by}
                      stroke={ICE}
                      strokeWidth={1}
                      strokeLinecap="round"
                      strokeDasharray={bLen}
                      strokeDashoffset={bOffset}
                      opacity={0.9}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* ── The wood frog (top-down, anatomical) ───────────────── */}
          <g
            transform={`translate(${HEX_CENTER.x - (FROG_W * 0.86) / 2}, ${
              HEX_CENTER.y - (FROG_H * 0.86) / 2 + 6
            }) scale(0.86)`}
          >
            {/* Warm undershadow to lift the frog off the cold background */}
            <ellipse
              cx={FROG_W / 2}
              cy={FROG_H / 2 + 12}
              rx={190}
              ry={190}
              fill={FROG}
              opacity={0.05}
            />

            {/* Back thighs — behind body, splayed to the sides */}
            <ellipse
              cx={FROG_THIGH_L.cx}
              cy={FROG_THIGH_L.cy}
              rx={FROG_THIGH_L.rx}
              ry={FROG_THIGH_L.ry}
              transform={`rotate(${FROG_THIGH_L.rot} ${FROG_THIGH_L.cx} ${FROG_THIGH_L.cy})`}
              fill={FROG}
            />
            <ellipse
              cx={FROG_THIGH_R.cx}
              cy={FROG_THIGH_R.cy}
              rx={FROG_THIGH_R.rx}
              ry={FROG_THIGH_R.ry}
              transform={`rotate(${FROG_THIGH_R.rot} ${FROG_THIGH_R.cx} ${FROG_THIGH_R.cy})`}
              fill={FROG}
            />

            {/* Back shins — folded forward from the thighs */}
            <ellipse
              cx={FROG_SHIN_L.cx}
              cy={FROG_SHIN_L.cy}
              rx={FROG_SHIN_L.rx}
              ry={FROG_SHIN_L.ry}
              transform={`rotate(${FROG_SHIN_L.rot} ${FROG_SHIN_L.cx} ${FROG_SHIN_L.cy})`}
              fill={FROG}
            />
            <ellipse
              cx={FROG_SHIN_R.cx}
              cy={FROG_SHIN_R.cy}
              rx={FROG_SHIN_R.rx}
              ry={FROG_SHIN_R.ry}
              transform={`rotate(${FROG_SHIN_R.rot} ${FROG_SHIN_R.cx} ${FROG_SHIN_R.cy})`}
              fill={FROG}
            />

            {/* Back feet — webbed paddles */}
            <path d={FROG_FOOT_R_PATH} fill={FROG} />
            <path
              d={FROG_FOOT_R_PATH}
              fill={FROG}
              transform={`translate(${FROG_W}, 0) scale(-1, 1)`}
            />

            {/* Body */}
            <path d={FROG_BODY_PATH} fill={FROG} />

            {/* Front legs (arms) — small, angled forward */}
            <ellipse
              cx={FROG_ARM_L.cx}
              cy={FROG_ARM_L.cy}
              rx={FROG_ARM_L.rx}
              ry={FROG_ARM_L.ry}
              transform={`rotate(${FROG_ARM_L.rot} ${FROG_ARM_L.cx} ${FROG_ARM_L.cy})`}
              fill={FROG}
            />
            <ellipse
              cx={FROG_ARM_R.cx}
              cy={FROG_ARM_R.cy}
              rx={FROG_ARM_R.rx}
              ry={FROG_ARM_R.ry}
              transform={`rotate(${FROG_ARM_R.rot} ${FROG_ARM_R.cx} ${FROG_ARM_R.cy})`}
              fill={FROG}
            />
            <circle cx={FROG_HAND_L.cx} cy={FROG_HAND_L.cy} r={FROG_HAND_L.r} fill={FROG} />
            <circle cx={FROG_HAND_R.cx} cy={FROG_HAND_R.cy} r={FROG_HAND_R.r} fill={FROG} />

            {/* Belly midline — subtle lighter ellipse down the centre */}
            <path d={FROG_BELLY_PATH} fill={FROG_BELLY} opacity={0.45} />

            {/* Dorsal blotches — a scatter of dark spots along the back */}
            <ellipse cx={175} cy={175} rx={8} ry={5} fill={FROG_DARK} opacity={0.5} />
            <ellipse cx={225} cy={175} rx={8} ry={5} fill={FROG_DARK} opacity={0.5} />
            <ellipse cx={168} cy={228} rx={9} ry={5} fill={FROG_DARK} opacity={0.5} />
            <ellipse cx={232} cy={228} rx={9} ry={5} fill={FROG_DARK} opacity={0.5} />
            <ellipse cx={185} cy={278} rx={7} ry={4} fill={FROG_DARK} opacity={0.45} />
            <ellipse cx={215} cy={278} rx={7} ry={4} fill={FROG_DARK} opacity={0.45} />
            <ellipse cx={200} cy={318} rx={6} ry={4} fill={FROG_DARK} opacity={0.4} />

            {/* Head */}
            <path d={FROG_HEAD_PATH} fill={FROG} />

            {/* Eye bulges — spherical domes on top of the head */}
            <circle
              cx={FROG_EYE_BULGE_L.cx}
              cy={FROG_EYE_BULGE_L.cy}
              r={FROG_EYE_BULGE_L.r}
              fill={FROG}
            />
            <circle
              cx={FROG_EYE_BULGE_R.cx}
              cy={FROG_EYE_BULGE_R.cy}
              r={FROG_EYE_BULGE_R.r}
              fill={FROG}
            />

            {/* Dark eye mask — wood-frog bandit stripes, one per eye */}
            <path d={FROG_MASK_L_PATH} fill={FROG_DARK} />
            <path d={FROG_MASK_R_PATH} fill={FROG_DARK} />

            {/* Eyes — pupils on top of the bulges */}
            <circle cx={FROG_EYE_BULGE_L.cx} cy={FROG_EYE_BULGE_L.cy - 4} r={8} fill="#0A1218" />
            <circle cx={FROG_EYE_BULGE_R.cx} cy={FROG_EYE_BULGE_R.cy - 4} r={8} fill="#0A1218" />
            <circle
              cx={FROG_EYE_BULGE_L.cx - 2}
              cy={FROG_EYE_BULGE_L.cy - 6}
              r={2.4}
              fill={ICE_GLOW}
              opacity={0.9}
            />
            <circle
              cx={FROG_EYE_BULGE_R.cx - 2}
              cy={FROG_EYE_BULGE_R.cy - 6}
              r={2.4}
              fill={ICE_GLOW}
              opacity={0.9}
            />

            {/* ── Frost applied ON the frog ──────────────────────── */}
            {/* Cool overlay: subtle ice-blue wash that unifies the frog
                as one specimen rather than outlining each part. */}
            <ellipse
              cx={FROG_W / 2}
              cy={FROG_H / 2 + 12}
              rx={175}
              ry={190}
              fill={ICE}
              opacity={frostFrac * 0.18}
            />

            {/* Frost speckles on the body — deterministic scatter */}
            <g opacity={frostFrac * 1.4}>
              {[
                [190, 148, 1.6],
                [178, 168, 1.2],
                [222, 168, 1.4],
                [166, 200, 1.5],
                [234, 200, 1.6],
                [200, 210, 1.4],
                [174, 250, 1.4],
                [226, 250, 1.6],
                [200, 260, 1.2],
                [190, 300, 1.4],
                [212, 300, 1.4],
                [200, 340, 1.6],
                [126, 220, 1.4],
                [274, 220, 1.4],
                [98, 268, 1.4],
                [302, 268, 1.4],
                [136, 340, 1.2],
                [264, 340, 1.2],
              ].map(([x, y, r], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill={ICE_GLOW} />
              ))}
            </g>

            {/* A few tiny snowflakes on the back */}
            <g opacity={frostFrac * 1.4}>
              {[
                [172, 200, 4],
                [228, 200, 4],
                [200, 250, 3.5],
                [186, 300, 3.5],
                [214, 300, 3.5],
              ].map(([x, y, r], i) => (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <Snowflake r={r as number} />
                </g>
              ))}
            </g>
          </g>

          {/* Single glucose accent — one warm point in the belly / liver area,
              to visually anchor the amber glucose reading in the corner. */}
          {t > 0.45 && (
            <g opacity={Math.min(1, (t - 0.45) * 2.5)}>
              <circle
                cx={HEX_CENTER.x + 4}
                cy={HEX_CENTER.y + 46}
                r={5}
                fill={GLUCOSE}
                opacity={0.85}
              />
              <circle
                cx={HEX_CENTER.x + 4}
                cy={HEX_CENTER.y + 46}
                r={14}
                fill={GLUCOSE}
                opacity={0.15}
              />
            </g>
          )}
        </g>

        {/* Annotations OUTSIDE the hex chamber but INSIDE the specimen frame */}
        {/* Upper-left: HEART · ECG */}
        <g
          transform={`translate(${FRAME.x + 60}, ${FRAME.y + 118})`}
          opacity={Math.min(1, Math.max(0, t - 0.2) * 2)}
        >
          <text
            fill={GRAY}
            fontFamily={inter}
            fontSize={10}
            letterSpacing={3}
            fontWeight={600}
          >
            HEART RATE
          </text>
          <text
            y={30}
            fill={ICE_GLOW}
            fontFamily={playfair}
            fontStyle="italic"
            fontSize={38}
            fontWeight={500}
          >
            0
            <tspan
              fill={GRAY}
              fontFamily={inter}
              fontSize={12}
              letterSpacing={2}
              fontWeight={600}
              dx={6}
              dy={-6}
            >
              BPM
            </tspan>
          </text>
          {/* ECG line */}
          <g transform={`translate(0, 66)`}>
            <line
              x1={0}
              y1={0}
              x2={190}
              y2={0}
              stroke={GRID_MAJOR}
              strokeWidth={1}
            />
            <path
              d={ecgPath(190)}
              fill="none"
              stroke={ICE_GLOW}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={520}
              strokeDashoffset={520 * (1 - ecgProgress)}
            />
          </g>
        </g>

        {/* Upper-right: TEMPERATURE */}
        <g
          transform={`translate(${FRAME.x + FRAME.w - 60}, ${FRAME.y + 118})`}
          opacity={Math.min(1, Math.max(0, t - 0.2) * 2)}
        >
          <text
            textAnchor="end"
            fill={GRAY}
            fontFamily={inter}
            fontSize={10}
            letterSpacing={3}
            fontWeight={600}
          >
            CORE TEMPERATURE
          </text>
          <text
            y={30}
            textAnchor="end"
            fill={ICE_GLOW}
            fontFamily={playfair}
            fontStyle="italic"
            fontSize={38}
            fontWeight={500}
          >
            {tempValue.toFixed(1)}
            <tspan
              fill={GRAY}
              fontFamily={inter}
              fontSize={12}
              letterSpacing={2}
              fontWeight={600}
              dx={6}
              dy={-6}
            >
              °C
            </tspan>
          </text>
          {/* Thermometer bar */}
          <g transform={`translate(-190, 62)`}>
            <line
              x1={0}
              y1={0}
              x2={190}
              y2={0}
              stroke={GRID_MAJOR}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <line
              x1={0}
              y1={0}
              x2={190 * (1 - Math.abs(tempValue) / 18)}
              y2={0}
              stroke={ICE}
              strokeWidth={4}
              strokeLinecap="round"
            />
            {/* Tick at −6 */}
            <line
              x1={190 * (1 - 6 / 18)}
              y1={-6}
              x2={190 * (1 - 6 / 18)}
              y2={6}
              stroke={ICE}
              strokeWidth={1}
            />
            <text
              x={190 * (1 - 6 / 18)}
              y={22}
              textAnchor="middle"
              fill={GRAY}
              fontFamily={inter}
              fontSize={9}
              letterSpacing={1.5}
              fontWeight={500}
            >
              −6
            </text>
            <text
              x={0}
              y={22}
              textAnchor="start"
              fill={GRAY}
              fontFamily={inter}
              fontSize={9}
              letterSpacing={1.5}
              fontWeight={500}
            >
              −18
            </text>
            <text
              x={190}
              y={22}
              textAnchor="end"
              fill={GRAY}
              fontFamily={inter}
              fontSize={9}
              letterSpacing={1.5}
              fontWeight={500}
            >
              0 °C
            </text>
          </g>
        </g>

        {/* Lower-right: GLUCOSE ×100 */}
        <g
          transform={`translate(${FRAME.x + FRAME.w - 60}, ${
            FRAME.y + FRAME.h - 118
          })`}
          opacity={Math.min(1, Math.max(0, t - 0.55) * 2)}
        >
          <text
            textAnchor="end"
            fill={GRAY}
            fontFamily={inter}
            fontSize={10}
            letterSpacing={3}
            fontWeight={600}
          >
            CRYOPROTECTANT
          </text>
          <text
            y={30}
            textAnchor="end"
            fill={GLUCOSE}
            fontFamily={playfair}
            fontStyle="italic"
            fontSize={38}
            fontWeight={500}
          >
            ×100
          </text>
          <text
            y={54}
            textAnchor="end"
            fill={GRAY}
            fontFamily={inter}
            fontSize={11}
            letterSpacing={2}
            fontWeight={500}
          >
            GLUCOSE, LIVER → BLOOD
          </text>
          {/* Little glucose hexes in a row */}
          <g transform={`translate(-16, 76)`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <g
                key={i}
                transform={`translate(${-i * 22}, 0)`}
                opacity={Math.min(1, Math.max(0, t - 0.55 - i * 0.05) * 4)}
              >
                <GlucoseGlyph r={8} />
              </g>
            ))}
          </g>
        </g>

        {/* Lower-left: 65 % H₂O → ICE */}
        <g
          transform={`translate(${FRAME.x + 60}, ${FRAME.y + FRAME.h - 118})`}
          opacity={Math.min(1, Math.max(0, t - 0.55) * 2)}
        >
          <text
            fill={GRAY}
            fontFamily={inter}
            fontSize={10}
            letterSpacing={3}
            fontWeight={600}
          >
            BODY WATER FROZEN
          </text>
          <text
            y={30}
            fill={ICE_GLOW}
            fontFamily={playfair}
            fontStyle="italic"
            fontSize={38}
            fontWeight={500}
          >
            65
            <tspan
              fill={GRAY}
              fontFamily={inter}
              fontSize={14}
              letterSpacing={2}
              fontWeight={600}
              dx={4}
              dy={-6}
            >
              %
            </tspan>
          </text>
          <text
            y={54}
            fill={GRAY}
            fontFamily={inter}
            fontSize={11}
            letterSpacing={2}
            fontWeight={500}
          >
            EXTRACELLULAR ICE
          </text>
          {/* Progress bar */}
          <g transform={`translate(0, 76)`}>
            <line
              x1={0}
              y1={0}
              x2={190}
              y2={0}
              stroke={GRID_MAJOR}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <line
              x1={0}
              y1={0}
              x2={190 * (frostFrac / 0.65)}
              y2={0}
              stroke={ICE}
              strokeWidth={4}
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Caption strip just below the specimen frame */}
        <g
          transform={`translate(${FRAME.x}, ${FRAME.y + FRAME.h + 22})`}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3}
          fontWeight={500}
        >
          <text>FIG. 3 · RANA SYLVATICA IN FROZEN CRYOSTASIS, −6 °C</text>
          <text
            x={FRAME.w}
            textAnchor="end"
            fill={ICE}
            opacity={0.85}
          >
            HEART · BREATH · NEURAL ACTIVITY · ALL STOPPED
          </text>
        </g>
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
            [16, 0],
          )}px)`,
        }}
      >
        <div
          style={{
            color: ICE,
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
            Cryogenicist
          </span>
        </div>

        <div
          style={{
            color: "#F4F4F6",
            fontFamily: playfair,
            fontWeight: 500,
            fontSize: 78,
            lineHeight: 0.98,
            letterSpacing: -1.2,
            fontStyle: "italic",
          }}
        >
          The frog that stops
          <br />
          its heart for winter.
        </div>

        <div
          style={{
            marginTop: 28,
            color: "#C8CAD0",
            fontFamily: inter,
            fontSize: 19,
            lineHeight: 1.42,
            fontWeight: 400,
            maxWidth: 880,
            opacity: hookOpacity,
          }}
        >
          Alaskan{" "}
          <span style={{ color: ICE, fontWeight: 600 }}>
            Rana sylvatica
          </span>{" "}
          survive winter by letting 65 % of their body water freeze into
          extracellular ice — the liver floods every cell with{" "}
          <span style={{ color: GLUCOSE, fontWeight: 600 }}>glucose</span> at
          ~100 × baseline as a cryoprotectant, the heart stops, and the
          animal thaws intact each spring.
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
        <span>Costanzo et al. · J. Exp. Biol. 216 (2013) 3461–3473</span>
        <span>
          <span style={{ color: ICE }}>●</span> Extracellular ice ·{" "}
          <span style={{ color: GLUCOSE }}>●</span> Cryoprotectant
        </span>
      </div>
    </AbsoluteFill>
  );
};
