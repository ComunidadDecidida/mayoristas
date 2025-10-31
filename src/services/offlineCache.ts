import type { Product } from '../types/database';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class OfflineCache {
  private readonly DB_NAME = 'mayorista_cache';
  private readonly DB_VERSION = 1;
  private readonly STORE_PRODUCTS = 'products';
  private readonly STORE_CATEGORIES = 'categories';
  private readonly STORE_BRANDS = 'brands';
  private readonly STORE_CONFIG = 'config';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.STORE_PRODUCTS)) {
          const productsStore = db.createObjectStore(this.STORE_PRODUCTS, { keyPath: 'id' });
          productsStore.createIndex('sku', 'sku', { unique: false });
          productsStore.createIndex('brand', 'brand', { unique: false });
          productsStore.createIndex('is_visible', 'is_visible', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.STORE_CATEGORIES)) {
          db.createObjectStore(this.STORE_CATEGORIES, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(this.STORE_BRANDS)) {
          db.createObjectStore(this.STORE_BRANDS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(this.STORE_CONFIG)) {
          db.createObjectStore(this.STORE_CONFIG, { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  async cacheProducts(products: Product[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORE_PRODUCTS], 'readwrite');
    const store = transaction.objectStore(this.STORE_PRODUCTS);

    for (const product of products) {
      store.put(product);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCachedProducts(filters?: {
    search?: string;
    brand?: string;
    visibleOnly?: boolean;
  }): Promise<Product[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORE_PRODUCTS], 'readonly');
    const store = transaction.objectStore(this.STORE_PRODUCTS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        let products = request.result as Product[];

        if (filters?.visibleOnly !== false) {
          products = products.filter(p => p.is_visible);
        }

        if (filters?.brand) {
          products = products.filter(p => p.brand === filters.brand);
        }

        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          products = products.filter(p =>
            p.title.toLowerCase().includes(searchLower) ||
            p.description?.toLowerCase().includes(searchLower) ||
            p.sku.toLowerCase().includes(searchLower)
          );
        }

        resolve(products);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getCachedProduct(id: string): Promise<Product | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORE_PRODUCTS], 'readonly');
    const store = transaction.objectStore(this.STORE_PRODUCTS);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheData<T>(storeName: string, data: T[], keyPath: string = 'id'): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    for (const item of data) {
      store.put(item);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCachedData<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async setConfig(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORE_CONFIG], 'readwrite');
    const store = transaction.objectStore(this.STORE_CONFIG);

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConfig(key: string): Promise<any> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORE_CONFIG], 'readonly');
    const store = transaction.objectStore(this.STORE_CONFIG);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearCache(): Promise<void> {
    const db = await this.ensureDB();
    const storeNames = [this.STORE_PRODUCTS, this.STORE_CATEGORIES, this.STORE_BRANDS];

    const transaction = db.transaction(storeNames, 'readwrite');

    for (const storeName of storeNames) {
      transaction.objectStore(storeName).clear();
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCacheSize(): Promise<number> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORE_PRODUCTS], 'readonly');
    const store = transaction.objectStore(this.STORE_PRODUCTS);

    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }
}

export const offlineCache = new OfflineCache();
