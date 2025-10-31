/*
  # Agregar campo metadata a api_sync_logs y políticas RLS

  1. Cambios
    - Agregar campo metadata (jsonb) a tabla api_sync_logs
    - Crear políticas RLS para acceso público de lectura a logs de sincronización
    - Permitir acceso anon y authenticated a logs para monitoreo

  2. Seguridad
    - Políticas restrictivas que solo permiten lectura de logs
    - No se permite escritura desde el frontend
*/

-- Agregar campo metadata si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_sync_logs' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE api_sync_logs ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- Eliminar política existente si existe y crear nueva
DROP POLICY IF EXISTS "Logs de sincronización son públicos para lectura" ON api_sync_logs;

CREATE POLICY "Logs de sincronización son públicos para lectura"
  ON api_sync_logs FOR SELECT
  TO anon, authenticated
  USING (true);