export const examplePath = 'specs/sales-report/spec.md';
export const exampleRevision = '改为按月份和门店分别统计。';

function salesDocuments(byStore) {
  const group = byStore ? '月份和门店' : '月份';
  return {
    'proposal.md': `## Why

业务同事每月需要核对销售额，目前依赖手动汇总交易明细。

## What Changes

- 按${group}汇总销售额。
- 净销售额为收款金额减去退款金额。

## Capabilities
### New Capabilities

- \`sales-report\`：生成月度净销售额报表。

### Modified Capabilities

## Impact

- 输入为包含交易日期、类型、金额${byStore ? '和门店标识' : ''}的交易明细。`,
    [examplePath]: `## ADDED Requirements

### Requirement: 月度销售额汇总
系统 SHALL 按${group}汇总净销售额。净销售额为该分组的收款减去退款。

#### Scenario: 扣除退款
- **WHEN** 同一${byStore ? '门店当月' : '月份'}收款 ¥1,000，退款 ¥300
- **THEN** 该分组的净销售额为 ¥700${byStore ? `

#### Scenario: 同月两家门店有交易
- **WHEN** 同一月份有两家门店各自的交易
- **THEN** 报表分别显示两家门店的净销售额` : ''}`,
    'design.md': `## Context

输入是交易明细，报表用于日常销售复盘。

## Goals / Non-Goals

**Goals:** 生成可核对的月度净销售额。

**Non-Goals:** 预测未来销量。

## Decisions

- 从交易日期提取月份，使用${byStore ? '月份和门店标识作为联合分组键' : '月份作为分组键'}。
- 以分为单位汇总金额，分别统计收款和退款，再相减。

## Risks / Trade-offs

- 对日期或金额无效的记录返回行号${byStore ? '。缺少门店标识的记录同样报告行号' : ''}。`,
    'tasks.md': `## 1. 数据处理

- [ ] 1.1 解析并校验交易日期、类型、金额${byStore ? '和门店标识' : ''}。
- [ ] 1.2 实现按${group}汇总收款和退款并计算净额。

## 2. 验收

- [ ] 2.1 验证收款 ¥1,000、退款 ¥300 时净额为 ¥700。${byStore ? '\n- [ ] 2.2 验证同月两家门店分别出现在报表的两行。' : ''}`
  };
}

export const exampleDocuments = salesDocuments(false);
export const exampleResult = {
  reply: '已把统计粒度改为月份和门店。我同步补了门店标识、分组方案，以及两家门店分别出现在报表中的验收场景。右侧可以逐份查看变化。',
  updates: salesDocuments(true)
};
