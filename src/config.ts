// ---------------------------------------------------------------------------
// 站点全局配置。修改此文件即可个性化你的知识库。
// ---------------------------------------------------------------------------

export const SITE = {
  name: 'ZZL',
  title: 'ZZL · 个人知识库',
  description:
    '关于数学、计算机科学、NLP 与 AI 的个人知识库与数字花园。笔记、想法，以及我正在努力理解的事物。',
  subtitle: '数学 · 计算机科学 · NLP · AI',
  tagline: '笔记、想法，以及我正在努力理解的事物。',
  /** 首页「当前兴趣」区块展示的内容。 */
  interests: [
    '数理逻辑',
    '大语言模型',
    '表征学习',
    '文化对齐',
    '多语言 NLP',
  ],
  social: {
    github: 'https://github.com/zz1l',
    email: 'mailto:you@example.com',
    rss: '/rss.xml',
  },
};

/** 顶层分类的展示顺序。 */
export const CATEGORY_ORDER = ['数学', '计算机科学', 'AI', '研究'];

/** 每个分类下预设的子分类（用于笔记浏览器侧边栏）。 */
export const SUBCATEGORIES: Record<string, string[]> = {
  数学: ['代数', '分析', '几何', '数论', '概率论', '逻辑', '其他'],
  '计算机科学': ['算法', '数据结构', '操作系统', '网络', '分布式系统', '系统'],
  AI: ['机器学习', '深度学习', 'NLP', 'LLM', '强化学习'],
  研究: ['论文', '实验', '想法', '阅读笔记'],
};

/** 笔记的「数字花园」成熟度。 */
export const STATUS_META: Record<string, { label: string; hint: string }> = {
  seed: { label: '种子', hint: '一篇非常早期的笔记——粗略、不完整、探索性的。' },
  sprout: { label: '萌芽', hint: '正在成形，但仍是碎片。' },
  growing: { label: '生长中', hint: '正在积极发展与修订。' },
  evergreen: { label: '常青', hint: '成熟且相对稳定。' },
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  introductory: '入门',
  intermediate: '进阶',
  advanced: '高级',
};
