import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx)',
    '**/__test__/**/*.(test|spec).(ts|tsx)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/router$': 'next/dist/client/router',
    '^next/link$': '<rootDir>/test/NextLinkMock.js',
    '^.+\\.(css|scss)$': '<rootDir>/test/styleMock.js',
  },
};

export default config;
