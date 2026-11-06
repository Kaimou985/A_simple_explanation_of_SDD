## ADDED Requirements

### Requirement: 双栏教学工作区
网站 SHALL 在同一工作区提供中文流程讲解、统一对话输入框及四类 OpenSpec 文档预览。

#### Scenario: 从空白需求开始
- **WHEN** 用户新建工作区并提交自定义工作需求
- **THEN** 左侧显示用户消息和模型回复，右侧按文档类型展示有效的草稿更新

#### Scenario: 切换流程阶段
- **WHEN** 用户在流程导航中选择 Proposal、Specs、Design 或 Tasks
- **THEN** 左侧切换到该阶段的讲解，右侧定位到对应文档，并保留当前对话和其他文档

### Requirement: 基于原模板生成和评审
系统 SHALL 使用 DeepSeek 处理当前需求和文档，并依据 OpenSpec `spec-driven` 原模板生成四类 Markdown 草稿。Proposal 是 Specs 和 Design 的前置产物，Tasks 依赖 Specs 和 Design。

#### Scenario: 查看尚未生成的文档
- **WHEN** 用户打开没有草稿的文档类别
- **THEN** 右侧展示该类 OpenSpec 原模板并标明模板状态

#### Scenario: 生成行为规范与任务
- **WHEN** 用户要求继续生成规范和实施任务，且相关需求已明确
- **THEN** 按能力生成 `specs/<capability>/spec.md`，写出可观察的 WHEN 和 THEN 场景，并依据 Specs 和 Design 生成待执行任务

#### Scenario: 只评审草稿
- **WHEN** 用户只要求检查遗漏
- **THEN** 左侧给出检查结果，例如指出某项规则缺少对应的验收任务，右侧保留当前草稿

### Requirement: 需求变更与差异追溯
系统 SHALL 将明确的需求变更同步到已生成且受影响的文档，保留其他文档与无关内容，并展示当轮差异。

#### Scenario: 已生成文档后修改分组规则
- **WHEN** 用户将按月份统计销售额改为按月份和门店分别统计，且四类草稿已生成
- **THEN** 本轮整体更新相关范围、行为与验收场景、分组方案和验证任务，并支持从关联更新列表定位到对应 Markdown 差异

#### Scenario: 修改内容仍有歧义
- **WHEN** 用户只说要调整销售额口径，尚未给出新的计算规则
- **THEN** 模型追问具体口径，并保留已确认的相关段落

### Requirement: 可独立体验的销售示例
网站 SHALL 提供标注为本地示例的预设场景，供用户体验已有规范如何随需求变化。

#### Scenario: 无密钥体验示例
- **WHEN** 未配置 DeepSeek 密钥的用户打开月度销售分析示例并提交预设的门店分组修改
- **THEN** 网站展示四类预设文档的修改结果和关联差异，示例操作全程在本地完成

### Requirement: 失败处理和密钥边界
系统 SHALL 在服务端使用 API 密钥。一次文档更新只有在整批响应校验通过后才可应用。

#### Scenario: 请求失败或响应无效
- **WHEN** 缺少 API 密钥、DeepSeek 调用失败，或本轮更新含格式错误或缺少前置文档
- **THEN** 页面提示错误并保留已生成文档和用户输入，用户可在问题处理后重试

#### Scenario: 查看前端配置
- **WHEN** 浏览器读取工作区配置
- **THEN** 配置只暴露运行所需的信息，例如模板、模型名和密钥是否已配置，密钥由服务端保管
