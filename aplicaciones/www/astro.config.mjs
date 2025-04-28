import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  publicDir: './estaticos',
  site: 'https://enflujo.github.io/enflujo-historia-internet',
  srcDir: './fuente',
  outDir: './publico',
  base: '/enflujo-historia-internet',
  integrations: [sitemap()],
  vite: {
    server: {
      watch: {
        ignored: ['./wordpress/**/**'],
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  },
});
