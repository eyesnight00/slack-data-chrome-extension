// Global Video Card Detection Tests
describe('Global Video Card Detection', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    document.body.innerHTML = '<div id="content"></div>';
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    document.body.innerHTML = '';
  });

  describe('Basic Video Card Detection', () => {
    test('should detect VideoThumbnailContainer', () => {
      document.body.innerHTML = `
        <div id="content">
          <div data-test-component="VideoThumbnailContainer">
            <img src="example.jpg" />
          </div>
        </div>
      `;
      expect(isPageWithVideoCards()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Stats Extension] Found video cards using selector:')
      );
    });

    test('should detect VideoThumbnailPreview', () => {
      document.body.innerHTML = `
        <div id="content">
          <div data-test-component="VideoThumbnailPreview">
            <img src="example.jpg" />
          </div>
        </div>
      `;
      expect(isPageWithVideoCards()).toBe(true);
    });

    test('should detect ProgressiveImage', () => {
      document.body.innerHTML = `
        <div id="content">
          <div data-test-component="ProgressiveImage">
            <img src="example.jpg" />
          </div>
        </div>
      `;
      expect(isPageWithVideoCards()).toBe(true);
    });

    test('should return false when no video cards present', () => {
      document.body.innerHTML = `
        <div id="content">
          <div class="other-content">
            <img src="example.jpg" />
          </div>
        </div>
      `;
      expect(isPageWithVideoCards()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Stats Extension] No video cards found on page'
      );
    });

    test('should count number of video cards found', () => {
      document.body.innerHTML = `
        <div id="content">
          <div data-test-component="VideoThumbnailContainer">
            <img src="example1.jpg" />
          </div>
          <div data-test-component="VideoThumbnailPreview">
            <img src="example2.jpg" />
          </div>
          <div data-test-component="ProgressiveImage">
            <img src="example3.jpg" />
          </div>
        </div>
      `;
      const result = getVideoCardCount();
      expect(result).toBe(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Stats Extension] Found 3 video cards on page'
      );
    });
  });
});