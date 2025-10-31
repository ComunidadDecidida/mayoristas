import { supabase } from '../lib/supabase';

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  sort_order: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export const bannerService = {
  /**
   * Get all banners
   */
  async getBanners() {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get active banners for public display
   */
  async getActiveBanners() {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create new banner
   */
  async createBanner(banner: Omit<Banner, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('banners')
      .insert([banner])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update banner
   */
  async updateBanner(id: string, updates: Partial<Banner>) {
    const { data, error } = await supabase
      .from('banners')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete banner
   */
  async deleteBanner(id: string) {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Toggle banner active status
   */
  async toggleBannerStatus(id: string, isActive: boolean) {
    return this.updateBanner(id, { is_active: isActive });
  },

  /**
   * Reorder banners
   */
  async reorderBanners(banners: { id: string; sort_order: number }[]) {
    const promises = banners.map((banner) =>
      this.updateBanner(banner.id, { sort_order: banner.sort_order })
    );

    await Promise.all(promises);
  },
};
