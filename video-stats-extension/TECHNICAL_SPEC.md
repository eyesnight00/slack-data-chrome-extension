# Video Stats Extension Technical Specification

## Page Type Detection

The extension needs to handle two main types of pages:
1. Video Pages - Individual video detail pages
2. Index Pages - Video listing/grid pages

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

### Cross-Site Video Lookup

The extension supports looking up videos across different sites, particularly for vixenplus.com URLs:

#### VixenPlus.com Handling
- When a URL is from vixenplus.com, the extension searches for the video across ALL site sheets
- The search is based on the video slug extracted from the URL
- Example: `https://members.vixenplus.com/videos/example-video` will be searched in:
  - blacked
  - tushy
  - vixen
  - blackedraw
  - tushyraw
  - deeper
  - milfy
  - slayed

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

### Implementation Details

The page type detection is implemented in `content.js` using two key functions:

1. `isVideoPage()`: Determines if the current page is a video detail page
2. `isIndexPage()`: Determines if the current page is a video listing page

Both functions:
- Parse `window.location.pathname`
- Split path into segments
- Filter out empty segments
- Check segment count and content
- Include detailed logging for debugging

### Batch Processing

For index pages, the extension processes multiple videos efficiently:

1. **URL Collection**:
   - Gather all video URLs from the page
   - Create a map of URL to card element
   - Queue URLs for batch processing

2. **Batch Request**:
   - Send single request with all URLs
   - Process responses in parallel
   - Handle errors individually per video

3. **UI Updates**:
   - Update each card as data arrives
   - Handle missing/error cases gracefully
   - Maintain consistent UI across all cards

### Error Handling

- Invalid or unexpected URL patterns default to neither page type
- Extensive logging captures:
  - Raw pathname
  - Segments before/after filtering
  - Segment counts
  - Individual segment values
  - Reason for the decision
- Failed lookups show "No Data" instead of failing silently

### Initialization Flow

1. Extension loads
2. `initialize()` function called
3. Page type determined using above functions
4. Appropriate handler triggered:
   - Video pages → `fetchVideoStats()`
   - Index pages → `processVideoCards()`
   - Other pages → No action

### Change History

#### v1.1.0
- Added robust page type detection with detailed logging
- Fixed bug where trailing slashes caused incorrect page type detection
- Added support for proper URL segment parsing
- Improved error handling for malformed URLs
- Added support for vixenplus.com cross-sheet video lookup
- Implemented batch processing for index pages
- Enhanced logging for debugging cross-site lookups

## URL Matching and Video Identification

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

3. **Video Matching**
   - Compare normalized video slugs exactly
   - No fuzzy matching or partial matches
   - Both URLs must resolve to valid video slugs
   - Matching is case-insensitive

### VixenPlus.com Cross-Site Search

1. **Sheet Search Order**
   - Search all sheets in parallel:
     - blacked
     - tushy
     - vixen
     - blackedraw
     - tushyraw
     - deeper
     - milfy
     - slayed

2. **Search Process**
   ```
   1. Extract video slug from vixenplus.com URL
   2. Fetch all sheets concurrently
   3. For each sheet:
      - Skip if sheet data is invalid
      - Search for exact slug match
      - Return first match found
   4. If no match found in any sheet, return "No Data"
   ```

### Batch Processing

1. **URL Grouping**
   - Group URLs by domain
   - Process each domain's URLs separately
   - Use same matching logic as single URL lookup

2. **Optimization**
   - Fetch each sheet only once per batch
   - Process all URLs against cached sheet data
   - Return results as they're found

3. **Result Format**
   ```javascript
   {
     "url1": {
       success: true,
       data: { /* stats */ }
     },
     "url2": {
       success: false,
       error: "Video not found..."
     }
   }
   ```

4. **Error Handling**
   - Invalid URLs: Skip and mark as error
   - Failed sheet fetch: Mark all URLs for that sheet as error
   - No match found: Mark individual URL as not found
   - Channel videos: Skip and mark as invalid format

### Future Release Detection

1. **Release Date Check**
   ```javascript
   const releaseDate = new Date(row[COLUMN_INDICES.RELEASE_DATE]);
   const isFutureRelease = releaseDate > new Date();
   ```

2. **Future Release Display**
   - Score: "Unreleased"
   - Grade: "Unreleased"
   - UI shows "Coming Soon"
   - Blue styling to differentiate from other states

### Logging and Debugging

1. **URL Processing Logs**
   - Original URL
   - Extracted path parts
   - Video slug
   - Normalized version

2. **Matching Logs**
   - Sheet being searched
   - Comparison details
   - Match results
   - Row data when found

3. **Error Logs**
   - URL parsing failures
   - Sheet fetch errors
   - Invalid format details
   - Match failure reasons

### Performance Considerations

1. **Batch Optimization**
   - Single sheet fetch for multiple URLs
   - Parallel sheet fetching for vixenplus.com
   - Caching of sheet data during batch
   - Early exit on match found

2. **Memory Management**
   - Clear sheet data after batch complete
   - Don't store unnecessary row data
   - Minimize string operations

3. **Network Efficiency**
   - Fetch sheets only when needed
   - Reuse sheet data within batch
   - Handle network errors gracefully

### Test Coverage

The test suite provides comprehensive coverage of page type detection functionality:

