# TDuck 填鸭表单 TRAE 插件

用自然语言在 [TDuck](https://tduck.com) 上搭建表单、题目编排、批量管理填报数据，替代登录后台手动操作。

TDuck 是一款领先的现代在线表单与数据收集平台，提供表单快速搭建、题目精细化维护、多题型支持、在线考试计分、数据收集与归档管理等能力。

## 能力列表

| 能力 | 说明 |
|---|---|
| 表单搭建与维护 | 创建 / 复制 / 编辑在线表单与主题，支持 17+ 种题型与考试自动判分 |
| 单题精细化维护 | 查询题目明细、追加单题、局部修改单题、删除单题 |
| 文件夹归档 | 创建一级归档文件夹，快速移动表单归档分类 |
| 表单数据管理 | 查询、新增（单条或批量导入）、更新、删除表单填报数据（FormData） |
| 发布与停止收集 | 一键开启表单收集并获取公开填写 URL，即时停止收集 |

## 包内结构

```
tduck/
├── .trae-plugin/plugin.json      # 插件清单
├── skills/
│   └── tduck-form/               # Skill：表单搭建与表单数据管理
│       ├── SKILL.md
│       └── references/           # 23 个工具说明、实战示例、配置指引
├── .mcp.json                     # Remote MCP 端点定义
├── connector.json                # Remote MCP Connector（OAuth 授权）
├── icon.png                      # 插件图标
└── LICENSE                       # 开源协议
```

## 认证方式

TDuck MCP 支持标准 Remote MCP OAuth 2.0 (PKCE)：首次调用工具时由 TRAE 触发 OAuth 授权，用户在 TDuck 完成登录授权后，自动携带授权 Token。

## 许可证

遵循 Apache-2.0 开源许可证。
