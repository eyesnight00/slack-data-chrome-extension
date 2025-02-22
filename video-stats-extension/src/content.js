console.log('[Stats Extension] Content script starting... banana');

// Global variables
let currentPageUrl = window.location.href;

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
        Released: ${formatDate(stats.release_date)}<br>
        Director: ${stats.director}<br>
        Models: ${stats.models}
      </p>
    </div>
    
    <div style="font-size: 14px;">
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
  const segments = pathname.split('/').filter(Boolean);
  const isVideo = segments.length === 2 && segments[0] === 'videos';
  
  console.log('[Stats Extension] Checking page type:', {
    type: 'VIDEO PAGE CHECK',
    pathname: pathname,
    segments_before_filter: pathname.split('/'),
    segments_after_filter: segments,
    segment_count: segments.length,
    first_segment: segments[0] || 'none',
    second_segment: segments[1] || 'none',
    is_video_page: isVideo,
    reason: isVideo ? 
      'Matches video page pattern: exactly two segments with first being "videos"' :
      `Does not match video page pattern: ${segments.length !== 2 ? 'wrong number of segments' : 'first segment not "videos"'}`
  });
  
  return isVideo;
}

// Check if we're on an index page
function isIndexPage() {
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const isIndex = segments.length === 1 && segments[0] === 'videos';
  
  console.log('[Stats Extension] Checking page type:', {
    type: 'INDEX PAGE CHECK',
    pathname: pathname,
    segments_before_filter: pathname.split('/'),
    segments_after_filter: segments,
    segment_count: segments.length,
    first_segment: segments[0] || 'none',
    is_index_page: isIndex,
    reason: isIndex ? 
      'Matches index page pattern: exactly one segment "videos"' :
      `Does not match index page pattern: ${segments.length !== 1 ? 'wrong number of segments' : 'first segment not "videos"'}`
  });
  
  return isIndex;
}

// Initialize when the page loads
function initialize() {
  console.log('[Stats Extension] Initializing on URL:', window.location.href);
  
  if (isVideoPage()) {
    console.log('[Stats Extension] Video page detected, fetching stats');
    fetchVideoStats();
  } else if (isIndexPage()) {
    console.log('[Stats Extension] Index page detected, processing video cards');
    processVideoCards();
  } else {
    console.log('[Stats Extension] Not a supported page type (not an index or video page)');
  }
}

// Start the extension
initialize();

// Listen for page updates (for single-page applications)
new MutationObserver(() => {
  const newUrl = window.location.href;
  if (currentPageUrl !== newUrl) {
    console.log('[Stats Extension] URL changed from', currentPageUrl, 'to', newUrl);
    currentPageUrl = newUrl;
    initialize();
  }
}).observe(document.body, { subtree: true, childList: true });

// Create grade overlay element
function createGradeOverlay(grade) {
  const overlay = document.createElement('div');
  overlay.className = 'video-grade-overlay';
  overlay.innerHTML = grade;
  overlay.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    z-index: 100;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  return overlay;
}

// Process all video cards on the page
async function processVideoCards() {
  console.log('[Stats Extension] Processing video cards on index page');
  
  // Find all video cards using the specific data-test-component attribute
  const videoCards = Array.from(document.querySelectorAll('[data-test-component="VideoThumbnailContainer"]'));
  
  if (videoCards.length === 0) {
    console.log('[Stats Extension] No video cards found');
    return;
  }

  // Extract URLs and create a map of URL to card element
  const cardMap = new Map();
  const urls = [];
  
  for (const card of videoCards) {
    // Find the link using the specific class and href pattern
    const link = card.querySelector('a[href^="/videos/"]');
    if (link) {
      // Construct the full URL using the current domain
      const fullUrl = `${window.location.origin}${link.getAttribute('href')}`;
      urls.push(fullUrl);
      cardMap.set(fullUrl, card);
    }
  }

  if (urls.length === 0) {
    console.log('[Stats Extension] No valid video URLs found');
    return;
  }

  console.log('[Stats Extension] Found video URLs:', urls);

  // Fetch data for all URLs in a single batch request
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SHEET_DATA',
      urls: urls
    });

    if (!response.success) {
      console.error('[Stats Extension] Batch request failed:', response.error);
      return;
    }

    // Process results for each card
    for (const [url, result] of Object.entries(response.results)) {
      const card = cardMap.get(url);
      if (!card) continue;

      if (result.success && result.data) {
        // Find the ProgressiveImage container which holds the thumbnail
        const imageContainer = card.querySelector('[data-test-component="ProgressiveImage"]');
        if (!imageContainer) continue;

        // Add position: relative to the container if needed
        if (getComputedStyle(imageContainer).position === 'static') {
          imageContainer.style.position = 'relative';
        }

        // Create and add the grade overlay
        const grade = result.data.grade_model_16 || 'N/A';
        const gradeOverlay = createGradeOverlay(grade);
        
        // Remove any existing overlay
        const existingOverlay = imageContainer.querySelector('.video-grade-overlay');
        if (existingOverlay) {
          existingOverlay.remove();
        }

        imageContainer.appendChild(gradeOverlay);
      } else {
        console.log(`[Stats Extension] No data for video: ${url}`, result.error);
      }
    }
  } catch (error) {
    console.error('[Stats Extension] Error processing video cards:', error);
  }
}

