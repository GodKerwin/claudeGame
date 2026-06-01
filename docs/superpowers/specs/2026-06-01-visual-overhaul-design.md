# 天机残卷 视觉美化设计文档

## 目标

在保持现有深色宣纸 + 金色调调性的基础上，通过 CSS/SVG 装饰元素显著提升古风质感。全屏叙事页加入水墨山水氛围，游戏界面加入传统窗棂式角花装饰，整体「装饰在留白处生长，不与文字竞争」。

## 设计原则

- 全部用 CSS + 内联 SVG 实现，零外部资源依赖
- 装饰元素透明度克制，不干扰文字阅读
- 保持现有三栏响应式布局不变
- 不改变任何游戏逻辑或数据层

---

## 一、全局设计语言

### 1.1 色板扩展

在 `tailwind.config.ts` 中新增两个 token：

| Token | 值 | 用途 |
|---|---|---|
| `cinnabar` | `#7a1a1a` | 危险选项、结局标题等极少数强调点 |
| `mist` | `rgba(200,184,136,0.06)` | 山水背景渲染层（作为 CSS 变量使用） |

### 1.2 可复用装饰组件

#### `CornerFrame`（角花边框）

一个 React 组件，接受 `children`，在内容四角叠加 L 形细线装饰（SVG 绘制）。规格：
- 角花大小：12px × 12px
- 线宽：1px，颜色 `gold/30`（hover 时 `gold/50`）
- 通过 `absolute` 定位在容器四角，不影响内部布局
- 支持 `size` prop（`sm` = 8px，`md` = 12px，`lg` = 16px）

用于：主菜单标题框、右面板外框、左面板外框。

#### `DiamondDivider`（菱形分割线）

替换 `RightPanel` 中 `SectionHeader` 的圆点 + 横线组合：
- 中心一个旋转 45° 的正方形（3px × 3px，`gold/40`）
- 两侧向外延伸的细横线（`gold/10`）
- 标签文字居中悬浮于线上

#### `MountainBackground`（山水背景层）

一个 SVG 组件，渲染三层叠山剪影：
- 远山（第三层）：`fill: rgba(201,168,76,0.05)`，顶部有高斯模糊 `filter: blur(2px)`
- 中山（第二层）：`fill: rgba(201,168,76,0.07)`
- 近山（第一层）：`fill: rgba(20,13,4,0.8)` 与背景融合，形成前景感
- 山顶渐变：通过 `linearGradient` 从山色过渡到透明，模拟云雾
- 组件固定在页面底部，`pointer-events: none`，`z-index: 0`
- 宽度 100vw，高度约 45vh

---

## 二、全屏叙事页

### 2.1 主菜单（`MainMenu.tsx`）

**背景层：**
- 引入 `MountainBackground` 组件，固定在页面底部
- 现有 `radial-gradient` 保留，叠加在山水之上

**标题区：**
- 用 `CornerFrame`（size `lg`）包裹标题"天机残卷"及副标题
- 框内顶部/底部各加一道 `gold/15` 细横线（上下留 12px padding）
- 标题字号保持 `text-5xl`，字间距保持 `tracking-[0.3em]`

**印章装饰：**
- 在标题框右上角叠加一个极淡的方形印纹 SVG（旋转 5°，`gold/8` 透明度）
- 内容为「天機」两字，字体用 serif，仅作背景纹理

**菜单按钮：**
- 每个按钮在 hover 时，左右两侧出现短横线（`::before`/`::after` 实现，宽 8px，`gold/40`）
- 视觉效果：`── 新游戏 ──`（hover 才出现横线）

### 2.2 序章（`Prologue.tsx`）

**左侧竖向装饰：**
- 在文字区左侧约 24px 处加一条竖细线（`gold/10`，高度为文字区高度）
- 线上方浮动极淡竖排文字"大唐开元"（`text-[9px] gold/12 writing-mode: vertical-rl`）

