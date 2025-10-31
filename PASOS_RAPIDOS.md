# Pasos Rápidos para Poner en Marcha

## 🚀 Implementación en 20 Minutos

---

## PASO 1: Crear Base de Datos MySQL (5 min)

### Desde línea de comandos:
```bash
mysql -h 162.241.2.158 -u jonat104_psycoraper -p jonat104_mayorista_de_sistemas < database/mysql_structure.sql
```

### O desde phpMyAdmin/cPanel:
1. Entra a phpMyAdmin
2. Selecciona la base de datos: `jonat104_mayorista_de_sistemas`
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido completo de `database/mysql_structure.sql`
5. Clic en "Continuar"
6. Verifica que se crearon 12 tablas

---

## PASO 2: Configurar Edge Function en Supabase (8 min)

### A. Crear la Función

1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto
3. Menú lateral → "Edge Functions"
4. Clic en "New Function"
5. **Nombre:** `mysql_bd_mayorista`
6. **Código:** Copia TODO el contenido de:
   ```
   supabase/functions/mysql_bd_mayorista/index.ts
   ```
7. Clic en "Deploy"

### B. Guardar Credenciales en Supabase

1. En el mismo proyecto de Supabase
2. Menú lateral → "SQL Editor"
3. Clic en "New query"
4. Copia y pega este SQL:

```sql
-- Crear tabla si no existe
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

5. Clic en "Run"
6. Verifica que diga "Success. No rows returned"

### C. Probar la Conexión

Desde terminal (opcional pero recomendado):

```bash
curl -X POST \
  https://TU-PROYECTO.supabase.co/functions/v1/mysql_bd_mayorista \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "ping"}'
```

Reemplaza:
- `TU-PROYECTO` con tu project ref de Supabase
- `TU_ANON_KEY` con tu anon key (Settings → API)

Respuesta esperada:
```json
{"success":true,"message":"Connected to MySQL"}
```

---

## PASO 3: Compilar el Proyecto (2 min)

```bash
# Si aún no has instalado dependencias
npm install

# Compilar
npm run build
```

Verifica que compile sin errores. Deberías ver:
```
✓ built in ~5s
```

---

## PASO 4: Configurar desde el Panel de Admin (3 min)

### En Desarrollo:
```bash
npm run dev
```

Luego abre: `http://localhost:5173/admin`

### Configuración:

1. **Ve a "Base de Datos"** (tarjeta con ícono de base de datos)

2. **Marca la casilla:**
   - ☑️ Habilitar conexión a base de datos

3. **Selecciona modo:**
   - 🔘 Edge Function (Recomendado)

4. **Nombre de función:**
   - Ingresa: `mysql_bd_mayorista`

5. **Probar conexión:**
   - Clic en "Probar Conexión"
   - Debe mostrar: ✅ "Conexión exitosa a la base de datos"
   - Estado debe cambiar a: 🟢 "Conectado"

6. **Guardar:**
   - Clic en "Guardar Configuración"
   - Debe mostrar: "Configuración guardada correctamente"

---

## PASO 5: Verificar Todo Funciona (2 min)

### Prueba Rápida:

1. **Ver productos:**
   - Panel Admin → "Productos"
   - Debe cargar sin errores (aunque esté vacío)

2. **Ver categorías:**
   - Panel Admin → "Sincronización"
   - Debe cargar el panel

3. **Probar modo offline:**
   - Ve a "Base de Datos"
   - Desmarca "Habilitar conexión"
   - Guarda
   - Estado debe cambiar a: 🔴 "Desconectado"
   - La app debe seguir funcionando (modo offline)

4. **Volver a online:**
   - Marca "Habilitar conexión"
   - Guarda
   - Estado debe volver a: 🟢 "Conectado"

### ¡Listo! ✅

Tu sistema está funcionando con MySQL.

---

## Comandos de Verificación Rápida

