# Changelog

All notable changes to the Video Stats Chrome Extension project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Index page grade display feature
  - Display video grades on thumbnails in index pages
  - Batch processing for multiple video cards
  - Support for infinite scroll
  - Optimized sheet data fetching
  - Responsive grade overlay UI

### Fixed
- Enhanced logging system implementation
  - Added detailed page type detection logs
  - Fixed initialization logging sequence
  - Added structured logging for debugging
  - Improved log readability with consistent format
  - Added video card processing status logs

## [1.1.0] - 2025-02-22

### Added
- Full support for vixenplus.com domain
- Cross-sheet search functionality verified working
- Automatic content script injection on vixenplus.com pages

### Fixed
- Content script loading issues
- File path references in manifest.json
- Extension permissions for vixenplus.com domain
- Directory structure for extension files

### Changed
- Moved extension files to root directory for better organization
- Updated manifest.json to use correct file paths
- Improved extension loading reliability

## [1.0.0] - 2025-02-22

### Added
- Initial extension setup with Chrome Extension Manifest V3
- Basic extension structure and file organization
- Google Sheets API integration for data fetching
- Multi-domain support for all video sites
- Cross-sheet search functionality for vixenplus.com
- Floating stats interface with real-time updates
- Settings management through popup interface
- Comprehensive error handling and logging system
- Documentation files (README, PROGRESS, PROJECT_PLAN, TECHNICAL_SPEC)

### Changed
- Updated manifest.json to explicitly include vixenplus.com domains
- Changed content script injection timing to document_start
- Removed <all_urls> pattern in favor of explicit domain matches
- Enhanced URL matching patterns for all supported domains
- Improved title normalization and matching logic

### Fixed
- Content script injection issues on vixenplus.com
- Domain permission issues in manifest.json
- URL matching patterns for subdomains
- Sheet data processing for cross-sheet search

### Security
- Implemented secure API key storage
- Added Content Security Policy
- Protected sensitive data handling

## [Unreleased]
### Planned
- Caching mechanism for sheet data
- Performance monitoring and metrics
- Advanced error reporting system
- Analytics dashboard
- Batch request optimization

---
*Note: This changelog will be updated with each significant change to the project.* 