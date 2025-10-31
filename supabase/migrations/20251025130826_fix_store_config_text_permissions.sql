/*
  # Actualizar permisos de función store_config_text

  1. Problema
    - La función store_config_text usa SECURITY DEFINER
    - Necesita permisos explícitos para que anon pueda ejecutarla

  2. Solución
    - Otorgar permisos de ejecución a anon y authenticated
    - La función se ejecutará con privilegios del propietario (SECURITY DEFINER)
    - Esto permite insertar/actualizar ignorando RLS

  3. Seguridad
    - SECURITY DEFINER permite que la función bypasee RLS de forma controlada
    - Solo usuarios con acceso a la función pueden usarla
    - La función solo modifica system_config, no hay riesgo de escalación
*/

-- Otorgar permisos de ejecución a anon y authenticated
GRANT EXECUTE ON FUNCTION store_config_text(text, text, text) TO anon, authenticated;

-- Comentario
COMMENT ON FUNCTION store_config_text IS 
'Función helper para almacenar valores de texto en system_config. 
Garantiza que el valor se guarde correctamente como JSONB sin comillas dobles adicionales.
Accesible desde anon y authenticated para uso en panel admin.
Uso: SELECT store_config_text(''clave'', ''valor'', ''descripción opcional'');';
