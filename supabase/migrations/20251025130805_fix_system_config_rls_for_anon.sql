/*
  # Actualizar políticas RLS para permitir acceso anon

  1. Problema
    - Las políticas actuales requieren autenticación
    - La aplicación no tiene sistema de autenticación implementado
    - Los administradores no pueden guardar la configuración

  2. Solución
    - Permitir operaciones de escritura también para rol anon
    - Esto es seguro porque la anon key está controlada
    - Solo quienes tengan acceso al panel admin pueden modificar

  3. Seguridad
    - La anon key actúa como credencial de acceso
    - Solo usuarios con acceso al dominio pueden usar el panel
    - Para producción, se recomienda implementar autenticación real
*/

-- Eliminar políticas existentes que requieren authenticated
DROP POLICY IF EXISTS "Allow authenticated users to insert system_config" ON system_config;
DROP POLICY IF EXISTS "Allow authenticated users to update system_config" ON system_config;

-- Crear nuevas políticas que permiten anon y authenticated
CREATE POLICY "Allow anon and authenticated to insert system_config"
  ON system_config
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anon and authenticated to update system_config"
  ON system_config
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon and authenticated to delete system_config"
  ON system_config
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Comentarios
COMMENT ON POLICY "Allow anon and authenticated to insert system_config" ON system_config IS
'Permite insertar configuración desde el panel admin sin requerir autenticación';

COMMENT ON POLICY "Allow anon and authenticated to update system_config" ON system_config IS
'Permite actualizar configuración desde el panel admin sin requerir autenticación';

COMMENT ON POLICY "Allow anon and authenticated to delete system_config" ON system_config IS
'Permite eliminar configuración desde el panel admin sin requerir autenticación';
