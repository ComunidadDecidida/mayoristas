/*
  # Agregar credenciales de SYSCOM a system_config
  
  1. Nuevas configuraciones
    - syscom_client_id: ID de cliente OAuth2
    - syscom_client_secret: Secret de cliente OAuth2 (encriptado)
    - syscom_access_token: Token de acceso actual
    - syscom_token_expires: Fecha de expiración del token
*/

-- Insertar configuraciones de SYSCOM
INSERT INTO system_config (key, value, description) VALUES
  ('syscom_client_id', '', 'SYSCOM OAuth2 Client ID')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description) VALUES
  ('syscom_client_secret', '', 'SYSCOM OAuth2 Client Secret')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description) VALUES
  ('syscom_access_token', '', 'SYSCOM API Access Token')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description) VALUES
  ('syscom_token_expires', '0', 'SYSCOM Token Expiration Timestamp')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE system_config IS 'Configuración del sistema incluyendo credenciales de APIs';
