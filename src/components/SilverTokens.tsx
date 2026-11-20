import { useId } from 'react';
import type { TokenId } from '../game/types';

interface SilverTokenProps {
  token: TokenId;
  size?: number;
  className?: string;
  accentRingColor?: string;
  active?: boolean;
}

/**
 * Bespoke cast-pewter / sterling-silver SVG tokens for all 8 classic Monopoly pieces.
 * Crafted with multi-stop metallic silver gradients, rim highlights, and dark pewter outlines
 * so they remain razor-sharp even when the Action Cam zooms to 2.2x.
 */
export function SilverTokenIcon({
  token,
  size = 40,
  className = '',
  accentRingColor,
  active = false,
}: SilverTokenProps) {
  const uid = useId().replace(/:/g, '');
  const metalId = `silver-metal-${uid}`;
  const darkMetalId = `silver-dark-${uid}`;
  const shineId = `silver-shine-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={metalId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="22%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="76%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={darkMetalId} x1="12" y1="10" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="50%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Tabletop cast shadow */}
      <ellipse cx="33" cy="56" rx="20" ry="5" fill="#000000" fillOpacity="0.38" />

      {/* Optional player color base rim under silver piece on board */}
      {accentRingColor && (
        <ellipse
          cx="32"
          cy="54"
          rx={active ? 22 : 19}
          ry={active ? 6.5 : 5.5}
          fill={accentRingColor}
          fillOpacity={active ? 0.92 : 0.72}
          stroke="#1E293B"
          strokeWidth="1.5"
        />
      )}

      {token === 'tophat' && (
        <g stroke="#1E293B" strokeWidth="2.2" strokeLinejoin="round">
          {/* Brim */}
          <ellipse cx="32" cy="48" rx="23" ry="6.5" fill={`url(#${darkMetalId})`} />
          <ellipse cx="32" cy="46.5" rx="22" ry="5.2" fill={`url(#${metalId})`} />
          {/* Crown */}
          <path
            d="M17 45 L20 14 C20 11 44 11 44 14 L47 45 C47 48 17 48 17 45 Z"
            fill={`url(#${metalId})`}
          />
          {/* Ribbon Band */}
          <path d="M17.8 38 C24 41 40 41 46.2 38 L46.8 43.5 C40 46.5 24 46.5 17.2 43.5 Z" fill={`url(#${darkMetalId})`} />
          {/* Top Rim */}
          <ellipse cx="32" cy="14" rx="12" ry="3.2" fill="#F8FAFC" />
          {/* Specular streak */}
          <path d="M23 18 L21.5 36" stroke={`url(#${shineId})`} strokeWidth="2.8" strokeLinecap="round" />
        </g>
      )}

      {token === 'dog' && (
        <g stroke="#1E293B" strokeWidth="2.1" strokeLinejoin="round">
          {/* Legs */}
          <rect x="17" y="42" width="7" height="11" rx="2" fill={`url(#${darkMetalId})`} />
          <rect x="37" y="42" width="7" height="11" rx="2" fill={`url(#${darkMetalId})`} />
          {/* Tail */}
          <path d="M16 32 L10 21 L17 24 Z" fill={`url(#${metalId})`} />
          {/* Body */}
          <path
            d="M15 31 C15 26 22 25 36 26 L44 25 L46 44 C36 46 22 46 15 43 Z"
            fill={`url(#${metalId})`}
          />
          {/* Head & Scottie Beard */}
          <path
            d="M36 27 L38 14 L43 19 L48 13 L50 22 L58 25 L56 32 L46 34 L43 31 Z"
            fill={`url(#${metalId})`}
          />
          {/* Collar & Eye */}
          <path d="M36 28 L45 27" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <circle cx="48" cy="23.5" r="1.5" fill="#0F172A" stroke="none" />
          {/* Highlight */}
          <path d="M22 30 L34 30" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </g>
      )}

      {token === 'car' && (
        <g stroke="#1E293B" strokeWidth="2.1" strokeLinejoin="round">
          {/* Vintage 1930s Grand Prix Roadster */}
          <path
            d="M7 40 L12 31 L24 30 L33 23 L45 24 L56 32 L58 41 L54 45 L10 45 Z"
            fill={`url(#${metalId})`}
          />
          {/* Cockpit & Exhaust */}
          <path d="M26 30 L33 24 L42 24 L40 31 Z" fill={`url(#${darkMetalId})`} />
          <path d="M14 39 L48 39" stroke="#475569" strokeWidth="2" />
          {/* Grille & Nose Shine */}
          <path d="M46 28 L54 33" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
          {/* Wheels */}
          <circle cx="18" cy="45" r="7.5" fill={`url(#${darkMetalId})`} />
          <circle cx="18" cy="45" r="3.2" fill="#F8FAFC" />
          <circle cx="47" cy="45" r="7.5" fill={`url(#${darkMetalId})`} />
          <circle cx="47" cy="45" r="3.2" fill="#F8FAFC" />
        </g>
      )}

      {token === 'battleship' && (
        <g stroke="#1E293B" strokeWidth="2" strokeLinejoin="round">
          {/* Superstructure & Funnels */}
          <rect x="24" y="18" width="5" height="12" fill={`url(#${darkMetalId})`} />
          <rect x="33" y="15" width="6" height="15" fill={`url(#${metalId})`} />
          <path d="M20 26 L44 26 L46 34 L18 34 Z" fill={`url(#${metalId})`} />
          {/* Turrets & Cannons */}
          <path d="M13 33 L19 33 L19 37 L13 37 Z" fill={`url(#${darkMetalId})`} />
          <path d="M6 34 L14 34" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M46 33 L52 33 L52 37 L46 37 Z" fill={`url(#${darkMetalId})`} />
          <path d="M51 34 L59 32" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" />
          {/* Hull */}
          <path d="M5 37 L59 37 L54 48 L11 48 Z" fill={`url(#${metalId})`} />
          {/* Portholes */}
          <circle cx="20" cy="42" r="1.4" fill="#1E293B" stroke="none" />
          <circle cx="28" cy="42" r="1.4" fill="#1E293B" stroke="none" />
          <circle cx="36" cy="42" r="1.4" fill="#1E293B" stroke="none" />
          <circle cx="44" cy="42" r="1.4" fill="#1E293B" stroke="none" />
        </g>
      )}

      {token === 'thimble' && (
        <g stroke="#1E293B" strokeWidth="2.1" strokeLinejoin="round">
          {/* Body */}
          <path
            d="M17 48 L21 18 C22 12 42 12 43 18 L47 48 Z"
            fill={`url(#${metalId})`}
          />
          {/* Bottom Rim */}
          <rect x="14" y="46" width="36" height="6" rx="2.5" fill={`url(#${darkMetalId})`} />
          {/* Dimple Grid */}
          {[22, 28, 34, 40].map((y) =>
            [25, 32, 39].map((x) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="#475569" stroke="none" />
            ))
          )}
          {/* Specular Rim */}
          <path d="M23 18 L20 43" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        </g>
      )}

      {token === 'boot' && (
        <g stroke="#1E293B" strokeWidth="2.1" strokeLinejoin="round">
          {/* Ankle & Toe */}
          <path
            d="M18 14 L36 14 L35 33 L49 36 C54 37 56 41 55 46 L16 46 L16 39 L18 14 Z"
            fill={`url(#${metalId})`}
          />
          {/* Sole & Heel */}
          <path d="M15 46 L55 46 L54 51 L33 51 L31 49 L25 49 L25 51 L15 51 Z" fill={`url(#${darkMetalId})`} />
          {/* Laces */}
          <path d="M35 20 L39 20 M35 25 L39 25 M35 30 L40 30" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          {/* Toe Cap & Shine */}
          <path d="M44 36 C44 41 44 46 44 46" stroke="#475569" strokeWidth="1.6" />
          <path d="M22 18 L21 38" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
        </g>
      )}

      {token === 'wheelbarrow' && (
        <g stroke="#1E293B" strokeWidth="2.1" strokeLinejoin="round">
          {/* Handle & Frame */}
          <path d="M7 25 L22 33 L48 42" stroke="#334155" strokeWidth="3.2" strokeLinecap="round" />
          {/* Stand Leg */}
          <path d="M22 34 L19 50 L25 50" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          {/* Tray */}
          <path d="M18 22 L52 24 L46 39 L23 36 Z" fill={`url(#${metalId})`} />
          <path d="M21 25 L48 27" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          {/* Front Wheel */}
          <circle cx="50" cy="44" r="7.5" fill={`url(#${darkMetalId})`} />
          <circle cx="50" cy="44" r="3" fill="#F8FAFC" />
        </g>
      )}

      {token === 'iron' && (
        <g stroke="#1E293B" strokeWidth="2.1" strokeLinejoin="round">
          {/* Handle Arch */}
          <path
            d="M17 34 L19 20 C20 16 42 16 44 21 L47 34"
            fill="none"
            stroke={`url(#${darkMetalId})`}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M17 34 L19 20 C20 16 42 16 44 21 L47 34"
            fill="none"
            stroke="#1E293B"
            strokeWidth="1.8"
          />
          {/* Heavy Metal Body */}
          <path d="M12 34 L48 34 L57 44 L11 44 Z" fill={`url(#${metalId})`} />
          {/* Soleplate */}
          <path d="M10 44 L58 44 L55 50 L10 50 Z" fill={`url(#${darkMetalId})`} />
          {/* Specular shine */}
          <path d="M16 38 L46 38" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
        </g>
      )}
    </svg>
  );
}
