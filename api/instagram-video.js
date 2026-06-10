/**
 * Vercel Serverless Function: Instagram Video URL Extractor
 * Scrapes Instagram post pages to extract direct video URLs
 */

export default async function handler(req, res) {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { url } = req.query;

  // Validate Instagram URL
  if (!url || !url.includes('instagram.com')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Instagram URL',
      fallbackUrl: url || ''
    });
  }

  const TIMEOUT_MS = 10000; // 10 seconds

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Fetch Instagram page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Instagram returned ${response.status}`);
    }

    const html = await response.text();

    // Extract video URL from HTML
    const videoUrl = extractVideoUrl(html);
    const thumbnail = extractThumbnail(html);

    if (!videoUrl) {
      throw new Error('Failed to extract video URL from page');
    }

    return res.status(200).json({
      success: true,
      videoUrl,
      thumbnail: thumbnail || videoUrl, // Fallback to video URL if no thumbnail
      cachedAt: Date.now()
    });

  } catch (error) {
    console.error('[instagram-video] Error:', error.message);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'Request timeout',
        fallbackUrl: url
      });
    }

    return res.status(503).json({
      success: false,
      error: error.message,
      fallbackUrl: url
    });
  }
}

/**
 * Extract video URL from Instagram page HTML
 * @param {string} html - Instagram page HTML
 * @returns {string|null} - Video URL or null
 */
function extractVideoUrl(html) {
  // Instagram typically embeds data in <script type="application/ld+json">
  // or in window._sharedData

  // Method 1: Look for video URL in ld+json
  const ldJsonMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (ldJsonMatch) {
    try {
      const data = JSON.parse(ldJsonMatch[1]);
      if (data.video && data.video.contentUrl) {
        return data.video.contentUrl;
      }
    } catch (e) {
      // Continue to next method
    }
  }

  // Method 2: Look for video URL in _sharedData
  const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.*?});<\/script>/s);
  if (sharedDataMatch) {
    try {
      const data = JSON.parse(sharedDataMatch[1]);
      // Navigate through Instagram's data structure
      const media = Object.values(data?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media || {})[0];
      if (media?.video_url) {
        return media.video_url;
      }
    } catch (e) {
      // Continue to next method
    }
  }

  // Method 3: Direct regex search for video URLs
  const videoUrlMatch = html.match(/"video_url":"(https:\/\/[^"]+)"/);
  if (videoUrlMatch) {
    return videoUrlMatch[1].replace(/\\u0026/g, '&');
  }

  return null;
}

/**
 * Extract thumbnail URL from Instagram page HTML
 * @param {string} html - Instagram page HTML
 * @returns {string|null} - Thumbnail URL or null
 */
function extractThumbnail(html) {
  // Look for og:image meta tag
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (ogImageMatch) {
    return ogImageMatch[1];
  }

  // Look for display_url in JSON data
  const displayUrlMatch = html.match(/"display_url":"(https:\/\/[^"]+)"/);
  if (displayUrlMatch) {
    return displayUrlMatch[1].replace(/\\u0026/g, '&');
  }

  return null;
}
