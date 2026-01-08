export default class SoundLoader {
  //@ts-ignore
  private static instance: SoundLoader = null;

  static getInstance(): SoundLoader {
    if (this.instance === null) this.instance = new SoundLoader();

    return this.instance;
  }

  private cache: Map<string, { blob: Blob; lastAccessed: number }> = new Map();
  private maxCacheSize: number = 50; // Maximum number of cached sounds
  private maxCacheBytes: number = 100 * 1024 * 1024; // 100MB max cache size
  private currentCacheBytes: number = 0;

  public loadUrl(url: string): Promise<ArrayBuffer> {
    return new Promise(async (resolve, reject) => {
      const cached = this.cache.get(url);
      if (cached) {
        // Update last accessed time
        cached.lastAccessed = Date.now();
        return resolve(await cached.blob.arrayBuffer());
      }

      fetch(url)
        .then(async (response) => {
          const blob = await response.blob();
          
          // Check cache limits and evict if necessary
          this.evictIfNeeded(blob.size);
          
          // Add to cache
          this.cache.set(url, { blob, lastAccessed: Date.now() });
          this.currentCacheBytes += blob.size;

          return await blob.arrayBuffer();
        })
        .then((buffer) => {
          resolve(buffer);
        })
        .catch(reject);
    });
  }

  private evictIfNeeded(incomingSize: number): void {
    // Evict if we exceed max entries or max size
    while (
      this.cache.size >= this.maxCacheSize ||
      this.currentCacheBytes + incomingSize > this.maxCacheBytes
    ) {
      if (this.cache.size === 0) break;

      // Find least recently used entry
      let lruKey: string | null = null;
      let lruTime = Infinity;

      for (const [key, value] of this.cache.entries()) {
        if (value.lastAccessed < lruTime) {
          lruTime = value.lastAccessed;
          lruKey = key;
        }
      }

      if (lruKey) {
        const entry = this.cache.get(lruKey);
        if (entry) {
          this.currentCacheBytes -= entry.blob.size;
        }
        this.cache.delete(lruKey);
      }
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.currentCacheBytes = 0;
  }
}
