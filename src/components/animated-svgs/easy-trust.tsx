"use client";

export const EasyTrustSVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient
        id="shield-grad"
        x1="60"
        y1="40"
        x2="140"
        y2="170"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient
        id="shield-inner-grad"
        x1="75"
        y1="60"
        x2="125"
        y2="150"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#818cf8" />
      </linearGradient>
      <linearGradient
        id="shield-shine"
        x1="80"
        y1="50"
        x2="120"
        y2="50"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="white" stopOpacity="0" />
        <stop offset="50%" stopColor="white" stopOpacity="0.25" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <filter id="shield-shadow" x="-15%" y="-15%" width="140%" height="140%">
        <feDropShadow
          dx="0"
          dy="4"
          stdDeviation="8"
          floodColor="#3b82f6"
          floodOpacity="0.3"
        />
      </filter>
      <clipPath id="shield-clip">
        <path d="M100 35 L145 55 C145 55 148 110 100 160 C52 110 55 55 55 55 Z" />
      </clipPath>
    </defs>

    {/* Pulse rings */}
    <path
      d="M100 40 L140 58 C140 58 143 108 100 155 C57 108 60 58 60 58 Z"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="1"
      opacity="0"
    >
      <animate
        attributeName="opacity"
        values="0;0.2;0"
        dur="3s"
        repeatCount="indefinite"
      />
      <animateTransform
        attributeName="transform"
        type="scale"
        values="1;1.12;1"
        dur="3s"
        repeatCount="indefinite"
        additive="sum"
      />
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; -12,-10; 0,0"
        dur="3s"
        repeatCount="indefinite"
        additive="sum"
      />
    </path>

    {/* Shield group with float */}
    <g filter="url(#shield-shadow)">
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-4; 0,0"
        dur="4s"
        repeatCount="indefinite"
      />

      {/* Shield body */}
      <path
        d="M100 35 L145 55 C145 55 148 110 100 160 C52 110 55 55 55 55 Z"
        fill="url(#shield-grad)"
      />

      {/* Shield inner highlight */}
      <path
        d="M100 48 L135 63 C135 63 137 108 100 148 C63 108 65 63 65 63 Z"
        fill="url(#shield-inner-grad)"
        opacity="0.3"
      />

      {/* Animated shine sweep */}
      <g clipPath="url(#shield-clip)">
        <rect
          x="-40"
          y="30"
          width="40"
          height="140"
          fill="url(#shield-shine)"
          transform="skewX(-15)"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="-20,0; 220,0; 220,0"
            keyTimes="0; 0.4; 1"
            dur="4s"
            repeatCount="indefinite"
          />
        </rect>
      </g>

      {/* Star / badge in center */}
      <g>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1;1.06;1"
          dur="2.5s"
          repeatCount="indefinite"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0;-6,-5.5;0,0"
          dur="2.5s"
          repeatCount="indefinite"
          additive="sum"
        />

        {/* Five-pointed star */}
        <path
          d="M100 72 L106 88 L123 88 L110 98 L114 115 L100 106 L86 115 L90 98 L77 88 L94 88 Z"
          fill="white"
          opacity="0.95"
        />
      </g>
    </g>

    {/* Small floating particles */}
    <circle cx="50" cy="80" r="2" fill="#60a5fa" opacity="0">
      <animate
        attributeName="opacity"
        values="0;0.5;0"
        dur="3s"
        begin="0s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="cy"
        values="85;70;85"
        dur="3s"
        begin="0s"
        repeatCount="indefinite"
      />
    </circle>
    <circle cx="150" cy="90" r="1.5" fill="#818cf8" opacity="0">
      <animate
        attributeName="opacity"
        values="0;0.4;0"
        dur="3.5s"
        begin="0.8s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="cy"
        values="95;75;95"
        dur="3.5s"
        begin="0.8s"
        repeatCount="indefinite"
      />
    </circle>
    <circle cx="70" cy="145" r="1.5" fill="#3b82f6" opacity="0">
      <animate
        attributeName="opacity"
        values="0;0.35;0"
        dur="2.8s"
        begin="1.5s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="cy"
        values="148;135;148"
        dur="2.8s"
        begin="1.5s"
        repeatCount="indefinite"
      />
    </circle>
    <circle cx="135" cy="140" r="2" fill="#6366f1" opacity="0">
      <animate
        attributeName="opacity"
        values="0;0.3;0"
        dur="3.2s"
        begin="0.5s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="cy"
        values="143;128;143"
        dur="3.2s"
        begin="0.5s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);
