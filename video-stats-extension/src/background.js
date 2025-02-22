// Site to Google Sheets tab mapping
const SITE_MAPPINGS = {
  'blacked.com': 'blacked',
  'tushy.com': 'tushy',
  'vixen.com': 'vixen',
  'blackedraw.com': 'blackedraw',
  'tushyraw.com': 'tushyraw',
  'deeper.com': 'deeper',
  'milfy.com': 'milfy',
  'slayed.com': 'slayed',
  'vixenplus.com': 'all'
};

// All possible sheets to search for vixenplus.com
const ALL_SHEETS = ['blacked', 'tushy', 'vixen', 'blackedraw', 'tushyraw', 'deeper', 'milfy', 'slayed'];

const SPREADSHEET_ID = '1mZmAI_yKHmuUZfUHTgHp_ksJNn9hKWaf2HwvMIcQviM';
const API_KEY = 'AIzaSyBlwxAsK0VK1YKn8QeNpotriJbejVzkvR4';

// Column indices for different stats
const COLUMN_INDICES = {
  CONTENT_ID: 0,
  SITE: 1,
  TITLE: 2,
  DIRECTOR: 3,
  MODELS_F: 4,
  MODELS_M: 5,
  MODELS: 6,
  RELEASE_DATE: 7,
  RELEASE_YEAR: 8,
  URL: 9,
  MINUTES_WATCHED_10_DAYS: 10,
  VIEWS_10_DAYS: 11,
  MINUTES_WATCHED: 12,
  VIEWS: 13,
  MINUTES_WATCHED_RECOMMENDATION: 14,
  JOINS_10_DAYS: 15,
  JOINS: 16,
  COMMENTS: 17,
  RATERS: 18,
  RATING: 19,
  FAVORITES: 20,
  TRIAL_UNLOCKS: 21,
  SCORE_MODEL_16: 27,
  GRADE_MODEL_16: 33
};

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Store site mappings and API key
    await chrome.storage.local.set({ 
      siteMappings: SITE_MAPPINGS,
      apiKey: API_KEY
    });
    console.log('[Stats Extension] Extension installed. Site mappings and API key stored.');

    // Verify API key is working
    const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/blacked?key=${API_KEY}`;
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      throw new Error('API key validation failed');
    }
    
    console.log('[Stats Extension] API key validated successfully');
  } catch (error) {
    console.error('[Stats Extension] Installation error:', error);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SHEET_DATA') {
    console.log('[Stats Extension] Received request for URL:', request.url);
    fetchSheetData(request.url)
      .then(data => {
        console.log('[Stats Extension] Successfully fetched data:', data);
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('[Stats Extension] Error fetching data:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

// Function to extract video title from URL
function getVideoTitle(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const videoIndex = pathParts.indexOf('videos');
    if (videoIndex !== -1 && videoIndex < pathParts.length - 1) {
      const title = pathParts[videoIndex + 1];
      console.log('[Stats Extension] Successfully extracted title from URL:', title);
      return title;
    }
    return null;
  } catch (error) {
    console.error('[Stats Extension] Error parsing URL:', error);
    // Try direct path extraction if URL parsing fails
    const matches = url.match(/\/videos\/([^/?#]+)/);
    if (matches && matches[1]) {
      console.log('[Stats Extension] Extracted title using regex:', matches[1]);
      return matches[1];
    }
    return null;
  }
}

// Function to normalize a string for comparison
function normalizeString(str) {
  if (!str) return '';
  const normalized = str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  console.log('[Stats Extension] Normalized string:', str, 'to:', normalized);
  return normalized;
}

// Function to fetch data from Google Sheets
async function fetchSheetData(videoUrl) {
  try {
    console.log('[Stats Extension] Starting fetchSheetData for URL:', videoUrl);
    
    // Get API key from storage
    const { apiKey } = await chrome.storage.local.get('apiKey');
    if (!apiKey) {
      throw new Error('API key not found');
    }

    // Extract domain more safely
    let domain;
    try {
      domain = new URL(videoUrl).hostname.replace('www.', '').replace('members.', '');
      console.log('[Stats Extension] Extracted domain:', domain);
    } catch (error) {
      console.error('[Stats Extension] Error parsing domain:', error);
      // Try regex fallback
      const domainMatch = videoUrl.match(/\/\/(www\.|members\.)?([^/]+)/);
      if (domainMatch) {
        domain = domainMatch[2];
        console.log('[Stats Extension] Extracted domain using regex:', domain);
      } else {
        throw new Error('Could not determine site domain');
      }
    }

    // For vixenplus.com, search all sheets
    if (domain === 'vixenplus.com') {
      console.log('[Stats Extension] Processing vixenplus.com URL, searching all sheets');

      // Extract and normalize the video title from the input URL first
      const videoTitle = getVideoTitle(videoUrl);
      if (!videoTitle) {
        throw new Error('Invalid video URL format');
      }
      const normalizedVideoTitle = normalizeString(videoTitle);
      console.log('[Stats Extension] Looking for normalized video title:', normalizedVideoTitle);

      const allSheetRequests = ALL_SHEETS.map(sheet => {
        console.log('[Stats Extension] Fetching sheet:', sheet);
        return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheet}?key=${apiKey}`)
          .then(response => {
            if (!response.ok) {
              console.error(`[Stats Extension] Error response from ${sheet}:`, response.status, response.statusText);
              return null;
            }
            return response.json();
          })
          .catch(error => {
            console.error(`[Stats Extension] Error fetching ${sheet}:`, error);
            return null;
          });
      });

      const allSheetsData = await Promise.all(allSheetRequests);
      console.log('[Stats Extension] Fetched data from all sheets');

      // Search through all sheets
      for (let i = 0; i < allSheetsData.length; i++) {
        const data = allSheetsData[i];
        if (!data || !data.values || data.values.length < 2) {
          console.log(`[Stats Extension] No valid data in sheet: ${ALL_SHEETS[i]}`);
          continue;
        }

        console.log(`[Stats Extension] Searching in sheet: ${ALL_SHEETS[i]}, found ${data.values.length} rows`);
        
        // Search for matching video title in URLs
        const matchingRow = data.values.find(row => {
          if (!row[COLUMN_INDICES.URL]) {
            return false;
          }
          
          const rowVideoTitle = getVideoTitle(row[COLUMN_INDICES.URL]);
          if (!rowVideoTitle) {
            return false;
          }
          
          const normalizedRowTitle = normalizeString(rowVideoTitle);
          console.log(`[Stats Extension] Comparing titles - Input: ${normalizedVideoTitle}, Sheet: ${normalizedRowTitle}`);
          
          if (normalizedVideoTitle === normalizedRowTitle) {
            console.log(`[Stats Extension] Found exact match in ${ALL_SHEETS[i]}:`, row[COLUMN_INDICES.URL]);
            return true;
          }
          return false;
        });

        if (matchingRow) {
          console.log(`[Stats Extension] Found match in sheet ${ALL_SHEETS[i]}:`, matchingRow);
          return processMatchingRow(matchingRow);
        }
      }

      throw new Error(`Video not found in any sheet. Searched for title: ${normalizedVideoTitle}`);
    } else {
      // Normal flow for other domains
      const sheetName = SITE_MAPPINGS[domain];
      if (!sheetName) {
        throw new Error('Site not supported');
      }

      console.log('[Stats Extension] Fetching data for domain:', domain, 'from sheet:', sheetName);

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data from Google Sheets');
      }

      const data = await response.json();
      console.log('[Stats Extension] Fetched sheet data:', data ? 'success' : 'null');

      if (!data.values || data.values.length < 2) {
        throw new Error('No data found in spreadsheet');
      }

      // Extract video title from URL
      const videoTitle = getVideoTitle(videoUrl);
      if (!videoTitle) {
        throw new Error('Invalid video URL format');
      }
      const normalizedVideoTitle = normalizeString(videoTitle);
      console.log('[Stats Extension] Looking for video title:', normalizedVideoTitle);

      // Search for matching video title
      const matchingRow = data.values.find(row => {
        if (!row[COLUMN_INDICES.URL]) {
          console.log('[Stats Extension] Row has no URL:', row);
          return false;
        }
        
        const rowVideoTitle = getVideoTitle(row[COLUMN_INDICES.URL]);
        if (!rowVideoTitle) {
          console.log('[Stats Extension] Could not extract title from row URL:', row[COLUMN_INDICES.URL]);
          return false;
        }
        
        const normalizedRowTitle = normalizeString(rowVideoTitle);
        console.log(`[Stats Extension] Comparing titles - Current: ${normalizedVideoTitle}, Row: ${normalizedRowTitle}`);
        return normalizedVideoTitle === normalizedRowTitle;
      });

      if (!matchingRow) {
        throw new Error(`Video not found in spreadsheet. Searched for title: ${videoTitle}`);
      }

      console.log('[Stats Extension] Found matching row:', matchingRow);
      return processMatchingRow(matchingRow);
    }
  } catch (error) {
    console.error('[Stats Extension] Error fetching sheet data:', error);
    throw error;
  }
}

