// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  publicDir: './estaticos',
  site: 'https://historiainternet.uniandes.edu.co',
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  },
});
