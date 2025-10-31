/*
  # Optimizar índices de syscom_products
  
  1. Índices adicionales
    - Índice compuesto para búsquedas por marca y stock
    - Índice para búsqueda de productos destacados con stock
    - Índice para ordenamiento por precio final
    - Índice GIN mejorado para búsqueda de texto completo en descripción
  
  2. Optimizaciones
    - Índices parciales para consultas frecuentes
    - Índices compuestos para filtros combinados
*/

CREATE INDEX IF NOT EXISTS idx_syscom_products_marca_stock 
  ON syscom_products(marca, total_existencia) 
  WHERE is_visible = true AND total_existencia > 0;

CREATE INDEX IF NOT EXISTS idx_syscom_products_featured_stock 
  ON syscom_products(is_featured, total_existencia, created_at DESC) 
  WHERE is_visible = true AND is_featured = true AND total_existencia > 0;

CREATE INDEX IF NOT EXISTS idx_syscom_products_price 
  ON syscom_products(final_price) 
  WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_syscom_products_descripcion_search 
  ON syscom_products USING gin(to_tsvector('spanish', descripcion)) 
  WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_syscom_products_last_sync 
  ON syscom_products(last_sync DESC) 
  WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_syscom_products_categorias 
  ON syscom_products USING gin(categorias);

COMMENT ON INDEX idx_syscom_products_marca_stock IS 'Índice compuesto para búsquedas por marca con stock disponible';
COMMENT ON INDEX idx_syscom_products_featured_stock IS 'Índice para productos destacados con stock';
COMMENT ON INDEX idx_syscom_products_price IS 'Índice para ordenamiento por precio';
COMMENT ON INDEX idx_syscom_products_categorias IS 'Índice GIN para búsqueda en categorías JSONB';
