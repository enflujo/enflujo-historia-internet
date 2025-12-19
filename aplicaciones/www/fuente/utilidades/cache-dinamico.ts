import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type {
  Documento,
  Personaje,
  CategoriaBasico,
  Pagina,
  Glosario,
  CategoriaPrincipal,
  TranscripcionesCruzadas,
} from '@/tipos';
import { pedirDatos, gql } from './ayudas';

const cacheDir = join(process.cwd(), '.cache');

// Detectar si estamos en desarrollo (SSR/dev mode) o build
const esDesarrollo = process.env.NODE_ENV === 'development';

function leerCache<T>(archivo: string): T {
  const ruta = join(cacheDir, archivo);
  if (!existsSync(ruta)) {
    throw new Error(
      `❌ Archivo de caché no encontrado: ${archivo}\nEjecuta 'yarn prebuild' primero para generar la caché.`
    );
  }
  return JSON.parse(readFileSync(ruta, 'utf-8'));
}

// Cache en memoria para desarrollo
let cacheMemoria: Map<string, any> = new Map();

/**
 * Obtiene documentos desde la API en desarrollo o desde caché en build
 */
export async function obtenerDocumentos(): Promise<Documento[]> {
  if (esDesarrollo) {
    if (cacheMemoria.has('documentos')) {
      return cacheMemoria.get('documentos');
    }

    // Obtener desde API con paginación
    const todos: Documento[] = [];
    let cursor = '';
    let tieneMas = true;

    while (tieneMas) {
      const query = gql`
        query {
          documentos(first: 100${cursor ? `, after: "${cursor}"` : ''}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              slug
              title
              tituloCorto: title
              descripcion
              fecha
              autores
              fuente
              identificador
              archivos {
                nodes {
                  filePath
                }
              }
              tiposDeDocumentos {
                nodes {
                  slug
                  name
                }
              }
              featuredImage {
                node {
                  filePath
                }
              }
              categories {
                edges {
                  node {
                    name
                    slug
                    count
                    parent {
                      node {
                        slug
                        name
                        count
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const datos = await pedirDatos<any>(query);
      todos.push(...datos.documentos.nodes);

      tieneMas = datos.documentos.pageInfo.hasNextPage;
      cursor = datos.documentos.pageInfo.endCursor;
    }

    cacheMemoria.set('documentos', todos);
    return todos;
  }

  return leerCache<Documento[]>('documentos.json');
}

export async function obtenerDocumento(slug: string): Promise<Documento | undefined> {
  const documentos = await obtenerDocumentos();
  return documentos.find((doc) => doc.slug === slug);
}

/**
 * Obtiene personajes desde la API en desarrollo o desde caché en build
 */
export async function obtenerPersonajes(): Promise<Personaje[]> {
  // Si existe cache en disco, usarlo (tiene los datos procesados del prebuild)
  const rutaCache = join(cacheDir, 'personajes.json');
  if (existsSync(rutaCache)) {
    return leerCache<Personaje[]>('personajes.json');
  }

  if (esDesarrollo) {
    if (cacheMemoria.has('personajes')) {
      return cacheMemoria.get('personajes');
    }

    const todos: Personaje[] = [];
    let cursor = '';
    let tieneMas = true;

    while (tieneMas) {
      const query = gql`
        query {
          personajes(first: 100${cursor ? `, after: "${cursor}"` : ''}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              title
              slug
              content
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
            }
          }
        }
      `;

      const datos = await pedirDatos<any>(query);
      todos.push(...datos.personajes.nodes);

      tieneMas = datos.personajes.pageInfo.hasNextPage;
      cursor = datos.personajes.pageInfo.endCursor;
    }

    cacheMemoria.set('personajes', todos);
    return todos;
  }

  return leerCache<Personaje[]>('personajes.json');
}

export async function obtenerPersonaje(
  slug: string
): Promise<(Personaje & { entrevistas?: { nodes: any[] } }) | undefined> {
  const personajes = await obtenerPersonajes();
  return personajes.find((p) => p.slug === slug) as any;
}

/**
 * Obtiene categorías desde la API en desarrollo o desde caché en build
 */
export async function obtenerCategorias(): Promise<CategoriaBasico[]> {
  if (esDesarrollo) {
    if (cacheMemoria.has('categorias')) {
      return cacheMemoria.get('categorias');
    }

    const todos: CategoriaBasico[] = [];
    let cursor = '';
    let tieneMas = true;

    while (tieneMas) {
      const query = gql`
        query {
          categories(first: 100${cursor ? `, after: "${cursor}"` : ''}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              name
              slug
              count
              parent {
                node {
                  slug
                  name
                }
              }
            }
          }
        }
      `;

      const datos = await pedirDatos<any>(query);
      todos.push(...datos.categories.nodes);

      tieneMas = datos.categories.pageInfo.hasNextPage;
      cursor = datos.categories.pageInfo.endCursor;
    }

    cacheMemoria.set('categorias', todos);
    return todos;
  }

  return leerCache<CategoriaBasico[]>('categorias.json');
}

export async function obtenerCategoria(slug: string): Promise<CategoriaBasico | undefined> {
  const categorias = await obtenerCategorias();
  return categorias.find((c) => c.slug === slug);
}

/**
 * Obtiene páginas desde la API en desarrollo o desde caché en build
 */
export async function obtenerPaginas(): Promise<
  (Pagina & { principal?: boolean; menuOrder?: number; iconoB?: string })[]
> {
  if (esDesarrollo) {
    if (cacheMemoria.has('paginas')) {
      return cacheMemoria.get('paginas');
    }

    const query = gql`
      query {
        pages {
          nodes {
            title
            slug
            menuOrder
            status
            iconoA
            iconoB
            principal
            content
            descripcion
          }
        }
      }
    `;

    const datos = await pedirDatos<any>(query);
    cacheMemoria.set('paginas', datos.pages.nodes);
    return datos.pages.nodes;
  }

  return leerCache<(Pagina & { principal?: boolean; menuOrder?: number; iconoB?: string })[]>('paginas.json');
}

export async function obtenerPagina(slug: string): Promise<Pagina | undefined> {
  const paginas = await obtenerPaginas();
  return paginas.find((p) => p.slug === slug);
}

/**
 * Obtiene glosario desde la API en desarrollo o desde caché en build
 */
export async function obtenerGlosario(): Promise<Glosario[]> {
  if (esDesarrollo) {
    if (cacheMemoria.has('glosario')) {
      return cacheMemoria.get('glosario');
    }

    const todos: Glosario[] = [];
    let cursor = '';
    let tieneMas = true;

    while (tieneMas) {
      const query = gql`
        query {
          terminos(first: 100${cursor ? `, after: "${cursor}"` : ''}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              title
              slug
              content
            }
          }
        }
      `;

      const datos = await pedirDatos<any>(query);
      todos.push(...datos.terminos.nodes);

      tieneMas = datos.terminos.pageInfo.hasNextPage;
      cursor = datos.terminos.pageInfo.endCursor;
    }

    cacheMemoria.set('glosario', todos);
    return todos;
  }

  return leerCache<Glosario[]>('glosario.json');
}

export async function obtenerTerminoGlosario(slug: string): Promise<Glosario | undefined> {
  const glosario = await obtenerGlosario();
  return glosario.find((t) => t.slug === slug);
}

/**
 * Obtiene categorías principales desde la API en desarrollo o desde caché en build
 */
export async function obtenerCategoriasPrincipales(): Promise<CategoriaPrincipal[]> {
  if (esDesarrollo) {
    if (cacheMemoria.has('categorias-principales')) {
      return cacheMemoria.get('categorias-principales');
    }

    const query = gql`
      query {
        categories(first: 100, where: { parent: 0 }) {
          nodes {
            name
            slug
          }
        }
      }
    `;

    const datos = await pedirDatos<any>(query);
    cacheMemoria.set('categorias-principales', datos.categories.nodes);
    return datos.categories.nodes;
  }

  return leerCache<CategoriaPrincipal[]>('categorias-principales.json');
}

export async function obtenerTranscripcionesCategoria(slug: string): Promise<TranscripcionesCruzadas[]> {
  // Si existe cache en disco, usarlo (tiene los datos procesados del prebuild)
  const rutaCache = join(cacheDir, 'transcripciones-categorias.json');
  if (existsSync(rutaCache)) {
    const todas = leerCache<Record<string, TranscripcionesCruzadas[]>>('transcripciones-categorias.json');
    return todas[slug] || [];
  }

  if (esDesarrollo) {
    // En desarrollo, obtener dinámicamente
    const query = gql`
      query {
        transcripciones(first: 1000, where: { categoryName: "${slug}" }) {
          nodes {
            title
            databaseId
            transcripcion
            categories {
              edges {
                node {
                  slug
                  name
                }
              }
            }
          }
        }
      }
    `;

    const datos = await pedirDatos<any>(query);
    return datos.transcripciones.nodes;
  }

  const todas = leerCache<Record<string, TranscripcionesCruzadas[]>>('transcripciones-categorias.json');
  return todas[slug] || [];
}

export async function obtenerTodasTranscripcionesCategorias(): Promise<Record<string, TranscripcionesCruzadas[]>> {
  if (esDesarrollo) {
    // En desarrollo, construir dinámicamente
    const query = gql`
      query {
        categories(first: 100) {
          nodes {
            slug
          }
        }
      }
    `;

    const datos = await pedirDatos<any>(query);
    const resultado: Record<string, TranscripcionesCruzadas[]> = {};

    for (const cat of datos.categories.nodes) {
      resultado[cat.slug] = await obtenerTranscripcionesCategoria(cat.slug);
    }

    return resultado;
  }

  return leerCache<Record<string, TranscripcionesCruzadas[]>>('transcripciones-categorias.json');
}

/**
 * Limpia el cache en memoria (útil para testing o recargas)
 */
export function limpiarCacheMemoria() {
  cacheMemoria.clear();
}
