-- ============================================================================
-- MAYORISTA DE SISTEMAS - ESTRUCTURA COMPLETA DE BASE DE DATOS MySQL
-- ============================================================================
--
-- Este script crea la estructura completa de la base de datos para el sistema
-- de e-commerce Mayorista de Sistemas Comunicaciones y Redes de México
--
-- IMPORTANTE: Este script convierte la estructura de PostgreSQL a MySQL
--
-- Características:
--   - Conversión de tipos UUID a CHAR(36) con valores generados
--   - Conversión de JSONB a JSON
--   - Conversión de TIMESTAMPTZ a DATETIME con DEFAULT CURRENT_TIMESTAMP
--   - Índices optimizados para MySQL
--   - Foreign keys con ON DELETE CASCADE
--
-- Tablas incluidas:
--   1. system_config - Configuración del sistema
--   2. products - Catálogo de productos
--   3. categories - Categorías de productos
--   4. product_categories - Relación productos-categorías
--   5. brands - Marcas
--   6. carts - Carritos de compra
--   7. orders - Pedidos
--   8. banners - Banners promocionales
--   9. api_sync_logs - Logs de sincronización
--   10. notification_config - Configuración de notificaciones
--   11. syscom_products - Productos de SYSCOM
--   12. syscom_selected_categories - Categorías seleccionadas de SYSCOM
--
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. TABLA: system_config
-- Almacena toda la configuración del sistema
-- ============================================================================

