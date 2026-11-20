import { useId } from 'react';
import type { Orientation, ShipTypeId } from '../battleship/types';

interface ShipArtProps {
  shipId: ShipTypeId;
  length: number;
  orientation?: Orientation;
  sunk?: boolean;
  sinkingNow?: boolean;
  ghost?: 'valid' | 'invalid' | null;
  className?: string;
}

/**
 * Heirloom top-down 2D Naval Warship SVG art for all 5 classic Battleship vessels.
 * Styled like cast-pewter & teak tabletop miniatures with brass fittings,
 * scorched hull breach detailing when sunk, and listing/submerging sink animation.
 */
export function NavalShipSvg({
  shipId,
  length,
  orientation = 'H',
  sunk = false,
  sinkingNow = false,
  ghost = null,
  className = '',
}: ShipArtProps) {
  const uid = useId().replace(/:/g, '');
  const hullGrad = `hull-${uid}`;
  const deckGrad = `deck-${uid}`;

  const W = length * 100;
  const H = 100;

  const hullColors =
    ghost === 'valid'
      ? ['#6EE7B7', '#10B981', '#065F46']
      : ghost === 'invalid'
        ? ['#FCA5A5', '#DC2626', '#7F1D1D']
        : sunk
          ? ['#6E5B52', '#43352E', '#261D19']
          : ['#C9C2B5', '#7B746A', '#443E37'];

  const deckColors =
    ghost === 'valid'
      ? ['#A7F3D0', '#059669']
      : ghost === 'invalid'
        ? ['#FECACA', '#991B1B']
        : sunk
          ? ['#573A2E', '#301F18']
          : ['#A67C52', '#704E2E'];

  const brassColor = sunk ? '#A37A42' : '#D4AF37';
  const turretColor = sunk ? '#6E635C' : '#DED7C8';
  const isVert = orientation === 'V';

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center pointer-events-none select-none ${
        sinkingNow
          ? 'animate-ship-sink'
          : sunk
            ? 'opacity-80 scale-[0.9] -rotate-[2.5deg] translate-y-[3px] saturate-75'
            : ''
      } ${className}`}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full overflow-visible"
        style={
          isVert
            ? {
                width: `${length * 100}%`,
                height: `${100 / length}%`,
                transform: 'rotate(90deg)',
                transformOrigin: 'center center',
              }
            : undefined
        }
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={hullGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hullColors[0]} />
            <stop offset="52%" stopColor={hullColors[1]} />
            <stop offset="100%" stopColor={hullColors[2]} />
          </linearGradient>
          <linearGradient id={deckGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={deckColors[0]} />
            <stop offset="100%" stopColor={deckColors[1]} />
          </linearGradient>
        </defs>

        {/* Deep water keel shadow & frothy wake */}
        <ellipse
          cx={W / 2}
          cy={55}
          rx={W * 0.48}
          ry={35}
          fill="#030D14"
          fillOpacity={ghost ? 0.25 : sunk ? 0.62 : 0.52}
        />

        {/* 1. AIRCRAFT CARRIER (length 5 -> 500x100) */}
        {shipId === 'carrier' && (
          <g stroke="#1C1917" strokeWidth="3.5" strokeLinejoin="round">
            <path
              d="M 22 22 L 456 14 L 488 30 L 488 70 L 456 86 L 26 82 L 12 68 L 12 34 Z"
              fill={`url(#${hullGrad})`}
            />
            {/* Planked Flight Deck */}
            <path
              d="M 30 28 L 450 22 L 474 34 L 474 66 L 450 78 L 32 74 Z"
              fill={sunk ? '#231D1A' : '#3C3630'}
              stroke="#1C1917"
              strokeWidth="2"
            />
            <line
              x1="44"
              y1="52"
              x2="454"
              y2="46"
              stroke="#F5EFE6"
              strokeWidth="3"
              strokeDasharray="18 14"
              opacity={ghost ? 0.5 : sunk ? 0.35 : 0.8}
            />
            <line
              x1="72"
              y1="67"
              x2="265"
              y2="34"
              stroke={brassColor}
              strokeWidth="2.5"
              strokeDasharray="10 10"
              opacity={ghost ? 0.45 : sunk ? 0.35 : 0.85}
            />
            <line x1="320" y1="36" x2="452" y2="34" stroke="#D6CFC2" strokeWidth="2" opacity="0.55" />
            <line x1="330" y1="62" x2="452" y2="62" stroke="#D6CFC2" strokeWidth="2" opacity="0.55" />
            {/* Starboard Brass-Trimmed Island */}
            <rect x="275" y="62" width="76" height="22" rx="4" fill={`url(#${hullGrad})`} />
            <rect x="292" y="66" width="38" height="12" rx="2" fill="#231D1A" />
            <circle cx="338" cy="73" r="4" fill={brassColor} stroke="#1C1917" strokeWidth="1.5" />
            {/* Vintage Naval Deck Planes */}
            <polygon points="105,36 125,40 112,46 116,52 104,46 95,48" fill="#E7DFD1" stroke="none" opacity={sunk ? 0.35 : 0.85} />
            <polygon points="155,34 175,38 162,44 166,50 154,44 145,46" fill="#E7DFD1" stroke="none" opacity={sunk ? 0.35 : 0.85} />
          </g>
        )}

        {/* 2. BATTLESHIP (length 4 -> 400x100) */}
        {shipId === 'battleship' && (
          <g stroke="#1C1917" strokeWidth="3.5" strokeLinejoin="round">
            <path
              d="M 18 32 C 55 15, 290 14, 386 50 C 290 86, 55 85, 18 68 C 10 56, 10 44, 18 32 Z"
              fill={`url(#${hullGrad})`}
            />
            {/* Warm Teak Wood Planked Deck */}
            <path
              d="M 32 36 C 74 24, 278 24, 358 50 C 278 76, 74 76, 32 64 Z"
              fill={`url(#${deckGrad})`}
              strokeWidth="2"
            />
            {/* Armored Citadel & Smokestack */}
            <rect x="138" y="30" width="114" height="40" rx="8" fill={`url(#${hullGrad})`} />
            <rect x="164" y="37" width="34" height="26" rx="4" fill="#231D1A" />
            <circle cx="222" cy="50" r="10" fill="#443E37" stroke={brassColor} strokeWidth="2" />
            <circle cx="222" cy="50" r="4" fill="#1C1917" stroke="none" />
            {/* Fore 16-inch Triple Turret */}
            <rect x="274" y="36" width="34" height="28" rx="6" fill={turretColor} />
            <line x1="308" y1="43" x2="342" y2="43" stroke="#1C1917" strokeWidth="4" strokeLinecap="round" />
            <line x1="308" y1="50" x2="346" y2="50" stroke="#1C1917" strokeWidth="4" strokeLinecap="round" />
            <line x1="308" y1="57" x2="342" y2="57" stroke="#1C1917" strokeWidth="4" strokeLinecap="round" />
            {/* Aft Heavy Triple Turret */}
            <rect x="82" y="36" width="34" height="28" rx="6" fill={turretColor} />
            <line x1="82" y1="43" x2="48" y2="43" stroke="#1C1917" strokeWidth="4" strokeLinecap="round" />
            <line x1="82" y1="50" x2="44" y2="50" stroke="#1C1917" strokeWidth="4" strokeLinecap="round" />
            <line x1="82" y1="57" x2="48" y2="57" stroke="#1C1917" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {/* 3. CRUISER (length 3 -> 300x100) */}
        {shipId === 'cruiser' && (
          <g stroke="#1C1917" strokeWidth="3.5" strokeLinejoin="round">
            <path
              d="M 16 34 C 52 18, 224 18, 288 50 C 224 82, 52 82, 16 66 Z"
              fill={`url(#${hullGrad})`}
            />
            <path
              d="M 32 39 C 64 28, 214 28, 266 50 C 214 72, 64 72, 32 61 Z"
              fill={`url(#${deckGrad})`}
              strokeWidth="2"
            />
            <rect x="108" y="32" width="84" height="36" rx="6" fill={`url(#${hullGrad})`} />
            <rect x="128" y="39" width="24" height="22" rx="3" fill="#231D1A" />
            <circle cx="172" cy="50" r="7" fill={brassColor} />
            {/* Fore Twin Turret */}
            <rect x="208" y="39" width="24" height="22" rx="5" fill={turretColor} />
            <line x1="232" y1="46" x2="258" y2="46" stroke="#1C1917" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="232" y1="54" x2="258" y2="54" stroke="#1C1917" strokeWidth="3.5" strokeLinecap="round" />
            {/* Aft Brass Quarterdeck Ring */}
            <circle cx="62" cy="50" r="14" fill="none" stroke="#F5EFE6" strokeWidth="2" opacity={sunk ? 0.35 : 0.72} />
            <circle cx="62" cy="50" r="4" fill={brassColor} stroke="none" />
          </g>
        )}

        {/* 4. SUBMARINE (length 3 -> 300x100) */}
        {shipId === 'submarine' && (
          <g stroke="#1C1917" strokeWidth="3.5" strokeLinejoin="round">
            <polygon points="22,22 44,36 44,64 22,78 14,72 14,28" fill="#524B44" />
            <polygon points="220,24 238,34 238,66 220,76" fill="#524B44" />
            <path
              d="M 24 44 C 52 24, 215 20, 272 34 C 292 40, 292 60, 272 66 C 215 80, 52 76, 24 56 Z"
              fill={sunk ? '#2A2320' : ghost ? `url(#${hullGrad})` : '#5A534A'}
            />
            <line x1="48" y1="42" x2="258" y2="42" stroke="#E7DFD1" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
            <rect x="136" y="36" width="54" height="28" rx="14" fill={`url(#${hullGrad})`} />
            <circle cx="156" cy="50" r="5" fill="#231D1A" />
            <circle cx="174" cy="50" r="3.5" fill={brassColor} />
            <circle cx="96" cy="50" r="6" fill="#3C3630" stroke="#1C1917" strokeWidth="2" />
            <circle cx="116" cy="50" r="6" fill="#3C3630" stroke="#1C1917" strokeWidth="2" />
          </g>
        )}

        {/* 5. DESTROYER (length 2 -> 200x100) */}
        {shipId === 'destroyer' && (
          <g stroke="#1C1917" strokeWidth="3.5" strokeLinejoin="round">
            <path
              d="M 16 36 C 46 20, 144 20, 188 50 C 144 80, 46 80, 16 64 Z"
              fill={`url(#${hullGrad})`}
            />
            <path
              d="M 28 40 C 56 29, 136 29, 168 50 C 136 71, 56 71, 28 60 Z"
              fill={`url(#${deckGrad})`}
              strokeWidth="2"
            />
            <rect x="66" y="34" width="52" height="32" rx="6" fill={`url(#${hullGrad})`} />
            <rect x="78" y="40" width="18" height="20" rx="3" fill="#231D1A" />
            <circle cx="136" cy="50" r="10" fill={turretColor} />
            <line x1="146" y1="50" x2="168" y2="50" stroke="#1C1917" strokeWidth="4" strokeLinecap="round" />
            <circle cx="42" cy="50" r="8" fill="none" stroke={brassColor} strokeWidth="2" opacity="0.7" />
          </g>
        )}

        {/* Hull breach fractures when destroyed / sunk */}
        {sunk && !ghost && (
          <g stroke="#0C0A09" strokeWidth="4" strokeLinecap="round" opacity="0.9">
            <path d={`M ${W * 0.36} 24 L ${W * 0.41} 50 L ${W * 0.35} 78`} fill="none" />
            <path d={`M ${W * 0.64} 26 L ${W * 0.6} 52 L ${W * 0.66} 76`} fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
}
