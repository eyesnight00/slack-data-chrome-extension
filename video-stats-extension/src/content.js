console.log('[Stats Extension] Content script starting...');

// Create and inject the stats container
function createStatsContainer() {
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

// Update the stats display
function updateStatsDisplay(stats) {
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
    document.body.appendChild(container);
  }

  // Add refresh button listener
  document.getElementById('refresh-stats').addEventListener('click', fetchVideoStats);
}

// Show error message
function showError(message) {
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

// Fetch video statistics
async function fetchVideoStats() {
  console.log('[Stats Extension] Fetching video stats for URL:', window.location.href);
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SHEET_DATA',
      url: window.location.href
    });

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
  return window.location.pathname.includes('/videos/');
}

// Initialize when the page loads
function initialize() {
  console.log('[Stats Extension] Initializing on URL:', window.location.href);
  
  if (isVideoPage()) {
    console.log('[Stats Extension] Video page detected, fetching stats');
    fetchVideoStats();
  } else {
    console.log('[Stats Extension] Not a video page, skipping');
  }
}

// Start the extension
initialize();

// Listen for page updates (for single-page applications)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (lastUrl !== currentUrl) {
    console.log('[Stats Extension] URL changed from', lastUrl, 'to', currentUrl);
    lastUrl = currentUrl;
    initialize();
  }
}).observe(document.body, { subtree: true, childList: true }); 