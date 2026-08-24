---
name: tduck
slug: tduck
displayName: TDuck（填鸭表单）
description: "通过 TDuck（填鸭表单，tduck-x-platform）MCP 服务操作在线表单与回收数据：使用自然语言创建、复制、编辑表单与题目结构（支持单选、多选、下拉、评分、日期、级联省市、手写签名、文件上传等 17+ 种丰富题型与在线考试评分配置）；在删除题目/选项前进行历史数据防误删预检（check_field_data）；通过直传凭证（get_upload_ticket）上传本地图片与附件，或通过网络链接转存（upload_file）；配置对外公开自助查询页（Opensearch）；管理归档文件夹；一键发布或停止收集；分页查询填报数据明细、单条或批量导入数据（单批最多 100 条）、修改或删除数据。仅在用户操作 TDuck 平台上的表单与数据时使用——触发信号：提到 TDuck / 填鸭表单 / TDuck-X、给出 formKey，或需要操作 TDuck 上的表单结构与回收数据。不要用于：从零编写无关的前后端系统代码、处理与 TDuck 无关的本地通用文档等。"
version: 1.0.0
author: TDuck
license: Apache-2.0
platforms: [macos, linux, windows]
metadata:
  hermes:
    tags: [Forms, Data Collection, Survey, Exam, Productivity, TDuck, 填鸭表单]
    category: productivity
    related_skills: []
---

# TDuck（填鸭表单）

TDuck（tduckcloud.com / 私有化部署）是领先的现代开源与企业级在线表单与数据收集平台。通过 TDuck MCP，你可以用自然语言完成表单设计、题目编排、主题外观、权限与防刷设置、发布分享以及填报数据的全生命周期管理，**全面替代登录管理后台手动操作**。

## When to Use

本 skill **仅处理 TDuck 平台（tduckcloud.com / 本地私有化部署）** 的表单搭建与数据管理，满足以下任一**平台信号**才触发：

- 用户明确提到 **“TDuck”**、**“填鸭表单”**、**“TDuck-X”**、**“tduckcloud.com”**
- 用户要求查询当前登录账号/用户信息（如账号名、昵称、手机号、邮箱、所属部门、角色等）
- 用户给出了 `formKey`（如 `ICGqvdBR`），或要求创建、复制、编辑、移动、发布、停止、删除 TDuck 上的表单
- 用户要求增删改查表单中的单道题目（如追加姓名、修改选项、删除多选题）
- 用户要求在删除前检查题目/选项是否已被用户填写过（防误删预检）
- 用户要求上传文件/图片并挂载至表单头图、Logo、封面或题目附件
- 用户要求查询、录入、批量导入、更新或删除表单回收的填报数据（FormData）
- 用户要求管理表单归档分类文件夹（Folder）或配置对外公开自助查询页（Opensearch）

## When NOT to Use

以下场景**不要**用本 skill，直接退出、交由通用能力处理：

- 用代码/程序从零开发表单系统（如在 React / Vue / Spring Boot 项目里手写一套表单组件）
- 纯本地处理文件、Excel / CSV 清洗、文档分析（**若目标是把这份数据批量导入到 TDuck 某张表单，则属于本 skill**，先 `get_form_detail` 后用 `batch_submit_form_data`）
- 图片/发票 OCR、人脸识别等与 TDuck 平台无关的通用 AI 任务
- 仅出现“表 / 表单 / 问卷”字眼，但并非操作 TDuck 平台上的数据

判断不属于 TDuck 平台操作时，**不要调用任何 MCP 工具**，按通用能力回答即可。

## Quick Reference

