// src/setupTests.js
require('@testing-library/jest-dom');

// Мок для localStorage (если нужно)
if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
}