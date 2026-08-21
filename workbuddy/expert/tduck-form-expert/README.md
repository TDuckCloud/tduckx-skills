# TDuck 表单专家（WorkBuddy Agent 型）

TDuck（填鸭表单，tduck-x-platform）表单搭建与数据管理专家，通过 TDuck MCP 用自然语言完成表单搭建、题目编排、数据增删改查与批量维护、归档管理，替代登录后台手动操作。

## 目录结构

```
tduck-form-expert/
├── .codebuddy-plugin/plugin.json   # 专家配置与市场展示信息
├── avatars/
│   └── tduck.png                   # 专家与内置 MCP 图标（512×512）
├── agents/tduck-form-expert.md     # Agent 定义（系统提示词）
├── .mcp.json                       # 内置 TDuck MCP 依赖声明（OAuth）
└── README.md
```

## 依赖

召唤本专家前，WorkBuddy 会引导用户连接 **TDuck MCP**（`https://x.tduckcloud.com/tduck-api/mcp`，支持 OAuth 2.0 PKCE 自动授权）。

## 打包提交

```bash
cd workbuddy/expert
zip -r tduck-form-expert.zip tduck-form-expert/
```
