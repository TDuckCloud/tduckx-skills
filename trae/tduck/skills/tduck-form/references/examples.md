# TDuck MCP 典型实战示例手册

本文档收录 TDuck（填鸭表单）开放平台在日常办公与系统集成中的典型实操场景，包含完整的用户 Prompt、AI 助手工具编排链路、标准化请求 Payload、预期响应输出及关键约束要点，帮助 AI 助手和开发者精准调用。

---

## 目录索引

| 类别 | 场景编号与名称 | 核心工具链路 |
| :--- | :--- | :--- |
| **一、 表单与问卷搭建** | [1.1 活动/招聘报名表（全属性建表并立即发布）](#11-活动招聘报名表全属性建表并立即发布) | `create_form` → `publish_form` |
| | [1.2 在线考试测评卷（自动判分与解析配置）](#12-在线考试测评卷自动判分与解析配置) | `create_form (type=EXAM)` → `publish_form` |
| | [1.3 复制已有表单并改造](#13-复制已有表单并改造) | `list_forms` → `copy_form` → `get_form_detail` → `update_form` / `update_form_item` |
| | [1.4 动态追加题目与安全防误删](#14-动态追加题目与安全防误删) | `add_form_item` / `check_field_data` → `delete_form_item` |
| **二、 数据查询与统计分析** | [2.1 条件组合筛选 + 排序 + 敏感数据脱敏](#21-条件组合筛选--排序--敏感数据脱敏) | `get_form_detail` → `query_form_data` → 客户端投影/脱敏 |
| | [2.2 多维度汇总统计与数据洞察](#22-多维度汇总统计与数据洞察) | `get_form_detail` → `query_form_data` → 客户端分组聚合 |
| | [2.3 检索特定记录并穿透查看详情](#23-检索特定记录并穿透查看详情) | `query_form_data` → `get_form_data_detail` |
| **三、 数据录入、修改与运维** | [3.1 批量更新填报数据状态](#31-批量更新填报数据状态) | `query_form_data` → 用户确认 → 循环 `update_form_data` |
| | [3.2 外部花名册批量导入](#32-外部花名册批量导入) | `get_form_detail` → `batch_submit_form_data` (≤100条/批) |
| | [3.3 散客数据补录与单条精准修改](#33-散客数据补录与单条精准修改) | `get_form_detail` → `submit_form_data` / `update_form_data` |
| | [3.4 批量删除高危测试数据](#34-批量删除高危测试数据) | `query_form_data` → 明确确认 → 循环 `delete_form_data` |
| **四、 复杂串联与高级扩展** | [4.1 综合串联：克隆旧表 + 字段瘦身 + 输出历史摘要](#41-综合串联克隆旧表--字段瘦身--输出历史摘要) | `copy_form` → `delete_form_item` + `query_form_data` 聚合 |
| | [4.2 表单视觉升级与头图/Logo 资源上传](#42-表单视觉升级与头图logo-资源上传) | `upload_file` / `get_upload_ticket` → `update_form_theme` |
| | [4.3 收集规则与安全风控一键配置](#43-收集规则与安全风控一键配置) | `update_form_setting`（限额、起止时间、IP防刷、通知） |
| | [4.4 表单归档与分类整理](#44-表单归档与分类整理) | `list_folders` → `create_folder` → `move_form_folder` |
| | [4.5 开启对外公开自助查询页 (Opensearch)](#45-开启对外公开自助查询页-opensearch) | `create_opensearch_query` → `edit_opensearch_query` |
| **五、 模板速查表** | [Prompt 模板与快捷指令速查](#五-prompt-模板与快捷指令速查) | 常用自然语言 Prompt 与调用对照 |

---

## 一、 表单与问卷搭建

### 1.1 活动/招聘报名表（全属性建表并立即发布）

**Prompt：**

> “帮我创建一个‘2026 春季校园招聘简历投递表’，字段包括：
> - 姓名（必填）
> - 性别（单选：男/女，必填）
> - 手机号（必填）
> - 毕业院校（必填）
> - 应聘岗位（下拉单选：前端研发工程师/后端研发工程师/产品经理/UI设计师，必填）
> - 期望工作城市（多选：北京/上海/深圳/杭州）
> - 个人简历（附件上传，必填，提示支持 PDF/Word 且不超过 20MB）
> - 自我介绍（多行文本，选填）
> 
> 主题用科技蓝（`#1890FF`），开启每个 IP 限填 1 次，有新提交通知邮箱 `hr@example.com`。创建好后直接帮我发布，并把填写的公开链接发给我。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `create_form` 创建包含题目、主题配色与全局设置的完整表单
   ```json
   {
     "name": "2026 春季校园招聘简历投递表",
     "description": "欢迎投递 TDuck 核心技术与产品岗位，请如实填写个人信息并上传简历附件。",
     "type": "ORDINARY",
     "items": [
       { "id": "q_name", "type": "INPUT", "label": "姓名", "required": true, "placeholder": "请输入姓名" },
       { "id": "q_gender", "type": "RADIO", "label": "性别", "required": true, "options": ["男", "女"] },
       { "id": "q_phone", "type": "INPUT", "label": "手机号", "required": true, "placeholder": "请输入 11 位手机号码" },
       { "id": "q_school", "type": "INPUT", "label": "毕业院校", "required": true, "placeholder": "请输入毕业院校全称" },
       {
         "id": "q_position",
         "type": "SELECT",
         "label": "应聘岗位",
         "required": true,
         "options": ["前端研发工程师", "后端研发工程师", "产品经理", "UI设计师"]
       },
       {
         "id": "q_cities",
         "type": "CHECKBOX",
         "label": "期望工作城市",
         "required": false,
         "options": ["北京", "上海", "深圳", "杭州"]
       },
       {
         "id": "q_resume",
         "type": "UPLOAD",
         "label": "个人简历",
         "required": true,
         "description": "支持 PDF/Word 格式，大小不超过 20MB"
       },
       {
         "id": "q_intro",
         "type": "TEXTAREA",
         "label": "自我介绍",
         "required": false,
         "placeholder": "请简要介绍您的技术特长或项目经验"
       }
     ],
     "theme": {
       "themeColor": "#1890FF",
       "backgroundColor": "#F5F7FA",
       "submitBtnText": "立即投递简历",
       "showFormTitle": true,
       "showFormDescribe": true
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
   *返回：`表单创建成功！生成的表单 Key 为: hr2026spring`*

2. **步骤 2**：调用 `publish_form` 开启对外收集通道
   ```json
   {
     "formKey": "hr2026spring"
   }
   ```
   *返回：`表单发布成功！公开填写访问地址为：https://x.tduckcloud.com/tduck-api/s/hr2026spring`*

**预期回复输出：**

```markdown
✅ **已为您成功创建并发布【2026 春季校园招聘简历投递表】！**

- **表单 Key**：`hr2026spring`
- **公开填写链接**：https://x.tduckcloud.com/tduck-api/s/hr2026spring
- **题目明细（8题）**：姓名*、性别*、手机号*、毕业院校*、应聘岗位*、期望城市、简历附件*、自我介绍
- **防刷与通知**：已开启单 IP 仅允许提交 1 次；新简历提交将实时邮件提醒至 `hr@example.com`
- **主题外观**：科技蓝风格（#1890FF）

候选人打开上方链接即可在线填报与上传简历。
```

---

### 1.2 在线考试测评卷（自动判分与解析配置）

**Prompt：**

> “帮我建一份‘Java 核心技术随堂测评’考试卷，包含 2 道单选题和 1 道多选题，每题 10 分，满分 30 分，交卷后允许查看标准答案与解析：
> 1. 单选：Java 中所有类的根父类是？（选项：Class, Object, String, System；答案：Object；解析：java.lang.Object 是所有类的超类）
> 2. 单选：下列哪种集合类是线程安全的？（选项：ArrayList, HashMap, ConcurrentHashMap, LinkedList；答案：ConcurrentHashMap；解析：ConcurrentHashMap 采用 CAS+分段机制保障并发安全）
> 3. 多选：下列属于 Java 访问权限修饰符的有？（选项：public, protected, private, final；答案：public/protected/private；解析：final 是非访问修饰符）
> 
> 创建好后直接发布。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `create_form`，显式设置 `type: "EXAM"`，并为每道试题配置 `exam` 节点
   ```json
   {
     "name": "Java 核心技术随堂测评",
     "description": "共 3 题，满分 30 分。交卷后系统自动判分并展示正确答案与解析。",
     "type": "EXAM",
     "items": [
       {
         "id": "q_java_1",
         "type": "RADIO",
         "label": "1. Java 中所有类的根父类是？",
         "required": true,
         "options": ["Class", "Object", "String", "System"],
         "exam": {
           "score": 10,
           "answer": "Object",
           "answerAnalysis": "java.lang.Object 是所有 Java 类的顶级父类。",
           "showAnswer": true
         }
       },
       {
         "id": "q_java_2",
         "type": "RADIO",
         "label": "2. 下列哪种集合类是线程安全的？",
         "required": true,
         "options": ["ArrayList", "HashMap", "ConcurrentHashMap", "LinkedList"],
         "exam": {
           "score": 10,
           "answer": "ConcurrentHashMap",
           "answerAnalysis": "ConcurrentHashMap 采用 CAS 和 synchronized 保障线程安全。",
           "showAnswer": true
         }
       },
       {
         "id": "q_java_3",
         "type": "CHECKBOX",
         "label": "3. 下列属于 Java 访问权限修饰符的有？（多选）",
         "required": true,
         "options": ["public", "protected", "private", "final"],
         "exam": {
           "score": 10,
           "scoringType": 1,
           "answer": ["public", "protected", "private"],
           "answerAnalysis": "Java 访问权限修饰符包括 public、protected、default（缺省）和 private；final 属于非访问控制修饰符。",
           "showAnswer": true
         }
       }
     ],
     "theme": {
       "themeColor": "#67C23A",
       "submitBtnText": "交卷出分"
     }
   }
   ```
   *返回：`表单创建成功！生成的表单 Key 为: exam_java_core`*

2. **步骤 2**：调用 `publish_form(formKey="exam_java_core")` 发布试卷。

> ⚠️ **关键约束**：
> - `exam` 节点**仅限在 `type: "EXAM"` 时传入**；在普通表单中传入会被服务端拒绝。
> - `exam.score` 必须大于 0；多选题答案 `answer` 需传数组 `["A", "B"]`，且答案内容必须在 `options` 中严格存在。

---

### 1.3 复制已有表单并改造

**Prompt：**

> “把‘2025 年会报名表’复制一份，改名叫‘2026 年会报名表’。把里面的‘接送班车地点’这道题去掉，追加一道‘是否携带家属’（单选：是/否，必填）。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `list_forms(keyword="2025 年会报名表")` 检索源表单，拿到 `formKey="party_2025"`
2. **步骤 2**：调用 `copy_form` 生成新副本
   ```json
   {
     "formKey": "party_2025",
     "name": "2026 年会报名表"
   }
   ```
   *返回：`生成的新表单 Key 为: party_2026`*
3. **步骤 3**：调用 `get_form_detail(formKey="party_2026")` 读取新表的题目列表，定位到“接送班车地点”的题目 ID 为 `q_bus_station`
4. **步骤 4**：删除旧题并追加新题
   - 调用 `delete_form_item(formKey="party_2026", itemId="q_bus_station")`（*新副本表单无历史数据，可安全删除*）
   - 调用 `add_form_item`：
     ```json
     {
       "formKey": "party_2026",
       "item": {
         "id": "q_family",
         "type": "RADIO",
         "label": "是否携带家属",
         "required": true,
         "options": ["是", "否"]
       }
     }
     ```

> ⚠️ **注意**：复制出的新表单是独立的表单（初始无填报数据，处于未发布状态）。若要修改的是**已有历史填报数据的线上表单**，删题前必须调用 `check_field_data` 预检！

---

### 1.4 动态追加题目与安全防误删

**Prompt：**

> “在表单 `hr2026spring` 中删掉‘微信号’这道题，并在末尾追加‘期望薪资（k/月）’（数字输入框，选填）。”

**AI 内部执行链路：**

1. **步骤 1（安全预检）**：调用 `check_field_data`
   ```json
   {
     "formKey": "hr2026spring",
     "itemId": "q_wechat"
   }
   ```
   - **情况 A（已有数据）**：返回 `hasData: true, dataCount: 42`。
     → **AI 中断删除操作**，向用户提示：“⚠️ 预检发现该题目在历史提交中已有 42 条关联数据，删除后将无法查看这 42 位候选人的微信号，请确认是否仍要删除？”待用户明确回复“确认删除”后再执行 `delete_form_item`。
   - **情况 B（无数据）**：返回 `hasData: false`。直接执行 `delete_form_item`。
2. **步骤 2**：调用 `add_form_item` 追加题目
   ```json
   {
     "formKey": "hr2026spring",
     "item": {
       "id": "q_expected_salary",
       "type": "NUMBER",
       "label": "期望薪资（k/月）",
       "required": false,
       "placeholder": "例如：15"
     }
   }
   ```

---

## 二、 数据查询与统计分析

### 2.1 条件组合筛选 + 排序 + 敏感数据脱敏

**Prompt：**

> “查一下‘2026 春季校园招聘简历投递表’（`hr2026spring`）中，应聘岗位为‘后端研发工程师’且在 2026-08-01 之后提交的候选人，按时间倒序展示前 10 条。只要姓名、手机号、毕业院校和简历链接，手机号和姓名做脱敏处理。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `get_form_detail(formKey="hr2026spring")` 确认各题目标题与 ID 映射：
   - 姓名 → `q_name`
   - 手机号 → `q_phone`
   - 毕业院校 → `q_school`
   - 应聘岗位 → `q_position`
   - 简历 → `q_resume`
2. **步骤 2**：调用 `query_form_data` 下推时间范围与关键字筛选
   ```json
   {
     "formKey": "hr2026spring",
     "keyword": "后端研发工程师",
     "beginTime": "2026-08-01 00:00:00",
     "current": 1,
     "size": 50
   }
   ```
3. **步骤 3（客户端处理）**：在对话侧对返回的 `rows` 数组进行精细化处理：
   - 过滤 `data.q_position === "后端研发工程师"`
   - 按 `createTime` 进行降序排列（倒序）
   - 截取前 10 条，投影所需字段并实施脱敏：姓名 `张*伟`、手机号 `138****0001`

**预期输出：**

```markdown
📋 **后端研发工程师岗位候选人名单（共筛选出 18 条，展示前 10 条）：**

| 序号 | 姓名 | 手机号 | 毕业院校 | 个人简历 | 投递时间 |
| :---: | :--- | :---: | :--- | :---: | :--- |
| 1 | 张*伟 | 138****0001 | 华南理工大学 | [查看简历 PDF](https://x.tduckcloud.com/storage/...) | 2026-08-20 14:32:10 |
| 2 | 李*强 | 139****1234 | 浙江大学 | [查看简历 PDF](https://x.tduckcloud.com/storage/...) | 2026-08-20 11:20:05 |
| 3 | 陈*东 | 137****5678 | 武汉大学 | [查看简历 PDF](https://x.tduckcloud.com/storage/...) | 2026-08-19 16:45:22 |
| ... | ... | ... | ... | ... | ... |

💡 *注：已按要求对姓名和手机号进行合规脱敏展示。*
```

---

### 2.2 多维度汇总统计与数据洞察

**Prompt：**

> “统计表单 `hr2026spring` 各岗位的投递人数分布，计算各岗位占比并找出投递量最高的岗位。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `get_form_detail(formKey="hr2026spring")` 拿到岗位字段 `q_position` 及其定义的所有选项（前端研发工程师、后端研发工程师、产品经理、UI设计师）
2. **步骤 2**：调用 `query_form_data(formKey="hr2026spring", current=1, size=100)` 分页拉取全部有效数据（若总量超 100 则翻页拉取）
3. **步骤 3（客户端聚合）**：按 `data.q_position` 进行分组计数与百分比计算

**预期输出：**

```markdown
📊 **【2026 春季校园招聘】岗位投递人数分布统计（有效样本总数：120 份）**

| 岗位名称 | 投递人数 | 占比 | 柱状分布 |
| :--- | :---: | :---: | :--- |
| **后端研发工程师** | 54 | 45.0% | `█████████` |
| **前端研发工程师** | 36 | 30.0% | `██████` |
| **产品经理** | 20 | 16.7% | `███` |
| **UI设计师** | 10 | 8.3% | `██` |

📌 **数据洞察分析**：
1. **热度最高**：**后端研发工程师**（54 份，占比 45%），简历储备充足；
2. **缺口较大**：**UI设计师**投递人数偏低（仅 10 份，8.3%），建议在对应设计类渠道加大宣传力度。
```

---

### 2.3 检索特定记录并穿透查看详情

**Prompt：**

> “在客户意向表 `cust_lead_2026` 中查一下手机号是 `13800138000` 的客户详情。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `query_form_data` 通过关键字快速定位
   ```json
   {
     "formKey": "cust_lead_2026",
     "keyword": "13800138000"
   }
   ```
   *匹配到 1 条记录，获得 `dataId: "d_9a8b7c6d5e4f"`*
2. **步骤 2**：调用 `get_form_data_detail` 查询完整内容与提交环境元数据
   ```json
   {
     "formKey": "cust_lead_2026",
     "dataId": "d_9a8b7c6d5e4f"
   }
   ```

**预期输出：**

```markdown
👤 **客户详细档案（数据 ID: `d_9a8b7c6d5e4f`）：**

- **客户姓名**：陈志强
- **联系电话**：13800138000
- **意向产品**：TDuck 旗舰版私有化部署
- **所在城市**：广东省深圳市
- **预算范围**：10万 - 20万
- **客户备注**：急需支持私有化部署与钉钉单点登录集成，要求本周内安排技术演示
- **提交时间**：2026-08-20 10:15:30
- **提交 IP/环境**：`120.229.10.25`（广东省深圳市，Chrome 128 / macOS）
```

---

## 三、 数据录入、修改与运维

### 3.1 批量更新填报数据状态

**Prompt：**

> “把表单 `cust_lead_2026` 中所有城市为‘深圳’且跟进状态还是‘待联系’的记录，跟进状态批量修改为‘已联系’。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `get_form_detail(formKey="cust_lead_2026")` 确认题目 ID：城市为 `q_city`，跟进状态为 `q_status`
2. **步骤 2**：调用 `query_form_data(formKey="cust_lead_2026", keyword="深圳", size=100)` 检索命中记录
3. **步骤 3**：在客户端筛选出 `data.q_status === "待联系"` 的记录集（共 3 条，`dataId` 分别为 `d_01`, `d_02`, `d_03`）
4. **步骤 4（二次确认）**：向用户汇报：“检索到 3 条符合条件的记录（陈某、李某、张某），即将把跟进状态更新为‘已联系’，是否确认？”
5. **步骤 5**：用户确认后，循环调用 `update_form_data`：
   ```json
   {
     "formKey": "cust_lead_2026",
     "dataId": "d_01",
     "data": { "q_status": "已联系" }
   }
   ```
6. **步骤 6**：汇总并汇报执行结果：“✅ 已成功批量更新 3 条记录的状态为‘已联系’。”

> ⚠️ **关键约束**：`update_form_data` 采用局部合并更新机制，只需传入待修改的键值对（如 `{"q_status": "已联系"}`），未传入的其他题目数据原值保持不变。

---

### 3.2 外部花名册批量导入

**Prompt：**

> “把这 3 位新员工的信息批量录入到员工登记表 `staff_onboard` 中：
> 1. 张伟，男，13800000001，技术部，前端研发
> 2. 王芳，女，13800000002，运营部，用户运营
> 3. 李强，男，13800000003，市场部，商务经理”

**AI 内部执行链路：**

1. **步骤 1**：调用 `get_form_detail(formKey="staff_onboard")` 获取题目 ID 映射：
   - 姓名 → `q_name`、性别 → `q_gender`、手机号 → `q_phone`、部门 → `q_dept`、职位 → `q_title`
2. **步骤 2**：组装成 JSON 数组并调用 `batch_submit_form_data` 一次性导入
   ```json
   {
     "formKey": "staff_onboard",
     "list": [
       { "q_name": "张伟", "q_gender": "男", "q_phone": "13800000001", "q_dept": "技术部", "q_title": "前端研发" },
       { "q_name": "王芳", "q_gender": "女", "q_phone": "13800000002", "q_dept": "运营部", "q_title": "用户运营" },
       { "q_name": "李强", "q_gender": "男", "q_phone": "13800000003", "q_dept": "市场部", "q_title": "商务经理" }
     ]
   }
   ```
   *返回：`批量导入成功！成功写入 3 条记录。`*

> ⚠️ **容量约束**：`batch_submit_form_data` 单批次最多支持 100 条。若待导入数据 > 100 条，AI 会自动拆分为每批 ≤100 条分批循环提交。

---

### 3.3 散客数据补录与单条精准修改

**Prompt：**

> “在‘客户登记表’（`cust_lead_2026`）里补录一条数据：客户姓名 赵敏，手机号 13600008888，公司 字节先锋，意向等级 A 级。录完后把之前的记录 `d_1001` 的意向等级也改成 A 级。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `get_form_detail(formKey="cust_lead_2026")` 确认各字段 ID（`q_name`, `q_phone`, `q_company`, `q_level`）
2. **步骤 2**：调用 `submit_form_data` 补录新数据
   ```json
   {
     "formKey": "cust_lead_2026",
     "data": {
       "q_name": "赵敏",
       "q_phone": "13600008888",
       "q_company": "字节先锋",
       "q_level": "A 级"
     }
   }
   ```
   *返回：`数据填报成功！生成的数据 ID 为: d_2002`*
3. **步骤 3**：调用 `update_form_data` 修改已有记录
   ```json
   {
     "formKey": "cust_lead_2026",
     "dataId": "d_1001",
     "data": {
       "q_level": "A 级"
     }
   }
   ```

---

### 3.4 批量删除高危测试数据

**Prompt：**

> “删掉表单 `test_survey` 里所有姓名包含‘测试’或备注为‘test’的数据。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `query_form_data(formKey="test_survey", keyword="测试")` 检索出 4 条命中记录（`dataId`: `d_t1`, `d_t2`, `d_t3`, `d_t4`）
2. **步骤 2（高危操作拦截确认）**：
   - 向用户列出 4 条测试数据的简要信息（姓名、手机号、提交时间）
   - 明确提示：“⚠️ 即将物理删除以上 4 条数据，删除后不可恢复。请明确回复‘确认删除’以继续。”
3. **步骤 3**：用户确认后，逐条调用 `delete_form_data`：
   ```json
   { "formKey": "test_survey", "dataId": "d_t1" }
   ```
4. **步骤 4**：汇总报告执行完成。

---

## 四、 复杂串联与高级扩展

### 4.1 综合串联：克隆旧表 + 字段瘦身 + 输出历史摘要

**Prompt：**

> “把‘2025 年终员工大会报名表’克隆一份命名为‘2026 年终员工大会报名表’，去掉里面的‘核酸检测证明’题目。同时给我 2025 年那张表的数据摘要，按部门统计一下参会人数。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `list_forms(keyword="2025 年终员工大会报名表")` 找到旧表 `formKey="party_2025"`
2. **步骤 2**：调用 `copy_form(formKey="party_2025", name="2026 年终员工大会报名表")` 得到新表 `formKey="party_2026"`
3. **步骤 3**：调用 `get_form_detail(formKey="party_2026")` 确认“核酸检测证明”的题目 ID 为 `q_covid_test`
4. **步骤 4**：调用 `delete_form_item(formKey="party_2026", itemId="q_covid_test")` 完成新表改造
5. **步骤 5**：调用 `query_form_data(formKey="party_2025", size=100)` 拉取 2025 年旧表数据
6. **步骤 6**：在客户端按 `q_dept` 分组汇总参会人数并输出报表

**价值体现**：**单条自然语言指令串联 5 个步骤**，涵盖“克隆 → 删改题 → 数据拉取 → 跨维度计算”，节省至少 10 分钟手工操作。

---

### 4.2 表单视觉升级与头图/Logo 资源上传

**场景 A · 网络图片转存：**

> “给表单 `hr2026spring` 换个横幅头图，使用网络图片 `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200`，提交按钮文字改成‘投递我的简历’，并开启防截图水印‘内部招聘专用’。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `upload_file` 将网络图片转存为表单持久化附件并换取公网 URL
   ```json
   {
     "formKey": "hr2026spring",
     "remoteUrl": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200",
     "fileName": "spring_banner.jpg"
   }
   ```
   *返回：`fileUrl: "https://x.tduckcloud.com/tduck-api/storage/2026/08/banner.jpg"`*
2. **步骤 2**：调用 `update_form_theme` 更新视觉样式配置
   ```json
   {
     "formKey": "hr2026spring",
     "theme": {
      "headImgUrl": "https://x.tduckcloud.com/tduck-api/storage/2026/08/banner.jpg",
      "submitBtnText": "投递我的简历",
      "watermark": true,
      "watermarkText": "内部招聘专用"
     }
   }
   ```

---

**场景 B · 本地文件/图片直传（唯一标准路径）：**

> “把本地刚生成的 `logo.png` 设置为表单 `hr2026spring` 的 Logo 图标。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `get_upload_ticket` 获取免密直传凭据与命令
   ```json
   {
     "formKey": "hr2026spring",
     "fileName": "logo.png"
   }
   ```
   *返回包含：`uploadUrl: "https://.../open/v2/form/data/upload-ticket?ticket=TKT_xxx"` 与 `curlCommand`*
2. **步骤 2**：在本地终端执行返回的极简直传命令：
   ```bash
   curl -s -F "file=@./logo.png" "https://x.tduckcloud.com/tduck-api/open/v2/form/data/upload-ticket?ticket=TKT_xxx"
   ```
   *返回：`{"data": {"fileUrl": "https://x.tduckcloud.com/tduck-api/storage/2026/08/logo.png"}}`*
3. **步骤 3**：调用 `update_form_theme` 将获取到的 `fileUrl` 设置为 Logo：
   ```json
   {
     "formKey": "hr2026spring",
     "theme": {
       "logoImgUrl": "https://x.tduckcloud.com/tduck-api/storage/2026/08/logo.png"
     }
   }
   ```

---

### 4.3 收集规则与安全风控一键配置

**Prompt：**

> “把表单 `hr2026spring` 设置为：只在 2026-09-01 09:00 至 2026-09-30 18:00 期间开放填写；总共最多回收 500 份简历，达到上限自动停止；提交成功后自动跳转到官网 `https://www.example.com/thanks`；同时开启新提交邮件通知 `admin@example.com`。”

**AI 内部执行链路：**

调用 `update_form_setting` 一次性完成复合规则写入：
```json
{
  "formKey": "hr2026spring",
  "setting": {
    "writeInterviewTimeStatus": true,
    "writeInterviewDateTimeRange": [
      "2026-09-01 09:00:00",
      "2026-09-30 18:00:00"
    ],
    "totalWriteCountLimitStatus": true,
    "totalWriteCountLimit": 500,
    "submitJump": true,
    "submitJumpUrl": "https://www.example.com/thanks",
    "emailNotify": true,
    "newWriteNotifyEmail": "admin@example.com"
  }
}
```

---

### 4.4 表单归档与分类整理

**Prompt：**

> “创建一个名为‘2026 校园招聘专项’的文件夹，把刚才建的‘2026 春季校园招聘简历投递表’（`hr2026spring`）归档放进去。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `list_folders` 检查是否已存在同名文件夹
2. **步骤 2**：若不存在，调用 `create_folder(name="2026 校园招聘专项")`，返回 `folderId: 105`
3. **步骤 3**：调用 `move_form_folder` 完成归档移动
   ```json
   {
     "formKey": "hr2026spring",
     "folderId": 105
   }
   ```

*若后续需移回根目录，只需执行 `move_form_folder(formKey="hr2026spring", folderId=0)` 即可。*

---

### 4.5 开启对外公开自助查询页 (Opensearch)

**Prompt：**

> “为表单 `exam_java_core` 开启一个对外成绩自助查询页，标题叫‘Java 测评成绩查询’，允许考生凭手机号（`q_phone`）自主查询自己的考试成绩。”

**AI 内部执行链路：**

1. **步骤 1**：调用 `create_opensearch_query` 创建查询规则并激活对外通道
   ```json
   {
     "formKey": "exam_java_core",
     "title": "Java 测评成绩查询",
     "queryFieldId": "q_phone",
     "showFieldIds": ["q_name", "q_score", "q_result"],
     "styleType": "CARD",
     "enabled": true
   }
   ```
2. **步骤 2**（可选）：后续如需启停或修改规则，随时调用 `edit_opensearch_query(formKey="exam_java_core", enabled=false)`。

**预期输出：**

```markdown
✅ **对外公开自助查分通道已成功开启！**

- **关联表单**：Java 核心技术随堂测评 (`exam_java_core`)
- **查询凭证**：考生手机号码 (`q_phone`)
- **页面标题**：Java 测评成绩查询
- **展示字段**：姓名、测评得分、结果评定
- **公开访问链接**：https://form.tduckcloud.com/q/exam_java_core?qid=1
- **使用方式**：考生打开公开查询链接输入本人手机号，即可自主核对本次测评的得分与答题明细。
```

---

## 五、 Prompt 模板与快捷指令速查

| 业务场景 | 推荐 Prompt 指令模板 | 核心调用工具 |
| :--- | :--- | :--- |
| **快速创建表单** | `帮我建一个"<名称>"表单，字段包括：<字段1(类型/必填)>、<字段2>...，主色调用<颜色>，创建好后直接发布给我链接` | `create_form` → `publish_form` |
| **创建在线试卷** | `建一份"<试卷名>"考试，包含<N>道题，每题<分值>分，配置标准答案与解析，交卷后允许考生看解析` | `create_form (type=EXAM)` |
| **复制并修改** | `把"<原表单名>"复制一份命名为"<新表单名>"，去掉<某题目>，追加一道<新题目>` | `copy_form` → `get_form_detail` → `delete_form_item` / `add_form_item` |
| **精确检索数据** | `查询表单 <formKey> 中 <条件> 的数据，按时间倒序展示前 <N> 条，只要 <字段列表>，敏感信息打码` | `get_form_detail` → `query_form_data` |
| **数据分组统计** | `统计表单 <formKey> 中各 <选项字段> 的人数分布与占比，给出数据洞察分析` | `get_form_detail` → `query_form_data` |
| **批量导入数据** | `把以下这批名单批量录入到表单 <formKey>：<名单数据列表>` | `get_form_detail` → `batch_submit_form_data` |
| **批量修改状态** | `把表单 <formKey> 里满足 <条件> 的记录，<字段名> 批量修改为 "<新值>"` | `query_form_data` → 循环 `update_form_data` |
| **安全删除题目** | `把表单 <formKey> 中的 "<题目名>" 删掉（删前检查是否有历史数据）` | `check_field_data` → 用户确认 → `delete_form_item` |
| **更换头图与主题** | `给表单 <formKey> 更换头图：<图片URL>，按钮文字改成 "<文字>"` | `upload_file` → `update_form_theme` |
| **配置提交限制** | `给表单 <formKey> 设置开放时间为 <起止时间>，限制单 IP 只能填 <N> 次，有新提交邮件提醒 <邮箱>` | `update_form_setting` |
| **文件夹归档** | `把表单 <formKey> 移动到文件夹 "<文件夹名>"` | `list_folders` → `create_folder` → `move_form_folder` |
| **开启自助查询** | `为表单 <formKey> 开启对外公开查询，标题为 "<标题>"，以 <题目ID/手机号> 作为查询凭证` | `create_opensearch_query` → `edit_opensearch_query` |




我们会 提供一个 GIT 私服 后续的代码更新都在上面  
版本管理功能的设计思路如果是我们来做的话大概就是在原有的发布的功能前面进行拦截，点击发布不直接进行发布，而且等于进行一个流程的发起。审批通过之后再把这个版本设计的快照内容覆盖到目标表单中。
这块功能是对原有的功能改造和原有代码肯定是有依赖的，无法完全独立。对于版本审批的功能这块可以独立实现。
合并代码的话如果没有代码冲突的话是很简单的，开发过程中尽量单独创建方法类，这样可以尽可能的避免冲突。