/**
 * CacheManager - LocalStorage wrapper with TTL support
 * Manages video data caching with automatic expiration
 */
class CacheManager {
  constructor(namespace = 'video_cache', ttl = 604800000) {
    this.namespace = namespace;
    this.ttl = ttl; // Default: 7 days in milliseconds
  }

  /**
   * Generate cache key from Instagram URL
   * @param {string} key - Original key (Instagram URL)
   * @returns {string} - Hashed cache key
   */
  _generateKey(key) {
    // Simple djb2 hash function
    let hash = 5381;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) + hash) + key.charCodeAt(i);
    }
    return `${this.namespace}_${Math.abs(hash)}`;
  }

  /**
   * Get cached data for a key
   * @param {string} key - Cache key (Instagram URL)
   * @returns {object|null} - Cached data or null if miss/expired
   */
  get(key) {
    const cacheKey = this._generateKey(key);
    const stored = localStorage.getItem(cacheKey);

    if (!stored) {
      return null; // Cache miss
    }

    try {
      const data = JSON.parse(stored);
      const now = Date.now();

      // Check if expired
      if (data.cachedAt && (now - data.cachedAt > this.ttl)) {
        localStorage.removeItem(cacheKey);
        return null; // Expired
      }

      return data;
    } catch (error) {
      console.warn('[CacheManager] Failed to parse cached data:', error);
      localStorage.removeItem(cacheKey);
      return null;
    }
  }

  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {object} data - Data to cache
   * @returns {boolean} - Success status
   */
  set(key, data) {
    const cacheKey = this._generateKey(key);
    const cacheData = {
      ...data,
      cachedAt: Date.now()
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('[CacheManager] Storage quota exceeded, running cleanup');
        this.cleanup();

        // Retry once after cleanup
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
          return true;
        } catch (retryError) {
          console.error('[CacheManager] Failed to cache after cleanup:', retryError);
          return false;
        }
      }
      console.error('[CacheManager] Failed to cache data:', error);
      return false;
    }
  }

  /**
   * Check if key exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries in namespace
   */
  clear() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.namespace + '_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[CacheManager] Cleared ${keysToRemove.length} cache entries`);
  }

  /**
   * Remove expired entries (garbage collection)
   * @returns {number} - Number of entries removed
   */
  cleanup() {
    let removed = 0;
    const now = Date.now();

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.namespace + '_')) {
        const stored = localStorage.getItem(key);
        try {
          const data = JSON.parse(stored);
          if (data.cachedAt && (now - data.cachedAt > this.ttl)) {
            localStorage.removeItem(key);
            removed++;
          }
        } catch (error) {
          // Invalid data, remove it
          localStorage.removeItem(key);
          removed++;
        }
      }
    }

    console.log(`[CacheManager] Cleanup removed ${removed} entries`);
    return removed;
  }
}
