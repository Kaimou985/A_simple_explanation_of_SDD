## Why

学习者读完 SDD 的概念后，需要用自己的工作需求练习如何写出可验收的规范，并看清一次需求修改会怎样影响设计和任务。

## What Changes

- 提供双栏工作区。左侧用中文讲解 Proposal、Specs、Design、Tasks，并通过同一个输入框接收初始需求、补充信息和修改意见。右侧预览当前规范草稿。
- 接入 DeepSeek，根据当前步骤、对话和已有草稿澄清需求、生成文档、检查遗漏并修订内容。
- 使用 OpenSpec `spec-driven` 原模板生成 `proposal.md`、`specs/<capability>/spec.md`、`design.md` 和 `tasks.md`。用户明确修改需求后，显示受影响的文件和本轮行差异。
- 提供可选的月度销售分析示例，演示将按月份汇总改为按月份和门店汇总。自定义需求走同一套流程。
- 首版交付范围为本地教学网站、规范草稿和当轮差异。实际数据分析、应用代码生成和公开部署留待单独立项。

## Capabilities

### New Capabilities

- `sdd-workbench`：通过对话生成、查看和修订 OpenSpec 文档。

### Modified Capabilities

## Impact

- 实时模式会将用户消息、相关对话和当前规范草稿发给 DeepSeek。API 密钥由服务端环境提供。
- 本地示例使用预设的文档和变更，可在没有 API 密钥时体验。
