import React from 'react';
import { AbsoluteFill } from 'remotion';

const W = 2560;
const H = 1440;
const CX = W / 2;

const C = {
  bg: '#09101F',
  wall: '#111929',
  wallMid: '#131D35',
  spot: '#F5E6C8',
  cyan: '#00F5FF',
  mag: '#FF00C8',
  lime: '#AAFF00',
  vio: '#8B00FF',
  gold: '#FFD166',
  goldDk: '#B8860B',
  text: '#EEE8D5',
  blazer: '#070E1A',
  shirt: '#CEC4B0',
  tie: '#7B1A1A',
  eye: '#00FFCC',
  shell: '#00D4CC',
};

// ─── Abstract painting overlays ──────────────────────────────────────────────

const PaintUV: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <ellipse key={i} cx={x + w / 2} cy={y + h / 2}
        rx={w / 2 * (1 - i * 0.13)} ry={h / 2 * (1 - i * 0.13)}
        fill="none"
        stroke={[C.vio, C.cyan, C.mag, '#4400FF', C.lime, '#FF44BB'][i]}
        strokeWidth={4 - i * 0.4} opacity={0.75 - i * 0.06}
      />
    ))}
    {Array.from({ length: 35 }).map((_, i) => (
      <circle key={i}
        cx={x + ((i * 73 + 17) % w)} cy={y + ((i * 97 + 31) % h)}
        r={2 + (i * 13 % 6)}
        fill={[C.cyan, C.mag, C.lime, C.vio, '#FFFFFF'][i % 5]}
        opacity={0.25 + (i % 4) * 0.15}
      />
    ))}
  </g>
);

const PaintRed: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    {Array.from({ length: 16 }).map((_, i) => (
      <rect key={i} x={x + i * (w / 16)} y={y} width={w / 16 + 1} height={h}
        fill={`hsl(${338 + i * 4},${65 + i * 2}%,${18 + i * 3}%)`} opacity="0.95"
      />
    ))}
    {Array.from({ length: 16 }).map((_, i) => (
      <line key={i} x1={x + i * (w / 16)} y1={y} x2={x + i * (w / 16)} y2={y + h}
        stroke="white" strokeWidth={0.5} opacity={0.08}
      />
    ))}
    <rect x={x} y={y + h - 44} width={w / 16} height={30} fill="white" opacity={0.1} />
    <text x={x + w / 32} y={y + h - 24} textAnchor="middle"
      fill="white" fontSize={15} opacity={0.35} fontFamily="monospace">1</text>
  </g>
);

const PaintPolarised: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    {Array.from({ length: 18 }).map((_, i) => (
      <line key={`h${i}`}
        x1={x} y1={y + i * (h / 18)} x2={x + w} y2={y + i * (h / 18) - 70}
        stroke={[C.cyan, C.lime, C.mag, 'white'][i % 4]}
        strokeWidth={2.5} opacity={0.3 + (i % 3) * 0.15}
      />
    ))}
    {Array.from({ length: 14 }).map((_, i) => (
      <line key={`v${i}`}
        x1={x + i * (w / 14)} y1={y} x2={x + i * (w / 14) + 50} y2={y + h}
        stroke={[C.vio, C.cyan, 'white'][i % 3]}
        strokeWidth={2} opacity={0.2 + (i % 4) * 0.1}
      />
    ))}
  </g>
);

// ─── Gold frame + canvas ──────────────────────────────────────────────────────