**背景增强：**
- 现有顶部 / 底部装饰线保留
- 新增一个从中心向外扩散的椭圆暗晕（`radial-gradient`，`rgba(0,0,0,0.3)` 到透明），覆盖屏幕中央，增加纵深感

### 2.3 章节结束（`ChapterEnd.tsx`）

**章节标题：**
- "第X章·完"文字改为用 `CornerFrame`（size `sm`）包裹
- 标题颜色从 `gold` 改为 `gold/90`，加轻微字体阴影 `textShadow: '0 0 30px rgba(201,168,76,0.4)'`

**结局文字：**
- 结局正文左侧加 `border-l-2 border-gold/20` + `pl-4`（已有类似处理，统一规范）

**背景：**
- 引入 `MountainBackground` 组件（与主菜单共用），透明度稍高（整体 opacity 0.7）

### 2.4 结局图鉴（`EndingGallery.tsx`）& 关于页（`Credits.tsx`）

- 页面顶部加 `CornerFrame` 包裹页面标题
- 背景加轻量山水层（opacity 0.5）

---

## 三、三栏游戏界面

### 3.1 面板边框（`GameLayout.tsx`）

- 左面板（`w-44` 容器）：外层用 `CornerFrame`（size `sm`）包裹
- 右面板（`w-[210px]` 容器）：外层用 `CornerFrame`（size `sm`）包裹
- 中间栏不加角花（文字区，留白优先）

### 3.2 Section Header（`RightPanel.tsx`）

将现有 `SectionHeader` 函数替换为使用 `DiamondDivider` 组件：

```
旧：  ● ──── 身家底细 ────
新：  ◆ ──── 身家底细 ────
```

中心菱形颜色 `gold/40`，两侧线 `gold/10`。

### 3.3 房间标题（`CenterPanel.tsx`）

现有：`── 往事客栈 ──`（两侧渐变线）

新增：线的两端各加一个小菱形端点（`◆`，`gold/25`，`text-[8px]`）

效果：`◆ ── 往事客栈 ── ◆`

### 3.4 案件时间线节点（`RightPanel.tsx`）

- 所有节点：从 `rounded-full`（圆形）改为 `rotate-45`（旋转 45° 的正方形 = 菱形）
- 最新条目节点：`bg-gold/25 border-gold/55`（保持醒目）
- 已过去节点：`bg-transparent border-gold/20`

### 3.5 操作区背景纹理（`CenterPanel.tsx`）

在操作区 `div` 的内联 `style` 中，在现有渐变之上叠加斜向细纹：

```css
background:
  repeating-linear-gradient(
    135deg,
    transparent,
    transparent 20px,
    rgba(201,168,76,0.015) 20px,
    rgba(201,168,76,0.015) 21px
  ),
  linear-gradient(to bottom, rgba(20,13,4,0) 0%, rgba(20,13,4,0.4) 100%);
```

纹理极淡（1.5% 透明度），仅在光线角度下可见，类似古代缎纹纸。

### 3.6 左面板导航按钮（`LeftPanel.tsx`）

- 当前地点的左侧 border 从 `border-gold/30` 加深为 `border-gold/50`，加 `pl-2`
- 可前往按钮的箭头 `›` 改为 `▸`，与全局操作区风格统一

---

## 四、实现顺序

1. **色板 + 公共组件**：`tailwind.config.ts` 扩展色板；新建 `src/components/ui/CornerFrame.tsx`、`src/components/ui/DiamondDivider.tsx`、`src/components/ui/MountainBackground.tsx`
2. **全屏页改造**：`MainMenu`、`Prologue`、`ChapterEnd`、`EndingGallery`、`Credits`
3. **游戏界面改造**：`GameLayout`、`RightPanel`、`CenterPanel`、`LeftPanel`
4. **CSS 全局微调**：`index.css` 补充新 utility class

---

## 五、不在本次范围内

- 字体替换（已有 LXGW WenKai，不做变动）
- 动画系统重构
- 移动端布局结构改变
- 任何游戏逻辑修改
