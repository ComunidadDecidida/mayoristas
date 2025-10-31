export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          source: 'syscom' | 'tecnosinergia' | 'manual'
          source_id: string | null
          sku: string
          title: string
          description: string | null
          brand: string | null
          base_price: number
          markup_percentage: number
          final_price: number
          stock: number
          stock_data: Json
          images: Json
          specifications: Json
          is_visible: boolean
          is_manual: boolean
          metadata: Json
          last_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          source: 'syscom' | 'tecnosinergia' | 'manual' | null
          source_id: string | null
          description: string | null
          image_url: string | null
          is_visible: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          description: string | null
          is_visible: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['brands']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['brands']['Insert']>
      }
      carts: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          items: Json
          subtotal: number
          tax: number
          total: number
          currency: 'MXN' | 'USD'
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['carts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['carts']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          session_id: string | null
          items: Json
          subtotal: number
          tax: number
          shipping: number
          total: number
          currency: 'MXN' | 'USD'
          status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_method: 'mercadopago' | 'stripe' | 'paypal' | null
          payment_id: string | null
          payment_status: string | null
          shipping_address: Json | null
          billing_address: Json | null
          customer_info: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      banners: {
        Row: {
          id: string
          title: string
          image_url: string
          link_url: string | null
          is_active: boolean
          sort_order: number
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['banners']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['banners']['Insert']>
      }
      system_config: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['system_config']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['system_config']['Insert']>
      }
    }
  }
}

export interface Product {
  id: string
  source: 'syscom' | 'tecnosinergia' | 'manual'
  sku: string
  title: string
  description?: string
  brand?: string
  base_price: number
  markup_percentage: number
  final_price: number
  stock: number
  images: string[]
  specifications: Record<string, any>
  is_visible: boolean
  is_featured?: boolean
}

export interface CartItem {
  product_id: string
  sku: string
  title: string
  price: number
  quantity: number
  image: string
}

export interface Cart {
  id: string
  session_id: string
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  currency: 'MXN' | 'USD'
}
