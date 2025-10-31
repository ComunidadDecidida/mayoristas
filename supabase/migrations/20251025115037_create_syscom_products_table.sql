/*
  # Crear tabla para productos de SYSCOM
  
  1. Nueva tabla
    - `syscom_products` - Productos sincronizados de la API de SYSCOM
    - Estructura específica para datos de SYSCOM
    - Campos separados para mejor organización
  
  2. Seguridad
    - Enable RLS
    - Políticas para lectura pública
    - Políticas para admin
*/

-- Crear tabla para productos SYSCOM
CREATE TABLE IF NOT EXISTS syscom_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores SYSCOM
  producto_id text NOT NULL UNIQUE,
  modelo text NOT NULL UNIQUE,
  sat_key text,
  
  -- Información básica
  titulo text NOT NULL,
  descripcion text,
  marca text,
  marca_logo text,
  
  -- Precios
  precio_lista numeric NOT NULL DEFAULT 0,
  precio_especial numeric,
  precio_descuento numeric,
  
  -- Inventario
  total_existencia integer NOT NULL DEFAULT 0,
  existencia jsonb DEFAULT '{}'::jsonb,
  
  -- Medios
  img_portada text,
  imagenes jsonb DEFAULT '[]'::jsonb,
  recursos jsonb DEFAULT '[]'::jsonb,
  
  -- Categorías y clasificación
  categorias jsonb DEFAULT '[]'::jsonb,
  iconos jsonb DEFAULT '{}'::jsonb,
  caracteristicas jsonb DEFAULT '[]'::jsonb,
  
  -- Productos relacionados
  productos_relacionados jsonb DEFAULT '[]'::jsonb,
  accesorios jsonb DEFAULT '[]'::jsonb,
  
  -- Configuración
  markup_percentage numeric NOT NULL DEFAULT 20,
  final_price numeric NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  
  -- Metadata
  link_syscom text,
  last_sync timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para búsqueda y rendimiento
CREATE INDEX IF NOT EXISTS idx_syscom_products_producto_id ON syscom_products(producto_id);
CREATE INDEX IF NOT EXISTS idx_syscom_products_modelo ON syscom_products(modelo);
CREATE INDEX IF NOT EXISTS idx_syscom_products_marca ON syscom_products(marca);
CREATE INDEX IF NOT EXISTS idx_syscom_products_visible ON syscom_products(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_syscom_products_featured ON syscom_products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_syscom_products_stock ON syscom_products(total_existencia) WHERE total_existencia > 0;
CREATE INDEX IF NOT EXISTS idx_syscom_products_titulo_search ON syscom_products USING gin(to_tsvector('spanish', titulo));

-- Enable RLS
ALTER TABLE syscom_products ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver productos visibles
CREATE POLICY "Anyone can view visible syscom products"
  ON syscom_products FOR SELECT
  USING (is_visible = true);

-- Política: Permitir todas las operaciones (para desarrollo/admin)
CREATE POLICY "Allow all operations for development"
  ON syscom_products FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_syscom_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER syscom_products_updated_at
  BEFORE UPDATE ON syscom_products
  FOR EACH ROW
  EXECUTE FUNCTION update_syscom_products_updated_at();

-- Comentarios
COMMENT ON TABLE syscom_products IS 'Productos sincronizados desde la API de SYSCOM';
COMMENT ON COLUMN syscom_products.producto_id IS 'ID único del producto en SYSCOM';
COMMENT ON COLUMN syscom_products.modelo IS 'Modelo/SKU del producto';
COMMENT ON COLUMN syscom_products.markup_percentage IS 'Porcentaje de ganancia aplicado';
COMMENT ON COLUMN syscom_products.final_price IS 'Precio final con markup aplicado';
