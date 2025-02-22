console.log('[Stats Extension] Content script starting... banana');

// Ensure the script runs immediately
initialize();

// Global variables
let currentPageUrl = window.location.href;
const CACHE_PREFIX = 'grade_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Common selectors for video cards and containers
const VIDEO_CARD_SELECTORS = [
  '[data-test-component="VideoThumbnailContainer"]',
  '[data-test-component="VideoThumbnailPreview"]',
  '[data-test-component="ProgressiveImage"]',
  '[data-test-component="VideoCard"]',
  '[data-test-component="VideoCardContainer"]',
  '[data-test-component="PerformerVideoCard"]',
  // Add more general selectors that might be present on homepage
  '[data-test-component="FeaturedVideo"]',
  '[data-test-component="VideoPreview"]',
  '[data-test-component="TrendingVideo"]',
  '[data-test-component="RecommendedVideo"]'
];

// Common container selectors that indicate content is loaded
const CONTENT_CONTAINER_SELECTORS = [
  '[data-test-component="VideoGrid"]',
  '[data-test-component="VideoList"]',
  '[data-test-component="FeaturedVideos"]',
  '[data-test-component="TrendingVideos"]',
  '[data-test-component="RecommendedVideos"]',
  '[data-test-component="HomePage"]',
  '[data-test-component="MainContent"]',
  'main',
  '#root',
  '#app'
];

// Check if we're on the homepage
function isHomePage() {
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(s => s.length > 0);
  
  const debug = {
    type: 'HOME PAGE CHECK',
    pathname,
    segments_before_filter: pathname.split('/'),
    segments_after_filter: segments,
    segment_count: segments.length,
    is_home_page: segments.length === 0 || (segments.length === 1 && segments[0] === '')
  };

  console.log('[Stats Extension] Checking if homepage:', debug);
  return debug.is_home_page;
}

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
 * Gets all video card elements on the page
 * @returns {Array<Element>} Array of video card elements
 */
function getAllVideoCards() {
  const cards = [];
  const details = [];
  
  for (const selector of VIDEO_CARD_SELECTORS) {
    const elements = document.querySelectorAll(selector);
    const selectorResults = Array.from(elements);
    cards.push(...selectorResults);
    
    details.push({
      selector,
      found: selectorResults.length,
      elements: selectorResults.map(el => ({
        tagName: el.tagName,
        classes: Array.from(el.classList),
        hasChildren: el.children.length > 0,
        isVisible: el.offsetParent !== null
      }))
    });
  }
  
  console.log('[Stats Extension] Video card detection details:', {
    total: cards.length,
    selectorResults: details,
    timestamp: new Date().toISOString(),
    documentState: document.readyState
  });
  
  return cards;
}

// Cache helper functions
async function getCachedData(url) {
  const cacheKey = CACHE_PREFIX + btoa(url);
  const result = await chrome.storage.local.get(cacheKey);
  
  if (result[cacheKey]) {
    const cachedData = result[cacheKey];
    // Since grades don't change, we can keep them indefinitely
    console.log('[Stats Extension] Cache hit for URL:', {
      url,
      cached_data: cachedData,
      cache_key: cacheKey
    });
    return cachedData;
  }
  
  console.log('[Stats Extension] Cache miss for URL:', {
    url,
    cache_key: cacheKey
  });
  return null;
}

async function setCachedData(url, data) {
  const cacheKey = CACHE_PREFIX + btoa(url);
  const cacheData = {
    grade: data.grade_model_16,
    score: data.score_model_16,
    timestamp: Date.now(),
    is_future_release: data.is_future_release
  };
  
  await chrome.storage.local.set({ [cacheKey]: cacheData });
  console.log('[Stats Extension] Cached data for URL:', {
    url,
    cache_key: cacheKey,
    cache_data: cacheData
  });
}

