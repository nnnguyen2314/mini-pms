import '@testing-library/jest-dom';
import 'jest';

declare global {
  // Force the global expect to use Jest typings (with jest-dom extensions)
  const expect: jest.ExpectStatic;
}

export {};
