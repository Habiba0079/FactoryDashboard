import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Tests get their own config so Vitest doesn't load the PWA plugin from vite.config.ts.
// Two projects: fast pure-logic tests in Node, and component tests in a simulated browser (jsdom).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
})
