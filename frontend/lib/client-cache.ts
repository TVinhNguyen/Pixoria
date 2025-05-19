// Simple client-side cache utility for profile data
// This reduces redundant API calls when viewing the same profiles

type CacheItem<T> = {
  data: T;
  timestamp: number;
};

type CacheOptions = {
  expiryTime?: number; // Time in milliseconds before cache expires
};

const DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes default cache

class ClientCache {
  private static instance: ClientCache;
  private cache: Map<string, CacheItem<any>>;
  
  private constructor() {
    this.cache = new Map();
  }
  
  public static getInstance(): ClientCache {
    if (!ClientCache.instance) {
      ClientCache.instance = new ClientCache();
    }
    return ClientCache.instance;
  }
  
  // Set a value in cache with a key
  public set<T>(key: string, value: T, options: CacheOptions = {}): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }
  
  // Get a value from cache if it exists and hasn't expired
  public get<T>(key: string, options: CacheOptions = {}): T | null {
    const item = this.cache.get(key);
    const expiryTime = options.expiryTime || DEFAULT_EXPIRY;
    
    if (!item) return null;
    
    // Check if cache has expired
    const now = Date.now();
    if (now - item.timestamp > expiryTime) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  // Check if a key exists in cache
  public has(key: string, options: CacheOptions = {}): boolean {
    const item = this.cache.get(key);
    const expiryTime = options.expiryTime || DEFAULT_EXPIRY;
    
    if (!item) return false;
    
    // Check if cache has expired
    const now = Date.now();
    if (now - item.timestamp > expiryTime) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  // Clear the entire cache
  public clear(): void {
    this.cache.clear();
  }
  
  // Clear a specific key
  public delete(key: string): void {
    this.cache.delete(key);
  }
}

export default ClientCache.getInstance();