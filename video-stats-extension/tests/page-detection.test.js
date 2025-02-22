const contentScript = require('../src/content.js');

/**
 * Page Detection Tests
 * Tests URL parsing and page type detection for video and index pages
 */

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(() => Promise.resolve({ success: true, data: {} }))
  }
};

describe('Page Type Detection', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log');
    window.location = new URL('https://members.vixenplus.com/videos');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Video Pages', () => {
    const validVideoPaths = [
      '/videos/example-video',
      '/videos/example-video/',
      '/videos/some-really-long-video-name-with-hyphens',
      '/videos/example%20video',  // URL encoded spaces
      '/videos/example-video?someParam=value'  // With query parameters
    ];

    const invalidVideoPaths = [
      '/videos',
      '/videos/',
      '/other/example-video',
      '/videos/category/example-video',
      '/videos/example-video/extra',
      '/',
      '',
      '/channels/videos/example',  // Channel videos should be ignored
      '/videos/category'  // Category pages
    ];

    test.each(validVideoPaths)('should identify valid video path: %s', (path) => {
      window.location = new URL('https://members.vixenplus.com' + path);
      expect(contentScript.isVideoPage()).toBe(true);
    });

    test.each(invalidVideoPaths)('should reject invalid video path: %s', (path) => {
      window.location = new URL('https://members.vixenplus.com' + path);
      expect(contentScript.isVideoPage()).toBe(false);
    });

    test('should log detailed debug information for video pages', () => {
      window.location = new URL('https://members.vixenplus.com/videos/example-video');
      contentScript.isVideoPage();
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

  describe('Index Pages', () => {
    const validIndexPaths = [
      '/videos',
      '/videos/',
      '/videos?page=1',  // With pagination
      '/videos?sort=newest',  // With sorting
      '/videos?category=featured&page=2'  // With category and pagination
    ];

    const invalidIndexPaths = [
      '/videos/example-video',
      '/other',
      '/videos/category',
      '/',
      '',
      '/channels/videos'
    ];

    test.each(validIndexPaths)('should identify valid index path: %s', (path) => {
      window.location = new URL('https://members.vixenplus.com' + path);
      expect(contentScript.isIndexPage()).toBe(true);
    });

    test.each(invalidIndexPaths)('should reject invalid index path: %s', (path) => {
      window.location = new URL('https://members.vixenplus.com' + path);
      expect(contentScript.isIndexPage()).toBe(false);
    });

    test('should log detailed debug information for index pages', () => {
      window.location = new URL('https://members.vixenplus.com/videos?page=2');
      contentScript.isIndexPage();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Stats Extension] Checking page type:',
        expect.objectContaining({
          type: 'INDEX PAGE CHECK',
          pathname: '/videos',
          has_query: true,
          is_index_page: true
        })
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle URLs with multiple consecutive slashes', () => {
      window.location = new URL('https://members.vixenplus.com/videos///example-video');
      expect(contentScript.isVideoPage()).toBe(true);
      expect(contentScript.isIndexPage()).toBe(false);
    });

    test('should handle URLs with encoded characters', () => {
      window.location = new URL('https://members.vixenplus.com/videos/example%20video%20title');
      expect(contentScript.isVideoPage()).toBe(true);
      expect(contentScript.isIndexPage()).toBe(false);
    });

    test('should handle malformed URLs gracefully', () => {
      window.location = new URL('https://members.vixenplus.com/invalid-url-format');
      expect(contentScript.isVideoPage()).toBe(false);
      expect(contentScript.isIndexPage()).toBe(false);
    });

    test('should handle URLs with mixed case', () => {
      window.location = new URL('https://members.vixenplus.com/VideOS/Example-Video');
      expect(contentScript.isVideoPage()).toBe(true);
      expect(contentScript.isIndexPage()).toBe(false);
    });
  });

  describe('Pagination Handling', () => {
    test('should handle first page', () => {
      window.location = new URL('https://members.vixenplus.com/videos?page=1');
      expect(contentScript.isIndexPage()).toBe(true);
    });

    test('should handle middle pages', () => {
      window.location = new URL('https://members.vixenplus.com/videos?page=5');
      expect(contentScript.isIndexPage()).toBe(true);
    });

    test('should handle last page', () => {
      window.location = new URL('https://members.vixenplus.com/videos?page=last');
      expect(contentScript.isIndexPage()).toBe(true);
    });

    test('should handle complex query parameters', () => {
      window.location = new URL('https://members.vixenplus.com/videos?page=2&sort=newest&category=featured');
      expect(contentScript.isIndexPage()).toBe(true);
    });
  });

  describe('Cross-Site Detection', () => {
    const sites = [
      'members.blacked.com',
      'members.tushy.com',
      'members.vixen.com',
      'members.blackedraw.com',
      'members.tushyraw.com',
      'members.deeper.com',
      'members.milfy.com',
      'members.slayed.com',
      'members.vixenplus.com'
    ];

    test.each(sites)('should detect video pages on %s', (domain) => {
      window.location = new URL(`https://${domain}/videos/example-video`);
      expect(contentScript.isVideoPage()).toBe(true);
    });

    test.each(sites)('should detect index pages on %s', (domain) => {
      window.location = new URL(`https://${domain}/videos`);
      expect(contentScript.isIndexPage()).toBe(true);
    });
  });

  describe('Initialization Flow', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="content"></div>';
    });

    test('should initialize correctly on video pages', () => {
      window.location = new URL('https://members.vixenplus.com/videos/example-video');
      contentScript.initialize();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Stats Extension] Video page detected, fetching stats'
      );
    });

    test('should initialize correctly on index pages', () => {
      window.location = new URL('https://members.vixenplus.com/videos');
      contentScript.initialize();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Stats Extension] Index page detected, processing video cards'
      );
    });

    test('should handle unsupported pages gracefully', () => {
      window.location = new URL('https://members.vixenplus.com/other');
      contentScript.initialize();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Stats Extension] Not a supported page type (not an index or video page)'
      );
    });
  });
}); 