import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ponytail: nothing to configure. render-check.html is served by the dev
// server on its own; it is a dev tool, so it stays out of the build.
export default defineConfig({ plugins: [react()] });
