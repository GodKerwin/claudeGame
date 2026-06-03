import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerFrame } from '../ui/CornerFrame';

type MobilePanel = 'left' | 'center' | 'right';

interface Props {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

const MOBILE_TABS: { key: MobilePanel; label: string }[] = [
  { key: 'left', label: '地图' },
  { key: 'center', label: '故事' },
  { key: 'right', label: '状态' },
];

export function GameLayout({ left, center, right }: Props) {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('center');

  const panelContent: Record<MobilePanel, React.ReactNode> = { left, center, right };

  return (
    <div className="flex h-screen w-screen bg-paper text-ink font-serif overflow-hidden select-none">
      {/* Desktop: 三栏布局 (≥1024px) */}
      <div className="hidden lg:flex w-full h-full">
        <CornerFrame size="sm" className="w-44 shrink-0 panel border-r border-gold/15 flex flex-col overflow-hidden">
          {left}
        </CornerFrame>
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gold/10">
          {center}
        </div>
        <CornerFrame size="sm" className="shrink-0 panel flex flex-col overflow-hidden" style={{ width: '210px' }}>
          {right}
        </CornerFrame>
      </div>

      {/* Mobile: 单栏 + 底部标签栏 (<1024px) */}
      <div className="flex lg:hidden flex-col w-full h-full">
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobilePanel}
              role="tabpanel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {panelContent[mobilePanel]}
            </motion.div>
          </AnimatePresence>
        </div>
        <div role="tablist" className="flex border-t border-gold/20 bg-paper shrink-0 pb-3">
          {MOBILE_TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={mobilePanel === key}
              onClick={() => setMobilePanel(key)}
              className={`flex-1 py-4 text-xs tracking-widest transition-colors cursor-pointer ${
                mobilePanel === key
                  ? 'text-gold border-t-2 border-gold -mt-px'
                  : 'text-ink/40 hover:text-ink/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
