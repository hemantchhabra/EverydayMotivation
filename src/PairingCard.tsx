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

// Palette — from the visual brief
const CARBON = "#0B0C10";
const BOARD = "#141519";
const PRONOTUM = "#E86A2A";
const PRONOTUM_DIM = "#B04E1E";
const FLASH = "#F4B12A";
const FLASH_HOT = "#FFE0A0";
const SCORCH = "#7A2A18";
const BONE = "#D8CBB4";
const GRID = "#1D1F25";
const GRID_MAJOR = "#282B33";
const GRAY = "#7A7C83";

// ─────────────────────────────────────────────────────────────────────────────
// Layout
const FRAME = { x: 60, y: 130, w: 960, h: 720 };

// Beetle sits in the upper half of the plate, facing right.
// Head at left, elytra body at center, abdomen taper at right, nozzle exiting.
const HEAD = { x: 170, y: 320, r: 28 };
const PRONOTUM_BOX = { x: 195, y: 288, w: 90, h: 64 };
const ELYTRA = { cx: 470, cy: 320, rx: 210, ry: 92 };
const ABDOMEN_TIP = { x: 720, y: 320 };
const NOZZLE = { x: 780, y: 320 };

// Internal apparatus — positioned inside the elytra/abdomen
const RESERVOIR = { x: 400, y: 320, r: 44 };
const VALVE = { x: 478, y: 306, w: 34, h: 28 };
const CHAMBER = { x: 528, y: 290, w: 170, h: 60 };

// ─────────────────────────────────────────────────────────────────────────────
// Pulses — spring-eased emissions from the nozzle
const PULSE_INTERVAL = 8;
const PULSE_LIFE = 42;
const PULSE_SPEED = 8.5;

type Pulse = { born: number };
const activePulses = (frame: number): Pulse[] => {
  const list: Pulse[] = [];
  for (let born = frame; born > frame - PULSE_LIFE; born -= PULSE_INTERVAL) {
    const b = Math.floor(born / PULSE_INTERVAL) * PULSE_INTERVAL;
    if (b <= frame && b > frame - PULSE_LIFE) list.push({ born: b });
  }
  return list;
};

