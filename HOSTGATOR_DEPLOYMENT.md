# Guía de Despliegue en HostGator

Esta guía proporciona instrucciones paso a paso para desplegar tu plataforma de ecommerce en HostGator.

## Requisitos Previos

- Cuenta de HostGator con acceso cPanel
- Dominio configurado y apuntando a HostGator
- Proyecto compilado localmente
- Credenciales de Supabase (ya están configuradas en el proyecto)

## Paso 1: Preparar el Proyecto para Producción

### 1.1 Compilar el Proyecto

En tu máquina local, abre la terminal en la carpeta del proyecto y ejecuta:

```bash
npm run build
```

Este comando creará una carpeta `dist/` con todos los archivos optimizados para producción.

### 1.2 Verificar la Compilación

Asegúrate de que la carpeta `dist/` contiene:
- `index.html`
- Carpeta `assets/` con archivos JS y CSS
- Archivo `.htaccess` (copiado desde `public/`)
- Otros archivos estáticos necesarios

## Paso 2: Acceder a cPanel de HostGator

1. Inicia sesión en tu cuenta de HostGator
2. Accede a cPanel
3. Busca la sección "Files" (Archivos)

## Paso 3: Subir Archivos al Servidor

### Opción A: Usando el File Manager (Gestor de Archivos)

1. En cPanel, haz clic en "File Manager"
2. Navega a la carpeta `public_html` (o la carpeta de tu dominio)
3. Si hay archivos existentes, haz un respaldo y bórralos
4. Haz clic en "Upload" (Subir)
5. Selecciona TODOS los archivos dentro de la carpeta `dist/` (NO la carpeta dist en sí)
6. Espera a que se complete la carga

### Opción B: Usando FTP

1. Descarga un cliente FTP como FileZilla
2. Conéctate usando las credenciales FTP de tu cuenta HostGator:
   - Host: ftp.tudominio.com
   - Usuario: Tu usuario de cPanel
   - Contraseña: Tu contraseña de cPanel
   - Puerto: 21
3. Navega a la carpeta `public_html`
4. Sube TODOS los archivos de la carpeta `dist/`

## Paso 4: Configurar el Archivo .htaccess

### 4.1 Verificar que .htaccess se Subió

El archivo `.htaccess` debe estar en la raíz de `public_html`. Si no se subió automáticamente:

1. Ve a File Manager
2. Habilita "Show Hidden Files" en configuración
3. Si no existe, crea un nuevo archivo llamado `.htaccess`
4. Copia el contenido del archivo `.htaccess` del proyecto

### 4.2 Contenido del .htaccess

El archivo debe contener:
- Reescritura de URLs para React Router
- Compresión Gzip
- Caché del navegador
- Headers de seguridad
- Deshabilitación de listado de directorios

## Paso 5: Verificar Variables de Entorno

Las variables de entorno para Supabase ya están compiladas en el build. Sin embargo, si necesitas cambiarlas:

### Para Cambiar Variables en Producción

1. Edita el archivo `.env` localmente
2. Cambia las variables necesarias:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon
```
3. Vuelve a ejecutar `npm run build`
4. Sube los nuevos archivos a HostGator

**IMPORTANTE**: Las variables de entorno NO pueden cambiarse después de compilar sin volver a hacer build.

## Paso 6: Configurar el Dominio

### 6.1 Si Usas el Dominio Principal

No necesitas configuración adicional. El sitio estará disponible en `https://tudominio.com`

### 6.2 Si Usas un Subdominio

1. En cPanel, ve a "Subdomains" (Subdominios)
2. Crea un subdominio (ej: tienda.tudominio.com)
3. Apunta la raíz del documento a la carpeta donde subiste los archivos
4. Sube los archivos a la carpeta del subdominio

### 6.3 Si Usas una Subcarpeta

Si el sitio estará en `https://tudominio.com/tienda`:

1. Crea una carpeta `tienda` dentro de `public_html`
2. Sube los archivos de `dist/` a esa carpeta
3. Edita `vite.config.ts` antes de compilar:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/tienda/', // Agrega esta línea
})
```

4. Vuelve a compilar y subir

## Paso 7: Configurar SSL/HTTPS

### 7.1 Activar SSL Gratis de HostGator

1. En cPanel, busca "SSL/TLS Status"
2. Selecciona tu dominio
3. Haz clic en "Run AutoSSL"
4. Espera la instalación (puede tardar unos minutos)

### 7.2 Forzar HTTPS

Agrega esto al INICIO de tu `.htaccess`:

```apache
# Force HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

## Paso 8: Verificar la Instalación

### 8.1 Pruebas Básicas

1. Visita tu dominio: `https://tudominio.com`
2. Verifica que la página principal carga correctamente
3. Navega a diferentes secciones (Productos, Admin, Carrito)
4. Verifica que las rutas funcionan correctamente

### 8.2 Verificar Conexión a Supabase

1. Ve a la página de Productos
2. Si ves productos, la conexión funciona
3. Si ves errores en la consola del navegador (F12), verifica las variables de entorno

### 8.3 Probar Funcionalidades

- Agregar productos al carrito
- Navegar entre páginas
- Acceder al panel de administración
- Verificar que las imágenes cargan

## Paso 9: Configuración de Performance

### 9.1 Verificar Compresión Gzip

