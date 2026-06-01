import { useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';

interface Props {
  onClose: () => void;
  onSave: () => void;
  onLoad: () => void;
}

const CORNERS = [
  'top-2 left-2 border-t border-l',
  'top-2 right-2 border-t border-r',
  'bottom-2 left-2 border-b border-l',
  'bottom-2 right-2 border-b border-r',
];

export function SettingsModal({ onClose, onSave, onLoad }: Props) {
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize, MIN_SIZE, MAX_SIZE } = useSettings();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center font-serif px-4"
      style={{ background: 'rgba(8,5,2,0.78)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="设置"
        className="relative w-full max-w-xs"
        style={{
          background: 'linear-gradient(135deg, rgba(26,18,8,0.98) 0%, rgba(20,14,5,0.98) 100%)',
          border: '1px solid rgba(201,168,76,0.22)',
          boxShadow: '0 0 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.07)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {CORNERS.map((cls) => (
          <div key={cls} className={`absolute ${cls} w-3 h-3 border-gold/28`} />
        ))}

        <div className="px-6 py-5 space-y-5">
          {/* 标题 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gold/15" />
            <span className="text-gold/80 text-sm tracking-[0.3em]">设置</span>
            <div className="flex-1 h-px bg-gold/15" />
          </div>

          {/* 字体大小 */}
          <div>
            <p className="text-gold/35 text-[10px] tracking-[0.3em] mb-3">字体大小</p>
            <div className="flex items-center gap-3">
              <button
                onClick={decreaseFontSize}
                disabled={fontSize <= MIN_SIZE}
                className="w-8 h-8 border border-gold/25 text-gold/70 hover:border-gold hover:text-gold disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors text-base flex items-center justify-center"
              >
                −
              </button>
              <span className="text-gold/80 text-sm w-12 text-center tabular-nums">{fontSize}px</span>
              <button
                onClick={increaseFontSize}
                disabled={fontSize >= MAX_SIZE}
                className="w-8 h-8 border border-gold/25 text-gold/70 hover:border-gold hover:text-gold disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors text-base flex items-center justify-center"
              >
                ＋
              </button>
              <button
                onClick={resetFontSize}
                className="text-[11px] text-ink/30 hover:text-ink/55 cursor-pointer ml-1 tracking-widest transition-colors"
              >
                重置
              </button>
            </div>
            <p className="text-ink/25 text-xs mt-2 pl-1">预览：这是一行示例文字</p>
          </div>

          {/* 存档区 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-gold/10" />
              <p className="text-gold/35 text-[10px] tracking-[0.3em] shrink-0">存档</p>
              <div className="flex-1 h-px bg-gold/10" />
            </div>
            <div className="space-y-2">
              <button
                onClick={() => { onSave(); onClose(); }}
                className="w-full py-2 border border-gold/18 text-ink/55 text-sm hover:border-gold/45 hover:text-ink/85 transition-all cursor-pointer tracking-wide"
              >
                保存进度
              </button>
              <button
                onClick={() => { onLoad(); onClose(); }}
                className="w-full py-2 border border-gold/18 text-ink/55 text-sm hover:border-gold/45 hover:text-ink/85 transition-all cursor-pointer tracking-wide"
              >
                读取进度
              </button>
            </div>
          </div>

          {/* 关闭 */}
          <button
            onClick={onClose}
            className="w-full py-2 text-ink/28 hover:text-ink/55 text-xs tracking-widest transition-colors cursor-pointer border border-gold/10 hover:border-gold/22"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
