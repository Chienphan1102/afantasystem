import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  // Load env from monorepo root (../../.env) so we share creds with API.
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '../..'), 'VITE_');
  const localEnv = loadEnv(mode, __dirname, 'VITE_');
  const env = { ...rootEnv, ...localEnv };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL ?? 'http://localhost:3001'),
      'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME ?? 'AFANTA'),
    },
    server: {
      port: 5173,
      strictPort: false,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
