"use client";

export const WarpSpeedSVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient
        id="bolt-grad"
        x1="85"
        y1="50"
        x2="115"
        y2="160"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
      <linearGradient
        id="ring-grad-1"
        x1="30"
        y1="30"
        x2="170"
        y2="170"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient
        id="ring-grad-2"
        x1="170"
        y1="30"
        x2="30"
        y2="170"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <filter id="bolt-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="5"
          floodColor="#f59e0b"
          floodOpacity="0.45"
        />
      </filter>
      <filter id="speed-blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
      </filter>
    </defs>

    {/* Outer spinning ring */}
    <circle
      cx="100"
      cy="100"
      r="72"
      stroke="url(#ring-grad-1)"
      strokeWidth="2"
      strokeDasharray="40 20 10 20"
      fill="none"
      opacity="0.5"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 100 100"
        to="360 100 100"
        dur="8s"
        repeatCount="indefinite"
      />
    </circle>

    {/* Inner counter-spinning ring */}
    <circle
      cx="100"
      cy="100"
      r="58"
      stroke="url(#ring-grad-2)"
      strokeWidth="1.5"
      strokeDasharray="15 25 5 25"
      fill="none"
      opacity="0.35"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="360 100 100"
        to="0 100 100"
        dur="6s"
        repeatCount="indefinite"
      />
    </circle>

    {/* Speed lines radiating outward */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <line
        key={angle}
        x1="100"
        y1="100"
        x2={100 + 85 * Math.cos((angle * Math.PI) / 180)}
        y2={100 + 85 * Math.sin((angle * Math.PI) / 180)}
        stroke="#f59e0b"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0"
        filter="url(#speed-blur)"
      >
        <animate
          attributeName="opacity"
          values="0;0.3;0"
          dur="1.5s"
          begin={`${i * 0.18}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="x1"
          values={`${100 + 30 * Math.cos((angle * Math.PI) / 180)};${100 + 50 * Math.cos((angle * Math.PI) / 180)};${100 + 30 * Math.cos((angle * Math.PI) / 180)}`}
          dur="1.5s"
          begin={`${i * 0.18}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="y1"
          values={`${100 + 30 * Math.sin((angle * Math.PI) / 180)};${100 + 50 * Math.sin((angle * Math.PI) / 180)};${100 + 30 * Math.sin((angle * Math.PI) / 180)}`}
          dur="1.5s"
          begin={`${i * 0.18}s`}
          repeatCount="indefinite"
        />
      </line>
    ))}

    {/* Central bolt with float + glow */}
    <g filter="url(#bolt-glow)">
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-3; 0,0"
        dur="2.5s"
        repeatCount="indefinite"
      />

      {/* Lightning bolt */}
      <path
        d="M108 60 L90 105 L105 105 L92 145 L120 95 L105 95 Z"
        fill="url(#bolt-grad)"
      >
        <animate
          attributeName="opacity"
          values="1;0.85;1"
          dur="1.2s"
          repeatCount="indefinite"
        />
      </path>
    </g>

    {/* Orbiting dot 1 */}
    <circle cx="100" cy="28" r="3" fill="#f59e0b" opacity="0.7">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 100 100"
        to="360 100 100"
        dur="4s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="r"
        values="3;4;3"
        dur="2s"
        repeatCount="indefinite"
      />
    </circle>

    {/* Orbiting dot 2 */}
    <circle cx="100" cy="172" r="2.5" fill="#ef4444" opacity="0.5">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="180 100 100"
        to="540 100 100"
        dur="5s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);