| 场景分类 | MCP 工具 | 功能说明 |
| :--- | :--- | :--- |
| **账号信息** | `get_current_user` | 获取当前登录账号的完整身份信息（用户ID、账号、昵称、手机号、邮箱、所属部门、角色、岗位及管理员状态等） |
| **表单列表** | `list_forms` | 分页查询表单列表（支持关键字、收集状态 `RELEASE`/`STOP`、文件夹筛选） |
| **表单详情** | `get_form_detail` | 获取表单完整的扁平题目结构（`items`）、设置（`setting`）、主题（`theme`）与逻辑（`logic`） |
| **创建表单/考试** | `create_form` | 极简模式创建全新普通表单（`type: "ORDINARY"`）或在线考试（`type: "EXAM"`，支持 17+ 种题型） |
| **复制表单** | `copy_form` | 快速克隆已有表单的题目结构、设置与主题生成新表单 |
| **表单转为模板** | `save_form_as_template` | 将已有表单及其题目、主题配色、跳题逻辑与全局设置一键转存为模板（支持个人私有模板与系统公共模板） |
| **复合更新表单** | `update_form` | 复合局部更新表单基础信息、题目列表、主题样式或全局提交设置 |
| **更新主题外观** | `update_form_theme` | 单独更新表单主题配置（主色调、背景色、头图、Logo、提交按钮、封面、水印等） |
| **更新行为设置** | `update_form_setting` | 单独更新表单收集设置（登录限制、白名单、IP/账号限额、起止时间、数据提醒、考试防作弊等） |
| **配置逻辑规则** | `update_form_logic` | 单独更新表单显隐规则、跳题跳转、提前交卷、选项控制及联动计算公式（DSL） |
| **查询逻辑规则** | `get_form_logic` | 查询指定表单当前配置的显隐跳题规则与公式详情 |
| **全量重构题目** | `replace_form_items` | 全量覆盖并重置指定表单的题目列表（旧题目将被物理清理） |
| **发布表单** | `publish_form` | 发布表单开启数据收集通道，返回公开填写 URL |
| **停止收集** | `stop_form` | 停止表单收集，关闭对外公开填写通道 |
| **删除表单** | `delete_form` | 逻辑删除指定表单及其关联的所有题目与回收数据 |
| **快速改名/描述** | `update_form_basic` | 快速修改表单名称和描述说明 |
| **题目列表** | `list_form_items` | 查询指定表单的所有题目列表详情 |
| **追加单题** | `add_form_item` | 在指定表单末尾追加一道新题目 |
| **修改单题** | `update_form_item` | 根据题目 ID 修改指定题目的标题、必填、选项、提示文案等 |
| **删除单题** | `delete_form_item` | 从指定表单中物理删除某一道题目（删前必查 `check_field_data`） |
| **防误删预检** | `check_field_data` | 检查题目/选项在历史提交中是否已有填报数据（删除前必须调用） |
| **直传凭证（本地必用）** | `get_upload_ticket` | 获取本地文件/图片免密直传预签名凭证及 curl 命令直传接口，彻底杜绝 Base64 |
| **网络图片转存** | `upload_file` | 传入网络图片链接（`remoteUrl`）由服务端自动抓取转存换取公网 URL |
| **列出文件夹** | `list_folders` | 获取当前用户的所有一级表单归档文件夹 |
| **新建文件夹** | `create_folder` | 创建新的表单归档一级文件夹 |
| **移动表单归档** | `move_form_folder` | 将表单移动归档到指定文件夹（`0` 为根目录/未分类） |
| **查询回收数据** | `query_form_data` | 分页查询表单已收集的数据（自动映射题目自定义 ID，支持关键字与时间范围） |
| **查看单条数据** | `get_form_data_detail` | 根据 `dataId` 查询单条填报数据的完整详细内容 |
| **单条录入数据** | `submit_form_data` | 向表单录入一条新数据（直接使用题目自定义 ID 填报） |
| **批量导入数据** | `batch_submit_form_data` | 批量向表单写入多条填报数据（单批最多支持 100 条） |
| **修改填报数据** | `update_form_data` | 根据 `dataId` 局部修改单条已提交的数据内容 |
| **删除填报数据** | `delete_form_data` | 根据 `dataId` 删除指定的单条填报数据 |
| **列出对外查询页** | `list_opensearch_queries` | 查询表单对外公开自助查询页（Opensearch）配置列表 |
| **查看对外查询页** | `get_opensearch_query` | 查询指定对外公开查询页的详细规则配置 |
| **创建对外查询页** | `create_opensearch_query` | 为表单创建对外公开查询页（供访客凭手机号/准考证号等自主查结果） |
| **启停对外查询页** | `edit_opensearch_query` | 修改或启停指定表单的对外公开查询页 |

## Procedure

### 原则

> ⚠️ **绝不绕过 MCP**：TDuck MCP 工具不可用（未连接 / 授权失败 / 调用持续报错）时**立即停止**，**禁止**改用浏览器自动化（Playwright 等）、模拟后台操作或直接调用未经授权的私有接口替代。正确做法见下方「MCP 不可用时」。