CREATE TABLE IF NOT EXISTS `system_config` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `key` VARCHAR(255) UNIQUE NOT NULL,
  `value` JSON NOT NULL,
  `description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_system_config_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. TABLA: products
-- Catálogo principal de productos
-- ============================================================================

CREATE TABLE IF NOT EXISTS `products` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `source` ENUM('syscom', 'tecnosinergia', 'manual') NOT NULL,
  `source_id` VARCHAR(255) DEFAULT NULL,
  `sku` VARCHAR(255) UNIQUE NOT NULL,
  `title` TEXT NOT NULL,
  `description` TEXT,
  `brand` VARCHAR(255),
  `base_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `markup_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `final_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock` INT NOT NULL DEFAULT 0,
  `stock_data` JSON DEFAULT NULL,
  `images` JSON DEFAULT NULL,
  `specifications` JSON DEFAULT NULL,
  `is_visible` BOOLEAN DEFAULT TRUE,
  `is_manual` BOOLEAN DEFAULT FALSE,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `metadata` JSON DEFAULT NULL,
  `last_sync` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_products_source` (`source`),
  INDEX `idx_products_source_id` (`source_id`),
  INDEX `idx_products_sku` (`sku`),
  INDEX `idx_products_brand` (`brand`),
  INDEX `idx_products_is_visible` (`is_visible`),
  INDEX `idx_products_is_featured` (`is_featured`),
  INDEX `idx_products_stock` (`stock`),
  FULLTEXT INDEX `idx_products_search` (`title`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. TABLA: categories
-- Categorías de productos con soporte para jerarquía
-- ============================================================================

CREATE TABLE IF NOT EXISTS `categories` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE NOT NULL,
  `parent_id` CHAR(36) DEFAULT NULL,
  `source` ENUM('syscom', 'tecnosinergia', 'manual') DEFAULT NULL,
  `source_id` VARCHAR(255) DEFAULT NULL,
  `description` TEXT,
  `image_url` TEXT,
  `is_visible` BOOLEAN DEFAULT TRUE,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_categories_parent_id` (`parent_id`),
  INDEX `idx_categories_slug` (`slug`),
  INDEX `idx_categories_is_visible` (`is_visible`),
  INDEX `idx_categories_sort_order` (`sort_order`),
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. TABLA: product_categories
-- Relación muchos a muchos entre productos y categorías
-- ============================================================================

CREATE TABLE IF NOT EXISTS `product_categories` (
  `product_id` CHAR(36) NOT NULL,
  `category_id` CHAR(36) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`, `category_id`),
  INDEX `idx_product_categories_product` (`product_id`),
  INDEX `idx_product_categories_category` (`category_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. TABLA: brands
-- Marcas de productos
-- ============================================================================

CREATE TABLE IF NOT EXISTS `brands` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) UNIQUE NOT NULL,
  `slug` VARCHAR(255) UNIQUE NOT NULL,
  `logo_url` TEXT,
  `description` TEXT,
  `is_visible` BOOLEAN DEFAULT TRUE,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_brands_slug` (`slug`),
  INDEX `idx_brands_is_visible` (`is_visible`),
  INDEX `idx_brands_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. TABLA: carts
-- Carritos de compra activos
-- ============================================================================

CREATE TABLE IF NOT EXISTS `carts` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `session_id` VARCHAR(255) UNIQUE NOT NULL,
  `user_id` CHAR(36) DEFAULT NULL,
  `items` JSON DEFAULT NULL,
  `subtotal` DECIMAL(10,2) DEFAULT 0.00,
  `tax` DECIMAL(10,2) DEFAULT 0.00,
  `total` DECIMAL(10,2) DEFAULT 0.00,
  `currency` ENUM('MXN', 'USD') DEFAULT 'MXN',
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_carts_session_id` (`session_id`),
  INDEX `idx_carts_user_id` (`user_id`),
  INDEX `idx_carts_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. TABLA: orders
-- Pedidos realizados
-- ============================================================================

CREATE TABLE IF NOT EXISTS `orders` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `order_number` VARCHAR(50) UNIQUE NOT NULL,
  `user_id` CHAR(36) DEFAULT NULL,
  `session_id` VARCHAR(255) DEFAULT NULL,
  `items` JSON NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `shipping` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` ENUM('MXN', 'USD') DEFAULT 'MXN',
  `status` ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  `payment_method` ENUM('mercadopago', 'stripe', 'paypal') DEFAULT NULL,
  `payment_id` VARCHAR(255) DEFAULT NULL,
  `payment_status` VARCHAR(100) DEFAULT NULL,
  `shipping_address` JSON DEFAULT NULL,
  `billing_address` JSON DEFAULT NULL,
  `customer_info` JSON DEFAULT NULL,
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_orders_order_number` (`order_number`),
  INDEX `idx_orders_user_id` (`user_id`),
  INDEX `idx_orders_session_id` (`session_id`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_payment_method` (`payment_method`),
  INDEX `idx_orders_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. TABLA: banners
-- Banners del carrusel principal
-- ============================================================================

CREATE TABLE IF NOT EXISTS `banners` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `title` VARCHAR(255) NOT NULL,
  `image_url` TEXT NOT NULL,
  `link_url` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `sort_order` INT DEFAULT 0,
  `start_date` DATETIME DEFAULT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_banners_is_active` (`is_active`),
  INDEX `idx_banners_sort_order` (`sort_order`),
  INDEX `idx_banners_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. TABLA: api_sync_logs
-- Logs de sincronización con APIs externas
-- ============================================================================

CREATE TABLE IF NOT EXISTS `api_sync_logs` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `source` ENUM('syscom', 'tecnosinergia') NOT NULL,
  `sync_type` ENUM('products', 'categories', 'stock', 'full') NOT NULL,
  `status` ENUM('running', 'success', 'error') NOT NULL DEFAULT 'running',
  `products_synced` INT DEFAULT 0,
  `errors` JSON DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `started_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `completed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_api_sync_logs_source` (`source`),
  INDEX `idx_api_sync_logs_status` (`status`),
  INDEX `idx_api_sync_logs_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. TABLA: notification_config
-- Configuración de servicios de notificaciones
-- ============================================================================

CREATE TABLE IF NOT EXISTS `notification_config` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `service` ENUM('whatsapp', 'telegram') UNIQUE NOT NULL,
  `is_enabled` BOOLEAN DEFAULT FALSE,
  `config` JSON DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_notification_config_service` (`service`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. TABLA: syscom_products
-- Productos sincronizados desde la API de SYSCOM
-- ============================================================================

CREATE TABLE IF NOT EXISTS `syscom_products` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),

  -- Identificadores SYSCOM
  `producto_id` VARCHAR(255) NOT NULL UNIQUE,
  `modelo` VARCHAR(255) NOT NULL UNIQUE,
  `sat_key` VARCHAR(100) DEFAULT NULL,

  -- Información básica
  `titulo` TEXT NOT NULL,
  `descripcion` TEXT,
  `marca` VARCHAR(255),
  `marca_logo` TEXT,

  -- Precios
  `precio_lista` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `precio_especial` DECIMAL(10,2) DEFAULT NULL,
  `precio_descuento` DECIMAL(10,2) DEFAULT NULL,

  -- Inventario
  `total_existencia` INT NOT NULL DEFAULT 0,
  `existencia` JSON DEFAULT NULL,

  -- Medios
  `img_portada` TEXT,
  `imagenes` JSON DEFAULT NULL,
  `recursos` JSON DEFAULT NULL,

  -- Categorías y clasificación
  `categorias` JSON DEFAULT NULL,
  `iconos` JSON DEFAULT NULL,
  `caracteristicas` JSON DEFAULT NULL,

  -- Productos relacionados
  `productos_relacionados` JSON DEFAULT NULL,
  `accesorios` JSON DEFAULT NULL,

  -- Campos adicionales
  `garantia` TEXT,
  `sat_description` TEXT,
  `peso` DECIMAL(10,2),
  `alto` DECIMAL(10,2),
  `largo` DECIMAL(10,2),
  `ancho` DECIMAL(10,2),
  `unidad_de_medida` JSON DEFAULT NULL,
  `pvol` TEXT,
  `link_privado` TEXT,
  `imagen_360` JSON DEFAULT NULL,
  `precios_volumen` JSON DEFAULT NULL,
  `link` TEXT,
  `existencia_asterisco` JSON DEFAULT NULL,

  -- Configuración
  `markup_percentage` DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  `final_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `is_visible` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  `link_syscom` TEXT,
  `last_sync` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_syscom_products_producto_id` (`producto_id`),
  INDEX `idx_syscom_products_modelo` (`modelo`),
  INDEX `idx_syscom_products_marca` (`marca`),
  INDEX `idx_syscom_products_visible` (`is_visible`),
  INDEX `idx_syscom_products_featured` (`is_featured`),
  INDEX `idx_syscom_products_stock` (`total_existencia`),
  FULLTEXT INDEX `idx_syscom_products_search` (`titulo`, `descripcion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. TABLA: syscom_selected_categories
-- Categorías seleccionadas de SYSCOM para sincronización
-- ============================================================================

CREATE TABLE IF NOT EXISTS `syscom_selected_categories` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `category_id` VARCHAR(255) NOT NULL UNIQUE,
  `category_name` VARCHAR(255) NOT NULL,
  `parent_id` VARCHAR(255) DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_syscom_categories_id` (`category_id`),
  INDEX `idx_syscom_categories_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Configuración inicial del sistema
INSERT INTO `system_config` (`key`, `value`, `description`) VALUES
  ('global_markup_percentage', '20', 'Porcentaje de ganancia global para todos los productos'),
  ('show_iva', 'true', 'Mostrar precios con IVA'),
  ('iva_percentage', '16', 'Porcentaje de IVA'),
  ('cart_expiration_days', '7', 'Días de expiración del carrito'),
  ('exchange_rate', '{"MXN": 1, "USD": 17.5}', 'Tipo de cambio USD/MXN'),
  ('sync_schedule', '{"enabled": true, "frequency": "daily", "time": "02:00"}', 'Programación de sincronización automática'),
  ('mercadopago_config', '{"enabled": false, "mode": "test"}', 'Configuración de MercadoPago'),
  ('stripe_config', '{"enabled": false, "mode": "test"}', 'Configuración de Stripe'),
  ('paypal_config', '{"enabled": false, "mode": "sandbox"}', 'Configuración de PayPal'),
  ('DB_HOST', '162.241.2.158', 'Host de la base de datos MySQL'),
  ('DB_PORT', '3306', 'Puerto de la base de datos MySQL'),
  ('DB_USER', 'jonat104_psycoraper', 'Usuario de la base de datos MySQL'),
  ('DB_PASSWORD', 'Mavana1357', 'Contraseña de la base de datos MySQL'),
  ('DB_NAME', 'jonat104_mayorista_de_sistemas', 'Nombre de la base de datos MySQL')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- Configuración de notificaciones
INSERT INTO `notification_config` (`service`, `is_enabled`, `config`) VALUES
  ('whatsapp', FALSE, '{"phone": "", "api_token": ""}'),
  ('telegram', FALSE, '{"bot_token": "", "chat_id": ""}')
ON DUPLICATE KEY UPDATE `is_enabled` = VALUES(`is_enabled`);

-- ============================================================================
-- RESTAURAR CONFIGURACIÓN
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- NOTAS DE MIGRACIÓN:
-- 1. UUID de PostgreSQL -> CHAR(36) con DEFAULT (UUID()) en MySQL
-- 2. JSONB de PostgreSQL -> JSON en MySQL
-- 3. TIMESTAMPTZ de PostgreSQL -> DATETIME en MySQL
-- 4. Las políticas RLS de PostgreSQL no se aplican en MySQL
--    Se debe implementar seguridad a nivel de aplicación
-- 5. Los triggers de PostgreSQL pueden recrearse en MySQL si es necesario
-- 6. Los índices GIN para búsqueda de texto completo se convierten a FULLTEXT
-- 7. Todos los CHECK constraints se convierten a ENUM cuando es posible
