import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import pkg from './package.json';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const dependencies = Object.keys(pkg.dependencies ?? {});

export default defineConfig({
  build: {
    ssr: true,
    lib: {
      entry: resolve(projectRoot, 'src/server.ts'),
      formats: ['es'],
      fileName: 'server'
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
    rollupOptions: {
      external: (id) =>
        id.startsWith('node:') ||
        dependencies.some((dependency) => id === dependency || id.startsWith(`${dependency}/`)),
      output: {
        banner: '#!/usr/bin/env node'
      }
    }
  }
});
