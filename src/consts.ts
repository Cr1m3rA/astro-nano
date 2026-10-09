import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Afterword",
  AUTHOR: "Jerome",
  EMAIL: "jerryhuang99@outlook.com",
  AVATAR: "/avatar.svg",
  OG_IMAGE: "/og.png",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_DIARY_ON_HOMEPAGE: 3,
  NUM_PHOTOGRAPHY_ON_HOMEPAGE: 3,
  DIARY_PUBLIC_AFTER_YEARS: 3,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "Afterword is a minimal blog, diary and photography site.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "Afterword 的文章归档。",
};

export const DIARY: Metadata = {
  TITLE: "Diary",
  DESCRIPTION: "Afterword 的日记归档，按年月分组。",
};

export const PHOTOGRAPHY: Metadata = {
  TITLE: "Photography",
  DESCRIPTION: "Afterword 的摄影作品归档。",
};

export const ABOUT: Metadata = {
  TITLE: "About",
  DESCRIPTION: "关于 Afterword 这个项目。",
};

export const SOCIALS: Socials = [
  {
    NAME: "github",
    HREF: "https://github.com/cr1m3ra",
  },
];