// Batch cache operations
async function batchGetCachedData(urls) {
  const cacheKeys = urls.map(url => CACHE_PREFIX + btoa(url));
  const result = await chrome.storage.local.get(cacheKeys);
  
  const cacheHits = new Map();
  const cacheMisses = [];
  
  urls.forEach((url, index) => {
    const cacheKey = cacheKeys[index];
    if (result[cacheKey]) {
      cacheHits.set(url, result[cacheKey]);
    } else {
      cacheMisses.push(url);
    }
  });
  
  console.log('[Stats Extension] Batch cache results:', {
    total_urls: urls.length,
    cache_hits: cacheHits.size,
    cache_misses: cacheMisses.length
  });
  
  return { cacheHits, cacheMisses };
}

async function batchSetCachedData(results) {
  const cacheData = {};
  
  for (const [url, result] of Object.entries(results)) {
    if (result.success && result.data) {
      const cacheKey = CACHE_PREFIX + btoa(url);
      cacheData[cacheKey] = {
        grade: result.data.grade_model_16,
        score: result.data.score_model_16,
        timestamp: Date.now(),
        is_future_release: result.data.is_future_release
      };
    }
  }
  
  if (Object.keys(cacheData).length > 0) {
    await chrome.storage.local.set(cacheData);
    console.log('[Stats Extension] Batch cached data:', {
      urls_cached: Object.keys(cacheData).length,
      cache_keys: Object.keys(cacheData)
    });
  }
}

