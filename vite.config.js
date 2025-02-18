import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: [
      'castle.nico.re',
      'localhost',
    ],
  },
}); 