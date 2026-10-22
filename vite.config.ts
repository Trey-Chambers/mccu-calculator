import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        format: 'iife', // Forces standard script execution for WordPress
        entryFileNames: 'calculator.js',
        assetFileNames: (assetInfo) => {
          // Safely check if the output asset is a CSS file
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'style.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  }
});