// Create and inject the stats container
function createStatsContainer() {
  console.log('[Stats Extension] Creating stats container');
  const container = document.createElement('div');
  container.id = 'video-stats-container';
  container.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background: rgba(0, 0, 0, 0.8) !important;
    color: white !important;
    padding: 15px !important;
    border-radius: 8px !important;
    z-index: 2147483647 !important;
    font-family: Arial, sans-serif !important;
    min-width: 300px !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
  `;
  return container;
}

// Format numbers for display
function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// Format date for display
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Show error message
function showError(message) {
  console.log('[Stats Extension] Showing error:', message);
  const container = document.getElementById('video-stats-container') || createStatsContainer();
  container.innerHTML = `
    <div style="color: #ff5252; padding: 10px; text-align: center;">
      <p style="margin: 0 0 10px 0;">${message}</p>
      <button id="refresh-stats" style="
        padding: 5px 10px;
        background: #4CAF50;
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        font-size: 12px;
      ">Try Again</button>
    </div>
  `;

  if (!document.getElementById('video-stats-container')) {
    document.body.appendChild(container);
  }

  document.getElementById('refresh-stats').addEventListener('click', fetchVideoStats);
}

// Update the stats display
function updateStatsDisplay(stats) {
  console.log('[Stats Extension] Updating stats display:', stats);
  const container = document.getElementById('video-stats-container') || createStatsContainer();
  
  // Create the content
  container.innerHTML = `
    <div style="margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">
      <h3 style="margin: 0 0 5px 0; font-size: 16px;">${stats.title}</h3>
      <p style="margin: 0; font-size: 12px; color: #aaa;">
        Released: ${stats.is_future_release ? 'Coming Soon - ' : ''}${formatDate(stats.release_date)}<br>
        Director: ${stats.director}<br>
        Models: ${stats.models}
      </p>
    </div>
    
    <div style="font-size: 14px;">
      ${stats.is_future_release ? `
        <div style="text-align: center; padding: 20px; color: #2196F3;">
          <h4 style="margin: 0;">Coming Soon</h4>
          <p style="margin: 10px 0 0 0;">Stats will be available after release</p>
        </div>
      ` : `
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #4CAF50;">Last 10 Days</h4>
          <p style="margin: 3px 0;">Views: ${formatNumber(stats.views_10_days)}</p>
          <p style="margin: 3px 0;">Minutes Watched: ${formatNumber(stats.minutes_watched_10_days)}</p>
          <p style="margin: 3px 0;">Joins: ${formatNumber(stats.joins_10_days)}</p>
        </div>

        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #4CAF50;">All Time</h4>
          <p style="margin: 3px 0;">Views: ${formatNumber(stats.views)}</p>
          <p style="margin: 3px 0;">Minutes Watched: ${formatNumber(stats.minutes_watched)}</p>
          <p style="margin: 3px 0;">Joins: ${formatNumber(stats.joins)}</p>
          <p style="margin: 3px 0;">Comments: ${formatNumber(stats.comments)}</p>
          <p style="margin: 3px 0;">Rating: ${stats.rating} (${formatNumber(stats.raters)} raters)</p>
          <p style="margin: 3px 0;">Favorites: ${formatNumber(stats.favorites)}</p>
          <p style="margin: 3px 0;">Trial Unlocks: ${formatNumber(stats.trial_unlocks)}</p>
        </div>

        <div style="margin-bottom: 10px;">
          <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #4CAF50;">Performance</h4>
          <p style="margin: 3px 0;">Score: ${stats.score_model_16}</p>
          <p style="margin: 3px 0;">Grade: ${stats.grade_model_16}</p>
        </div>
      `}
    </div>

    <button id="refresh-stats" style="
      margin-top: 10px;
      padding: 5px 10px;
      background: #4CAF50;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      width: 100%;
      font-size: 12px;
    ">Refresh Stats</button>
  `;

  // Add to page if not already present
  if (!document.getElementById('video-stats-container')) {
    console.log('[Stats Extension] Adding stats container to page');
    document.body.appendChild(container);
  }

  // Add refresh button listener
  document.getElementById('refresh-stats').addEventListener('click', fetchVideoStats);
}

// Fetch video statistics
async function fetchVideoStats() {
  console.log('[Stats Extension] Fetching video stats for URL:', window.location.href);
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SHEET_DATA',
      url: window.location.href
    });

    console.log('[Stats Extension] Received response:', response);

    if (response.success) {
      console.log('[Stats Extension] Successfully fetched stats:', response.data);
      updateStatsDisplay(response.data);
    } else {
      console.error('[Stats Extension] Failed to fetch stats:', response.error);
      showError(response.error || 'Failed to load statistics. Please try again.');
    }
  } catch (error) {
    console.error('[Stats Extension] Error fetching stats:', error);
    showError('Failed to load statistics. Please try again.');
  }
}

// Check if we're on a video page
function isVideoPage() {
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(s => s.length > 0);
  
  const debug = {
    type: 'VIDEO PAGE CHECK',
    pathname,
    segments_before_filter: pathname.split('/'),
    segments_after_filter: segments,
    segment_count: segments.length,
    first_segment: segments.length > 0 ? segments[0].toLowerCase() : 'none',
    second_segment: segments.length > 1 ? segments[1] : 'none',
    is_video_page: false,
    reason: ''
  };

  // Check if we have exactly two segments and first is "videos"
  const isValid = segments.length === 2 && 
                 segments[0].toLowerCase() === 'videos' && 
                 segments[1] !== 'category';  // Exclude category pages

  debug.is_video_page = isValid;
  debug.reason = isValid ? 
    'Matches video page pattern: exactly two segments with first being "videos"' :
    'Does not match video page pattern: ' + (
      segments.length !== 2 ? 'wrong number of segments' :
      segments[0].toLowerCase() !== 'videos' ? 'first segment not "videos"' :
      'is a category page'
    );

  console.log('[Stats Extension] Checking page type:', debug);
  return isValid;
}

// Check if we're on an index page
function isIndexPage() {
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(s => s.length > 0);
  const fullUrl = window.location.href;
  
  const debug = {
    type: 'INDEX PAGE CHECK',
    pathname,
    full_url: fullUrl,
    segments_before_filter: pathname.split('/'),
    segments_after_filter: segments,
    segment_count: segments.length,
    first_segment: segments.length > 0 ? segments[0].toLowerCase() : 'none',
    has_query: window.location.search.length > 0,
    is_index_page: false,
    reason: ''
  };

  // Check if we have exactly one segment and it is "videos"
  const isValid = segments.length === 1 && segments[0].toLowerCase() === 'videos';

  debug.is_index_page = isValid;
  debug.reason = isValid ?
    'Matches index page pattern: exactly one segment "videos"' :
    'Does not match index page pattern: ' + (
      segments.length !== 1 ? 'wrong number of segments' :
      'first segment not "videos"'
    );

  console.log('[Stats Extension] Checking page type:', debug);
  return isValid;
}

// Initialize when the page loads
function initialize() {
  console.log('[Stats Extension] Initializing extension...', {
    url: window.location.href,
    pathname: window.location.pathname,
    documentReady: document.readyState,
    bodyExists: !!document.body,
    headExists: !!document.head,
    timestamp: new Date().toISOString()
  });

  // Handle different document ready states
  if (document.readyState === 'loading') {
    console.log('[Stats Extension] Document still loading, adding load event listener');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[Stats Extension] DOMContentLoaded fired, proceeding with initialization');
      initializeAfterLoad();
    });
  } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('[Stats Extension] Document already interactive/complete, proceeding with initialization');
    initializeAfterLoad();
  }

  // Add a fallback to ensure initialization happens
  window.addEventListener('load', () => {
    console.log('[Stats Extension] Window load event fired, ensuring initialization');
    initializeAfterLoad();
  });
}

// Add intersection observer to detect when new content comes into view
function setupIntersectionObserver() {
  console.log('[Stats Extension] Setting up intersection observer for infinite scroll');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        console.log('[Stats Extension] New content scrolled into view, checking for unprocessed cards');
        processVideoCards();
      }
    });
  }, {
    rootMargin: '50px' // Start loading slightly before content comes into view
  });

  // Observe all video grid containers
  function observeContainers() {
    const containers = document.querySelectorAll([
      '[data-test-component="VideoGrid"]',
      '[data-test-component="VideoList"]',
      '[data-test-component="InfiniteScroll"]',
      '[data-test-component="HomePage"]'
    ].join(','));

    containers.forEach(container => {
      observer.observe(container);
      console.log('[Stats Extension] Observing container for scroll:', container);
    });
  }

  // Initial observation
  observeContainers();

  // Set up mutation observer to watch for new containers
  const containerObserver = new MutationObserver(debounce(() => {
    observeContainers();
  }, 1000));

  containerObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function initializeAfterLoad() {
  console.log('[Stats Extension] Starting initialization after document load', {
    url: window.location.href,
    isHomePage: isHomePage(),
    isVideoPage: isVideoPage(),
    isIndexPage: isIndexPage(),
    documentState: document.readyState
  });
  
  // Clean up any existing overlays before initializing
  cleanupOverlays();
  
  // Special handling for video detail pages
  if (isVideoPage()) {
    console.log('[Stats Extension] Video detail page detected, fetching stats');
    fetchVideoStats();
    return;
  }
  
  // For homepage and other pages with video cards
  if (isHomePage() || isIndexPage()) {
    console.log('[Stats Extension] Homepage or index page detected, starting content detection');
    // Start both content detection processes
    startContentDetection();
    setupIntersectionObserver();
    
    // Immediate check for video cards
    const cards = getAllVideoCards();
    if (cards.length > 0) {
      console.log('[Stats Extension] Found video cards immediately, processing');
      processVideoCards();
    }
    
    // Set up a backup check in case the initial check misses some cards
    setTimeout(() => {
      const delayedCards = getAllVideoCards();
      if (delayedCards.length > cards.length) {
        console.log('[Stats Extension] Found additional cards in delayed check', {
          initialCount: cards.length,
          newCount: delayedCards.length
        });
        processVideoCards();
      }
    }, 2000);
  }
}

async function startContentDetection() {
  console.log('[Stats Extension] Starting content detection process');
  
  let retryCount = 0;
  const maxRetries = 20; // Increase max retries
  const retryInterval = 500; // Decrease interval for more frequent checks

  async function checkForContent() {
    console.log('[Stats Extension] Content detection attempt', {
      attempt: retryCount + 1,
      maxRetries,
      documentState: document.readyState,
      url: window.location.href
    });

    // First check for main content containers
    let contentFound = false;
    for (const selector of CONTENT_CONTAINER_SELECTORS) {
      const container = document.querySelector(selector);
      if (container) {
        console.log('[Stats Extension] Found content container:', {
          selector,
          elementId: container.id,
          elementClasses: Array.from(container.classList)
        });
        contentFound = true;
        break;
      }
    }

    // Then check for video cards
    const cards = getAllVideoCards();
    
    if (cards.length > 0) {
      console.log('[Stats Extension] Found video cards, processing');
      processGlobalVideoCards();
      return;
    }
    
    if (contentFound) {
      console.log('[Stats Extension] Content container found but no cards yet, continuing to monitor');
      // Set up mutation observer to watch for cards being added
      setupContentObserver();
      return;
    }

    if (retryCount < maxRetries) {
      retryCount++;
      console.log('[Stats Extension] No content found, retrying', {
        nextAttempt: retryCount + 1,
        delayMs: retryInterval
      });
      setTimeout(checkForContent, retryInterval);
    } else {
      console.log('[Stats Extension] Content detection failed after all retries');
    }
  }

  // Start the detection process
  checkForContent();
}

function setupContentObserver() {
  console.log('[Stats Extension] Setting up content observer for infinite scroll');
  
  let processingNodes = false;
  const observer = new MutationObserver(async (mutations) => {
    // Don't process if we're already processing
    if (processingNodes) {
      console.log('[Stats Extension] Already processing nodes, skipping this batch');
      return;
    }

    processingNodes = true;
    console.log('[Stats Extension] Processing mutation batch:', {
      mutationCount: mutations.length,
      timestamp: new Date().toISOString()
    });

    try {
      let newCards = false;
      let processedNodes = new Set();

      for (const mutation of mutations) {
        // Skip if we've already processed this node
        if (processedNodes.has(mutation.target)) continue;
        processedNodes.add(mutation.target);

        // Check added nodes and their children for video cards
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== 1) continue; // Skip non-element nodes

            // Check if the node itself is a video card
            if (VIDEO_CARD_SELECTORS.some(selector => node.matches && node.matches(selector))) {
              newCards = true;
              break;
            }

            // Check children for video cards
            if (node.querySelectorAll) {
              for (const selector of VIDEO_CARD_SELECTORS) {
                const cards = node.querySelectorAll(selector);
                if (cards.length > 0) {
                  newCards = true;
                  break;
                }
              }
            }

            if (newCards) break;
          }
        }

        if (newCards) break;
      }

      if (newCards) {
        console.log('[Stats Extension] New video cards detected in mutation, processing');
        await processVideoCards();
      }
    } finally {
      processingNodes = false;
    }
  });

  // Observe the entire document for changes
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: false, // Don't need attribute changes
    characterData: false // Don't need text changes
  });
  
  console.log('[Stats Extension] Infinite scroll observer setup complete');
}

// Add styles for grade overlays
const style = document.createElement('style');
style.textContent = `
  .video-grade-overlay {
    opacity: 0.9;
    transition: opacity 0.2s ease;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  .video-grade-overlay:hover {
    opacity: 1;
  }
  [data-test-component="ProgressiveImage"] {
    position: relative;
  }
`;

// Add styles when head is available
if (document.head) {
  document.head.appendChild(style);
} else {
  // If head isn't available yet, wait for it
  const observer = new MutationObserver((mutations, obs) => {
    if (document.head) {
      document.head.appendChild(style);
      obs.disconnect();
    }
  });
  observer.observe(document.documentElement, { childList: true });
}

// Function to cleanup overlays
function cleanupOverlays() {
  console.log('[Stats Extension] Cleaning up overlays');
  
  // Remove video page stats overlay
  const statsContainer = document.getElementById('video-stats-container');
  if (statsContainer) {
    console.log('[Stats Extension] Removing stats container');
    statsContainer.remove();
  }

  // Only remove grade overlays if we're on a video page
  if (isVideoPage()) {
    console.log('[Stats Extension] Removing grade overlays on video page');
    document.querySelectorAll('.video-grade-overlay').forEach(overlay => {
      overlay.remove();
    });
  }
}

// Listen for page updates (for single-page applications)
let navigationTimeout = null;
new MutationObserver((mutations) => {
  const newUrl = window.location.href;
  if (currentPageUrl !== newUrl) {
    console.log('[Stats Extension] URL changed from', currentPageUrl, 'to', newUrl);
    currentPageUrl = newUrl;
    
    // Clear any pending navigation timeout
    if (navigationTimeout) {
      clearTimeout(navigationTimeout);
    }
    
    // Wait a short moment for the page to settle after navigation
    navigationTimeout = setTimeout(() => {
      cleanupOverlays();
      initialize();
    }, 500);
  }
}).observe(document.documentElement, { 
  subtree: true, 
  childList: true 
});

// Modify processGlobalVideoCards to be more verbose
async function processGlobalVideoCards() {
  console.log('[Stats Extension] Starting global video card processing');
  
  // Initial delay to allow for dynamic content
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('[Stats Extension] Initial delay complete, proceeding with card detection');
  
  // Set up mutation observer for dynamic content
  const contentObserver = new MutationObserver(debounce(async (mutations) => {
    let newCards = false;
    let newCardCount = 0;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check both added nodes and their children for video cards
        const addedNodes = Array.from(mutation.addedNodes);
        const cards = addedNodes.filter(node => {
          if (node.nodeType !== 1) return false; // Only element nodes
          
          // Check if the node itself is a video card
          if (VIDEO_CARD_SELECTORS.some(selector => node.matches && node.matches(selector))) {
            newCardCount++;
            return true;
          }
          
          // Check if the node contains video cards
          if (node.querySelectorAll) {
            for (const selector of VIDEO_CARD_SELECTORS) {
              const foundCards = node.querySelectorAll(selector);
              if (foundCards.length > 0) {
                newCardCount += foundCards.length;
                return true;
              }
            }
          }
          
          return false;
        });
          
        if (cards.length > 0) {
          newCards = true;
          console.log('[Stats Extension] New video cards detected:', newCardCount);
        }
      }
    }
    
    if (newCards) {
      console.log('[Stats Extension] Processing newly detected cards');
      await processVideoCards();
    }
  }, 500)); // Debounce for 500ms

  // Start observing the document with the configured parameters
  contentObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('[Stats Extension] Set up mutation observer for dynamic content');
  
  // Initial processing of cards
  await processVideoCards();
}

// Debounce helper function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Modify processVideoCards to use batch caching
async function processVideoCards() {
  const startTime = performance.now();
  const videoCards = getAllVideoCards();
  console.log('[Stats Extension] Processing video cards:', {
    cardCount: videoCards.length,
    timestamp: new Date().toISOString()
  });

  const cardMap = new Map();
  const urlsToProcess = [];
  let processedCount = 0;

  // Collect all URLs first
  for (const card of videoCards) {
    // Skip if already processed
    if (card.hasAttribute('data-stats-processed')) {
      processedCount++;
      continue;
    }

    // Skip if already has overlay
    if (card.querySelector('.video-grade-overlay')) {
      processedCount++;
      continue;
    }

    const videoUrl = await extractVideoUrl(card);
    if (videoUrl) {
      urlsToProcess.push(videoUrl);
      cardMap.set(videoUrl, card);
      // Mark as processed
      card.setAttribute('data-stats-processed', 'true');
    }
  }

  console.log('[Stats Extension] URL collection complete:', {
    totalCards: videoCards.length,
    alreadyProcessed: processedCount,
    newUrlsToProcess: urlsToProcess.length,
    timeElapsed: performance.now() - startTime
  });

  if (urlsToProcess.length === 0) {
    console.log('[Stats Extension] No new cards to process');
    return;
  }

  // Check cache in batch
  const { cacheHits, cacheMisses } = await batchGetCachedData(urlsToProcess);

  // Process cache hits immediately
  for (const [url, data] of cacheHits) {
    const card = cardMap.get(url);
    if (card) {
      const gradeOverlay = createGradeOverlay(data.grade, data.is_future_release);
      await addOverlayToCard(card, gradeOverlay);
    }
  }

  // Fetch only uncached URLs
  if (cacheMisses.length > 0) {
    try {
      console.log('[Stats Extension] Requesting batch data for uncached URLs:', {
        count: cacheMisses.length,
        urls: cacheMisses
      });

      const response = await chrome.runtime.sendMessage({
        type: 'GET_SHEET_DATA',
        urls: cacheMisses
      });

      if (response.success) {
        // Cache all results
        await batchSetCachedData(response.results);

        // Process results
        for (const [url, result] of Object.entries(response.results)) {
          const card = cardMap.get(url);
          if (!card) continue;

          const grade = result.success && result.data ? result.data.grade_model_16 : 'No Data';
          const isFutureRelease = result.success && result.data && result.data.is_future_release;
          
          const gradeOverlay = createGradeOverlay(grade, isFutureRelease);
          await addOverlayToCard(card, gradeOverlay);
        }
      }
    } catch (error) {
      console.error('[Stats Extension] Error processing uncached cards:', error);
    }
  }

  console.log('[Stats Extension] Card processing complete:', {
    totalTime: performance.now() - startTime,
    processedUrls: urlsToProcess.length,
    cacheHits: cacheHits.size,
    cacheMisses: cacheMisses.length
  });
}

// Helper function to extract video URL from card
async function extractVideoUrl(card) {
  // Try different methods to find the video URL
  let videoUrl = null;
  let titleLink = null;

  // Method 1: Direct video link
  const links = Array.from(card.getElementsByTagName('a'));
  titleLink = links.find(link => link.href && link.href.includes('/videos/'));

  // Method 2: Check parent elements for video link
  if (!titleLink) {
    const parentLinks = Array.from(card.closest('a') || []);
    if (parentLinks.length > 0 && parentLinks[0].href && parentLinks[0].href.includes('/videos/')) {
      titleLink = parentLinks[0];
    }
  }

  // Method 3: Look for data attributes
  if (!titleLink) {
    const dataUrl = card.getAttribute('data-video-url') || 
                   card.getAttribute('data-href') || 
                   card.getAttribute('data-link');
    if (dataUrl && dataUrl.includes('/videos/')) {
      videoUrl = new URL(dataUrl, window.location.origin).href;
    }
  }

  // Method 4: Search in parent containers
  if (!titleLink && !videoUrl) {
    const container = card.closest('[data-video-url], [data-href], [data-link]');
    if (container) {
      const dataUrl = container.getAttribute('data-video-url') || 
                     container.getAttribute('data-href') || 
                     container.getAttribute('data-link');
      if (dataUrl && dataUrl.includes('/videos/')) {
        videoUrl = new URL(dataUrl, window.location.origin).href;
      }
    }
  }

  if (titleLink) {
    videoUrl = titleLink.href;
  }

  if (!videoUrl) {
    console.log('[Stats Extension] No video URL found for card:', {
      cardHTML: card.outerHTML.substring(0, 200),
      parentHTML: card.parentElement ? card.parentElement.outerHTML.substring(0, 200) : 'no parent',
      dataAttrs: {
        videoUrl: card.getAttribute('data-video-url'),
        href: card.getAttribute('data-href'),
        link: card.getAttribute('data-link')
      },
      foundLinks: links.map(l => l.href)
    });
    return null;
  }

  console.log('[Stats Extension] Found video URL:', videoUrl);
  return videoUrl;
}

// Helper function to add overlay to card
async function addOverlayToCard(card, gradeOverlay) {
  // Find the thumbnail preview div
  const thumbnailPreview = card.querySelector('[data-test-component="VideoThumbnailPreview"]');
  if (!thumbnailPreview) {
    console.log('[Stats Extension] No thumbnail preview found for card:', {
      cardHTML: card.outerHTML.substring(0, 200) // First 200 chars for brevity
    });
    
    // Try alternative selector
    const altThumbnail = card.querySelector('[data-test-component="ProgressiveImage"]');
    if (altThumbnail) {
      console.log('[Stats Extension] Found alternative thumbnail container');
      altThumbnail.style.position = 'relative';
      
      // Remove any existing overlay
      const existingOverlay = altThumbnail.querySelector('.video-grade-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // Add the new overlay
      altThumbnail.appendChild(gradeOverlay);
      console.log('[Stats Extension] Successfully added grade overlay to alternative container:', {
        backgroundColor: gradeOverlay.style.background,
        textColor: gradeOverlay.style.color
      });
      return;
    }
    return;
  }

  console.log('[Stats Extension] Found thumbnail preview, applying styles');
  // Make sure the container is positioned relatively
  thumbnailPreview.style.position = 'relative';
  
  // Remove any existing overlay
  const existingOverlay = thumbnailPreview.querySelector('.video-grade-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Add the new overlay
  thumbnailPreview.appendChild(gradeOverlay);
  console.log('[Stats Extension] Successfully added grade overlay:', {
    backgroundColor: gradeOverlay.style.background,
    textColor: gradeOverlay.style.color
  });
}

// Create grade overlay element
function createGradeOverlay(grade, isFutureRelease = false) {
  const overlay = document.createElement('div');
  overlay.className = 'video-grade-overlay';
  
  // Style based on grade
  let backgroundColor = 'rgba(0, 0, 0, 0.85)';
  let textColor = 'white';
  
  // Trim the grade to remove any extra spaces
  const cleanGrade = grade ? grade.trim() : grade;
  
  if (isFutureRelease) {
    backgroundColor = 'rgba(33, 150, 243, 0.85)'; // Blue for unreleased
  } else if (cleanGrade === 'No Data') {
    backgroundColor = 'rgba(128, 128, 128, 0.85)';
  } else if (cleanGrade === 'Error') {
    backgroundColor = 'rgba(255, 82, 82, 0.85)';
  } else {
    // Color coding for grades
    switch (cleanGrade) {
      case 'A':
        backgroundColor = 'rgba(46, 125, 50, 0.85)'; // Darker, more vibrant green
        break;
      case 'B':
        backgroundColor = 'rgba(156, 204, 101, 0.85)'; // Lighter, more distinct green
        break;
      case 'C':
        backgroundColor = 'rgba(255, 193, 7, 0.85)'; // Yellow
        textColor = '#000'; // Dark text for better contrast
        break;
      case 'D':
        backgroundColor = 'rgba(255, 152, 0, 0.85)'; // Orange
        break;
      case 'E':
      case 'F':
        backgroundColor = 'rgba(244, 67, 54, 0.85)'; // Red
        break;
      default:
        console.log('[Stats Extension] Unhandled grade value:', {
          original: grade,
          cleaned: cleanGrade
        });
        break;
    }
  }

  console.log('[Stats Extension] Creating overlay with styles:', {
    originalGrade: grade,
    cleanedGrade: cleanGrade,
    isFutureRelease,
    backgroundColor,
    textColor
  });

  overlay.innerHTML = cleanGrade === 'Unreleased' ? 'Coming Soon' : `Grade: ${cleanGrade}`;
  overlay.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: ${backgroundColor} !important;
    color: ${textColor} !important;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    z-index: 2147483647;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    font-family: Arial, sans-serif;
    letter-spacing: 0.5px;
  `;
  return overlay;
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isVideoPage,
    isIndexPage,
    initialize,
    processGlobalVideoCards,
    safeInitialize,
    fetchVideoStats,
    showError,
    createStatsContainer,
    formatNumber,
    formatDate
  };
} 