import { jest } from '@jest/globals';
import {
  isVideoPage,
  isIndexPage,
  initialize
} from '../src/content.js';

// Tests for page type detection logic
describe('Page Type Detection', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log');
    jest.spyOn(chrome.runtime, 'sendMessage').mockImplementation(() => Promise.resolve({ success: true, data: {} }));
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('isVideoPage()', () => {
    const validVideoPaths = [
      '/videos/example-video',
      '/videos/example-video/',
      '/videos/some-really-long-video-name-with-hyphens'
    ];

    const invalidVideoPaths = [
      '/videos',
      '/videos/',
      '/other/example-video',
      '/videos/category/example-video',
      '/videos/example-video/extra',
      '/',
      ''
    ];

    test.each(validVideoPaths)('should return true for valid video path: %s', (path) => {
      window.location.pathname = path;
      expect(isVideoPage()).toBe(true);
    });

    test.each(invalidVideoPaths)('should return false for invalid video path: %s', (path) => {
      window.location.pathname = path;
      expect(isVideoPage()).toBe(false);
    });

    test('should log detailed debug information', () => {
      window.location.pathname = '/videos/example-video';
      
      isVideoPage();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Stats Extension] Checking page type:',
        expect.objectContaining({
          type: 'VIDEO PAGE CHECK',
          pathname: '/videos/example-video',
          is_video_page: true
        })
      );
    });
  });

  describe('isIndexPage()', () => {
    const validIndexPaths = [
      '/videos',
      '/videos/'
    ];

    const invalidIndexPaths = [
      '/videos/example-video',
      '/other',
      '/videos/category',
      '/',
      ''
    ];

    test.each(validIndexPaths)('should return true for valid index path: %s', (path) => {
      window.location.pathname = path;
      expect(isIndexPage()).toBe(true);
    });

    test.each(invalidIndexPaths)('should return false for invalid index path: %s', (path) => {
      window.location.pathname = path;
      expect(isIndexPage()).toBe(false);
    });

    test('should log detailed debug information', () => {
      window.location.pathname = '/videos';
      
      isIndexPage();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Stats Extension] Checking page type:',
        expect.objectContaining({
          type: 'INDEX PAGE CHECK',
          pathname: '/videos',
          is_index_page: true
        })
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle URLs with multiple consecutive slashes', () => {
      window.location.pathname = '/videos///example-video';
      expect(isVideoPage()).toBe(true);
      expect(isIndexPage()).toBe(false);
    });

    test('should handle URLs with encoded characters', () => {
      window.location.pathname = '/videos/example%20video';
      expect(isVideoPage()).toBe(true);
      expect(isIndexPage()).toBe(false);
    });

    test('should handle malformed URLs gracefully', () => {
      window.location.pathname = 'invalid-url-format';
      expect(isVideoPage()).toBe(false);
      expect(isIndexPage()).toBe(false);
    });
  });

  describe('Initialization Flow', () => {
    test('should call fetchVideoStats for video pages', async () => {
      window.location.pathname = '/videos/example-video';
      await initialize();
      expect(consoleSpy).toHaveBeenCalledWith('[Stats Extension] Video page detected, fetching stats');
    });

    test('should call processVideoCards for index pages', async () => {
      window.location.pathname = '/videos';
      await initialize();
      expect(consoleSpy).toHaveBeenCalledWith('[Stats Extension] Index page detected, processing video cards');
    });

    test('should not call either handler for other pages', async () => {
      window.location.pathname = '/other';
      await initialize();
      expect(consoleSpy).toHaveBeenCalledWith('[Stats Extension] Not a supported page type (not an index or video page)');
    });
  });
}); 