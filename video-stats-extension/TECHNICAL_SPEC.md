# Video Stats Chrome Extension - Technical Specification

> **Important**: This document is the single source of truth for all technical specifications of the Video Stats Chrome extension. No other technical specification documents should exist or be referenced.

## 📌 Overview
This document provides the technical specifications and implementation details for the Video Stats Chrome extension.

## 📊 Google Sheets Integration

### Sheet Details
- **Sheet ID**: `1mZmAI_yKHmuUZfUHTgHp_ksJNn9hKWaf2HwvMIcQviM`
- **API Endpoint**: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`

### Site-to-Sheet Mapping
| Site URL | Sheet Tab |
|----------|-----------|
| members.blacked.com, www.blacked.com | blacked |
| members.tushy.com, www.tushy.com | tushy |
| members.vixen.com, www.vixen.com | vixen |
| members.blackedraw.com, www.blackedraw.com | blackedraw |
| members.tushyraw.com, www.tushyraw.com | tushyraw |
| members.deeper.com, www.deeper.com | deeper |
| members.milfy.com, www.milfy.com | milfy |
| members.slayed.com, www.slayed.com | slayed |
| members.vixenplus.com, www.vixenplus.com | all sheets (cross-sheet search) |

### Data Structure
Column indices and their meanings:
| Index | Column Name | Description |
|-------|-------------|-------------|
| 0 | content_id | Unique identifier for the video |
| 1 | site | Site identifier (e.g., 'blacked', 'tushy') |
| 2 | title | Video title |
| 3 | director | Director name |
| 4 | models_f | Female models |
| 5 | models_m | Male models |
| 6 | models | All models combined |
| 7 | release_date | Release date |
| 8 | release_year | Release year |
| 9 | url | Video URL |
| 10 | minutes_watched_10_days | Minutes watched in last 10 days |
| 11 | views_10_days | Views in last 10 days |
| 12 | minutes_watched | Total minutes watched |
| 13 | views | Total views |
| 14 | minutes_watched_recommendation | Minutes watched from recommendations |
| 15 | joins_10_days | Joins in last 10 days |
| 16 | joins | Total joins |
| 17 | comments | Number of comments |
| 18 | raters | Number of raters |
| 19 | rating | Average rating |
| 20 | favorites | Number of favorites |
| 21 | trial_unlocks | Number of trial unlocks |
| 27 | score_model_16 | Score from model version 16 |
| 33 | grade_model_16 | Grade from model version 16 |

## 🔧 Technical Implementation

### Project Structure
```
my-extension/
│── manifest.json      # Extension configuration
│── background.js      # Service worker & API handling
│── content.js         # Page injection & UI
│── popup.html         # Extension popup interface
│── popup.js          # Popup functionality
│── styles.css        # UI styling
│── icon.png          # Extension icon
```

### Required Permissions
- `storage`: For site-to-sheet mappings and API key storage
- `scripting`: For webpage script injection
- Host permissions for all supported video sites

## Page Type Detection

The extension needs to handle three main types of pages:
1. Video Pages - Individual video detail pages
2. Index Pages - Video listing/grid pages
3. Homepage - Root URL and main landing page

### URL Pattern Rules

#### Video Pages
- Pattern: `/videos/{video-slug}`
- Requirements:
  - Must have exactly 2 path segments after filtering empty segments
  - First segment must be "videos"
  - Second segment is the video slug
- Examples:
  - ✅ `/videos/example-video`
  - ✅ `/videos/example-video/`
  - ❌ `/videos` (wrong segment count)
  - ❌ `/videos/category/example-video` (wrong segment count)
  - ❌ `/other/example-video` (wrong first segment)

#### Index Pages
- Pattern: `/videos`
- Requirements:
  - Must have exactly 1 path segment after filtering empty segments
  - First (and only) segment must be "videos"
- Examples:
  - ✅ `/videos`
  - ✅ `/videos/`
  - ❌ `/videos/category` (wrong segment count)
  - ❌ `/other` (wrong segment)

#### Homepage
- Pattern: `/` or empty path
- Requirements:
  - Must have zero path segments after filtering empty segments
  - Or must have exactly one empty segment
- Examples:
  - ✅ `/`
  - ✅ `''` (empty path)
  - ❌ `/videos` (wrong segment count)
  - ❌ `/other` (wrong segment)

### Implementation Details

The page type detection is implemented in `content.js` using three key functions:

1. `isVideoPage()`: Determines if the current page is a video detail page
2. `isIndexPage()`: Determines if the current page is a video listing page
3. `isHomePage()`: Determines if the current page is the homepage

All functions:
- Parse `window.location.pathname`
- Split path into segments
- Filter out empty segments
- Check segment count and content
- Include detailed logging for debugging

## Initialization and Content Detection

### Initialization Flow

1. **Initial Script Load**:
   ```javascript
   // Ensure immediate initialization on script load
   console.log('[Stats Extension] Content script starting...');
   initialize();
   ```

2. **Document Ready State Handling**:
   ```javascript
   // Multiple initialization triggers
   if (document.readyState === 'loading') {
     // Wait for DOMContentLoaded
     document.addEventListener('DOMContentLoaded', initializeAfterLoad);
   } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
     // Initialize immediately
     initializeAfterLoad();
   }
   // Fallback initialization
   window.addEventListener('load', initializeAfterLoad);
   ```

3. **Page Type Specific Initialization**:
   - Video pages → `fetchVideoStats()`
   - Index/Homepage → `startContentDetection()` + `setupIntersectionObserver()`
   - Immediate card processing if cards are already present

### Dynamic Content Detection

1. **Content Container Detection**:
   ```javascript
   const CONTENT_CONTAINER_SELECTORS = [
     '[data-test-component="VideoGrid"]',
     '[data-test-component="VideoList"]',
     '[data-test-component="HomePage"]',
     'main',
     '#root',
     '#app'
   ];
   ```

2. **Retry Mechanism**:
   - Maximum 20 retries
   - 500ms interval between attempts
   - Logs attempt count and document state
   - Continues until content or cards found

3. **Intersection Observer**:
   - Detects when new content scrolls into view
   - 50px margin to preload before visibility
   - Triggers card processing for new content
   - Automatically observes new containers

4. **Mutation Observer**:
   - Prevents duplicate processing with lock
   - Tracks processed nodes to avoid redundancy
   - Ignores attribute and text changes
   - Debounced processing (500ms)

## Video Processing

### Card Processing Improvements

1. **Processing State Tracking**:
   ```javascript
   // Mark cards as processed
   card.setAttribute('data-stats-processed', 'true');
   ```

2. **Batch Processing**:
   - Groups unprocessed cards
   - Processes cache hits immediately
   - Batches API requests for cache misses
   - Tracks performance metrics

3. **Performance Monitoring**:
   ```javascript
   console.log('[Stats Extension] Card processing complete:', {
     totalTime: performance.now() - startTime,
     processedUrls: urlsToProcess.length,
     cacheHits: cacheHits.size,
     cacheMisses: cacheMisses.length
   });
   ```

### Cross-Site Video Lookup

#### VixenPlus.com Handling
- When a URL is from vixenplus.com, the extension searches for the video across ALL site sheets
- The search is based on the video slug extracted from the URL
- Example: `https://members.vixenplus.com/videos/example-video` will be searched in all sheets

