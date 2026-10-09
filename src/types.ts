export type Site = {
  NAME: string;
  AUTHOR: string;
  EMAIL: string;
  AVATAR: string;
  OG_IMAGE: string;
  NUM_POSTS_ON_HOMEPAGE: number;
  NUM_DIARY_ON_HOMEPAGE: number;
  NUM_PHOTOGRAPHY_ON_HOMEPAGE: number;
  DIARY_PUBLIC_AFTER_YEARS: number;
};

export type Metadata = {
  TITLE: string;
  DESCRIPTION: string;
};

export type Socials = {
  NAME: string;
  HREF: string;
}[];
