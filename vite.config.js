import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Builds the React islands as one IIFE bundle (React included) exposing `window.Islands`.
 * Output goes to public/dist so Express serves it as /dist/islands.js.
 */
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'public/dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: 'client/islands/index.jsx',
      name: 'Islands',
      formats: ['iife'],
      fileName: () => 'islands.js',
    },
  },
});
