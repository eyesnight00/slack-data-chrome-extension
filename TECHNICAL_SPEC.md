# Video Stats Chrome Extension - Technical Specification

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

### Cross-Sheet Search Logic
For vixenplus.com URLs, the extension implements a comprehensive search across all sheets:

1. **Title Extraction**:
   ```javascript
   function getVideoTitle(url) {
     // Extract from URL path: /videos/[video-title]
     // Returns normalized title string
   }
   ```

2. **Title Normalization**:
   ```javascript
   function normalizeString(str) {
     return str.toLowerCase()
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/^-+|-+$/g, '');
   }
   ```

3. **Search Process**:
   - Extract and normalize video title from URL
   - Fetch all sheets in parallel
   - Search each sheet for matching video title
   - Compare normalized titles for exact matches
   - Return data from first matching sheet

### URL Matching Logic
1. **Domain Extraction**:
   - Remove 'www.' and 'members.' prefixes
   - Handle both HTTP and HTTPS
   - Support all site variations

2. **Title Matching**:
   - Extract video title from path
   - Normalize for comparison
   - Perform exact match check
   - Handle special characters and formatting

### Security Implementation
1. **API Key Storage**:
   - Store in Chrome storage
   - Access via background script
   - Never expose in content script
   - Validate on installation

2. **Content Security**:
   - CSP in manifest
   - Sanitize data display
   - Secure message passing
   - Error handling

### Performance Optimization
1. **Parallel Requests**:
   - Fetch all sheets simultaneously
   - Use Promise.all for handling
   - Early return on match
   - Error handling per sheet

2. **Data Processing**:
   - Normalize strings once
   - Cache normalized values
   - Optimize comparison logic
   - Handle missing data

### Error Handling
1. **API Failures**:
   - Retry mechanism
   - User feedback
   - Logging system
   - Fallback behavior

2. **Data Validation**:
   - Check data format
   - Validate required fields
   - Handle missing values
   - Type conversion

## 🔍 Testing Requirements

### Unit Tests
1. **URL Processing**:
   - Title extraction
   - Domain parsing
   - Normalization
   - Edge cases

2. **Data Handling**:
   - Sheet parsing
   - Data validation
   - Stats calculation
   - Error cases

### Integration Tests
1. **API Integration**:
   - Sheet fetching
   - Cross-sheet search
   - Error handling
   - Rate limiting

2. **Extension Flow**:
   - Content script injection
   - Message passing
   - UI updates
   - State management

### Performance Tests
1. **Response Times**:
   - Sheet loading
   - Search operations
   - UI rendering
   - Data processing

2. **Resource Usage**:
   - Memory usage
   - CPU utilization
   - Network requests
   - Cache efficiency

## 📝 Documentation Requirements

### Code Documentation
1. **Functions**:
   - Purpose
   - Parameters
   - Return values
   - Examples

2. **Components**:
   - Architecture
   - Dependencies
   - Flow diagrams
   - State management

### User Documentation
1. **Installation**:
   - Requirements
   - Setup steps
   - Configuration
   - Troubleshooting

2. **Usage Guide**:
   - Features
   - Limitations
   - Best practices
   - FAQs

---
*This technical specification is regularly updated to reflect implementation details and improvements.* 