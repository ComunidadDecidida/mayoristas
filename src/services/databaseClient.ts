import { supabase } from '../lib/supabase';
import { localConfigService } from './localConfigService';
import { offlineCache } from './offlineCache';

export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

export interface QueryOptions {
  select?: string;
  eq?: Record<string, any>;
  or?: string;
  order?: { column: string; ascending: boolean };
  range?: { from: number; to: number };
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
}

class DatabaseClient {
  private isOnline: boolean = true;
  private connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.checkConnection();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.connectionStatus = 'disconnected';
      });
    }
  }

  async checkConnection(): Promise<boolean> {
    const config = localConfigService.getConfig();

    if (!config?.database?.enabled) {
      this.connectionStatus = 'disconnected';
      return false;
    }

    try {
      if (config.database.mode === 'edge_function') {
        const response = await supabase.functions.invoke(
          config.database.edgeFunction.functionName,
          {
            body: { action: 'ping' },
          }
        );

        if (response.error) {
          this.connectionStatus = 'error';
          return false;
        }

        this.connectionStatus = 'connected';
        return true;
      } else {
        const { error } = await supabase.from('products').select('id').limit(1);
        this.connectionStatus = error ? 'error' : 'connected';
        return !error;
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      this.connectionStatus = 'error';
      return false;
    }
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'error' {
    return this.connectionStatus;
  }

  async query<T>(
    table: string,
    options: QueryOptions = {}
  ): Promise<DatabaseResponse<T[]>> {
    const config = localConfigService.getConfig();

    if (!config?.database?.enabled || !this.isOnline) {
      return this.queryOffline<T>(table, options);
    }

    try {
      if (config.database.mode === 'edge_function') {
        return await this.queryViaEdgeFunction<T>(table, options);
      } else {
        return await this.queryViaSupabase<T>(table, options);
      }
    } catch (error) {
      console.error('Query error, falling back to offline cache:', error);
      return this.queryOffline<T>(table, options);
    }
  }

  private async queryViaSupabase<T>(
    table: string,
    options: QueryOptions
  ): Promise<DatabaseResponse<T[]>> {
    try {
      let query = supabase.from(table).select(options.select || '*', {
        count: 'exact',
      });

      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options.or) {
        query = query.or(options.or);
      }

      if (options.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending,
        });
      }

      if (options.range) {
        query = query.range(options.range.from, options.range.to);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: new Error(error.message), count: 0 };
      }

      if (table === 'products' && data) {
        await offlineCache.cacheProducts(data as any);
      }

      if (options.single || options.maybeSingle) {
        return {
          data: data && data.length > 0 ? (data[0] as T[]) : null,
          error: null,
          count: data?.length || 0,
        };
      }

      return { data: data as T[], error: null, count: count || 0 };
    } catch (error: any) {
      return { data: null, error, count: 0 };
    }
  }

  private async queryViaEdgeFunction<T>(
    table: string,
    options: QueryOptions
  ): Promise<DatabaseResponse<T[]>> {
    const config = localConfigService.getConfig();

    if (!config?.database?.edgeFunction) {
      return { data: null, error: new Error('Edge function not configured'), count: 0 };
    }

    try {
      const response = await supabase.functions.invoke(
        config.database.edgeFunction.functionName,
        {
          body: {
            action: 'query',
            table,
            options,
          },
        }
      );

      if (response.error) {
        return { data: null, error: response.error, count: 0 };
      }

      const result = response.data;

      if (table === 'products' && result.data) {
        await offlineCache.cacheProducts(result.data);
      }

      return {
        data: result.data,
        error: null,
        count: result.count || 0,
      };
    } catch (error: any) {
      return { data: null, error, count: 0 };
    }
  }

  private async queryOffline<T>(
    table: string,
    options: QueryOptions
  ): Promise<DatabaseResponse<T[]>> {
    try {
      if (!offlineCache.isAvailable()) {
        return {
          data: null,
          error: new Error('Offline cache not available'),
          count: 0,
        };
      }

      if (table === 'products') {
        const filters: any = {};

        if (options.eq?.is_visible !== undefined) {
          filters.visibleOnly = options.eq.is_visible;
        }

        if (options.eq?.brand) {
          filters.brand = options.eq.brand;
        }

        const products = await offlineCache.getCachedProducts(filters);
        return { data: products as T[], error: null, count: products.length };
      }

      const data = await offlineCache.getCachedData<T>(table);
      return { data, error: null, count: data.length };
    } catch (error: any) {
      return { data: null, error, count: 0 };
    }
  }

  async insert<T>(
    table: string,
    data: Partial<T>
  ): Promise<DatabaseResponse<T>> {
    const config = localConfigService.getConfig();

    if (!config?.database?.enabled || !this.isOnline) {
      return {
        data: null,
        error: new Error('Database not available for write operations'),
      };
    }

    try {
      if (config.database.mode === 'edge_function') {
        const response = await supabase.functions.invoke(
          config.database.edgeFunction.functionName,
          {
            body: {
              action: 'insert',
              table,
              data,
            },
          }
        );

        if (response.error) {
          return { data: null, error: response.error };
        }

        return { data: response.data.data, error: null };
      } else {
        const { data: result, error } = await supabase
          .from(table)
          .insert(data as any)
          .select()
          .single();

        if (error) {
          return { data: null, error: new Error(error.message) };
        }

        return { data: result as T, error: null };
      }
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async update<T>(
    table: string,
    id: string,
    updates: Partial<T>
  ): Promise<DatabaseResponse<T>> {
    const config = localConfigService.getConfig();

    if (!config?.database?.enabled || !this.isOnline) {
      return {
        data: null,
        error: new Error('Database not available for write operations'),
      };
    }

    try {
      if (config.database.mode === 'edge_function') {
        const response = await supabase.functions.invoke(
          config.database.edgeFunction.functionName,
          {
            body: {
              action: 'update',
              table,
              id,
              updates,
            },
          }
        );

        if (response.error) {
          return { data: null, error: response.error };
        }

        return { data: response.data.data, error: null };
      } else {
        const { data: result, error } = await supabase
          .from(table)
          .update({ ...updates, updated_at: new Date().toISOString() } as any)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return { data: null, error: new Error(error.message) };
        }

        return { data: result as T, error: null };
      }
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async delete(table: string, id: string): Promise<DatabaseResponse<void>> {
    const config = localConfigService.getConfig();

    if (!config?.database?.enabled || !this.isOnline) {
      return {
        data: null,
        error: new Error('Database not available for write operations'),
      };
    }

    try {
      if (config.database.mode === 'edge_function') {
        const response = await supabase.functions.invoke(
          config.database.edgeFunction.functionName,
          {
            body: {
              action: 'delete',
              table,
              id,
            },
          }
        );

        if (response.error) {
          return { data: null, error: response.error };
        }

        return { data: null, error: null };
      } else {
        const { error } = await supabase.from(table).delete().eq('id', id);

        if (error) {
          return { data: null, error: new Error(error.message) };
        }

        return { data: null, error: null };
      }
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async invokeFunction(functionName: string, body: any): Promise<any> {
    return supabase.functions.invoke(functionName, { body });
  }
}

export const dbClient = new DatabaseClient();