1. **先看再动**：操作未知表单前，先 `get_form_detail` 拿到题目结构与自定义 `id`（如 `q_name`、`q_gender`）。`submit_form_data` / `update_form_data` / `batch_submit_form_data` 的键**必须是题目自定义 `id`**，传中文 label 会被服务端忽略或无法正确匹配。

2. **安全删除与防误删预检**：在删除题目（`delete_form_item`）或修改关键选项前，**必须先调用 `check_field_data`** 检查历史提交中是否已有数据。若 `hasData: true`，必须明确告知用户已有数据条数与风险，**在用户二次显式确认后**方可执行删除。

3. **已发布状态保护**：已发布（`RELEASE`）的表单不可直接全量修改题目列表（`update_form(items=...)` 或 `replace_form_items` 会被服务端直接拦截拒绝）。若需修改题目，应先 `stop_form` 停止收集，修改完成后再 `publish_form` 重新发布；或使用单题维护接口 `add_form_item` / `update_form_item`。

4. **先列再改 / 先列再删**：批量操作填报数据前，先通过 `query_form_data` 查出命中记录展示给用户确认；批量更新逐条调用 `update_form_data` 或通过 `batch_submit_form_data` 导入；批量删除逐条调用 `delete_form_data`，每 10~20 条汇报一次进度。

5. **严禁 Base64，本地文件一律走直传凭证**：设置表单头图、Logo、封面图或上传题目附件时，**严禁在对话或参数中传输任何 Base64 编码**（避免几十万 Token 膨胀与上下文截断）。本地图片/文件**必须先调用 `get_upload_ticket` 获取免密直传凭据并在本地终端执行 curl 直传换取公网 `fileUrl`**；网络图片通过 `upload_file(remoteUrl="...")` 转存。严禁将 Base64 字符串直接作为 URL 写入字段。

6. **脱敏展示**：输出敏感信息（手机号、邮箱、身份证号等）默认打码（如 `138****1234`），除非用户明确要求展示原文。

7. **不静默吞错**：题型不匹配、必填缺失、选项不存在或权限不足等报错原文回显并给出具体修正方案。

### 典型任务流

**① 新建表单（普通表单 / 在线考试）**
```
1. 确定表单类型：普通表单传 type: "ORDINARY"（默认），在线考试传 type: "EXAM"
2. 调用 create_form，传入 name、description、items（每题指定清晰的 id，如 q_name、q_phone；考试题配置 exam: {score, answer, answerAnalysis}）
3. 按需配置 theme（主题配色、头图、Logo、封面）和 setting（防刷、限额、通知提醒、防作弊）
4. 返回表单名称、formKey 与管理状态
5. 若用户要求立即收集，追加调用 publish_form，返回对外公开填报链接（https://.../s/{formKey}）
```

**② 条件查询 / 导出填报数据**
```
1. 调用 get_form_detail 拿到题目的 id 与中文 label 映射字典
2. 调用 query_form_data，传入 keyword（模糊搜索）或 beginTime / endTime（时间范围筛选），分页查询
3. Markdown 表格展示结果，表头采用题目的中文 label，关键敏感信息（手机/身份证）打码
4. 询问用户是否需要将数据整理为 CSV 或特定格式
```

**③ 单条 / 批量修改填报数据**
```
1. 调用 query_form_data 查出目标数据，获取其唯一 dataId（如 "1001" 或 UUID）
2. 向用户展示待修改的数据明细与拟更新的值，获得用户确认
3. 调用 update_form_data(formKey, dataId, data={q_field: newValue}) 执行局部更新
4. 向用户反馈修改成功结果
```

**④ 批量导入填报数据**
```
1. 调用 get_form_detail 拿目标题目的自定义 id 和选项列表
2. 将待导入数据整理为以题目 id 为键的数组：[{q_name: "张三", q_dept: "技术部"}, ...]
3. 调用 batch_submit_form_data 一次性提交（单批 ≤100 条；超过 100 条需在客户端自行分批循环提交）
4. 汇总向用户汇报：“共提交 N 条，成功导入 X 条”
```

