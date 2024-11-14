import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', 
  server: {
    open: true, 
  },
  build: {
    rollupOptions: {
      input: 'index.html', 
    },
  },
});
