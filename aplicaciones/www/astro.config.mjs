import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  publicDir: './estaticos',
  site: 'https://historiasinternet.uniandes.edu.co',
  srcDir: './fuente',
  outDir: './publico',
  base: '/',
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