const Painting: React.FC<{
  x: number; y: number; w: number; h: number;
  gradId: string; title: string; sub: string; variant: 0 | 1 | 2;
}> = ({ x, y, w, h, gradId, title, sub, variant }) => {
  const pad = 22;
  return (
    <g>
      {/* Drop shadow */}
      <rect x={x - pad + 6} y={y - pad + 6} width={w + pad * 2} height={h + pad * 2}
        rx={5} fill="black" opacity={0.5} />
      {/* Outer gold border */}
      <rect x={x - pad} y={y - pad} width={w + pad * 2} height={h + pad * 2}
        rx={4} fill="url(#goldGrad)" />
      {/* Inner dark rabbet */}
      <rect x={x - 5} y={y - 5} width={w + 10} height={h + 10}
        rx={2} fill="black" opacity={0.35} />
      {/* Canvas */}
      <rect x={x} y={y} width={w} height={h} fill={`url(#${gradId})`} />
      {/* Abstract overlay */}
      {variant === 0 && <PaintUV x={x} y={y} w={w} h={h} />}
      {variant === 1 && <PaintRed x={x} y={y} w={w} h={h} />}
      {variant === 2 && <PaintPolarised x={x} y={y} w={w} h={h} />}
      {/* Corner ornaments */}
      {[[-pad, -pad], [w + pad, -pad], [-pad, h + pad], [w + pad, h + pad]].map(([ox, oy], i) => (
        <circle key={i} cx={x + ox} cy={y + oy} r={9} fill={C.gold} opacity={0.85} />
      ))}
      {/* Placard */}
      <rect x={x} y={y + h + 8} width={w} height={58} rx={3} fill="#080E1C" opacity={0.92} />
      <rect x={x} y={y + h + 8} width={w} height={2} fill={C.gold} opacity={0.5} />
      <text x={x + w / 2} y={y + h + 33} textAnchor="middle"
        fill={C.text} fontSize={16} fontFamily="Georgia" fontStyle="italic">{title}</text>
      <text x={x + w / 2} y={y + h + 56} textAnchor="middle"
        fill={C.text} fontSize={12} fontFamily="Georgia" opacity={0.55}>{sub}</text>
    </g>
  );
};

// ─── Tiny human visitor ───────────────────────────────────────────────────────

const Human: React.FC<{
  x: number; y: number; scale?: number; phoneUp?: boolean; mapHeld?: boolean; confused?: boolean;
}> = ({ x, y, scale = 1, phoneUp, mapHeld, confused }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    {/* Head */}
    <ellipse cx={0} cy={-8} rx={22} ry={24} fill="#161E30" />
    {/* Body */}
    <rect x={-19} y={16} width={38} height={82} rx={5} fill="#161E30" />
    {/* Legs */}
    <rect x={-19} y={98} width={16} height={62} rx={4} fill="#111828" />
    <rect x={3} y={98} width={16} height={62} rx={4} fill="#111828" />
    {phoneUp && (
      <>
        <rect x={12} y={10} width={12} height={50} rx={4} fill="#161E30"
          transform="rotate(-50 18 35)" />
        <rect x={-2} y={-42} width={22} height={34} rx={3} fill={C.cyan} opacity={0.55} />
      </>
    )}
    {mapHeld && (
      <>
        <rect x={-40} y={22} width={12} height={50} rx={4} fill="#161E30"
          transform="rotate(25 -34 47)" />
        <rect x={28} y={22} width={12} height={50} rx={4} fill="#161E30"
          transform="rotate(-25 34 47)" />
        <rect x={-50} y={55} width={100} height={66} rx={3} fill={C.text} opacity={0.13} />
        <line x1={-44} y1={72} x2={44} y2={72} stroke="#1A2540" strokeWidth={2} opacity={0.5} />
        <line x1={-44} y1={88} x2={44} y2={88} stroke="#1A2540" strokeWidth={2} opacity={0.5} />
        <line x1={0} y1={55} x2={0} y2={121} stroke="#1A2540" strokeWidth={2} opacity={0.5} />
      </>
    )}
    {confused && (
      <rect x={8} y={5} width={12} height={44} rx={4} fill="#161E30"
        transform="rotate(-65 14 27)" />
    )}
  </g>
);

// ─── Main wallpaper ───────────────────────────────────────────────────────────

