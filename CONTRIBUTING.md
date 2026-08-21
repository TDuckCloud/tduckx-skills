# 贡献指南 (Contributing)

感谢您对 TDuck（填鸭表单）官方 Skill 的关注与支持！

本项目包含 TDuck 官方 MCP Skill 定义与各 AI 客户端接入配置。我们非常欢迎社区贡献文档修正、实战调用示例、新增题型适配与改进建议。

## 如何贡献

- **文档与示例优化**：欢迎直接提交 Pull Request。
- **问题与异常反馈**：若在使用 MCP 工具时遇到非预期行为，请提交 Issue 并附上复现步骤与客户端环境（如 Cursor / Claude Desktop 版本）。
- **新功能与工具建议**：欢迎提出 Issue 讨论使用场景。

## 提交前核对清单

在提交 PR 之前，请确保：

1. **隐私安全**：绝不包含任何真实的 AppId、AppSecret、Access Token 或个人敏感数据。
2. **结构规范**：保持 `skills/tduck/` 目录规范完备。
3. **内容验证**：若修改了工具参数定义，请务必与 TDuck 后端 `FormMcpTools` 保持严格一致。

## 目录索引

- [TDuck MCP 接入配置指南](skills/tduck/references/guide.md)
- [TDuck MCP 23 个工具参考手册](skills/tduck/references/tools.md)
- [TDuck MCP 实战调用示例](skills/tduck/references/examples.md)

## 项目维护

本项目由 TDuck 核心研发团队共同维护。
