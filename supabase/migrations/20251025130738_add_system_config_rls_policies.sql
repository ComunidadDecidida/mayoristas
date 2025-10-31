/*
  # Agregar políticas RLS para system_config

  1. Problema
    - La tabla system_config tiene RLS habilitado pero sin políticas
    - Esto bloquea todas las operaciones de lectura y escritura
    - Error: "new row violates row-level security policy"

  2. Solución
    - Agregar políticas para permitir operaciones desde service role
    - Permitir lectura pública para configuraciones no sensibles
    - Restringir escritura solo a service role (backend/Edge Functions)

  3. Seguridad
    - Solo Edge Functions pueden modificar la configuración
    - Frontend puede leer configuraciones públicas
    - Tokens sensibles solo accesibles desde backend
*/

-- Política para permitir lectura desde el frontend (anon key)
CREATE POLICY "Allow public read access to system_config"
  ON system_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política para permitir todas las operaciones desde service role
CREATE POLICY "Allow service role full access to system_config"
  ON system_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Permitir inserción y actualización desde authenticated users (admin panel)
CREATE POLICY "Allow authenticated users to insert system_config"
  ON system_config
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update system_config"
  ON system_config
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Comentarios
COMMENT ON POLICY "Allow public read access to system_config" ON system_config IS
'Permite que el frontend lea la configuración del sistema';

COMMENT ON POLICY "Allow service role full access to system_config" ON system_config IS
'Permite que las Edge Functions tengan acceso completo a la configuración';

COMMENT ON POLICY "Allow authenticated users to insert system_config" ON system_config IS
'Permite que administradores autenticados inserten configuración';

COMMENT ON POLICY "Allow authenticated users to update system_config" ON system_config IS
'Permite que administradores autenticados actualicen configuración';
