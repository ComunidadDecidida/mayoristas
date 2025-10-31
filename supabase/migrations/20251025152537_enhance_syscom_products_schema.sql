/*
  # Enhance SYSCOM Products Schema

  1. New Fields Added
    - garantia: Warranty period (e.g., "3 años", "5 años")
    - sat_description: SAT description for tax purposes
    - peso: Product weight in kg
    - alto: Height in cm
    - largo: Length in cm
    - ancho: Width in cm
    - unidad_de_medida: Unit of measure (JSONB with codigo_unidad, nombre, clave_unidad_sat)
    - pvol: Special price volume indicator
    - link_privado: Private product link from SYSCOM
    - imagen_360: Array of 360° image paths
    - precios_volumen: JSONB for volume pricing (e.g., {"3": "34.70", "10": "32.50"})
  
  2. Schema Updates
    - Add all missing fields from SYSCOM API
    - Maintain backward compatibility
    - Add indexes for new searchable fields
  
  3. Notes
    - Fields may contain "-" which should be treated as null
    - All price fields support volume pricing
    - Categories contain 3 levels of hierarchy
*/

-- Add missing fields to syscom_products table
DO $$
BEGIN
  -- Warranty field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'garantia'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN garantia text;
  END IF;

  -- SAT description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'sat_description'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN sat_description text;
  END IF;

  -- Physical dimensions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'peso'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN peso numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'alto'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN alto numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'largo'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN largo numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'ancho'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN ancho numeric;
  END IF;

  -- Unit of measure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'unidad_de_medida'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN unidad_de_medida jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Volume price indicator
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'pvol'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN pvol text;
  END IF;

  -- Private link
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'link_privado'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN link_privado text;
  END IF;

  -- 360 images
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'imagen_360'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN imagen_360 jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Volume pricing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'precios_volumen'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN precios_volumen jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Link field (short link from API)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'link'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN link text;
  END IF;

  -- Existence details (asterisco structure)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syscom_products' AND column_name = 'existencia_asterisco'
  ) THEN
    ALTER TABLE syscom_products ADD COLUMN existencia_asterisco jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add indexes for new searchable fields
CREATE INDEX IF NOT EXISTS idx_syscom_products_marca_text 
  ON syscom_products(marca text_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_syscom_products_garantia 
  ON syscom_products(garantia) WHERE garantia IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_syscom_products_peso 
  ON syscom_products(peso) WHERE peso IS NOT NULL;

-- Add comments for new fields
COMMENT ON COLUMN syscom_products.garantia IS 'Warranty period (e.g., "3 años", "5 años")';
COMMENT ON COLUMN syscom_products.sat_description IS 'SAT catalog description for tax purposes';
COMMENT ON COLUMN syscom_products.peso IS 'Product weight in kilograms';
COMMENT ON COLUMN syscom_products.alto IS 'Height in centimeters';
COMMENT ON COLUMN syscom_products.largo IS 'Length in centimeters';
COMMENT ON COLUMN syscom_products.ancho IS 'Width in centimeters';
COMMENT ON COLUMN syscom_products.unidad_de_medida IS 'Unit of measure: {codigo_unidad, nombre, clave_unidad_sat}';
COMMENT ON COLUMN syscom_products.pvol IS 'Volume price indicator';
COMMENT ON COLUMN syscom_products.link_privado IS 'Private product information link from SYSCOM';
COMMENT ON COLUMN syscom_products.imagen_360 IS 'Array of 360° image paths';
COMMENT ON COLUMN syscom_products.precios_volumen IS 'Volume pricing structure: {"qty": "price"}';
COMMENT ON COLUMN syscom_products.existencia_asterisco IS 'Detailed stock breakdown by warehouse: {a, b, c, d}';