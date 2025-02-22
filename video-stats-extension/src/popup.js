// Format numbers for display
function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// Show/hide loading state
function setLoading(isLoading) {
  document.getElementById('loading').style.display = isLoading ? 'block' : 'none';
  document.getElementById('stats-container').style.display = isLoading ? 'none' : 'block';
  document.getElementById('refresh-btn').disabled = isLoading;
}

// Show error message
function showError(message) {
  const errorElement = document.getElementById('error');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  document.getElementById('stats-container').style.display = 'none';
}

// Update stats display
function updateStats(stats) {
  document.getElementById('views-10-days').textContent = formatNumber(stats.views_10_days || 0);
  document.getElementById('total-views').textContent = formatNumber(stats.views || 0);
  document.getElementById('joins-10-days').textContent = formatNumber(stats.joins_10_days || 0);
  document.getElementById('total-joins').textContent = formatNumber(stats.joins || 0);
  document.getElementById('rating').textContent = `${stats.rating || 'N/A'} (${formatNumber(stats.raters || 0)} raters)`;
  document.getElementById('favorites').textContent = formatNumber(stats.favorites || 0);
  document.getElementById('trial-unlocks').textContent = formatNumber(stats.trial_unlocks || 0);
  document.getElementById('score').textContent = stats.score_model_16 || 'N/A';
  document.getElementById('grade').textContent = stats.grade_model_16 || 'N/A';
}

// Fetch current tab's stats
async function fetchCurrentTabStats() {
  try {
    setLoading(true);
    document.getElementById('error').style.display = 'none';

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Check if we're on a supported video site
    const url = new URL(tab.url);
    const domain = url.hostname.replace('www.', '').replace('members.', '');
    const supportedDomains = [
      'blacked.com', 'tushy.com', 'vixen.com', 'blackedraw.com',
      'tushyraw.com', 'deeper.com', 'milfy.com', 'slayed.com'
    ];

    if (!supportedDomains.includes(domain)) {
      throw new Error('This site is not supported');
    }

    // Check if we're on a video page
    if (!url.pathname.includes('/video/')) {
      throw new Error('This is not a video page');
    }

    // Fetch the stats
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SHEET_DATA',
      url: tab.url
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    updateStats(response.data);
    document.getElementById('stats-container').style.display = 'block';
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

// Toggle between main view and settings
function toggleSettings() {
  const mainContent = document.getElementById('main-content');
  const settings = document.getElementById('settings');
  const isShowingSettings = settings.style.display === 'block';

  mainContent.style.display = isShowingSettings ? 'block' : 'none';
  settings.style.display = isShowingSettings ? 'none' : 'block';

  if (!isShowingSettings) {
    // Load current API key
    chrome.storage.local.get('apiKey', ({ apiKey }) => {
      document.getElementById('api-key').value = apiKey || '';
    });
  }
}

// Save API key
async function saveSettings() {
  const apiKey = document.getElementById('api-key').value.trim();
  
  if (!apiKey) {
    alert('Please enter an API key');
    return;
  }

  try {
    await chrome.storage.local.set({ apiKey });
    alert('Settings saved successfully');
    toggleSettings();
    fetchCurrentTabStats();
  } catch (error) {
    alert('Failed to save settings: ' + error.message);
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  // Check if API key is set
  chrome.storage.local.get('apiKey', ({ apiKey }) => {
    if (!apiKey) {
      toggleSettings();
      showError('Please set your Google Sheets API key in settings');
    } else {
      fetchCurrentTabStats();
    }
  });

  // Add event listeners
  document.getElementById('refresh-btn').addEventListener('click', fetchCurrentTabStats);
  document.getElementById('settings-btn').addEventListener('click', toggleSettings);
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('back-btn').addEventListener('click', toggleSettings);
}); 