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

// Palette — from the concept's visual brief
const ONYX = "#0B0A10";
const STAGE = "#101018";
const COPPER = "#7A1F0A";
const COPPER_HI = "#A23A18";
const JET = "#E36B1F";
const SPARK = "#FFC960";
const GRAY = "#9DA4AE";
const GRID = "#181822";
const GRID_MAJOR = "#222230";

// Inner SVG coord space for the frame: 1080 × 800.
// FRAME is the on-page placement of that inner board.
const FRAME = { x: 60, y: 130, w: 960, h: 711 };
const MAP_W = 1080;
const MAP_H = 800;
const scale = FRAME.w / MAP_W;

// ── Beetle geometry, in MAP coords ───────────────────────────────────────
// Profile-view beetle, facing LEFT, abdomen tip at the right where the jet exits.
const HEAD_CX = 205;
const HEAD_CY = 418;
const TURRET_X = 760;
const TURRET_Y = 418;

// Pulse train fires from the turret rightward to the inner edge.
const PULSE_END = 1040;

// One pulse position spec, animated over time.
type Pulse = {
  birthOffsetFrames: number; // when this pulse leaves the turret in a loop
};
const NUM_PULSES = 18;
const PULSE_SPACING_FRAMES = 6; // 30 fps / 6 ≈ 5 Hz — readable proxy for 500 Hz
const PULSE_TRAVEL_FRAMES = 60;

const PULSES: Pulse[] = Array.from({ length: NUM_PULSES }, (_, i) => ({
  birthOffsetFrames: i * PULSE_SPACING_FRAMES,
}));

// Oscillogram bars across the bottom strip
const OSC_BARS = 64;

