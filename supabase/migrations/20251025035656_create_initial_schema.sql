/*
  # Esquema inicial para Mayorista de Sistemas Comunicaciones y Redes de México
  
  ## Nuevas Tablas
  
  ### Configuración del Sistema
    - `system_config` - Configuración general del sitio
      - `id` (uuid, primary key)
      - `key` (text, unique) - Llave de configuración
      - `value` (jsonb) - Valor de configuración
      - `description` (text) - Descripción
      - `created_at`, `updated_at` (timestamptz)
  
  ### Productos
    - `products` - Catálogo de productos
      - `id` (uuid, primary key)
      - `source` (text) - 'syscom' o 'tecnosinergia' o 'manual'
      - `source_id` (text) - ID del producto en la API de origen
      - `sku` (text, unique)
      - `title` (text)
      - `description` (text)
      - `brand` (text)
      - `base_price` (decimal) - Precio base desde API
      - `markup_percentage` (decimal) - Porcentaje de ganancia
      - `final_price` (decimal) - Precio final calculado
      - `stock` (integer)
      - `stock_data` (jsonb) - Datos de stock por sucursal
      - `images` (jsonb) - Array de URLs de imágenes
      - `specifications` (jsonb) - Especificaciones del producto
      - `is_visible` (boolean) - Mostrar/ocultar producto
      - `is_manual` (boolean) - Producto creado manualmente
      - `metadata` (jsonb) - Datos adicionales de la API
      - `last_sync` (timestamptz) - Última sincronización con API
      - `created_at`, `updated_at` (timestamptz)
  
  ### Categorías
    - `categories` - Categorías de productos
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)
      - `parent_id` (uuid) - Referencia a categoría padre
      - `source` (text) - 'syscom', 'tecnosinergia', 'manual'
      - `source_id` (text) - ID en la API de origen
      - `description` (text)
      - `image_url` (text)
      - `is_visible` (boolean)
      - `sort_order` (integer)
      - `created_at`, `updated_at` (timestamptz)
  
    - `product_categories` - Relación muchos a muchos
      - `product_id` (uuid, foreign key)
      - `category_id` (uuid, foreign key)
      - Primary key compuesta
  
  ### Marcas
    - `brands` - Marcas de productos
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique)
      - `logo_url` (text)
      - `description` (text)
      - `is_visible` (boolean)
      - `sort_order` (integer)
      - `created_at`, `updated_at` (timestamptz)
  
  ### Carritos
    - `carts` - Carritos de compra
      - `id` (uuid, primary key)
      - `session_id` (text, unique) - ID de sesión de cookie
      - `user_id` (uuid) - Usuario si está autenticado
      - `items` (jsonb) - Array de items del carrito
      - `subtotal` (decimal)
      - `tax` (decimal)
      - `total` (decimal)
      - `currency` (text) - MXN o USD
      - `expires_at` (timestamptz) - Expiración configurable
      - `created_at`, `updated_at` (timestamptz)
  
  ### Pedidos
    - `orders` - Pedidos realizados
      - `id` (uuid, primary key)
      - `order_number` (text, unique)
      - `user_id` (uuid)
      - `session_id` (text)
      - `items` (jsonb)
      - `subtotal` (decimal)
      - `tax` (decimal)
      - `shipping` (decimal)
      - `total` (decimal)
      - `currency` (text)
      - `status` (text) - pending, paid, processing, shipped, delivered, cancelled
      - `payment_method` (text) - mercadopago, stripe, paypal
      - `payment_id` (text)
      - `payment_status` (text)
      - `shipping_address` (jsonb)
      - `billing_address` (jsonb)
      - `customer_info` (jsonb)
      - `notes` (text)
      - `created_at`, `updated_at` (timestamptz)
  
  ### Banners y Promociones
    - `banners` - Banners del carrusel
      - `id` (uuid, primary key)
      - `title` (text)
      - `image_url` (text)
      - `link_url` (text)
      - `is_active` (boolean)
      - `sort_order` (integer)
      - `start_date`, `end_date` (timestamptz)
      - `created_at`, `updated_at` (timestamptz)
  
  ### Sincronización de APIs
    - `api_sync_logs` - Logs de sincronización
      - `id` (uuid, primary key)
      - `source` (text) - 'syscom' o 'tecnosinergia'
      - `sync_type` (text) - 'products', 'categories', 'stock'
      - `status` (text) - 'running', 'success', 'error'
      - `products_synced` (integer)
      - `errors` (jsonb)
      - `started_at`, `completed_at` (timestamptz)
      - `created_at` (timestamptz)
  
  ### Configuración de Notificaciones
    - `notification_config` - Configuración de WhatsApp y Telegram
      - `id` (uuid, primary key)
      - `service` (text) - 'whatsapp' o 'telegram'
      - `is_enabled` (boolean)
      - `config` (jsonb) - Configuración específica del servicio
      - `created_at`, `updated_at` (timestamptz)
  
  ## Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para acceso público a productos y categorías
    - Políticas para administradores con acceso completo
*/

