import { useEffect, useRef, useState } from 'react';
import type { HostMood, NostalgiaMediaRef, NostalgiaVideoRef } from '../jeopardy/types';

interface JeopardyHostStageProps {
  mood: HostMood;
  hostLine: string;
  roundLabel: string;
  buzzerLightsOn: boolean;
}

/**
 * Animated 2D 1990s Television Game Show Host ("Artie Vance") at his brass studio podium.
 * Features blinking eyes, lip-synced animated speech, mood-driven eyebrows & expressions,
 * cue-card gesturing hand, and 90s studio spotlight backdrop.
 */
export function JeopardyHostStage({
  mood,
  hostLine,
  roundLabel,
  buzzerLightsOn,
}: JeopardyHostStageProps) {
  const [blink, setBlink] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);

  const isTalking =
    mood === 'reading' || mood === 'excited' || mood === 'daily_double' || mood === 'correct';

  // Natural blinking cadence
  useEffect(() => {
    let blinkTimeout: number | null = null;
    const interval = window.setInterval(() => {
      setBlink(true);
      blinkTimeout = window.setTimeout(() => setBlink(false), 140);
    }, 3400);
    return () => {
      window.clearInterval(interval);
      if (blinkTimeout !== null) window.clearTimeout(blinkTimeout);
    };
  }, []);

  // Crisp lip-sync cadence while speaking
  useEffect(() => {
    if (!isTalking) {
      setMouthFrame(0);
      return;
    }
    const interval = window.setInterval(() => {
      setMouthFrame((f) => (f + 1) % 4);
    }, 155);
    return () => window.clearInterval(interval);
  }, [isTalking]);

  const eyebrowLeftY =
    mood === 'excited' || mood === 'daily_double'
      ? 61
      : mood === 'wrong'
        ? 66
        : mood === 'thinking'
          ? 62
          : 64;
  const eyebrowRightY =
    mood === 'thinking'
      ? 66
      : mood === 'excited' || mood === 'daily_double'
        ? 61
        : mood === 'wrong'
          ? 66
          : 64;

  const mouthOpenH =
    mood === 'wrong'
      ? 2.2
      : !isTalking
        ? 2.4
        : mouthFrame === 0
          ? 3.2
          : mouthFrame === 1
            ? 7.2
            : mouthFrame === 2
              ? 4.6
              : 8.4;

  const gestureLift =
    mood === 'excited' || mood === 'daily_double'
      ? -8
      : mood === 'correct'
        ? -5
        : mood === 'reading'
          ? -2
          : 0;

  return (
    <div
      data-testid="jeopardy-host-stage"
      className="flex flex-col rounded-lg overflow-hidden border border-[#C49E54]/55 bg-[#081032] shadow-[0_14px_34px_rgba(0,0,0,0.65)]"
    >
      {/* Animated 2D Studio Host Canvas */}
      <div className="relative w-full aspect-[4/4.15] bg-[#060B28] overflow-hidden border-b border-[#C49E54]/45">
        <svg
          viewBox="0 0 220 228"
          className="w-full h-full block"
          role="img"
          aria-label={`Game show host Artie Vance (${mood})`}
        >
          <defs>
            <linearGradient id="studioWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#081448" />
              <stop offset="55%" stopColor="#0D206E" />
              <stop offset="100%" stopColor="#050B26" />
            </linearGradient>
            <radialGradient id="hostSpot" cx="50%" cy="22%" r="68%">
              <stop
                offset="0%"
                stopColor={
                  mood === 'daily_double'
                    ? '#FDE047'
                    : mood === 'correct'
                      ? '#34D399'
                      : buzzerLightsOn
                        ? '#7DD3FC'
                        : '#60A5FA'
                }
                stopOpacity="0.34"
              />
              <stop offset="100%" stopColor="#081448" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="suitNavy" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1B2B52" />
              <stop offset="100%" stopColor="#0E1730" />
            </linearGradient>
            <linearGradient id="podiumWood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E3578" />
              <stop offset="100%" stopColor="#0A143B" />
            </linearGradient>
            <linearGradient id="brassTrim" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#A67C2E" />
              <stop offset="50%" stopColor="#F5D372" />
              <stop offset="100%" stopColor="#9B6E24" />
            </linearGradient>
          </defs>

          {/* 1990s Broadcast Studio Wall & Geometric Grid */}
          <rect x="0" y="0" width="220" height="228" fill="url(#studioWall)" />
          <g stroke="#2948A8" strokeOpacity="0.32" strokeWidth="1">
            <line x1="0" y1="32" x2="220" y2="32" />
            <line x1="0" y1="64" x2="220" y2="64" />
            <line x1="0" y1="96" x2="220" y2="96" />
            <line x1="0" y1="128" x2="220" y2="128" />
            <line x1="36" y1="0" x2="36" y2="165" />
            <line x1="110" y1="0" x2="110" y2="165" />
            <line x1="184" y1="0" x2="184" y2="165" />
          </g>

          {/* Studio Spotlight Cone */}
          <polygon points="62,0 158,0 208,185 12,185" fill="url(#hostSpot)" />

          {/* Glowing 90s Studio Light Columns */}
          <rect
            x="10"
            y="16"
            width="6"
            height="136"
            rx="3"
            fill={buzzerLightsOn ? '#E0F2FE' : '#1E3A8A'}
            opacity={buzzerLightsOn ? 0.95 : 0.45}
          />
          <rect
            x="204"
            y="16"
            width="6"
            height="136"
            rx="3"
            fill={buzzerLightsOn ? '#E0F2FE' : '#1E3A8A'}
            opacity={buzzerLightsOn ? 0.95 : 0.45}
          />

          {/* Host Shoulders & Tailored 90s Navy Suit */}
          <path
            d="M46 184 C48 142, 66 125, 92 122 L128 122 C154 125, 172 142, 174 184 Z"
            fill="url(#suitNavy)"
            stroke="#080E20"
            strokeWidth="2"
          />
          {/* Crisp White Dress Shirt V */}
          <polygon points="94,121 126,121 110,162" fill="#F8FAFC" />
          {/* 90s Patterned Burgundy & Gold Silk Tie */}
          <polygon points="105,126 115,126 117,156 110,164 103,156" fill="#9F1239" />
          <line x1="106" y1="136" x2="114" y2="132" stroke="#F5C242" strokeWidth="1.4" />
          <line x1="105" y1="145" x2="115" y2="141" stroke="#F5C242" strokeWidth="1.4" />
          <line x1="105" y1="154" x2="115" y2="150" stroke="#F5C242" strokeWidth="1.4" />
          <polygon points="105,121 115,121 113,128 107,128" fill="#BE123C" />
          {/* Suit Lapels & Pocket Square */}
          <polygon points="94,121 82,130 92,158 104,154" fill="#233768" stroke="#0C1530" strokeWidth="1" />
          <polygon points="126,121 138,130 128,158 116,154" fill="#233768" stroke="#0C1530" strokeWidth="1" />
          <polygon points="138,142 152,140 149,147 137,147" fill="#F5C242" />

          {/* Neck */}
          <rect x="98" y="106" width="24" height="19" rx="7" fill="#E8B894" />
          <path d="M98 111 Q110 118 122 111" fill="none" stroke="#C9926E" strokeWidth="2" />

          {/* Ears */}
          <ellipse cx="75" cy="77" rx="6.5" ry="10.5" fill="#E6B28C" stroke="#B67F5C" strokeWidth="1.2" />
          <ellipse cx="145" cy="77" rx="6.5" ry="10.5" fill="#E6B28C" stroke="#B67F5C" strokeWidth="1.2" />

          {/* Head */}
          <rect
            x="77"
            y="38"
            width="66"
            height="76"
            rx="30"
            fill="#F1C39F"
            stroke="#B67F5C"
            strokeWidth="1.4"
          />

          {/* Classic 90s Game Show Host Hair with Silver Temples */}
          <path
            d="M75 66 C73 40, 88 26, 112 26 C135 26, 148 39, 145 66 C141 53, 134 45, 116 44 C98 44, 83 49, 75 66 Z"
            fill="#3B2F2F"
          />
          <path d="M76 58 C78 51, 82 48, 86 47 L84 61 Z" fill="#CBD5E1" opacity="0.85" />
          <path d="M144 58 C142 51, 138 48, 134 47 L136 61 Z" fill="#CBD5E1" opacity="0.85" />
          <path d="M92 34 Q112 29 131 36" fill="none" stroke="#94A3B8" strokeWidth="1.6" opacity="0.55" />

          {/* Expressive Eyebrows */}
          <path
            d={`M87 ${eyebrowLeftY} Q95 ${eyebrowLeftY - 4} 103 ${eyebrowLeftY}`}
            fill="none"
            stroke="#2B2121"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={`M117 ${eyebrowRightY} Q125 ${eyebrowRightY - 4} 133 ${eyebrowRightY}`}
            fill="none"
            stroke="#2B2121"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Eyes (Animated Blink) */}
          {blink ? (
            <g stroke="#2B2121" strokeWidth="2.4" strokeLinecap="round">
              <line x1="89" y1="74" x2="102" y2="74" />
              <line x1="118" y1="74" x2="131" y2="74" />
            </g>
          ) : (
            <g>
              <ellipse cx="95.5" cy="74" rx="6.5" ry="5" fill="#FFFFFF" stroke="#334155" strokeWidth="0.9" />
              <ellipse cx="124.5" cy="74" rx="6.5" ry="5" fill="#FFFFFF" stroke="#334155" strokeWidth="0.9" />
              <circle cx="96.5" cy="74" r="3.1" fill="#1E3A5F" />
              <circle cx="125.5" cy="74" r="3.1" fill="#1E3A5F" />
              <circle cx="96.5" cy="74" r="1.5" fill="#0F172A" />
              <circle cx="125.5" cy="74" r="1.5" fill="#0F172A" />
              <circle cx="98" cy="72.4" r="1" fill="#FFFFFF" />
              <circle cx="127" cy="72.4" r="1" fill="#FFFFFF" />
            </g>
          )}

          {/* Nose */}
          <path
            d="M110 73 L107 86 Q110 88.5 113 86"
            fill="none"
            stroke="#C28964"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Distinguished Game-Show Mustache */}
          <path
            d="M95 93 Q102 88 110 91 Q118 88 125 93 Q118 96 110 95 Q102 96 95 93 Z"
            fill="#473A3A"
          />

          {/* Animated Mouth */}
          {mood === 'correct' || mood === 'excited' || mood === 'daily_double' ? (
            <path
              d={`M99 98 Q110 ${99 + mouthOpenH * 1.45} 121 98 Q110 ${99 + mouthOpenH * 0.45} 99 98 Z`}
              fill="#7F1D1D"
              stroke="#5A2A22"
              strokeWidth="1.2"
            />
          ) : mood === 'wrong' ? (
            <path
              d="M101 102 Q110 97 119 102"
              fill="none"
              stroke="#5A2A22"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          ) : (
            <ellipse
              cx="110"
              cy="99.5"
              rx="8.5"
              ry={mouthOpenH * 0.55}
              fill={mouthOpenH > 3 ? '#7F1D1D' : '#8C4339'}
              stroke="#5A2A22"
              strokeWidth="1"
            />
          )}
          {mouthOpenH > 4.5 && mood !== 'wrong' && (
            <rect x="104" y="96.8" width="12" height="2.4" rx="1" fill="#FFFFFF" />
          )}

          {/* Gesturing Hand Holding Classic Blue Cue Cards */}
          <g transform={`translate(0, ${gestureLift})`}>
            {/* Blue Clue Card Stack */}
            <rect
              x="146"
              y="138"
              width="34"
              height="24"
              rx="2.5"
              transform="rotate(-11 163 150)"
              fill="#1D4ED8"
              stroke="#F5C242"
              strokeWidth="1.4"
            />
            <line x1="152" y1="146" x2="173" y2="142" stroke="#DBEAFE" strokeWidth="1.3" opacity="0.8" />
            <line x1="153" y1="151" x2="174" y2="147" stroke="#DBEAFE" strokeWidth="1.3" opacity="0.7" />
            {/* Hand */}
            <ellipse cx="151" cy="156" rx="9" ry="7.5" fill="#F1C39F" stroke="#B67F5C" strokeWidth="1.2" />
          </g>

          {/* Studio Condenser Microphone */}
          <path d="M58 176 Q64 152 80 144" fill="none" stroke="#94A3B8" strokeWidth="2.4" />
          <ellipse cx="83" cy="142" rx="5" ry="3.2" transform="rotate(-24 83 142)" fill="#1E293B" stroke="#CBD5E1" strokeWidth="1" />

          {/* Brass-Trimmed Host Studio Podium */}
          <path d="M22 174 L198 174 L190 228 L30 228 Z" fill="url(#podiumWood)" stroke="#0A1230" strokeWidth="2" />
          <rect x="16" y="168" width="188" height="8" rx="2" fill="url(#brassTrim)" />
          <rect x="44" y="187" width="132" height="26" rx="3" fill="#060CE9" stroke="#F5C242" strokeWidth="1.8" />
          <text
            x="110"
            y="204"
            textAnchor="middle"
            fill="#F5C242"
            fontFamily="Oswald, sans-serif"
            fontWeight="700"
            fontSize="13"
            letterSpacing="2.4"
          >
            ARTIE VANCE
          </text>
        </svg>

        {/* Subtle Top Corner Broadcast Tag */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#050A22]/85 border border-[#C49E54]/60 text-[10px] font-display font-bold uppercase tracking-widest text-[#F5C242]">
          {roundLabel}
        </div>
      </div>

      {/* Host Teleprompter Speech Card */}
      <div className="p-3 bg-[#070E2E]">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-display font-bold uppercase tracking-[0.18em] text-[#F5C242]">
            Host Desk
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300/80">
            {mood === 'daily_double'
              ? 'Daily Double!'
              : mood === 'correct'
                ? 'Correct!'
                : mood === 'wrong'
                  ? 'Incorrect'
                  : mood === 'reading'
                    ? 'Reading Clue'
                    : 'Live Studio'}
          </span>
        </div>
        <p
          data-testid="host-dialogue"
          className="text-xs leading-relaxed text-slate-100 min-h-[60px]"
        >
          {hostLine}
        </p>
      </div>
    </div>
  );
}

