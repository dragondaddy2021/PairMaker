import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    include:     ['tests/api/**/*.test.ts'],
    timeout:     30000,
    reporters:   ['verbose', 'junit'],
    outputFile: {
      junit: 'reports/api-test-results.xml',
    },
  },
});
