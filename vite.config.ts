import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error The content builder is shared with Node's native test runner.
import { buildContent } from './scripts/content.mjs';

export default defineConfig({
  base: process.env.PAGES_BASE_PATH || '/',
  plugins: [react(), {
    name: 'travel-markdown',
    buildStart() { buildContent(); },
    configureServer(server) {
      server.watcher.add('mds');
      server.watcher.on('all', (event, file) => {
        if (file.endsWith('.md') && /(^|[/\\])mds[/\\]/.test(file) && ['add', 'change', 'unlink'].includes(event)) {
          try { buildContent(); }
          catch (error) { server.ws.send({ type: 'error', err: { message: String(error), stack: '' } }); }
        }
      });
    },
  }],
});
