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
