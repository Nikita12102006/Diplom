module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/server/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
};