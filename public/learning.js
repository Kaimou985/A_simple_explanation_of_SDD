import { exampleDocuments, examplePath } from './example.js';

const courses = [
  {
    stage: 'proposal', name: 'Proposal', title: '先确认为什么做、做到哪', path: 'proposal.md', heading: 'What Changes',
    explanation: '说明业务问题、改动范围和影响。销售报表先约定统计粒度和净销售额口径，分组算法留给 Design。',
    question: '哪一句最适合放进 Proposal 的变更范围？',
    options: ['用交易日期和门店标识作为联合分组键。', '本次提供月度净销售额报表。', '用含退款的样本验证报表结果。'],
    answer: 1,
    feedback: '「本次提供月度净销售额报表」明确了交付范围。分组键是设计决定，准备样本并验证结果属于 Tasks。'
  },
  {
    stage: 'spec', name: 'Specs', title: '写出可观察的行为', path: examplePath, heading: 'ADDED Requirements',
    explanation: '把需求写成系统必须满足的规则，再用 WHEN 写条件、用 THEN 写可观察结果。验收时可以逐条核对。',
    question: '哪一句可以直接用作退款场景的预期结果？',
    options: ['销售报表应正确处理退款。', '汇总时用整数表示金额。', '当月收款 ¥1,000、退款 ¥300 时，报表显示净销售额 ¥700。'],
    answer: 2,
    feedback: '这句话给出了具体输入和可核对的 ¥700。整数金额属于实现选择，「正确处理」缺少可判定的预期结果。'
  },
  {
    stage: 'design', name: 'Design', title: '记录实现选择和理由', path: 'design.md', heading: 'Decisions',
    explanation: '解释如何满足 Specs。比如金额以分为单位计算，便于精确汇总和相减。遇到无效交易时，还要说明如何定位错误。',
    question: '哪一句属于实现方案？',
    options: ['从交易日期提取月份，以月份作为分组键。', '本次交付月度报表。', '当月收款 ¥1,000、退款 ¥300 时，净额为 ¥700。'],
    answer: 0,
    feedback: '提取月份并确定分组键说明了如何实现汇总。交付范围写进 Proposal，报表应显示的净额写进 Specs。'
  },
  {
    stage: 'tasks', name: 'Tasks', title: '拆成可完成、可核对的任务', path: 'tasks.md', heading: '2. 验收',
    explanation: '依据 Specs 和 Design 排列工作，说明每项要交付什么、如何验证。月度报表先解析交易，再计算净额，最后用样本核对。',
    question: '哪一项最适合作为可验收的任务？',
    options: ['以后可以考虑预测销量。', '完成销售分析。', '输入一笔 ¥1,000 收款和一笔 ¥300 退款，核对月报净额是否为 ¥700。'],
    answer: 2,
    feedback: '这项任务给出了操作和通过条件，可以实际执行并勾选。「完成销售分析」没有说清如何验收。'
  }
];

export function renderCourses(container, openExample) {
  for (const course of courses) {
    const card = document.createElement('article');
    card.className = 'learning-card course-card';
    const name = document.createElement('p');
    name.className = 'eyebrow';
    name.textContent = course.name;
    const title = document.createElement('h3');
    title.textContent = course.title;
    const explanation = document.createElement('p');
    explanation.textContent = course.explanation;

    const sample = document.createElement('div');
    sample.className = 'course-sample';
    const path = document.createElement('code');
    path.textContent = course.path;
    const excerpt = document.createElement('pre');
    const heading = `## ${course.heading}`;
    const markdown = exampleDocuments[course.path];
    excerpt.textContent = markdown.slice(markdown.indexOf(heading)).split('\n## ')[0].trimEnd();
    sample.append(path, excerpt);

    const exercise = document.createElement('form');
    exercise.className = 'course-exercise';
    const fieldset = document.createElement('fieldset');
    const question = document.createElement('legend');
    question.textContent = course.question;
    fieldset.append(question);
    for (const [index, option] of course.options.entries()) {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'answer';
      radio.value = String(index);
      radio.required = true;
      label.append(radio, option);
      fieldset.append(label);
    }
    const check = document.createElement('button');
    check.className = 'outline';
    check.textContent = '查看答案';
    check.type = 'submit';
    const feedback = document.createElement('p');
    feedback.className = 'course-feedback';
    feedback.setAttribute('role', 'status');
    exercise.append(fieldset, check, feedback);
    exercise.addEventListener('submit', event => {
      event.preventDefault();
      const selected = new FormData(exercise).get('answer');
      if (selected === null) return;
      const correct = Number(selected) === course.answer;
      feedback.textContent = `${correct ? '答对了。' : '这次选错了。'}${course.feedback}`;
      feedback.classList.toggle('correct', correct);
    });
    exercise.addEventListener('change', () => { feedback.textContent = ''; });

    const shortcut = document.createElement('button');
    shortcut.type = 'button';
    shortcut.className = 'course-example send';
    shortcut.textContent = '在实验台试一试';
    shortcut.setAttribute('aria-label', `在实验台试一试 ${course.name}`);
    shortcut.addEventListener('click', () => openExample(course.stage));
    card.append(name, title, explanation, sample, exercise, shortcut);
    container.append(card);
  }
}
