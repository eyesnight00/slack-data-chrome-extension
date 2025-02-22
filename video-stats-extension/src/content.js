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

// Function to safely initialize
function safeInitialize() {
  console.log('[Stats Extension] Safe initialize called:', {
    ready_state: document.readyState,
    body_exists: !!document.body,
    head_exists: !!document.head,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    pathname: window.location.pathname
  });

  // Wait for body to be available
  if (!document.body) {
    console.log('[Stats Extension] No body yet, waiting...');
    const observer = new MutationObserver((mutations, obs) => {
      if (document.body) {
        console.log('[Stats Extension] Body now available');
        obs.disconnect();
        initialize();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return;
  }

  initialize();
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

// Initialize the extension
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInitialize);
} else {
  safeInitialize();
}

// Listen for page updates (for single-page applications)
new MutationObserver((mutations) => {
  const newUrl = window.location.href;
  if (currentPageUrl !== newUrl) {
    console.log('[Stats Extension] URL changed from', currentPageUrl, 'to', newUrl);
    currentPageUrl = newUrl;
    safeInitialize();
  }
}).observe(document.documentElement, { 
  subtree: true, 
  childList: true 
});

// Process video cards on the index page
async function processVideoCards() {
  console.log('[Stats Extension] Processing video cards on index page');
  
  // Wait a short moment for dynamic content to load
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find all video cards
  const videoCards = document.querySelectorAll('[data-test-component="VideoThumbnailContainer"]');
  console.log('[Stats Extension] Found video cards:', videoCards.length);

  // Create a batch of URLs to process
  const cardMap = new Map();
  const urls = [];

  for (const card of videoCards) {
    // Find the title link using the href pattern
    const links = Array.from(card.getElementsByTagName('a'));
    const titleLink = links.find(link => link.href && link.href.includes('/videos/'));
    
    if (!titleLink) {
      console.log('[Stats Extension] No title link found for card');
      continue;
    }

    // Get the video URL and add to batch
    const videoUrl = titleLink.href;
    console.log('[Stats Extension] Found video URL:', videoUrl);
    urls.push(videoUrl);
    cardMap.set(videoUrl, card);
  }

  if (urls.length === 0) {
    console.log('[Stats Extension] No valid URLs found in cards');
    return;
  }

  try {
    // Request stats for all videos in batch
    console.log('[Stats Extension] Requesting batch data for URLs:', urls);
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SHEET_DATA',
      urls: urls
    });

    console.log('[Stats Extension] Got batch response:', response);

    if (!response.success) {
      console.error('[Stats Extension] Batch request failed:', response.error);
      return;
    }

    // Process each result
    for (const [url, result] of Object.entries(response.results)) {
      const card = cardMap.get(url);
      if (!card) {
        console.log('[Stats Extension] No card found for URL:', url);
        continue;
      }

      // Create and add grade overlay
      const grade = result.success && result.data ? result.data.grade_model_16 : 'No Data';
      const gradeOverlay = createGradeOverlay(grade, result.success && result.data && result.data.is_future_release);
      
      // Find the thumbnail preview div
      const thumbnailPreview = card.querySelector('[data-test-component="VideoThumbnailPreview"]');
      console.log('[Stats Extension] Processing card:', {
        url: url,
        found_thumbnail: !!thumbnailPreview,
        grade: grade,
        success: result.success,
        error: result.error
      });

      if (thumbnailPreview) {
        // Make sure the container is positioned relatively
        thumbnailPreview.style.position = 'relative';
        
        // Remove any existing overlay
        const existingOverlay = thumbnailPreview.querySelector('.video-grade-overlay');
        if (existingOverlay) {
          existingOverlay.remove();
        }

        // Add the new overlay
        thumbnailPreview.appendChild(gradeOverlay);
        console.log('[Stats Extension] Successfully added grade overlay for:', url);
      } else {
        console.log('[Stats Extension] No thumbnail preview found for card:', {
          url: url,
          cardHTML: card.outerHTML.substring(0, 200) // First 200 chars for brevity
        });
      }
    }
  } catch (error) {
    console.error('[Stats Extension] Error processing video cards:', error);
  }
}

// Create grade overlay element
function createGradeOverlay(grade, isFutureRelease = false) {
  const overlay = document.createElement('div');
  overlay.className = 'video-grade-overlay';
  
  // Style based on grade
  let backgroundColor = 'rgba(0, 0, 0, 0.85)';
  let textColor = 'white';
  
  if (grade === 'No Data') {
    backgroundColor = 'rgba(128, 128, 128, 0.85)';
  } else if (grade === 'Error') {
    backgroundColor = 'rgba(255, 82, 82, 0.85)';
  } else if (grade === 'Unreleased') {
    backgroundColor = 'rgba(33, 150, 243, 0.85)'; // Blue for unreleased
  }

  overlay.innerHTML = grade === 'Unreleased' ? 'Coming Soon' : `Grade: ${grade}`;
  overlay.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: ${backgroundColor};
    color: ${textColor};
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
    processVideoCards,
    safeInitialize,
    fetchVideoStats,
    showError,
    createStatsContainer,
    formatNumber,
    formatDate
  };
} 