// Function to safely initialize
function safeInitialize() {
  console.log('[Stats Extension] Safe initialize called:', {
    ready_state: document.readyState,
    body_exists: !!document.body,
    head_exists: !!document.head,
    timestamp: new Date().toISOString()
  });
  
  if (document.readyState === 'loading') {
    console.log('[Stats Extension] Document still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[Stats Extension] DOMContentLoaded fired, initializing');
      initialize();
    });
  } else {
    console.log('[Stats Extension] Document already loaded, initializing immediately');
    initialize();
  }
}

// Also listen for load event
window.addEventListener('load', () => {
  console.log('[Stats Extension] Window load event fired, reinitializing');
  initialize();
});

// Listen for page updates (for single-page applications)
let lastUrl = window.location.href;
const observer = new MutationObserver((mutations) => {
  const currentUrl = window.location.href;
  if (lastUrl !== currentUrl) {
    console.log('[Stats Extension] URL changed from', lastUrl, 'to', currentUrl);
    lastUrl = currentUrl;
    // Add a small delay when URL changes to ensure page updates
    setTimeout(() => {
      initialize();
    }, 500);
  }
});

// Also observe for new video cards being added (infinite scroll)
const cardObserver = new MutationObserver((mutations) => {
  const newCards = new Set();
  
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Use the same selector as in processVideoCards
        const cards = node.querySelectorAll('[data-test-component="VideoThumbnailContainer"]');
        cards.forEach(card => newCards.add(card));
      }
    }
  }

  if (newCards.size > 0) {
    console.log('[Stats Extension] Found new video cards:', newCards.size);
    // Extract URLs and create a map of URL to card element
    const cardMap = new Map();
    const urls = [];
    for (const card of newCards) {
      const link = card.querySelector('a[href^="/videos/"]');
      if (link) {
        const fullUrl = `${window.location.origin}${link.getAttribute('href')}`;
        urls.push(fullUrl);
        cardMap.set(fullUrl, card);
      }
    }

    if (urls.length === 0) {
      console.log('[Stats Extension] No valid URLs found in new cards');
      return;
    }

    console.log('[Stats Extension] Processing new URLs:', urls);

    // Fetch data for all new cards in a batch
    chrome.runtime.sendMessage({
      type: 'GET_SHEET_DATA',
      urls: urls
    }).then(response => {
      if (!response.success) {
        console.error('[Stats Extension] Batch request failed for new cards:', response.error);
        return;
      }

      // Process results for each new card
      for (const [url, result] of Object.entries(response.results)) {
        const card = cardMap.get(url);
        if (!card) continue;

        if (result.success && result.data) {
          const imageContainer = card.querySelector('[data-test-component="ProgressiveImage"]');
          if (!imageContainer) continue;

          if (getComputedStyle(imageContainer).position === 'static') {
            imageContainer.style.position = 'relative';
          }

          // Remove any existing overlay
          const existingOverlay = imageContainer.querySelector('.video-grade-overlay');
          if (existingOverlay) {
            existingOverlay.remove();
          }

          const gradeOverlay = createGradeOverlay(result.data.grade_model_16 || 'N/A');
          imageContainer.appendChild(gradeOverlay);
        }
      }
    }).catch(error => {
      console.error('[Stats Extension] Error processing new cards:', error);
    });
  }
});

// Start observers
observer.observe(document.body, { subtree: true, childList: true });
cardObserver.observe(document.body, { subtree: true, childList: true });

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
document.head.appendChild(style); 
document.head.appendChild(style); 
document.head.appendChild(style); 
document.head.appendChild(style); 