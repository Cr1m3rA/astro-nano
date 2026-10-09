# Afterword 主题

基于 [astro-nano](https://github.com/markhorn-dev/astro-nano) 深度定制的 Astro 主题，
用于个人博客 / 日记 / 摄影站点。MIT 许可，原主题版权归 Mark Horn。

仓库里带一份极简示例内容，**可以独立安装并构建**。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 输出到 dist/
npm run preview
```

不需要任何环境变量即可构建——示例日记写于 2020 年，已超过三年，按规则是公开的。

## 内容结构

| 集合 | 路径 | 说明 |
| :--- | :--- | :--- |
| `blog` | `src/content/blog/<slug>/index.md` | 文章。`title` `date` 必需，`description` 可选（不写则自动取正文前 100 字） |
| `diary` | `src/content/diary/<YYYY-MM-DD>/index.md` | 日记。**只有 `date`**，标题由日期生成，没有 description |
| `photography` | `src/content/photography/<slug>/index.mdx` | 影集。图片放在同一目录，正文用 `<Photo>` 排版 |
| `pages` | `src/content/pages/*.md` | 独立页面，目前是 `about.md` |

目录名就是 URL（diary 用日期，其余用自定义 slug）。

## 相对 astro-nano 的主要改动

- **集合重构**：`work` → `diary`、`projects` → `photography`，新增 `pages`；移除 RSS
- **日记加密**：自建 Astro integration（`integrations/diary-vault.ts`）在构建后加密日记正文，
  浏览器端用 WebCrypto 解密；超过三年的日记自动公开
- **分组与图标**：blog / photography 按年份分组，diary 按年 + 月两层分组；
  年份用星座符号，月份用对应季节的线性图标（图标来自 Lucide）
- **摄影画廊**：`<Photo>` 按朝向自动适配（横幅通栏、竖幅限高居中、方形限宽），
  `<PhotoGrid>` 提供保留原始比例的瀑布流，EXIF 自动读取并展示，详情页带灯箱
- **活动热力图**：About 页的 GitHub 风格提交日历，日 / 月 / 年三档粒度，纯 CSS 切换
- **排版**：花体字标（Great Vibes）、mac 风格多层投影、日期中文化、中文友好的阅读时长与字数统计
- **其他**：`<html lang="zh-CN">`、去除主题营销素材、`excerpt()` 自动摘要

详细的取舍与规则散落在代码注释和 `README` 里；改动全貌可直接看
`git diff upstream/main`。

## 换一个新站点要改哪里

1. `astro.config.mjs` —— `site` 改成你的域名（影响 canonical / sitemap / og:image）
2. `src/consts.ts` —— 站点名、作者、邮箱、头像、首页条数
3. `src/content/**` —— 替换示例内容
4. `public/avatar.svg`、`public/favicon.svg`、`public/og.png` —— 换成自己的形象
   （`npm run og` 可重新生成分享图）
5. 首页首屏文案在 `src/pages/index.astro`

## 日记加密

近三年内的日记会在构建时加密。构建需要 `DIARY_PASSWORD` 环境变量：

```powershell
$env:DIARY_PASSWORD = "your-password"; npm run build
```

缺少该变量但存在待加密日记时，**构建会直接失败**（fail-closed），避免误将明文发布出去。

加密只保护构建产物，仓库里的 Markdown 仍是明文，所以**存放内容的仓库必须保持私有**。

## 与 Afterword 站点的关系

本仓库是 [Afterword](https://github.com/Cr1m3rA/Afterword) 站点的主题部分，
由 `scripts/sync-from-site.mjs` 从站点仓库同步而来：

```bash
node scripts/sync-from-site.mjs            # 先看计划
node scripts/sync-from-site.mjs --apply    # 执行
```

**Afterword 站点是唯一来源，本仓库是派生产物。** 同步会镜像
`src/components`、`src/layouts`、`src/styles`、`src/lib`、`src/pages`、`integrations`
以及若干配置文件，并排除 `src/content/**`（那是内容，本仓库自带示例）。

因此**不要直接在本仓库改主题代码**——改动会在下次同步时被覆盖。要改就改站点仓库，然后同步过来。

## 许可

MIT。原主题 astro-nano 的版权归 Mark Horn，见 `LICENSE`。