**⑤ 安全删除题目 / 选项**
```
1. 确定待删除题目 itemId（如 "q_dept"）以及可选的选项值 choiceValue
2. 调用 check_field_data(formKey, itemId, choiceValue) 预检
3. 若 hasData=true，向用户告警：“该题目/选项在历史提交中已有 X 条关联数据，删除将导致历史数据无法查看，是否确认删除？”
4. 用户明确回复确认后，调用 delete_form_item 执行物理删除
```

**⑥ 图片与附件配置（头图 / Logo / 封面 / 题目附件）**
```
- 本地图片/文件（唯一标准路径）：
  1. 调用 get_upload_ticket(formKey, fileName="logo.png") 获得临时免密直传 uploadUrl 与极简 curl 命令
  2. 在本地终端直接执行返回的 curl 命令（curl -s -F "file=@./logo.png" "https://.../open/v2/form/data/upload-ticket?ticket=..."）
  3. 服务端直传接口直接返回包含真实公网 fileUrl 的 JSON
  4. 将 fileUrl 填入 theme.headImgUrl / theme.logoImgUrl 或作为填报数据值（0 Token 消耗、100% 不截断）
- 网络图片（远程转存模式）：
  1. 调用 upload_file(formKey, remoteUrl="https://...") 服务端自动抓取转存并返回 fileUrl
  2. 拿到返回的真实 fileUrl 后再填入表单字段
```

**⑦ 对外公开自助查询页（Opensearch）**
```
1. 先调用 list_opensearch_queries 检查是否已有查询页
2. 调用 create_opensearch_query，传入 formKey、title（如 "期末成绩自助查询"）与 queryFieldId（查询凭证字段，如 "q_student_id" 或 "q_phone"）
3. 激活对外查询通道，将公开查询链接告知用户
4. 随时调用 edit_opensearch_query(formKey, enabled=false/true) 启停查询页
```

### 关键格式规范

**1. 题目设计规范（17+ 种核心题型）：**

| 题型 Type | 题型说明 | items 定义示例 |
| :--- | :--- | :--- |
| `INPUT` | 单行文本 / 手机号 / 邮箱 | `{"id": "q_name", "type": "INPUT", "label": "姓名", "required": true}` |
| `TEXTAREA` | 多行文本 / 详情描述 | `{"id": "q_desc", "type": "TEXTAREA", "label": "个人简介"}` |
| `NUMBER` | 数字输入框 | `{"id": "q_age", "type": "NUMBER", "label": "年龄"}` |
| `RADIO` | 单选框 | `{"id": "q_gender", "type": "RADIO", "label": "性别", "options": ["男", "女"]}` |
| `CHECKBOX` | 多选框 | `{"id": "q_hobby", "type": "CHECKBOX", "label": "兴趣", "options": ["阅读", "运动", "旅游"]}` |
| `SELECT` | 下拉单选 | `{"id": "q_city", "type": "SELECT", "label": "所在城市", "options": ["北京", "上海", "广州"]}` |
| `MULTIPLE_SELECT` | 下拉多选 | `{"id": "q_tags", "type": "MULTIPLE_SELECT", "label": "技术栈", "options": ["Java", "Go", "Vue"]}` |
| `DATE` | 日期选择 | `{"id": "q_birth", "type": "DATE", "label": "出生日期"}` |
| `RATE` | 评分组件 | `{"id": "q_score", "type": "RATE", "label": "满意度评分"}` |
| `SLIDER` | 滑块 | `{"id": "q_slider", "type": "SLIDER", "label": "期望薪资(K)"}` |
| `UPLOAD` | 文件/简历附件上传 | `{"id": "q_file", "type": "UPLOAD", "label": "附件简历"}` |
| `IMAGE_UPLOAD` | 图片上传 | `{"id": "q_avatar", "type": "IMAGE_UPLOAD", "label": "个人照片"}` |
| `SIGN_PAD` | 电子手写签名 | `{"id": "q_sign", "type": "SIGN_PAD", "label": "承诺人手写签名"}` |
| `PROVINCE_CITY` | 省市区联动 | `{"id": "q_area", "type": "PROVINCE_CITY", "label": "籍贯省市"}` |
| `INPUT_MAP` | 地理位置定位 | `{"id": "q_loc", "type": "INPUT_MAP", "label": "打卡签到地点"}` |
| `DESC_TEXT` | 文字描述展示 | `{"type": "DESC_TEXT", "label": "注意事项说明（仅展示）"}` |
| `DIVIDER` | 视觉分割线 | `{"type": "DIVIDER", "label": "基础信息分割线"}` |

