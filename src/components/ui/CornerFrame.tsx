// src/components/ui/CornerFrame.tsx
interface Props {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 8, md: 12, lg: 16 } as const;

function Corner({ x, y, flip }: { x: 'left' | 'right'; y: 'top' | 'bottom'; flip: boolean }) {
  const s = 12; // rendered at md; parent scales via CSS if needed
  const stroke = 'rgba(201,168,76,0.35)';
  const sw = 1;
  // Lines always go inward from the corner
  const hx2 = x === 'left' ? s : 0;
  const hy = flip ? 0 : s;
  const vx = x === 'left' ? 0 : s;
  const vy2 = flip ? s : 0;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" style={{ display: 'block' }}>
      {/* horizontal arm */}
      <line x1={vx} y1={hy} x2={hx2} y2={hy} stroke={stroke} strokeWidth={sw} />
      {/* vertical arm */}
      <line x1={vx} y1={hy} x2={vx} y2={vy2} stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}

export function CornerFrame({ children, size = 'md', className = '' }: Props) {
  const px = SIZES[size];
  return (
    <div className={`relative ${className}`}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: px, height: px, pointerEvents: 'none' }}>
        <Corner x="left" y="top" flip={false} />
      </div>
      <div style={{ position: 'absolute', top: 0, right: 0, width: px, height: px, pointerEvents: 'none' }}>
        <Corner x="right" y="top" flip={false} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: px, height: px, pointerEvents: 'none' }}>
        <Corner x="left" y="bottom" flip={true} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: px, height: px, pointerEvents: 'none' }}>
        <Corner x="right" y="bottom" flip={true} />
      </div>
      {children}
    </div>
  );
}