Usa herramientas online como:
- [GIDZipTest](https://www.gidnetwork.com/tools/gzip-test.php)
- Ingresa tu URL y verifica que la compresión está activa

### 9.2 Verificar Caché

1. Abre Chrome DevTools (F12)
2. Ve a la pestaña "Network"
3. Recarga la página
4. Verifica que los archivos estáticos muestran "304 Not Modified" en recargas

### 9.3 Optimizar Rendimiento

Si el sitio es lento:

1. **Habilita CloudFlare** (gratis en HostGator):
   - En cPanel, busca "CloudFlare"
   - Sigue los pasos de configuración
   - Activa caché y optimización automática

2. **Verifica el Plan de Hosting**:
   - Si tienes mucho tráfico, considera upgrading tu plan
   - Shared hosting puede ser lento con mucho tráfico

## Paso 10: Mantenimiento y Actualizaciones

### 10.1 Actualizar el Sitio

Para actualizar el sitio con nuevos cambios:

1. Realiza cambios en tu código local
2. Ejecuta `npm run build`
3. Descarga los archivos existentes de HostGator como respaldo
4. Sube los nuevos archivos de `dist/` al servidor
5. Limpia la caché del navegador (Ctrl + Shift + R)

### 10.2 Respaldos

#### Respaldo Manual
1. En cPanel, ve a "Backup Wizard"
2. Selecciona "Backup" → "Full Backup"
3. Espera el email con el link de descarga

#### Respaldo Automático
HostGator hace respaldos automáticos, pero mantén tus propios respaldos:
- Guarda una copia de `dist/` localmente
- Guarda el código fuente en GitHub/GitLab
- Exporta la base de datos de Supabase regularmente

### 10.3 Monitoreo

Herramientas recomendadas:
- **Google Analytics**: Para métricas de tráfico
- **Google Search Console**: Para SEO
- **Uptime Robot**: Para monitorear disponibilidad (gratis)
- **Supabase Dashboard**: Para monitorear queries de base de datos

## Solución de Problemas Comunes

### Problema: Página en Blanco

**Causa**: Error en la carga de archivos JS/CSS

**Solución**:
1. Verifica que el `.htaccess` esté presente
2. Revisa la consola del navegador (F12) para errores
3. Verifica que todos los archivos se subieron correctamente

### Problema: 404 en Rutas

**Causa**: `.htaccess` no está funcionando o configurado incorrectamente

**Solución**:
1. Verifica que `.htaccess` está en la raíz
2. Verifica que el módulo `mod_rewrite` está activo (usualmente lo está en HostGator)
3. Contacta soporte de HostGator si persiste

### Problema: No Carga Datos de Supabase

**Causa**: Variables de entorno incorrectas o problemas de CORS

**Solución**:
1. Verifica las variables en `.env` antes de compilar
2. Compila nuevamente con las variables correctas
3. Verifica configuración CORS en Supabase Dashboard

### Problema: Imágenes No Cargan

**Causa**: Rutas incorrectas o permisos de archivos

**Solución**:
1. Verifica que las imágenes se subieron
2. Verifica permisos de carpetas (755) y archivos (644)
3. Usa rutas absolutas o desde CDN/Supabase Storage

### Problema: Sitio Muy Lento

**Causa**: Servidor compartido saturado o archivos sin optimizar

**Solución**:
1. Activa CloudFlare
2. Optimiza imágenes antes de subir
3. Considera upgrading tu plan de hosting
4. Usa Supabase Storage para imágenes grandes

## Información de Contacto para Soporte

### Soporte de HostGator
- Teléfono: Consulta tu cuenta
- Chat en vivo: Disponible 24/7 en portal
- Tickets: Desde cPanel

### Soporte de Supabase
- Dashboard: https://app.supabase.com
- Documentación: https://supabase.com/docs
- Discord: https://discord.supabase.com

## Checklist Final

Antes de considerar el despliegue completo:

- [ ] Proyecto compilado sin errores
- [ ] Todos los archivos subidos a HostGator
- [ ] `.htaccess` configurado y funcionando
- [ ] SSL/HTTPS activo y forzado
- [ ] Todas las rutas funcionan correctamente
- [ ] Conexión a Supabase funcionando
- [ ] Carrito de compras funcional
- [ ] Panel de administración accesible
- [ ] Imágenes y assets cargando
- [ ] Rendimiento verificado
- [ ] Respaldo inicial realizado
- [ ] Google Analytics configurado (opcional)

## Próximos Pasos

Después del despliegue exitoso:

1. **Configurar Dominio Personalizado**: Si aún no lo has hecho
2. **Agregar Productos**: Sincronizar desde las APIs o agregar manualmente
3. **Configurar Pagos**: Integrar MercadoPago, Stripe, PayPal
4. **Configurar Notificaciones**: WhatsApp y Telegram para pedidos
5. **SEO**: Agregar meta tags, sitemap, robots.txt
6. **Marketing**: Configurar pixel de Facebook, Google Ads

## Recursos Adicionales

- [Documentación de HostGator](https://www.hostgator.com/help)
- [Documentación de React Router](https://reactrouter.com)
- [Documentación de Vite](https://vitejs.dev)
- [Documentación de Supabase](https://supabase.com/docs)

---

**Última Actualización**: Octubre 2025

**Versión del Documento**: 1.0

Para preguntas o problemas no cubiertos en esta guía, consulta la documentación oficial o contacta al soporte técnico correspondiente.
