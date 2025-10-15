/**
 * Jest configuration in ESM to avoid requiring ts-node for parsing TS config.
 */

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx)',
    '**/__test__/**/*.(test|spec).(ts|tsx)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/router$': 'next/dist/client/router',
    '^next/link$': '<rootDir>/test/NextLinkMock.js',
    '^.+\\.(css|scss)$': '<rootDir>/test/styleMock.js',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!<rootDir>/**/__tests__/**',
    '!<rootDir>/**/__test__/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'json-summary']
};

export default config;