### Verificar estructura de BD MySQL:
```bash
mysql -h 162.241.2.158 -u jonat104_psycoraper -p -e "USE jonat104_mayorista_de_sistemas; SHOW TABLES;"
```

Debe mostrar 12 tablas:
```
api_sync_logs
banners
brands
carts
categories
notification_config
orders
product_categories
products
syscom_products
syscom_selected_categories
system_config
```

### Verificar datos iniciales:
```bash
mysql -h 162.241.2.158 -u jonat104_psycoraper -p -e "USE jonat104_mayorista_de_sistemas; SELECT key, description FROM system_config;"
```

Debe mostrar configuraciones como:
- global_markup_percentage
- exchange_rate
- DB_HOST
- DB_PORT
- etc.

---

## Solución Rápida de Problemas

### ❌ Error: "Cannot connect to database"

**Causa:** Edge function no encuentra credenciales

**Solución:**
```sql
-- Ejecuta de nuevo en SQL Editor de Supabase
DELETE FROM system_config WHERE key LIKE 'DB_%';

INSERT INTO system_config (key, value) VALUES
  ('DB_HOST', '"162.241.2.158"'),
  ('DB_PORT', '"3306"'),
  ('DB_USER', '"jonat104_psycoraper"'),
  ('DB_PASSWORD', '"Mavana1357"'),
  ('DB_NAME', '"jonat104_mayorista_de_sistemas"');
```

### ❌ Error: "Edge Function not found"

**Causa:** Nombre incorrecto de función

**Solución:**
1. Ve a Supabase → Edge Functions
2. Verifica que exista `mysql_bd_mayorista`
3. Si no existe, créala (ver Paso 2A)
4. Si existe con otro nombre, usa ese nombre en el panel de admin

### ❌ Error: "Access denied for user"

**Causa:** Credenciales de MySQL incorrectas

**Solución:**
1. Verifica en tu hosting que las credenciales sean correctas
2. Prueba conectarte manualmente:
   ```bash
   mysql -h 162.241.2.158 -u jonat104_psycoraper -p
   ```
3. Si funciona, actualiza las credenciales en Supabase
4. Si no funciona, contacta a tu proveedor de hosting

### ❌ Pantalla blanca al iniciar

**Causa:** Error de JavaScript (probablemente no es este caso)

**Solución:**
1. Abre consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Reporta el error exacto

---

## Próximos Pasos (Opcional)

Una vez que todo funcione, puedes:

### 1. Sincronizar Productos de SYSCOM
- Panel Admin → SYSCOM Config
- Configurar credenciales OAuth2
- Sincronizar productos

### 2. Configurar Pasarelas de Pago
- Panel Admin → Configuración
- Sección "Pasarelas de Pago"
- Configurar MercadoPago/Stripe/PayPal

### 3. Subir a Producción
- Ejecutar: `npm run build`
- Subir carpeta `dist/` a tu hosting
- Configurar dominio
- ¡Listo!

---

## Archivos de Referencia

Si necesitas más detalles, consulta:

- **Guía completa:** `INSTALACION_Y_CONFIGURACION.md`
- **Edge functions:** `EDGE_FUNCTIONS_DOCUMENTATION.md`
- **Resumen técnico:** `RESUMEN_IMPLEMENTACION.md`
- **Script MySQL:** `database/mysql_structure.sql`

---

## ¿Necesitas Ayuda?

### Verifica:
1. ✅ MySQL creado con 12 tablas
2. ✅ Edge function `mysql_bd_mayorista` desplegada
3. ✅ Credenciales guardadas en Supabase
4. ✅ Proyecto compilado sin errores
5. ✅ Panel de admin muestra "Conectado"

Si todos están ✅ pero algo no funciona:
- Revisa la consola del navegador (F12)
- Revisa logs en Supabase (Edge Functions → Logs)
- Consulta `INSTALACION_Y_CONFIGURACION.md`

---

**¡Éxito! 🎉**

Tu sistema está listo para producción.
