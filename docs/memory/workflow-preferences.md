# 工作流偏好

## Git 推送规范

**每次代码修改后必须推送到 GitHub**。

```bash
git add <具体文件>
git commit -m "feat/fix/perf/ux/ci: 清晰描述改动内容"
git push
```

commit message 格式：
- `feat:` 新功能
- `fix:` Bug 修复
- `perf:` 性能优化
- `ux:` 交互/体验优化
- `ci:` CI/部署相关
- `docs:` 文档更新

每条 commit 应清晰说明**具体改了什么**，不写"minor fix"这种模糊描述。

---

## 多设备协作

用户在两台电脑上使用 Claude Code。为了跨设备记忆共享：

1. **项目记忆位置**：`/Users/xuli/claudeGame/docs/memory/`
2. **每次大型修改后**：更新 `completed-work.md`，必要时更新其他记忆文件
3. **推送到 GitHub**：记忆文件随代码一起推送，另一台设备 pull 后即可访问
4. **本地记忆**：`/Users/xuli/.claude/projects/-Users-xuli/memory/` 仅作为当前设备补充

---

## GitHub Token 注意事项

- Token 需要 `repo` + `workflow` 两个 scope（workflow scope 用于更新 deploy.yml）
- Token 在 `git remote set-url origin https://<token>@github.com/GodKerwin/claudeGame.git` 中设置
- 如果推送失败提示权限问题，立即告知用户重新生成 token

---

## 测试

修改游戏数据/引擎后必须运行：

```bash
npx vitest run
```

当前 105 个测试用例，全部通过才能提交。

---

## 开发服务器

```bash
npm run dev
```

本地预览地址：http://localhost:5173（base path 不含 /claudeGame/，仅线上部署时需要）