// Process matching row into stats object
function processMatchingRow(row) {
  console.log('[Stats Extension] Processing row:', row);
  const stats = {
    content_id: row[COLUMN_INDICES.CONTENT_ID],
    title: row[COLUMN_INDICES.TITLE],
    director: row[COLUMN_INDICES.DIRECTOR],
    models: row[COLUMN_INDICES.MODELS],
    release_date: row[COLUMN_INDICES.RELEASE_DATE],
    views_10_days: parseInt(row[COLUMN_INDICES.VIEWS_10_DAYS]) || 0,
    views: parseInt(row[COLUMN_INDICES.VIEWS]) || 0,
    minutes_watched_10_days: parseInt(row[COLUMN_INDICES.MINUTES_WATCHED_10_DAYS]) || 0,
    minutes_watched: parseInt(row[COLUMN_INDICES.MINUTES_WATCHED]) || 0,
    joins_10_days: parseInt(row[COLUMN_INDICES.JOINS_10_DAYS]) || 0,
    joins: parseInt(row[COLUMN_INDICES.JOINS]) || 0,
    comments: parseInt(row[COLUMN_INDICES.COMMENTS]) || 0,
    raters: parseInt(row[COLUMN_INDICES.RATERS]) || 0,
    rating: parseFloat(row[COLUMN_INDICES.RATING]) || 0,
    favorites: parseInt(row[COLUMN_INDICES.FAVORITES]) || 0,
    trial_unlocks: parseInt(row[COLUMN_INDICES.TRIAL_UNLOCKS]) || 0,
    score_model_16: row[COLUMN_INDICES.SCORE_MODEL_16] || 'N/A',
    grade_model_16: row[COLUMN_INDICES.GRADE_MODEL_16] || 'N/A'
  };
  console.log('[Stats Extension] Processed stats:', stats);
  return stats;
} 