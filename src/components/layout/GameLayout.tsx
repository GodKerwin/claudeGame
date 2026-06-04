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
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  const panelContent: Record<MobilePanel, React.ReactNode> = { left, center, right };

  return (
    <div className="flex h-screen w-screen bg-paper text-ink font-serif overflow-hidden select-none">
      {/* Desktop: 三栏布局 (≥1024px) */}
      <div className="hidden lg:flex w-full h-full">
        <nav
          aria-label="地图导航"
          className={`shrink-0 border-r border-gold/15 flex flex-col overflow-hidden transition-all duration-300 ${leftCollapsed ? 'w-9' : 'w-72'}`}
        >
          {leftCollapsed ? (
            <button
              onClick={() => setLeftCollapsed(false)}
              title="展开地图"
              className="flex flex-col items-center justify-center h-full w-full gap-3 text-gold/45 hover:text-gold/75 hover:bg-gold/5 transition-all cursor-pointer group"
            >
              <span className="text-[9px] tracking-[0.4em]" style={{ writingMode: 'vertical-rl' }}>地图</span>
              <div className="w-3 h-px bg-gold/30 group-hover:bg-gold/55 transition-colors" />
              <span className="text-[16px] leading-none">›</span>
            </button>
          ) : (
            <CornerFrame size="sm" className="flex flex-col overflow-hidden h-full panel relative">
              <button
                onClick={() => setLeftCollapsed(true)}
                title="收起"
                className="absolute top-2 right-2 z-10 w-5 h-5 flex items-center justify-center border border-gold/30 text-gold/55 hover:border-gold/65 hover:text-gold/90 transition-colors cursor-pointer"
                style={{ fontSize: '12px', lineHeight: 1 }}
              >
                ‹
              </button>
              {left}
            </CornerFrame>
          )}
        </nav>
        <main className="flex-1 flex flex-col overflow-hidden border-r border-gold/10" aria-label="故事主区">
          {center}
        </main>
        <aside aria-label="角色状态" className="shrink-0 flex flex-col overflow-hidden" style={{ width: '240px' }}>
          <CornerFrame size="sm" className="flex flex-col overflow-hidden h-full panel">
            {right}
          </CornerFrame>
        </aside>
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
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              {panelContent[mobilePanel]}
            </motion.div>
          </AnimatePresence>
        </div>
        <div
          role="tablist"
          className="flex border-t border-gold/20 bg-paper shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {MOBILE_TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={mobilePanel === key}
              onClick={() => setMobilePanel(key)}
              className={`flex-1 py-4 min-h-[3rem] text-xs tracking-widest transition-colors cursor-pointer ${
                mobilePanel === key
                  ? 'text-gold border-t-2 border-gold -mt-px'
                  : 'text-ink/40 hover:text-ink/60'
              }`}
            >
              <span className="flex flex-col items-center gap-0.5">
                {mobilePanel === key && <span className="w-1 h-1 bg-gold/60 rounded-full" />}
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
