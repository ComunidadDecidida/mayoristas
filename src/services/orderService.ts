import { supabase } from '../lib/supabase';

export interface OrderFilters {
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

export const orderService = {
  /**
   * Get orders with filters and pagination
   */
  async getOrders(
    filters: OrderFilters = {},
    page: number = 1,
    limit: number = 10
  ) {
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.paymentMethod) {
      query = query.eq('payment_method', filters.paymentMethod);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters.search) {
      query = query.or(
        `order_number.ilike.%${filters.search}%,customer_info->name.ilike.%${filters.search}%`
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    return {
      orders: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  /**
   * Get order by ID
   */
  async getOrderById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: string, notes?: string) {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Add note to order
   */
  async addOrderNote(id: string, note: string) {
    const order = await this.getOrderById(id);
    if (!order) throw new Error('Pedido no encontrado');

    const currentNotes = order.notes || '';
    const timestamp = new Date().toLocaleString('es-MX');
    const newNote = `[${timestamp}] ${note}`;
    const updatedNotes = currentNotes
      ? `${currentNotes}\n${newNote}`
      : newNote;

    return this.updateOrderStatus(id, order.status, updatedNotes);
  },

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<OrderStats> {
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('total, status');

    if (allError) throw allError;

    const stats: OrderStats = {
      totalOrders: allOrders?.length || 0,
      totalRevenue: allOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0,
      pendingOrders: allOrders?.filter(o => o.status === 'pending').length || 0,
      completedOrders: allOrders?.filter(o => o.status === 'delivered').length || 0,
    };

    return stats;
  },

  /**
   * Get orders for current month
   */
  async getMonthlyOrders() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get recent orders
   */
  async getRecentOrders(limit: number = 5) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