interface NostalgiaMediaFrameProps {
  media: NostalgiaMediaRef;
  compact?: boolean;
}

/**
 * Displays a real archival image fetched through our cached server proxy
 * (/api/nostalgia-media -> Wikipedia/Wikimedia Commons or Internet Archive)
 * inside a 1990s CRT Broadcast Studio Monitor frame with a resilient SMPTE TV-bars fallback.
 */
export function NostalgiaMediaFrame({ media, compact = false }: NostalgiaMediaFrameProps) {
  const src = `/api/nostalgia-media?source=${media.source}&id=${encodeURIComponent(media.id)}`;
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    setStatus('loading');
  }, [src]);

  const sourceLabel = media.source === 'wiki' ? 'Wikimedia Commons' : 'Internet Archive';

  return (
    <figure
      data-testid="nostalgia-media-frame"
      data-media-status={status}
      className={`rounded-md overflow-hidden border-2 border-[#3C55A8] bg-[#04081B] shadow-[0_12px_28px_rgba(0,0,0,0.65)] shrink-0 ${
        compact ? 'w-[220px]' : 'w-[250px] sm:w-[276px]'
      }`}
    >
      <div
        className={`relative w-full aspect-[4/3] flex items-center justify-center overflow-hidden ${
          media.source === 'wiki' ? 'bg-[#EEF2F9]' : 'bg-[#030616]'
        }`}
      >
        {status !== 'error' && (
          <img
            src={src}
            alt={media.caption}
            referrerPolicy="no-referrer"
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
            className={`w-full h-full object-contain transition-opacity duration-200 ${
              media.source === 'wiki' ? 'p-1.5 bg-[#EEF2F9]' : 'bg-[#060B22]'
            } ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#060B22] text-sky-200/80">
            <div className="w-7 h-7 rounded-full border-2 border-sky-400/30 border-t-[#F5C242] animate-spin" />
            <span className="text-[10px] font-display uppercase tracking-widest">
              Tuning Archive Feed...
            </span>
          </div>
        )}

        {status === 'error' && (
          /* Stylized 1990s SMPTE Color Bars fallback — zero broken image icons */
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 grid grid-cols-7">
              <div className="bg-[#CBD5E1]" />
              <div className="bg-[#FACC15]" />
              <div className="bg-[#22D3EE]" />
              <div className="bg-[#22C55E]" />
              <div className="bg-[#D946EF]" />
              <div className="bg-[#EF4444]" />
              <div className="bg-[#2563EB]" />
            </div>
            <div className="px-2 py-1.5 bg-[#050A22]/92 text-center">
              <div className="text-[10px] font-display uppercase tracking-widest text-[#F5C242]">
                90s Archive Reel
              </div>
              <div className="text-[11px] text-slate-200 truncate">{media.caption}</div>
            </div>
          </div>
        )}

        {/* Subtle CRT glass highlight */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 28%, rgba(0,0,0,0.22) 100%)',
          }}
        />
      </div>

      <figcaption className="px-2.5 py-1.5 bg-[#081032] border-t border-[#283B82] flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-200 truncate" title={media.caption}>
          {media.caption}
        </span>
        <span className="text-[9px] font-display font-semibold uppercase tracking-wider text-[#F5C242] shrink-0">
          {sourceLabel}
        </span>
      </figcaption>
    </figure>
  );
}

function formatTimecode(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const total = Math.floor(sec);
  const mins = Math.floor(total / 60);
  const rem = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

interface NostalgiaVideoMonitorProps {
  video: NostalgiaVideoRef;
  studioMuted: boolean;
  large?: boolean;
  compact?: boolean;
  autoPlay?: boolean;
  paused?: boolean;
  badgeLabel?: string;
  fallbackMedia?: NostalgiaMediaRef;
  onEnded?: () => void;
  onPlaying?: () => void;
}

/**
 * Streams a real 1990s MP4 clip directly from Internet Archive through our Range-enabled
 * /api/nostalgia-video proxy inside a 1990s broadcast CRT monitor.
 * Handles browser autoplay policies automatically (falling back to muted playback with an
 * Unmute toggle so video frames always roll immediately) and falls back gracefully to
 * NostalgiaMediaFrame on upstream errors.
 */
export function NostalgiaVideoMonitor({
  video,
  studioMuted,
  large = false,
  compact = false,
  autoPlay = true,
  paused = false,
  badgeLabel,
  fallbackMedia,
  onEnded,
  onPlaying,
}: NostalgiaVideoMonitorProps) {
  const videoSrc = `/api/nostalgia-video?id=${encodeURIComponent(video.archiveId)}&file=${encodeURIComponent(video.file)}`;
  const posterSrc = `/api/nostalgia-media?source=archive&id=${encodeURIComponent(video.archiveId)}`;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onEndedRef = useRef(onEnded);
  const onPlayingRef = useRef(onPlaying);
  onEndedRef.current = onEnded;
  onPlayingRef.current = onPlaying;

  const [status, setStatus] = useState<'loading' | 'playing' | 'paused' | 'ended' | 'error'>(
    'loading'
  );
  const [clipMuted, setClipMuted] = useState<boolean>(studioMuted);
  const [userPaused, setUserPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Sync studio mute toggle when user flips global [M] mute
  useEffect(() => {
    setClipMuted(studioMuted);
    if (videoRef.current) {
      videoRef.current.muted = studioMuted;
    }
  }, [studioMuted]);

  // Reset & start streaming whenever clip source changes
  useEffect(() => {
    setStatus('loading');
    setUserPaused(false);
    setCurrentTime(video.startSec ?? 0);
    setDuration(0);

    const el = videoRef.current;
    if (!el) return;

    el.muted = studioMuted;
    setClipMuted(studioMuted);

    if (!autoPlay || paused) return;

    let cancelled = false;
    const startPlayback = async () => {
      try {
        await el.play();
      } catch {
        if (cancelled) return;
        // Browser blocked unmuted autoplay — immediately fall back to muted playback so video ALWAYS plays
        el.muted = true;
        setClipMuted(true);
        try {
          await el.play();
        } catch {
          // Wait for canplay event to retry
        }
      }
    };
    void startPlayback();

    return () => {
      cancelled = true;
    };
  }, [videoSrc, video.startSec, autoPlay]);

  // Pause/resume when global Pause modal toggles
  useEffect(() => {
    const el = videoRef.current;
    if (!el || status === 'error') return;
    if (paused) {
      el.pause();
    } else if (!userPaused && autoPlay && status !== 'ended') {
      el.play().catch(() => {
        el.muted = true;
        setClipMuted(true);
        el.play().catch(() => undefined);
      });
    }
  }, [paused, userPaused, autoPlay, status]);

  if (status === 'error' && fallbackMedia) {
    return <NostalgiaMediaFrame media={fallbackMedia} compact={compact} />;
  }

  const handleTogglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused || el.ended) {
      if (el.ended) {
        el.currentTime = video.startSec ?? 0;
      }
      setUserPaused(false);
      el.play().catch(() => {
        el.muted = true;
        setClipMuted(true);
        el.play().catch(() => undefined);
      });
    } else {
      setUserPaused(true);
      el.pause();
    }
  };

  const handleToggleMute = () => {
    const el = videoRef.current;
    const nextMuted = !clipMuted;
    setClipMuted(nextMuted);
    if (el) {
      el.muted = nextMuted;
      if (!nextMuted && el.paused && !userPaused) {
        el.play().catch(() => undefined);
      }
    }
  };

  const handleReplay = () => {
    const el = videoRef.current;
    if (!el) return;
    setUserPaused(false);
    el.currentTime = video.startSec ?? 0;
    el.play().catch(() => {
      el.muted = true;
      setClipMuted(true);
      el.play().catch(() => undefined);
    });
  };

  const widthClass = large
    ? 'w-full max-w-[540px]'
    : compact
      ? 'w-[250px] sm:w-[270px]'
      : 'w-[290px] sm:w-[340px] xl:w-[376px]';

  return (
    <figure
      data-testid="nostalgia-video-frame"
      data-video-status={status}
      className={`rounded-md overflow-hidden border-2 border-[#F5C242]/80 bg-[#03071B] shadow-[0_16px_38px_rgba(0,0,0,0.75)] shrink-0 ${widthClass}`}
    >
      {/* 4:3 Broadcast CRT Screen */}
      <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          data-testid="nostalgia-video-player"
          src={videoSrc}
          poster={posterSrc}
          playsInline
          preload="auto"
          muted={clipMuted}
          onLoadedMetadata={(e) => {
            const el = e.currentTarget;
            setDuration(el.duration || 0);
            if (video.startSec && video.startSec > 0 && el.currentTime < video.startSec) {
              el.currentTime = video.startSec;
            }
          }}
          onCanPlay={(e) => {
            const el = e.currentTarget;
            if (autoPlay && !paused && !userPaused && el.paused && status !== 'ended') {
              el.play().catch(() => {
                el.muted = true;
                setClipMuted(true);
                el.play().catch(() => undefined);
              });
            }
          }}
          onPlaying={() => {
            setStatus('playing');
            onPlayingRef.current?.();
          }}
          onPause={() => {
            if (status !== 'ended' && status !== 'error') {
              setStatus('paused');
            }
          }}
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime);
          }}
          onEnded={() => {
            setStatus('ended');
            onEndedRef.current?.();
          }}
          onError={() => {
            setStatus('error');
          }}
          className="w-full h-full object-contain bg-black"
        />

        {/* Top-left Broadcast Live Tape Indicator */}
        <div className="pointer-events-none absolute top-2 left-2 px-2 py-0.5 rounded bg-[#050A22]/85 border border-[#F5C242]/65 flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-widest text-[#F5C242]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === 'playing'
                ? 'bg-emerald-400 animate-pulse'
                : status === 'loading'
                  ? 'bg-amber-300 animate-pulse'
                  : 'bg-slate-400'
            }`}
          />
          <span>
            {badgeLabel ??
              (status === 'playing'
                ? 'PLAYING VHS'
                : status === 'loading'
                  ? 'LOADING TAPE...'
                  : status === 'ended'
                    ? 'CLIP ENDED'
                    : 'PAUSED')}
          </span>
        </div>

        {/* Loading Spinner Overlay (clears immediately when video begins playing) */}
        {status === 'loading' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#04081B]/60 text-sky-100">
            <div className="w-8 h-8 rounded-full border-2 border-sky-400/35 border-t-[#F5C242] animate-spin" />
            <span className="text-[10px] font-display font-bold uppercase tracking-widest text-[#F5C242]">
              Streaming Internet Archive Video...
            </span>
          </div>
        )}

        {/* Subtle CRT scanline sheen */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 24%, rgba(0,0,0,0.22) 100%)',
          }}
        />
      </div>

      {/* Crisp Broadcast Video Transport Controls */}
      <div className="px-2.5 py-1.5 bg-[#060D2A] border-t border-[#283B82] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="video-play-toggle-btn"
            onClick={handleTogglePlay}
            className="px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider cursor-pointer bg-[#122472] hover:bg-[#1D38AD] border border-[#4262D6] text-white"
          >
            {status === 'playing' ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            data-testid="video-mute-toggle-btn"
            onClick={handleToggleMute}
            className={`px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider cursor-pointer border ${
              clipMuted
                ? 'bg-[#78350F]/80 hover:bg-[#92400E] border-[#F5C242]/80 text-[#FDE047]'
                : 'bg-[#0C1954] hover:bg-[#172D8C] border-[#3855BE] text-sky-100'
            }`}
          >
            {clipMuted ? 'Unmute Clip' : 'Sound On'}
          </button>
          <button
            type="button"
            data-testid="video-replay-btn"
            onClick={handleReplay}
            className="px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider cursor-pointer bg-[#0C1954] hover:bg-[#172D8C] border border-[#3855BE] text-slate-200"
          >
            Replay
          </button>
        </div>

        <span className="font-mono-num text-[10px] text-amber-200/95 tabular-nums whitespace-nowrap">
          {formatTimecode(currentTime)}
          {duration > 0 ? ` / ${formatTimecode(duration)}` : ''}
        </span>
      </div>

      {/* Caption & Attribution Bar */}
      <figcaption className="px-2.5 py-1.5 bg-[#081032] border-t border-[#1D2D6B] flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-200 truncate" title={video.caption}>
          {video.caption}
        </span>
        <span className="text-[9px] font-display font-semibold uppercase tracking-wider text-[#F5C242] shrink-0">
          Internet Archive Video
        </span>
      </figcaption>
    </figure>
  );
}
