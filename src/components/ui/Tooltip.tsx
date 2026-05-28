import { useState } from 'react';

interface Props {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'left';
}

export function Tooltip({ content, children, position = 'top' }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          className={`absolute z-50 px-2 py-1.5 text-xs bg-paper border border-gold/30 text-ink/70 whitespace-pre-wrap max-w-48 pointer-events-none shadow-sm ${
            position === 'top'
              ? 'bottom-full left-0 mb-1.5'
              : 'right-full top-0 mr-1.5'
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
