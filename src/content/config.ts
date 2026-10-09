import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    author: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

const diary = defineCollection({
  type: "content",
  schema: z.object({
    date: z.coerce.date(),
    author: z.string().optional(),
    draft: z.boolean().optional(),
    // 永不公开：即使超过 DIARY_PUBLIC_AFTER_YEARS 年也保持加密，只能靠密码解锁
    private: z.boolean().optional(),
  }),
});

const photography = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    dateEnd: z.coerce.date().optional(),
    author: z.string().optional(),
    preview: z.enum(["mosaic", "duo", "fan", "single"]).optional(),
    draft: z.boolean().optional(),
  }),
});

const pages = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { blog, diary, photography, pages };