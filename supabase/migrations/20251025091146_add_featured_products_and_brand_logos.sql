/*
  # Agregar campos para productos destacados y logos de marcas

  1. Cambios en products
    - Agregar campo is_featured (boolean) para productos destacados
    
  2. Cambios en brands
    - Campo logo_url ya existe, solo asegurar que esté disponible
    
  3. Índices
    - Agregar índice para is_featured para consultas rápidas
*/

-- Agregar campo is_featured a products si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE products ADD COLUMN is_featured boolean DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
  END IF;
END $$;