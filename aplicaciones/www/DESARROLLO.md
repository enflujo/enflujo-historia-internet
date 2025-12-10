# 🚀 Sistema de Cache Dinámico para Desarrollo

## ¿Qué cambió?

Ahora el proyecto funciona diferente en **desarrollo** vs **producción**:

### 📱 En Desarrollo (`yarn dev`)

- **NO necesitas** ejecutar `yarn prebuild` primero
- Los datos se obtienen **directamente de la API** en tiempo real
- Los cambios en WordPress se ven **inmediatamente**
- El desarrollo es más rápido y sin pasos extra

### 🏢 En Producción (Build)

- Se ejecuta `yarn prebuild` automáticamente
- Los datos se obtienen **una sola vez** y se cachean
- El sitio es super rápido porque no hace llamadas a la API

---

## Cómo funciona

El archivo `cache-dinamico.ts` detecta automáticamente:

```typescript
const esDesarrollo = process.env.NODE_ENV === 'development';
```

**Si es desarrollo:** Hace llamadas a la API (async/await)
**Si es producción:** Lee los archivos JSON del cache

---

## ¿Cómo uso el desarrollo ahora?

### Opción 1: Modo rápido (recomendado)

```bash
cd aplicaciones/www
yarn dev
```

Y listo. El servidor arranca y obtiene datos de la API en el acto. Sin necesidad de prefetch.

### Opción 2: Si quieres probar con cache local

```bash
cd aplicaciones/www
yarn prebuild   # Genera los archivos .json en .cache/
yarn dev        # Usa el cache en lugar de la API (más rápido)
```

---

## Cambios en el código

Todas las funciones de cache ahora son **async**:

### Antes:

```typescript
const personajes = obtenerPersonajes();
```

### Ahora:

```typescript
const personajes = await obtenerPersonajes();
```

Esto ya está aplicado en todos los archivos `.astro` que usan datos.

---

## Ventajas

✅ **Desarrollo más rápido:** Sin paso de prefetch  
✅ **Datos en tiempo real:** Ve los cambios de WordPress inmediatamente  
✅ **Flexible:** Usa API en dev, cache en producción  
✅ **Retrocompatible:** Todo funciona igual en build

---

## Troubleshooting

### "Error: Cannot find module '@/utilidades/cache'"

- Reinicia el servidor con Ctrl+C y `yarn dev` de nuevo

### "La API no responde"

- Verifica que `historiasinternetpre.uniandes.edu.co` esté disponible
- Revisa tu conexión de internet

### "Quiero ver cambios más rápido"

- En desarrollo se obtienen datos en tiempo real, así que recarga la página (F5)

### "Quiero usar cache local para desarrollo"

```bash
yarn prebuild
yarn dev
```

El sistema detectará que ya existe el cache y lo usará en lugar de la API.

---

## Para investigadores/desarrolladores externos

Si **no quieres depender de la API** en desarrollo, puedes:

1. Ejecutar `yarn prebuild` una sola vez
2. Usar `yarn dev` normalmente
3. Los datos se cargarán del cache local

Si **quieres datos frescos** de WordPress:

1. Simplemente usa `yarn dev` sin prebuild
2. Los datos se obtienen de la API automáticamente

---

## Variables de entorno

Si necesitas cambiar el comportamiento, puedes usar:

```bash
NODE_ENV=production yarn dev  # Fuerza modo producción
NODE_ENV=development yarn build  # Fuerza desarrollo en build (no recomendado)
```

Pero por defecto, Astro maneja esto automáticamente.

---

## Notas técnicas

- El cache en memoria (`cacheMemoria`) almacena datos durante la sesión de desarrollo
- La paginación se maneja automáticamente (obtiene todas las páginas)
- Las funciones ahora retornan `Promise<T>` en desarrollo

---

**¡Listo! Ahora puedes desarrollar sin fricción.** 🎉
