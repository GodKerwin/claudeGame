import { useNavigate } from 'react-router-dom';
import { CornerFrame } from '../../components/ui/CornerFrame';
import { MountainBackground } from '../../components/ui/MountainBackground';

export default function Credits() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center relative overflow-hidden">
      <MountainBackground opacity={0.5} />
      <div className="flex flex-col items-center space-y-10 w-64 text-center relative z-10">
        <CornerFrame size="md" className="px-8 py-5">
          <div className="space-y-2">
            <h1 className="text-gold text-3xl tracking-[0.3em]">天机残卷</h1>
            <p className="text-ink/30 text-xs tracking-widest">三章完结</p>
          </div>
        </CornerFrame>

        <div className="w-16 border-t border-gold/30" />

        <div className="space-y-6 text-sm tracking-widest">
          <div className="space-y-1">
            <p className="text-ink/40 text-xs">制　作　人</p>
            <p className="text-ink/70">风雪久</p>
          </div>

          <div className="w-8 border-t border-gold/20 mx-auto" />

          <div className="space-y-1">
            <p className="text-ink/40 text-xs">技术实现</p>
            <p className="text-ink/70">Claude Sonnet 4.6</p>
          </div>
        </div>

        <div className="w-16 border-t border-gold/30" />

        <button
          onClick={() => navigate('/')}
          className="btn-jianghu py-3 w-full border border-gold/40 text-ink hover:border-gold hover:text-gold tracking-widest transition-all cursor-pointer text-sm"
        >
          返回
        </button>
      </div>
    </div>
  );
}
