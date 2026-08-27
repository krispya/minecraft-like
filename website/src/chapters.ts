import type { ComponentType } from 'react';

export interface Chapter {
  slug: string;
  title: string;
  description: string;
  nav: number;
  Content: ComponentType;
}

interface MdxModule {
  default: ComponentType;
  frontmatter?: {
    title?: string;
    description?: string;
    nav?: number;
  };
}

// Eagerly import every chapter from the game-track folder at the repo root.
const modules = import.meta.glob<MdxModule>('../../game-track/*.mdx', { eager: true });

export const chapters: Chapter[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split('/').pop()!.replace(/\.mdx$/, '');
    return {
      slug,
      title: module.frontmatter?.title ?? slug,
      description: module.frontmatter?.description ?? '',
      nav: module.frontmatter?.nav ?? 0,
      Content: module.default,
    };
  })
  .sort((a, b) => a.nav - b.nav);
