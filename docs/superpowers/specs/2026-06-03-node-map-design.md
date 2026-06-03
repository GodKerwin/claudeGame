# 节点地图：场景关系可视化 — Design Spec

**日期：** 2026-06-03  
**目标：** 将左侧面板的场景列表替换为手工定位的节点地图，以矩形框 + 连线显示场景间的通行关系，提升玩家的空间感知和沉浸感。

---

## 一、核心设计原则

1. **手工定位（Option A）**：每章地图的节点坐标在代码中手动指定，三章各一套布局，确保视觉叙事精准。
2. **一键导航**：点击可到达的场景矩形框，直接跳转（等同于现有行为）。
3. **场景化锁定**：无法到达的场景显示虚线框，悬停或点击后出现沉浸式文案，而非技术性的 flag 说明。
4. **保持面板宽度**：左侧面板继续维持 176px（`w-44`），不改变三栏布局比例。

---

## 二、视觉规范

### 节点样式

| 状态 | 边框 | 背景 | 文字 |
|------|------|------|------|
| 当前所在 | `gold/70` 实线 1.5px | `gold/15` | `gold/95` + `●` |
| 可前往（未访问） | `gold/35` 实线 1px | `transparent` | `ink/80` |
| 可前往（已访问） | `gold/20` 实线 1px | `transparent` | `ink/45` + `·访` |
| 锁定 | `ink/18` 虚线 (3,3) 1px | `transparent` | `ink/20` |

- 节点尺寸：`72 × 22 px`，圆角 `rx=2`
- 节点内文字：`9px serif`，单行截断
- 连线：`rgba(201,168,76,0.22)` 实线 1px；若连线终点为锁定节点，改为 `rgba(201,168,76,0.10)` 虚线

### 锁定提示

点击锁定节点时，在节点正下方弹出一行浮层文字（绝对定位），样式：
- 背景：`rgba(14,9,3,0.92)` + `border gold/20`
- 文字：`10px text-ink/55 italic`
- 自动 1.5s 后消失，或点击其他地方关闭

---

## 三、三章坐标布局

SVG 视口统一 `width="100%"` `viewBox="0 0 156 {height}"`，节点中心点坐标如下：

### 第一章（viewBox height = 220）

```
节点 ID               中心 (cx, cy)    显示名
room_202              (117, 18)        凶案现场
room_203              (39,  18)        二〇三号客房
lobby                 (78,  60)        客栈大堂  ← 起点/枢纽
kitchen               (18,  105)       后厨
cellar                (78,  105)       地窖
forest                (132, 105)       城郊树林
old_mansion           (78,  160)       废弃宅院
back_alley            (132, 160)       城郊后巷
```

连线（格式：from → to）：
- room_203 → lobby
- room_203 → room_202
- lobby → kitchen
- lobby → cellar
- lobby → forest
- lobby → old_mansion
- forest → back_alley

### 第二章（viewBox height = 185）

```
节点 ID               中心 (cx, cy)    显示名
east_market_entrance  (78,  18)        东市入口  ← 枢纽
huichuntang           (18,  70)        回春堂
antique_shop          (78,  70)        西市古玩铺
cien_temple           (138, 70)        慈恩寺偏院
pingkang_hideout      (108, 130)       平康坊据点
imperial_teahouse     (108, 168)       皇城茶馆  ← 锁定
```

连线：
- east_market → huichuntang, antique_shop, cien_temple
- huichuntang → cien_temple
- cien_temple → pingkang_hideout
- pingkang_hideout → imperial_teahouse

### 第三章（viewBox height = 155）

```
节点 ID               中心 (cx, cy)    显示名
dayan_pagoda          (30,  55)        大雁塔下
tianji_safehouse      (126, 55)        天机安宅
feiyes_manor          (78,  105)       飞爷故居  ← 枢纽
qujiang_pavilion      (78,  145)       曲江亭  ← 锁定
```

连线：
- dayan_pagoda → feiyes_manor
- tianji_safehouse → feiyes_manor
- feiyes_manor → qujiang_pavilion

---

## 四、场景化锁定文案

```typescript
const LOCK_MESSAGES: Record<string, string> = {
  kitchen:             '厨娘守着门口，掌柜没发话，闲人免进。',
  cellar:              '铜锁沉沉挂着——掌柜还没有开口信任你。',
  forest:              '城郊的路还没走的理由，先把客栈的事理清。',
  old_mansion:         '大门纹丝不动——铁证未齐，推不开这扇门。',
  back_alley:          '后巷通往何处，得先找到那条踪迹才知道。',
  imperial_teahouse:   '那个方向，你还没有可以追寻的踪迹。',
  qujiang_pavilion:    '池畔的亭子，你尚不知晓那里有谁在等。',
};
```

---

## 五、足迹区块

节点地图下方保留「足迹」区块（已访问的本章房间列表），样式维持现有实现不变。

---

## 六、文件改动

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `src/data/mapLayouts.ts` | 三章节点坐标、锁定文案、显示名常量 |
| 修改 | `src/components/layout/LeftPanel.tsx` | 用 SVG 节点地图替换原有"前往"列表 |

不涉及其他文件。`LeftPanel` 的 `onNavigate` props 接口不变，`Game.tsx` 无需修改。

---

## 七、交互细节

1. **点击可达节点** → 调用 `onNavigate(roomId)`，与现有行为完全一致
2. **点击锁定节点** → 显示锁定文案浮层（1.5s 自动消失）；不触发导航
3. **点击当前节点** → 无操作
4. **hover 可达节点** → border 加亮（`gold/55`）；cursor: pointer
5. **hover 锁定节点** → cursor: not-allowed；可选：轻微抖动动画

---

## 八、不做的事（明确排除）

- 不做动画连线（性能 + 风格不符）
- 不改面板宽度
- 不做章节间地图切换动画
- 不做节点展开/折叠
- 不自动计算坐标（坚持手工定位）
