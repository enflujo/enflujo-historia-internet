// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  publicDir: './estaticos',
  site: 'https://enflujo.github.io/enflujo-historia-internet',
  srcDir: './fuente',
  outDir: './publico',
  base: '/enflujo-historia-internet',
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
