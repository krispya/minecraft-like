declare module '*.mdx' {
  import type { ComponentType } from 'react';

  export const frontmatter: {
    title?: string;
    description?: string;
    nav?: number;
  };

  const MDXComponent: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
  export default MDXComponent;
}
