# TDuck（填鸭表单）MCP 使用指南

> 一句话介绍：让 AI 助手直接读写你的 TDuck 表单——"AI 搭表单、设计在线考试、改题换肤、查回收数据、批量导入与改状态、成绩自助查询"都能用一句中文搞定，彻底告别频繁切换管理后台手工操作。

---

## 一、 适用场景

| 角色 / 领域 | 典型业务场景 | 核心价值 |
| :--- | :--- | :--- |
| 👥 **HR / 行政** | 校园招聘简历投递、员工入职信息登记、培训签到、健康打卡、满意度调查 | 10 秒生成规范登记表，附件简历自动归集，批量导出花名册 |
| 🎯 **市场 / 运营** | 活动报名、用户调研问卷、线索收集、裂变登记、会务接待 | 一句话配置防刷限额与邮件通知，按城市/渠道快速筛选有效线索 |
| 🎓 **教育 / 培训** | 随堂测验、期末考试、知识竞赛、岗位技能考核（支持自动判分） | 自动配置题型、分值、标准答案与解析，生成对外自助查分通道 |
| 🛒 **销售 / 客服** | 意向客户留资、工单报修、售后回访登记、跟进状态批量批量更新 | 对话中快速检索客户历史记录，直接批量修改跟进状态 |
| 💻 **开发 / IT 运维** | 内部需求提报、Bug 反馈收集、设备领用资产登记、私有化表单接入 | 原生 REST/MCP 双轨接入，支持企业内网私有化部署与自动化集成 |

> **共同特征**：需求已经在文档、会议纪要或聊天对话中明确，不想再登录后台机械地“点击新建 → 拖拉拽题目 → 逐个设置校验 → 导出 Excel”手工重复操作。

---

## 二、 分步安装与配置

### 前置条件

