# 天机残卷 视觉美化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 通过纯 CSS/SVG 装饰元素，在不改变任何游戏逻辑的前提下，为全屏叙事页添加水墨山水背景，为游戏界面添加传统角花与菱形装饰，全面提升古风质感。

**Architecture:** 新建三个纯展示型 React 组件（CornerFrame、DiamondDivider、MountainBackground），扩展 Tailwind 色板，然后依次改造全屏页和三栏游戏界面。所有变更均为 UI 层，不接触 engine / store / data 任何文件。

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3, 内联 SVG

---

## 文件结构

**新建：**
- `src/components/ui/CornerFrame.tsx` — 四角 L 形线框装饰容器
- `src/components/ui/DiamondDivider.tsx` — 菱形分割线（替换 SectionHeader）
- `src/components/ui/MountainBackground.tsx` — 三层叠山 SVG 背景

**修改：**
- `tailwind.config.ts` — 新增 `cinnabar` 色
- `src/index.css` — 新增 `.btn-jianghu` hover 横线效果
- `src/pages/MainMenu/MainMenu.tsx`
- `src/pages/Prologue/Prologue.tsx`
- `src/pages/ChapterEnd/ChapterEnd.tsx`
- `src/pages/EndingGallery/EndingGallery.tsx`
- `src/pages/Credits/Credits.tsx`
- `src/components/layout/GameLayout.tsx`
- `src/components/layout/RightPanel.tsx`
- `src/components/layout/CenterPanel.tsx`
- `src/components/layout/LeftPanel.tsx`

> 注：这些是纯视觉组件，无业务逻辑。每个 Task 的验证方式是：运行 `npm run test` 确保现有 153 个游戏逻辑测试全部通过（证明未破坏游戏逻辑），然后 `npm run dev` 目视检查效果。

---

## Task 1：扩展色板 & 全局 CSS

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`

- [ ] **Step 1: 在 tailwind.config.ts 中添加 cinnabar 色**

将 `tailwind.config.ts` 中 `colors` 块修改为：

```ts
colors: {
  paper: '#1a1208',
  'paper-mid': '#221a0a',
  'paper-light': '#2a2010',
  ink: '#e8d5a3',
  'ink-soft': '#c8b888',
  gold: '#c9a84c',
  'gold-bright': '#dfc06a',
  blood: '#8b1a1a',
  cinnabar: '#7a1a1a',
  jade: '#3a7a5a',
},
```

- [ ] **Step 2: 在 index.css 中添加按钮 hover 横线效果**

在 `@layer components` 块末尾添加：

```css
/* 江湖按钮 hover 横线效果 */
.btn-jianghu {
  position: relative;
}
.btn-jianghu::before,
.btn-jianghu::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 0;
  height: 1px;
  background: rgba(201, 168, 76, 0.5);
  transition: width 0.2s ease;
}
.btn-jianghu::before {
  right: 100%;
  margin-right: 6px;
  transform: translateY(-50%);
}
.btn-jianghu::after {
  left: 100%;
  margin-left: 6px;
  transform: translateY(-50%);
}
.btn-jianghu:hover::before,
.btn-jianghu:hover::after {
  width: 10px;
}
```

- [ ] **Step 3: 运行测试确认无破坏**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望输出：`153 passed`（或原有通过数）

- [ ] **Step 4: 提交**

```bash
git add tailwind.config.ts src/index.css
git commit -m "style: extend color palette with cinnabar, add btn-jianghu hover effect"
```

---

## Task 2：CornerFrame 组件

**Files:**
- Create: `src/components/ui/CornerFrame.tsx`

- [ ] **Step 1: 创建 CornerFrame.tsx**

```tsx
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
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 3: 提交**

```bash
git add src/components/ui/CornerFrame.tsx
git commit -m "feat(ui): add CornerFrame decorative corner ornament component"
```

---

## Task 3：DiamondDivider 组件

**Files:**
- Create: `src/components/ui/DiamondDivider.tsx`

- [ ] **Step 1: 创建 DiamondDivider.tsx**

