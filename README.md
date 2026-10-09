# Afterword

用 [Astro](https://astro.build) 构建的个人站点：**文章 / 日记 / 摄影**，部署在 Cloudflare Pages。
派生自 [astro-nano](https://github.com/markhorn-dev/astro-nano)，在其之上做了较大幅度的定制。

仓库自带一份极简示例内容，克隆下来就能独立安装、独立构建，不需要任何私有素材。

|  |  |
| :--- | :--- |
| 线上站点 | https://afterwordx.pages.dev |
| 技术栈 | Astro 5 + Tailwind CSS 3 + MDX |
| 许可 | MIT |

## 快速开始

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出到 dist/
npm run preview  # 预览构建产物
```

示例日记写于 2020 年，按「超过三年自动公开」的规则是公开的，所以默认构建**不需要密码**。

## 板块

| 板块 | 路由 | 定位 |
| :--- | :--- | :--- |
| Blog | `/blog` | 完整文章，按年份归档 |
| Diary | `/diary` | 碎片记录，标题就是日期，默认加密，按年 + 月归档 |
| Photography | `/photography` | 摄影影集，图为主、文为辅，按年份归档 |
| About | `/about` | 站点自述，不占顶部导航，入口在页脚版权处 |

## 我们做了什么

### 内容模型

- `work` → `diary`，`projects` → `photography`，新增独立的 `pages` 集合，移除 RSS
- `diary` 的 frontmatter 刻意只有 `date`：标题和摘要全部由日期派生，不接受 description / mood / weather / location 这类字段，写一篇日记不需要做选择题
- 三个内容集合都支持可选的 `author`，文章详情页的署名取自 frontmatter，与日期同排
- 全站社交链接只保留 GitHub，页脚另留一行邮箱

### 日记加密

近三年内的日记在构建产物里是密文，读者在页面上输入密码后由浏览器解密。

- **算法**：PBKDF2-SHA256（210,000 次迭代）派生密钥，AES-256-GCM 加密，16 字节随机 salt + 12 字节随机 IV
- **实现**：Astro integration `integrations/diary-vault.ts` 挂在 `astro:build:done`，直接改写 `dist/**/*.html`，把正文标记区间替换成一段 Base64 密文，放在 `data-afterword-vault-payload` 属性上
- **解密**：纯前端 WebCrypto，明文不经过服务器
- **密码来源**：`DIARY_PASSWORD` 环境变量，或 `.env.local` / `.env`
- **fail-closed**：存在待加密日记却没提供密码时，构建直接失败，避免明文误发布
- **自动公开**：超过 `DIARY_PUBLIC_AFTER_YEARS`（默认 3 年）的日记按规则公开，不再需要密码，同时进入 sitemap

仓库里的 Markdown 始终是明文，所以**存放内容的仓库必须私有**。另外密码强度决定实际安全性，弱口令仍可能被离线暴力破解。

### 时间分组与图标

- Blog / Photography 按**年**归档
- Diary 按**年 + 月**两层归档（日记量大，只按年不够用）
- 年份图标是**星座**（按 `year % 12` 取十二星座之一，纯装饰），月份图标对应**季节**（一月雪花、三月新芽、八月骄阳……），全部来自 [Lucide](https://lucide.dev)
- Lucide 只有单色线条图标，没有彩色版本，所以图标统一用 `currentColor` 跟随主题色

### 摄影画廊

- 列表卡片不是「一张封面 + 标题」，而是**一组预览图**：按影集内照片的朝向自动挑布局（`mosaic` / `duo` / `fan` / `single`），也可以在 frontmatter 里用 `preview` 手动指定
- 详情页用 `<PhotoGrid>` 做**保留原始比例的瀑布流**：横图通栏、竖图限高居中，同页混排横竖图也不难看
- 每张图带 mac 风格的多层投影（浅色模式明显，暗色模式减弱）
- **灯箱**：左右切换、`1 / 12` 计数器、方向键与 Esc
- **EXIF** 自动读取并展开（机身、镜头、光圈、快门、ISO、焦距）
- 排序按**拍摄时间从早到晚**：EXIF 拍摄时间优先，缺失时退回文件修改时间，再退到文件名（数字感知，`01-` / `02-` 前缀按预期排序）
- 影集正文同时支持解说文字和短文章，图文可以混排

### About 与活动热力图

- About 是一篇独立的 `pages` 内容，和三大板块分开，入口在页脚版权处
- 页内嵌 GitHub 风格的提交日历，汇总文章 / 日记 / 摄影的更新记录
- 支持**日 / 月 / 年**三档粒度切换，纯 CSS（radio + peer），不需要 JS
- 绿色系配色，颜色深浅按当天字数分档
- 就是一篇普通 Markdown，文案留有编辑空间

### 首页

- 首屏是一句话介绍加署名
- 下面依次取 Blog / Diary / Photography 的最新几条（条数在 `consts.ts` 里配）
- 不再有社交链接墙，只保留 GitHub

### 视觉与排版

- 站名 Afterword 用花体字（[Great Vibes](https://fontsource.org/fonts/great-vibes)），页脚版权同步
- 首页头像与站点 favicon 都是自绘的 SVG 线条图形
- 中文友好的阅读时长与字数统计，日期中文化
- Markdown 开启 `remark-breaks`：单换行渲染成换行而不是空格，日记「一行一句」的排版才不会被挤成一段
- `<html lang="zh-CN">`

### 工程细节

- 摘要不手写：`description` 可选，不写时由 `excerpt()` 从正文自动截取（约 100 字，优先在句号、逗号处断开）
- 仓库统一 LF 换行（`.gitattributes`）
- `npm run og` 重新生成社交分享图 `public/og.png`

## 内容结构

| 集合 | 路径 | 说明 |
| :--- | :--- | :--- |
| `blog` | `src/content/blog/<slug>/index.md` | `title` `date` 必需 |
| `diary` | `src/content/diary/<YYYY-MM-DD>/index.md` | 只有 `date`，目录名必须是日期 |
| `photography` | `src/content/photography/<slug>/index.mdx` | 图片放同一目录，正文用 `<Photo>` / `<PhotoGrid>` |
| `pages` | `src/content/pages/*.md` | 独立页面，目前是 `about.md` |

目录名即 URL：diary 用日期，其余用自定义 slug。

```md
---
title: 初雪杂谈
date: 2019-11-13
author: Jerome        # 可选，不写则不署名
description: 可选      # 不写则由正文自动截取
---
```

影集额外支持跨天拍摄和卡片布局：

```md
---
title: 秋日漫步
date: 2026-10-01
dateEnd: 2026-10-03   # 可选，跨天拍摄
preview: mosaic       # 可选：mosaic / duo / fan / single
---
```

`<Photo>` 常用参数：`src` `alt` 必填，另有 `caption`、`width`（`prose` / `wide` / `full`）、`align`、`pair`（并排）、`exif`、`shadow`。

## 项目结构

```
integrations/diary-vault.ts   构建期日记加密
scripts/sync-from-site.mjs    从站点仓库同步主题文件
scripts/generate-og.mjs       生成分享图
src/consts.ts                 站点名、作者、邮箱、头像、首页条数、公开年限
src/content/config.ts         四个集合的 schema
src/lib/vault.ts              AES-GCM 加解密
src/lib/diary.ts              「是否已公开」判定
src/lib/gallery.ts            影集照片收集与排序
src/lib/exif.ts               EXIF 解析与展示
src/lib/calendar.ts           年 / 月图标映射
src/lib/activity.ts           热力图数据
src/components/               Photo / PhotoGrid / Lightbox / ActivityCalendar / DiaryVault …
src/pages/                    index / blog / diary / photography / about
```

## 配置

- `astro.config.mjs` —— `site`，影响 canonical、sitemap 与 `og:image`
- `src/consts.ts` —— `SITE.NAME` / `AUTHOR` / `EMAIL` / `AVATAR` / `OG_IMAGE`、首页三个板块条数、`DIARY_PUBLIC_AFTER_YEARS`、各板块 Metadata、`SOCIALS`
- `public/avatar.svg`、`public/favicon.svg`、`public/og.png` —— 换成自己的形象即可

## 构建与部署

Cloudflare Pages：构建命令 `npm run build`，输出目录 `dist`，环境变量里加 `DIARY_PASSWORD`。

本地构建：

```powershell
$env:DIARY_PASSWORD = "your-password"; npm run build
```

也可以写在 `.env.local` 里：

```
DIARY_PASSWORD=your-password
```

密码只在构建期使用，不会进产物；但**部署平台的构建环境变量里必须配一份**，否则存在待加密日记时构建会失败。

## 与 Afterword 站点的关系

本仓库是 [Afterword](https://github.com/Cr1m3rA/Afterword) 站点的主题部分，由 `scripts/sync-from-site.mjs` 从站点仓库单向同步而来：

```bash
node scripts/sync-from-site.mjs            # 先看计划（dry run）
node scripts/sync-from-site.mjs --apply    # 执行
```

**站点仓库是唯一来源，本仓库是派生产物。** 同步会镜像 `src/components`、`src/layouts`、`src/styles`、`src/lib`、`src/pages`、`integrations` 以及若干配置文件，并排除 `src/content/**`（那是内容，本仓库自带示例）。

因此**不要直接在本仓库改主题代码**，改动会在下次同步时被覆盖。要改就改站点仓库，然后同步过来。

上游 astro-nano 保留在 `upstream` remote，需要时 `git fetch upstream` 跟进。

## 许可

MIT，见 `LICENSE`。原主题 astro-nano 的版权归 Mark Horn。