# Changelog

## [2.0.0] - 2024-03-20
### Added
- Cross-site video lookup for vixenplus.com
- Comprehensive technical specification for page type detection logic
- Extensive test suite for page type detection with edge cases
- Detailed logging system for debugging
- Support for future release detection and display
- Batch processing for index pages
- Grade overlays on video thumbnails

### Fixed
- Content script initialization and timing issues
- Module system compatibility issues
- Project structure and file organization
- URL parsing robustness for video and index pages
- Better handling of edge cases like trailing slashes and encoded characters
- Enhanced error handling for malformed URLs
- Fixed overlay display on video pages

### Changed
- Moved to non-module content script for better compatibility
- Improved initialization flow with safer DOM checks
- Refactored test suite to focus on page type detection
- Enhanced debug logging format for easier troubleshooting
- Optimized batch processing for better performance
- Simplified project structure with clearer file organization

### Removed
- Module exports from content script
- Redundant URL processing tests
- Unused test dependencies
- Legacy test configurations
- Duplicate technical specification document

## [1.1.0] - 2024-03-19
### Added
- Robust page type detection with detailed logging
- Support for proper URL segment parsing
- Support for vixenplus.com cross-sheet video lookup
- Batch processing for index pages
- Enhanced logging for debugging cross-site lookups

### Fixed
- Bug where trailing slashes caused incorrect page type detection
- Improved error handling for malformed URLs

### Changed
- Refactored test suite to focus on page type detection
- Improved test organization and readability
- Enhanced debug logging format for easier troubleshooting

### Removed
- Redundant URL processing tests
- Unused test dependencies
- Legacy test configurations

## [Unreleased]
### Added
- Implemented color-coded grade display on index pages
  - Dark green for A grades
  - Light green for B grades
  - Yellow for C grades (with dark text)
  - Orange for D grades
  - Red for E and F grades
  - Blue for unreleased videos
  - Gray for videos with no data
- Implemented grade and score caching system
  - Cache grades and scores for 24 hours
  - Immediate display of cached grades on index pages
  - Reduced API calls by only fetching uncached data
  - Automatic cache cleanup for expired entries
- Fixed navigation overlay issues
  - Added proper cleanup of overlays when navigating between pages
  - Maintain correct overlay state during navigation
  - Prevent stats container from persisting on index pages
  - Smart handling of grade overlays on index pages

### Planned Changes
- Implement additional performance optimizations
  - Batch processing improvements
  - Memory usage optimization
  - Network request reduction
- Global video card detection and grading
  - Support for video cards across all pages
  - Universal grade display implementation
  - Extended page type detection
  - Performance optimizations for widespread card detection
  - Enhanced caching for cross-page support

## [2.0.1] - 2024-03-21
### Added
- Implemented color-coded grade display on index pages
  - Dark green for A grades
  - Light green for B grades
  - Yellow for C grades (with dark text)
  - Orange for D grades
  - Red for E and F grades
  - Blue for unreleased videos
  - Gray for videos with no data
- Implemented grade and score caching system
  - Cache grades and scores for 24 hours
  - Immediate display of cached grades on index pages
  - Reduced API calls by only fetching uncached data
  - Automatic cache cleanup for expired entries

### Fixed
- Navigation overlay issues
  - Added proper cleanup of overlays when navigating between pages
  - Maintain correct overlay state during navigation
  - Prevent stats container from persisting on index pages
  - Smart handling of grade overlays on index pages

### Changed
- Moved to non-module content script for better compatibility
- Improved initialization flow with safer DOM checks
- Refactored test suite to focus on page type detection
- Enhanced debug logging format for easier troubleshooting
- Optimized batch processing for better performance
- Simplified project structure with clearer file organization

### Removed
- Module exports from content script
- Redundant URL processing tests
- Unused test dependencies
- Legacy test configurations
- Duplicate technical specification document 