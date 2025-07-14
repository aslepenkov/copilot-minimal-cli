import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '*.config.*',
        '**/*.test.ts',
        '**/*.spec.ts',
        'Dockerfile'
      ],
      // Include source files for coverage
      include: [
        'tools/**/*.ts',
        'agent.ts',
        'auth.ts', 
        'cli.ts',
        'copilot-api.ts'
      ],
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
})
