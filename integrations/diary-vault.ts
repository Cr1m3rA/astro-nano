import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { z } from "astro/zod";
import {
  VAULT_END,
  VAULT_PAYLOAD_ATTRIBUTE,
  VAULT_START,
  encryptText,
} from "../src/lib/vault";

const optionsSchema = z.object({
  password: z.string(),
});

export type DiaryVaultOptions = z.input<typeof optionsSchema>;

async function collectHtmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const target = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(target)));
    } else if (entry.name.endsWith(".html")) {
      files.push(target);
    }
  }

  return files;
}

export default function diaryVault(
  userOptions: DiaryVaultOptions
): AstroIntegration {
  const options = optionsSchema.parse(userOptions);

  return {
    name: "afterword:diary-vault",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const outputRoot = fileURLToPath(dir);
        const files = await collectHtmlFiles(outputRoot);
        const targets: { file: string; html: string; blocks: number }[] = [];

        for (const file of files) {
          const html = await readFile(file, "utf8");
          let cursor = 0;
          let blocks = 0;

          while (cursor < html.length) {
            const start = html.indexOf(VAULT_START, cursor);
            if (start === -1) {
              break;
            }
            const end = html.indexOf(VAULT_END, start);
            if (end === -1) {
              throw new Error(
                `Diary Vault: ${file} 缺少结束标记 ${VAULT_END}`
              );
            }
            blocks += 1;
            cursor = end + VAULT_END.length;
          }

          if (blocks > 0) {
            targets.push({ file, html, blocks });
          }
        }

        if (targets.length === 0) {
          logger.warn("没有找到需要加密的日记页面，跳过");
          return;
        }

        if (!options.password) {
          throw new Error(
            "Diary Vault: 存在需要加密的日记，但未提供密码。\n" +
              "请在 .env 中设置 DIARY_PASSWORD，或在部署环境注入同名变量。"
          );
        }

        let pages = 0;
        let blocks = 0;

        for (const target of targets) {
          let html = target.html;

          while (true) {
            const start = html.indexOf(VAULT_START);
            if (start === -1) {
              break;
            }
            const end = html.indexOf(VAULT_END, start);
            const inner = html.slice(start + VAULT_START.length, end);
            const payload = await encryptText(inner, options.password);
            const encoded = Buffer.from(
              JSON.stringify(payload),
              "utf8"
            ).toString("base64");
            const replacement =
              `<script type="application/json" ${VAULT_PAYLOAD_ATTRIBUTE}>` +
              `${encoded}</script>`;

            html =
              html.slice(0, start) +
              replacement +
              html.slice(end + VAULT_END.length);
            blocks += 1;
          }

          await writeFile(target.file, html, "utf8");
          pages += 1;
        }

        logger.info(`已加密 ${pages} 个日记页面，共 ${blocks} 段正文`);
      },
    },
  };
}
