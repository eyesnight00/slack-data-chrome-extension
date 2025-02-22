# Video Stats Chrome Extension

A Chrome extension for viewing video statistics directly from Google Sheets on video pages. This tool helps you track and analyze video performance metrics across multiple domains.

## Supported Domains
- blacked.com
- tushy.com
- vixen.com
- blackedraw.com
- tushyraw.com
- deeper.com
- milfy.com
- slayed.com
- vixenplus.com (Beta)

## Features
- Real-time video statistics display
- Cross-domain support
- Multi-sheet data search
- Automatic domain detection
- Floating stats interface
- Refresh capability
- Error handling and logging

## Setup
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will automatically activate on supported video pages

## Development
This extension is built using:
- HTML/CSS/JavaScript
- Chrome Extension Manifest V3
- Google Sheets API
- MutationObserver for SPA support

## Usage
The extension will automatically:
1. Detect when you're on a supported video page
2. Search for matching video data in Google Sheets
3. Display statistics in a floating window
4. Update stats when navigating between videos

### Special Notes for vixenplus.com
- Videos on vixenplus.com may appear in any sheet
- The extension searches all sheets for matching data
- Matching is done using normalized video paths
- Performance may be slightly slower due to cross-sheet search

## Contributing
Feel free to open issues or submit pull requests. Please read our contributing guidelines before submitting PRs.

## License
MIT License 