```tsx
// src/components/ui/DiamondDivider.tsx
interface Props {
  label: string;
}

export function DiamondDivider({ label }: Props) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1 h-px bg-gold/10" />
      <div
        className="w-[5px] h-[5px] bg-gold/40 shrink-0"
        style={{ transform: 'rotate(45deg)' }}
      />
      <span className="text-gold/40 text-[10px] tracking-[0.25em] shrink-0">{label}</span>
      <div
        className="w-[5px] h-[5px] bg-gold/40 shrink-0"
        style={{ transform: 'rotate(45deg)' }}
      />
      <div className="flex-1 h-px bg-gold/10" />
    </div>
  );
}
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 3: 提交**

```bash
git add src/components/ui/DiamondDivider.tsx
git commit -m "feat(ui): add DiamondDivider section header component"
```

---

## Task 4：MountainBackground SVG 组件

**Files:**
- Create: `src/components/ui/MountainBackground.tsx`

- [ ] **Step 1: 创建 MountainBackground.tsx**

```tsx
// src/components/ui/MountainBackground.tsx
interface Props {
  opacity?: number;
}

export function MountainBackground({ opacity = 1 }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        height: '45vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
      }}
    >
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="xMidYMax slice"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 远山顶部雾化渐变 */}
          <linearGradient id="mist-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(201,168,76,0)" />
            <stop offset="60%" stopColor="rgba(201,168,76,0.05)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0.05)" />
          </linearGradient>
          {/* 中山渐变 */}
          <linearGradient id="mist-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(201,168,76,0)" />
            <stop offset="50%" stopColor="rgba(201,168,76,0.07)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0.07)" />
          </linearGradient>
          {/* 近山：与背景色融合 */}
          <linearGradient id="near-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(26,18,8,0)" />
            <stop offset="40%" stopColor="rgba(26,18,8,0.85)" />
            <stop offset="100%" stopColor="rgba(26,18,8,1)" />
          </linearGradient>
        </defs>

        {/* 远山 — 极淡，柔和丘陵 */}
        <path
          d="M0,320 C80,300 180,285 300,270 C420,255 520,265 640,255
             C760,245 860,258 980,248 C1100,238 1220,252 1340,262
             C1380,266 1420,264 1440,265 L1440,400 L0,400 Z"
          fill="url(#mist-far)"
        />

        {/* 中山 — 有明显峰势 */}
        <path
          d="M0,360 C60,330 140,280 240,245 C320,218 400,240 480,222
             C560,204 630,165 720,178 C800,190 870,162 960,148
             C1050,134 1140,165 1230,195 C1320,225 1390,255 1440,270
             L1440,400 L0,400 Z"
          fill="url(#mist-mid)"
        />

        {/* 近山 — 最高峰，与背景融合 */}
        <path
          d="M0,400 L0,375 C40,355 100,310 180,275 C240,250 300,268 360,252
             C420,236 470,195 540,178 C610,161 660,185 720,172
             C780,159 830,130 900,118 C970,106 1020,135 1080,158
             C1140,181 1190,210 1250,240 C1310,270 1380,315 1440,350
             L1440,400 Z"
          fill="url(#near-grad)"
        />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 3: 提交**

```bash
git add src/components/ui/MountainBackground.tsx
git commit -m "feat(ui): add MountainBackground ink-wash SVG component"
```

---

## Task 5：主菜单页改造

**Files:**
- Modify: `src/pages/MainMenu/MainMenu.tsx`

- [ ] **Step 1: 重写 MainMenu.tsx**

完整替换文件内容（保留所有逻辑，只改 JSX 结构和样式）：

