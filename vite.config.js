import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Относительные пути к файлам: собранный сайт работает и на своём домене,
  // и во вложенной папке (GitHub Pages), и просто открытый с диска.
  base: './',
  build: {
    outDir: 'dist',
    // Отдельные файлы для библиотек — браузер закеширует их
    // и при следующих заходах будет грузить только код теста.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
