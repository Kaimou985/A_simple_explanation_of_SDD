import { exampleDocuments, examplePath, exampleResult, exampleRevision } from './example.js';

const stages = [
  { id: 'proposal', name: 'Proposal', tab: 'proposal.md', title: '先说清为什么做', copy: '定义问题、范围和影响，记录这次变更涉及的能力。', command: '根据已确认的信息起草提案。' },
  { id: 'spec', name: 'Specs', tab: 'Specs', title: '明确行为与验收场景', copy: '把确认的需求写成可验证的规则，用 WHEN 和 THEN 描述场景。', command: '根据提案生成规范和验收场景，关键规则有歧义时先问我。' },
  { id: 'design', name: 'Design', tab: 'design.md', title: '解释方案和取舍', copy: '说明怎么实现、为什么这样选，以及需要处理哪些风险。', command: '根据当前提案和规范起草技术设计。' },
  { id: 'tasks', name: 'Tasks', tab: 'tasks.md', title: '拆成可验证的任务', copy: '依据行为规范和技术设计安排交付顺序，为每项任务明确验证方式。', command: '根据当前规范和设计生成实施与验收任务。' }
];
const $ = id => document.getElementById(id);
const input = $('prompt');
let config = { connected: false, templates: {} };
let loadingConfig = true;
let mode = 'live';
let stage = 'proposal';
let tab = 'proposal';
let specFile = '';
let documents = {};
let history = [];
let changes = {};
let busy = false;

function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}

function button(label, className, action) {
  const node = element('button', className, label);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function specFiles() {
  return [...new Set([...Object.keys(documents), ...Object.keys(changes)])].filter(path => path.startsWith('specs/')).sort();
}

function navigateTo(path) {
  if (path.startsWith('specs/')) {
    tab = 'spec';
    specFile = path;
  } else tab = path.replace('.md', '');
}

function drawNavigation() {
  $('flow').replaceChildren(...stages.map((item, index) => {
    const step = button('', 'step', () => {
      stage = tab = item.id;
      draw();
    });
    step.append(element('span', 'step-number', `0${index + 1}`), element('span', '', item.name));
    if (item.id === stage) step.setAttribute('aria-current', 'step');
    step.disabled = busy;
    return step;
  }));
  const current = stages.find(item => item.id === stage);
  $('lesson-index').textContent = `0${stages.indexOf(current) + 1}`;
  $('lesson-title').textContent = current.title;
  $('lesson-copy').textContent = current.copy;
  $('tabs').replaceChildren(...stages.map(item => {
    const node = button(item.tab, 'tab', () => { tab = item.id; drawPreview(); });
    if (tab === item.id) node.setAttribute('aria-current', 'true');
    const updated = Object.keys(changes).some(path => item.id === 'spec' ? path.startsWith('specs/') : path === item.tab);
    if (updated) {
      node.append(element('span', 'dot'));
      node.setAttribute('aria-label', `${item.tab}，本轮有更新`);
    }
    return node;
  }));
}

function diff(previous, current) {
  const before = previous ? previous.split('\n') : [];
  const after = current ? current.split('\n') : [];
  const width = after.length + 1;
  if ((before.length + 1) * width > 1000000) {
    return [...before.map(line => ['remove', line]), ...after.map(line => ['add', line])];
  }
  const lengths = new Uint16Array((before.length + 1) * width);
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      const position = i * width + j;
      lengths[position] = before[i] === after[j] ? 1 + lengths[position + width + 1] :
        Math.max(lengths[position + width], lengths[position + 1]);
    }
  }
  const lines = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      lines.push(['same', after[j++]]);
      i++;
    } else if (i < before.length && (j === after.length || lengths[(i + 1) * width + j] >= lengths[i * width + j + 1])) {
      lines.push(['remove', before[i++]]);
    } else lines.push(['add', after[j++]]);
  }
  return lines;
}

