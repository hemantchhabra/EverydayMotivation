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

// Palette — drawn from Brachinus crepitans + reaction-flash imagery
const INK = "#0A0B10";
const PLATE = "#10131B";
const PRONOTUM = "#E74218";
const EMBER = "#F6A45A";
const ELYTRA = "#1C2638";
const ELYTRA_HI = "#2C384E";
const GRAY = "#A0A6B2";
const RULE = "#222837";
const WHITE = "#F2F3F6";

// ── Beetle geometry (untilted, head pointing +x) ──────────────────────────
// All coords centered at (0,0). The whole beetle is then rotated and placed.
const BODY_RX = 205;
const BODY_RY = 58;

// Nozzle (abdomen tip) in untilted local coords
const NOZZLE_LOCAL = { x: -230, y: 0 };
// Reservoir (hydroquinone + H2O2) — bigger, more readable
const RESERVOIR = { cx: -50, cy: 4, rx: 70, ry: 30 };
// Reaction chamber (catalase / peroxidase, hot) — enlarged
const REACTION = { cx: -158, cy: 4, rx: 40, ry: 24 };

// Beetle placement — rotate and translate
const BEETLE_TX = 650;
const BEETLE_TY = 400;
const BEETLE_ROT = -14; // degrees; negative = abdomen tip lifts down-left in SVG
const BEETLE_SCALE = 0.86;

// Pre-compute world coords for a local point (untilted local → world)
const radians = (BEETLE_ROT * Math.PI) / 180;
const cosR = Math.cos(radians);
const sinR = Math.sin(radians);
const toWorld = (lx: number, ly: number) => ({
  x: BEETLE_TX + (lx * cosR - ly * sinR) * BEETLE_SCALE,
  y: BEETLE_TY + (lx * sinR + ly * cosR) * BEETLE_SCALE,
});
const NOZZLE_WORLD = toWorld(NOZZLE_LOCAL.x, NOZZLE_LOCAL.y);
const RESERVOIR_WORLD = toWorld(RESERVOIR.cx, RESERVOIR.cy);
const REACTION_WORLD = toWorld(REACTION.cx, REACTION.cy);
// Spray direction — independent of body rotation: aimed UP-LEFT across the plate
// (12° above horizontal). SVG +y is DOWN, so "up" means negative y.
const SPRAY_ANGLE_DEG = 14;
const SPRAY_RAD = (SPRAY_ANGLE_DEG * Math.PI) / 180;
const SPRAY_DIR = {
  x: -Math.cos(SPRAY_RAD),
  y: -Math.sin(SPRAY_RAD),
};
const SPRAY_PERP = {
  x: -Math.sin(SPRAY_RAD),
  y: Math.cos(SPRAY_RAD),
};

// ─────────────────────────────────────────────────────────────────────────
// One pulse: launched at `launchFrame`; lives for `lifeFrames`; carries
// a small lateral jitter so the train of pulses looks like a spray, not a bullet.
type Pulse = {
  launch: number;
  jitter: number; // -1..1 lateral
  speed: number; // px/frame along spray dir
  size: number;
};

const PULSE_PERIOD = 11; // frames between launches — tighter for visible train
const PULSE_LIFE = 72; // frames

const buildPulses = (totalFrames: number): Pulse[] => {
  const pulses: Pulse[] = [];
  // start a few periods before frame 0 so the spray is already going at t=0
  for (let n = -7; n * PULSE_PERIOD < totalFrames + PULSE_LIFE; n++) {
    const launch = n * PULSE_PERIOD;
    // deterministic pseudo-jitter
    const j = Math.sin(n * 12.9898) * 43758.5453;
    const jitter = (j - Math.floor(j)) * 2 - 1;
    const k = Math.sin(n * 78.233) * 43758.5453;
    const sizeRand = k - Math.floor(k);
    pulses.push({
      launch,
      jitter,
      speed: 10.5 + sizeRand * 3.5,
      size: 11 + sizeRand * 7,
    });
  }
  return pulses;
};

