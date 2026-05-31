import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATES, TALENTS } from '../../data/loader';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import type { CharacterTemplate } from '../../types/game';

type StatKey = 'strength' | 'agility' | 'wisdom' | 'constitution';
const STAT_LABELS: Record<StatKey, string> = {
  strength: '力量',
  agility: '敏捷',
  wisdom: '智慧',
  constitution: '根骨',
};

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
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center p-8">
      <h1 className="text-gold text-3xl mb-2 tracking-widest">天机残卷</h1>
      <p className="text-ink/50 text-sm mb-10 tracking-widest">立身江湖，从此起</p>

      <div className="w-full max-w-3xl space-y-8">
        <div className="flex gap-4 items-center">
          <label className="text-ink/60 text-sm w-16 shrink-0">角色名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="江湖人称你什么…"
            className="flex-1 bg-transparent border-b border-gold/30 focus:border-gold outline-none py-1 text-ink placeholder:text-ink/20 text-sm"
          />
        </div>

        <div>
          <p className="text-gold/60 text-xs mb-3 tracking-widest">【选一身份】</p>
          <div className="grid grid-cols-5 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`p-3 border text-sm transition-all cursor-pointer ${
                  selectedTemplate.id === t.id
                    ? 'border-gold text-gold shadow-[0_0_8px_rgba(201,168,76,0.3)]'
                    : 'border-gold/20 text-ink/60 hover:border-gold/40'
                }`}
              >
                <div className="font-bold mb-1">{t.name}</div>
                <div className="text-xs opacity-70 leading-tight">{t.description}</div>
              </button>
            ))}
          </div>
          {selectedTemplate && (
            <p className="mt-2 text-ink/40 text-xs italic">{selectedTemplate.flavor}</p>
          )}
        </div>

        <div>
          <p className="text-gold/60 text-xs mb-3 tracking-widest">【资质】</p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(STAT_LABELS) as StatKey[]).map((stat) => (
              <div key={stat} className="flex items-center gap-3">
                <span className="w-10 text-ink/60 text-sm">{STAT_LABELS[stat]}</span>
                <span className="w-8 text-center text-gold font-bold">
                  {selectedTemplate.stats[stat]}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-ink/30 text-xs">资质由身份决定，可在江湖历练中提升。</p>
        </div>

        {talent && (
          <div className="border border-gold/10 p-4">
            <p className="text-gold/60 text-xs mb-2 tracking-widest">【秉性天赋】{talent.name}</p>
            <p className="text-ink/70 text-sm">{talent.description}</p>
            <p className="text-ink/40 text-xs mt-1">{talent.effect}</p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!name.trim()}
          className={`w-full py-3 border text-base tracking-widest transition-all ${
            name.trim()
              ? 'border-gold text-gold hover:shadow-[0_0_16px_rgba(201,168,76,0.4)] cursor-pointer'
              : 'border-gold/10 text-ink/20 cursor-not-allowed'
          }`}
        >
          踏入江湖
        </button>
      </div>
    </div>
  );
}
