# 知识库 · 部署在 GitHub Pages 上的数字花园

基于 **Astro 5 + TypeScript + Tailwind CSS 4** 的个人知识库。笔记就是纯
Markdown 文件——站点在构建时自动从它们生成笔记浏览器、搜索索引、知识图谱、
相关笔记、时间线与统计。

```
git clone <仓库地址>
npm install
npm run dev          # 开发服务器 http://localhost:4321
```

## 功能特性

- **Markdown 优先**：每篇笔记都是 `src/content/notes/**/*.md`，带 YAML
  frontmatter。新增笔记、分类、标签都无需改动任何页面代码。
- **文章阅读体验**：KaTeX 数学公式（行内 + 块级）、Shiki 代码高亮（行号、
  语言标签、一键复制）、Mermaid 图表（按需加载）、GitHub 风格提示块
  （`[!NOTE]`、`[!TIP]`、`[!WARNING]`、`[!IMPORTANT]`、`[!DANGER]`、
  `[!EXAMPLE]`）、脚注、带滚动高亮的粘性目录、阅读进度条、阅读时长。
- **Wiki 链接**：`[[笔记标题]]` 自动链接到对应笔记（按 frontmatter 标题
  匹配）；不存在的目标渲染为虚线「未解析概念」样式。
- **相关笔记**：按共享标签、分类、直接 wiki 链接与共同链接目标打分；
  每篇笔记底部展示「相关笔记」与「被以下笔记引用」。
- **知识图谱**（`/graph`）：由 wiki 链接构建的力导向画布——拖拽节点、平移、
  滚轮/双指缩放、悬停提示、点击打开、按分类筛选、移动端列表降级。
- **笔记浏览器**（`/notes`）：分类/子分类侧边栏、标签筛选、即时文本过滤、
  按更新/创建/标题排序、难度与状态筛选，支持 URL 参数深链
  （`?category=AI&tag=...`）。
- **搜索 / 命令面板**：`Ctrl+K` / `Cmd+K` —— 在标题、描述、标签、分类与全文
  上模糊搜索（Fuse.js，按需加载），另有页面命令与深色模式切换，完整键盘导航。
- **页面**：首页（Hero、知识总览、最近与精选笔记、当前兴趣）、笔记、项目、
  研究（论文/想法/实验）、图谱、时间线（按更新时间分组）、统计、关于、404。
- **深色模式**：精心设计的浅色（暖白）与深色（近黑）配色，记住选择、跟随
  系统偏好、加载无闪烁。
- **克制的动效**：视口过渡淡入、滚动揭示、首页极简粒子背景、安静的悬停
  状态——在 `prefers-reduced-motion` 下全部关闭。
- **SEO 与订阅**：每页自动生成 title/description/canonical/OpenGraph/Twitter
  卡片，另有 `sitemap-index.xml`、`robots.txt` 与 `/rss.xml`。
