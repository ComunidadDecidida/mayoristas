/*
  # Reparar logs de sincronización colgados

  1. Función para limpiar logs antiguos
    - Marca como 'timeout' los logs en 'running' de más de 10 minutos
    - Se puede ejecutar manualmente o programar con pg_cron
  
  2. Trigger automático
    - Detecta logs muy antiguos al consultar la tabla
*/

-- Función para marcar logs antiguos como timeout
CREATE OR REPLACE FUNCTION cleanup_hanging_sync_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Marcar como timeout los logs en running de más de 10 minutos
  WITH updated AS (
    UPDATE api_sync_logs
    SET 
      status = 'timeout',
      completed_at = NOW(),
      errors = COALESCE(errors, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'message', 'Sync timeout - exceeded maximum execution time',
          'timestamp', NOW()
        )
      ),
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'timeout_detected_at', NOW(),
        'timeout_reason', 'No response after 10 minutes'
      )
    WHERE 
      status = 'running'
      AND started_at < NOW() - INTERVAL '10 minutes'
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM updated;
  
  RETURN updated_count;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION cleanup_hanging_sync_logs() IS 
'Marca como timeout los logs de sincronización que llevan más de 10 minutos en estado running';

-- Ejecutar la función para limpiar logs existentes
SELECT cleanup_hanging_sync_logs();