export const BombardierBeetleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ── motion ──────────────────────────────────────────────────────────
  const titleSpring = spring({
    frame: frame - fps * 0.5,
    fps,
    config: { damping: 200, mass: 0.9 },
  });
  const hookOpacity = interpolate(
    frame,
    [fps * 1.0, fps * 1.8],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const beetleSpring = spring({
    frame: frame - fps * 0.15,
    fps,
    config: { damping: 170, mass: 1.0 },
  });
  const labelsOpacity = interpolate(
    frame,
    [fps * 0.7, fps * 1.4],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const pulses = buildPulses(durationInFrames);

  // ── page constants ──────────────────────────────────────────────────
  const W = 1080;
  const H = 1350;
  const MARGIN = 72;

  // Beetle wrapper transform
  const beetleTransform = `translate(${BEETLE_TX}, ${BEETLE_TY}) rotate(${BEETLE_ROT}) scale(${
    BEETLE_SCALE *
    interpolate(beetleSpring, [0, 1], [0.96, 1])
  })`;

  // Nozzle flash intensity — pulses synchronised with launches
  const flashAge = ((frame - 0) % PULSE_PERIOD) / PULSE_PERIOD;
  const flashIntensity = Math.max(0, 1 - flashAge * 2.4);

  return (
    <AbsoluteFill style={{ backgroundColor: INK, fontFamily: inter }}>
      <style>{fontCss}</style>

      {/* Top metadata band */}
      <div
        style={{
          position: "absolute",
          top: 54,
          left: MARGIN,
          right: MARGIN,
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
        <span style={{ color: PRONOTUM }}>2026 · 06 · 28</span>
      </div>

      {/* ── SVG plate ──────────────────────────────────────────────── */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient id="emberGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={EMBER} stopOpacity={0.9} />
            <stop offset="60%" stopColor={PRONOTUM} stopOpacity={0.35} />
            <stop offset="100%" stopColor={PRONOTUM} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="reactionGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={EMBER} stopOpacity={1} />
            <stop offset="100%" stopColor={PRONOTUM} stopOpacity={0.05} />
          </radialGradient>
          <radialGradient id="pulseCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE6C6" stopOpacity={1} />
            <stop offset="30%" stopColor={EMBER} stopOpacity={1} />
            <stop offset="100%" stopColor={PRONOTUM} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="elytraSheen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={ELYTRA_HI} />
            <stop offset="55%" stopColor={ELYTRA} />
            <stop offset="100%" stopColor="#10172A" />
          </linearGradient>
          <linearGradient id="pronotumSheen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F25B30" />
            <stop offset="100%" stopColor="#B82A0E" />
          </linearGradient>

          <clipPath id="cutawayClip">
            {/* cutaway window — local beetle coords */}
            <path d="M -215 4 Q -195 -44 -120 -48 L 0 -46 Q 38 -44 40 0 Q 38 44 0 46 L -120 48 Q -195 44 -215 4 Z" />
          </clipPath>

          <filter
            id="pulseBlur"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* subtle plate area behind the upper composition */}
        <rect x={0} y={0} width={W} height={H} fill={INK} />

        {/* faint horizontal rule under metadata band */}
        <line
          x1={MARGIN}
          y1={102}
          x2={W - MARGIN}
          y2={102}
          stroke={RULE}
          strokeWidth={1}
        />

        {/* axis tick marks down the right margin (engineering plate feel) */}
        {Array.from({ length: 11 }).map((_, i) => {
          const y = 150 + i * 48;
          if (y > 720) return null;
          const major = i % 5 === 0;
          return (
            <line
              key={`tick-${i}`}
              x1={W - MARGIN}
              y1={y}
              x2={W - MARGIN - (major ? 16 : 8)}
              y2={y}
              stroke={RULE}
              strokeWidth={1}
            />
          );
        })}

        {/* corner label, upper-left of plate */}
        <g
          transform={`translate(${MARGIN}, 154)`}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3.6}
          fontWeight={500}
        >
          <text>PLATE III · DEFENSIVE APPARATUS</text>
          <text y={20} fill={PRONOTUM} opacity={0.9}>
            SCALE 50 : 1
          </text>
        </g>

        {/* upper-right index label */}
        <g
          transform={`translate(${W - MARGIN}, 154)`}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3.6}
          fontWeight={500}
          textAnchor="end"
        >
          <text>SP. BRACHINUS CREPITANS</text>
          <text y={20} opacity={0.7}>
            CARABIDAE · COLEOPTERA
          </text>
        </g>

        {/* Spray pulses — drawn BEHIND the beetle would put them in the body;
            we want them clearly trailing FROM the nozzle, so draw above. */}
        <g opacity={interpolate(frame, [fps * 0.3, fps * 0.9], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp"
        })}>
          {pulses.map((p, i) => {
            const age = frame - p.launch;
            if (age < 0 || age > PULSE_LIFE) return null;
            // distance along spray direction
            const dist = age * p.speed;
            // a gentle arc — pulse drifts laterally
            const lateral = p.jitter * 10 + Math.sin(age * 0.16) * 3;
            // Gentle ballistic sag (gravity only; initial direction already aims up).
            const verticalOffset = (age * age) * 0.012;
            const x = NOZZLE_WORLD.x + SPRAY_DIR.x * dist + SPRAY_PERP.x * lateral;
            const y =
              NOZZLE_WORLD.y +
              SPRAY_DIR.y * dist +
              SPRAY_PERP.y * lateral +
              verticalOffset;
            // fade in fast, fade out
            const lifeT = age / PULSE_LIFE;
            const fade =
              lifeT < 0.06
                ? lifeT / 0.06
                : Math.pow(1 - (lifeT - 0.06) / 0.94, 1.3);
            // shrink slightly over life
            const r = p.size * (1 - lifeT * 0.5);
            return (
              <g key={`pulse-${i}`} opacity={fade}>
                <circle cx={x} cy={y} r={r * 2.6} fill="url(#pulseCore)" opacity={0.55} />
                <circle cx={x} cy={y} r={r * 1.2} fill="url(#pulseCore)" />
                <circle cx={x} cy={y} r={r * 0.55} fill="#FFF1D8" />
              </g>
            );
          })}
        </g>


        {/* ── The Beetle ────────────────────────────────────────── */}
        <g transform={beetleTransform}>
          {/* under-shadow */}
          <ellipse
            cx={-10}
            cy={92}
            rx={210}
            ry={14}
            fill="#000000"
            opacity={0.35}
          />

          {/* Legs (drawn before body so they tuck under) */}
          <g
            stroke={ELYTRA}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          >
            {/* front leg */}
            <path d="M 165 32 L 175 64 L 200 86" />
            <path d="M 175 64 L 145 78" />
            {/* mid leg */}
            <path d="M 35 52 L 45 86 L 80 100" />
            <path d="M 45 86 L 5 96" />
            {/* hind leg */}
            <path d="M -110 52 L -110 90 L -70 106" />
            <path d="M -110 90 L -150 100" />
          </g>

          {/* Antennae */}
          <g
            stroke={ELYTRA}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          >
            <path d="M 250 -8 Q 295 -42 320 -34" />
            <path d="M 252 -2 Q 305 -22 332 -10" />
          </g>

          {/* Head */}
          <circle cx={245} cy={2} r={26} fill={ELYTRA} />
          <circle cx={245} cy={2} r={26} fill="url(#elytraSheen)" opacity={0.85} />
          <circle cx={257} cy={-6} r={4} fill="#0A0B10" />
          <path
            d="M 268 6 Q 274 12 270 18"
            stroke={ELYTRA}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />

          {/* Pronotum (orange shield) */}
          <path
            d="M 195 -50 Q 230 -48 230 -34 L 230 32 Q 230 50 195 52 Q 178 50 175 32 L 175 -34 Q 178 -50 195 -50 Z"
            fill="url(#pronotumSheen)"
          />
          {/* pronotum centerline groove */}
          <line
            x1={205}
            y1={-44}
            x2={205}
            y2={48}
            stroke="#7A1A06"
            strokeWidth={1}
            opacity={0.7}
          />

          {/* Elytra (main body) */}
          <ellipse
            cx={-5}
            cy={0}
            rx={BODY_RX}
            ry={BODY_RY}
            fill="url(#elytraSheen)"
          />
          {/* elytra suture (centerline) */}
          <line
            x1={-205}
            y1={0}
            x2={195}
            y2={0}
            stroke="#0A0E18"
            strokeWidth={2.5}
          />
          {/* elytra longitudinal grooves */}
          {[-40, -28, -16, 16, 28, 40].map((y, i) => (
            <path
              key={`groove-${i}`}
              d={`M -190 ${y} Q -10 ${y * 1.04} 175 ${y * 0.9}`}
              stroke="#0E1422"
              strokeWidth={1}
              fill="none"
              opacity={0.85}
            />
          ))}
          {/* highlight along upper elytra */}
          <path
            d="M -180 -38 Q -10 -56 180 -36"
            stroke={ELYTRA_HI}
            strokeWidth={1.5}
            fill="none"
            opacity={0.7}
          />

          {/* ── Cutaway window: reveal chambers ── */}
          <g clipPath="url(#cutawayClip)">
            {/* window background */}
            <rect
              x={-220}
              y={-50}
              width={260}
              height={100}
              fill="#070912"
            />
            {/* faint internal grid — engineering plate feel */}
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={`cg-${i}`}
                x1={-220 + i * 22}
                y1={-50}
                x2={-220 + i * 22}
                y2={50}
                stroke="#10172A"
                strokeWidth={1}
              />
            ))}
            {/* Reservoir */}
            <ellipse
              cx={RESERVOIR.cx}
              cy={RESERVOIR.cy}
              rx={RESERVOIR.rx}
              ry={RESERVOIR.ry}
              fill="#1A2740"
              stroke={GRAY}
              strokeWidth={1.2}
            />
            <ellipse
              cx={RESERVOIR.cx}
              cy={RESERVOIR.cy}
              rx={RESERVOIR.rx - 8}
              ry={RESERVOIR.ry - 6}
              fill="#22324E"
              opacity={0.7}
            />
            {/* hydroquinone droplets in reservoir */}
            {[-30, -10, 12, 32].map((dx, i) => (
              <circle
                key={`hq-${i}`}
                cx={RESERVOIR.cx + dx}
                cy={RESERVOIR.cy + (i % 2 === 0 ? -6 : 6)}
                r={3}
                fill={GRAY}
                opacity={0.6}
              />
            ))}
            {/* valve between chambers */}
            <line
              x1={-117}
              y1={-12}
              x2={-117}
              y2={24}
              stroke={GRAY}
              strokeWidth={1.4}
            />
            <rect
              x={-120}
              y={-2}
              width={6}
              height={8}
              fill={PRONOTUM}
              opacity={0.85}
            />
            {/* Reaction chamber — glowing ember */}
            <ellipse
              cx={REACTION.cx}
              cy={REACTION.cy}
              rx={REACTION.rx + 14}
              ry={REACTION.ry + 14}
              fill="url(#reactionGlow)"
              opacity={0.55 + 0.35 * flashIntensity}
            />
            <ellipse
              cx={REACTION.cx}
              cy={REACTION.cy}
              rx={REACTION.rx}
              ry={REACTION.ry}
              fill={PRONOTUM}
              stroke={EMBER}
              strokeWidth={1.4}
            />
            <ellipse
              cx={REACTION.cx}
              cy={REACTION.cy - 4}
              rx={REACTION.rx - 8}
              ry={REACTION.ry - 6}
              fill={EMBER}
              opacity={0.85}
            />
            {/* channel from reaction chamber out to nozzle */}
            <path
              d={`M ${REACTION.cx - REACTION.rx} ${REACTION.cy} L -210 6`}
              stroke={EMBER}
              strokeWidth={3}
              fill="none"
              opacity={0.85}
            />
          </g>

          {/* cutaway window outline */}
          <path
            d="M -215 4 Q -195 -44 -120 -48 L 0 -46 Q 38 -44 40 0 Q 38 44 0 46 L -120 48 Q -195 44 -215 4 Z"
            fill="none"
            stroke={GRAY}
            strokeWidth={1.4}
            strokeDasharray="4 3"
            opacity={0.8}
          />

          {/* Nozzle / abdomen tip detail */}
          <g>
            <path
              d="M -205 -3 L -234 -2 L -234 5 L -205 6 Z"
              fill={ELYTRA}
            />
            <circle
              cx={-232}
              cy={2}
              r={28 + 10 * flashIntensity}
              fill="url(#emberGlow)"
              opacity={0.55 + 0.25 * flashIntensity}
            />
            <circle
              cx={-232}
              cy={2}
              r={10 + 4 * flashIntensity}
              fill={EMBER}
            />
            <circle
              cx={-232}
              cy={2}
              r={4 + 2 * flashIntensity}
              fill="#FFEDD2"
            />
          </g>
        </g>

        {/* ── Annotation callouts (world coords) ─────────────────────── */}
        <g
          opacity={labelsOpacity}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3}
          fontWeight={500}
          fill={GRAY}
        >
          {/* A · Reservoir callout — points DOWN to a label below the beetle */}
          {(() => {
            const t = RESERVOIR_WORLD;
            const elbowX = t.x + 70;
            const elbowY = 690;
            const labelX = 1008;
            return (
              <g>
                <line
                  x1={t.x}
                  y1={t.y}
                  x2={elbowX}
                  y2={elbowY}
                  stroke={GRAY}
                  strokeWidth={1}
                />
                <line
                  x1={elbowX}
                  y1={elbowY}
                  x2={labelX}
                  y2={elbowY}
                  stroke={GRAY}
                  strokeWidth={1}
                />
                <circle cx={t.x} cy={t.y} r={3} fill={GRAY} />
                <text x={labelX} y={elbowY - 8} textAnchor="end">
                  A · RESERVOIR
                </text>
                <text
                  x={labelX}
                  y={elbowY + 14}
                  textAnchor="end"
                  opacity={0.65}
                >
                  HYDROQUINONE + H₂O₂
                </text>
              </g>
            );
          })()}

          {/* B · Reaction chamber callout — points LEFT to a label */}
          {(() => {
            const t = REACTION_WORLD;
            const elbowX = t.x - 110;
            const elbowY = t.y + 78;
            const labelX = 220;
            return (
              <g>
                <line
                  x1={t.x}
                  y1={t.y}
                  x2={elbowX}
                  y2={elbowY}
                  stroke={PRONOTUM}
                  strokeWidth={1}
                />
                <line
                  x1={elbowX}
                  y1={elbowY}
                  x2={labelX}
                  y2={elbowY}
                  stroke={PRONOTUM}
                  strokeWidth={1}
                />
                <circle cx={t.x} cy={t.y} r={3} fill={PRONOTUM} />
                <text x={labelX - 6} y={elbowY - 8} textAnchor="start" fill={PRONOTUM}>
                  B · REACTION CHAMBER
                </text>
                <text
                  x={labelX - 6}
                  y={elbowY + 14}
                  textAnchor="start"
                  fill={PRONOTUM}
                  opacity={0.75}
                >
                  CATALASE · PEROXIDASE · ~100 °C
                </text>
              </g>
            );
          })()}

          {/* C · Nozzle callout — kink DOWN to a label below the spray trail */}
          {(() => {
            const t = NOZZLE_WORLD;
            const elbowX = t.x - 60;
            const elbowY = t.y + 130;
            const labelX = 72;
            return (
              <g>
                <line
                  x1={t.x}
                  y1={t.y}
                  x2={elbowX}
                  y2={elbowY}
                  stroke={EMBER}
                  strokeWidth={1}
                />
                <line
                  x1={elbowX}
                  y1={elbowY}
                  x2={labelX}
                  y2={elbowY}
                  stroke={EMBER}
                  strokeWidth={1}
                />
                <circle cx={t.x} cy={t.y} r={3} fill={EMBER} />
                <text
                  x={labelX}
                  y={elbowY - 8}
                  textAnchor="start"
                  fill={EMBER}
                >
                  C · NOZZLE
                </text>
                <text
                  x={labelX}
                  y={elbowY + 14}
                  textAnchor="start"
                  fill={EMBER}
                  opacity={0.75}
                >
                  500–1000 PULSES · S⁻¹
                </text>
              </g>
            );
          })()}
        </g>
      </svg>

      {/* ── Type lockup (lower left) ────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: MARGIN,
          right: MARGIN,
          top: 870,
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
            color: PRONOTUM,
            fontFamily: inter,
            fontSize: 13,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 18,
            fontWeight: 600,
          }}
        >
          Role <span style={{ color: GRAY, margin: "0 6px" }}>/</span>
          <span style={{ color: WHITE, letterSpacing: 5 }}>
            Pulse-Jet Engineer
          </span>
        </div>

        <div
          style={{
            color: WHITE,
            fontFamily: playfair,
            fontWeight: 500,
            fontSize: 92,
            lineHeight: 0.96,
            letterSpacing: -1.6,
            fontStyle: "italic",
          }}
        >
          The beetle with
          <br />a buzz bomb.
        </div>

        <div
          style={{
            marginTop: 30,
            color: "#C7C9D0",
            fontFamily: inter,
            fontSize: 19,
            lineHeight: 1.42,
            fontWeight: 400,
            maxWidth: 760,
            opacity: hookOpacity,
          }}
        >
          <span style={{ color: PRONOTUM, fontWeight: 600 }}>
            Brachinus
          </span>{" "}
          mixes hydroquinones and hydrogen peroxide with catalases in a
          chitin-walled reaction chamber, flashing the brew to{" "}
          <span style={{ color: EMBER, fontWeight: 600 }}>~100 °C</span> and
          ejecting it as{" "}
          <span style={{ color: EMBER, fontWeight: 600 }}>
            500–1000 discrete pulses per second
          </span>{" "}
          — a biological pulse jet.
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          left: MARGIN,
          right: MARGIN,
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
        <span>Dean et al. · Science 248 (1990) 1219–1221</span>
        <span>
          <span style={{ color: EMBER }}>●</span> Hot ejecta · 100 °C
        </span>
      </div>
    </AbsoluteFill>
  );
};
