/*
  # Crear buckets de almacenamiento para imágenes

  1. Buckets
    - `product-images` - Imágenes de productos
    - `banner-images` - Imágenes de banners
    - `brand-logos` - Logos de marcas

  2. Seguridad
    - Acceso público de lectura
    - Solo admins pueden subir/eliminar
*/

-- Crear bucket para imágenes de productos (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para imágenes de banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para logos de marcas
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para product-images: Lectura pública, escritura con autenticación
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Políticas para banner-images
CREATE POLICY "Public read access for banner images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banner-images');

CREATE POLICY "Authenticated users can upload banner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banner-images');

CREATE POLICY "Authenticated users can update banner images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banner-images');

CREATE POLICY "Authenticated users can delete banner images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banner-images');

-- Políticas para brand-logos
CREATE POLICY "Public read access for brand logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-logos');

CREATE POLICY "Authenticated users can upload brand logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-logos');

CREATE POLICY "Authenticated users can update brand logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-logos');

CREATE POLICY "Authenticated users can delete brand logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'brand-logos');