-- Crear tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('syscom', 'tecnosinergia', 'manual')),
  source_id text,
  sku text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  brand text,
  base_price decimal(10,2) NOT NULL DEFAULT 0,
  markup_percentage decimal(5,2) NOT NULL DEFAULT 0,
  final_price decimal(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  stock_data jsonb DEFAULT '{}',
  images jsonb DEFAULT '[]',
  specifications jsonb DEFAULT '{}',
  is_visible boolean DEFAULT true,
  is_manual boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
CREATE INDEX IF NOT EXISTS idx_products_source_id ON products(source_id);
CREATE INDEX IF NOT EXISTS idx_products_is_visible ON products(is_visible);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  source text CHECK (source IN ('syscom', 'tecnosinergia', 'manual')),
  source_id text,
  description text,
  image_url text,
  is_visible boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_visible ON categories(is_visible);

-- Crear tabla de relación producto-categoría
CREATE TABLE IF NOT EXISTS product_categories (
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

-- Crear tabla de marcas
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  description text,
  is_visible boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_is_visible ON brands(is_visible);

-- Crear tabla de carritos
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid,
  items jsonb DEFAULT '[]',
  subtotal decimal(10,2) DEFAULT 0,
  tax decimal(10,2) DEFAULT 0,
  total decimal(10,2) DEFAULT 0,
  currency text DEFAULT 'MXN' CHECK (currency IN ('MXN', 'USD')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_expires_at ON carts(expires_at);

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid,
  session_id text,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  tax decimal(10,2) NOT NULL DEFAULT 0,
  shipping decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'MXN' CHECK (currency IN ('MXN', 'USD')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text CHECK (payment_method IN ('mercadopago', 'stripe', 'paypal')),
  payment_id text,
  payment_status text,
  shipping_address jsonb,
  billing_address jsonb,
  customer_info jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Crear tabla de banners
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON banners(sort_order);

-- Crear tabla de logs de sincronización
CREATE TABLE IF NOT EXISTS api_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('syscom', 'tecnosinergia')),
  sync_type text NOT NULL CHECK (sync_type IN ('products', 'categories', 'stock', 'full')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  products_synced integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_sync_logs_source ON api_sync_logs(source);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_status ON api_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_created_at ON api_sync_logs(created_at DESC);

-- Crear tabla de configuración de notificaciones
CREATE TABLE IF NOT EXISTS notification_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text UNIQUE NOT NULL CHECK (service IN ('whatsapp', 'telegram')),
  is_enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_config ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso público de lectura a productos, categorías y marcas
CREATE POLICY "Productos visibles son públicos"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Categorías visibles son públicas"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Relaciones producto-categoría son públicas"
  ON product_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Marcas visibles son públicas"
  ON brands FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Banners activos son públicos"
  ON banners FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Políticas para carritos (acceso basado en session_id)
CREATE POLICY "Usuarios pueden ver su propio carrito"
  ON carts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Usuarios pueden crear carritos"
  ON carts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar su carrito"
  ON carts FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Políticas para pedidos
CREATE POLICY "Usuarios pueden crear pedidos"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden ver sus propios pedidos"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insertar configuración inicial del sistema
INSERT INTO system_config (key, value, description) VALUES
  ('global_markup_percentage', '20', 'Porcentaje de ganancia global para todos los productos'),
  ('show_iva', 'true', 'Mostrar precios con IVA'),
  ('iva_percentage', '16', 'Porcentaje de IVA'),
  ('cart_expiration_days', '7', 'Días de expiración del carrito'),
  ('exchange_rate', '{"MXN": 1, "USD": 17.5}', 'Tipo de cambio'),
  ('sync_schedule', '{"enabled": true, "frequency": "daily", "time": "02:00"}', 'Programación de sincronización automática')
ON CONFLICT (key) DO NOTHING;

-- Insertar configuración de notificaciones
INSERT INTO notification_config (service, is_enabled, config) VALUES
  ('whatsapp', false, '{"phone": "", "api_token": ""}'),
  ('telegram', false, '{"bot_token": "", "chat_id": ""}')
ON CONFLICT (service) DO NOTHING;