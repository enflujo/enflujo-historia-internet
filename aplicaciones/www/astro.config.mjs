import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

export default defineConfig({
  publicDir: './estaticos',
  site: 'https://historiasinternet.uniandes.edu.co',
  srcDir: './fuente',
  outDir: './publico',
  base: '/',
  integrations: [sitemap(), pagefind()],
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