- **GitHub Pages**：构建时自动从仓库名推导 `base` 与 `site`，项目站点零配置
  可用（见[部署](#部署到-github-pages)）。

## 目录结构

```
src/
├── content/
│   ├── notes/
│   │   ├── mathematics/        # 分类文件夹（名称可任意）
│   │   ├── computer-science/
│   │   ├── ai/
│   │   └── research/
│   ├── projects/               # 每个项目一个 .md
│   └── research/               # 论文 / 想法 / 实验
├── components/                 # Header、Footer、NoteCard、StatusBadge 等
├── layouts/
│   ├── BaseLayout.astro        # 外壳：SEO、主题引导、命令面板、页脚
│   └── ArticleLayout.astro     # 目录侧栏 + 正文 + 相关/反向链接
├── pages/
│   ├── index.astro             # 首页
│   ├── notes/
│   │   ├── index.astro         # 浏览器
│   │   └── [slug].astro        # 文章页（路由取自文件名）
│   ├── projects/  research/  graph/  timeline/  stats/  about/  404
│   ├── rss.xml.ts  search-index.json.ts  graph-data.json.ts  robots.txt.ts
├── lib/
│   ├── notes.ts                # 查询、阅读时长、分类/标签统计
│   ├── graph.ts                # wiki 链接图谱、相关笔记、反向链接
│   └── markdown/               # remark/rehype 插件（wiki 链接、mermaid、
│                               #   提示块、行号）
├── scripts/                    # app.ts（主题/面板/目录/复制）、browser.ts、
│                               #   graph.ts（画布）、hero.ts（背景）
├── styles/global.css           # 设计令牌与全部组件样式
├── content.config.ts           # 内容集合 schema（zod）
└── config.ts                   # 站点身份、兴趣、分类配置
```

## 新增一篇笔记

创建 `src/content/notes/<分类>/<文件名>.md`：

```yaml
---
title: "哥德尔完备性定理"
description: "显示在卡片与搜索结果中的一句话摘要。"
category: "数学"            # 任意字符串；新分类会自动出现
subcategory: "逻辑"          # 可选
tags: [逻辑, 数理逻辑]       # 可选
status: growing              # seed | sprout | growing | evergreen
difficulty: advanced         # introductory | intermediate | advanced
created: 2026-08-15          # YYYY-MM-DD
updated: 2026-08-15          # 可选（默认取 created）
featured: true               # 可选，在首页展示
draft: true                  # 可选，构建时排除
---
```

写完后什么都不用做——浏览器、搜索索引、图谱、时间线、统计与相关笔记都会在
下次构建时自动更新。**规则：**

- 文件名必须在所有分类文件夹中**唯一**：URL 是 `/notes/<文件名>/`。
- `[[Wiki 链接]]` 的目标按其他笔记的 `title` 匹配（大小写不敏感、标点
  智能归一化）。可用 `[[标题|显示文字]]` 自定义显示文本。
- 在 `npm run dev` 中重命名笔记后，请重启开发服务器以刷新标题映射。
- Astro 的内容层把渲染结果缓存在 `node_modules/.astro` 中。修改 remark/
  rehype 插件后（很少见），执行 `npx astro sync --force` 或删除
  `node_modules/.astro` 再构建——否则笔记只在自身文件变化时才重新渲染。

## 新增分类

直接使用新的 `category:`（或新建文件夹）即可，无需配置。`/notes` 侧边栏、
首页总览与图谱图例都由内容自动生成。要控制**排序**并预定义子分类，编辑
`src/config.ts`（`CATEGORY_ORDER`、`SUBCATEGORIES`）。

## 新增项目

`src/content/projects/我的项目.md`：

```yaml
---
title: "项目名称"
description: "它做什么。"
status: active            # active | maintained | archived | idea
tech: [Python, PyTorch]
github: "https://github.com/you/project"
demo: "https://project.example"
paper: "https://arxiv.org/abs/..."
year: 2026
featured: true
---
```

## 新增研究条目

`src/content/research/*.md`，`type: publication | idea | experiment`
（字段：`authors`、`venue`、`year`、`paper`、`code`、`status`）。想法自动编号；
实验可用 `status: failed` 记录负结果。

## 个性化设置

编辑 `src/config.ts`：

- `SITE.name`、`subtitle`、`tagline`——Hero 与页面标题；
- `SITE.interests`——首页「当前兴趣」与研究页；
- `SITE.social`——页脚链接、RSS。

另外还有：`public/favicon.svg`，以及 `.github/workflows/deploy.yml` 中的
站点 URL 环境变量（如需修改）。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发服务器 http://localhost:4321 |
| `npm run build` | 生产构建到 `dist/` |
| `npm run preview` | 本地预览生产构建 |
| `npm run check` | Astro + TypeScript 诊断 |

## 部署到 GitHub Pages

1. 把本仓库推送到 GitHub（分支 `main`）。
2. 打开 GitHub **Settings → Pages → Source**，选择 **GitHub Actions**
   （工作流首次运行时会自动启用）。
3. 每次 push 都会运行 `.github/workflows/deploy.yml`：安装 → 构建 → 部署。
   站点地址为 `https://<用户名>.github.io/<仓库名>/`。
4. 如果是**用户/组织主页**（仓库名为 `<用户名>.github.io`），把工作流
   `Build` 步骤中的 `ASTRO_BASE` 改为 `/`。

本地模拟 Pages 的路径（可选）：

```bash
npm run build
npm run preview
```

## 后续可扩展方向

- 无需 JS 启动开销的即时搜索（Pagefind 风格）
- 文章页内的反向链接局部图（小邻域视图）
- 每篇笔记自动生成 `og:image`
- 时间线接入 git 历史做版本展示
- 构建开关：可选的 embedding 相关笔记

## 设计原则

> 内容优先，知识优先，设计其次。

字体：Inter（正文）+ JetBrains Mono（代码与元信息）。KaTeX 排版数学，
Shiki 为代码提供浅色/深色主题。动效用于传达结构（揭示、悬停上浮、视口
过渡），从不作为装饰，且在 `prefers-reduced-motion` 下完全关闭。正文栏
宽度控制在约 700px 以保证阅读舒适；目录在桌面端是粘性侧栏，移动端为
可折叠块。
