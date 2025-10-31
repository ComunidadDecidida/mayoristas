/*
  # Update SYSCOM OAuth2 Token and Populate Categories

  1. Configuration Updates
    - syscom_oauth_token: Update with new valid token (expires 2025-12-24)
    - syscom_token_expires_at: Update expiration timestamp
  
  2. Categories Population
    - Insert all 12 level-1 SYSCOM categories
    - Set all as active for synchronization
    - Initialize metadata fields
  
  3. Notes
    - Token is valid until December 24, 2025
    - All categories from SYSCOM API documentation
*/

-- Update OAuth2 token with the correct one
UPDATE system_config 
SET value = '"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjBhOTYzNjkyNzRlYzBhNWIwMTFlNDYyMzYwZDBlMTYwYjhhNzc2MmQzZTZlY2FjYzhiNTQ3OGY4NThkOTg0ZmVjZmZmMDJhMDc5ZGRiN2JlIn0.eyJhdWQiOiJFRGJVQldlZ29mWk01SGlWV0hTQVpxS1JBQ3pTd1VSSSIsImp0aSI6IjBhOTYzNjkyNzRlYzBhNWIwMTFlNDYyMzYwZDBlMTYwYjhhNzc2MmQzZTZlY2FjYzhiNTQ3OGY4NThkOTg0ZmVjZmZmMDJhMDc5ZGRiN2JlIiwiaWF0IjoxNzYxMzkwMTc3LCJuYmYiOjE3NjEzOTAxNzcsImV4cCI6MTc5MjkyNjE3Niwic3ViIjoiIiwic2NvcGVzIjpbXX0.T307LpQPAZW4GZEoU3N8nY3k5WKiE3rR0iaRAxlzxgUdNf5ZbQ_iCN0FatBl_wdd1eHqsUx3Fu_EoVky1whcfmUWfvbNLnOGmHuFGxG_EUHP6P5B1I44dBS8-OTPKWhBZQ1XDpfKtSf7XePOm81dah7PyQaX84CxRz1Ky1GGWLxzDeX377v_5emNxcrck6JFw0N56UfHKzu7hu94-fPetKXzcmj2zfQRdZCzDnFh1wyyESe-XmNry062zm6db3BMYRWB48LRkgf0c-oHeisIgwnVv6HlJ0mKR82aAbZlyAIBLq1BgO-2ynhoi4wG9dHWf7KlipR13js82jBN2OW-l7_V52rHRvmuUGpclmMZw7KAUyihGMLsv_UQHTmHyuCDrPyv35GO6uGGqzj2WWDR_1ZcwJOhQGvPQwpB0maBOiyz5dhgxfLVekLqVw8aN6Zq6pflgxc--NHWqz-1vDExUHq9RvttUPE4rcSP6HNh8qGhK0P4uK0xyPFqT71xMpS7mKIC3pKGD7Uzp5aoBRrYydpLo6f5uJhFDGNmMq6tTkwZRtRVDJhNmOMv6kF3yyNPHhVFtk98nN0QpeJFBiZEsnCLHbqNsnAbXumd3hlXXZqYy6EX88Og6etVhTvfA7RS672tEXbDgiV0tyAjDBzqCTl6yQ2WjjNXFpFZj8fFl8M"'
WHERE key = 'syscom_oauth_token';

-- Update token expiration date (December 24, 2025)
UPDATE system_config 
SET value = '"2025-12-24T00:00:00Z"'
WHERE key = 'syscom_token_expires_at';

-- Clear existing categories to avoid duplicates
DELETE FROM syscom_selected_categories;

-- Insert all 12 level-1 SYSCOM categories
INSERT INTO syscom_selected_categories (category_id, category_name, parent_id, nivel, is_active, sync_priority, total_products)
VALUES
  ('22', 'Videovigilancia', NULL, 1, true, 100, 0),
  ('25', 'Radiocomunicación', NULL, 1, true, 90, 0),
  ('26', 'Redes e IT', NULL, 1, true, 95, 0),
  ('27', 'IoT / GPS / Telemática y Señalización Audiovisual', NULL, 1, true, 80, 0),
  ('30', 'Energía / Herramientas', NULL, 1, true, 70, 0),
  ('32', 'Automatización e Intrusión', NULL, 1, true, 85, 0),
  ('37', 'Control de Acceso', NULL, 1, true, 88, 0),
  ('38', 'Detección de Fuego', NULL, 1, true, 87, 0),
  ('65747', 'Marketing', NULL, 1, true, 50, 0),
  ('65811', 'Cableado Estructurado', NULL, 1, true, 75, 0),
  ('66523', 'Audio y Video', NULL, 1, true, 78, 0),
  ('66630', 'Robots e Industrial', NULL, 1, true, 60, 0)
ON CONFLICT (category_id) DO UPDATE SET
  category_name = EXCLUDED.category_name,
  is_active = EXCLUDED.is_active,
  sync_priority = EXCLUDED.sync_priority;

-- Add helpful comment
COMMENT ON TABLE syscom_selected_categories IS 'Contains all 12 level-1 SYSCOM categories for product synchronization. Token valid until 2025-12-24.';