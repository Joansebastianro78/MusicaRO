import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Lets you run `vite dev` (fast HMR) in one terminal while
    // `vercel dev` serves the /api functions in another (default port
    // 3000). Not needed if you just run `vercel dev` for everything.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
