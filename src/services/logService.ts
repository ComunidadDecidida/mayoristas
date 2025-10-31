import { supabase } from '../lib/supabase';

export interface LogEntry {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  source: string;
  message: string;
  details?: any;
  created_at: string;
}

export interface ApiSyncLog {
  id: string;
  source: 'syscom' | 'tecnosinergia';
  sync_type: string;
  status: 'running' | 'success' | 'error';
  products_synced: number;
  errors: any[];
  started_at: string;
  completed_at: string;
  created_at: string;
}

export const logService = {
  async getRecentLogs(limit: number = 100): Promise<LogEntry[]> {
    try {
      const { data: syncLogs, error } = await supabase
        .from('api_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (syncLogs || []).map(log => ({
        id: log.id,
        level: log.status === 'success' ? 'success' : log.status === 'error' ? 'error' : 'info',
        source: log.source,
        message: `${log.sync_type} sync ${log.status}`,
        details: {
          products_synced: log.products_synced,
          errors: log.errors,
          started_at: log.started_at,
          completed_at: log.completed_at,
        },
        created_at: log.created_at,
      }));
    } catch (error) {
      console.error('Error loading logs:', error);
      return [];
    }
  },

  async getSyncLogs(source?: string, limit: number = 50): Promise<ApiSyncLog[]> {
    try {
      let query = supabase
        .from('api_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (source) {
        query = query.eq('source', source);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading sync logs:', error);
      return [];
    }
  },

  async getErrorLogs(limit: number = 50): Promise<ApiSyncLog[]> {
    try {
      const { data, error } = await supabase
        .from('api_sync_logs')
        .select('*')
        .eq('status', 'error')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading error logs:', error);
      return [];
    }
  },

  async getLogStats() {
    try {
      const { data, error } = await supabase
        .from('api_sync_logs')
        .select('source, status, products_synced');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        success: data?.filter(l => l.status === 'success').length || 0,
        errors: data?.filter(l => l.status === 'error').length || 0,
        running: data?.filter(l => l.status === 'running').length || 0,
        totalProductsSynced: data?.reduce((sum, l) => sum + (l.products_synced || 0), 0) || 0,
        bySyscource: {
          syscom: {
            total: data?.filter(l => l.source === 'syscom').length || 0,
            success: data?.filter(l => l.source === 'syscom' && l.status === 'success').length || 0,
            errors: data?.filter(l => l.source === 'syscom' && l.status === 'error').length || 0,
          },
          tecnosinergia: {
            total: data?.filter(l => l.source === 'tecnosinergia').length || 0,
            success: data?.filter(l => l.source === 'tecnosinergia' && l.status === 'success').length || 0,
            errors: data?.filter(l => l.source === 'tecnosinergia' && l.status === 'error').length || 0,
          },
        },
      };

      return stats;
    } catch (error) {
      console.error('Error loading log stats:', error);
      return null;
    }
  },

  async clearOldLogs(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('api_sync_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error clearing old logs:', error);
      return { success: false, error };
    }
  },
};
