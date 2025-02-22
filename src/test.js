// Test configuration
const TEST_URL = 'https://members.blacked.com/videos/hotel-vixen-season-2-episode-5-pool-pass';
const SPREADSHEET_ID = '1mZmAI_yKHmuUZfUHTgHp_ksJNn9hKWaf2HwvMIcQviM';
const API_KEY = 'AIzaSyBlwxAsK0VK1YKn8QeNpotriJbejVzkvR4';

// Test specific video data
async function testSpecificVideo() {
  console.log('🧪 Testing Specific Video Data...');
  console.log(`URL: ${TEST_URL}`);
  
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/blacked?key=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await response.json();
    if (!data.values || data.values.length < 2) {
      throw new Error('No data found in spreadsheet');
    }

    // Get headers
    const headers = data.values[0];
    console.log('\n📋 Sheet Headers:');
    headers.forEach((header, index) => {
      console.log(`Column ${index}: ${header}`);
    });

    // Print first few rows to understand data structure
    console.log('\n📊 Sample Data (First 3 Rows):');
    data.values.slice(1, 4).forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      row.forEach((value, colIndex) => {
        console.log(`${headers[colIndex]}: ${value}`);
      });
    });

    // Look for the video in the URL column (index 9 based on headers)
    console.log('\n🔍 Searching for video...');
    const matchingRow = data.values.find(row => {
      if (!row[9] || typeof row[9] !== 'string') return false;
      try {
        const rowUrl = row[9].toLowerCase();
        const testUrl = TEST_URL.toLowerCase();
        const matches = rowUrl.includes(testUrl) || testUrl.includes(rowUrl);
        if (matches) {
          console.log('Found matching URL:', row[9]);
        }
        return matches;
      } catch (error) {
        return false;
      }
    });

    if (matchingRow) {
      console.log('\n✅ Found matching video data:');
      matchingRow.forEach((value, index) => {
        console.log(`${headers[index]}: ${value}`);
      });
    } else {
      console.log('\n❌ No exact URL match found');
      
      // Try to find by title or content path
      const videoPath = TEST_URL.split('/videos/')[1].toLowerCase();
      console.log('\nTrying to match by video path:', videoPath);
      
      const fuzzyMatch = data.values.find(row => {
        if (!row[2] || typeof row[2] !== 'string') return false; // Check title column
        const title = row[2].toLowerCase().replace(/[^a-z0-9]/g, '-');
        return title.includes(videoPath) || videoPath.includes(title);
      });

      if (fuzzyMatch) {
        console.log('\n✅ Found fuzzy match by title:');
        fuzzyMatch.forEach((value, index) => {
          console.log(`${headers[index]}: ${value}`);
        });
      } else {
        console.log('\n❌ No matches found by title either');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSpecificVideo(); 