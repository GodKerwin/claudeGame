---
name: execution-style
description: 用户希望直接执行，无需确认；每次修改后更新记忆文件并 push GitHub
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ced97cdc-a339-4152-9636-569551b706a8
---

直接执行所有命令，无需事先请求确认。

**Why:** 用户明确表示希望高效执行，减少不必要的确认步骤。

**How to apply:**
- 编辑文件、运行脚本、安装依赖、git 操作等普通命令直接执行
- 仅在删除文件、强制推送、删除分支等不可逆/破坏性操作前确认
- **每次修改完成后**：更新相关记忆文件，然后 commit + push GitHub
- 记忆文件路径：`C:\Users\51362\.claude\projects\D--workspace-claudeGame\memory\`

多任务计划执行方式：**始终选择子代理驱动（superpowers:subagent-driven-development）**，不使用本会话内联执行。

**Why:** 用户明确表示"这类问题以后都选1"——子代理驱动出错影响范围小、速度快。

**How to apply:** writing-plans 完成后直接调用 superpowers:subagent-driven-development，无需询问用户。

子代理执行期间工具调用：**所有工具调用自动同意，无需弹出确认**。用户明确说"所有都同意，不用再问了"。
