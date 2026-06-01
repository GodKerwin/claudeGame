// src/components/ui/MountainBackground.tsx
interface Props {
  opacity?: number;
}

export function MountainBackground({ opacity = 1 }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        height: '45vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
      }}
    >
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="xMidYMax slice"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mist-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(201,168,76,0)" />
            <stop offset="60%" stopColor="rgba(201,168,76,0.05)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0.05)" />
          </linearGradient>
          <linearGradient id="mist-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(201,168,76,0)" />
            <stop offset="50%" stopColor="rgba(201,168,76,0.07)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0.07)" />
          </linearGradient>
          <linearGradient id="near-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(26,18,8,0)" />
            <stop offset="40%" stopColor="rgba(26,18,8,0.85)" />
            <stop offset="100%" stopColor="rgba(26,18,8,1)" />
          </linearGradient>
        </defs>

        {/* 远山 — 极淡，柔和丘陵 */}
        <path
          d="M0,320 C80,300 180,285 300,270 C420,255 520,265 640,255
             C760,245 860,258 980,248 C1100,238 1220,252 1340,262
             C1380,266 1420,264 1440,265 L1440,400 L0,400 Z"
          fill="url(#mist-far)"
        />

        {/* 中山 — 有明显峰势 */}
        <path
          d="M0,360 C60,330 140,280 240,245 C320,218 400,240 480,222
             C560,204 630,165 720,178 C800,190 870,162 960,148
             C1050,134 1140,165 1230,195 C1320,225 1390,255 1440,270
             L1440,400 L0,400 Z"
          fill="url(#mist-mid)"
        />

        {/* 近山 — 最高峰，与背景融合 */}
        <path
          d="M0,400 L0,375 C40,355 100,310 180,275 C240,250 300,268 360,252
             C420,236 470,195 540,178 C610,161 660,185 720,172
             C780,159 830,130 900,118 C970,106 1020,135 1080,158
             C1140,181 1190,210 1250,240 C1310,270 1380,315 1440,350
             L1440,400 Z"
          fill="url(#near-grad)"
        />
      </svg>
    </div>
  );
}