function drawPreview() {
  drawNavigation();
  const files = specFiles();
  if (!files.includes(specFile)) specFile = files[0] ?? '';
  $('spec-picker-row').hidden = tab !== 'spec' || files.length < 2;
  $('spec-picker').replaceChildren(...files.map(path => {
    const option = element('option', '', path.split('/')[1]);
    option.value = path;
    return option;
  }));
  $('spec-picker').value = specFile;
  const path = tab === 'spec' ? specFile || 'specs/<capability>/spec.md' : `${tab}.md`;
  const change = changes[path];
  const template = config.templates[tab];
  const content = documents[path] ?? template;
  const status = $('document-status');
  $('filename').textContent = path;
  status.textContent = change ? change.after === null ? '已移除' : '本轮更新' : documents[path] ? '当前草稿' : '原始模板';
  status.classList.toggle('updated', Boolean(change));
  $('artifact-count').textContent = `${Object.keys(documents).length} 份草稿`;
  const lines = change ? diff(change.before, change.after) : (content ?? '').trimEnd().split('\n').map(line => ['same', line]);
  let number = 0;
  const body = $('document-body');
  body.replaceChildren();
  if (!content && !change) body.append(element('p', 'empty-document', '等待加载 OpenSpec 原模板…'));
  else {
    const fragment = document.createDocumentFragment();
    for (const [kind, line] of lines) {
      const row = element('div', `line ${kind}`);
      const gutter = element('span', 'gutter', kind === 'remove' ? '−' : String(++number));
      gutter.setAttribute('aria-hidden', 'true');
      const code = element('code', /^#{2,4} /.test(line) ? 'markdown-heading' : '', line || ' ');
      if (kind !== 'same') {
        row.append(element('span', 'sr-only', kind === 'remove' ? '删除：' : '新增：'));
        if (kind === 'add') gutter.textContent = `${number} +`;
      }
      row.append(gutter, code);
      fragment.append(row);
    }
    body.append(fragment);
  }
  const paths = Object.keys(changes);
  $('changed-files').replaceChildren(...(paths.length ? paths.map(file => button(file, 'change-chip', () => {
    navigateTo(file);
    drawPreview();
  })) : [element('p', 'muted', '文档发生变化后，可以从这里定位更新。')]));
}

function draw() {
  $('mode').textContent = mode === 'example' ? '本地示例' : loadingConfig ? '正在读取配置' : config.connected ? 'DeepSeek 已配置' : 'DeepSeek 未配置';
  $('mode').classList.toggle('updated', mode === 'example' || config.connected);
  $('load-example').disabled = busy;
  $('new-workspace').disabled = busy;
  $('send').disabled = busy;
  input.readOnly = busy;
  const visibleHistory = history.length ? history : [{ role: 'assistant', content: '你想解决什么工作问题？描述你期待的结果，我们从变更提案开始。' }];
  const messages = $('messages');
  messages.replaceChildren(...visibleHistory.map(({ role, content }) => {
    const article = element('article', `message ${role}`);
    article.append(element('span', 'speaker', role === 'user' ? '你' : mode === 'example' ? '示例' : '助手'), element('p', '', content));
    return article;
  }));
  messages.scrollTop = messages.scrollHeight;
  const suggestions = $('suggestions');
  if (mode === 'example') {
    const finished = Boolean(history.find(entry => entry.content === exampleRevision));
    suggestions.replaceChildren(finished ? button('用自己的需求开始 ↗', 'suggestion', startLive) :
      button(`试试：${exampleRevision}`, 'suggestion', () => { input.value = exampleRevision; input.focus(); }));
  } else {
    const current = stages.find(item => item.id === stage);
    suggestions.replaceChildren(history.length ? button(current.command, 'suggestion', () => { input.value = current.command; input.focus(); }) :
      button('填入销售分析需求', 'suggestion', () => { input.value = '我想做一个月度销售分析工具，输入交易明细，输出每个月的净销售额。'; input.focus(); }));
  }
  suggestions.firstElementChild.disabled = busy;
  drawPreview();
}

function switchMode(next) {
  if ((history.length || input.value.trim()) && !window.confirm('切换工作区会清空当前对话和草稿。继续切换？')) return false;
  mode = next;
  history = [];
  documents = {};
  changes = {};
  stage = tab = 'proposal';
  specFile = '';
  input.value = '';
  $('feedback').textContent = '';
  return true;
}

function startLive() {
  if (!switchMode('live')) return;
  draw();
  input.focus();
}

function openExample() {
  if (!switchMode('example')) return;
  documents = { ...exampleDocuments };
  stage = tab = 'spec';
  specFile = examplePath;
  history = [
    { role: 'user', content: '帮我分析每月净销售额。' },
    { role: 'assistant', content: '已准备按月份汇总的四份 OpenSpec 草稿。试着提出按门店拆分，看看哪些规范要跟着改。' }
  ];
  draw();
}

function applyTurn(message, result) {
  changes = {};
  for (const [path, after] of Object.entries(result.updates)) {
    changes[path] = { before: documents[path], after };
    if (after === null) delete documents[path];
    else documents[path] = after;
  }
  history.push({ role: 'user', content: message }, { role: 'assistant', content: result.reply });
  const updated = Object.keys(changes);
  const preferred = stage === 'spec' ? updated.find(path => path.startsWith('specs/')) : updated.find(path => path === `${stage}.md`);
  if (preferred || updated.length) navigateTo(preferred ?? updated[0]);
}

$('composer').addEventListener('submit', async event => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message || busy) return;
  const feedback = $('feedback');
  feedback.classList.remove('error');
  if (mode === 'example') {
    if (message.replace(/[。.!！]$/, '') !== exampleRevision.slice(0, -1)) {
      feedback.textContent = '本地示例支持预设的门店分组修改。自定义需求请点击「新建需求」。';
      return;
    }
    if (history.some(entry => entry.content === exampleRevision)) {
      feedback.textContent = '示例已经应用这次修改。重新打开示例可再体验一遍。';
      return;
    }
    applyTurn(exampleRevision, exampleResult);
    input.value = feedback.textContent = '';
    draw();
    return;
  }
  if (!config.connected) {
    feedback.textContent = '请在服务端配置 DEEPSEEK_API_KEY 并重启，或先打开本地示例。';
    feedback.classList.add('error');
    return;
  }
  busy = true;
  feedback.textContent = 'DeepSeek 正在处理这轮需求…';
  draw();
  try {
    const response = await fetch('/api/turn', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, stage, documents, history: history.slice(-16) })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    applyTurn(message, result);
    input.value = '';
    feedback.textContent = Object.keys(result.updates).length ? '规范已更新。' : '本轮没有修改文档。';
  } catch (error) {
    feedback.textContent = error instanceof TypeError ? '连接失败，请检查本地服务后重试。' : error.message;
    feedback.classList.add('error');
  } finally {
    busy = false;
    draw();
    input.focus();
  }
});

input.addEventListener('keydown', event => {
  if (!event.isComposing && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) $('composer').requestSubmit();
});
$('spec-picker').addEventListener('change', event => { specFile = event.target.value; drawPreview(); });
$('load-example').addEventListener('click', openExample);
$('new-workspace').addEventListener('click', startLive);
draw();
try {
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error('配置不可用');
  config = await response.json();
} catch {
  $('feedback').textContent = '无法读取服务配置，本地示例仍可使用。';
} finally {
  loadingConfig = false;
  draw();
}