1. **Video Page Detection Tests**
   - Valid video paths:
     - `/videos/example-video`
     - `/videos/example-video/` (trailing slash)
     - `/videos/some-really-long-video-name-with-hyphens`
   - Invalid video paths:
     - `/videos` (missing slug)
     - `/videos/` (missing slug with trailing slash)
     - `/other/example-video` (wrong first segment)
     - `/videos/category/example-video` (too many segments)
     - `/videos/example-video/extra` (too many segments)
     - `/` (root path)
     - `''` (empty path)
   - Debug logging verification

2. **Index Page Detection Tests**
   - Valid index paths:
     - `/videos`
     - `/videos/` (trailing slash)
   - Invalid index paths:
     - `/videos/example-video` (video page)
     - `/other` (wrong segment)
     - `/videos/category` (too many segments)
     - `/` (root path)
     - `''` (empty path)
   - Debug logging verification

3. **Edge Case Tests**
   - URLs with multiple consecutive slashes (`/videos///example-video`)
   - URLs with encoded characters (`/videos/example%20video`)
   - Malformed URLs (`invalid-url-format`)

4. **Initialization Flow Tests**
   - Video pages: Verify `fetchVideoStats` is called
   - Index pages: Verify `processVideoCards` is called
   - Other pages: Verify no handlers are called

Each test verifies both the functionality and logging output to ensure proper behavior and debugging capabilities.

## Grade Display, Caching, and Navigation Improvements

### Grade Color Coding

1. **Color Scheme**
   - A: Green (#4CAF50)
   - B: Light Green (#8BC34A)
   - C: Yellow (#FFC107)
   - D: Orange (#FF9800)
   - F: Red (#F44336)

2. **Implementation**
   ```javascript
   const GRADE_COLORS = {
     'A': '#4CAF50',
     'B': '#8BC34A',
     'C': '#FFC107',
     'D': '#FF9800',
     'F': '#F44336'
   };
   ```

3. **Display Rules**
   - Apply colors to both background and text for optimal visibility
   - Maintain consistent opacity (0.9) for all grades
   - Use white text for darker backgrounds (green, red)
   - Use dark text for lighter backgrounds (yellow)

### Grade Caching System

1. **Cache Structure**
   ```javascript
   {
     videoId: {
       grade: string,
       score: string,
       timestamp: number
     }
   }
   ```

2. **Caching Rules**
   - Cache only grade and model_16 score (static metrics)
   - Store in chrome.storage.local
   - Include timestamp for potential future cache invalidation
   - Do not cache any other metrics (views, ratings, etc.)

3. **Cache Operations**
   - Write: After fetching new video data
   - Read: Before making API requests
   - Lookup: Use video URL as key
   - Batch: Support batch operations for index pages

4. **Example Implementation**
   ```javascript
   // Cache write
   await chrome.storage.local.set({
     ['grade_cache_' + videoId]: {
       grade: data.grade_model_16,
       score: data.score_model_16,
       timestamp: Date.now()
     }
   });

   // Cache read
   const cacheKey = 'grade_cache_' + videoId;
   const cache = await chrome.storage.local.get(cacheKey);
   if (cache[cacheKey]) {
     return cache[cacheKey];
   }
   ```

### Navigation Improvements

1. **Overlay Management**
   - Track active overlays using unique identifiers
   - Remove overlays when navigating away from video pages
   - Maintain separate overlay systems for video and index pages

2. **Cleanup Process**
   ```javascript
   function cleanupOverlays() {
     // Remove video page stats overlay
     const statsContainer = document.getElementById('video-stats-container');
     if (statsContainer) {
       statsContainer.remove();
     }

     // Keep index page grade overlays if on index page
     if (!isIndexPage()) {
       document.querySelectorAll('.video-grade-overlay').forEach(overlay => {
         overlay.remove();
       });
     }
   }
   ```

3. **Navigation Detection**
   - Use URL change detection
   - Clean up overlays before initializing new page
   - Handle browser back/forward navigation
   - Support single-page application navigation

4. **Implementation**
   ```javascript
   // Current page tracking
   let currentPageUrl = window.location.href;

   // Navigation observer
   new MutationObserver((mutations) => {
     const newUrl = window.location.href;
     if (currentPageUrl !== newUrl) {
       currentPageUrl = newUrl;
       cleanupOverlays();
       safeInitialize();
     }
   }).observe(document.documentElement, { 
     subtree: true, 
     childList: true 
   });
   ```

### Performance Considerations

1. **Caching Benefits**
   - Reduced API calls to Google Sheets
   - Faster grade display on index pages
   - Lower bandwidth usage
   - Improved user experience

2. **Memory Management**
   - Regular cleanup of old overlays
   - Efficient cache storage structure
   - Proper garbage collection

3. **Navigation Optimization**
   - Clean removal of old elements
   - Smooth transition between pages
   - No flickering or visual artifacts
   - Proper event cleanup

### Testing Requirements

1. **Grade Colors**
   - Verify correct color mapping for each grade
   - Test color contrast for accessibility
   - Validate color consistency across browsers

2. **Cache System**
   - Test cache write/read operations
   - Verify cache hit/miss scenarios
   - Test batch operations
   - Validate cache structure

3. **Navigation**
   - Test all navigation patterns:
     - Direct URL access
     - Browser back/forward
     - Internal link navigation
     - Single-page app navigation
   - Verify cleanup of old overlays
   - Test overlay persistence when appropriate 