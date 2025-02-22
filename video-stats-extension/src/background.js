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
  console.log('[Stats Extension] Received message:', request);

  if (request.type === 'GET_SHEET_DATA') {
    // Single URL request
    if (typeof request.url === 'string') {
      fetchSheetData(request.url)
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    // Batch URL request
    else if (Array.isArray(request.urls)) {
      processBatchUrls(request.urls)
        .then(results => sendResponse({ success: true, results }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  }
});

// Function to extract video title from URL
function getVideoTitle(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Skip channel videos
    if (pathParts[0] === 'channels') {
      return null;
    }
    
    // Find the index of 'videos' in the path
    const videoIndex = pathParts.indexOf('videos');
    if (videoIndex === -1) return null;
    
    // Get the last part after 'videos', regardless of path structure
    const videoSlug = pathParts[pathParts.length - 1];
    console.log('[Stats Extension] Extracted video slug:', {
      url,
      pathParts,
      videoIndex,
      videoSlug,
      normalized: normalizeString(videoSlug)
    });
    return videoSlug;
  } catch (error) {
    console.error('[Stats Extension] Error parsing URL:', error);
    // Try direct path extraction if URL parsing fails
    const matches = url.match(/\/videos\/(?:[^/]+\/)*([^/?#]+)/);
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
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^videos-/, '') // Remove 'videos-' prefix if present
    .replace(/-in-.*?-debut$/, '') // Remove "-in-*-debut" suffix
    .replace(/-debut$/, '') // Remove "-debut" suffix
    .replace(/-and-/g, '-') // Normalize "and" to just hyphen
    .replace(/-a-/g, '-') // Normalize "a" to just hyphen
    .replace(/-the-/g, '-') // Normalize "the" to just hyphen
    .replace(/-with-/g, '-'); // Normalize "with" to just hyphen
}

// Function to normalize a title for comparison
function normalizeTitle(title) {
  if (!title) return '';
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-in-.*?-debut$/, '') // Remove "-in-*-debut" suffix
    .replace(/-debut$/, ''); // Remove "-debut" suffix
}

// Function to check if two titles might refer to the same video
function titlesMightMatch(title1, title2) {
  if (!title1 || !title2) return false;
  
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  
  console.log('[Stats Extension] Comparing titles:', {
    title1, title2,
    norm1, norm2
  });
  
  // Direct match
  if (norm1 === norm2) return true;
  
  // Convert URL-style title to readable title
  const readable1 = norm1.replace(/-/g, ' ');
  const readable2 = norm2.replace(/-/g, ' ');
  
  // Check if one contains the other
  if (readable1.includes(readable2) || readable2.includes(readable1)) {
    console.log('[Stats Extension] Found partial match:', { readable1, readable2 });
    return true;
  }
  
  // Remove common words and check again
  const clean1 = readable1.replace(/\b(gets|her|in|the|a|an)\b/g, '').replace(/\s+/g, ' ').trim();
  const clean2 = readable2.replace(/\b(gets|her|in|the|a|an)\b/g, '').replace(/\s+/g, ' ').trim();
  
  if (clean1 === clean2) {
    console.log('[Stats Extension] Found match after cleaning:', { clean1, clean2 });
    return true;
  }
  
  return false;
}

// Function to check if two URLs refer to the same video
function isSameVideo(url1, url2) {
  const title1 = getVideoTitle(url1);
  const title2 = getVideoTitle(url2);
  
  if (!title1 || !title2) return false;
  
  const norm1 = normalizeString(title1);
  const norm2 = normalizeString(title2);
  
  console.log('[Stats Extension] Comparing video slugs:', {
    url1, url2,
    title1, title2,
    norm1, norm2,
    match: norm1 === norm2
  });
  
  return norm1 === norm2;
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

      // Extract video slug from the input URL
      const videoSlug = getVideoTitle(videoUrl);
      if (!videoSlug) {
        throw new Error('Invalid video URL format');
      }
      console.log('[Stats Extension] Looking for video slug:', videoSlug);

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
        
        // Search for matching video slug in URLs
        const matchingRow = data.values.find(row => {
          if (!row[COLUMN_INDICES.URL]) return false;
          const rowSlug = getVideoTitle(row[COLUMN_INDICES.URL]);
          return rowSlug === videoSlug;
        });

        if (matchingRow) {
          console.log(`[Stats Extension] Found match in sheet ${ALL_SHEETS[i]}:`, matchingRow);
          return processMatchingRow(matchingRow);
        }
      }

      throw new Error(`Video not found in any sheet. Searched for slug: ${videoSlug}`);
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
        if (!row[COLUMN_INDICES.URL]) return false;
        return isSameVideo(videoUrl, row[COLUMN_INDICES.URL]);
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
  
  // Check if this is a future release
  const releaseDate = new Date(row[COLUMN_INDICES.RELEASE_DATE]);
  const isFutureRelease = releaseDate > new Date();
  
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
    score_model_16: isFutureRelease ? 'Unreleased' : (row[COLUMN_INDICES.SCORE_MODEL_16] || 'N/A'),
    grade_model_16: isFutureRelease ? 'Unreleased' : (row[COLUMN_INDICES.GRADE_MODEL_16] || 'N/A'),
    is_future_release: isFutureRelease
  };
  
  console.log('[Stats Extension] Processed stats:', {
    ...stats,
    future_release_check: {
      release_date: releaseDate,
      current_date: new Date(),
      is_future: isFutureRelease
    }
  });
  
  return stats;
}

// Process a batch of video URLs
async function processBatchUrls(urls) {
  console.log('[Stats Extension] Processing batch of URLs:', urls);
  
  try {
    // Group URLs by domain
    const urlsByDomain = {};
    for (const url of urls) {
      try {
        const domain = new URL(url).hostname.replace('www.', '').replace('members.', '');
        if (!urlsByDomain[domain]) {
          urlsByDomain[domain] = [];
        }
        urlsByDomain[domain].push(url);
      } catch (error) {
        console.error('[Stats Extension] Error parsing URL:', url, error);
      }
    }

    // Process each domain's URLs
    const results = {};
    for (const [domain, domainUrls] of Object.entries(urlsByDomain)) {
      // For vixenplus.com, we need to search all sheets
      if (domain === 'vixenplus.com') {
        // Fetch all sheets once
        const allSheetRequests = ALL_SHEETS.map(sheet => {
          console.log('[Stats Extension] Fetching sheet:', sheet);
          return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheet}?key=${API_KEY}`)
            .then(response => response.ok ? response.json() : null)
            .catch(error => {
              console.error(`[Stats Extension] Error fetching ${sheet}:`, error);
              return null;
            });
        });

        const allSheetsData = await Promise.all(allSheetRequests);
        
        // Process each URL against all sheets
        for (const url of domainUrls) {
          const videoTitle = getVideoTitle(url);
          if (!videoTitle) {
            results[url] = {
              success: false,
              error: 'Invalid video URL format'
            };
            continue;
          }
          
          console.log('[Stats Extension] Processing batch URL:', {
            url,
            videoTitle,
            normalized: normalizeString(videoTitle)
          });
          
          let found = false;

          // Search through all sheets
          for (let i = 0; i < allSheetsData.length; i++) {
            const data = allSheetsData[i];
            if (!data || !data.values || data.values.length < 2) continue;

            console.log(`[Stats Extension] Searching sheet ${ALL_SHEETS[i]} for video:`, videoTitle);

            const matchingRow = data.values.find(row => {
              if (!row[COLUMN_INDICES.URL]) return false;
              return isSameVideo(url, row[COLUMN_INDICES.URL]);
            });

            if (matchingRow) {
              console.log(`[Stats Extension] Found match in sheet ${ALL_SHEETS[i]}:`, {
                url,
                videoTitle,
                matchingUrl: matchingRow[COLUMN_INDICES.URL]
              });
              results[url] = {
                success: true,
                data: processMatchingRow(matchingRow)
              };
              found = true;
              break;
            }
          }

          if (!found) {
            console.log('[Stats Extension] No match found for video:', {
              url,
              videoTitle,
              normalized: normalizeString(videoTitle)
            });
            results[url] = {
              success: false,
              error: `Video not found in any sheet: ${videoTitle}`
            };
          }
        }
      } else {
        // Normal flow for other domains
        const sheetName = SITE_MAPPINGS[domain];
        if (!sheetName) {
          for (const url of domainUrls) {
            results[url] = {
              success: false,
              error: 'Site not supported'
            };
          }
          continue;
        }

        // Fetch sheet data once for this domain
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${API_KEY}`
        );

        if (!response.ok) {
          for (const url of domainUrls) {
            results[url] = {
              success: false,
              error: 'Failed to fetch data from Google Sheets'
            };
          }
          continue;
        }

        const data = await response.json();
        if (!data.values || data.values.length < 2) {
          for (const url of domainUrls) {
            results[url] = {
              success: false,
              error: 'No data found in spreadsheet'
            };
          }
          continue;
        }

        // Process each URL for this domain
        for (const url of domainUrls) {
          const videoTitle = getVideoTitle(url);
          if (!videoTitle) {
            results[url] = {
              success: false,
              error: 'Invalid video URL format'
            };
            continue;
          }

          console.log('[Stats Extension] Processing batch URL:', {
            url,
            videoTitle,
            normalized: normalizeString(videoTitle)
          });

          const matchingRow = data.values.find(row => {
            if (!row[COLUMN_INDICES.URL]) return false;
            return isSameVideo(url, row[COLUMN_INDICES.URL]);
          });

          if (matchingRow) {
            console.log('[Stats Extension] Found match:', {
              url,
              videoTitle,
              matchingUrl: matchingRow[COLUMN_INDICES.URL]
            });
            results[url] = {
              success: true,
              data: processMatchingRow(matchingRow)
            };
          } else {
            console.log('[Stats Extension] No match found:', {
              url,
              videoTitle,
              normalized: normalizeString(videoTitle)
            });
            results[url] = {
              success: false,
              error: `Video not found in spreadsheet: ${videoTitle}`
            };
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('[Stats Extension] Error processing batch:', error);
    return urls.reduce((acc, url) => {
      acc[url] = {
        success: false,
        error: error.message
      };
      return acc;
    }, {});
  }
} 