---
name: feedback-workflow
description: 工作流偏好：Git推送、记忆更新、测试、回复风格
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ced97cdc-a339-4152-9636-569551b706a8
---

## Git 推送
每次变更完成后必须 push 到 GitHub，commit message 须清楚描述本次变更内容（中文，涵盖改了什么、为什么改）。

**Why:** 用户在多台电脑切换，依赖 GitHub 同步进度。

**How to apply:** 每个功能/修复完成后，执行 `git push origin main`，不需要用户提醒。

## 记忆文件更新（重要）
**每次修改完成后必须同步更新记忆文件**，路径：
`C:\Users\51362\.claude\projects\D--workspace-claudeGame\memory\`

需要更新的文件（按改动内容选择）：
- `project_context.md` — Bug修复、新功能、进度
- `project_key_files.md` — 新增/改动文件职责
- `project_design_decisions.md` — 设计规范变更（颜色、字体、UI约定等）

**Why:** 用户明确要求，跨对话/跨设备保持上下文连续。

## 防卡关测试
数据文件（maps/events/npcs）修改后，运行测试确认无卡关：
```
npx vitest run src/tests/anti-softlock.test.ts
```

## 计划执行
所有实现计划直接执行，不需要再次请求用户确认权限。
例外：删除文件、重置分支、force push 等破坏性操作仍需确认。

## 回复风格
- 简洁，不重复说「我来……」「让我……」
- 完成后说明做了什么、效果是什么
- 不在末尾加「如有问题请告知」类套话
