# 维护交接手册（给未来的会话 / 未来的自己）

> 新对话接手本项目时，先读本文件即可恢复全部上下文，无需翻聊天记录。

## 项目速览

| 项 | 值 |
| --- | --- |
| 本地路径 | `D:\git\knowledge-base` |
| 技术栈 | Astro 5 + TypeScript + Tailwind CSS 4（零运行时依赖的静态站） |
| 远程仓库 | https://github.com/zz1l/personal-pages.git |
| 线上站点 | https://zz1l.github.io/personal-pages/ |
| 部署方式 | push 到 main 后 GitHub Actions 自动构建部署（`.github/workflows/deploy.yml`） |

## 日常操作（最常用）

### 新增一篇笔记
1. 在 `src/content/notes/<分类>/` 下新建 `英文文件名.md`；
2. frontmatter 格式：

```yaml
---
title: "笔记标题"              # 中文标题写这里；[[wiki 链接]] 按它匹配
description: "一句话摘要"      # 显示在卡片与搜索结果
category: "数学"               # 数学 / 计算机科学 / AI / 研究
subcategory: "逻辑"            # 可选
tags: [逻辑, 数理逻辑]         # 可选
difficulty: advanced           # 可选：introductory/intermediate/advanced
created: 2026-08-15
updated: 2026-08-15            # 可选，默认同 created
featured: true                 # 可选，首页精选
---
```

3. 正文支持：KaTeX（`$...$` / `$$...$$`）、代码块、mermaid（```mermaid）、
   提示块（`> [!NOTE]` / `[!TIP]` / `[!WARNING]` / `[!IMPORTANT]`）、
   脚注 `[^1]`、内部链接 `[[笔记标题]]`。

### 提交并部署
```bash
cd D:\git\knowledge-base
git add -A
git -c user.name="zzl" -c user.email="2809628378@qq.com" commit -m "描述改动"
git push origin main
```
push 后约 1 分钟自动上线。检查部署状态：GitHub 仓库 Actions 页，或调 API：
`GET https://api.github.com/repos/zz1l/personal-pages/actions/runs`（凭据在
`~/.git-credentials`，用 `Authorization: Bearer <token>` 头）。

### 构建验证（推送前可选）
```bash
npm run build && npm run check
```

## 本机环境要点（换机器或重装后需重建）

- **git 走系统代理** `127.0.0.1:26561`（浏览器代理软件）：
  `git config --global http.proxy/http.https.proxy` 已指向它，
  `http.sslVerify` 已关闭（代理做 HTTPS 拦截）。若 push 报连接重置/证书错误，
  先检查代理软件是否在运行。
- **TEMP/TMP 已改到 `D:\Temp`**（用户级环境变量）。原因：DSH 的 pwsh 沙盒要求
  临时目录在工作区之外，而 C 盘工作区 `C:\Users\zlyyds` 包含默认临时目录会报
  `Windows ACL temp root must be outside the workspace`。不要改回默认，否则
  主目录工作区的会话将无法用 pwsh。
- **git 凭据**已存于 `~/.git-credentials`（credential.helper=store），push 免密。

## 重要文件地图

| 文件 | 作用 |
| --- | --- |
| `src/config.ts` | 站名/标语/兴趣/社交链接/分类顺序/子分类预设 |
| `src/content.config.ts` | 笔记、项目、研究的内容 schema |
| `src/content/notes/**` | 笔记源文件（唯一的事实来源） |
| `src/content/projects/`、`src/content/research/` | 项目与论文/想法/实验 |
| `src/lib/graph.ts` | wiki 链接图谱、相关笔记、反向链接（fs 扫描） |
| `src/lib/markdown/*.mjs` | 自定义 remark/rehype 插件（wiki 链接、mermaid、提示块、行号） |
| `src/scripts/app.ts` 等 | 客户端脚本（命令面板、目录、复制按钮、图谱画布） |
| `.github/workflows/deploy.yml` | CI 部署（自动从仓库名推导 base 路径） |

## 踩过的坑（重要）

1. **修改 remark/rehype 插件后必须清缓存**：`Remove-Item -Recurse -Force
   node_modules\.astro, .astro` 再 build，否则内容层复用旧渲染结果。
2. **笔记文件名必须全库唯一**：URL 由文件名决定（`/notes/<文件名>/`）。
3. **wiki 链接匹配做了标点归一化**：Astro 默认 smartypants 会把直引号变成
   弯引号，匹配逻辑已兼容，中文标题链接正常。
4. **GitHub Pages base 路径**由工作流自动注入（`ASTRO_BASE`），本地构建用
   `/`，无需手动改。
5. **网站界面语言是中文**；之前删除了「种子/常青」状态体系——**不要**重新
   引入类似的概念化功能（用户明确不喜欢）。

## 联系方式

- 邮箱：2809628378@qq.com（已配置在 `src/config.ts` 的 `SITE.social.email`）