> **考试表单（EXAM）题型配置**：在题目中增加 `exam` 节点：  
> `{"id": "q_1", "type": "RADIO", "label": "Java 是哪家公司最初开发的？", "options": ["Sun", "Microsoft", "Google"], "exam": {"score": 10, "answer": "Sun", "answerAnalysis": "由 Sun Microsystems 于 1995 年推出。"}}`  
> 多选题标准答案为数组：`"exam": {"score": 10, "answer": ["A", "B"]}`。

**2. 填报数据 payload 格式规范（键必须为题目自定义 `id`）：**

| 题目类型 | 正确填报值格式 |
| :--- | :--- |
| `INPUT` / `TEXTAREA` | 字符串 `"张三"` |
| `NUMBER` / `RATE` / `SLIDER` | 数字 `25` 或数字字符串 `"25"` |
| `RADIO` / `SELECT` | 选项文字或值 `"男"`（与 options 中 label 或 value 匹配） |
| `CHECKBOX` / `MULTIPLE_SELECT` | 数组 `["阅读", "运动"]` 或逗号分隔字符串 `"阅读,运动"` |
| `DATE` | 日期格式字符串 `"2026-08-20"` |
| `UPLOAD` / `IMAGE_UPLOAD` | 公网文件 URL `"https://.../resume.pdf"` 或对象数组 `[{"url": "https://...", "name": "resume.pdf"}]` |
| `SIGN_PAD` | 签名图片公网 URL `"https://.../sign.png"` |
| `PROVINCE_CITY` | 省市数组 `["广东省", "深圳市", "南山区"]` 或斜杠分隔 `"广东省/深圳市/南山区"` |
| `INPUT_MAP` | 地址字符串 `"北京市海淀区中关村大街1号"` 或对象 `{"address": "...", "latitude": 39.9, "longitude": 116.3}` |

## Pitfalls

- **填报数据 payload 键写成中文 label** → 服务端无法映射题干，报数据为空或被静默忽略；键**必须是题目的自定义 `id`**（如 `q_name`）。
- **选择题填报值传了 options 以外的内容** → 服务端抛出 `【xx】选项【yy】不存在` 400 校验异常；必须传入 options 中定义的有效 label 或 value。
- **试图通过 Base64 字符串上传文件或填入表单** → 严禁在 MCP 协议中传递巨额 Base64（造成几十万 Token 膨胀、请求被网关拦截或上下文截断）；本地文件必须先调用 `get_upload_ticket` 获取凭证后通过 curl 接口直传换取真实公网 `fileUrl`。
- **对已发布（RELEASE）的表单直接修改题目列表** → 服务端报错 `已发布表单不可直接修改题目`；需先 `stop_form` 停止收集，修改完成后再 `publish_form` 重新发布，或使用 `add_form_item` / `update_form_item` 单题维护。
- **删除题目或选项前未做安全预检** → 造成历史填报数据不可逆丢失；删除前**必须先调用 `check_field_data`** 确认是否有历史数据，有数据时必须得到用户二次确认。
- **普通表单（type=ORDINARY）配置 `items[].exam`** → 服务端校验直接拦截，报错 `items[i].exam 仅允许用于 EXAM 表单`；只有在 `type: "EXAM"` 的表单中才允许配置 exam。
- **考试题 `exam.answer` 填了 options 中不存在的选项** → 校验报错 `exam.answer 不存在于 options: xxx`；必须与 options 中的选项文字或 ID 严格对应。
- **考试题 `exam.score` 传负数或 0** → 校验报错 `exam.score 必须大于 0`。
- **创建表单时题目 `id` 重复** → 服务端报错 `题目 id 重复: q_xxx`；同一表单内的所有题目 `id` 必须唯一。
- **单题更新 `update_form_item` 试图修改题目 `id`** → 服务端拦截报错 `V2 更新不能修改题目 id`；单题更新必须保持原题目 `id`。
- **添加单题 `add_form_item` 指定了已存在的 `id`** → 服务端报错 `题目 id 已存在: q_xxx`。
- **批量导入 `batch_submit_form_data` 单次超过 100 条** → 超过单批处理上限；必须在客户端将数据按每批 ≤100 条分批循环提交。
- **多选题 `CHECKBOX` 传单个标量未包数组** → 虽有逗号容错，但规范推荐传数组 `["选项A", "选项B"]`，避免特殊字符解析歧义。
- **省市区 `PROVINCE_CITY` 直辖市重复传级** → 如传 `["北京市", "北京市", "海淀区"]`；规范推荐传 `["北京市", "海淀区"]` 或 `"北京市/海淀区"`。
- **文件夹移动 `move_form_folder` 传不存在的 folderId** → 报错 `目标文件夹不存在`；移回根目录传 `0`，其余需先 `list_folders` 获取有效 ID。
- **`query_form_data` 的 `size` 传超过 100** → 服务端最大单页限制 100 条；分页查询应结合 `current` 与 `size`（默认 20，最大 100）。
- **`update_form` 中误传 `items` 导致旧题目被覆盖重构** → 若仅需修改表单名称或描述，应调用 `update_form_basic` 或仅传 `name`/`description` 而不传 `items`。
- **对外查询页 `create_opensearch_query` 凭证字段传错** → `queryFieldId` 必须是表单中真实存在的题目自定义 `id`（如 `q_phone`）。
- **限流报错（HTTP 429 / 频繁调用）把原始 JSON 抛给用户** → 不友好；应告知“接口调用频繁，请稍候 1~2 分钟重试”，并放慢节奏或合并请求。