// ─────────────────────────────────────────────────────────────────────────────
export const PairingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame: frame - fps * 0.35,
    fps,
    config: { damping: 200, mass: 0.8 },
  });
  const hookOpacity = interpolate(frame, [fps * 0.9, fps * 1.9], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const plateReveal = interpolate(frame, [0, fps * 0.8], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulses = activePulses(frame);
  const valveFlash = Math.max(
    0,
    1 - ((frame % PULSE_INTERVAL) / PULSE_INTERVAL) * 1.4
  );

  return (
    <AbsoluteFill style={{ backgroundColor: CARBON, fontFamily: inter }}>
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
        <span style={{ color: PRONOTUM }}>2026 · 07 · 02</span>
      </div>

      {/* Technical plate */}
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

          <radialGradient id="plate-vignette" cx="55%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#181A20" />
            <stop offset="100%" stopColor={BOARD} />
          </radialGradient>

          <radialGradient id="muzzle-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={FLASH_HOT} stopOpacity={0.9} />
            <stop offset="60%" stopColor={FLASH} stopOpacity={0.35} />
            <stop offset="100%" stopColor={FLASH} stopOpacity={0} />
          </radialGradient>

          <radialGradient id="pulse-body" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={FLASH_HOT} stopOpacity={0.95} />
            <stop offset="55%" stopColor={FLASH} stopOpacity={0.75} />
            <stop offset="100%" stopColor={FLASH} stopOpacity={0} />
          </radialGradient>

          <linearGradient id="chamber-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A1610" />
            <stop offset="100%" stopColor={SCORCH} />
          </linearGradient>

          <linearGradient id="elytra-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A1216" />
            <stop offset="100%" stopColor={CARBON} />
          </linearGradient>

          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Plate background */}
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.w}
          height={FRAME.h}
          fill="url(#plate-vignette)"
        />
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.w}
          height={FRAME.h}
          fill="url(#grid)"
          opacity={plateReveal}
        />
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.w}
          height={FRAME.h}
          fill="url(#grid-major)"
          opacity={plateReveal}
        />

        {/* Inner border */}
        <rect
          x={FRAME.x + 0.5}
          y={FRAME.y + 0.5}
          width={FRAME.w - 1}
          height={FRAME.h - 1}
          fill="none"
          stroke="#2A2D35"
          strokeWidth={1}
        />

        {/* Corner marks */}
        {(
          [
            [FRAME.x, FRAME.y, 1, 1],
            [FRAME.x + FRAME.w, FRAME.y, -1, 1],
            [FRAME.x, FRAME.y + FRAME.h, 1, -1],
            [FRAME.x + FRAME.w, FRAME.y + FRAME.h, -1, -1],
          ] as const
        ).map(([cx, cy, sx, sy], i) => (
          <g key={i} stroke={PRONOTUM} strokeWidth={1.5} fill="none">
            <line x1={cx} y1={cy} x2={cx + sx * 26} y2={cy} />
            <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 26} />
          </g>
        ))}

        {/* Plate label */}
        <g
          transform={`translate(${FRAME.x + 26}, ${FRAME.y + 30})`}
          fill={GRAY}
          fontFamily={inter}
          fontWeight={600}
          fontSize={11}
          letterSpacing={3.5}
        >
          <text textAnchor="start">PLATE I</text>
          <text
            x={0}
            y={16}
            fill={GRAY}
            opacity={0.7}
            fontSize={10}
            letterSpacing={3}
            fontWeight={500}
          >
            BRACHININI · DEFENSIVE APPARATUS
          </text>
        </g>

        <g
          transform={`translate(${FRAME.x + FRAME.w - 26}, ${FRAME.y + 30})`}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3.5}
          fontWeight={600}
          textAnchor="end"
        >
          <text>PROFILE · L 1:1</text>
        </g>

        {/* ═════════════════════════════════════════════════════════════════
             Beetle profile (facing right), positioned in upper half of plate.
             Group is translated into the plate coord system so element
             coords are LOCAL (0..960 wide, 0..720 tall).
             ═════════════════════════════════════════════════════════════════ */}
        <g transform={`translate(${FRAME.x}, ${FRAME.y})`} opacity={plateReveal}>
          {/* Antennae */}
          <g stroke={PRONOTUM} strokeWidth={1.4} fill="none" strokeLinecap="round">
            <path
              d={`M ${HEAD.x - 6} ${HEAD.y - 20}
                  C ${HEAD.x - 30} ${HEAD.y - 55},
                    ${HEAD.x - 60} ${HEAD.y - 80},
                    ${HEAD.x - 90} ${HEAD.y - 100}`}
            />
            <path
              d={`M ${HEAD.x + 4} ${HEAD.y - 22}
                  C ${HEAD.x + 4} ${HEAD.y - 60},
                    ${HEAD.x - 20} ${HEAD.y - 90},
                    ${HEAD.x - 50} ${HEAD.y - 118}`}
            />
            {/* club tips */}
            <circle cx={HEAD.x - 90} cy={HEAD.y - 100} r={2.5} fill={PRONOTUM} />
            <circle cx={HEAD.x - 50} cy={HEAD.y - 118} r={2.5} fill={PRONOTUM} />
          </g>

          {/* Head */}
          <circle
            cx={HEAD.x}
            cy={HEAD.y}
            r={HEAD.r}
            fill={CARBON}
            stroke={PRONOTUM}
            strokeWidth={1.6}
          />
          <circle
            cx={HEAD.x + 8}
            cy={HEAD.y - 6}
            r={5}
            fill={PRONOTUM}
            opacity={0.9}
          />

          {/* Pronotum (thorax plate) */}
          <path
            d={`M ${PRONOTUM_BOX.x} ${PRONOTUM_BOX.y + PRONOTUM_BOX.h}
                Q ${PRONOTUM_BOX.x + 8} ${PRONOTUM_BOX.y - 4},
                  ${PRONOTUM_BOX.x + PRONOTUM_BOX.w * 0.55} ${PRONOTUM_BOX.y}
                Q ${PRONOTUM_BOX.x + PRONOTUM_BOX.w} ${PRONOTUM_BOX.y + 4},
                  ${PRONOTUM_BOX.x + PRONOTUM_BOX.w + 6} ${PRONOTUM_BOX.y + PRONOTUM_BOX.h - 6}
                Z`}
            fill={PRONOTUM_DIM}
            stroke={PRONOTUM}
            strokeWidth={1.6}
          />

          {/* Elytra (main body) — an oval with a tapering abdomen tail */}
          <path
            d={`M ${ELYTRA.cx - ELYTRA.rx} ${ELYTRA.cy}
                Q ${ELYTRA.cx - ELYTRA.rx} ${ELYTRA.cy - ELYTRA.ry * 1.05},
                  ${ELYTRA.cx} ${ELYTRA.cy - ELYTRA.ry}
                Q ${ELYTRA.cx + ELYTRA.rx * 0.9} ${ELYTRA.cy - ELYTRA.ry * 0.95},
                  ${ABDOMEN_TIP.x} ${ABDOMEN_TIP.y - 34}
                Q ${ABDOMEN_TIP.x + 40} ${ABDOMEN_TIP.y - 20},
                  ${NOZZLE.x - 6} ${NOZZLE.y - 8}
                L ${NOZZLE.x - 6} ${NOZZLE.y + 8}
                Q ${ABDOMEN_TIP.x + 40} ${ABDOMEN_TIP.y + 20},
                  ${ABDOMEN_TIP.x} ${ABDOMEN_TIP.y + 34}
                Q ${ELYTRA.cx + ELYTRA.rx * 0.9} ${ELYTRA.cy + ELYTRA.ry * 0.95},
                  ${ELYTRA.cx} ${ELYTRA.cy + ELYTRA.ry}
                Q ${ELYTRA.cx - ELYTRA.rx} ${ELYTRA.cy + ELYTRA.ry * 1.05},
                  ${ELYTRA.cx - ELYTRA.rx} ${ELYTRA.cy}
                Z`}
            fill="url(#elytra-fill)"
            stroke={PRONOTUM}
            strokeWidth={1.6}
          />
          {/* Elytra median seam */}
          <line
            x1={ELYTRA.cx - ELYTRA.rx + 16}
            y1={ELYTRA.cy}
            x2={NOZZLE.x - 20}
            y2={NOZZLE.y}
            stroke={PRONOTUM}
            strokeWidth={0.8}
            strokeDasharray="4 6"
            opacity={0.55}
          />

          {/* Legs — three pairs beneath the body, coxa → femur → tibia */}
          <g stroke={PRONOTUM} strokeWidth={2.4} strokeLinecap="round" fill="none">
            <path d={`M 260 ${ELYTRA.cy + ELYTRA.ry - 8} L 232 ${ELYTRA.cy + ELYTRA.ry + 28} L 246 ${ELYTRA.cy + ELYTRA.ry + 42}`} />
            <path d={`M 360 ${ELYTRA.cy + ELYTRA.ry - 4} L 352 ${ELYTRA.cy + ELYTRA.ry + 34} L 370 ${ELYTRA.cy + ELYTRA.ry + 46}`} />
            <path d={`M 500 ${ELYTRA.cy + ELYTRA.ry - 8} L 512 ${ELYTRA.cy + ELYTRA.ry + 30} L 530 ${ELYTRA.cy + ELYTRA.ry + 42}`} />
          </g>

          {/* ─── Internal cutaway apparatus ─────────────────────────────── */}

          {/* Reservoir (A) — hydroquinones + H₂O₂ */}
          <circle
            cx={RESERVOIR.x}
            cy={RESERVOIR.y}
            r={RESERVOIR.r}
            fill={CARBON}
            stroke={BONE}
            strokeWidth={1.4}
          />
          <circle
            cx={RESERVOIR.x}
            cy={RESERVOIR.y}
            r={RESERVOIR.r - 5}
            fill="none"
            stroke={BONE}
            strokeWidth={0.6}
            strokeDasharray="2 5"
            opacity={0.55}
          />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2 + (frame % 200) * 0.005;
            const rr = 14 + ((i * 11) % 22);
            const x = RESERVOIR.x + Math.cos(a) * rr;
            const y = RESERVOIR.y + Math.sin(a) * rr;
            const isPeroxide = i % 2 === 0;
            return (
              <circle
                key={`mol-${i}`}
                cx={x}
                cy={y}
                r={isPeroxide ? 2.2 : 1.5}
                fill={isPeroxide ? BONE : PRONOTUM}
                opacity={0.75}
              />
            );
          })}

          {/* Duct from reservoir to valve */}
          <path
            d={`M ${RESERVOIR.x + RESERVOIR.r - 2} ${RESERVOIR.y}
                L ${VALVE.x} ${VALVE.y + VALVE.h / 2}`}
            stroke={BONE}
            strokeWidth={5}
            fill="none"
          />
          <path
            d={`M ${RESERVOIR.x + RESERVOIR.r - 2} ${RESERVOIR.y}
                L ${VALVE.x} ${VALVE.y + VALVE.h / 2}`}
            stroke={CARBON}
            strokeWidth={2.2}
            fill="none"
          />

          {/* Valve */}
          <rect
            x={VALVE.x}
            y={VALVE.y}
            width={VALVE.w}
            height={VALVE.h}
            fill={CARBON}
            stroke={BONE}
            strokeWidth={1.4}
          />
          <rect
            x={VALVE.x + 4}
            y={VALVE.y + 4}
            width={VALVE.w - 8}
            height={VALVE.h - 8}
            fill={FLASH}
            opacity={valveFlash * 0.95}
          />

          {/* Reaction chamber (B) */}
          <rect
            x={CHAMBER.x}
            y={CHAMBER.y}
            width={CHAMBER.w}
            height={CHAMBER.h}
            rx={8}
            fill="url(#chamber-fill)"
            stroke={BONE}
            strokeWidth={1.6}
          />
          {[0.2, 0.4, 0.6, 0.8].map((f) => (
            <line
              key={`rib-${f}`}
              x1={CHAMBER.x + CHAMBER.w * f}
              y1={CHAMBER.y + 4}
              x2={CHAMBER.x + CHAMBER.w * f}
              y2={CHAMBER.y + CHAMBER.h - 4}
              stroke={BONE}
              strokeWidth={0.8}
              opacity={0.55}
            />
          ))}
          {/* Boiling bubbles inside the chamber */}
          {Array.from({ length: 6 }).map((_, i) => {
            const bx =
              CHAMBER.x + 14 + ((i * 27 + (frame * 1.2)) % (CHAMBER.w - 28));
            const by =
              CHAMBER.y + CHAMBER.h - 10 - ((frame * 0.9 + i * 13) % (CHAMBER.h - 20));
            return (
              <circle
                key={`bub-${i}`}
                cx={bx}
                cy={by}
                r={1.6 + (i % 3)}
                fill={FLASH_HOT}
                opacity={0.85}
              />
            );
          })}

          {/* Nozzle — protrudes past the abdomen tip */}
          <path
            d={`M ${CHAMBER.x + CHAMBER.w} ${CHAMBER.y + 12}
                L ${NOZZLE.x - 4} ${NOZZLE.y - 14}
                L ${NOZZLE.x + 14} ${NOZZLE.y}
                L ${NOZZLE.x - 4} ${NOZZLE.y + 14}
                L ${CHAMBER.x + CHAMBER.w} ${CHAMBER.y + CHAMBER.h - 12}
                Z`}
            fill={CARBON}
            stroke={BONE}
            strokeWidth={1.4}
          />

          {/* ─── Callout leaders (kept clear of body) ───────────────────── */}

          {/* A · RESERVOIR — up and left */}
          <g stroke={BONE} strokeWidth={1} fill="none">
            <line
              x1={RESERVOIR.x - 20}
              y1={RESERVOIR.y - RESERVOIR.r + 10}
              x2={RESERVOIR.x - 60}
              y2={RESERVOIR.y - RESERVOIR.r - 60}
            />
            <line
              x1={RESERVOIR.x - 60}
              y1={RESERVOIR.y - RESERVOIR.r - 60}
              x2={RESERVOIR.x + 40}
              y2={RESERVOIR.y - RESERVOIR.r - 60}
            />
          </g>
          <g
            transform={`translate(${RESERVOIR.x + 44}, ${RESERVOIR.y - RESERVOIR.r - 66})`}
            fontFamily={inter}
          >
            <text
              fill={BONE}
              fontSize={12}
              letterSpacing={3}
              fontWeight={600}
            >
              A · RESERVOIR
            </text>
            <text
              y={16}
              fill={GRAY}
              fontSize={10}
              letterSpacing={2}
              fontWeight={500}
            >
              HYDROQUINONES + H₂O₂
            </text>
          </g>

          {/* B · REACTION CHAMBER — down and right of chamber, tucked under abdomen */}
          <g stroke={BONE} strokeWidth={1} fill="none">
            <line
              x1={CHAMBER.x + CHAMBER.w * 0.7}
              y1={CHAMBER.y + CHAMBER.h + 4}
              x2={CHAMBER.x + CHAMBER.w * 0.7}
              y2={CHAMBER.y + CHAMBER.h + 180}
            />
            <line
              x1={CHAMBER.x + CHAMBER.w * 0.7}
              y1={CHAMBER.y + CHAMBER.h + 180}
              x2={CHAMBER.x + CHAMBER.w + 30}
              y2={CHAMBER.y + CHAMBER.h + 180}
            />
          </g>
          <g
            transform={`translate(${CHAMBER.x + CHAMBER.w + 36}, ${CHAMBER.y + CHAMBER.h + 174})`}
            fontFamily={inter}
          >
            <text
              fill={BONE}
              fontSize={12}
              letterSpacing={3}
              fontWeight={600}
            >
              B · REACTION CHAMBER
            </text>
            <text
              y={16}
              fill={GRAY}
              fontSize={10}
              letterSpacing={2}
              fontWeight={500}
            >
              CATALASE · PEROXIDASE
            </text>
          </g>

          {/* C · VALVE — down and left */}
          <g stroke={BONE} strokeWidth={1} fill="none">
            <line
              x1={VALVE.x + VALVE.w / 2}
              y1={VALVE.y + VALVE.h}
              x2={VALVE.x + VALVE.w / 2}
              y2={VALVE.y + VALVE.h + 180}
            />
            <line
              x1={VALVE.x + VALVE.w / 2}
              y1={VALVE.y + VALVE.h + 180}
              x2={VALVE.x - 100}
              y2={VALVE.y + VALVE.h + 180}
            />
          </g>
          <g
            transform={`translate(${VALVE.x - 106}, ${VALVE.y + VALVE.h + 174})`}
            fontFamily={inter}
            textAnchor="end"
          >
            <text fill={BONE} fontSize={12} letterSpacing={3} fontWeight={600}>
              C · VALVE
            </text>
            <text
              y={16}
              fill={GRAY}
              fontSize={10}
              letterSpacing={2}
              fontWeight={500}
            >
              PULSED · ≈ 500 HZ
            </text>
          </g>
        </g>

        {/* ═════════════════════════════════════════════════════════════════
             Pulsed jet — drawn in plate coord space (translated)
             ═════════════════════════════════════════════════════════════════ */}
        <g transform={`translate(${FRAME.x}, ${FRAME.y})`}>
          <circle
            cx={NOZZLE.x + 14}
            cy={NOZZLE.y}
            r={28 + valveFlash * 12}
            fill="url(#muzzle-glow)"
          />
          {pulses.map((p) => {
            const age = frame - p.born;
            const life = age / PULSE_LIFE;
            const dx = age * PULSE_SPEED;
            const cx = NOZZLE.x + 20 + dx;
            const cy = NOZZLE.y + Math.sin(age * 0.32) * 3;
            const rBody = 12 + life * 30;
            const rHalo = 20 + life * 62;
            const opBody = Math.max(0, 1 - life * 1.2);
            const opHalo = Math.max(0, 0.5 - life * 0.65);
            const opHot = Math.max(0, 0.95 - life * 2.4);
            const hotR = Math.max(1, 7 - life * 7);
            if (cx > FRAME.w - 30) return null;
            return (
              <g key={`pulse-${p.born}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={rHalo}
                  fill={FLASH}
                  opacity={opHalo}
                  filter="url(#soft-glow)"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={rBody}
                  fill="url(#pulse-body)"
                  opacity={opBody}
                />
                {opHot > 0 && (
                  <circle cx={cx} cy={cy} r={hotR} fill={FLASH_HOT} opacity={opHot} />
                )}
              </g>
            );
          })}

          {/* Temperature callout above jet — pulled inward to clear the plate corner */}
          <g opacity={plateReveal}>
            <line
              x1={NOZZLE.x + 70}
              y1={NOZZLE.y - 20}
              x2={NOZZLE.x + 70}
              y2={NOZZLE.y - 88}
              stroke={FLASH}
              strokeWidth={1.2}
            />
            <rect
              x={NOZZLE.x + 6}
              y={NOZZLE.y - 122}
              width={128}
              height={34}
              rx={2}
              fill={CARBON}
              stroke={FLASH}
              strokeWidth={1.2}
            />
            <text
              x={NOZZLE.x + 70}
              y={NOZZLE.y - 100}
              fill={FLASH}
              fontFamily={inter}
              fontSize={13}
              letterSpacing={4}
              fontWeight={700}
              textAnchor="middle"
            >
              ≈ 100 °C JET
            </text>
          </g>
        </g>

        {/* ═════════════════════════════════════════════════════════════════
             Reaction equation — fills the lower plate
             ═════════════════════════════════════════════════════════════════ */}
        <g
          transform={`translate(${FRAME.x + FRAME.w / 2}, ${FRAME.y + 626})`}
          opacity={plateReveal}
          fontFamily={inter}
          textAnchor="middle"
        >
          <text
            fill={GRAY}
            fontSize={11}
            letterSpacing={4}
            fontWeight={600}
            y={-48}
          >
            REACTION · CATALYSED IN CHAMBER B
          </text>

          {/* Equation as a single line, generous tracking */}
          <g fontFamily={playfair}>
            <text y={0} fill={BONE} fontSize={44} letterSpacing={2}>
              <tspan>C</tspan>
              <tspan fontSize={26} dy={12}>6</tspan>
              <tspan dy={-12}>H</tspan>
              <tspan fontSize={26} dy={12}>6</tspan>
              <tspan dy={-12}>O</tspan>
              <tspan fontSize={26} dy={12}>2</tspan>
              <tspan dy={-12}>{"   +   "}</tspan>
              <tspan>H</tspan>
              <tspan fontSize={26} dy={12}>2</tspan>
              <tspan dy={-12}>O</tspan>
              <tspan fontSize={26} dy={12}>2</tspan>
              <tspan dy={-12} fill={PRONOTUM}>{"   →   "}</tspan>
              <tspan fill={FLASH}>C</tspan>
              <tspan fill={FLASH} fontSize={26} dy={12}>6</tspan>
              <tspan fill={FLASH} dy={-12}>H</tspan>
              <tspan fill={FLASH} fontSize={26} dy={12}>4</tspan>
              <tspan fill={FLASH} dy={-12}>O</tspan>
              <tspan fill={FLASH} fontSize={26} dy={12}>2</tspan>
              <tspan dy={-12}>{"   +   "}</tspan>
              <tspan>2 H</tspan>
              <tspan fontSize={26} dy={12}>2</tspan>
              <tspan dy={-12}>O</tspan>
              <tspan dy={0}>{"   +   "}</tspan>
              <tspan fill={PRONOTUM} fontStyle="italic">Δ</tspan>
            </text>
          </g>

          <g fill={GRAY} fontSize={11} letterSpacing={3} fontWeight={500}>
            <text x={-260} y={42} textAnchor="start">HYDROQUINONE</text>
            <text x={-90} y={42} textAnchor="start">H₂O₂</text>
            <text x={80} y={42} textAnchor="start" fill={FLASH} opacity={0.9}>
              BENZOQUINONE
            </text>
            <text x={300} y={42} textAnchor="start">STEAM + HEAT</text>
          </g>
        </g>

        {/* Caption strip below plate */}
        <g
          transform={`translate(${FRAME.x}, ${FRAME.y + FRAME.h + 22})`}
          fill={GRAY}
          fontFamily={inter}
          fontSize={11}
          letterSpacing={3}
          fontWeight={500}
        >
          <text>FIG. 1 · PULSED BENZOQUINONE EJECTION, LATERAL VIEW</text>
          <text
            x={FRAME.w}
            textAnchor="end"
            fill={PRONOTUM}
            opacity={0.9}
          >
            EXOTHERMIC · SELF-REGULATING
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
            [16, 0]
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
          The pocket
          <br />
          pyrotechnician.
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
          Inside a reinforced abdominal chamber, the{" "}
          <span style={{ color: PRONOTUM, fontWeight: 600 }}>
            bombardier beetle
          </span>{" "}
          mixes hydroquinones with hydrogen peroxide, catalyses an explosive
          oxidation, and fires a{" "}
          <span style={{ color: FLASH, fontWeight: 600 }}>≈ 100 °C</span> jet of
          benzoquinones in{" "}
          <span style={{ color: FLASH, fontWeight: 600 }}>
            hundreds of pulses per second
          </span>
          .
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
        <span>Arndt et al. · Science 348 (2015) 563–565</span>
        <span>
          <span style={{ color: FLASH }}>●</span> Pulse = ejection event
        </span>
      </div>
    </AbsoluteFill>
  );
};
