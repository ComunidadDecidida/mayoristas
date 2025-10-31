# Guía Completa de Instalación y Configuración

## Mayorista de Sistemas - E-commerce Platform

Esta guía te ayudará a instalar y configurar el sistema completo paso a paso.

---

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Base de Datos MySQL](#configuración-de-base-de-datos-mysql)
3. [Configuración de Supabase](#configuración-de-supabase)
4. [Instalación del Proyecto](#instalación-del-proyecto)
5. [Configuración de Edge Functions](#configuración-de-edge-functions)
6. [Configuración de la Aplicación](#configuración-de-la-aplicación)
7. [Despliegue](#despliegue)
8. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

### Software Necesario
- Node.js 18+ y npm
- Cuenta de Supabase (gratuita)
- Servidor MySQL 5.7+ o 8.0+
- Git (opcional)

### Credenciales Necesarias
- Credenciales de MySQL
- API Keys de Supabase
- Token OAuth2 de SYSCOM (opcional)
- Token API de Tecnosinergia (opcional)
- Credenciales de pasarelas de pago (opcional)

---

## Configuración de Base de Datos MySQL

### Paso 1: Crear la Base de Datos

Conéctate a tu servidor MySQL y ejecuta:

```sql
CREATE DATABASE jonat104_mayorista_de_sistemas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### Paso 2: Crear Usuario (si es necesario)

```sql
CREATE USER 'jonat104_psycoraper'@'%' IDENTIFIED BY 'Mavana1357';
GRANT ALL PRIVILEGES ON jonat104_mayorista_de_sistemas.* TO 'jonat104_psycoraper'@'%';
FLUSH PRIVILEGES;
```

### Paso 3: Ejecutar Script de Estructura

Ejecuta el script SQL ubicado en `/database/mysql_structure.sql`:

```bash
mysql -h 162.241.2.158 -u jonat104_psycoraper -p jonat104_mayorista_de_sistemas < database/mysql_structure.sql
```

O desde el cliente MySQL:

```sql
USE jonat104_mayorista_de_sistemas;
SOURCE /path/to/database/mysql_structure.sql;
```

### Paso 4: Verificar la Instalación

```sql
USE jonat104_mayorista_de_sistemas;
SHOW TABLES;
```

Deberías ver 12 tablas:
- system_config
- products
- categories
- product_categories
- brands
- carts
- orders
- banners
- api_sync_logs
- notification_config
- syscom_products
- syscom_selected_categories

---

## Configuración de Supabase

### Paso 1: Crear Proyecto en Supabase

1. Ve a https://app.supabase.com
2. Clic en "New Project"
3. Ingresa los detalles del proyecto
4. Espera a que el proyecto se cree (2-3 minutos)

### Paso 2: Obtener Credenciales

En el dashboard de Supabase:
1. Ve a "Settings" → "API"
2. Copia:
   - Project URL
   - Project API keys → anon public

### Paso 3: Configurar Variables de Entorno

Crea o actualiza el archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Credenciales de MySQL (se almacenarán en Supabase)
DB_HOST=162.241.2.158
DB_PORT=3306
DB_USER=jonat104_psycoraper
DB_PASSWORD=Mavana1357
DB_NAME=jonat104_mayorista_de_sistemas

# APIs Externas (Opcional)
SYSCOM_CLIENT_ID=tu-client-id
SYSCOM_CLIENT_SECRET=tu-client-secret
SYSCOM_API_BASE_URL=https://developers.syscom.mx/api/v1

TECNOSINERGIA_API_TOKEN=tu-api-token
TECNOSINERGIA_API_BASE_URL=https://api.tecnosinergia.info/v3
```

---

## Instalación del Proyecto

### Paso 1: Clonar o Descargar el Proyecto

```bash
git clone [url-del-repositorio]
cd proyecto
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

Asegúrate de que el archivo `.env` esté configurado correctamente con tus credenciales.

### Paso 4: Compilar el Proyecto

```bash
npm run build
```

---

## Configuración de Edge Functions

Las Edge Functions se ejecutan en Supabase y proporcionan funcionalidad backend segura.

### Función Principal: mysql_bd_mayorista

Esta función es **CRÍTICA** para conectar la aplicación con tu base de datos MySQL.

#### Paso 1: Crear la Edge Function en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a "Edge Functions" en el menú lateral
3. Clic en "New Function"
4. Nombre: `mysql_bd_mayorista`
5. Copia y pega el contenido completo de:
   `/supabase/functions/mysql_bd_mayorista/index.ts`
6. Clic en "Deploy"

#### Paso 2: Configurar Credenciales de MySQL en Supabase

Ejecuta este SQL en la sección "SQL Editor" de Supabase:

```sql
-- Crear tabla system_config si no existe
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar credenciales de MySQL
INSERT INTO system_config (key, value, description) VALUES
  ('DB_HOST', '"162.241.2.158"', 'Host de MySQL'),
  ('DB_PORT', '"3306"', 'Puerto de MySQL'),
  ('DB_USER', '"jonat104_psycoraper"', 'Usuario de MySQL'),
  ('DB_PASSWORD', '"Mavana1357"', 'Contraseña de MySQL'),
  ('DB_NAME', '"jonat104_mayorista_de_sistemas"', 'Nombre de BD MySQL')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

#### Paso 3: Probar la Conexión

Usa el dashboard de Supabase o curl:

```bash
curl -X POST \
  https://tu-proyecto.supabase.co/functions/v1/mysql_bd_mayorista \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "ping"}'
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Connected to MySQL"
}
```

### Funciones Adicionales (Opcional)

Para funcionalidad completa, también debes desplegar:

1. **syscom-api** - Integración con SYSCOM
2. **tecnosinergia-api** - Integración con Tecnosinergia
3. **stripe-payment** - Pagos con Stripe
4. **mercadopago-payment** - Pagos con MercadoPago
5. **paypal-payment** - Pagos con PayPal
6. **upload-image** - Subida de imágenes
7. **image-proxy** - Proxy de imágenes
8. **send-whatsapp** - Notificaciones WhatsApp
9. **send-telegram** - Notificaciones Telegram
10. **sync-products** - Sincronización de productos

Consulta `EDGE_FUNCTIONS_DOCUMENTATION.md` para instrucciones detalladas de cada función.

---

## Configuración de la Aplicación

### Primera Ejecución

1. **Inicia la aplicación:**
   ```bash
   npm run dev
   ```

2. **Accede al panel de administración:**
   - Abre el navegador en `http://localhost:5173/admin`

3. **Configura la Base de Datos:**
   - Ve a "Base de Datos" en el panel de admin
   - Selecciona "Edge Function (Recomendado)"
   - Nombre de función: `mysql_bd_mayorista`
   - Habilita la conexión
   - Clic en "Probar Conexión"
   - Si la conexión es exitosa, clic en "Guardar Configuración"

### Configuración Opcional

#### APIs de Proveedores

En el panel de admin, configura:

**SYSCOM:**
1. Ve a "SYSCOM Config"
2. Ingresa Client ID y Client Secret
3. Obtén el token OAuth2
4. Configura las categorías a sincronizar

**Tecnosinergia:**
1. Configura el API token en las variables de entorno
2. La integración estará disponible automáticamente

#### Pasarelas de Pago

En "Configuración" → "Pasarelas de Pago":

**MercadoPago:**
- Access Token
- Public Key
- Modo: test/production

**Stripe:**
- Secret Key
- Publishable Key
- Modo: test/production

**PayPal:**
- Client ID
- Client Secret
- Modo: sandbox/production

#### Notificaciones

En "Configuración" → "Notificaciones":

**WhatsApp:**
- Teléfono
- API Token

**Telegram:**
- Bot Token
- Chat ID

---

## Modo Offline

El sistema puede funcionar sin conexión a base de datos:

### Características en Modo Offline
- Navegación del catálogo desde caché local
- Búsqueda de productos
- Visualización de detalles
- Carrito de compras (almacenado localmente)

### Limitaciones en Modo Offline
- No se pueden crear pedidos
- No hay sincronización de stock
- No se pueden agregar/editar productos
- Las funciones de admin están limitadas

### Activar Modo Offline

El modo offline se activa automáticamente cuando:
- La conexión a la base de datos está deshabilitada
- Hay un error de conexión
- El dispositivo está sin conexión a internet

---

## Despliegue

### Opción 1: Vercel (Recomendado)

1. Instala Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Despliega:
   ```bash
   vercel
   ```

3. Configura variables de entorno en el dashboard de Vercel

### Opción 2: Netlify

1. Conecta tu repositorio en Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Configura variables de entorno

### Opción 3: Hosting Tradicional (HostGator, cPanel, etc.)

1. Compila el proyecto:
   ```bash
   npm run build
   ```

2. Sube el contenido de la carpeta `dist/` a tu servidor

3. Configura el archivo `.htaccess` (ya incluido en `/public/.htaccess`)

4. Asegúrate de que las variables de entorno estén configuradas

Consulta `HOSTGATOR_DEPLOYMENT.md` para instrucciones específicas de HostGator.

---

## Solución de Problemas

### Error: "Cannot connect to database"

**Causa:** Credenciales incorrectas o edge function no configurada

**Solución:**
1. Verifica que la edge function `mysql_bd_mayorista` esté desplegada
2. Verifica las credenciales en `system_config` de Supabase
3. Verifica que el servidor MySQL permita conexiones remotas
4. Prueba la conexión desde el panel de admin

### Error: "Token OAuth2 no válido" (SYSCOM)

**Causa:** Token expirado o incorrecto

**Solución:**
1. Ve a "SYSCOM Config" en el panel de admin
2. Regenera el token OAuth2
3. Copia y pega el nuevo token
4. Guarda los cambios

### Error: "CORS" al llamar Edge Functions

**Causa:** Headers CORS no configurados

**Solución:**
- Todas las edge functions incluyen headers CORS
- Verifica que uses la URL correcta de Supabase
- Verifica que el ANON_KEY sea correcto

### La aplicación no carga productos

**Causa:** Base de datos vacía o sin conexión

**Solución:**
1. Verifica que las tablas existan en MySQL
2. Ejecuta una sincronización desde el panel de admin
3. O importa productos manualmente
4. Verifica el estado de conexión en "Base de Datos"

### Modo offline no funciona

**Causa:** IndexedDB no disponible o caché vacío

**Solución:**
1. Asegúrate de que el navegador soporte IndexedDB
2. Habilita el modo offline en la configuración
3. Carga productos al menos una vez con conexión activa
4. Los productos se cachearán automáticamente

---

## Migración de Datos Existentes

Si tienes datos en Supabase PostgreSQL y quieres migrarlos a MySQL:

### Paso 1: Exportar Datos de Supabase

Desde el SQL Editor de Supabase:

```sql
-- Exportar productos
SELECT * FROM products;

-- Exportar categorías
SELECT * FROM categories;

-- Exportar órdenes
SELECT * FROM orders;

-- etc.
```

Descarga como CSV desde la interfaz.

### Paso 2: Convertir Formato

Los UUIDs de PostgreSQL deben mantenerse como CHAR(36) en MySQL.

Los campos JSONB se convierten a JSON automáticamente.

### Paso 3: Importar a MySQL

```bash
mysql -h 162.241.2.158 -u jonat104_psycoraper -p jonat104_mayorista_de_sistemas
```

Luego usa `LOAD DATA INFILE` o herramientas como MySQL Workbench.

---

## Mantenimiento

### Actualizar Tipo de Cambio

El tipo de cambio se actualiza automáticamente desde la API de SYSCOM, pero puedes actualizarlo manualmente:

1. Panel de Admin → Configuración
2. Sección "Tipo de Cambio"
3. Actualizar valores
4. Guardar

### Sincronización de Productos

**Manual:**
1. Panel de Admin → Sincronización
2. Selecciona el proveedor (SYSCOM/Tecnosinergia)
3. Configura filtros
4. Clic en "Iniciar Sincronización"

**Automática:**
- Configurable en "Configuración" → "Sincronización Automática"
- Frecuencia diaria recomendada a las 2:00 AM

### Respaldo de Base de Datos

**Automático (recomendado):**
- Configura backups automáticos en tu servidor MySQL
- Frecuencia recomendada: Diaria

**Manual:**
```bash
mysqldump -h 162.241.2.158 -u jonat104_psycoraper -p jonat104_mayorista_de_sistemas > backup_$(date +%Y%m%d).sql
```

---

## Recursos Adicionales

- **Documentación de Edge Functions:** `EDGE_FUNCTIONS_DOCUMENTATION.md`
- **Script SQL MySQL:** `database/mysql_structure.sql`
- **Guía de Despliegue HostGator:** `HOSTGATOR_DEPLOYMENT.md`

---

## Soporte y Contacto

Para problemas o preguntas:
- Revisa esta documentación completa
- Consulta la documentación de Supabase: https://supabase.com/docs
- Verifica los logs en el panel de admin
- Revisa la consola del navegador para errores del cliente

---

## Licencia

[Tu licencia aquí]

---

**Última actualización:** Octubre 2025