export const BombardierCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const loopLen = PULSES.length * PULSE_SPACING_FRAMES; // single seamless cycle

  // Title / hook intro fades
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
  const schematicReveal = interpolate(frame, [0, fps * 1.0], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Each pulse renders as a spark that leaves the turret on its birth offset.
  const pulseStates = PULSES.map((p) => {
    const local = ((frame - p.birthOffsetFrames) % loopLen + loopLen) % loopLen;
    const travel = Math.min(local / PULSE_TRAVEL_FRAMES, 1);
    const eased = 1 - Math.pow(1 - travel, 2.2);
    const x = TURRET_X + (PULSE_END - TURRET_X) * eased;
    // brighter near the muzzle, fading to nothing at PULSE_END
    const life = 1 - travel;
    const opacity = Math.pow(life, 1.3) * (local < PULSE_TRAVEL_FRAMES ? 1 : 0);
    const r = 6 + life * 9;
    const heat = life;
    return { x, y: TURRET_Y, opacity, r, heat, travel };
  });

  // The oscillogram strip ticks one tall spike per fresh pulse.
  // Each bar is a moment in time; the rightmost bar = "now".
  const oscBars = Array.from({ length: OSC_BARS }, (_, i) => {
    // Place a peak every PERIOD bars; the train marches one bar per frame.
    const PERIOD = 5;
    const shifted = i + Math.floor(frame * 0.4);
    const phase = ((shifted % PERIOD) + PERIOD) % PERIOD;
    const isPeak = phase === 0;
    const isShoulder = phase === 1 || phase === PERIOD - 1;
    if (isPeak) return 1.0;
    if (isShoulder) return 0.45;
    return 0.08;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: ONYX, fontFamily: inter }}>
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
        <span style={{ color: JET }}>2026 · 06 · 27</span>
      </div>

      {/* Schematic board */}
      <svg
        width={1080}
        height={1350}
        viewBox="0 0 1080 1350"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern
            id="bgrid"
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
            id="bgrid-major"
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

          <radialGradient id="board-vignette" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#15151E" stopOpacity={1} />
            <stop offset="100%" stopColor={STAGE} stopOpacity={1} />
          </radialGradient>

          <radialGradient id="pulse-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={SPARK} stopOpacity={1} />
            <stop offset="55%" stopColor={JET} stopOpacity={0.9} />
            <stop offset="100%" stopColor={JET} stopOpacity={0} />
          </radialGradient>

          <linearGradient id="elytra-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B1B26" />
            <stop offset="55%" stopColor="#0F0F18" />
            <stop offset="100%" stopColor="#08080E" />
          </linearGradient>

          <linearGradient id="pronotum-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COPPER_HI} />
            <stop offset="100%" stopColor={COPPER} />
          </linearGradient>

          <filter id="jet-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
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
          fill="url(#bgrid)"
        />
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.w}
          height={FRAME.h}
          fill="url(#bgrid-major)"
        />

        {/* Inner thin border */}
        <rect
          x={FRAME.x + 0.5}
          y={FRAME.y + 0.5}
          width={FRAME.w - 1}
          height={FRAME.h - 1}
          fill="none"
          stroke="#2A2A38"
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
          <g key={i} stroke={JET} strokeWidth={1.5} fill="none">
            <line x1={cx} y1={cy} x2={cx + sx * 26} y2={cy} />
            <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 26} />
          </g>
        ))}

        {/* Top header strip inside frame */}
        <g
          transform={`translate(${FRAME.x + 26}, ${FRAME.y + 32})`}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3.5}
          fontWeight={600}
        >
          <text>FIG. 3 · TURRET PULSE FORM · BRACHINUS SP.</text>
        </g>
        <g
          transform={`translate(${FRAME.x + FRAME.w - 26}, ${FRAME.y + 32})`}
          fill={JET}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3.5}
          fontWeight={600}
          textAnchor="end"
        >
          <text>HOT BENZOQUINONE · ~100 °C</text>
        </g>

        {/* Map content: scale 1080×800 coords into FRAME */}
        <g transform={`translate(${FRAME.x}, ${FRAME.y}) scale(${scale})`}>
          {/* ── Beetle: profile view, facing left ───────────────────── */}
          <g opacity={schematicReveal}>
            {/* Antennae — two long sweeping segmented curves from the head */}
            <g
              stroke={GRAY}
              strokeWidth={1.6}
              fill="none"
              strokeLinecap="round"
            >
              <path d={`M 200 398 Q 170 360 130 320 Q 110 305 92 290`} />
              <path d={`M 188 410 Q 145 395 100 380 Q 80 376 62 374`} />
              <circle cx={92} cy={290} r={2.8} fill={GRAY} stroke="none" />
              <circle cx={62} cy={374} r={2.8} fill={GRAY} stroke="none" />
            </g>

            {/* Legs — three articulated limbs (coxa-femur, tibia, tarsus) */}
            <g stroke={GRAY} strokeWidth={2.2} fill="none" strokeLinecap="round">
              {/* front leg */}
              <path d={`M 268 475 L 252 530 L 232 552`} />
              <circle cx={232} cy={552} r={2.2} fill={GRAY} stroke="none" />
              {/* middle leg */}
              <path d={`M 430 480 L 440 545 L 470 568`} />
              <circle cx={470} cy={568} r={2.2} fill={GRAY} stroke="none" />
              {/* hind leg */}
              <path d={`M 610 478 L 660 552 L 700 575`} />
              <circle cx={700} cy={575} r={2.2} fill={GRAY} stroke="none" />
            </g>

            {/* ── Beetle body silhouette (one continuous outline) ──── */}
            <path
              d={`
                M 176 432
                Q 168 422 174 408
                Q 180 388 200 384
                Q 224 380 238 392
                Q 252 360 290 348
                Q 332 336 360 342
                Q 432 312 510 302
                Q 600 296 670 314
                Q 728 332 748 372
                Q 760 412 748 452
                Q 728 478 660 480
                L 250 482
                Q 218 482 200 472
                Q 180 462 176 444
                Z
              `}
              fill="url(#elytra-grad)"
              stroke="#2A2A38"
              strokeWidth={1.4}
            />

            {/* Pronotum overlay — copper shield between head and elytra */}
            <path
              d={`
                M 240 392
                Q 252 360 290 348
                Q 332 336 360 342
                L 360 478
                L 248 482
                Q 232 470 234 446
                Z
              `}
              fill="url(#pronotum-grad)"
              stroke="#3E0E04"
              strokeWidth={1.2}
            />
            {/* Pronotum highlight */}
            <path
              d={`M 258 358 Q 296 344 348 348`}
              stroke={SPARK}
              strokeWidth={1.1}
              fill="none"
              opacity={0.4}
            />

            {/* Pronotum → elytra transition: just a short upper shadow,
                not a hard vertical seam across the body */}
            <path
              d={`M 358 342 Q 360 380 364 410`}
              stroke="#3E0E04"
              strokeWidth={1.2}
              fill="none"
              opacity={0.5}
            />
            {/* Elytral striae — three on each side */}
            {[
              { d: "M 380 360 Q 510 326 660 338 Q 712 350 736 384" },
              { d: "M 386 388 Q 510 358 660 368 Q 710 380 738 408" },
              { d: "M 388 420 Q 510 402 660 408 Q 708 416 738 436" },
            ].map((s, i) => (
              <path
                key={`stria-${i}`}
                d={s.d}
                stroke="#1B1B26"
                strokeWidth={1}
                fill="none"
              />
            ))}

            {/* Head detail — small dark dome with eye + mandibles */}
            <ellipse
              cx={HEAD_CX}
              cy={HEAD_CY}
              rx={28}
              ry={24}
              fill="#0A0A12"
              stroke="#2A2A38"
              strokeWidth={1.2}
            />
            {/* Mandibles — short forward forks */}
            <path
              d={`M 180 410 L 162 402`}
              stroke={GRAY}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M 180 426 L 160 430`}
              stroke={GRAY}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
            />
            {/* Compound eye — bright bead */}
            <circle cx={196} cy={414} r={4.2} fill={SPARK} />
            <circle cx={196} cy={414} r={2} fill="#FFF6D8" />

            {/* Turret — copper swivel nozzle at the rear-right */}
            <g>
              {/* mount block */}
              <rect
                x={TURRET_X - 30}
                y={TURRET_Y - 26}
                width={34}
                height={52}
                rx={4}
                fill={COPPER}
                stroke="#3E0E04"
                strokeWidth={1.2}
              />
              {/* nozzle barrel */}
              <rect
                x={TURRET_X}
                y={TURRET_Y - 10}
                width={44}
                height={20}
                rx={4}
                fill={COPPER_HI}
                stroke="#3E0E04"
                strokeWidth={1.2}
              />
              {/* muzzle tip — hot spark plate */}
              <rect
                x={TURRET_X + 40}
                y={TURRET_Y - 12}
                width={6}
                height={24}
                rx={1.5}
                fill={SPARK}
              />
              {/* turret rivets */}
              <circle cx={TURRET_X - 20} cy={TURRET_Y - 14} r={2} fill={SPARK} />
              <circle cx={TURRET_X - 20} cy={TURRET_Y + 14} r={2} fill={SPARK} />
            </g>

            {/* Internal callouts — schematic-style labels with leader lines */}
            <g stroke={GRAY} strokeWidth={1} fill="none">
              {/* Reservoir A (hydroquinone) */}
              <circle
                cx={300}
                cy={420}
                r={20}
                fill="rgba(255,201,96,0.10)"
                stroke={GRAY}
                strokeDasharray="3 3"
              />
              <text
                x={300}
                y={424}
                fill={SPARK}
                fontFamily={inter}
                fontSize={12}
                letterSpacing={2}
                textAnchor="middle"
                fontWeight={700}
                stroke="none"
              >
                A
              </text>

              {/* Reaction vestibule B */}
              <circle
                cx={560}
                cy={400}
                r={18}
                fill="rgba(227,107,31,0.16)"
                stroke={JET}
                strokeDasharray="3 3"
              />
              <text
                x={560}
                y={404}
                fill={JET}
                fontFamily={inter}
                fontSize={12}
                letterSpacing={2}
                textAnchor="middle"
                fontWeight={700}
                stroke="none"
              >
                B
              </text>

              {/* Channel A → B (dotted hint) */}
              <path
                d={`M 320 420 L 540 400`}
                stroke={GRAY}
                strokeWidth={1}
                strokeDasharray="2 4"
                opacity={0.55}
              />

              {/* Leader: A → label (down-left, below the legs) */}
              <path d={`M 290 440 L 290 598 L 140 598`} />
              <text
                x={140}
                y={593}
                fill={GRAY}
                fontFamily={inter}
                fontSize={11}
                letterSpacing={2.5}
                fontWeight={600}
                stroke="none"
              >
                A · HYDROQUINONE + H₂O₂
              </text>

              {/* Leader: B → label (down-right, below the legs) */}
              <path d={`M 572 418 L 572 598 L 760 598`} />
              <text
                x={760}
                y={593}
                fill={GRAY}
                fontFamily={inter}
                fontSize={11}
                letterSpacing={2.5}
                fontWeight={600}
                stroke="none"
              >
                B · CATALASE + PEROXIDASE
              </text>

              {/* Turret label — high above the body so the leader clears the dome */}
              <path
                d={`M ${TURRET_X + 22} ${TURRET_Y - 32} L ${TURRET_X + 22} 250 L 500 250`}
              />
              <text
                x={494}
                y={244}
                fill={JET}
                fontFamily={inter}
                fontSize={11}
                letterSpacing={3}
                fontWeight={700}
                stroke="none"
                textAnchor="end"
              >
                DIRECTIONAL TURRET
              </text>
            </g>
          </g>

          {/* ── Pulse train firing out of the turret ─────────────────── */}
          <g filter="url(#jet-glow)">
            {pulseStates.map((p, i) => (
              <g key={`pulse-${i}`} opacity={p.opacity}>
                <ellipse
                  cx={p.x}
                  cy={p.y}
                  rx={p.r * 1.6}
                  ry={p.r}
                  fill="url(#pulse-grad)"
                />
              </g>
            ))}
          </g>
          {/* Bright muzzle flash core */}
          <g>
            <circle
              cx={TURRET_X + 46}
              cy={TURRET_Y}
              r={9}
              fill={SPARK}
              opacity={0.9}
            />
            <circle
              cx={TURRET_X + 46}
              cy={TURRET_Y}
              r={18}
              fill={JET}
              opacity={0.3}
            />
          </g>

          {/* ── Oscillogram strip (the pyrotechnician's frequency readout) ── */}
          <g transform={`translate(0, 620)`} opacity={schematicReveal}>
            {/* strip frame */}
            <rect
              x={60}
              y={0}
              width={960}
              height={100}
              fill="rgba(255,255,255,0.02)"
              stroke="#2A2A38"
              strokeWidth={1}
            />
            {/* center axis */}
            <line
              x1={60}
              y1={50}
              x2={1020}
              y2={50}
              stroke="#2A2A38"
              strokeWidth={1}
            />
            {/* bars */}
            {oscBars.map((h, i) => {
              const bx = 70 + i * ((960 - 20) / OSC_BARS);
              const bw = (960 - 20) / OSC_BARS - 2;
              const bh = Math.max(2, h * 84);
              const isPeak = h >= 0.95;
              const isShoulder = h >= 0.3 && h < 0.95;
              const fill = isPeak ? SPARK : isShoulder ? JET : GRAY;
              const op = isPeak ? 1 : isShoulder ? 0.85 : 0.32;
              return (
                <rect
                  key={`bar-${i}`}
                  x={bx}
                  y={50 - bh / 2}
                  width={bw}
                  height={bh}
                  fill={fill}
                  opacity={op}
                  rx={0.8}
                />
              );
            })}
            {/* labels */}
            <text
              x={60}
              y={-12}
              fill={GRAY}
              fontFamily={inter}
              fontSize={11}
              letterSpacing={3}
              fontWeight={600}
            >
              PULSE FREQUENCY
            </text>
            <text
              x={1020}
              y={-12}
              fill={JET}
              fontFamily={inter}
              fontSize={11}
              letterSpacing={3.5}
              fontWeight={700}
              textAnchor="end"
            >
              ≈ 500 Hz
            </text>
            <text
              x={60}
              y={120}
              fill={GRAY}
              fontFamily={inter}
              fontSize={10}
              letterSpacing={2.5}
              fontWeight={500}
            >
              T → (HIGH-SPEED CAPTURE, DEAN ET AL. 1990)
            </text>
            <text
              x={1020}
              y={120}
              fill={GRAY}
              fontFamily={inter}
              fontSize={10}
              letterSpacing={2.5}
              fontWeight={500}
              textAnchor="end"
            >
              ~500 PULSES / SEC
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
          <text>FIG. 3 · PULSED BENZOQUINONE JET, BRACHINUS SP.</text>
          <text x={FRAME.w} textAnchor="end" fill={JET} opacity={0.85}>
            BIOLOGICAL PULSE-JET ENGINE
          </text>
        </g>
      </svg>

      {/* ── Type lockup ──────────────────────────────────────────────── */}
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
            [16, 0]
          )}px)`,
        }}
      >
        <div
          style={{
            color: JET,
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
            Pyrotechnician
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
          The 500-pulse
          <br />
          gunner.
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
          Mix hydroquinones with hydrogen peroxide inside an armoured chamber,
          and the bombardier beetle{" "}
          <span style={{ color: JET, fontWeight: 600 }}>Brachinus</span> fires a
          ~100 °C benzoquinone spray as a pulsed jet — high-speed photography
          clocked the train at roughly{" "}
          <span style={{ color: JET, fontWeight: 600 }}>500 pulses per second</span>.
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
        <span>Dean, Aneshansley, Edgerton &amp; Eisner · Science 248 (1990) 1219–1221</span>
        <span>
          <span style={{ color: JET }}>●</span> 500 Hz Pulse
        </span>
      </div>
    </AbsoluteFill>
  );
};