## Verification

操作完成后确认：
- **创建/复制表单**：返回包含有效 `formKey`（如 `ICGqvdBR`），调用 `get_form_detail` 校验题目与配置。
- **发布表单**：返回对外公开填写访问地址（`https://.../s/{formKey}`）。
- **单题增删改**：调用 `list_form_items` 确认题目列表是否已按预期更新。
- **数据填报 (`submit_form_data`)**：返回包含 `dataId`，调用 `get_form_data_detail` 能查询到刚填报的数据。
- **批量导入 (`batch_submit_form_data`)**：返回 `successCount` 与提交条数一致。
- **数据修改 (`update_form_data`)**：返回成功，再次调用 `get_form_data_detail` 校验字段更新。
- **数据删除 (`delete_form_data`)**：返回成功，后续 `query_form_data` 不再出现该记录。
- **防误删预检 (`check_field_data`)**：正确返回 `hasData` 与 `dataCount`。
- **对外查询页 (`create_opensearch_query`)**：返回配置确认信息，对外查询通道已激活。
- **批量操作汇报**：统一向用户清晰汇报“共 N 条，成功 X 条，失败 Y 条”。

## MCP 配置

TDuck MCP 端点：`https://x.tduckcloud.com/tduck-api/mcp`（私有化部署请替换为您的实际部署域名）

**方式 A · 开放 API 密钥认证（推荐 · 永久有效 · 稳定无打扰）**
```bash
# 生成 Authorization Header
echo -n "YOUR_APP_ID:YOUR_APP_SECRET" | base64
```
```json
{
  "mcpServers": {
    "tduck": {
      "url": "https://x.tduckcloud.com/tduck-api/mcp",
      "headers": {
        "Authorization": "Basic <BASE64_STRING>"
      }
    }
  }
}
```

**方式 B · OAuth 2.0 自动授权（PKCE）**
```json
{
  "mcpServers": {
    "tduck": {
      "url": "https://x.tduckcloud.com/tduck-api/mcp"
    }
  }
}
```

常见配置错误：漏 `/tduck-api/mcp` 后缀、误用 `http://`、`Authorization` 缺 `Basic ` 前缀、使用了 stdio 命令行形式配置（TDuck 是远程 HTTP MCP 服务）。

### MCP 不可用时

当 MCP 服务未连接、鉴权失败或调用持续报错时，按顺序执行降级处理，**严禁假装已完成或使用非标方式替代**：

1. 明确告知用户“TDuck MCP 服务当前未就绪或鉴权失败”，说明具体错误原因。
2. 对照上述「常见配置错误」引导用户排查（检查端点 URL、API Key 密钥、Basic 前缀或 OAuth 授权弹窗）。
3. 如需紧急操作，向用户提供在 TDuck 管理后台（网页端）手动创建表单或导出数据的操作步骤指引。
