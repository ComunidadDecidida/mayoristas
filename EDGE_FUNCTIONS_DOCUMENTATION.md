# Documentación Completa de Edge Functions

Este documento contiene información detallada sobre todas las Edge Functions utilizadas en el proyecto Mayorista de Sistemas.

## Tabla de Contenidos

1. [mysql_bd_mayorista](#1-mysql_bd_mayorista)
2. [syscom-api](#2-syscom-api)
3. [tecnosinergia-api](#3-tecnosinergia-api)
4. [stripe-payment](#4-stripe-payment)
5. [mercadopago-payment](#5-mercadopago-payment)
6. [paypal-payment](#6-paypal-payment)
7. [stripe-webhook](#7-stripe-webhook)
8. [mercadopago-webhook](#8-mercadopago-webhook)
9. [upload-image](#9-upload-image)
10. [delete-image](#10-delete-image)
11. [image-proxy](#11-image-proxy)
12. [send-whatsapp](#12-send-whatsapp)
13. [send-telegram](#13-send-telegram)
14. [send-notifications](#14-send-notifications)
15. [sync-products](#15-sync-products)

---

## 1. mysql_bd_mayorista

### Propósito
Proporciona un proxy seguro para conectarse a la base de datos MySQL sin exponer las credenciales en el cliente.

### Variables de Entorno Requeridas
Estas variables se almacenan en `system_config`:
- `DB_HOST` - Host de MySQL (ej: 162.241.2.158)
- `DB_PORT` - Puerto de MySQL (ej: 3306)
- `DB_USER` - Usuario de MySQL
- `DB_PASSWORD` - Contraseña de MySQL
- `DB_NAME` - Nombre de la base de datos

### Dependencias NPM
```typescript
import { createClient } from "npm:@supabase/supabase-js@2";
import "npm:mysql2@3.6.5/promise";
```

### Acciones Disponibles

#### ping
Verifica la conexión a MySQL.

**Request:**
```json
{
  "action": "ping"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connected to MySQL"
}
```

#### query
Ejecuta una consulta SELECT.

**Request:**
```json
{
  "action": "query",
  "table": "products",
  "options": {
    "select": "*",
    "eq": { "is_visible": true },
    "order": { "column": "created_at", "ascending": false },
    "limit": 20
  }
}
```

**Response:**
```json
{
  "data": [...],
  "count": 150,
  "success": true
}
```

#### insert
Inserta un nuevo registro.

**Request:**
```json
{
  "action": "insert",
  "table": "products",
  "data": {
    "sku": "PROD-001",
    "title": "Producto Test",
    "base_price": 100.00
  }
}
```

#### update
Actualiza un registro existente.

**Request:**
```json
{
  "action": "update",
  "table": "products",
  "id": "uuid-here",
  "updates": {
    "final_price": 120.00
  }
}
```

#### delete
Elimina un registro.

**Request:**
```json
{
  "action": "delete",
  "table": "products",
  "id": "uuid-here"
}
```

### Cómo Crear en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a "Edge Functions"
3. Haz clic en "New Function"
4. Nombre: `mysql_bd_mayorista`
5. Copia el código desde `/supabase/functions/mysql_bd_mayorista/index.ts`
6. Asegúrate de que las credenciales de MySQL estén en `system_config`

### Configurar Credenciales

Ejecuta este SQL en tu base de datos de Supabase:

```sql
INSERT INTO system_config (key, value, description) VALUES
  ('DB_HOST', '"162.241.2.158"', 'Host de MySQL'),
  ('DB_PORT', '"3306"', 'Puerto de MySQL'),
  ('DB_USER', '"jonat104_psycoraper"', 'Usuario de MySQL'),
  ('DB_PASSWORD', '"Mavana1357"', 'Contraseña de MySQL'),
  ('DB_NAME', '"jonat104_mayorista_de_sistemas"', 'Nombre de BD MySQL')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## 2. syscom-api

### Propósito
Proxy para la API de SYSCOM que maneja la autenticación OAuth2.

### Variables de Entorno Requeridas
En `system_config`:
- `syscom_oauth_token` - Token OAuth2 de SYSCOM
- `syscom_token_expires_at` - Fecha de expiración del token

### Acciones Disponibles

#### categories
Obtiene todas las categorías de SYSCOM.

**Request URL:**
```
?action=categories
```

#### products
Obtiene productos de SYSCOM con filtros opcionales.

**Request URL:**
```
?action=products&categoria=123&stock=1&pagina=1
```

#### brands
Obtiene todas las marcas disponibles.

**Request URL:**
```
?action=brands
```

#### exchange-rate
Obtiene el tipo de cambio actual USD/MXN.

**Request URL:**
```
?action=exchange-rate
```

### Límites de la API
- 50 peticiones por minuto
- El token OAuth2 debe renovarse periódicamente

---

## 3. tecnosinergia-api

### Propósito
Proxy para la API de Tecnosinergia.

### Variables de Entorno
```bash
TECNOSINERGIA_API_TOKEN=$2y$10$0QvOf0CwYT/E9T.Srn4LcehBu32m2TmKnGoU55IkwMeTW953.qH.m
TECNOSINERGIA_API_BASE_URL=https://api.tecnosinergia.info/v3
```

### Acciones Disponibles

#### status
Verifica el estado de la API.

#### products
Lista productos disponibles.

#### create-order
Crea una orden en Tecnosinergia.

---

## 4. stripe-payment

### Propósito
Crea sesiones de pago con Stripe.

### Variables de Entorno
En `system_config`:
```json
{
  "key": "stripe_config",
  "value": {
    "enabled": true,
    "secret_key": "sk_test_...",
    "publishable_key": "pk_test_...",
    "mode": "test"
  }
}
```

### Request
```json
{
  "order_id": "ORD-123",
  "items": [
    {
      "title": "Producto 1",
      "sku": "SKU-001",
      "price": 100.00,
      "quantity": 2
    }
  ],
  "total": 200.00,
  "currency": "mxn",
  "customer_info": {
    "email": "cliente@example.com"
  }
}
```

### Response
```json
{
  "success": true,
  "session_url": "https://checkout.stripe.com/...",
  "session_id": "cs_test_..."
}
```

---

## 5. mercadopago-payment

### Propósito
Crea preferencias de pago con MercadoPago.

### Variables de Entorno
En `system_config`:
```json
{
  "key": "mercadopago_config",
  "value": {
    "enabled": true,
    "access_token": "APP_USR-...",
    "public_key": "APP_USR-...",
    "mode": "test"
  }
}
```

### Request
```json
{
  "order_id": "ORD-123",
  "items": [
    {
      "title": "Producto 1",
      "price": 100.00,
      "quantity": 2
    }
  ],
  "total": 200.00,
  "currency": "MXN",
  "customer_info": {
    "name": "Cliente",
    "email": "cliente@example.com",
    "phone": "5512345678"
  }
}
```

---

## 6. paypal-payment

### Propósito
Crea órdenes de pago con PayPal.

### Variables de Entorno
En `system_config`:
```json
{
  "key": "paypal_config",
  "value": {
    "enabled": true,
    "client_id": "...",
    "client_secret": "...",
    "mode": "sandbox"
  }
}
```

---

## 7. stripe-webhook

### Propósito
Procesa webhooks de Stripe para actualizar el estado de pagos.

### Eventos Procesados
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

## 8. mercadopago-webhook

### Propósito
Procesa notificaciones IPN de MercadoPago.

### Eventos Procesados
- `payment` - Actualización de estado de pago

---

## 9. upload-image

### Propósito
Sube imágenes al bucket de Supabase Storage.

### Request
```json
{
  "file": "base64_encoded_image",
  "filename": "product-image.jpg",
  "bucket": "product-images"
}
```

### Response
```json
{
  "success": true,
  "url": "https://storage.supabase.co/..."
}
```

---

## 10. delete-image

### Propósito
Elimina imágenes del bucket de Supabase Storage.

### Request
```json
{
  "url": "https://storage.supabase.co/...",
  "bucket": "product-images"
}
```

---

## 11. image-proxy

### Propósito
Proxy para servir imágenes externas evitando problemas de CORS.

### Request URL
```
?url=https://syscom.mx/images/producto.jpg
```

---

## 12. send-whatsapp

### Propósito
Envía mensajes de WhatsApp a través de API de WhatsApp Business.

### Variables de Entorno
En `notification_config`:
```json
{
  "service": "whatsapp",
  "is_enabled": true,
  "config": {
    "phone": "5212345678",
    "api_token": "token_here"
  }
}
```

### Request
```json
{
  "message": "Tienes un nuevo pedido: ORD-123",
  "order_id": "ORD-123"
}
```

---

## 13. send-telegram

### Propósito
Envía notificaciones a través de Telegram Bot.

### Variables de Entorno
En `notification_config`:
```json
{
  "service": "telegram",
  "is_enabled": true,
  "config": {
    "bot_token": "123456:ABC-DEF...",
    "chat_id": "123456789"
  }
}
```

---

## 14. send-notifications

### Propósito
Orquestador que envía notificaciones a través de múltiples canales.

### Request
```json
{
  "type": "new_order",
  "order": {
    "order_number": "ORD-123",
    "total": 1500.00,
    "customer_info": {
      "name": "Cliente",
      "email": "cliente@example.com"
    }
  }
}
```

---

## 15. sync-products

### Propósito
Sincroniza productos desde las APIs de SYSCOM y Tecnosinergia.

### Request
```json
{
  "source": "syscom",
  "filters": {
    "categoria": "123",
    "stock": true
  }
}
```

### Response
```json
{
  "success": true,
  "products_synced": 150,
  "errors": []
}
```

---

## Despliegue de Edge Functions

### Requisitos Previos
- Cuenta de Supabase activa
- CLI de Supabase instalado (opcional, recomendado para desarrollo)

### Método 1: Dashboard de Supabase (Recomendado)

1. **Acceder al Dashboard**
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto

2. **Crear Edge Function**
   - Ve a "Edge Functions" en el menú lateral
   - Clic en "New Function"
   - Ingresa el nombre de la función
   - Pega el código desde el archivo correspondiente en `supabase/functions/[nombre]/index.ts`
   - Clic en "Deploy"

3. **Configurar Variables**
   - Las variables de entorno se almacenan en `system_config`
   - Ejecuta los scripts SQL proporcionados para cada función

### Método 2: Usando la CLI (Avanzado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref [tu-project-ref]

# Deploy función individual
supabase functions deploy mysql_bd_mayorista

# Deploy todas las funciones
supabase functions deploy
```

### Verificar Despliegue

Prueba cada función con:

```bash
curl -X POST https://[tu-proyecto].supabase.co/functions/v1/[nombre-funcion] \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"action": "ping"}'
```

---

## Solución de Problemas

### Error: "Missing MySQL credential"
- Verifica que todas las credenciales estén en `system_config`
- Asegúrate de que el formato sea correcto (string JSON)

### Error: "Token OAuth2 no válido"
- El token de SYSCOM necesita ser renovado
- Ve a admin panel → SYSCOM Config → Actualizar Token

### Error: "CORS"
- Todas las funciones incluyen headers CORS
- Verifica que el header `Access-Control-Allow-Origin` esté presente

### Error de Timeout
- Las Edge Functions tienen timeout de 60 segundos
- Para operaciones largas, considera dividir en múltiples llamadas

---

## Mejores Prácticas

1. **Seguridad**
   - Nunca expongas credenciales en el código del cliente
   - Usa Edge Functions para operaciones sensibles
   - Implementa rate limiting cuando sea necesario

2. **Performance**
   - Implementa caché local para reducir llamadas
   - Usa paginación para grandes conjuntos de datos
   - Considera usar el modo offline cuando sea posible

3. **Mantenimiento**
   - Mantén logs de todas las operaciones críticas
   - Monitorea el uso de las funciones en Supabase Dashboard
   - Actualiza dependencias regularmente

4. **Desarrollo**
   - Prueba localmente usando el CLI de Supabase
   - Usa variables de entorno separadas para test/producción
   - Documenta cualquier cambio en este archivo

---

## Contacto y Soporte

Para preguntas o problemas:
- Revisa la documentación de Supabase: https://supabase.com/docs
- Consulta los logs en el Dashboard de Supabase
- Verifica el estado de las APIs externas (SYSCOM, Tecnosinergia)
