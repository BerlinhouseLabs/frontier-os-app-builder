import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['server/__tests__/**/*.test.ts'],
  },
});