1. **TDuck 账号**：
   - 公有云/测试环境：[tduckcloud.com](https://x.tduckcloud.com) 或企业对应云服务地址；
   - 私有化部署：您团队或企业部署的 TDuck 实例地址（如 `https://form.yourcompany.com`）。
2. **支持 MCP 的 AI 客户端**：
   - Cursor、Claude Desktop、Trae、Workbuddy、Windsurf、VSCode (Continue/Roo Code) 等均可无缝接入。

TDuck MCP 服务端点：
- **公共云/测试环境**：`https://x.tduckcloud.com/tduck-api/mcp`
- **私有化部署环境**：`https://{your-domain}/tduck-api/mcp`（请替换为实际域名）

TDuck MCP 原生支持两种鉴权方式，任选其一即可：
- **方式 A · 开放 API 密钥（Basic Auth，强烈推荐）**：配置一次长期有效，无需浏览器频繁弹窗，稳定性高，适合高频使用与私有化环境。
- **方式 B · OAuth 2.0 自动授权（PKCE）**：在客户端内点击一键调起浏览器授权，无需手动管理和复制密钥字符串。

---

### 方式 A · 开放 API 密钥认证（推荐 · 永久有效）

#### Step A1 · 获取 API 密钥 (AppId & AppSecret)
1. 登录 TDuck 管理后台。
2. 进入「个人中心 / 开发者设置 → 开放 API」。
3. 创建并复制你的 **AppId** 与 **AppSecret**（请妥善保管，若泄露可随时在后台重置）。

#### Step A2 · 生成 Basic 认证凭证与配置
可直接运行自带的辅助脚本一键生成完整配置（推荐）：
```bash
node ./skills/tduck/scripts/setup.js --print-json YOUR_APP_ID YOUR_APP_SECRET
```

或手动在本地终端执行命令将 `AppId` 和 `AppSecret` 拼接并进行 Base64 编码：

```bash
# macOS / Linux:
echo -n "YOUR_APP_ID:YOUR_APP_SECRET" | base64

# Windows PowerShell:
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("YOUR_APP_ID:YOUR_APP_SECRET"))
```

输出的 Base64 字符串（形如 `dGR1Y2tfYXBwXzAxOmFia...`）即为凭证内容。

#### Step A3 · 在各客户端中配置连接

##### 1. Cursor (`.cursor/mcp.json` 或设置中的 MCP Servers)
打开项目根目录下的 `.cursor/mcp.json`（或在 Cursor Settings → Features → MCP 中添加）：

```json
{
  "mcpServers": {
    "tduck": {
      "url": "https://x.tduckcloud.com/tduck-api/mcp",
      "headers": {
        "Authorization": "Basic BASE64_ENCODED_CREDENTIALS"
      }
    }
  }
}
```

##### 2. Claude Desktop
打开 Claude Desktop 配置文件：
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

写入以下配置：

```json
{
  "mcpServers": {
    "tduck": {
      "url": "https://x.tduckcloud.com/tduck-api/mcp",
      "headers": {
        "Authorization": "Basic BASE64_ENCODED_CREDENTIALS"
      }
    }
  }
}
```

##### 3. Trae
进入 Trae 设置 → **MCP**，点击 **Add Server**：
- **Name**: `tduck`
- **Type**: `SSE` 或 `HTTP`
- **URL**: `https://x.tduckcloud.com/tduck-api/mcp`
- **Headers**:
  - Key: `Authorization`
  - Value: `Basic BASE64_ENCODED_CREDENTIALS`

##### 4. Workbuddy / CodeBuddy
在 Workbuddy 连接器管理中点击「添加自定义连接器」，填入：
- **名称**: `TDuck 表单`
- **URL**: `https://x.tduckcloud.com/tduck-api/mcp`
- **请求头**: `Authorization: Basic BASE64_ENCODED_CREDENTIALS`

---

### 方式 B · OAuth 2.0 自动授权

#### Step B1 · 添加 TDuck 连接器
1. 打开 AI 客户端的 **MCP / Connectors** 管理界面。
2. 选择 **添加连接器 (Add Custom Server / Connector)**。
3. 填入：
   - **名称**: `tduck` 或 `TDuck 填鸭表单`
   - **URL**: `https://x.tduckcloud.com/tduck-api/mcp`
4. 点击保存/连接。

#### Step B2 · 浏览器授权确认
1. 客户端将自动弹出系统浏览器或登录页面。
2. 登录您的 TDuck 账号（手机号/邮箱/扫码均可）。
3. 在授权确认页勾选所需权限（`tduck:all`）并点击 **确认授权**。
4. 授权成功后自动重定向回客户端，连接状态显示为 ✅ 即表示完成。

---

### Step · 首次连通性验证（两种方式通用）

在客户端对话框中直接发送一句中文指令：

> “列出我 TDuck 账号下最近的 5 个表单”

若 AI 助手能够成功列出表单名称、表单 Key 及收集状态，说明全链路已配置成功！🎉

---

## 三、 实战效果与案例展示

### 案例 1｜一句话搭建全功能表单并立即发布

**输入指令：**
> “帮我创建一个‘2026 春季校园招聘简历投递表’，包含：姓名（必填）、性别（单选：男/女）、手机号（必填）、应聘岗位（下拉单选：前端研发/后端研发/产品经理）、个人简历（附件上传）。设置主色调为科技蓝（#1890FF），开启每个 IP 限填 1 次，有新提交发送邮件到 hr@example.com。创建完成后直接发布并把填写链接给我。”

**传统手工操作 vs TDuck MCP 对比：**

| 维度 | 传统手工后台搭建 | TDuck MCP 一句话搞定 |
| :--- | :--- | :--- |
| **操作链路** | 登录后台 → 新建空白表单 → 拖拽 5 个组件 → 逐一修改标题/选项/必填 → 切换到主题设置选配色 → 切换到扩展设置配防刷与邮件通知 → 点击发布并复制链接 | **发出一句自然语言指令** |
| **耗时** | 8 ~ 15 分钟 | **约 5 ~ 10 秒** |
| **出错率** | 容易漏设必填、漏配邮件通知或未限制 IP 刷票 | **一次性完整生成结构、主题与全局设置** |

**AI 执行结果：**
- 自动规划题目唯一 ID（`q_name`, `q_gender`, `q_phone`, `q_position`, `q_resume`）
- 自动挂载主题配色与防刷防重复配置
- 自动调用 `publish_form` 开启收集，返回公开填写地址：`https://x.tduckcloud.com/tduck-api/s/hr2026spring`

---

### 案例 2｜一句话生成在线考试卷（带标准答案与自动判分）

**输入指令：**
> “帮我创建一个‘Java 核心技术随堂测评’考试卷，包含 2 道单选题和 1 道多选题，每题 10 分，总分 30 分，配置好标准答案和解析说明，提交后允许考生查看得分与答案。”

**AI 执行结果：**
- 自动将表单类型指定为 `type: "EXAM"`
- 单选题配置 `exam: { score: 10, answer: "B", answerAnalysis: "..." }`
- 多选题配置 `exam: { score: 10, scoringType: 1, answer: ["A", "B", "C"], answerAnalysis: "..." }`
- 创建完成后直接即可作为在线考试使用，考生提交后系统毫秒级完成判分并展示解析。

---

### 案例 3｜条件精准查询与敏感数据脱敏展示

**输入指令：**
> “查询表单 `hr2026spring` 中应聘岗位为‘后端研发’且在 2026-08-01 之后提交的记录，按时间倒序展示前 10 条，只要姓名、手机号、应聘岗位和简历链接，手机号记得打马赛克。”

**AI 输出效果（脱敏展示）：**

| 序号 | 姓名 | 手机号 | 应聘岗位 | 个人简历 | 提交时间 |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 1 | 张*伟 | 138****0001 | 后端研发 | [查看简历 PDF](https://x.tduckcloud.com/...) | 2026-08-20 11:00:00 |
| 2 | 李*强 | 139****5678 | 后端研发 | [查看简历 PDF](https://x.tduckcloud.com/...) | 2026-08-20 10:15:30 |
| … | … | … | … | … | … |

> **核心价值**：查询结果位于大模型上下文内，可直接指令 AI 接续后续动作——例如：“根据这几位候选人的简历写一段面试初筛评语”或“整理为 CSV 发送到工作群”。

---

### 案例 4｜批量导入花名册 / 批量修改状态

**输入指令：**
> “把这 3 条客户信息批量录入到表单 `customer_form` 中：
> 1. 陈志强，13800138000，深圳，VIP 客户
> 2. 林小雨，13900139000，上海，普通客户
> 3. 周建国，13700137000，北京，意向客户”

**AI 执行过程：**
1. 先调用 `get_form_detail` 读取表单题目字段 ID 映射关系；
2. 自动整理为结构化数组，调用 `batch_submit_form_data`（单批最多 100 条）一次性写入；
3. 输出：“批量导入成功！成功写入 3 条记录。”

---

### 案例 5｜题目安全维护与历史数据防误删预检

**输入指令：**
> “把表单 `hr2026spring` 里的‘微信号’这道题删掉。”

**AI 安全执行链路：**
1. AI **不会直接删除**，而是先调用 `check_field_data(formKey, itemId="q_wechat")` 预检；
2. 若检测到历史提交中已有数据，AI 会主动告警：“⚠️ 该题目在历史填报中已有 42 条关联数据，直接删除会导致这些历史填报内容无法查看，请确认是否仍要删除？”；
3. 用户明确确认后，再调用 `delete_form_item` 执行物理删除，确保企业业务数据万无一失。

---

### 案例 6｜一键开启成绩 / 结果对外公开自助查询页

**输入指令：**
> “为表单 `java_exam_2026` 开启一个对外成绩公开查询页，标题叫‘2026 春季 Java 测评成绩查询’，允许考生凭手机号（q_phone）自主查询自己的得分。”

**AI 执行结果：**
- 自动调用 `create_opensearch_query`，将 `q_phone` 设置为查询凭证字段；
- 返回对外自助查询地址，考生打开链接输入手机号即可查到对应成绩与批注。

---

## 四、 常见误区 & 实战 Tips

### ⚠️ 常见误区

1. **误区 1：“用户说中文字段名，AI 就能直接写进数据库”**
   - ❌ **错误**：直接用中文作为字段名（如 `{"姓名": "张三"}`）写入。
   - ✅ **事实**：TDuck V2 采用扁平规范模型，数据 Payload 的键是题目自定义 `id`（如 `q_name`、`q_phone`）。AI 每次录入或更新前都会先调用 `get_form_detail` 拿到字段映射再写入。您直接对 AI 说中文即可，AI 会自动完成底层映射转换。
2. **误区 2：“已发布（RELEASE）的表单可以随意全量覆盖题目”**
   - ❌ **错误**：在收集中状态下直接调用 `replace_form_items` 或 `update_form(items=...)` 会被服务端拦截报错。
   - ✅ **事实**：为防止正在作答的用户遇到题序错乱，已发布的表单若需重构题目，应先 `stop_form` 停止收集，覆盖修改后再 `publish_form`；若只是微调单道题目，推荐使用单题工具 `add_form_item` / `update_form_item`。
3. **误区 3：“本地大图或头图直接转超长 Base64 塞进字段”**
   - ❌ **错误**：把数兆大小的图片 Base64 字符串塞入 `headImgUrl`，导致客户端 Token 爆掉或请求体被网关拦截。
   - ✅ **事实**：TDuck 提供 `get_upload_ticket` 直传机制，AI 会获取预签名凭证并给出极简命令在本地秒传文件流换取真实公网 `fileUrl`；网络图片也可直接通过 `upload_file(remoteUrl="...")` 由服务端抓取转存。
4. **误区 4：“普通表单随意配置 exam 计分节点”**
   - ❌ **错误**：在 `type: "ORDINARY"` 的表单题目中传入 `exam` 节点。
   - ✅ **事实**：`exam` 配置为在线考试专属；创建表单时必须显式指定 `type: "EXAM"` 才能配置分值与标准答案。
5. **误区 5：“批量导入可以一次性丢几千条”**
   - ❌ **错误**：单次调用 `batch_submit_form_data` 传入超过 100 条数据。
   - ✅ **事实**：单批导入上限为 100 条；若需导入大批量数据，分批循环提交即可。

---

### 💡 实战 Tips

- **✨ 先「看一眼」再动手**：修改未知表单前，让 AI 先 `get_form_detail` 确认题目 ID 与选项，精准度 100%。
- **✨ 批量操作带时间或数量范围**：查询填报数据时指定“最近 7 天”或“前 50 条”，响应更快、Token 消耗更低。
- **✨ 敏感数据主动要求脱敏**：在指令中加上“手机号打码”“身份证隐藏中间 8 位”，AI 会自动完成合规脱敏输出。
- **✨ 两步法做数据统计分析**：第一步让 MCP 拉取填报数据明细，第二步让 AI 基于本地 Python/代码解释器绘制统计图或生成数据透视表。
- **✨ 固化常用 Prompt 模板**：
  - *“每周一上午 9 点汇总表单 [formKey] 过去 7 天的新增报名人数与岗位分布”*
  - *“将这段招聘需求文本转化为标准招聘表单并立即发布”*

---

### 🆘 常见问题与排错速查表

| 现象 / 报错信息 | 根本原因 | 解决方案 |
| :--- | :--- | :--- |
| **HTTP 401 Unauthorized** | API 凭证未配置或失效、Basic 编码错误 | 检查 `AppId:AppSecret` 是否正确，确认请求头携带了 `Basic ` 前缀（注意有空格）。 |
| **表单不存在: xxx** | `formKey` 输入有误或表单已被删除 | 调用 `list_forms` 重新确认有效的表单 Key。 |
| **已发布表单不可直接修改题目** | 表单正处于 `RELEASE` 状态 | 先调用 `stop_form` 停止收集，修改完成后再调用 `publish_form`；或使用 `update_form_item` 单题维护。 |
| **题目 id 重复: q_xxx** | 同一表单内定义了两个相同 ID 的题目 | 确保每个题目的 `id`（如 `q_name`, `q_age`）在当前表单中唯一。 |
| **items[i].exam 仅允许用于 EXAM 表单** | 普通表单（ORDINARY）配置了考试分值节点 | 创建考试表单时显式指定 `type: "EXAM"`。 |
| **exam.answer 不存在于 options: xxx** | 考试题标准答案未在 options 选项列表中定义 | 检查标准答案文本与选项列表中的文字或值是否完全一致（区分大小写与空格）。 |
| **单次批量提交不能超过 100 条** | `batch_submit_form_data` 单批传入超过 100 条 | 在客户端将数据拆分成每批 ≤100 条分批调用。 |
| **该题目/选项在历史填报中已有 N 条关联数据** | 触发防误删预检安全拦截 | 查看预检提示，向用户确认是否确定承担历史数据丢失风险后再执行删除。 |
| **单页查询 size 超过最大限制 100** | `query_form_data` 的 `size` 参数 > 100 | 将 `size` 设置在 1 到 100 之间，配合 `current` 分页遍历。 |

---

## 五、 安全与权限体系

1. **权限隔离与严格校验**：
   - MCP 工具的所有读写操作均严格受限于当前 API Key 或 OAuth 所属账号的权限边界，无法越权访问他人表单或数据。
2. **高危操作防线**：
   - 表单物理/逻辑删除（`delete_form`）、批量清空数据或删除已有填报历史的题目（`delete_form_item`）前，AI 会触发二次确认或强制执行 `check_field_data` 预检。
3. **凭证安全管理**：
   - **Basic 认证**：凭证保存在本地客户端配置中；若怀疑密钥泄露，可立即在 TDuck 后台「开放 API」中点击 **重置 Secret**，旧凭证将秒级失效。
   - **OAuth 认证**：Token 由客户端本地安全托管，可随时在 TDuck 后台「授权管理」中一键吊销对应客户端的访问权限。

