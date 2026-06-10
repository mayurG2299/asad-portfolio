/**
 * Brand Configuration
 * Maps portfolio videos to brand names and descriptions
 */

// Brand mapping by Instagram username or reel ID
const BRAND_MAP = {
  // Fitpage (Current Employer)
  'fitpage': {
    name: 'Fitpage',
    description: 'Fitness app promotional content'
  },

  // India Running
  'indiarunning': {
    name: 'India Running',
    description: 'Running community event coverage'
  },

  // Captured
  'captured': {
    name: 'Captured',
    description: 'Professional event videography'
  },

  // Ascend
  'ascend': {
    name: 'Ascend',
    description: 'Brand promotional videos'
  },

  // VS
  'vs': {
    name: 'VS',
    description: 'Creative video projects'
  },

  // Wesness
  'wesness': {
    name: 'Wesness',
    description: 'Wellness brand content'
  },

  // BAPHM
  'baphm': {
    name: 'BAPHM',
    description: 'Fashion and lifestyle content'
  },

  // Default fallback
  'default': {
    name: 'Client Project',
    description: 'Professional video editing'
  }
};

/**
 * Extract brand info from Instagram URL
 * @param {string} instagramUrl - Instagram post URL
 * @returns {object} - Brand info { name, description }
 */
function getBrandInfo(instagramUrl) {
  // Try to extract username from URL patterns:
  // https://www.instagram.com/reel/ABC123/
  // https://www.instagram.com/username/reel/ABC123/

  const url = instagramUrl.toLowerCase();

  // Check each brand username in the URL
  for (const [username, info] of Object.entries(BRAND_MAP)) {
    if (username !== 'default' && url.includes(username)) {
      return info;
    }
  }

  // Fallback to default
  return BRAND_MAP.default;
}
