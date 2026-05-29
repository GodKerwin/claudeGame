import { useState, useRef } from 'react';

interface Props {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'left';
}

export function Tooltip({ content, children, position = 'top' }: Props) {
  const [visible, setVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (ref.current) setAnchorRect(ref.current.getBoundingClientRect());
    setVisible(true);
  };

  const tooltipStyle = anchorRect
    ? position === 'left'
      ? { top: anchorRect.top, left: anchorRect.left - 6, transform: 'translateX(-100%)' }
      : { top: anchorRect.top - 6, left: anchorRect.left, transform: 'translateY(-100%)' }
    : {};

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && anchorRect && (
        <div
          className="fixed z-50 px-2 py-1.5 text-xs bg-paper border border-gold/30 text-ink/70 whitespace-pre-wrap max-w-64 pointer-events-none shadow-sm"
          style={tooltipStyle}
        >
          {content}
        </div>
      )}
    </div>
  );
}
