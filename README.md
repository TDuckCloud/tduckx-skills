# TDuck（填鸭表单）Skill

[![skills.sh](https://skills.sh/b/tduck/tduck-skill)](https://skills.sh/tduck/tduck-skill)
[![TDuck](https://img.shields.io/badge/TDuck-OpenAPI%20V2%20%26%20MCP-blue.svg)](https://tduck.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

TDuck（填鸭表单）官方 Skill，基于 TDuck 原生 MCP (Model Context Protocol) 服务与 OpenAPI V2 引擎构建，让 AI 助手通过自然语言完成表单搭建、在线考试测评、数据收集管理、题目安全防误删校验与对外公开查询页自动化。

---

## 适合谁使用

- **业务团队与运营**：希望通过 AI 助手快速创建问卷、活动报名、在线考试，或查询、统计和维护表单收集数据。
- **开发者与技术团队**：希望让 AI Agent 自动化设计题目、批量录入填报数据、修改表单配置或处理日常数据流。
- **自动化工作流用户**：正在将 TDuck 接入 MCP 客户端（Cursor、Claude Code、Windsurf 等）、Agent 或企业级自动化工作流。

---

## 快速开始

### 1. 配置 MCP 连接器

TDuck MCP Server 地址：
```text
https://x.tduckcloud.com/tduck-api/mcp
```

> **认证方式说明**：
> - **方式 A（开放平台 API 密钥，推荐）**：在 TDuck 管理后台 ->「开放 API / 开发者设置」获取 `appId` 与 `appSecret`，在 Headers 中携带 Basic 认证，**永久有效、永不掉线、无弹窗打扰**。
> - **方式 B（OAuth 2.0 自动授权）**：直接填入上述端点，现代 AI 客户端（如 Cursor、Claude Desktop）将通过 **OAuth 2.0 (PKCE)** 自动拉起浏览器进行一键授权。
>
> 💡 **小贴士（批量替换端点地址）**：若需修改为您的实际私有化部署域名，可直接运行：
> ```bash
> node ./skills/tduck/scripts/replace_endpoint.js https://x.tduckcloud.com/tduck-api
> ```

#### 客户端配置示例

##### 选项 A：使用开放平台 API 密钥（永久有效 · 推荐）
可运行辅助脚本一键生成带认证的配置片段：
```bash
node ./skills/tduck/scripts/setup.js --print-json YOUR_APP_ID YOUR_APP_SECRET
```
或手动在客户端 `mcp.json` 中配置：
```json
{
  "mcpServers": {
    "tduck": {
      "url": "https://x.tduckcloud.com/tduck-api/mcp",
      "headers": {
        "Authorization": "Basic <appId:appSecret的Base64编码>"
      }
    }
  }
}
```

##### 选项 B：使用 OAuth 2.0 自动授权
- **Cursor (`.cursor/mcp.json`) / Claude Desktop (`claude_desktop_config.json`)**：
```json
{
  "mcpServers": {
    "tduck": {
      "url": "https://x.tduckcloud.com/tduck-api/mcp"
    }
  }
}
```

---

### 2. 安装 Skill

推荐使用 [skills CLI](https://www.skills.sh/) 一键安装：

```bash
# 装到当前项目（默认）
npx skills add TDuckCloud/tduckx-skills

# 装到用户全局，并指定 AI 客户端（如 Claude Code / Cursor 等）
npx skills add TDuckCloud/tduckx-skills -g -a claude-code
```

支持 Claude Code、Codex、Cursor、OpenCode、Windsurf 等 50+ 客户端。

也可以手动安装：将 `skills/tduck/` 目录放入你的 AI 客户端 Skill 目录，重启客户端使其加载。

---

### 3. 验证

在对话里发送：
> “列出我在 TDuck 里的表单”

如果 AI 助手能返回你的表单列表，说明连接成功。

---

## 支持的能力

- **表单与考试设计**：创建 / 复制 / 修改 / 全量重置 / 发布 / 停用 / 删除表单；支持 17+ 种核心题型（单选、多选、文本填空、日期、下拉选择、附件上传等），支持在线考试标准答案配置、分值设定与提交后自动判分。
- **题目单项维护**：支持单道题目的动态追加、属性与选项编辑、题目删除。
- **题目安全防误删**：提供 `check_field_data` 历史填报数据安全预检，在删除题目或选项前自动校验历史数据，防止误删造成数据丢失。
- **附件与文件直传**：支持通过 `get_upload_ticket` 获取免密直传预签名凭据与 curl 命令（杜绝 Base64 与 Token 截断），以及 `upload_file` 网络图片转存并挂载到表单。
- **数据与填报管理**：支持填报数据分页查询、数据明细查看、单条录入、批量提交导入（单批最高 100 条）、局部字段更新与数据删除。
- **分组归档管理**：支持表单归档文件夹创建、查询与表单跨目录移动归档。
- **对外公开查询页**：为表单一键创建、配置与启停对外自助查询页（Opensearch），供访客凭借手机号、准考证号等凭证自助查询结果。

---

## 使用示例

**用户**：帮我创建一个“2026 春季校园招聘”简历投递表，要姓名（必填）、手机号（必填）、应聘岗位（单选）、简历附件上传。建好后直接帮我发布。  
**助手**：（调用 `create_form` 创建表单结构，并调用 `publish_form` 发布，返回表单 Key 与公开填写链接）

**用户**：帮我建一个“Java 基础知识测验”，3 道题，每题 10 分，总分 30 分，配好标准答案。  
**助手**：（调用 `create_form` 创建考试表单，自动为题目配置 `type: "EXAM"`、`exam.score` 及 `exam.answer`）

**用户**：我想把这个表单里的“所属部门”题目删掉。  
**助手**：（先调用 `check_field_data` 检查发现已有 20 条历史填报数据，主动提示用户确认数据丢失风险；确认后调用 `delete_form_item` 执行删除）

**用户**：统计一下这次报名表里应聘“后端研发”的数据有哪些，把状态更新为“已初筛”。  
**助手**：（调用 `query_form_data` 条件检索，展示匹配数据明细并二次确认，确认后调用 `update_form_data` 批量/逐条更新）

**用户**：为这次考试成绩开启一个对外查询页，让考生凭手机号查询成绩。  
**助手**：（调用 `create_opensearch_query` 配置查询条件与展示字段，返回对外公开查询链接）

> 💡 更多场景参见 [`skills/tduck/references/examples.md`](skills/tduck/references/examples.md)，每个工具的完整输入 / 输出参见 [`skills/tduck/references/tools.md`](skills/tduck/references/tools.md)，安装与避坑指引参见 [`skills/tduck/references/guide.md`](skills/tduck/references/guide.md)。

---

## 目录结构

```text
.
├── skills/tduck/
│   ├── SKILL.md                 # 能力定义与使用规范
│   ├── references/
│   │   ├── tools.md             # 33 个 MCP 工具的完整输入 / 输出 / 错误参考
│   │   ├── guide.md             # 安装配置、权限机制与常见避坑指引
│   │   └── examples.md          # 典型场景的 Prompt 与工具调用链路示例
│   └── scripts/
│       ├── setup.js             # MCP 安装与配置辅助脚本 (生成 mcp.json)
│       └── replace_endpoint.js  # 批量替换 MCP 端点地址辅助脚本
└── icons/
    └── icon.svg                 # 品牌图标
```

---

## 维护状态

本项目由 TDuck 团队维护。问题与建议请提交至本仓库 Issues。

---

## License

[Apache-2.0](LICENSE)

