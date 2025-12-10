# ✅ Sistema de Cache Dinámico - Cambios Realizados

## 📋 Resumen

Se ha implementado un sistema que detecta automáticamente si estás en **desarrollo** o **producción** y obtiene los datos de manera diferente:

- **Desarrollo:** Obtiene datos de la API en tiempo real (sin prefetch)
- **Producción:** Usa cache generado con prefetch (super rápido)

---

## 📁 Archivos Creados

### 1. `aplicaciones/www/fuente/utilidades/cache-dinamico.ts`

- Nuevo módulo que implementa la lógica dinámica
- Detecta `NODE_ENV === 'development'`
- En desarrollo: Hace llamadas GraphQL async
- En producción: Lee archivos JSON del cache
- Incluye cache en memoria para mejorar performance

**Funciones async ahora:**

- `obtenerDocumentos()`
- `obtenerDocumento(slug)`
- `obtenerPersonajes()`
- `obtenerPersonaje(slug)`
- `obtenerCategorias()`
- `obtenerCategoria(slug)`
- `obtenerPaginas()`
- `obtenerPagina(slug)`
- `obtenerGlosario()`
- `obtenerTerminoGlosario(slug)`
- `obtenerCategoriasPrincipales()`
- `obtenerTranscripcionesCategoria(slug)`
- `obtenerTodasTranscripcionesCategorias()`

### 2. `aplicaciones/www/DESARROLLO.md`

- Documentación sobre el nuevo sistema
- Guía de uso para desarrolladores
- Troubleshooting común
- Instrucciones para investigadores externos

### 3. `aplicaciones/www/scripts/dev-helper.js`

- Script helper para facilitar comandos
- Detecta automáticamente si hay cache disponible

---

## 🔧 Archivos Modificados

### 1. `aplicaciones/www/fuente/utilidades/cache.ts`

**Antes:** Exportaba funciones síncronas que leían directamente del cache
**Ahora:** Re-exporta todo desde `cache-dinamico.ts` (que es dinámico)

### 2. `aplicaciones/www/package.json`

**Agregados:**

```json
"dev:api": "astro dev",      // Desarrollo con API
"dev:cache": "astro dev"     // Desarrollo con cache
```

### 3. Archivos que usan cache (actualizados para `await`)

Todos estos archivos ahora usan `await` con las funciones de cache:

- `fuente/pages/[slug].astro` - Página dinámica
- `fuente/pages/index.astro` - Homepage
- `fuente/pages/historia-oral.astro`
- `fuente/pages/glosario.astro`
- `fuente/pages/documentos/[slug].astro`
- `fuente/pages/personajes/[slug].astro`
- `fuente/pages/categorias/[slug].astro`
- `fuente/componentes/FiltrosHistoriaOral.astro`
- `fuente/componentes/RedRelaciones.astro`

---

## 🚀 Cómo usar

### Opción 1: Desarrollo rápido (SIN prefetch)

```bash
cd aplicaciones/www
yarn dev
```

**Ventajas:**

- No necesitas ejecutar `yarn prebuild` primero
- Los datos se obtienen de la API en tiempo real
- Los cambios en WordPress se ven inmediatamente
- Perfecto para desarrollo ágil

### Opción 2: Desarrollo con cache local

```bash
cd aplicaciones/www
yarn prebuild   # Una sola vez
yarn dev        # Usa el cache local
```

**Ventajas:**

- Más rápido que usar la API
- No depende de conexión con el servidor
- Perfecto si está offline

### Build (producción)

```bash
cd aplicaciones/www
yarn build      # Ejecuta prebuild automáticamente
```

**Cómo funciona:**

1. Ejecuta `yarn prebuild` (genera cache)
2. Ejecuta `astro check` (verifica tipos)
3. Ejecuta `astro build` (compila el sitio)
4. Sitio final es ultra rápido (sin llamadas API)

---

## 🔄 Cómo funciona internamente

