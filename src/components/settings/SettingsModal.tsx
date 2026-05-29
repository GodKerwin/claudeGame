import { useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';

interface Props {
  onClose: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export function SettingsModal({ onClose, onSave, onLoad }: Props) {
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize, MIN_SIZE, MAX_SIZE } = useSettings();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        role="dialog"
        aria-label="设置"
        className="bg-paper border border-gold/30 p-6 w-80 font-serif"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-gold text-base tracking-widest mb-5">── 设置 ──</h2>

        <div className="space-y-5">
          <div>
            <p className="text-ink/60 text-xs mb-2 tracking-widest">【字体大小】</p>
            <div className="flex items-center gap-3">
              <button
                onClick={decreaseFontSize}
                disabled={fontSize <= MIN_SIZE}
                className="w-7 h-7 border border-gold/30 text-gold hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-base"
              >
                −
              </button>
              <span className="text-gold font-bold w-10 text-center">{fontSize}px</span>
              <button
                onClick={increaseFontSize}
                disabled={fontSize >= MAX_SIZE}
                className="w-7 h-7 border border-gold/30 text-gold hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-base"
              >
                ＋
              </button>
              <button
                onClick={resetFontSize}
                className="text-xs text-ink/40 hover:text-ink/70 ml-1 cursor-pointer"
              >
                重置
              </button>
            </div>
            <p className="text-ink/30 text-xs mt-1">预览：这是一行示例文字</p>
          </div>

          <div className="border-t border-gold/10 pt-4 space-y-2">
            <p className="text-ink/60 text-xs mb-2 tracking-widest">【存档】</p>
            <button
              onClick={() => { onSave(); onClose(); }}
              className="w-full py-2 border border-gold/30 text-ink/70 text-sm hover:border-gold hover:text-gold transition-all cursor-pointer"
            >
              保存进度
            </button>
            <button
              onClick={() => { onLoad(); onClose(); }}
              className="w-full py-2 border border-gold/30 text-ink/70 text-sm hover:border-gold hover:text-gold transition-all cursor-pointer"
            >
              读取进度
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2 text-ink/40 text-xs hover:text-ink/70 cursor-pointer"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
