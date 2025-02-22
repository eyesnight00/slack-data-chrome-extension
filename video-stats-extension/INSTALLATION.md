# Video Stats Extension - Internal Installation Guide

## Installation Steps

1. Download the extension zip file from the company's internal shared drive:
   - Location: `https://github.com/eyesnight00/slack-data-chrome-extension/releases`
   - Download the latest `video-stats-extension.zip` from the releases page

2. Extract the zip file to a folder on your computer

3. Install in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the extracted extension folder

## Usage Guide

### Video Pages
- When viewing a video page, the stats overlay will appear automatically in the top right corner
- Stats include:
  - Views (10 days and all-time)
  - Minutes watched
  - Joins
  - Comments
  - Rating
  - Performance metrics (Score and Grade)

### Index Pages
Grade overlays appear on video thumbnails with the following color coding:
- Dark green: A grade
- Light green: B grade
- Yellow: C grade
- Orange: D grade
- Red: E/F grade
- Blue: Unreleased/Coming Soon
- Gray: No data available

### Features
- Automatic grade display on index pages
- 24-hour caching for faster loading
- Cross-site video lookup support
- Batch processing for efficient loading

## Troubleshooting

### Common Issues

1. Extension not showing stats:
   - Refresh the page
   - Check if you're on a supported video or index page
   - Verify Chrome extension is enabled

2. Incorrect or missing grades:
   - Clear extension cache:
     1. Right-click extension icon
     2. Click "Options"
     3. Click "Clear Cache"
   - Refresh the page

3. Performance issues:
   - Disable and re-enable the extension
   - Clear browser cache
   - Restart Chrome

### Need Help?

For technical support or questions, contact:
- [Your-Internal-Support-Contact]
- [Your-Internal-Support-Email]

## Updates

The extension will be updated periodically with improvements. When a new version is available:
1. Download the new zip file from the shared drive
2. Remove the existing extension from Chrome
3. Follow the installation steps above with the new version

## Version History

Current Version: 2.0.1 (March 21, 2024)
- Improved grade display on index pages with distinct color coding
- Added 24-hour caching system for better performance
- Fixed navigation overlay issues
- Added smart cleanup of overlays between pages

Previous Versions:
2.0.0 (March 20, 2024)
- Initial release with cross-site video lookup
- Added grade overlays on video thumbnails
- Implemented batch processing for index pages

## Privacy Note

This extension is for internal company use only. Do not share the extension or its data outside the company. 