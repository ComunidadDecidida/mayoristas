/*
  # Configuración OAuth2 de SYSCOM y Gestión de Categorías
  
  1. Nuevas configuraciones en system_config
    - syscom_oauth_token: Token OAuth2 Bearer de SYSCOM (válido por 364 días)
    - syscom_token_expires_at: Fecha de expiración del token en formato ISO
    - syscom_categories_mode: Modo de sincronización ("selected" o "all")
    - markup_mode: Modo de aplicación de markup ("global" o "personalized")
    - global_markup_percentage: Porcentaje de markup global (default 20)
  
  2. Nueva tabla syscom_selected_categories
    - Almacena las categorías seleccionadas para sincronización
    - Incluye información de categoría de SYSCOM
  
  3. Seguridad
    - Enable RLS en syscom_selected_categories
    - Políticas para lectura y escritura
*/

-- Insertar token OAuth2 de SYSCOM (será actualizado por el administrador)
INSERT INTO system_config (key, value, description) VALUES
  ('syscom_oauth_token', '"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiM2E3MTVhZjMwNzNjODlhNjAyOWI4YjRmNDhiOWRhMmU3ZDQyOWQ4ZmU0YTc1YzU1MTViYzEyZGRmMjdlYjhlNDU1YmE1MWQwMzFjMzcyNjUiLCJpYXQiOjE3Mjc3ODkzNjUuMjIzMzksIm5iZiI6MTcyNzc4OTM2NS4yMjMzOTcsImV4cCI6MTc1OTMyNTM2NS4yMTY1Miwic3ViIjoiMTY0MjkiLCJzY29wZXMiOltdfQ.H96uZDvg1VWlXvXtzCUJW3kcuVlXcRv63M4yANY-mLNMXKaLioDKgKgbFjZIuqHaxgYAUQW-YCFvMpn_AHi8vISvR4S-SMyV8CdZ8GsaLm8RaEb95o05qAvFMpUhNCSSO3-oj_pzJZ7zQGW7pGy1LhCh0DafOeMg-VqxIbL1A7MRcjVYUhUpNQVUMeNrOQNaEIDMg5HVNQB17dqxVx16msCTQ-GQBMg2gTVJt3JjXSvwXVE3IMuRg8rJ0oJVU8Dq8YdYW-M0GQWX0z7aNpTNcOzxRzO5oRp93OOoTa3E5W7_WVMvzJqx-qxLX1lx3kXxxmGTGT9NKGUU5oXlKMp09iOWF6j6hNTVsv9jWI1BbXYwLcFxlhInW3d-Qy8c1kZRqNv40qJ4NVNlnZyOb6HBxsxkzSN1w91Z6_HrNzZzRK36G_pZq7Y-I6xLFPZ31MHrCJDWsXkZxwG5YhL8u-MqmjX5cYqXfLzTDqj4I23GNPwcZG92W7wxxWIGNYvPJk1t92bQYEGFvn8fDKpNMVBZA-KGpWEGGZdQ_6HVz-5XZ_hVQsKqWHQ3vR1DM0DKlqWnv-bGq4H7qHpNl-qPcGkKvqGq6dX8bNcQGvQ3pO9lNX6HYqKlp8F-G3pN8DvYxKp3KvqQ3q1W8HqGZx3Q6vD8"', 'Token OAuth2 Bearer de SYSCOM (válido por 364 días)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insertar fecha de expiración del token (364 días desde hoy)
INSERT INTO system_config (key, value, description) VALUES
  ('syscom_token_expires_at', to_jsonb((now() + interval '364 days')::text), 'Fecha de expiración del token OAuth2 de SYSCOM')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Configuración de modo de sincronización de categorías
INSERT INTO system_config (key, value, description) VALUES
  ('syscom_categories_mode', '"selected"', 'Modo de sincronización de categorías SYSCOM: "selected" o "all"')
ON CONFLICT (key) DO NOTHING;

-- Configuración de modo de markup
INSERT INTO system_config (key, value, description) VALUES
  ('markup_mode', '"global"', 'Modo de aplicación de markup: "global" o "personalized"')
ON CONFLICT (key) DO NOTHING;

-- Verificar que global_markup_percentage existe
INSERT INTO system_config (key, value, description) VALUES
  ('global_markup_percentage', '20', 'Porcentaje de markup global aplicado a todos los productos')
ON CONFLICT (key) DO NOTHING;

-- Crear tabla para categorías seleccionadas de SYSCOM
CREATE TABLE IF NOT EXISTS syscom_selected_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información de la categoría SYSCOM
  category_id text NOT NULL UNIQUE,
  category_name text NOT NULL,
  parent_id text,
  nivel integer DEFAULT 1,
  
  -- Configuración
  is_active boolean NOT NULL DEFAULT true,
  sync_priority integer DEFAULT 0,
  
  -- Metadata
  total_products integer DEFAULT 0,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para búsqueda y rendimiento
CREATE INDEX IF NOT EXISTS idx_syscom_selected_categories_category_id 
  ON syscom_selected_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_syscom_selected_categories_active 
  ON syscom_selected_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_syscom_selected_categories_parent 
  ON syscom_selected_categories(parent_id) WHERE parent_id IS NOT NULL;

-- Enable RLS
ALTER TABLE syscom_selected_categories ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver categorías seleccionadas
CREATE POLICY "Anyone can view selected categories"
  ON syscom_selected_categories FOR SELECT
  USING (true);

-- Política: Permitir todas las operaciones (para admin/desarrollo)
CREATE POLICY "Allow all operations for admin"
  ON syscom_selected_categories FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_syscom_selected_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER syscom_selected_categories_updated_at
  BEFORE UPDATE ON syscom_selected_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_syscom_selected_categories_updated_at();

-- Comentarios
COMMENT ON TABLE syscom_selected_categories IS 'Categorías de SYSCOM seleccionadas para sincronización';
COMMENT ON COLUMN syscom_selected_categories.category_id IS 'ID de la categoría en SYSCOM';
COMMENT ON COLUMN syscom_selected_categories.is_active IS 'Si la categoría está activa para sincronización';
COMMENT ON COLUMN syscom_selected_categories.sync_priority IS 'Prioridad de sincronización (mayor = primero)';