export const Wallpaper: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Shell / iridescent gradient */}
        <linearGradient id="shell" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={C.cyan} />
          <stop offset="28%" stopColor="#00B4D8" />
          <stop offset="52%" stopColor={C.mag} />
          <stop offset="76%" stopColor={C.lime} />
          <stop offset="100%" stopColor={C.vio} />
        </linearGradient>

        {/* Per-segment shell gradients */}
        {[C.cyan, '#00C4D4', C.mag, C.lime, '#0099EE', C.vio].map((col, i) => (
          <linearGradient key={i} id={`seg${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={col} stopOpacity="0.85" />
            <stop offset="50%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor={col} stopOpacity="0.75" />
          </linearGradient>
        ))}

        {/* Gold frame */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE575" />
          <stop offset="35%" stopColor={C.gold} />
          <stop offset="65%" stopColor={C.goldDk} />
          <stop offset="100%" stopColor="#FFDF60" />
        </linearGradient>

        {/* Wall gradient */}
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0C1526" />
          <stop offset="100%" stopColor={C.wallMid} />
        </linearGradient>

        {/* Floor marble */}
        <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0D1525" />
          <stop offset="100%" stopColor="#060A14" />
        </linearGradient>

        {/* Spotlight cone */}
        <linearGradient id="spotCone" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.spot} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.spot} stopOpacity="0" />
        </linearGradient>

        {/* Bioluminescent glow around shrimp */}
        <radialGradient id="bioGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor={C.cyan} stopOpacity="0.18" />
          <stop offset="55%" stopColor={C.mag} stopOpacity="0.07" />
          <stop offset="100%" stopColor={C.cyan} stopOpacity="0" />
        </radialGradient>

        {/* Compound eye */}
        <radialGradient id="eyeGrad" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#00FFCC" />
          <stop offset="45%" stopColor="#007766" />
          <stop offset="100%" stopColor="#001810" />
        </radialGradient>

        {/* Paintings */}
        <linearGradient id="pg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={C.vio} />
          <stop offset="30%" stopColor={C.cyan} />
          <stop offset="65%" stopColor={C.mag} />
          <stop offset="100%" stopColor="#FF5500" />
        </linearGradient>
        <linearGradient id="pg2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF0000" />
          <stop offset="30%" stopColor="#CC0055" />
          <stop offset="65%" stopColor={C.mag} />
          <stop offset="100%" stopColor={C.vio} />
        </linearGradient>
        <linearGradient id="pg3" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={C.lime} />
          <stop offset="45%" stopColor={C.cyan} />
          <stop offset="100%" stopColor={C.mag} />
        </linearGradient>

        {/* Vignette */}
        <radialGradient id="vig" cx="50%" cy="50%" r="72%">
          <stop offset="55%" stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.72" />
        </radialGradient>

        {/* Glow filter */}
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="28" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Hexagonal facet pattern for compound eyes */}
        <pattern id="hexPat" x="0" y="0" width="14" height="12.1" patternUnits="userSpaceOnUse">
          <polygon points="7,0 14,3.5 14,8.6 7,12.1 0,8.6 0,3.5"
            fill="none" stroke={C.cyan} strokeWidth="0.6" strokeOpacity="0.45" />
        </pattern>

        {/* Marble floor veins */}
        <pattern id="marble" x="0" y="0" width="600" height="180" patternUnits="userSpaceOnUse">
          <rect width="600" height="180" fill="#080E1C" />
          <path d="M0,90 Q150,70 300,90 T600,90" stroke="#14203A" strokeWidth="2.5" fill="none" opacity="0.6" />
          <path d="M0,140 Q200,115 400,150 T600,130" stroke="#111C30" strokeWidth="1.5" fill="none" opacity="0.4" />
          <path d="M80,0 Q95,90 80,180" stroke="#14203A" strokeWidth="1.5" fill="none" opacity="0.35" />
          <path d="M520,0 Q505,90 520,180" stroke="#111C30" strokeWidth="1.5" fill="none" opacity="0.3" />
        </pattern>
      </defs>

      {/* ═══════════════════ BACKGROUND ═══════════════════ */}
      <rect width={W} height={H} fill={C.bg} />

      {/* ═══════════════════ WALLS ═══════════════════ */}
      {/* Left wall */}
      <rect x={0} y={90} width={820} height={1170} fill="url(#wallGrad)" />
      {/* Right wall */}
      <rect x={1740} y={90} width={820} height={1170} fill="url(#wallGrad)" />
      {/* Centre rear wall (darker for contrast behind shrimp) */}
      <rect x={820} y={90} width={920} height={1090} fill="#09101E" />
      {/* Wainscoting rail */}
      <rect x={0} y={1010} width={W} height={6} fill={C.gold} opacity={0.35} />

      {/* ═══════════════════ CEILING ═══════════════════ */}
      <rect x={0} y={0} width={W} height={90} fill="#080E1C" />
      <rect x={0} y={85} width={W} height={6} fill={C.gold} opacity={0.65} />
      <rect x={0} y={91} width={W} height={3} fill={C.gold} opacity={0.25} />

      {/* Spotlight cones + bioluminescent fixtures */}
      {[280, 860, 1280, 1700, 2280].map((fx, i) => (
        <g key={i}>
          <polygon
            points={`${fx - 130},90 ${fx + 130},90 ${fx + 90},520 ${fx - 90},520`}
            fill="url(#spotCone)" opacity={0.55}
          />
          <ellipse cx={fx} cy={65} rx={44} ry={16} fill="#141E34" />
          <circle cx={fx} cy={62} r={20} fill={C.cyan} opacity={0.75} filter="url(#softGlow)" />
          <circle cx={fx} cy={62} r={11} fill="white" opacity={0.92} />
        </g>
      ))}

      {/* ═══════════════════ FLOOR ═══════════════════ */}
      <rect x={0} y={1260} width={W} height={180} fill="url(#marble)" />
      <rect x={0} y={1258} width={W} height={4} fill={C.gold} opacity={0.45} />
      {/* Floor glow reflection from shrimp */}
      <ellipse cx={CX} cy={1300} rx={320} ry={55} fill={C.cyan} opacity={0.04} filter="url(#softGlow)" />

      {/* ═══════════════════ PAINTINGS ═══════════════════ */}
      <Painting x={90} y={150} w={580} h={700}
        gradId="pg1" variant={0}
        title="Ultraviolet Sonata No. 3"
        sub="mixed pigment on linen, 2026"
      />
      <Painting x={1890} y={150} w={580} h={700}
        gradId="pg2" variant={1}
        title="Sixteen Shades of Red"
        sub="(You Only See One) — acrylic"
      />
      <Painting x={1890} y={930} w={580} h={290}
        gradId="pg3" variant={2}
        title="Still Life with Polarised Light"
        sub="oil, UV paint — 2026"
      />

      {/* ═══════════════════ EXHIBITION PLACARD (left wall lower) ═══════════════════ */}
      <g transform="translate(55, 950)">
        <rect x={0} y={0} width={730} height={290} rx={4} fill="#080E1C" opacity={0.94} />
        <rect x={0} y={0} width={730} height={4} fill={C.gold} opacity={0.8} />
        <rect x={0} y={286} width={730} height={4} fill={C.gold} opacity={0.8} />
        <rect x={0} y={0} width={4} height={290} fill={C.gold} opacity={0.8} />
        <rect x={726} y={0} width={4} height={290} fill={C.gold} opacity={0.8} />
        <text x={365} y={46} textAnchor="middle" fill={C.gold}
          fontSize={14} fontFamily="Georgia" letterSpacing={7} opacity={0.9}>EXHIBITION IV</text>
        <text x={365} y={105} textAnchor="middle" fill={C.text}
          fontSize={30} fontFamily="Georgia" fontStyle="italic">
          "Colours in 16 Dimensions"
        </text>
        <text x={365} y={155} textAnchor="middle" fill={C.text}
          fontSize={17} fontFamily="Georgia" opacity={0.65}>
          A Guided Tour for the Chromatically Limited
        </text>
        <line x1={55} y1={175} x2={675} y2={175} stroke={C.gold} strokeWidth={1} opacity={0.35} />
        <text x={365} y={212} textAnchor="middle" fill={C.text}
          fontSize={15} fontFamily="Georgia" fontStyle="italic" opacity={0.5}>
          — Curated by Dr. O. Stomatopod
        </text>
        <text x={365} y={262} textAnchor="middle" fill={C.gold}
          fontSize={12} fontFamily="monospace" letterSpacing={2} opacity={0.38}>
          SEASON IV  ·  ONGOING  ·  ADMISSION FREE
        </text>
      </g>

      {/* ═══════════════════ HUMAN VISITORS ═══════════════════ */}
      <Human x={390} y={1065} scale={1.15} phoneUp />
      <Human x={2155} y={1090} scale={1.1} mapHeld />
      <Human x={960} y={1120} scale={0.9} confused />

      {/* ═══════════════════ MANTIS SHRIMP CURATOR ═══════════════════ */}

      {/* Bioluminescent aura */}
      <ellipse cx={CX} cy={720} rx={380} ry={580} fill="url(#bioGlow)" />

      {/* Antennae */}
      <path d={`M${CX - 65},315 Q${CX - 210},205 ${CX - 370},82`}
        stroke={C.cyan} strokeWidth={5} fill="none" opacity={0.65} strokeLinecap="round" />
      <path d={`M${CX + 65},315 Q${CX + 210},205 ${CX + 370},82`}
        stroke={C.cyan} strokeWidth={5} fill="none" opacity={0.65} strokeLinecap="round" />
      <circle cx={CX - 370} cy={82} r={9} fill={C.cyan} opacity={0.85} filter="url(#glow)" />
      <circle cx={CX + 370} cy={82} r={9} fill={C.cyan} opacity={0.85} filter="url(#glow)" />

      {/* ── Tail fan (telson + uropods) ── */}
      {/* Central telson */}
      <path d={`M${CX - 85},1245 L${CX + 85},1245 L${CX + 105},1262 L${CX},1305 L${CX - 105},1262 Z`}
        fill="url(#shell)" opacity={0.9} />
      {/* Left uropods */}
      <path d={`M${CX - 82},1240 Q${CX - 170},1258 ${CX - 215},1295 L${CX - 125},1252 Z`}
        fill={C.cyan} opacity={0.72} />
      <path d={`M${CX - 92},1232 Q${CX - 235},1238 ${CX - 280},1268 L${CX - 135},1244 Z`}
        fill={C.mag} opacity={0.58} />
      {/* Right uropods */}
      <path d={`M${CX + 82},1240 Q${CX + 170},1258 ${CX + 215},1295 L${CX + 125},1252 Z`}
        fill={C.cyan} opacity={0.72} />
      <path d={`M${CX + 92},1232 Q${CX + 235},1238 ${CX + 280},1268 L${CX + 135},1244 Z`}
        fill={C.mag} opacity={0.58} />

      {/* ── Segmented abdomen (6 pleon segments, bottom up) ── */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const segW = 168 - i * 12;
        const segH = 58;
        const segY = 1242 - (i + 1) * (segH + 3);
        return (
          <g key={i}>
            <rect x={CX - segW / 2} y={segY} width={segW} height={segH}
              rx={10} fill={`url(#seg${i})`} />
            {/* Highlight stripe */}
            <rect x={CX - segW / 2 + 12} y={segY + 6} width={segW - 24} height={10}
              rx={5} fill="white" opacity={0.13} />
            {/* Pleopod stubs */}
            <rect x={CX - segW / 2 - 22} y={segY + 22} width={22} height={9}
              rx={4} fill={[C.cyan, '#00C4D4', C.mag, C.lime, '#0099EE', C.vio][i]} opacity={0.6} />
            <rect x={CX + segW / 2} y={segY + 22} width={22} height={9}
              rx={4} fill={[C.cyan, '#00C4D4', C.mag, C.lime, '#0099EE', C.vio][i]} opacity={0.6} />
          </g>
        );
      })}

      {/* ── Cephalothorax body ── */}
      <path d={`
        M${CX - 165},940
        Q${CX - 175},810 ${CX - 155},730
        Q${CX - 125},665 ${CX},652
        Q${CX + 125},665 ${CX + 155},730
        Q${CX + 175},810 ${CX + 165},940
        L${CX + 165},1010
        Q${CX + 145},1022 ${CX},1022
        Q${CX - 145},1022 ${CX - 165},1010
        Z
      `} fill={C.blazer} />

      {/* ── Blazer lapels ── */}
      <path d={`M${CX - 32},695 L${CX - 128},762 L${CX - 148},940 L${CX - 52},940 Z`}
        fill="#0B1222" opacity={0.96} />
      <path d={`M${CX + 32},695 L${CX + 128},762 L${CX + 148},940 L${CX + 52},940 Z`}
        fill="#0B1222" opacity={0.96} />

      {/* ── White shirt front ── */}
      <path d={`M${CX - 32},695 L${CX + 32},695 L${CX + 52},940 L${CX - 52},940 Z`}
        fill={C.shirt} opacity={0.88} />
      {/* Shirt buttons */}
      {[758, 812, 866, 920].map((by, i) => (
        <circle key={i} cx={CX} cy={by} r={5} fill="#B0A490" opacity={0.8} />
      ))}

      {/* ── Bow tie ── */}
      <path d={`M${CX - 36},700 L${CX},714 L${CX - 36},728 Z`} fill={C.tie} />
      <path d={`M${CX + 36},700 L${CX},714 L${CX + 36},728 Z`} fill={C.tie} />
      <circle cx={CX} cy={714} r={9} fill="#5C1010" />

      {/* ── Pocket square (cyan hint of personality) ── */}
      <path d={`M${CX - 142},772 Q${CX - 122},758 ${CX - 100},772 L${CX - 100},800 L${CX - 142},800 Z`}
        fill={C.cyan} opacity={0.32} />
      <path d={`M${CX - 142},772 Q${CX - 122},756 ${CX - 100},772`}
        fill={C.cyan} opacity={0.85} strokeWidth={0} />

      {/* ── Head / rostral plate ── */}
      <path d={`
        M${CX - 145},652
        Q${CX - 168},580 ${CX - 125},518
        Q${CX - 84},458 ${CX},446
        Q${CX + 84},458 ${CX + 125},518
        Q${CX + 168},580 ${CX + 145},652
        Z
      `} fill="url(#shell)" opacity={0.9} />

      {/* ── Rostral plate crest ── */}
      <path d={`
        M${CX - 62},462 Q${CX},430 ${CX + 62},462
        L${CX + 42},395 Q${CX},372 ${CX - 42},395 Z
      `} fill={C.cyan} opacity={0.8} filter="url(#glow)" />

      {/* ── Eye stalks ── */}
      <path d={`M${CX - 84},504 Q${CX - 158},472 ${CX - 212},418`}
        stroke="#5ADDD0" strokeWidth={24} fill="none" strokeLinecap="round" />
      <path d={`M${CX + 84},504 Q${CX + 158},472 ${CX + 212},418`}
        stroke="#5ADDD0" strokeWidth={24} fill="none" strokeLinecap="round" />

      {/* ── Compound eyes ── */}
      {/* Left */}
      <circle cx={CX - 222} cy={398} r={68} fill="url(#eyeGrad)" filter="url(#glow)" />
      <circle cx={CX - 222} cy={398} r={68} fill="url(#hexPat)" opacity={0.42} />
      <circle cx={CX - 222} cy={398} r={68} fill="none" stroke={C.cyan} strokeWidth={3} opacity={0.55} />
      <ellipse cx={CX - 222} cy={398} rx={26} ry={37} fill="#001810" opacity={0.82} />
      <circle cx={CX - 212} cy={387} r={9} fill="white" opacity={0.6} />
      {/* Right */}
      <circle cx={CX + 222} cy={398} r={68} fill="url(#eyeGrad)" filter="url(#glow)" />
      <circle cx={CX + 222} cy={398} r={68} fill="url(#hexPat)" opacity={0.42} />
      <circle cx={CX + 222} cy={398} r={68} fill="none" stroke={C.cyan} strokeWidth={3} opacity={0.55} />
      <ellipse cx={CX + 222} cy={398} rx={26} ry={37} fill="#001810" opacity={0.82} />
      <circle cx={CX + 212} cy={387} r={9} fill="white" opacity={0.6} />

      {/* ── Glasses ── */}
      <circle cx={CX - 222} cy={398} r={76} fill="none" stroke={C.gold} strokeWidth={4.5} />
      <circle cx={CX + 222} cy={398} r={76} fill="none" stroke={C.gold} strokeWidth={4.5} />
      {/* Bridge */}
      <path d={`M${CX - 146},395 Q${CX},375 ${CX + 146},395`}
        fill="none" stroke={C.gold} strokeWidth={3.5} />
      {/* Temples */}
      <path d={`M${CX - 298},398 Q${CX - 350},422 ${CX - 368},458`}
        fill="none" stroke={C.gold} strokeWidth={3} />
      <path d={`M${CX + 298},398 Q${CX + 350},422 ${CX + 368},458`}
        fill="none" stroke={C.gold} strokeWidth={3} />

      {/* ── Left raptorial claw — gesturing at the painting ── */}
      <path d={`M${CX - 158},762 Q${CX - 265},692 ${CX - 430},628 Q${CX - 510},598 ${CX - 580},608`}
        stroke="#44CCBA" strokeWidth={55} fill="none" strokeLinecap="round" />
      {/* Claw tip (pointing finger) */}
      <path d={`M${CX - 558},596 L${CX - 618},574 L${CX - 588},616 Z`}
        fill={C.cyan} opacity={0.9} filter="url(#glow)" />

      {/* ── Right raptorial claw — holding clipboard ── */}
      <path d={`M${CX + 158},762 Q${CX + 268},794 ${CX + 388},838 Q${CX + 455},862 ${CX + 488},912`}
        stroke="#44CCBA" strokeWidth={55} fill="none" strokeLinecap="round" />

      {/* ── Clipboard ── */}
      <g transform={`rotate(-18, ${CX + 530}, 980)`}>
        <rect x={CX + 488} y={888} width={170} height={220} rx={7} fill="#CEC4B0" />
        <rect x={CX + 488} y={888} width={170} height={16} rx={6} fill="#8B7050" />
        {/* Clip */}
        <rect x={CX + 552} y={878} width={42} height={22} rx={5} fill="#666" />
        {/* Ruled lines */}
        {[925, 945, 965, 985, 1005, 1025, 1045, 1065].map((ly) => (
          <line key={ly} x1={CX + 502} y1={ly} x2={CX + 644} y2={ly}
            stroke="#8B7050" strokeWidth={1.5} opacity={0.4} />
        ))}
        {/* Colour swatches */}
        {[C.cyan, C.mag, C.lime, C.vio].map((col, i) => (
          <rect key={i} x={CX + 500 + i * 37} y={980} width={30} height={22}
            rx={3} fill={col} opacity={0.75} />
        ))}
        <text x={CX + 573} y={1056} textAnchor="middle"
          fontSize={13} fontFamily="monospace" fill="#3A2810" opacity={0.75}>DOCENT</text>
        <text x={CX + 573} y={1075} textAnchor="middle"
          fontSize={10} fontFamily="monospace" fill="#3A2810" opacity={0.55}>NOTES IV</text>
      </g>

      {/* ═══════════════════ MUSEUM MAP (bottom right) ═══════════════════ */}
      <g transform="translate(1940, 1292)">
        <rect x={0} y={0} width={590} height={140} rx={5} fill="#070D1A" opacity={0.92} />
        <rect x={0} y={0} width={590} height={2} fill={C.gold} opacity={0.5} />
        <text x={295} y={24} textAnchor="middle" fill={C.gold}
          fontSize={13} fontFamily="Georgia" letterSpacing={4} opacity={0.85}>FLOOR PLAN</text>
        <line x1={18} y1={32} x2={572} y2={32} stroke={C.gold} strokeWidth={0.5} opacity={0.35} />
        {['UV\nGallery', 'Infrared\nSuite', 'Polarised\nHall', 'Mantis\nCollection'].map((label, i) => (
          <g key={i} transform={`translate(${18 + i * 136}, 38)`}>
            <rect x={0} y={0} width={122} height={56} rx={3}
              fill="#111C33" stroke={C.gold} strokeWidth={0.5} strokeOpacity={0.4} />
            {label.split('\n').map((line, j) => (
              <text key={j} x={61} y={24 + j * 20} textAnchor="middle"
                fill={C.text} fontSize={11} fontFamily="Georgia" opacity={0.8}>{line}</text>
            ))}
          </g>
        ))}
        <text x={295} y={130} textAnchor="middle" fill={C.text}
          fontSize={11} fontFamily="monospace" opacity={0.42}>
          Gift Shop — Postcards in 3 Colours (Sorry)
        </text>
      </g>

      {/* ═══════════════════ TAGLINE ═══════════════════ */}
      <text x={CX} y={1408} textAnchor="middle"
        fill={C.text} fontSize={25} fontFamily="Georgia" fontStyle="italic" opacity={0.52}>
        "The gallery has 16 colours. This poster has three. We did our best."
      </text>

      {/* ═══════════════════ ART NOUVEAU CORNER FLOURISHES ═══════════════════ */}
      {/* Top-left */}
      <g opacity={0.45}>
        <path d="M0,0 Q70,45 90,90" stroke={C.gold} strokeWidth={2.5} fill="none" />
        <path d="M0,0 Q45,70 90,90" stroke={C.gold} strokeWidth={1.5} fill="none" opacity={0.5} />
        <circle cx={90} cy={90} r={7} fill={C.gold} />
        <path d="M12,0 Q35,25 22,58 Q12,80 34,90" stroke={C.gold} strokeWidth={1.5} fill="none" opacity={0.6} />
      </g>
      {/* Top-right */}
      <g opacity={0.45} transform={`translate(${W},0) scale(-1,1)`}>
        <path d="M0,0 Q70,45 90,90" stroke={C.gold} strokeWidth={2.5} fill="none" />
        <path d="M0,0 Q45,70 90,90" stroke={C.gold} strokeWidth={1.5} fill="none" opacity={0.5} />
        <circle cx={90} cy={90} r={7} fill={C.gold} />
        <path d="M12,0 Q35,25 22,58 Q12,80 34,90" stroke={C.gold} strokeWidth={1.5} fill="none" opacity={0.6} />
      </g>
      {/* Bottom-left */}
      <g opacity={0.35} transform={`translate(0,${H}) scale(1,-1)`}>
        <path d="M0,0 Q70,45 90,90" stroke={C.gold} strokeWidth={2} fill="none" />
        <circle cx={90} cy={90} r={6} fill={C.gold} />
      </g>
      {/* Bottom-right */}
      <g opacity={0.35} transform={`translate(${W},${H}) scale(-1,-1)`}>
        <path d="M0,0 Q70,45 90,90" stroke={C.gold} strokeWidth={2} fill="none" />
        <circle cx={90} cy={90} r={6} fill={C.gold} />
      </g>

      {/* ═══════════════════ VIGNETTE ═══════════════════ */}
      <rect width={W} height={H} fill="url(#vig)" />
    </svg>
  </AbsoluteFill>
);
