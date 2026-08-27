import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      // The game-track mdx files live outside this package root, so pin the
      // provider import to this package's copy.
      '@mdx-js/react': fileURLToPath(import.meta.resolve('@mdx-js/react')),
      react: fileURLToPath(new URL('./node_modules/react', import.meta.url)),
      'react-dom': fileURLToPath(new URL('./node_modules/react-dom', import.meta.url)),
    },
  },
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  ],
  server: {
    fs: {
      // Allow serving the game-track mdx files from the repo root.
      allow: ['..'],
    },
  },
});
