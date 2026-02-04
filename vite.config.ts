import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // relative paths so index.html works via file:// inside WebView
  plugins: [react()],
  server: {
    host: true,
    port: 3000
  }
});
