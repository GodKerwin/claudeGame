# 游戏设计决策记录

> 记录关键设计选择及理由，避免未来会话重复踩坑。

---

## 路由：HashRouter 而非 BrowserRouter

**决策**：使用 `HashRouter`  
**理由**：GitHub Pages 不支持 SPA 的 history mode，刷新任何非根路径会返回 404。HashRouter 用 URL hash（#/path）绕过此问题。  
**影响文件**：`src/App.tsx`

---

## Vite base 路径

**决策**：`base: '/claudeGame/'`  
**理由**：GitHub Pages 部署在 `/claudeGame/` 子路径下，不设 base 会导致静态资源 404。  
**影响文件**：`vite.config.ts`

---

## 隐士结局：移除武功要求

**决策**：白衣人赠武功不检查武功属性  
**理由**：原设计要求武功≥7导致非武功职业完全无法触发隐士结局，破坏公平性。对话改为"不拘武学根底"在叙事上也更合理。  
**影响文件**：`src/data/npcs/chapter1.json`（`npc_white_stranger.wuxue_gift`）

---

## 天机安全屋：开放给所有路径

**决策**：`tianji_safehouse` 的 `requires` 设为 `null`  
**理由**：原来要求 `chapter2_join_ending` 导致非投诚路径的玩家被锁在第三章关键地点外，严重阻断流程。  
**影响文件**：`src/data/maps/chapter3.json`；`tests/data/chapter3Integrity.test.ts`（测试已同步更新）

---

## 释放结局：需要调令文书

**决策**：释放结局额外要求 `has: ["langpeng_dispatch_order"]`  
**理由**：原来只需 `langpeng_trail` flag 即可触发，缺乏叙事动机——无实物证据就放人太过随意，加调令文书让结局有据可依。  
**影响文件**：`src/data/events/chapter2.json`

---

## 动作分组阈值

**决策**：当 NPC 动作+事件动作合计 >4 条时，才显示分组标题  
**理由**：少量动作时分组增加视觉噪音；>4条时混合列表难以快速定位目标。  
**影响文件**：`src/components/layout/CenterPanel.tsx`

---

## storyText 上限50条

**决策**：`sceneStore.addStoryText` 只保留最后50条  
**理由**：无限累积导致 DOM 节点过多，长局游玩时渲染性能下降。50条足够显示当前场景上下文。  
**影响文件**：`src/store/sceneStore.ts`

---

## Map 替代 Array.find()

**决策**：`loader.ts` 所有 getter 改用 Map 缓存  
**理由**：游戏运行时频繁调用 getRoom/getEvent/getNPC 等，Array.find() 是 O(n)，Map.get() 是 O(1)。在动作构建（buildActions）中尤其明显。  
**影响文件**：`src/data/loader.ts`

---

## 孤儿物品处理原则

物品/线索只要存在于 items.json，就必须在某个事件中有实际用途（`requires.items` 或 `requires.clues`），否则玩家会无法理解其意义。  
已处理：`teahouse_token`（第三章对峙谈判）、`dafei_secret_intel`（第三章揭露情报）

---

## 五章故事规划 vs 三章实现

**现状**：游戏内内容实现了三章，但 `docs/story/story-outline.md` 已有完整五章大纲。  
**第四章**（蜀中·归鹤镇）和**第五章**（长安·天机再动）是计划中的续集内容。  
未来扩展时优先参考 story-outline.md，保持角色设定一致（顾凌霜、宋清月、韩朔、李邈等角色弧线）。
