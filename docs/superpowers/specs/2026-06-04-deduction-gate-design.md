# 三层推理裁定系统 Design Spec

**日期：** 2026-06-04

## 目标

在三章结局前加入主动推理验证，让合成系统真正有意义，并给玩家"我说出了答案"的仪式感。

## 三层架构

```
探查 / 合成
    ↓
Layer 1 (C)  合成补强：非真相结局也需至少完成核心合成
    ↓
Layer 2 (A)  推理裁定：进入最终对质前答对 3 道推断题
    ↓
Layer 3 (B)  证据出示：选择真相结局时手动出示关键物证
    ↓
结局
```

---

## Layer 1：合成补强

**问题：** 当前只有真相结局（truth/arrest/expose）强制要求 `synth_*` flags；其他结局可完全绕过合成系统。

**方案：** 为每章的非真相结局 `requires.flags` 追加一个最低合成 flag——代表"至少理解了这是一起预谋案"。

| 章节 | 结局 | 追加条件 |
|---|---|---|
| ch1 | force_ending | `synth_double_kill` |
| ch1 | hermit_ending | `synth_double_kill` |
| ch2 | release_ending | `synth_ch2_li_mao_commands_langpeng` |
| ch2 | join_ending | `synth_ch2_li_mao_commands_langpeng` |
| ch3 | standoff_ending | `synth_ch3_fei_ye_confirmed` |
| ch3 | join_forces | `synth_ch3_fei_ye_confirmed` |

---

## Layer 2：推理裁定（Verdict）

### 触发逻辑
玩家第一次与最终对质事件交互、且未持有 `deduction_verified_ch{n}` flag 时，在操作区显示推理裁定面板替代行动列表。玩家答对全部 3 题后授予该 flag，随后事件正常开放。

### 数据结构

```typescript
interface VerdictOption { id: string; text: string; }
interface VerdictQuestion {
  id: string;
  text: string;
  options: VerdictOption[];
  correctId: string;
}
interface ChapterVerdict {
  chapterId: number;
  eventId: string;          // 拦截哪个事件
  grantFlag: string;
  failText: string;
  questions: VerdictQuestion[];
}
```

数据文件：`src/data/verdicts/chapter{1-3}.json`

### 各章题目

**Chapter 1（触发事件：`evt_final_confrontation`，授予：`deduction_verified_ch1`）**

| 题目 | 正确答案 | 错误选项 |
|---|---|---|
| 宋怀义遇害的方式是？ | 毒茶先致昏，再遭勒毙——双重手法 | 直接被勒死 / 砒霜直接毒杀 |
| 凶手的根本作案动机是？ | 夺回天机阁名单，灭口知情人 | 劫财 / 私人仇怨 |
| 凶手如何进出案发现场？ | 密道入室，翻窗越墙而出 | 正门进出 / 翻窗入密道出 |

**Chapter 2（触发事件：`evt_li_mao_encounter`，授予：`deduction_verified_ch2`）**

| 题目 | 正确答案 | 错误选项 |
|---|---|---|
| 浪鹏帮行动的幕后指挥是？ | 李邈——浪鹏帮是他的工具 | 浪鹏帮自行行动 / 无迹和尚 |
| 无迹和尚在此案中的角色是？ | 天机阁旧部，毒剂配方来源，被利用而非主谋 | 主谋之一 / 与案无关 |
| 宋怀义来长安的真正目的是？ | 交接天机阁名单，完成情报传递 | 经商 / 向官府自首 |

**Chapter 3（触发事件：`evt_fei_ye_confrontation`，授予：`deduction_verified_ch3`）**

| 题目 | 正确答案 | 错误选项 |
|---|---|---|
| 飞爷的真实身份是？ | 天机阁创立者，代号「鸢」 | 廷尉府卧底 / 宋怀义的仇人 |
| 真正威胁天机阁遗留成员的势力是？ | 廷尉府某一层级，追杀名单上的人 | 李邈余党 / 浪鹏帮 |
| 飞爷为何主动安排了这次相遇？ | 需要一个可信任的人来收尾这件旧案 | 想借官府之力 / 准备投降 |

### UI 行为
- 3 题一次性全部展示（radio 单选）
- 「提交推断」按钮：全对 → 授予 grantFlag + 显示成功提示 + 面板关闭；有错 → 高亮错误题目 + 显示 failText，可重选重提交

---

## Layer 3：证据出示（Evidence Gate）

### 数据结构

在 `EventAction` 上追加可选字段：

```typescript
interface EvidenceGate {
  prompt: string;
  accepts: string[];   // 任意一件即可
  failText: string;
}
// EventAction 新增：
evidenceGate?: EvidenceGate;
```

### 各章配置

| 章节 | 行动 | prompt | accepts |
|---|---|---|---|
| ch1 | `truth_ending` | 在开口之前，将最关键的物证推到桌上。 | `arsenic_evidence`, `medical_report`, `blood_letter` |
| ch2 | `arrest_ending` | 「证据确凿」——请出示证明李邈亲自下令的文书。 | `langpeng_dispatch_order` |
| ch3 | `expose_truth` | 你将哪件物证推到他面前？ | `tianji_founding_scroll` |

### 触发流程
1. 玩家点击含 `evidenceGate` 的行动
2. Game.tsx 设置 `pendingEvidenceGate` 状态（**新增独立状态，不复用 pendingInterrogation**）
3. CenterPanel 显示出示证据 UI（复用 pendingInterrogation 视觉层）
4. 出示正确 → 执行原行动 `result` 文字 + `grants`
5. 出示错误 → 显示 `failText`，可重选

---

## 文件改动清单

| 操作 | 文件 |
|---|---|
| 修改 | `src/types/game.ts`：新增 VerdictOption/VerdictQuestion/ChapterVerdict/EvidenceGate，EventAction 加 evidenceGate |
| 新建 | `src/data/verdicts/chapter1.json` |
| 新建 | `src/data/verdicts/chapter2.json` |
| 新建 | `src/data/verdicts/chapter3.json` |
| 修改 | `src/data/loader.ts`：加载并导出 `getVerdict(chapterId)` |
| 修改 | `src/data/events/chapter1.json`：force/hermit 加 synth 条件；truth_ending 加 evidenceGate |
| 修改 | `src/data/events/chapter2.json`：release/join 加 synth 条件；arrest_ending 加 evidenceGate |
| 修改 | `src/data/events/chapter3.json`：standoff/join_forces 加 synth 条件；expose_truth 加 evidenceGate |
| 修改 | `src/pages/Game/Game.tsx`：新增 pendingVerdict / pendingEvidenceGate 状态及处理函数 |
| 修改 | `src/components/layout/CenterPanel.tsx`：新增 verdict 面板 UI |