#### Video Matching Process
1. **URL Normalization**:
   ```javascript
   // Remove www. and members. prefixes
   domain = url.hostname.replace('www.', '').replace('members.', '');
   ```

2. **Slug Extraction**:
   ```javascript
   // Extract video slug from URL path
   videoSlug = getVideoTitle(url); // Returns last segment after /videos/
   ```

3. **Sheet Search**:
   - For vixenplus.com: Search all sheets
   - For other domains: Search specific sheet
   - Compare video slugs exactly (no fuzzy matching)

4. **Data Return**:
   - Return data from first sheet with matching video
   - Include sheet name in logging for debugging

### URL Processing Rules

1. **URL Extraction**
   - Extract video slug from URL path using `getVideoTitle()`
   - Handle both direct URLs and URLs with additional path segments
   - Skip channel videos (compilations, behind-the-scenes)
   ```javascript
   // Examples:
   /videos/example-video → "example-video"
   /videos/category/example-video → "example-video"
   /channels/compilations/videos/example → null (skipped)
   ```

2. **String Normalization**
   - Convert to lowercase
   - Replace non-alphanumeric characters with hyphens
   - Remove leading/trailing hyphens
   - Remove common prefixes/suffixes
   - Normalize common words:
     ```javascript
     "-and-" → "-"
     "-a-" → "-"
     "-the-" → "-"
     "-with-" → "-"
     ```

## Logging System

1. **Log Format**:
   ```javascript
   // Standard format for all logs
   console.log('[Stats Extension] Category: Message', {
     // Structured data for debugging
     relevant_data: value,
     additional_context: value
   });
   ```

2. **Log Categories**:
   - Initialization: Extension and page load events
   - Page Detection: URL parsing and page type determination
   - Video Processing: Card detection and data fetching
   - UI Updates: Overlay creation and updates
   - Error States: Failures and edge cases

3. **Debug Information**:
   - URL components (pathname, origin, search params)
   - Page type detection results
   - DOM element counts and selectors
   - API request/response status
   - Performance timing data

4. **Log Levels**:
   ```javascript
   console.log()    // Standard information
   console.info()   // Important success states
   console.warn()   // Non-critical issues
   console.error()  // Critical failures
   console.debug()  // Detailed debugging info
   ```

## Error Handling

1. **Initialization Failures**:
   - Multiple initialization attempts
   - Fallback to window load event
   - Detailed logging of document state

2. **Content Detection Failures**:
   - Retries with increasing intervals
   - Falls back to mutation observer
   - Logs failure reasons

3. **Card Processing Errors**:
   - Continues processing other cards on error
   - Maintains processing lock state
   - Logs error details for debugging

4. **Failed Lookups**:
   - Show "No Data" instead of failing silently
   - Log detailed error information
   - Include sheet name and matching attempts in logs

## Change History

### v2.1.0 (Current)
- Added robust homepage detection and initialization
- Implemented multiple initialization triggers
- Added intersection observer for infinite scroll
- Improved mutation observer efficiency
- Added processing state tracking for cards
- Enhanced performance monitoring and logging
- Fixed homepage direct load issues
- Improved retry mechanism for content detection
- Added backup checks for missed cards
- Enhanced error handling and recovery

### v1.1.0
- Added robust page type detection with detailed logging
- Fixed bug where trailing slashes caused incorrect page type detection
- Added support for proper URL segment parsing
- Improved error handling for malformed URLs
- Added support for vixenplus.com cross-sheet video lookup
- Implemented batch processing for index pages
- Enhanced logging for debugging cross-site lookups

---
*This technical specification is regularly updated to reflect implementation details and improvements.* 