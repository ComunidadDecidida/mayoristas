/*
  # Corregir formato de almacenamiento del token OAuth2

  1. Problema
    - El token OAuth2 se estaba almacenando con comillas escapadas en el valor JSONB
    - Esto causaba que la API de SYSCOM rechazara el token como inválido
  
  2. Solución
    - Crear función helper para garantizar que los valores de texto se almacenen correctamente en JSONB
    - El token debe almacenarse como string directo sin comillas adicionales

  3. Notas
    - Esta migración no modifica datos existentes
    - Los administradores deben re-guardar el token desde el panel de configuración
*/

-- Crear función helper para almacenar valores de texto en system_config
CREATE OR REPLACE FUNCTION store_config_text(
  p_key text,
  p_value text,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO system_config (key, value, description, updated_at)
  VALUES (
    p_key,
    to_jsonb(p_value),
    p_description,
    now()
  )
  ON CONFLICT (key) 
  DO UPDATE SET
    value = to_jsonb(p_value),
    description = COALESCE(EXCLUDED.description, system_config.description),
    updated_at = now();
END;
$$;

-- Comentarios para documentar el uso correcto
COMMENT ON FUNCTION store_config_text IS 
'Función helper para almacenar valores de texto en system_config. 
Garantiza que el valor se guarde correctamente como JSONB sin comillas dobles adicionales.
Uso: SELECT store_config_text(''clave'', ''valor'', ''descripción opcional'');';