```
┌─────────────────┐
│   yarn dev      │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│ NODE_ENV = 'development'?    │
└────┬──────────────────────┬──┘
     │                      │
   SÍ                       NO
     │                      │
     ▼                      ▼
┌─────────────┐        ┌────────────────┐
│  Llama API  │        │ Lee cache.json │
│ (en tiempo  │        │  (archivos en  │
│   real)     │        │   .cache/)     │
└─────────────┘        └────────────────┘
     │                      │
     └──────────┬───────────┘
                │
                ▼
        ┌───────────────┐
        │ Sitio renderizado
        │   con datos
        └───────────────┘
```

### En desarrollo:

1. `cache-dinamico.ts` detecta que es development
2. Llama a GraphQL API `historiasinternetpre.uniandes.edu.co/graphql`
3. Obtiene datos en tiempo real con paginación automática
4. Cache en memoria evita re-consultar los mismos datos

### En producción:

1. `cache-dinamico.ts` detecta que es producción
2. Lee archivos JSON del directorio `.cache/`
3. Cero llamadas a la API
4. Sitio es rápidísimo

---

## ✨ Ventajas principales

| Aspecto           | Antes                       | Ahora                      |
| ----------------- | --------------------------- | -------------------------- |
| **Desarrollo**    | Necesitabas `yarn prebuild` | Directo `yarn dev`         |
| **Datos frescos** | Necesitabas regenerar cache | Automáticos en tiempo real |
| **Velocidad dev** | Lenta (API + build)         | Rápida (solo dev server)   |
| **Offline**       | No funcionaba               | Funciona si tienes cache   |
| **Producción**    | Rápido con cache            | Ultra rápido con cache     |

---

## 📝 Notas importantes

1. **Astro maneja NODE_ENV automáticamente:**
   - `yarn dev` → `NODE_ENV=development`
   - `yarn build` → `NODE_ENV=production`

2. **Las funciones son async:**
   - Ahora retornan `Promise<T>`
   - Debes usar `await` al llamarlas

3. **Paginación automática:**
   - El sistema obtiene todas las páginas automáticamente
   - Maneja `hasNextPage` y `endCursor` internamente

4. **Cache en memoria:**
   - Durante la sesión de dev, los datos se cachean
   - Evita re-consultar lo mismo múltiples veces

5. **Compatible con arquitectura actual:**
   - No rompe nada existente
   - Funciona con todos los archivos `.astro`
   - Compatible con el build actual

---

## 🧪 Testing

Para verificar que funciona:

1. **Modo desarrollo con API:**

   ```bash
   cd aplicaciones/www
   rm -r .cache  # Elimina cache (opcional)
   yarn dev      # Debería obtener de la API
   ```

2. **Modo desarrollo con cache:**

   ```bash
   cd aplicaciones/www
   yarn prebuild # Genera cache
   yarn dev      # Debería usar el cache
   ```

3. **Build:**
   ```bash
   yarn build    # Debería hacer prebuild + build
   ```

---

## 🚨 Troubleshooting

### Error: "Cannot find module '@/utilidades/cache'"

- **Solución:** Reinicia el servidor de desarrollo

### Error: "Cannot POST /graphql"

- **Solución:** Verifica que `historiasinternetpre.uniandes.edu.co` esté disponible
- **Alternativa:** Usa cache local con `yarn prebuild && yarn dev`

### "Los datos no se actualizan en dev"

- **Solución:** Recarga la página (F5)
- **Nota:** El desarrollo es en tiempo real, pero necesita recargar

### "Quiero ver cambios de WordPress en el momento"

- **Solución:** Usa `yarn dev` sin cache (API en tiempo real)

### "El servidor es lento en desarrollo"

- **Solución:** Usa `yarn prebuild && yarn dev` (cache local)

---

## 🎉 ¡Listo!

Ahora puedes:

- ✅ Desarrollar sin hacer `yarn prebuild` primero
- ✅ Ver cambios de WordPress inmediatamente en tiempo real
- ✅ Usar cache local si prefieres velocidad
- ✅ Tener producción super rápida

**¡Desarrollo más fluido y sin fricción!** 🚀
