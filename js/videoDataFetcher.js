/**
 * VideoDataFetcher - API client for fetching video data
 * Handles caching, retries, and batch processing
 */
class VideoDataFetcher {
  constructor(cacheManager) {
    this.cache = cacheManager || new CacheManager();
    this.apiEndpoint = '/api/instagram-video';
    this.maxRetries = 2;
    this.retryDelays = [1000, 2000]; // ms
  }

  /**
   * Fetch video data for a single Instagram URL
   * @param {string} instagramUrl - Instagram post URL
   * @returns {Promise<object>} - Video data or error object
   */
  async fetchVideoData(instagramUrl) {
    // Check cache first
    const cached = this.cache.get(instagramUrl);
    if (cached) {
      console.log('[VideoDataFetcher] Cache hit for:', instagramUrl);
      return cached;
    }

    console.log('[VideoDataFetcher] Cache miss, fetching:', instagramUrl);

    // Fetch from API with retries
    const videoData = await this._fetchWithRetry(instagramUrl);

    // Cache successful results
    if (videoData.success) {
      this.cache.set(instagramUrl, videoData);
    }

    return videoData;
  }

  /**
   * Fetch with retry logic
   * @param {string} instagramUrl - Instagram URL
   * @returns {Promise<object>} - Video data
   */
  async _fetchWithRetry(instagramUrl) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(
          `${this.apiEndpoint}?url=${encodeURIComponent(instagramUrl)}`
        );

        const data = await response.json();

        if (response.ok) {
          return data;
        }

        // Server returned error, don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          return data; // Return error object with fallback
        }

        lastError = data;
      } catch (error) {
        lastError = {
          success: false,
          error: error.message,
          fallbackUrl: instagramUrl
        };
      }

      // Wait before retry (if not last attempt)
      if (attempt < this.maxRetries) {
        await this._delay(this.retryDelays[attempt]);
        console.log(`[VideoDataFetcher] Retry ${attempt + 1} for:`, instagramUrl);
      }
    }

    // All retries exhausted
    console.error('[VideoDataFetcher] All retries failed for:', instagramUrl);
    return lastError;
  }

  /**
   * Delay helper for retry backoff
   * @param {number} ms - Milliseconds to delay
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch fetch multiple videos with concurrency limit
   * @param {string[]} urls - Array of Instagram URLs
   * @param {number} concurrency - Max parallel requests (default: 5)
   * @returns {Promise<object[]>} - Array of video data objects
   */
  async fetchBatch(urls, concurrency = 5) {
    const results = [];

    // Process in batches
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(url => this.fetchVideoData(url))
      );

      // Extract values from settled promises
      const batchData = batchResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error('[VideoDataFetcher] Batch fetch failed:', batch[index], result.reason);
          return {
            success: false,
            error: result.reason.message,
            fallbackUrl: batch[index]
          };
        }
      });

      results.push(...batchData);

      console.log(`[VideoDataFetcher] Processed batch ${Math.floor(i / concurrency) + 1}, total: ${results.length}/${urls.length}`);
    }

    return results;
  }
}
