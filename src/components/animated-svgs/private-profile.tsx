"use client";

export const PrivateProfileSVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="lock-body-grad" x1="60" y1="80" x2="140" y2="170" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="lock-shackle-grad" x1="75" y1="40" x2="125" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="check-circle-grad" x1="120" y1="120" x2="170" y2="170" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
      <filter id="lock-shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.25" />
      </filter>
      <filter id="check-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.5" />
      </filter>
    </defs>

    {/* Subtle pulse ring behind lock */}
    <circle cx="100" cy="110" r="60" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0">
      <animate attributeName="r" values="50;70;50" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.15;0" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="100" cy="110" r="60" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0">
      <animate attributeName="r" values="55;80;55" dur="3s" begin="0.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.1;0" dur="3s" begin="0.5s" repeatCount="indefinite" />
    </circle>

    {/* Lock group with gentle float */}
    <g filter="url(#lock-shadow)">
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-4; 0,0"
        dur="4s"
        repeatCount="indefinite"
      />

      {/* Shackle */}
      <path
        d="M78 90 V70 C78 50 90 38 100 38 C110 38 122 50 122 70 V90"
        stroke="url(#lock-shackle-grad)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      >
        <animate attributeName="d"
          values="M78 90 V70 C78 50 90 38 100 38 C110 38 122 50 122 70 V90;
                  M78 88 V68 C78 48 90 36 100 36 C110 36 122 48 122 68 V88;
                  M78 90 V70 C78 50 90 38 100 38 C110 38 122 50 122 70 V90"
          dur="4s"
          repeatCount="indefinite"
        />
      </path>

      {/* Lock body */}
      <rect x="65" y="88" width="70" height="55" rx="12" fill="url(#lock-body-grad)" />

      {/* Keyhole */}
      <circle cx="100" cy="110" r="7" fill="#312e81">
        <animate attributeName="r" values="7;7.5;7" dur="2s" repeatCount="indefinite" />
      </circle>
      <rect x="97" y="113" width="6" height="12" rx="2" fill="#312e81" />
    </g>

    {/* Checkmark circle */}
    <g filter="url(#check-glow)">
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-4; 0,0"
        dur="4s"
        repeatCount="indefinite"
      />

      {/* Pop-in scale animation */}
      <g>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1; 1.08; 1"
          dur="3s"
          repeatCount="indefinite"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          values="-145,-155; -145,-155; -145,-155"
          dur="3s"
          repeatCount="indefinite"
          additive="sum"
        />

        <circle cx="145" cy="155" r="18" fill="url(#check-circle-grad)" />
        <path
          d="M136 155 L142 161 L155 148"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="24"
          strokeDashoffset="24"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="24;0;0;0"
            keyTimes="0;0.3;0.8;1"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </g>
  </svg>
);
