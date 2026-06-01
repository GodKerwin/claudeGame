import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATES, TALENTS } from '../../data/loader';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import type { CharacterTemplate } from '../../types/game';

type StatKey = 'strength' | 'agility' | 'wisdom' | 'constitution';
const STAT_LABELS: Record<StatKey, string> = {
  strength: '力',
  agility: '敏',
  wisdom: '智',
  constitution: '骨',
};
const STAT_FULL: Record<StatKey, string> = {
  strength: '力量',
  agility: '敏捷',
  wisdom: '智慧',
  constitution: '根骨',
};

function StatDots({ value, max = 10 }: { value: number; max?: number }) {
  const dots = max;
  return (
    <div className="flex gap-[3px] items-center">
      {Array.from({ length: dots }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-[5px] h-[5px] rounded-full transition-all ${
            i < value ? 'bg-gold/80' : 'bg-gold/12'
          }`}
        />
      ))}
    </div>
  );
}

export default function CharacterCreate() {
  const navigate = useNavigate();
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const resetScene = useSceneStore((s) => s.reset);
  const resetInventory = useInventoryStore((s) => s.reset);

  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate>(TEMPLATES[0]);

  const handleStart = () => {
    if (!name.trim()) return;
    resetScene();
    resetInventory();
    setPlayer({
      name: name.trim(),
      template: selectedTemplate.id,
      strength: selectedTemplate.stats.strength,
      agility: selectedTemplate.stats.agility,
      wisdom: selectedTemplate.stats.wisdom,
      constitution: selectedTemplate.stats.constitution,
      talent: selectedTemplate.talent,
    });
    navigate('/prologue');
  };

  const talent = TALENTS.find((t) => t.id === selectedTemplate.talent);

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center px-6 py-12 select-none">
      {/* 标题区 */}
      <div className="text-center mb-10 fade-up">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="w-16 h-px bg-gold/30" />
          <span className="text-gold/40 text-xs tracking-[0.4em]">大唐开元年间</span>
          <div className="w-16 h-px bg-gold/30" />
        </div>
        <h1 className="text-gold text-4xl tracking-[0.3em] mb-1" style={{ textShadow: '0 0 40px rgba(201,168,76,0.3)' }}>
          天机残卷
        </h1>
        <p className="text-ink/35 text-xs tracking-[0.35em] mt-2">立身江湖，从此起</p>
      </div>

      <div className="w-full max-w-2xl space-y-7">
        {/* 角色名输入 */}
        <div className="flex items-center gap-4">
          <span className="text-gold/50 text-xs tracking-widest shrink-0 w-12">名讳</span>
          <div className="flex-1 relative">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              maxLength={12}
              placeholder="江湖人称你什么…"
              className="w-full bg-transparent border-b border-gold/25 focus:border-gold/60 outline-none py-1.5 text-ink/90 placeholder:text-ink/20 text-sm transition-colors"
            />
            {name.trim() && (
              <span className="absolute right-0 bottom-2 text-gold/30 text-[10px]">{name.trim()}</span>
            )}
          </div>
        </div>

        {/* 身份选择 */}
        <div>
          <div className="divider-gold mb-4">
            <span className="text-gold/45 text-xs tracking-widest shrink-0">择一身份</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {TEMPLATES.map((t) => {
              const isSelected = selectedTemplate.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`relative p-3 text-left border transition-all duration-200 cursor-pointer overflow-hidden group ${
                    isSelected
                      ? 'border-gold/60 bg-paper-light'
                      : 'border-gold/15 bg-paper hover:border-gold/30 hover:bg-paper-mid'
                  }`}
                  style={isSelected ? { boxShadow: '0 0 16px rgba(201,168,76,0.12), inset 0 1px 0 rgba(201,168,76,0.1)' } : {}}
                >
                  {/* 左侧选中指示条 */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[2px] transition-all duration-200 ${
                    isSelected ? 'bg-gold/70' : 'bg-transparent'
                  }`} />
                  <div className={`font-bold text-sm mb-1 transition-colors ${isSelected ? 'text-gold' : 'text-ink/70 group-hover:text-ink/90'}`}>
                    {t.name}
                  </div>
                  <div className="text-[11px] text-ink/40 leading-snug mb-2">{t.description}</div>
                  <div className={`text-[10px] tracking-wide transition-colors ${isSelected ? 'text-gold/55' : 'text-ink/25'}`}>
                    {t.talent}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedTemplate && (
            <p className="mt-2.5 text-ink/30 text-[11px] italic text-center tracking-wide">
              {selectedTemplate.flavor}
            </p>
          )}
        </div>

        {/* 资质 + 天赋 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 资质 */}
          <div>
            <div className="divider-gold mb-3">
              <span className="text-gold/45 text-xs tracking-widest shrink-0">资质</span>
            </div>
            <div className="space-y-2.5">
              {(Object.keys(STAT_LABELS) as StatKey[]).map((stat) => (
                <div key={stat} className="flex items-center gap-2.5">
                  <span className="w-5 text-gold/50 text-xs shrink-0">{STAT_LABELS[stat]}</span>
                  <StatDots value={selectedTemplate.stats[stat]} />
                  <span className="text-ink/40 text-xs ml-auto">{selectedTemplate.stats[stat]}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-ink/20 text-[10px] leading-relaxed">
              历练后可提升，每章至多 +1
            </p>
          </div>

          {/* 天赋 */}
          <div>
            <div className="divider-gold mb-3">
              <span className="text-gold/45 text-xs tracking-widest shrink-0">秉性天赋</span>
            </div>
            {talent && (
              <div className="border border-gold/15 p-3 bg-paper-mid/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-gold text-sm tracking-wide">{talent.name}</span>
                  <div className="flex-1 h-px bg-gold/10" />
                </div>
                <p className="text-ink/60 text-xs leading-relaxed">{talent.description}</p>
                <p className="text-gold/40 text-[10px] leading-relaxed border-t border-gold/10 pt-1.5">{talent.effect}</p>
              </div>
            )}
          </div>
        </div>

        {/* 开始按钮 */}
        <div className="pt-2">
          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className={`w-full py-3 border text-sm tracking-[0.3em] transition-all duration-300 relative overflow-hidden group ${
              name.trim()
                ? 'border-gold/50 text-gold cursor-pointer hover:border-gold'
                : 'border-gold/10 text-ink/15 cursor-not-allowed'
            }`}
            style={name.trim() ? { boxShadow: '0 0 0 rgba(201,168,76,0)' } : {}}
            onMouseEnter={(e) => {
              if (name.trim()) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(201,168,76,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 rgba(201,168,76,0)';
            }}
          >
            <span className="relative z-10">踏入江湖</span>
            <div className={`absolute inset-0 bg-gold/5 transition-opacity duration-300 ${name.trim() ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`} />
          </button>
          <p className="text-center text-ink/15 text-[10px] mt-2 tracking-widest">
            {name.trim() ? `以「${name.trim()}」之名，入局` : '请先留下名讳'}
          </p>
        </div>
      </div>
    </div>
  );
}
