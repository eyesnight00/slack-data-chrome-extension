import { jest } from '@jest/globals';

// Mock Chrome extension API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    onInstalled: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

// Mock window.location
delete window.location;
window.location = {
  href: '',
  pathname: '',
  hostname: '',
  search: '',
  assign: jest.fn()
}; 