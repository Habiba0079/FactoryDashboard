import { defineConfig } from 'vitest/config'

// Tests get their own config so Vitest doesn't load the PWA plugin from vite.config.ts.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
