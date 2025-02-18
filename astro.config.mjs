// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'server',
  adapter: netlify(),
  server: {
    host: true,
    port: 3000,
  },
  vite: {
    server: {
      allowedHosts: ['castle.nico.re', 'localhost'],
    },
  },
});
