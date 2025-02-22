#!/bin/bash

# Create extension directory structure
mkdir -p video-stats-extension/src
mkdir -p video-stats-extension/icons

# Copy source files
cp src/background.js video-stats-extension/src/
cp src/content.js video-stats-extension/src/
cp src/popup.html video-stats-extension/src/
cp src/popup.js video-stats-extension/src/
cp src/styles.css video-stats-extension/src/

# Create manifest.json
cat > video-stats-extension/manifest.json << 'EOL'
{
  "manifest_version": 3,
  "name": "Video Stats Viewer",
  "version": "1.0.0",
  "description": "View video statistics from Google Sheets directly on video pages",
  
  "permissions": [
    "storage",
    "scripting"
  ],

  "host_permissions": [
    "https://members.blacked.com/*", "https://www.blacked.com/*",
    "https://members.tushy.com/*", "https://www.tushy.com/*",
    "https://members.vixen.com/*", "https://www.vixen.com/*",
    "https://members.blackedraw.com/*", "https://www.blackedraw.com/*",
    "https://members.tushyraw.com/*", "https://www.tushyraw.com/*",
    "https://members.deeper.com/*", "https://www.deeper.com/*",
    "https://members.milfy.com/*", "https://www.milfy.com/*",
    "https://members.slayed.com/*", "https://www.slayed.com/*",
    "https://sheets.googleapis.com/v4/spreadsheets/*"
  ],

  "action": {
    "default_popup": "src/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },

  "background": {
    "service_worker": "src/background.js",
    "type": "module"
  },

  "content_scripts": [{
    "matches": [
      "https://members.blacked.com/*", "https://www.blacked.com/*",
      "https://members.tushy.com/*", "https://www.tushy.com/*",
      "https://members.vixen.com/*", "https://www.vixen.com/*",
      "https://members.blackedraw.com/*", "https://www.blackedraw.com/*",
      "https://members.tushyraw.com/*", "https://www.tushyraw.com/*",
      "https://members.deeper.com/*", "https://www.deeper.com/*",
      "https://members.milfy.com/*", "https://www.milfy.com/*",
      "https://members.slayed.com/*", "https://www.slayed.com/*"
    ],
    "js": ["src/content.js"],
    "css": ["src/styles.css"]
  }],

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
EOL

# Create a simple placeholder icon (you should replace this with proper icons)
cat > video-stats-extension/icons/icon16.png << 'EOL'
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QUM2OEZDQTQ4RTU0MTFFMUEzM0VFRTM2RUY1M0RBMjYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QUM2OEZDQTU4RTU0MTFFMUEzM0VFRTM2RUY1M0RBMjYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBQzY4RkNBMjhFNTQxMUUxQTMzRUVFMzZFRjUzREEyNiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBQzY4RkNBMzhFNTQxMUUxQTMzRUVFMzZFRjUzREEyNiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkgXxbAAAAJbSURBVHjapFNNaBNBFH4zs5vdZLP5M5VJoBQaC1ETryJ4FiXgQfBA8FD0XYQ3L97Uu1UQckHiTcGKF6EIHryIXqL1YGlxUaBmwZzsvdmZ2ZEZfWMyNWkRpLiQN/zmffPee+8x5COcc8/sRHl/mhUlEbkLsNvA6HjkDGADwPuA/gmQB0eAFcdgdqD5AAAA0DRNQxCELw4ODr6+7e3tJz3P2+Y55x5wHOdgb29v5+rq6s/T09OPTNOcAEEQnx8fH68dHR1tAp1OBwQhxGw2g8HgsFqtdiRJes9xnCBJUjLPc49Go7EgCAIPiKIIq1UOil6vB3Qww66EkYX5Nn2c/9DZ2YC2qg4M6n04Go1AtVrdf+2p+tEJ6EYnyCQzsCzLQxAEKJVKxO/390ev13cjgQQ/UbVaD8uNh4PJ5GHY6/UeEEOD+GDQqNFoxwwGg8P8/Pzp95ehDDz4NmhUq9X42NjYV5vNdlxV1RpJEsWtFCeVSsXr8/m/PF6vIx6P3+E5Dv6QLgZ2mc1mxOPxwW63n7jf7wdBEKCqqoZhGFBVdQ/0FXrZY0JtYnHiYD6bneB53nw4HJ5IksQBAKiqCvV6vR+//szMzHzLZrO/v+rT7RGl0Wh8W1xcfMZxXLi7u7sC7TWbTYiiSBiGEZqmJYv/bsLhcLCwsPBK0zSUVbPZbI+9iPF4XK+vr/8AAIMg4OxwOLwGOp2OLwbrcrlOer3eQhiGJRdX+Vut1ol4PP6tVCr1JpPJHVmWf06S1E+5XKY+uu0xtG4IvQN2Ac6OC/8BbALcB0zYhbSgxzsAAAAASUVORK5CYII=
EOL

cp video-stats-extension/icons/icon16.png video-stats-extension/icons/icon48.png
cp video-stats-extension/icons/icon16.png video-stats-extension/icons/icon128.png

echo "Extension files have been set up in the video-stats-extension directory" 