```tsx
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useSaveStore } from '../../store/saveStore';
import { loadFromSlot, loadAllSlots } from '../../engine/saveEngine';
import { getSeenEndings } from '../../engine/endingRecord';
import { CornerFrame } from '../../components/ui/CornerFrame';
import { MountainBackground } from '../../components/ui/MountainBackground';

export default function MainMenu() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { loadItems } = useInventoryStore();
  const { setSlots } = useSaveStore();

  const slots = loadAllSlots();
  const autoSave = slots.find((s) => s.id === 0);
  const hasContinue = !!autoSave?.data;
  const hasAnyEnding = getSeenEndings().length > 0;

  const saveFlags: string[] = autoSave?.data?.flags ?? [];
  const saveSubtitle = saveFlags.includes('chapter3_started')
    ? '第三章·鸢归何处'
    : saveFlags.includes('chapter2_started')
    ? '第二章·东市风云'
    : '第一章·长安往事';

  const handleContinue = () => {
    const data = loadFromSlot(0);
    if (!data) return;
    player.setPlayer(data.player);
    scene.loadState({
      currentRoomId: data.currentRoomId,
      flags: data.flags ?? [],
      clues: data.clues ?? [],
      questLog: data.questLog ?? [],
      storyText: (data.storyText ?? []).slice(-20),
      seenDialogues: data.seenDialogues ?? [],
      visitedRooms: data.visitedRooms ?? [data.currentRoomId],
    });
    loadItems(data.inventory);
    setSlots(loadAllSlots());
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center relative overflow-hidden">
      {/* 山水背景 */}
      <MountainBackground opacity={0.9} />

      {/* 内容层 */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 印章装饰（极淡背景） */}
        <div
          className="absolute -top-8 -right-10 text-gold/8 text-5xl font-serif select-none pointer-events-none"
          style={{ transform: 'rotate(8deg)', letterSpacing: '0.05em' }}
          aria-hidden
        >
          天機
        </div>

        {/* 标题区（角花框） */}
        <CornerFrame size="lg" className="text-center px-10 py-6 mb-14">
          {/* 框内顶部细线 */}
          <div className="w-full h-px bg-gold/15 mb-4" />
          <h1 className="text-gold text-5xl tracking-[0.3em]" style={{ textShadow: '0 0 40px rgba(201,168,76,0.25)' }}>
            天机残卷
          </h1>
          <p className="text-ink/30 text-sm tracking-widest mt-2">
            {hasContinue ? saveSubtitle : '第一章·长安往事'}
          </p>
          {/* 框内底部细线 */}
          <div className="w-full h-px bg-gold/15 mt-4" />
        </CornerFrame>

        {/* 菜单按钮 */}
        <div className="flex flex-col gap-4 w-64">
          <button
            onClick={() => navigate('/create')}
            className="btn-jianghu py-3 border border-gold/40 text-ink hover:border-gold hover:text-gold tracking-widest transition-all cursor-pointer"
          >
            新游戏
          </button>

          {hasContinue && autoSave?.data && (
            <button
              onClick={handleContinue}
              className="btn-jianghu py-3 border border-gold/20 text-ink/60 hover:border-gold/40 hover:text-ink/80 tracking-widest transition-all text-sm cursor-pointer"
            >
              继续游戏
              <span className="block text-xs text-ink/30 mt-0.5">
                {autoSave.data.player.name} · {new Date(autoSave.timestamp).toLocaleDateString('zh-CN')}
              </span>
            </button>
          )}

          {hasAnyEnding && (
            <button
              onClick={() => navigate('/endings')}
              className="btn-jianghu py-2 text-ink/30 hover:text-ink/50 tracking-widest transition-all text-xs cursor-pointer"
            >
              结局图鉴
            </button>
          )}

          <button
            onClick={() => navigate('/credits')}
            className="btn-jianghu py-2 text-ink/30 hover:text-ink/50 tracking-widest transition-all text-xs cursor-pointer"
          >
            关于
          </button>
        </div>
      </div>

      <p className="absolute bottom-6 text-ink/15 text-xs tracking-widest z-10">
        天机残卷 · 三章完结
      </p>
    </div>
  );
}
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 3: 提交**

```bash
git add src/pages/MainMenu/MainMenu.tsx
git commit -m "style(main-menu): add mountain background, corner frame title, jianghu buttons"
```

---

## Task 6：序章页改造

**Files:**
- Modify: `src/pages/Prologue/Prologue.tsx`

- [ ] **Step 1: 修改 Prologue.tsx 中的 return 块**

在 `Prologue.tsx` 中，将 `return (` 后的 JSX 替换为以下内容（逻辑部分 useEffect/useState/useMemo 保持完全不变，只改 JSX）：

```tsx
  return (
    <div
      className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center px-8 py-16 relative"
      onClick={!showButton ? handleSkip : undefined}
      style={{ cursor: !showButton ? 'pointer' : 'default' }}
    >
      {/* 背景：中央暗晕增加纵深感 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 50% 60% at 50% 50%, rgba(0,0,0,0.35) 0%, transparent 70%),
            radial-gradient(ellipse 70% 50% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 100%)
          `,
        }}
      />

      {/* 跳过提示 */}
      {showSkip && !showButton && (
        <button
          onClick={(e) => { e.stopPropagation(); handleSkip(); }}
          className="fixed top-5 right-6 text-[11px] text-ink/20 hover:text-ink/40 cursor-pointer tracking-[0.3em] transition-colors"
        >
          跳过
        </button>
      )}

      {/* 顶部装饰线 */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-px h-16 transition-opacity duration-1000"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.25))', opacity: visibleCount > 0 ? 1 : 0 }}
      />

      <div className="max-w-md w-full relative z-10 flex gap-6">
        {/* 左侧竖向装饰 */}
        <div
          className="shrink-0 flex flex-col items-center gap-1 transition-opacity duration-1000"
          style={{ opacity: visibleCount > 1 ? 1 : 0 }}
          aria-hidden
        >
          <div className="w-px flex-1 bg-gold/10" />
          <span
            className="text-gold/12 text-[9px] select-none"
            style={{ writingMode: 'vertical-rl', letterSpacing: '0.15em' }}
          >
            大唐开元
          </span>
          <div className="w-px flex-1 bg-gold/10" />
        </div>

        {/* 正文 */}
        <div className="flex-1">
          {playerName && visibleCount > 0 && (
            <p
              className="text-gold/25 text-[10px] tracking-[0.4em] text-center mb-8 transition-opacity duration-1000"
              style={{ opacity: visibleCount > 0 ? 1 : 0 }}
            >
              {playerName} 的故事
            </p>
          )}

          <div className="space-y-6">
            {lines.map((line, i) => (
              <p
                key={i}
                className={`leading-[2] transition-all duration-1000 ${
                  i < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } ${
                  i >= genericCount
                    ? 'text-gold/65 text-sm border-l border-gold/25 pl-4 ml-2'
                    : i === 0 || i === 1
                    ? 'text-gold/50 text-sm tracking-widest text-center'
                    : 'text-ink/80 text-[15px]'
                }`}
                style={{ transitionDelay: `${i < visibleCount ? 0 : 100}ms` }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* 进入按钮 */}
          <div
            className={`mt-16 text-center transition-all duration-700 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-px bg-gold/25" />
              <span className="text-gold/30 text-[10px] tracking-widest">一切已定</span>
              <div className="w-12 h-px bg-gold/25" />
            </div>
            <button
              onClick={() => navigate('/game')}
              className={`btn-jianghu border border-gold/50 text-gold/80 px-12 py-2.5 text-sm tracking-[0.3em] transition-all duration-300 hover:border-gold hover:text-gold ${showButton ? 'cursor-pointer' : 'pointer-events-none'}`}
              style={{ boxShadow: '0 0 0 rgba(201,168,76,0)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(201,168,76,0.2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 rgba(201,168,76,0)'; }}
            >
              踏入江湖
            </button>
            <p className="mt-3 text-ink/15 text-[10px] tracking-widest">点击任意处可跳过</p>
          </div>
        </div>
      </div>

      {/* 底部装饰线 */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-px h-16 transition-opacity duration-1000"
        style={{ background: 'linear-gradient(to top, transparent, rgba(201,168,76,0.15))', opacity: visibleCount > 0 ? 1 : 0 }}
      />
    </div>
  );
```

同时在文件顶部 import 列表中加入：

```tsx
import { CornerFrame } from '../../components/ui/CornerFrame';
```

（本页 CornerFrame 暂不用，但后续可能复用，现在加入备用即可；若 lint 报 unused import，则先不加。）

实际本页不需要 CornerFrame 和 MountainBackground，只改了背景 radial-gradient 和新增左侧竖向装饰，以及「踏入江湖」按钮加了 `btn-jianghu` class。

- [ ] **Step 2: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 3: 提交**

```bash
git add src/pages/Prologue/Prologue.tsx
git commit -m "style(prologue): add vertical side ornament and deeper background vignette"
```

---

## Task 7：章节结束页改造

**Files:**
- Modify: `src/pages/ChapterEnd/ChapterEnd.tsx`

- [ ] **Step 1: 在文件顶部添加 import**

在 `ChapterEnd.tsx` 现有 import 列表后追加：

```tsx
import { CornerFrame } from '../../components/ui/CornerFrame';
import { MountainBackground } from '../../components/ui/MountainBackground';
```

- [ ] **Step 2: 找到 ChapterEnd 的 return 块，替换 JSX**

当前 return 块从 `return (` 到文件结尾，将整个 JSX 替换为：

```tsx
  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden">
      <MountainBackground opacity={0.7} />

      <div className="max-w-md w-full relative z-10">
        <div className="space-y-8">
          {lines.map((line, i) => {
            const isTitle = i === 0;
            const isClueHeader = line === '【你所掌握的线索】';
            const isClueItem = line.startsWith('· ');

            const content = (
              <p
                key={i}
                className={`leading-[2] transition-all duration-1000 ${
                  i < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } ${
                  isTitle
                    ? 'text-gold/90 text-xl tracking-[0.3em] text-center'
                    : isClueHeader
                    ? 'text-gold/50 text-xs tracking-widest text-center'
                    : isClueItem
                    ? 'text-ink/60 text-sm pl-4 border-l border-gold/20'
                    : 'text-ink/80 text-[15px] border-l-2 border-gold/20 pl-4'
                }`}
                style={{
                  transitionDelay: `${i < visibleCount ? 0 : 100}ms`,
                  textShadow: isTitle ? '0 0 30px rgba(201,168,76,0.4)' : undefined,
                }}
              >
                {line}
              </p>
            );

            return isTitle ? (
              <CornerFrame key={i} size="sm" className="inline-block w-full text-center py-3 px-8">
                {content}
              </CornerFrame>
            ) : content;
          })}
        </div>

        <div
          className={`mt-16 text-center transition-all duration-700 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-px bg-gold/20" />
            <div className="w-[5px] h-[5px] bg-gold/30" style={{ transform: 'rotate(45deg)' }} />
            <div className="w-8 h-px bg-gold/20" />
          </div>
          <button
            onClick={handleContinue}
            className="btn-jianghu border border-gold/40 text-gold/75 px-12 py-2.5 text-sm tracking-[0.3em] hover:border-gold hover:text-gold transition-all cursor-pointer"
          >
            {isChapter3 ? '回到主菜单' : '前往下一章'}
          </button>
        </div>
      </div>
    </div>
  );
```

注意：`handleContinue` 函数和所有 state/useMemo 保持不变，只有 JSX 替换。

- [ ] **Step 3: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 4: 提交**

```bash
git add src/pages/ChapterEnd/ChapterEnd.tsx
git commit -m "style(chapter-end): add mountain background and corner frame on chapter title"
```

---

## Task 8：EndingGallery & Credits 页改造

**Files:**
- Modify: `src/pages/EndingGallery/EndingGallery.tsx`
- Modify: `src/pages/Credits/Credits.tsx`

- [ ] **Step 1: 修改 EndingGallery.tsx**

在 import 列表末尾加：

```tsx
import { CornerFrame } from '../../components/ui/CornerFrame';
import { MountainBackground } from '../../components/ui/MountainBackground';
```

将外层 `<div className="min-h-screen bg-paper...">` 替换为：

```tsx
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center py-12 px-6 relative overflow-hidden">
      <MountainBackground opacity={0.5} />
      <div className="w-full max-w-2xl relative z-10">
        <div className="flex items-baseline justify-between mb-10">
          <CornerFrame size="sm" className="px-4 py-2">
            <h1 className="text-gold text-2xl tracking-[0.2em]">结局图鉴</h1>
          </CornerFrame>
          <span className="text-ink/30 text-sm tracking-widest">
            {unlockedCount} / {ENDINGS.length} 已解锁
          </span>
        </div>
        {/* 以下 byChapter.map 内容不变 */}
```

并在 `</div>` 闭合前（最外层 div 关闭前）保留原有的关闭标签。

- [ ] **Step 2: 修改 Credits.tsx**

在 import 列表末尾加：

```tsx
import { CornerFrame } from '../../components/ui/CornerFrame';
import { MountainBackground } from '../../components/ui/MountainBackground';
```

将 return 块替换为：

```tsx
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
```

- [ ] **Step 3: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 4: 提交**

```bash
git add src/pages/EndingGallery/EndingGallery.tsx src/pages/Credits/Credits.tsx
git commit -m "style(gallery,credits): add mountain background and corner frames"
```

---

## Task 9：GameLayout 面板角花

**Files:**
- Modify: `src/components/layout/GameLayout.tsx`

- [ ] **Step 1: 在 GameLayout.tsx 顶部添加 import**

```tsx
import { CornerFrame } from '../ui/CornerFrame';
```

- [ ] **Step 2: 用 CornerFrame 包裹左面板和右面板**

找到 Desktop 三栏布局中的左面板 div：

```tsx
<div className="w-44 shrink-0 panel border-r border-gold/15 flex flex-col overflow-hidden">
  {left}
</div>
```

替换为：

```tsx
<CornerFrame size="sm" className="w-44 shrink-0 panel border-r border-gold/15 flex flex-col overflow-hidden">
  {left}
</CornerFrame>
```

找到右面板 div：

```tsx
<div className="shrink-0 panel flex flex-col overflow-hidden" style={{ width: '210px' }}>
  {right}
</div>
```

替换为：

```tsx
<CornerFrame size="sm" className="shrink-0 panel flex flex-col overflow-hidden" style={{ width: '210px' }}>
  {right}
</CornerFrame>
```

- [ ] **Step 3: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 4: 提交**

```bash
git add src/components/layout/GameLayout.tsx
git commit -m "style(layout): add corner frame ornaments to left and right panels"
```

---

## Task 10：RightPanel — 菱形分割线 + 菱形时间线节点

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

- [ ] **Step 1: 添加 DiamondDivider import**

在 `RightPanel.tsx` 顶部 import 列表末尾加：

```tsx
import { DiamondDivider } from '../ui/DiamondDivider';
```

- [ ] **Step 2: 替换 SectionHeader 函数**

找到并删除当前的 `SectionHeader` 函数（约第 60–68 行）：

```tsx
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-1 h-1 rounded-full bg-gold/35 shrink-0" />
      <span className="text-gold/40 text-[10px] tracking-[0.25em]">{label}</span>
      <div className="flex-1 h-px bg-gold/10" />
    </div>
  );
}
```

替换为：

```tsx
function SectionHeader({ label }: { label: string }) {
  return <DiamondDivider label={label} />;
}
```

- [ ] **Step 3: 修改时间线节点样式**

找到时间线节点的 span（约第 160 行）：

```tsx
<span className={`shrink-0 mt-[3px] w-[7px] h-[7px] rounded-full border transition-colors ${
  i === timelineEntries.length - 1
    ? 'border-gold/50 bg-gold/20'
    : 'border-gold/20 bg-transparent'
}`} />
```

替换为：

```tsx
<span
  className={`shrink-0 mt-[3px] w-[6px] h-[6px] border transition-colors ${
    i === timelineEntries.length - 1
      ? 'border-gold/55 bg-gold/25'
      : 'border-gold/20 bg-transparent'
  }`}
  style={{ transform: 'rotate(45deg)' }}
/>
```

- [ ] **Step 4: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 5: 提交**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "style(right-panel): replace section headers with diamond dividers, diamond timeline nodes"
```

---

## Task 11：CenterPanel — 菱形房间标题端点 + 操作区纹理

**Files:**
- Modify: `src/components/layout/CenterPanel.tsx`

- [ ] **Step 1: 修改房间标题行**

找到房间标题区（约第 139–143 行）：

```tsx
<div className="px-5 py-3 border-b border-gold/10 flex items-center gap-3">
  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold/15" />
  <h2 className="text-gold/85 text-sm tracking-[0.2em] shrink-0">{roomName}</h2>
  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold/15" />
</div>
```

替换为：

```tsx
<div className="px-5 py-3 border-b border-gold/10 flex items-center gap-2">
  <div
    className="w-[5px] h-[5px] bg-gold/20 shrink-0"
    style={{ transform: 'rotate(45deg)' }}
  />
  <div className="flex-1 h-px bg-gradient-to-r from-gold/15 to-transparent" />
  <h2 className="text-gold/85 text-sm tracking-[0.2em] shrink-0">{roomName}</h2>
  <div className="flex-1 h-px bg-gradient-to-l from-gold/15 to-transparent" />
  <div
    className="w-[5px] h-[5px] bg-gold/20 shrink-0"
    style={{ transform: 'rotate(45deg)' }}
  />
</div>
```

- [ ] **Step 2: 修改操作区背景，叠加斜纹**

找到操作区 div（约第 164–167 行）：

```tsx
<div
  className="flex-[2] min-h-0 flex flex-col border-t border-gold/10 px-4 pt-3 pb-3"
  style={{ background: 'linear-gradient(to bottom, rgba(20,13,4,0) 0%, rgba(20,13,4,0.4) 100%)' }}
>
```

替换为：

```tsx
<div
  className="flex-[2] min-h-0 flex flex-col border-t border-gold/10 px-4 pt-3 pb-3"
  style={{
    background: `
      repeating-linear-gradient(
        135deg,
        transparent,
        transparent 20px,
        rgba(201,168,76,0.015) 20px,
        rgba(201,168,76,0.015) 21px
      ),
      linear-gradient(to bottom, rgba(20,13,4,0) 0%, rgba(20,13,4,0.4) 100%)
    `,
  }}
>
```

- [ ] **Step 3: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 4: 提交**

```bash
git add src/components/layout/CenterPanel.tsx
git commit -m "style(center-panel): add diamond room title endpoints and subtle diagonal texture"
```

---

## Task 12：LeftPanel 细节优化

**Files:**
- Modify: `src/components/layout/LeftPanel.tsx`

- [ ] **Step 1: 加深当前地点左侧 border，将 › 改为 ▸**

找到当前地点的 `<p>` 标签（约第 60 行）：

```tsx
<p className="text-ink/85 text-sm leading-snug pl-1 border-l border-gold/30">
  {room?.name ?? '—'}
</p>
```

替换为：

```tsx
<p className="text-ink/90 text-sm leading-snug pl-2 border-l-2 border-gold/50">
  {room?.name ?? '—'}
</p>
```

找到可前往按钮中的箭头（约第 68 行）：

```tsx
<span className="text-gold/30 group-hover:text-gold/60 transition-colors text-[10px]">›</span>
```

替换为：

```tsx
<span className="text-gold/30 group-hover:text-gold/60 transition-colors text-[10px]">▸</span>
```

找到已锁定出口中的箭头（约第 82 行）：

```tsx
<span className="text-[10px] text-ink/15 shrink-0 mt-0.5">›</span>
```

替换为：

```tsx
<span className="text-[10px] text-ink/15 shrink-0 mt-0.5">▸</span>
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test -- --run
```

期望：`153 passed`

- [ ] **Step 3: 提交并推送**

```bash
git add src/components/layout/LeftPanel.tsx
git commit -m "style(left-panel): stronger current location border, unified arrow glyphs"
git push origin main
```

---

## 自查记录

**Spec 覆盖检查：**
- ✅ 色板扩展（cinnabar）→ Task 1
- ✅ CornerFrame 组件 → Task 2
- ✅ DiamondDivider 组件 → Task 3
- ✅ MountainBackground SVG → Task 4
- ✅ 主菜单：山水背景、标题角花、印章装饰、按钮横线 → Task 5
- ✅ 序章：左侧竖向装饰、背景暗晕增强 → Task 6
- ✅ 章节结束：山水背景、章节标题角花 → Task 7
- ✅ 结局图鉴 + 关于页：山水背景、角花 → Task 8
- ✅ GameLayout 左右面板角花 → Task 9
- ✅ RightPanel 菱形分割线 + 菱形时间线节点 → Task 10
- ✅ CenterPanel 菱形端点 + 斜纹纹理 → Task 11
- ✅ LeftPanel border 加深 + 箭头统一 → Task 12

**Placeholder 检查：** 无 TBD/TODO，所有步骤包含完整代码。✓

**类型一致性：** CornerFrame `size` prop 在 Task 2 定义为 `'sm' | 'md' | 'lg'`，Task 5–10 调用时均使用该类型的合法值。✓
