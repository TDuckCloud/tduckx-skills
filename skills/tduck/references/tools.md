# TDuck MCP 工具完整参考手册

本文档详细列出 TDuck（填鸭表单）开放平台对外开放的 **33 个 MCP 工具**，每个工具均包含详细用途、输入参数定义、参数子结构拆解、标准 JSON 输出示例、实战调用请求 Payload、行为约束要点与常见错误排查指引。

> 工具的实际暴露名可能带客户端前缀（如 `mcp__tduck__list_forms`），按客户端实际识别的名字调用即可，本文统一使用标准裸名。

---

## 目录索引

| 类别 | 工具名称 | 描述 |
| :--- | :--- | :--- |
| **一、 表单生命周期与管理** | [`list_forms`](#list_forms) | 分页获取表单列表，支持关键字搜索、状态筛选与文件夹过滤 |
| | [`get_form_detail`](#get_form_detail) | 根据 formKey 获取表单完整设计结构（题目、设置、主题、逻辑） |
| | [`create_form`](#create_form) | 极简模式创建全新表单（普通表单或在线考试） |
| | [`copy_form`](#copy_form) | 快速复制已有表单的题目结构、设置与主题生成新表单 |
| | [`update_form`](#update_form) | 复合局部更新表单基础信息、题目、外观或全局设置 |
| | [`update_form_theme`](#update_form_theme) | 单独更新表单主题配色、Logo、头图、封面与水印等视觉样式 |
| | [`update_form_setting`](#update_form_setting) | 单独更新表单提交限制、IP/微信/账号限额、起止时间与防作弊设置 |
| | [`replace_form_items`](#replace_form_items) | 全量覆盖并重置指定表单的题目列表（旧题目物理清理重构） |
| | [`publish_form`](#publish_form) | 发布表单开启收集通道，返回对外公开填报链接 |
| | [`stop_form`](#stop_form) | 停止表单收集，关闭对外公开填写通道 |
| | [`delete_form`](#delete_form) | 逻辑删除指定表单及其关联的所有题目与回收数据 |
| | [`update_form_basic`](#update_form_basic) | 快速修改表单名称和描述说明 |
| **二、 单题精细化维护** | [`list_form_items`](#list_form_items) | 获取指定表单的题目列表明细（扁平模型） |
| | [`add_form_item`](#add_form_item) | 在指定表单末尾追加一道新题目 |
| | [`update_form_item`](#update_form_item) | 根据题目 ID 精细修改指定题目的标题、必填、选项与分值 |
| | [`delete_form_item`](#delete_form_item) | 从指定表单中物理删除某一道题目（删前必查 check_field_data） |
| **三、 题目安全与防误删预检** | [`check_field_data`](#check_field_data) | 检查题目或选项是否已有填报数据，防止误删历史数据 |
| **四、 附件与图片上传** | [`get_upload_ticket`](#get_upload_ticket) | 获取本地文件/图片免密直传预签名凭证及 curl 命令（本地文件唯一通道） |
| | [`upload_file`](#upload_file) | 传入网络图片链接（remoteUrl）由服务端自动抓取转存换取公网 URL |
| **五、 文件夹归档管理** | [`list_folders`](#list_folders) | 获取当前用户的所有一级表单归档文件夹列表 |
| | [`create_folder`](#create_folder) | 创建新的表单归档一级文件夹 |
| | [`move_form_folder`](#move_form_folder) | 将表单移动归档到指定文件夹（0 表示移回根目录） |
| **六、 表单填报数据管理** | [`query_form_data`](#query_form_data) | 分页查询表单已收集的数据（自动映射题目自定义 ID） |
| | [`get_form_data_detail`](#get_form_data_detail) | 根据 dataId 查询单条填报数据的完整详细内容 |
| | [`submit_form_data`](#submit_form_data) | 向表单录入一条新数据（直接使用题目自定义 ID 填报） |
| | [`batch_submit_form_data`](#batch_submit_form_data) | 批量向表单写入多条填报数据（单批最多 100 条） |
| | [`update_form_data`](#update_form_data) | 根据 dataId 局部修改单条已提交的数据内容 |
| | [`delete_form_data`](#delete_form_data) | 根据 dataId 删除指定的单条填报数据 |
| **七、 对外公开自助查询页 (Opensearch)** | [`list_opensearch_queries`](#list_opensearch_queries) | 查询表单对外公开自助查询页配置列表 |
| | [`get_opensearch_query`](#get_opensearch_query) | 查询指定对外公开查询页的详细规则配置 |
| | [`create_opensearch_query`](#create_opensearch_query) | 为表单创建或配置对外公开查询页 |
| | [`edit_opensearch_query`](#edit_opensearch_query) | 修改或启停指定表单的对外公开查询页 |

---

# 通用规范与认证方式

## 1. 认证方式与端点

TDuck MCP 支持通过 API 密钥认证（推荐，永久有效且稳定），端点为：
- **公共云/测试环境**：`https://x.tduckcloud.com/tduck-api/mcp`
- **私有化部署环境**：`https://{your-domain}/tduck-api/mcp`

请求头携带格式：
```http
Authorization: Basic <base64(APP_ID:APP_SECRET)>
```

## 2. 核心题型清单（17+ 种）

在 `create_form`、`update_form`、`replace_form_items`、`add_form_item`、`update_form_item` 中，`items[].type` 必须为以下支持的类型之一：

| 题型代码 (`type`) | 题型中文名 | 题型特点与数据结构说明 |
| :--- | :--- | :--- |
| `INPUT` | 单行文本框 | 用于姓名、手机号、邮箱、微信号、工号、短语等，填报值为字符串 |
| `TEXTAREA` | 多行文本域 | 用于自我介绍、需求详情、备注说明等，填报值为长字符串 |
| `NUMBER` | 数字输入框 | 用于年龄、金额、数量、工龄等，填报值为纯数字或数字字符串 |
| `RADIO` | 单选按钮组 | 用于性别、单选题、分类选择等，选项为字符串数组或对象数组 |
| `CHECKBOX` | 多选框 | 用于爱好、技能、多选题等，填报值为数组（如 `["A", "B"]`） |
| `SELECT` | 下拉单选 | 用于城市、部门、学历等，选项较多时推荐使用 |
| `MULTIPLE_SELECT` | 下拉多选 | 用于多标签选择、多技能选择等，填报值为数组 |
| `DATE` | 日期选择器 | 用于出生日期、预约日期、活动日期等，格式为 `yyyy-MM-dd` |
| `RATE` | 评分组件 | 用于满意度评分（1-5 星），填报值为数字（如 `5`） |
| `SLIDER` | 滑块组件 | 用于数值范围拖动选择（如期望薪资、工作年限），填报值为数字 |
| `UPLOAD` | 文件/简历附件 | 附件上传，填报值为公网 URL 或文件对象数组 |
| `IMAGE_UPLOAD` | 图片上传 | 图片上传，填报值为公网图片 URL 或图片对象数组 |
| `SIGN_PAD` | 电子手写签名 | 手写签名画板，填报值为签名生成的 PNG 公网图片 URL |
| `PROVINCE_CITY` | 省市区联动 | 省市区三级联动选择，填报值为数组（如 `["广东省", "深圳市", "南山区"]`）或斜杠拼接字符串 |
| `INPUT_MAP` | 地理位置定位 | 地图定位与打卡签到，填报值为地址字符串或经纬度对象 |
| `DESC_TEXT` | 文字描述展示 | 纯文本说明展示（非答题字段），用于段落指引或声明 |
| `DIVIDER` | 视觉分割线 | 纯视觉分隔线，用于表单排版美化 |

---

# 一、 表单生命周期与管理

## list_forms

**用途**：分页查询当前账号拥有的表单列表。支持按表单名称或唯一 Key 模糊搜索、按收集状态（`RELEASE`: 收集发布中, `STOP`: 已停止）筛选、按所属归档文件夹筛选。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `keyword` | string | 否 | - | 表单名称或唯一 Key 模糊搜索关键字 |
| `status` | string | 否 | - | 表单状态：`RELEASE`（收集中/已发布）、`STOP`（已停止） |
| `folderId` | integer | 否 | - | 归属文件夹 ID（`0` 表示根目录/未归档） |
| `current` | integer | 否 | 1 | 当前分页页码（从 1 开始） |
| `size` | integer | 否 | 20 | 每页展示条数（最大限制 100） |

**输出示例**

```json
{
  "total": 2,
  "current": 1,
  "size": 20,
  "rows": [
    {
      "formKey": "hr2026spring",
      "name": "2026 春季校园招聘简历投递表",
      "description": "欢迎投递 TDuck 核心岗位，请如实填写个人信息并上传简历。",
      "status": "RELEASE",
      "type": "ORDINARY",
      "folderId": 102,
      "createTime": "2026-08-20 10:00:00",
      "updateTime": "2026-08-20 10:30:00"
    },
    {
      "formKey": "java_quiz_01",
      "name": "Java 基础知识随堂小测验",
      "description": "共 3 题，满分 30 分，交卷后自动出分。",
      "status": "STOP",
      "type": "EXAM",
      "folderId": 0,
      "createTime": "2026-08-20 14:00:00",
      "updateTime": "2026-08-20 14:20:00"
    }
  ]
}
```

**调用示例**

```json
{
  "keyword": "招聘",
  "status": "RELEASE",
  "current": 1,
  "size": 10
}
```

**常见错误**

- `size 超过最大限制 100` — 单页查询数量请控制在 1-100 之间。
- `状态值无效` — `status` 仅支持 `RELEASE` 或 `STOP`。

---

## get_form_detail

**用途**：根据 `formKey` 获取表单的完整设计结构。**操作未知表单、录入数据或修改表单前必调**，以获取所有题目的自定义 `id`（如 `q_name`、`q_gender`）、题型、选项、主题配色（`theme`）、全局收集设置（`setting`）与逻辑规则（`logic`）。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单全局唯一标识 Key（如 `"hr2026spring"`） |

**输出示例**

```json
{
  "formKey": "hr2026spring",
  "name": "2026 春季校园招聘简历投递表",
  "description": "欢迎投递 TDuck 核心岗位，请如实填写个人信息并上传简历。",
  "type": "ORDINARY",
  "status": "RELEASE",
  "folderId": 0,
  "createTime": "2026-08-20 10:00:00",
  "updateTime": "2026-08-20 10:30:00",
  "totalScore": null,
  "items": [
    {
      "id": "q_name",
      "type": "INPUT",
      "label": "姓名",
      "required": true,
      "placeholder": "请输入您的姓名",
      "description": null,
      "defaultValue": null,
      "options": null,
      "sort": 1,
      "exam": null
    },
    {
      "id": "q_gender",
      "type": "RADIO",
      "label": "性别",
      "required": true,
      "placeholder": null,
      "description": null,
      "defaultValue": null,
      "options": ["男", "女"],
      "sort": 2,
      "exam": null
    },
    {
      "id": "q_resume",
      "type": "UPLOAD",
      "label": "个人简历",
      "required": true,
      "placeholder": null,
      "description": "支持 PDF、DOCX 格式，大小不超过 20MB",
      "defaultValue": null,
      "options": null,
      "sort": 3,
      "exam": null
    }
  ],
  "theme": {
    "themeColor": "#409EFF",
    "backgroundColor": "#FAFAFA",
    "headImgUrl": "https://cdn.example.com/banner.png",
    "logoImgUrl": null,
    "submitBtnText": "提交报名",
    "enableCover": false,
    "watermark": false
  },
  "setting": {
    "mustLogin": false,
    "enableWhiteList": false,
    "ipWriteCountLimitStatus": true,
    "ipWriteCountLimit": 1,
    "ipWriteCountLimitDateType": 1,
    "emailNotify": true,
    "newWriteNotifyEmail": "hr@example.com"
  },
  "logic": null
}
```

**常见错误**

- `表单不存在: xxx` — 传入的 `formKey` 不存在或已被删除。
- `无权访问该表单` — 当前 API 凭证无权操作目标表单。

---

## create_form

**用途**：极简模式从零创建全新的普通表单（`type: "ORDINARY"`，默认）或在线考试卷（`type: "EXAM"`）。支持在一次请求中定义表单名称、描述、题目列表（`items`）、主题样式（`theme`）、全局收集与防刷设置（`setting`）及显隐逻辑规则（`logic`）。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `name` | string | ✅ 是 | - | 表单名称（如 `"2026 春季校园招聘简历投递表"`） |
| `description` | string | 否 | - | 表单前导语或描述说明 |
| `type` | string | 否 | `ORDINARY` | 表单类型：`ORDINARY`（普通表单）、`EXAM`（在线考试/自动判分） |
| `folderId` | integer | 否 | 0 | 归属文件夹 ID（`0` 表示根目录） |
| `items` | array | 否 | `[]` | 题目列表数组，每个元素详见下方 `items[] 结构表` |
| `setting` | object | 否 | - | 全局收集设置（防刷、限额、时间、通知、考试规则等），详见下方 `setting 结构表` |
| `theme` | object | 否 | - | 主题配色与外观设置（主题色、背景、头图、Logo等），详见下方 `theme 结构表` |
| `logic` | object | 否 | - | 题目显隐规则与跳题逻辑 |

### `items[]` 结构表

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | 否 | 题目自定义唯一标识（如 `q_name`、`q_phone`）。建议显式指定有业务语义的 ID，后续数据存取与修改均以该 ID 为键 |
| `type` | string | ✅ 是 | 题目类型代码，见上方 [17+ 核心题型清单](#2-核心题型清单17-种)（如 `INPUT`、`RADIO`、`UPLOAD`） |
| `label` | string | ✅ 是 | 题目标题文字 |
| `required` | boolean | 否 | 是否为必填项（默认为 `false`） |
| `placeholder` | string | 否 | 输入框浅色占位提示语 |
| `description` | string | 否 | 题干下方补充说明文案 |
| `defaultValue` | object | 否 | 题目默认初始值 |
| `options` | array | 否 | 单选/多选/下拉等题型的选项列表。支持纯字符串数组 `["A", "B"]` 或对象数组 `[{"label":"A","value":"1"}]` |
| `sort` | integer | 否 | 题目排序序号（数值越小越靠前，不传时按数组索引自增） |
| `exam` | object | 否 | **在线考试专属评分配置**（仅在 `type: "EXAM"` 时允许传入，普通表单传入会被服务端拦截拒绝）。详见下方 `exam 结构表` |

### `items[].exam` 结构表

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `score` | number | ✅ 是 | 试题分值（必须大于 0，如 `10`、`5.5`） |
| `scoringType` | integer | 否 | 计分规则：`1` 全部答对得分（默认），`2` 按比例得分（多选题） |
| `answer` | object | ✅ 是 | 标准答案：单选题为标量（如 `"A"` 或 `"Sun"`），多选题为数组（如 `["A", "B"]`） |
| `answerAnalysis` | string | 否 | 试题答案解析说明 |
| `showAnswer` | boolean | 否 | 提交后是否允许考生查看标准答案与解析 |

### `theme` 结构表

| 字段 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `themeColor` | string | `#409EFF` | 主色调 HEX 颜色代码（如 `#1890FF`、`#67C23A`） |
| `backgroundColor` | string | `#FAFAFA` | 页面整体背景颜色 |
| `contentBackgroundColor` | string | `#FFFFFF` | 表单内容卡片区域背景颜色 |
| `headImgUrl` | string | - | 表单顶部横幅头图公网 URL 地址 |
| `logoImgUrl` | string | - | 表单 Logo 图标公网 URL 地址 |
| `submitBtnText` | string | `"提交"` | 底部提交按钮文字 |
| `submitBtnTextColor` | string | `#FFFFFF` | 提交按钮文字颜色 |
| `showFormTitle` | boolean | `true` | 是否在表单顶部显示主标题 |
| `showFormDescribe` | boolean | `true` | 是否在表单顶部显示描述说明 |
| `showFormNumber` | boolean | `false` | 是否在题目左侧显示递增序号（1, 2, 3...） |
| `watermark` | boolean | `false` | 是否开启全屏防截图平铺水印 |
| `watermarkText` | string | - | 自定义水印平铺文字内容（如 `"内部保密"`） |
| `enableCover` | boolean | `false` | 是否开启独立封面欢迎页 |
| `coverTitle` | string | - | 封面欢迎页主标题 |
| `coverBtnText` | string | `"开始填写"` | 封面进入作答按钮文字 |

### `setting` 常用属性表

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `mustLogin` | boolean | 是否只允许登录用户填写（未登录跳转登录） |
| `enableWhiteList` | boolean | 是否开启白名单校验限制（1 邮箱, 2 手机号, 3 自定义） |
| `ipWriteCountLimitStatus` | boolean | 同一 IP 答题频次限制开关 |
| `ipWriteCountLimit` | integer | 同一 IP 在周期内最大允许提交次数 |
| `ipWriteCountLimitDateType` | integer | IP 限制周期：`1` 总共, `2` 每天, `3` 每周, `4` 每月 |
| `accountWriteCountLimitStatus`| boolean | 登录账号答题频次限制开关（配合 `accountWriteCountLimit`） |
| `totalWriteCountLimitStatus` | boolean | 表单总回收份数上限开关 |
| `totalWriteCountLimit` | integer | 表单允许回收的最大总份数（达到上限自动停止收集） |
| `writeInterviewTimeStatus` | boolean | 是否开启表单开放起止时间范围限制 |
| `writeInterviewDateTimeRange` | array | 开放起止时间范围，如 `["2026-08-01 00:00:00", "2026-08-31 23:59:59"]` |
| `submitShowType` | integer | 提交后展示方式：`1` 默认感谢提示, `2` 自定义富文本页面 |
| `submitJump` | boolean | 提交成功后是否自动重定向跳转外部网页 URL |
| `submitJumpUrl` | string | 提交后跳转的目标网页 URL 地址 |
| `emailNotify` | boolean | 新数据提交时是否发送邮件通知管理员 |
| `newWriteNotifyEmail` | string | 接收提醒的管理员邮箱（多个邮箱逗号分隔） |
| `examSettings` | object | 考试专属设置（限时答题 `timeLimit`、防切屏作弊 `maxCutScreenCount`、题目乱序 `randomOrder` 等） |

**输出示例**

```
表单创建成功！生成的表单 Key 为: hr2026spring
```

**调用示例（普通招聘表单）**

```json
{
  "name": "2026 春季校园招聘简历投递表",
  "description": "欢迎投递 TDuck 核心岗位，请如实填写个人信息并上传简历。",
  "type": "ORDINARY",
  "items": [
    {
      "id": "q_name",
      "type": "INPUT",
      "label": "姓名",
      "required": true,
      "placeholder": "请输入姓名"
    },
    {
      "id": "q_gender",
      "type": "RADIO",
      "label": "性别",
      "required": true,
      "options": ["男", "女"]
    },
    {
      "id": "q_phone",
      "type": "INPUT",
      "label": "手机号",
      "required": true,
      "placeholder": "请输入 11 位手机号"
    },
    {
      "id": "q_position",
      "type": "SELECT",
      "label": "应聘岗位",
      "required": true,
      "options": ["前端研发工程师", "后端研发工程师", "产品经理", "UI/UX 设计师"]
    },
    {
      "id": "q_resume",
      "type": "UPLOAD",
      "label": "个人简历",
      "required": true,
      "description": "支持 PDF/DOCX，最大不超过 20MB"
    }
  ],
  "theme": {
    "themeColor": "#1890FF",
    "submitBtnText": "立即投递"
  },
  "setting": {
    "ipWriteCountLimitStatus": true,
    "ipWriteCountLimit": 1,
    "ipWriteCountLimitDateType": 1,
    "emailNotify": true,
    "newWriteNotifyEmail": "hr@example.com"
  }
}
```

**调用示例（在线考试表单）**

```json
{
  "name": "Java 基础随堂测试",
  "type": "EXAM",
  "items": [
    {
      "id": "q_1",
      "type": "RADIO",
      "label": "1. Java 中所有类的顶级父类是？",
      "required": true,
      "options": ["Class", "Object", "String", "System"],
      "exam": {
        "score": 10,
        "answer": "Object",
        "answerAnalysis": "java.lang.Object 是 Java 类层级结构的根类。"
      }
    },
    {
      "id": "q_2",
      "type": "CHECKBOX",
      "label": "2. 下列属于 Java 访问修饰符的有？（多选）",
      "required": true,
      "options": ["public", "protected", "private", "final"],
      "exam": {
        "score": 10,
        "scoringType": 1,
        "answer": ["public", "protected", "private"],
        "answerAnalysis": "final 是非访问控制修饰符。"
      }
    }
  ]
}
```

**常见错误**

- `表单名称不能为空` — `name` 为必填项。
- `题目 id 重复: q_xxx` — 同一表单内的所有题目 `id` 必须保持唯一。
- `items[i].exam 仅允许用于 EXAM 表单` — 普通表单（`type: "ORDINARY"`）不可配置 `exam` 节点。
- `exam.score 必须大于 0` — 考试题分值不能为 0 或负数。
- `exam.answer 不存在于 options: xxx` — 考试题标准答案必须与 `options` 中的选项严格一致。

---

## copy_form

**用途**：快速克隆已有表单的所有题目结构、全局收集设置与主题外观生成一个全新表单。常用于周期性问卷、复用活动模板。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 被复制的源表单 Key |
| `name` | string | 否 | `"原表单名(副本)"` | 新副本表单的名称 |
| `folderId` | integer | 否 | 源表单所属目录 | 新表单要存放的归档文件夹 ID |

**输出示例**

```
表单复制成功！生成的新表单 Key 为: copy_AbCdEf12
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "name": "2026 秋季校园招聘简历投递表",
  "folderId": 102
}
```

**常见错误**

- `源表单不存在: xxx` — 传入的 `formKey` 无效。
- `目标文件夹不存在` — 传入了不存在的 `folderId`。

---

## update_form

**用途**：复合局部更新表单。支持在单次调用中按需修改表单名称（`name`）、描述（`description`）、收集状态（`status`）、归属文件夹（`folderId`）、题目列表（`items`）、主题样式（`theme`）以及全局设置（`setting`）。

> ⚠️ **注意**：
> 1. 若传入了 `items`，将执行全量重构覆盖；
> 2. **已发布（`RELEASE`）的表单不可直接修改题目列表**（会被服务端安全拦截），必须先 `stop_form` 停止收集，修改完成后再 `publish_form` 重新发布；或使用单题维护工具 `add_form_item` / `update_form_item`。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 待更新的表单 Key |
| `name` | string | 否 | - | 新表单名称 |
| `description` | string | 否 | - | 新表单描述说明 |
| `status` | string | 否 | - | 新状态：`RELEASE` 或 `STOP` |
| `folderId` | integer | 否 | - | 新归属文件夹 ID |
| `items` | array | 否 | - | 新题目列表（传则全量覆盖旧题目） |
| `theme` | object | 否 | - | 新主题视觉样式配置（见 `create_form` 的 `theme` 结构） |
| `setting` | object | 否 | - | 新收集与行为设置（见 `create_form` 的 `setting` 结构） |
| `logic` | object | 否 | - | 新逻辑规则 |

**输出示例**

```json
{
  "formKey": "hr2026spring",
  "name": "2026 春季校园招聘简历投递表（急聘）",
  "description": "欢迎投递 TDuck 核心岗位！",
  "type": "ORDINARY",
  "status": "STOP",
  "folderId": 102,
  "items": [ ... ],
  "theme": { ... },
  "setting": { ... }
}
```

**调用示例（仅修改名称与提交限制）**

```json
{
  "formKey": "hr2026spring",
  "name": "2026 春季校园招聘简历投递表（急聘）",
  "setting": {
    "ipWriteCountLimitStatus": true,
    "ipWriteCountLimit": 3
  }
}
```

**常见错误**

- `已发布表单不可直接修改题目` — 表单处于 `RELEASE` 状态时禁止全量更新 `items`。需先 `stop_form` 停止收集。
- `表单不存在: xxx` — `formKey` 无效。

---

## update_form_theme

**用途**：单独更新表单的主题视觉样式配置（包含主色调、背景色、横幅头图、Logo、提交按钮文案、独立封面欢迎页、防截图平铺水印等）。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `theme` | object | ✅ 是 | - | 主题视觉样式配置对象，各字段结构与 `create_form` 的 `theme` 一致 |

**输出示例**

```json
{
  "formKey": "hr2026spring",
  "name": "2026 春季校园招聘简历投递表",
  "theme": {
    "themeColor": "#67C23A",
    "backgroundColor": "#F0F9EB",
    "headImgUrl": "https://cdn.example.com/banner-spring.png",
    "submitBtnText": "立即投递简历",
    "watermark": true,
    "watermarkText": "TDuck 招聘专用"
  }
}
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "theme": {
    "themeColor": "#67C23A",
    "backgroundColor": "#F0F9EB",
    "headImgUrl": "https://cdn.example.com/banner-spring.png",
    "submitBtnText": "立即投递简历",
    "watermark": true,
    "watermarkText": "TDuck 招聘专用"
  }
}
```

**常见错误**

- `Logo 图片地址不能超过 1000 个字符` — 请传入合法的公网 URL。本地大图请先调用 `get_upload_ticket` 或 `upload_file`。

---

## update_form_setting

**用途**：单独更新表单的全局收集与行为设置（包含登录权限、白名单校验、微信环境限制、IP/账号频次限额、开放起止时间、提交后跳转、数据邮件/微信提醒、考试防作弊等）。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `setting` | object | ✅ 是 | - | 全局设置对象，各字段结构与 `create_form` 的 `setting` 一致 |

**输出示例**

```json
{
  "formKey": "hr2026spring",
  "name": "2026 春季校园招聘简历投递表",
  "setting": {
    "mustLogin": true,
    "ipWriteCountLimitStatus": true,
    "ipWriteCountLimit": 1,
    "ipWriteCountLimitDateType": 1,
    "emailNotify": true,
    "newWriteNotifyEmail": "admin@example.com"
  }
}
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "setting": {
    "mustLogin": true,
    "ipWriteCountLimitStatus": true,
    "ipWriteCountLimit": 1,
    "ipWriteCountLimitDateType": 1,
    "emailNotify": true,
    "newWriteNotifyEmail": "admin@example.com"
  }
}
```

---

## update_form_logic

**用途**：单独更新表单的显隐跳题逻辑规则与联动计算公式。支持为表单配置单选/多选联动显隐、多题跳转跳题、提前交卷结束、选项级显隐与自动选中、以及必填动态切换等。

### 数据结构体系

表单逻辑入参 `logic` 包含两大部分：
1. `rules`: 规则列表数组（`FormLogicRuleV2Request[]`），每条规则由前置条件 `conditionList` 与触发动作 `triggerList` 组成。
2. `formulaDsl`: 可选，自定义计算公式表达式（如 `SUM(q_math, q_chinese)`）。

```json
{
  "formKey": "survey2026",
  "logic": {
    "rules": [
      {
        "conditionList": [
          {
            "formItemId": "q_gender",
            "expression": "eq",
            "optionValue": "男",
            "relation": "AND"
          }
        ],
        "triggerList": [
          {
            "formItemId": "q_military",
            "type": "show"
          }
        ]
      }
    ],
    "formulaDsl": ""
  }
}
```

### 比较运算符（expression）与各题型取值规范（optionValue）

> ⚠️ **【严禁误区 · optionValue 绝非对象】**：
> `optionValue` 必须直接传入标量值（如 `"男"`、`1`、`5`）或数组（多选全选如 `["A", "B"]`）。**严禁**传入 `{"value": "男"}` 或 `{"label": "男"}` 等包装对象！直接传选项名称或持久化值即可。后端已支持传选项文本自动智能匹配转换。

| 运算符 (`expression`) | 运算符含义 | 支持题型 | 比较值格式 (`optionValue`) 规范与示例 |
| :--- | :--- | :--- | :--- |
| `eq` | 等于（单选精确匹配） | `RADIO`, `SELECT`, `IMAGE_SELECT` | **单值**（字符串或数字/选项 key），如 `"男"` 或 `1` |
| `eq` | 等于（多选全选匹配） | `CHECKBOX`, `MULTIPLE_SELECT` | **数组**（包含所有期望选中的选项值），如 `["羽毛球", "游泳"]` |
| `eq` | 等于（数值相等） | `RATE`, `NPS`, `NUMBER`, `SLIDER` | **数字**（整数或小数），如 `5` 或 `90.5` |
| `eq` | 等于（文本完全匹配） | `INPUT`, `TEXTAREA` | **字符串**，如 `"北京"` |
| `eq` | 等于（级联匹配） | `CASCADER`, `PROVINCE_CITY` | **数组或字符串**，如 `["浙江省", "杭州市"]` |
| `ne` | 不等于 | 适用题型同 `eq` | 格式同 `eq`（单选为单值，多选为数组，数值题为数字） |
| `like` | 多选包含某项 | `CHECKBOX`, `MULTIPLE_SELECT` | **单值**（要包含的单个选项值，不是数组！），如 `"羽毛球"` 或 `1` |
| `like` | 文本模糊匹配 | `INPUT`, `TEXTAREA` | **字符串**（包含的子串），如 `"经理"` |
| `notLike` | 多选不包含某项 | `CHECKBOX`, `MULTIPLE_SELECT` | **单值**（不能包含的单个选项值），如 `"羽毛球"` 或 `1` |
| `notLike` | 文本不包含 | `INPUT`, `TEXTAREA` | **字符串**，如 `"测试"` |
| `gt` | 大于 | `RATE`, `NPS`, `NUMBER`, `SLIDER` | **数字**，如 `8` |
| `ge` | 大于等于 | `RATE`, `NPS`, `NUMBER`, `SLIDER` | **数字**，如 `60` |
| `lt` | 小于 | `RATE`, `NPS`, `NUMBER`, `SLIDER` | **数字**，如 `60` |
| `le` | 小于等于 | `RATE`, `NPS`, `NUMBER`, `SLIDER` | **数字**，如 `3` |
| `isNull` | 为空（未填写） | 所有支持题型 | `null` 或 无需传值 |
| `notNull` | 不为空（已填写） | 所有支持题型 | `null` 或 无需传值 |

### 触发动作类型（type）

| 动作类型 (`type`) | 说明 | `formItemId` 要求 | `optionValue` 要求 |
| :--- | :--- | :--- | :--- |
| `show` | 显示目标题目（默认） | 目标题目 ID | 可不传 |
| `hide` | 隐藏目标题目 | 目标题目 ID | 可不传 |
| `jump` | 跳转到目标题目（跳过中间题） | 目标题目 ID | 可不传 |
| `finish` | 提前结束答卷 / 直接交卷 | 可为空 | 可不传 |
| `showOption` | 显示目标题目的特定选项 | 目标题目 ID | 选项值 |
| `hideOption` | 隐藏目标题目的特定选项 | 目标题目 ID | 选项值 |
| `checkOption` | 自动选中特定选项 | 目标题目 ID | 选项值 |
| `required` | 将目标字段动态设为必填 | 目标题目 ID | 可不传 |

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `logic` | object | ✅ 是 | - | 逻辑配置对象（包含 `rules` 数组与可选 `formulaDsl`） |

**调用示例 1：单选题与多选题组合显隐规则**

```json
{
  "formKey": "hr2026spring",
  "logic": {
    "rules": [
      {
        "conditionList": [
          {
            "formItemId": "q_role",
            "expression": "eq",
            "optionValue": "技术研发",
            "relation": "AND"
          }
        ],
        "triggerList": [
          {
            "formItemId": "q_github",
            "type": "show"
          },
          {
            "formItemId": "q_skills",
            "type": "show"
          }
        ]
      },
      {
        "conditionList": [
          {
            "formItemId": "q_skills",
            "expression": "like",
            "optionValue": "Java",
            "relation": "AND"
          }
        ],
        "triggerList": [
          {
            "formItemId": "q_jvm_exp",
            "type": "show"
          }
        ]
      }
    ]
  }
}
```

**调用示例 2：评分题跳题与提前结束交卷**

```json
{
  "formKey": "survey2026",
  "logic": {
    "rules": [
      {
        "conditionList": [
          {
            "formItemId": "q_score",
            "expression": "le",
            "optionValue": 2,
            "relation": "AND"
          }
        ],
        "triggerList": [
          {
            "formItemId": "q_complaint_reason",
            "type": "show"
          }
        ]
      },
      {
        "conditionList": [
          {
            "formItemId": "q_score",
            "expression": "ge",
            "optionValue": 9,
            "relation": "AND"
          }
        ],
        "triggerList": [
          {
            "type": "finish"
          }
        ]
      }
    ]
  }
}
```

**常见错误**

- `题目【xxx】在使用 'eq' 比较时，optionValue 必须为选项数组` — 多选题判断全选等于必须传数组 `["A", "B"]`；若需判断多选是否包含某项，请将运算符改为 `like`。
- `单选题【xxx】不支持大于/小于等数值比较运算符` — 单选题仅支持 `eq`, `ne`, `isNull`, `notNull`。
- `条件中引用的题目 ID【xxx】在表单中不存在` — 请检查 `formItemId` 是否正确，或先调用 `get_form_detail` 获取准确的题目 ID。

---

## get_form_logic

**用途**：查询指定表单当前配置的显隐跳题规则列表（`scheme`）与联动计算公式（`formulaDsl`）。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |

**输出示例**

```json
{
  "scheme": [
    {
      "conditionList": [
        {
          "formItemId": "radio_1700000001",
          "expression": "eq",
          "optionValue": "技术研发",
          "relation": "AND",
          "type": "condition"
        }
      ],
      "triggerList": [
        {
          "formItemId": "input_1700000002",
          "type": "show"
        }
      ]
    }
  ],
  "formulaDsl": ""
}
```

---

## replace_form_items

**用途**：全量覆盖并重置指定表单的题目列表。原有旧题目将被物理清理并按新结构重构。

> ⚠️ **注意**：已发布（`RELEASE`）的表单不可调用本工具，需先 `stop_form` 停止收集后再执行覆盖。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `items` | array | ✅ 是 | - | 覆盖后的完整题目列表数组，每项结构同 `create_form` 的 `items[]` |

**输出示例**

```
表单题目覆盖替换成功！共重构 5 道题目。
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "items": [
    { "id": "q_name", "type": "INPUT", "label": "姓名", "required": true },
    { "id": "q_phone", "type": "INPUT", "label": "手机号码", "required": true },
    { "id": "q_city", "type": "SELECT", "label": "意向城市", "options": ["北京", "上海", "深圳"] }
  ]
}
```

**常见错误**

- `已发布表单不可直接修改题目` — 请先调用 `stop_form`。
- `items 不能为空` — 必须传入至少一道题目。

---

## publish_form

**用途**：发布表单开启数据收集通道，锁定题目结构并返回对外填写的公开访问 URL。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 待发布的表单唯一标识 Key |

**输出示例**

```
表单发布成功！公开填写访问地址为：https://x.tduckcloud.com/tduck-api/s/hr2026spring
```

**调用示例**

```json
{
  "formKey": "hr2026spring"
}
```

---

## stop_form

**用途**：停止表单收集，关闭对外公开填写通道。停止后，外部访客打开表单链接将提示“该表单已停止收集”。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 待停止收集的表单唯一标识 Key |

**输出示例**

```
表单已成功停止收集！
```

---

## delete_form

**用途**：逻辑删除指定表单及其关联的所有题目与回收数据。

> ⚠️ **高危操作**：删除表单将同步删除所有历史收集的填报数据，操作前请向用户进行二次确认。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 待删除的表单唯一标识 Key |

**输出示例**

```
表单已成功删除！
```

---

## update_form_basic

**用途**：快速修改表单基础信息（仅更新表单名称和描述说明），不影响题目、外观及全局设置。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `name` | string | 否 | - | 新表单名称 |
| `description` | string | 否 | - | 新表单描述说明 |

**输出示例**

```
表单基础信息修改成功！
```

---

# 二、 单题精细化维护

## list_form_items

**用途**：获取指定表单的所有题目列表详情（采用扁平极简模型），返回所有题目的自定义 `id`、题型、标题、必填、选项列表与考试分值。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |

**输出示例**

```json
[
  {
    "id": "q_name",
    "type": "INPUT",
    "label": "姓名",
    "required": true,
    "placeholder": "请输入姓名",
    "sort": 1
  },
  {
    "id": "q_gender",
    "type": "RADIO",
    "label": "性别",
    "required": true,
    "options": ["男", "女"],
    "sort": 2
  }
]
```

---

## add_form_item

**用途**：在指定表单的末尾追加一道新题目。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `item` | object | ✅ 是 | - | 待追加的题目对象，结构见 `create_form` 的 `items[]` |

**输出示例**

```
题目追加成功！生成的题目 ID 为: q_wechat
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "item": {
    "id": "q_wechat",
    "type": "INPUT",
    "label": "微信号",
    "required": false,
    "placeholder": "方便招聘顾问与您取得联系"
  }
}
```

**常见错误**

- `题目 id 已存在: q_wechat` — 同一表单内题目自定义 ID 不能重复。

---

## update_form_item

**用途**：根据题目 ID（`item.id`）精细修改指定题目的标题、必填属性、选项列表、提示文案或考试分数设置。

> ⚠️ **注意**：单题更新必须保持原题目 `id`，不可修改题目 `id`。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `item` | object | ✅ 是 | - | 待更新的题目对象，必须包含目标题目的 `id` |

**输出示例**

```json
{
  "id": "q_gender",
  "type": "RADIO",
  "label": "您的生理性别",
  "required": true,
  "options": ["男", "女", "保密"],
  "sort": 2
}
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "item": {
    "id": "q_gender",
    "type": "RADIO",
    "label": "您的生理性别",
    "required": true,
    "options": ["男", "女", "保密"]
  }
}
```

**常见错误**

- `V2 更新不能修改题目 id` — 单题更新不能改变题目的 `id`。
- `题目不存在: xxx` — 传入了未知的题目 `id`。

---

## delete_form_item

**用途**：从指定表单中物理删除某一道题目。

> ⚠️ **安全红线**：删除题目会导致该题目在历史填报中的关联数据无法检索！**执行删除前必须先调用 `check_field_data`** 检查是否已有历史填报数据。若有数据，必须向用户警示并获得显式确认后方可调用此工具。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `itemId` | string | ✅ 是 | - | 待删除题目的自定义 ID（如 `"q_wechat"`） |

**输出示例**

```
题目删除成功！
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "itemId": "q_wechat"
}
```

---

# 三、 题目安全与防误删预检

## check_field_data

**用途**：在删除题目（`delete_form_item`）或修改关键选项前，预检该题目或选项在历史提交中是否已有用户填报数据，防止误删已收集的数据。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单全局唯一标识 Key |
| `itemId` | string | ✅ 是 | - | 待检查的题目自定义 ID（如 `"q_gender"`） |
| `choiceValue` | string | 否 | - | 指定选项值（可选，仅检查特定选项是否被选过） |

**输出示例（已有数据情况）**

```json
{
  "formKey": "hr2026spring",
  "itemId": "q_gender",
  "hasData": true,
  "dataCount": 128,
  "message": "该题目/选项在历史填报中已有 128 条关联数据，删除可能导致历史数据丢失，请谨慎操作！"
}
```

**输出示例（无数据安全情况）**

```json
{
  "formKey": "hr2026spring",
  "itemId": "q_wechat",
  "hasData": false,
  "dataCount": 0,
  "message": "该题目暂无历史填报数据，可安全删除或修改。"
}
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "itemId": "q_gender",
  "choiceValue": "女"
}
```

---

# 四、 附件与图片上传

## get_upload_ticket

**用途**：【核心推荐 · 唯一本地上传通道】获取本地文件/图片免密直传预签名凭证（Upload Ticket）及开箱即用的极简 curl 执行命令。大模型在本地生成或持有图片（如 Logo、头图、题目配图）或文件附件时，**必须且唯一走此工具获取凭证并直传接口**，彻底杜绝 Base64 导致的几十万 Token 膨胀与上下文截断。凭证 15 分钟有效。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `fileName` | string | 否 | - | 上传文件名称（如 `"logo.png"`、`"banner.jpg"`、`"resume.pdf"`） |
| `itemId` | string | 否 | - | 关联的题目自定义 ID（可选） |

**输出示例**

```json
{
  "ticket": "TKT_8f9a2b3c4d5e",
  "uploadUrl": "https://x.tduckcloud.com/tduck-api/open/v2/form/data/upload-ticket?ticket=TKT_8f9a2b3c4d5e",
  "curlCommand": "curl -s -F \"file=@./logo.png\" \"https://x.tduckcloud.com/tduck-api/open/v2/form/data/upload-ticket?ticket=TKT_8f9a2b3c4d5e\"",
  "pythonCode": "import requests\nresp = requests.post('https://x.tduckcloud.com/tduck-api/open/v2/form/data/upload-ticket?ticket=TKT_8f9a2b3c4d5e', files={'file': open('./logo.png', 'rb')})\nprint(resp.json()['data']['fileUrl'])",
  "expireSeconds": 900
}
```

**本地直传执行流程**

1. 调用 `get_upload_ticket(formKey, fileName="logo.png")` 获取临时直传 `uploadUrl` 与 `curlCommand`；
2. 在本地终端直接执行返回的 `curlCommand` 上传本地文件流；
3. 上传接口直接返回包含真实公网 `fileUrl` 的 JSON（如 `{"data": {"fileUrl": "https://.../logo.png"}}`）；
4. 将获取到的公网 `fileUrl` 填入 `theme.headImgUrl`、`theme.logoImgUrl` 或数据填报 payload 中。

---

## upload_file

**用途**：转存网络图片链接为表单持久化附件并换取公网访问 URL (`fileUrl`)。仅用于网络图片（`remoteUrl`）由服务端自动抓取转存（推荐，零 Token 消耗、零本地流量）；若需上传本地文件或图片，请务必使用 `get_upload_ticket` 获取凭证后直传。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `remoteUrl` | string | ✅ 是 | - | 网络图片 URL（远程图片转存模式） |
| `fileName` | string | 否 | - | 保存的文件名称（如 `"banner.jpg"`） |
| `itemId` | string | 否 | - | 关联的题目自定义 ID（可选） |

**输出示例**

```json
{
  "fileName": "banner.jpg",
  "fileUrl": "https://x.tduckcloud.com/tduck-api/storage/2026/08/20/abc123banner.jpg",
  "fileSize": 154200,
  "fileType": "image/jpeg"
}
```

**调用示例（远程抓取）**

```json
{
  "formKey": "hr2026spring",
  "remoteUrl": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200",
  "fileName": "banner.jpg"
}
```

---

# 五、 文件夹归档管理

## list_folders

**用途**：获取当前用户的所有一级表单归档分类文件夹列表。

**输入参数**：无参数

**输出示例**

```json
[
  {
    "id": 101,
    "name": "人力资源招聘",
    "sort": 1
  },
  {
    "id": 102,
    "name": "客户满意度回访",
    "sort": 2
  }
]
```

---

## create_folder

**用途**：创建新的表单归档一级文件夹。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `name` | string | ✅ 是 | - | 文件夹名称（如 `"2026 校园招聘专项"`） |

**输出示例**

```
文件夹创建成功！文件夹 ID 为: 103
```

**调用示例**

```json
{
  "name": "2026 校园招聘专项"
}
```

---

## move_form_folder

**用途**：将表单移动归档到指定文件夹中。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `folderId` | integer | ✅ 是 | - | 目标文件夹 ID（`0` 表示移出文件夹回到根目录） |

**输出示例**

```
表单文件夹归档移动成功！
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "folderId": 103
}
```

---

# 六、 表单填报数据管理

## query_form_data

**用途**：分页查询表单已收集的填报数据列表。字段自动映射为设计时的自定义题目 ID（如 `q_name`、`q_gender`），支持关键字模糊搜索（`keyword`）与提交时间范围筛选（`beginTime`/`endTime`）。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `current` | integer | 否 | 1 | 当前分页页码（从 1 开始） |
| `size` | integer | 否 | 20 | 每页展示条数（最大限制 100） |
| `keyword` | string | 否 | - | 关键字模糊匹配（支持搜索答案内容、提交 IP 等） |
| `beginTime` | string | 否 | - | 开始时间（格式：`yyyy-MM-dd HH:mm:ss`） |
| `endTime` | string | 否 | - | 结束时间（格式：`yyyy-MM-dd HH:mm:ss`） |

**输出示例**

```json
{
  "total": 2,
  "current": 1,
  "size": 20,
  "rows": [
    {
      "id": 1001,
      "dataId": "d_8f9a2b3c4d5e",
      "formKey": "hr2026spring",
      "createTime": "2026-08-20 11:00:00",
      "updateTime": "2026-08-20 11:00:00",
      "submitBrowser": "Chrome 128.0",
      "submitRequestIp": "120.229.10.25",
      "submitAddress": "广东省深圳市",
      "submitOs": "Mac OS X",
      "data": {
        "q_name": "张伟",
        "q_gender": "男",
        "q_phone": "13800000001",
        "q_position": "后端研发工程师",
        "q_resume": "https://x.tduckcloud.com/tduck-api/storage/2026/08/20/zhangwei_resume.pdf"
      }
    },
    {
      "id": 1002,
      "dataId": "d_1a2b3c4d5e6f",
      "formKey": "hr2026spring",
      "createTime": "2026-08-20 11:15:00",
      "updateTime": "2026-08-20 11:15:00",
      "submitBrowser": "Safari 17.5",
      "submitRequestIp": "116.23.45.67",
      "submitAddress": "北京市海淀区",
      "submitOs": "iOS",
      "data": {
        "q_name": "王芳",
        "q_gender": "女",
        "q_phone": "13800000002",
        "q_position": "产品经理",
        "q_resume": "https://x.tduckcloud.com/tduck-api/storage/2026/08/20/wangfang_resume.pdf"
      }
    }
  ]
}
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "keyword": "张伟",
  "beginTime": "2026-08-01 00:00:00",
  "endTime": "2026-08-31 23:59:59",
  "current": 1,
  "size": 10
}
```

---

## get_form_data_detail

**用途**：根据数据全局唯一 `dataId` 查询单条填报数据的完整详细内容与元数据。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `dataId` | string | ✅ 是 | - | 数据全局唯一标识 UUID（如 `"d_8f9a2b3c4d5e"`） |

**输出示例**

```json
{
  "id": 1001,
  "dataId": "d_8f9a2b3c4d5e",
  "formKey": "hr2026spring",
  "createTime": "2026-08-20 11:00:00",
  "updateTime": "2026-08-20 11:00:00",
  "submitBrowser": "Chrome 128.0",
  "submitRequestIp": "120.229.10.25",
  "submitAddress": "广东省深圳市",
  "submitOs": "Mac OS X",
  "data": {
    "q_name": "张伟",
    "q_gender": "男",
    "q_phone": "13800000001",
    "q_position": "后端研发工程师",
    "q_resume": "https://x.tduckcloud.com/tduck-api/storage/2026/08/20/zhangwei_resume.pdf"
  }
}
```

---

## submit_form_data

**用途**：向指定表单新增录入一条填报数据。字段键必须使用设计时定义的题目自定义 `id`（如 `q_name`、`q_gender`）。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `data` | object | ✅ 是 | - | 填报数据字典（键为题目 `id`，值为对应答案） |

**输出示例**

```
数据填报成功！生成的数据 ID 为: d_9a8b7c6d5e4f
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "data": {
    "q_name": "李强",
    "q_gender": "男",
    "q_phone": "13800000003",
    "q_position": "前端研发工程师",
    "q_resume": "https://x.tduckcloud.com/tduck-api/storage/2026/08/20/liqiang_resume.pdf"
  }
}
```

**常见错误**

- `【xx】选项【yy】不存在` — 单选/多选题填报值必须与表单中定义的选项一致。
- `【xx】为必填项` — 必填题目未提供答案。

---

## batch_submit_form_data

**用途**：批量向表单写入多条填报数据。适合将本地 Excel/CSV 数据或批量生成的名单导入到 TDuck 表单中。**单批次最多支持 100 条**；超过 100 条需在客户端自行分批循环提交。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `list` | array | ✅ 是 | - | 数据对象数组（单次批量最多 100 条），每个元素均为 `{ 题目id: 答案 }` |

**输出示例**

```
批量导入成功！成功写入 3 条记录。
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "list": [
    {
      "q_name": "张伟",
      "q_gender": "男",
      "q_phone": "13800000001",
      "q_position": "后端研发工程师"
    },
    {
      "q_name": "王芳",
      "q_gender": "女",
      "q_phone": "13800000002",
      "q_position": "产品经理"
    },
    {
      "q_name": "李强",
      "q_gender": "男",
      "q_phone": "13800000003",
      "q_position": "前端研发工程师"
    }
  ]
}
```

**常见错误**

- `单次批量提交不能超过 100 条` — 请在客户端将数据拆分成每批 ≤100 条分批提交。

---

## update_form_data

**用途**：根据数据全局唯一 `dataId` 局部修改单条已提交的数据内容。只更新传入的题目 `id` 字段，未传入的字段原值保持不变。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `dataId` | string | ✅ 是 | - | 待修改的数据全局唯一标识 UUID（如 `"d_8f9a2b3c4d5e"`） |
| `data` | object | ✅ 是 | - | 待更新的数据项字典 `{ 题目id: 新答案 }` |

**输出示例**

```
数据修改成功！
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "dataId": "d_8f9a2b3c4d5e",
  "data": {
    "q_position": "架构研发工程师"
  }
}
```

**常见错误**

- `数据不存在: xxx` — `dataId` 不存在或已被删除。

---

## delete_form_data

**用途**：根据数据唯一 `dataId` 删除指定的单条填报数据。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `dataId` | string | ✅ 是 | - | 待删除的数据全局唯一标识 UUID |

**输出示例**

```
数据删除成功！
```

**调用示例**

```json
{
  "formKey": "hr2026spring",
  "dataId": "d_8f9a2b3c4d5e"
}
```

---

# 七、 对外公开自助查询页 (Opensearch)

## list_opensearch_queries

**用途**：查询表单对外公开自助查询页配置列表（供外部访客凭借准考证号、手机号、身份证号自助查询成绩或登记结果）。返回所有查询配置的 ID、标题、状态、对外访问 URL、查询凭证与展示字段。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key（如 `"hr2026spring"`） |

**输出示例**

```json
[
  {
    "id": 1,
    "formKey": "hr2026spring",
    "name": "2026 春招初试结果自助查询",
    "description": "请输入投递时填写的手机号查询初试通过结果",
    "status": 1,
    "enabled": true,
    "queryUrl": "https://form.tduckcloud.com/q/hr2026spring?qid=1",
    "queryFields": [
      {
        "fieldId": "q_phone",
        "label": "手机号码",
        "method": "EQ"
      }
    ],
    "showFields": ["q_name", "q_score", "q_pass_status"],
    "showFieldLabels": ["姓名", "初试得分", "面试结果"],
    "queryWay": "INPUT",
    "styleType": "CARD",
    "queryFieldRelation": "AND",
    "inputAllCondition": true,
    "allowModify": false,
    "allowConfirm": false,
    "confirmBtnText": "确认无误",
    "btnText": "查询结果",
    "errorMsg": "未查询到相关投递记录，请核对手机号",
    "validityPeriod": ["2026-08-01 00:00:00", "2026-09-01 00:00:00"],
    "validityMsg": "查询通道已于 2026-09-01 关闭",
    "allowExport": true,
    "hideEmptyValue": false,
    "smsVerifyField": null,
    "smsVerifyFieldType": null,
    "rateLimitMinute": 10,
    "rateLimitHour": 100,
    "createTime": "2026-08-21 10:00:00",
    "updateTime": "2026-08-21 10:00:00"
  }
]
```

---

## get_opensearch_query

**用途**：查询指定对外公开查询页的完整规则与高级安全配置（含查询方式、展示样式、短信验证、数据确认、有效期范围与限流）。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `queryId` | integer | ❌ 否 | `null` | 公开查询配置 ID（若不传则默认返回该表单下的首个配置） |

**输出示例**

```json
{
  "id": 1,
  "formKey": "hr2026spring",
  "name": "2026 春招初试结果自助查询",
  "description": "请输入投递时填写的手机号查询初试通过结果",
  "status": 1,
  "enabled": true,
  "queryUrl": "https://form.tduckcloud.com/q/hr2026spring?qid=1",
  "queryFields": [
    {
      "fieldId": "q_phone",
      "label": "手机号码",
      "method": "EQ"
    }
  ],
  "showFields": ["q_name", "q_score", "q_pass_status"],
  "showFieldLabels": ["姓名", "初试得分", "面试结果"],
  "queryWay": "INPUT",
  "styleType": "CARD",
  "queryFieldRelation": "AND",
  "inputAllCondition": true,
  "allowModify": false,
  "allowConfirm": false,
  "confirmBtnText": "确认无误",
  "btnText": "查询结果",
  "errorMsg": "未查询到相关投递记录，请核对手机号",
  "validityPeriod": ["2026-08-01 00:00:00", "2026-09-01 00:00:00"],
  "validityMsg": "查询通道已关闭",
  "allowExport": true,
  "hideEmptyValue": false,
  "smsVerifyField": null,
  "rateLimitMinute": 10,
  "rateLimitHour": 100,
  "createTime": "2026-08-21 10:00:00",
  "updateTime": "2026-08-21 10:00:00"
}
```

---

## create_opensearch_query

**用途**：为表单创建对外公开查询页（允许外部访客通过指定凭证字段自助查询填报结果或成绩）。支持极简模式快速创建，亦支持多条件凭证与全量安全/显示配置。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key（如 `"hr2026spring"`） |
| `title` / `name` | string | ✅ 是 | - | 查询页标题说明（如 `"2026 春招初试结果自助查询"`） |
| `queryFieldId` | string | 🟡 推荐 | - | 单凭证查询题目 ID（如 `"q_phone"` 或 `"q_id_card"`） |
| `queryFields` | array | ❌ 否 | - | 复合多条件凭证列表：`[{"fieldId": "q_phone", "method": "EQ"}]` |
| `matchMethod` | string | ❌ 否 | `"EQ"` | 凭证匹配方式（`EQ`: 精确匹配, `INCLUDE`: 包含/多选, `START_WITH`: 开头匹配, `END_WITH`: 结尾匹配） |
| `showFieldIds` | array[string] | ❌ 否 | `全部题目` | 结果对外展示的题目 ID 列表（如 `["q_name", "q_score"]`）；若不传则默认展示所有非辅助题目 |
| `description` | string | ❌ 否 | `""` | 查询说明富文本描述 |
| `enabled` | boolean | ❌ 否 | `true` | 是否立即启用公开查询 |
| `styleType` | string | ❌ 否 | `"CARD"` | 结果展示样式（`"CARD"`: 卡片样式, `"TABLE"`: 表格样式） |
| `queryWay` | string | ❌ 否 | `"INPUT"` | 查询方式（`"INPUT"`: 填写条件, `"LOGIN_USER"`: 登录用户自动查, `"WECHAT_AUTH"`: 微信认证自动查） |
| `queryFieldRelation` | string | ❌ 否 | `"AND"` | 多条件组合逻辑关系（`"AND"` 或 `"OR"`） |
| `inputAllCondition` | boolean | ❌ 否 | `true` | 是否需要输入全部条件方可查询 |
| `btnText` | string | ❌ 否 | `"查询"` | 查询按钮文案 |
| `errorMsg` | string | ❌ 否 | `""` | 查无结果时的自定义提示文字 |
| `allowModify` | boolean | ❌ 否 | `false` | 查到结果后是否允许访客修改填报数据 |
| `allowConfirm` | boolean | ❌ 否 | `false` | 是否开启数据确认（如考生签字确认成绩） |
| `confirmBtnText` | string | ❌ 否 | `"确认无误"` | 数据确认按钮文字 |
| `allowExport` | boolean | ❌ 否 | `true` | 是否允许导出 PDF / 表格 |
| `hideEmptyValue` | boolean | ❌ 否 | `false` | 结果中未填写的空值题目是否自动隐藏 |
| `smsVerifyField` | string | ❌ 否 | `null` | 开启短信/邮箱验证码校验的题目 ID（如 `"q_phone"`） |
| `rateLimitMinute` | integer | ❌ 否 | `null` | 单 IP 每分钟最多查询次数限制 |
| `rateLimitHour` | integer | ❌ 否 | `null` | 单 IP 每小时最多查询次数限制 |
| `validityPeriod` | array[string] | ❌ 否 | `null` | 查询开放时间范围 `["2026-08-01 00:00:00", "2026-09-01 00:00:00"]` |
| `validityMsg` | string | ❌ 否 | `""` | 不在有效期内的提示文案 |

**输出示例**

```
【对外公开自助查询页】创建成功！
表单 Key: hr2026spring
查询 ID: 1
查询标题: 2026 春招初试结果自助查询
对外公开查询访问地址为: https://form.tduckcloud.com/q/hr2026spring?qid=1
```

**极简调用示例**

```json
{
  "formKey": "hr2026spring",
  "title": "2026 春招初试结果自助查询",
  "queryFieldId": "q_phone"
}
```

**复合高级配置调用示例**

```json
{
  "formKey": "hr2026spring",
  "title": "2026 春招期末考核成绩自主查询",
  "description": "请输入姓名与投递手机号查询录取状态",
  "queryFields": [
    { "fieldId": "q_name", "method": "EQ" },
    { "fieldId": "q_phone", "method": "EQ" }
  ],
  "showFieldIds": ["q_name", "q_dept", "q_score", "q_status"],
  "styleType": "CARD",
  "queryFieldRelation": "AND",
  "allowConfirm": true,
  "confirmBtnText": "确认录取通知",
  "btnText": "立即查询",
  "allowExport": true,
  "rateLimitMinute": 5
}
```

---

## edit_opensearch_query

**用途**：修改或启停指定表单的对外公开查询页（可更新启停状态 `enabled`、标题、查询凭证、展示字段及所有高级配置）。

**输入参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `formKey` | string | ✅ 是 | - | 表单唯一标识 Key |
| `queryId` | integer | ❌ 否 | `null` | 公开查询配置 ID（若不传则默认修改该表单下的首个配置） |
| `enabled` | boolean | ❌ 否 | - | 是否启用公开查询（`true` 为启用, `false` 为停用） |
| `title` / `name` | string | ❌ 否 | - | 新的查询页标题 |
| `queryFieldId` | string | ❌ 否 | - | 新的查询凭证题目 ID |
| `queryFields` | array | ❌ 否 | - | 新的复合查询条件列表 |
| `showFieldIds` | array[string] | ❌ 否 | - | 新的对外展示题目 ID 列表 |
| `styleType` | string | ❌ 否 | - | 结果样式（`"CARD"` 或 `"TABLE"`） |
| `allowModify` | boolean | ❌ 否 | - | 是否允许修改数据 |
| `allowConfirm` | boolean | ❌ 否 | - | 是否允许数据确认 |

**输出示例**

```
【对外公开自助查询页】表单 hr2026spring 的对外公开查询配置已更新！
查询 ID: 1
当前状态: 已启用
对外公开查询访问地址为: https://form.tduckcloud.com/q/hr2026spring?qid=1
```

**调用示例（仅启停）**

```json
{
  "formKey": "hr2026spring",
  "enabled": true
}
```

**调用示例（修改标题与展示字段）**

```json
{
  "formKey": "hr2026spring",
  "title": "2026 春季校招结果查询（第二轮）",
  "showFieldIds": ["q_name", "q_score", "q_status", "q_offer_url"],
  "enabled": true
}
```

---

# 常见错误速查与排查指南

| 错误信息关键字 | 触发原因 | 正确排查与解决方案 |
| :--- | :--- | :--- |
| `表单不存在: xxx` | 传入的 `formKey` 错误或已被删除 | 调用 `list_forms` 重新确认有效表单 Key |
| `已发布表单不可直接修改题目` | 表单状态为 `RELEASE` 时试图全量覆盖 `items` | 先调用 `stop_form` 停止收集，修改完成后再调用 `publish_form` 重新发布；或使用 `add_form_item`/`update_form_item` 单题维护 |
| `题目 id 重复: q_xxx` | 同一表单内定义了两个相同 `id` 的题目 | 确保每个题目的 `id` 在当前表单中唯一 |
| `items[i].exam 仅允许用于 EXAM 表单` | 在 `type: "ORDINARY"` 的普通表单中传入了 `exam` 节点 | 只有在创建 `type: "EXAM"` 的考试表单时才允许配置 `exam` 评分属性 |
| `exam.score 必须大于 0` | 试题分值设置为 0 或负数 | 将分值调整为正数（如 `10`、`5`） |
| `exam.answer 不存在于 options: xxx` | 考试题答案在 `options` 选项列表中不存在 | 检查 `exam.answer` 与 `options` 的拼写和大小写，保持严格一致 |
| `V2 更新不能修改题目 id` | 单题更新 `update_form_item` 时改变了题目 `id` | 单题更新必须保持原题目 `id`，仅修改 `label`、`required`、`options` 等属性 |
| `单次批量提交不能超过 100 条` | `batch_submit_form_data` 数组长度 > 100 | 在客户端按每批 ≤100 条进行分批提交 |
| `【xx】选项【yy】不存在` | 填报数据时选择了 options 以外的值 | 确认填报的值与表单题目定义的 options 选项文本一致 |
| `该题目/选项在历史填报中已有 N 条关联数据` | 删题/改选项时预检查出已有历史数据 | 明确向用户展示数据条数并提示丢失风险，获得用户二次确认后再执行操作 |
| `size 超过最大限制 100` | 分页查询参数 `size` 超限 | 将 `size` 设置在 1 到 100 之间 |
