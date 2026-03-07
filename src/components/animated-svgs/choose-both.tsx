"use client";

export const ChooseBothSVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 280 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="book-grad" x1="30" y1="20" x2="110" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="book-pages-grad" x1="55" y1="40" x2="55" y2="130" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e0e7ff" />
        <stop offset="100%" stopColor="#c7d2fe" />
      </linearGradient>
      <linearGradient id="film-grad" x1="170" y1="20" x2="250" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
      <linearGradient id="connector-grad" x1="110" y1="80" x2="170" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <filter id="book-shadow" x="-15%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.25" />
      </filter>
      <filter id="film-shadow" x="-15%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Book group - left side */}
    <g filter="url(#book-shadow)">
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-3; 0,0"
        dur="3.5s"
        repeatCount="indefinite"
      />

      {/* Book spine + cover */}
      <rect x="30" y="30" width="80" height="100" rx="6" fill="url(#book-grad)" />

      {/* Pages */}
      <rect x="38" y="35" width="65" height="90" rx="3" fill="url(#book-pages-grad)" />

      {/* Page lines */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={`line-${i}`}
          x1="45"
          y1={50 + i * 12}
          x2="95"
          y2={50 + i * 12}
          stroke="#a5b4fc"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            values="0;0.6;0.6;0"
            keyTimes="0;0.2;0.8;1"
            dur="3s"
            begin={`${i * 0.15}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            values="45;95;95"
            keyTimes="0;0.3;1"
            dur="3s"
            begin={`${i * 0.15}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}

      {/* Book spine detail */}
      <line x1="37" y1="35" x2="37" y2="125" stroke="#4f46e5" strokeWidth="1.5" opacity="0.5" />
    </g>

    {/* Film/Clapperboard group - right side */}
    <g filter="url(#film-shadow)">
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-3; 0,0"
        dur="3.5s"
        begin="0.3s"
        repeatCount="indefinite"
      />

      {/* Film frame body */}
      <rect x="170" y="45" width="80" height="70" rx="8" fill="url(#film-grad)" />

      {/* Clapper top */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 170 48; -8 170 48; 0 170 48"
          dur="2s"
          begin="1s"
          repeatCount="indefinite"
        />
        <rect x="170" y="32" width="80" height="16" rx="4" fill="#ef4444" />
        {/* Clapper stripes */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={`stripe-${i}`}
            x={180 + i * 18}
            y="32"
            width="8"
            height="16"
            rx="1"
            fill="#fbbf24"
            opacity="0.7"
            transform={`skewX(-8)`}
          />
        ))}
      </g>

      {/* Play triangle */}
      <path d="M202 68 L202 92 L222 80 Z" fill="white" opacity="0.9">
        <animate
          attributeName="opacity"
          values="0.9;0.5;0.9"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>

      {/* Film sprocket holes */}
      {[0, 1, 2].map((i) => (
        <g key={`sprocket-${i}`}>
          <rect x="172" y={52 + i * 20} width="6" height="8" rx="1.5" fill="#fcd34d" opacity="0.5" />
          <rect x="242" y={52 + i * 20} width="6" height="8" rx="1.5" fill="#fcd34d" opacity="0.5" />
        </g>
      ))}
    </g>

    {/* Connector dots between book and film */}
    <circle cx="128" cy="80" r="2.5" fill="url(#connector-grad)">
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="140" cy="80" r="3" fill="url(#connector-grad)">
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" begin="0.3s" repeatCount="indefinite" />
      <animate attributeName="r" values="3;3.5;3" dur="2s" begin="0.3s" repeatCount="indefinite" />
    </circle>
    <circle cx="152" cy="80" r="2.5" fill="url(#connector-grad)">
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" begin="0.6s" repeatCount="indefinite" />
    </circle>

    {/* Sparkle particles */}
    <circle cx="120" cy="50" r="1.5" fill="#c4b5fd" opacity="0">
      <animate attributeName="opacity" values="0;0.6;0" dur="2.5s" begin="0s" repeatCount="indefinite" />
      <animate attributeName="cy" values="55;40;55" dur="2.5s" begin="0s" repeatCount="indefinite" />
    </circle>
    <circle cx="160" cy="120" r="1.5" fill="#fcd34d" opacity="0">
      <animate attributeName="opacity" values="0;0.5;0" dur="3s" begin="1s" repeatCount="indefinite" />
      <animate attributeName="cy" values="125;110;125" dur="3s" begin="1s" repeatCount="indefinite" />
    </circle>
  </svg>
);
