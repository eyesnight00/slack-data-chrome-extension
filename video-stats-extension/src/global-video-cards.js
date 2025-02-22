// Global Video Card Detection and Processing

// Common selectors for video cards
const VIDEO_CARD_SELECTORS = [
  '[data-test-component="VideoThumbnailContainer"]',
  '[data-test-component="VideoThumbnailPreview"]',
  '[data-test-component="ProgressiveImage"]'
];

/**
 * Checks if the current page contains video cards
 * @returns {boolean} True if the page contains video cards
 */
function isPageWithVideoCards() {
  for (const selector of VIDEO_CARD_SELECTORS) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log('[Stats Extension] Found video cards using selector:', {
        selector,
        count: elements.length
      });
      return true;
    }
  }
  
  console.log('[Stats Extension] No video cards found on page');
  return false;
}

/**
 * Gets the total count of video cards on the page
 * @returns {number} The number of video cards found
 */
function getVideoCardCount() {
  let totalCount = 0;
  
  for (const selector of VIDEO_CARD_SELECTORS) {
    const elements = document.querySelectorAll(selector);
    totalCount += elements.length;
  }
  
  console.log('[Stats Extension] Found', totalCount, 'video cards on page');
  return totalCount;
}

/**
 * Gets all video card elements on the page
 * @returns {Array<Element>} Array of video card elements
 */
function getAllVideoCards() {
  const cards = [];
  
  for (const selector of VIDEO_CARD_SELECTORS) {
    const elements = document.querySelectorAll(selector);
    cards.push(...Array.from(elements));
  }
  
  console.log('[Stats Extension] Retrieved all video cards:', {
    total: cards.length,
    selectors: VIDEO_CARD_SELECTORS
  });
  
  return cards;
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isPageWithVideoCards,
    getVideoCardCount,
    getAllVideoCards,
    VIDEO_CARD_SELECTORS
  };
}