/*
  # Fix Image Storage and Product Categories

  1. Changes
    - Ensures images bucket exists with public access
    - Creates product_categories policies
    - Adds indexes for better performance
    
  2. Security
    - Public bucket for images
    - RLS on product_categories table
*/

-- Create images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Access to images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
END $$;

-- Allow public access to images bucket
CREATE POLICY "Public Access to images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');

-- Enable RLS on product_categories if exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_categories') THEN
    ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Public read access to product_categories" ON product_categories;
    DROP POLICY IF EXISTS "Authenticated users can manage product_categories" ON product_categories;
    
    CREATE POLICY "Public read access to product_categories"
    ON product_categories FOR SELECT
    TO public
    USING (true);
    
    CREATE POLICY "Authenticated users can manage product_categories"
    ON product_categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id 
ON product_categories(product_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_category_id 
ON product_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_products_is_featured 
ON products(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_products_source 
ON products(source);
