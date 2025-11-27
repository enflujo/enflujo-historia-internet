import {
  type CategoriaPrincipal,
  type CategoriasWPNodos,
  type MetaInfo,
  type PaginaMenu,
  type Termino,
  type TerminoGlosario,
} from '@/tipos';
import { extraerTerminos, gql, pedirDatos } from '@/utilidades/ayudas';
import { atom, map } from 'nanostores';

export const menuAbierto = atom(false);
export const datosPaginas = map<PaginaMenu[]>([]);
export const arbolCategorias = atom<{ categories: CategoriasWPNodos } | null>(null);
export const terminos = atom<Termino[]>([]);
export const glosario = atom<TerminoGlosario[]>([]);
export const categoriasPrincipales = atom<CategoriaPrincipal[]>([]);

export async function listaCategorias() {
  const categoriasCache = arbolCategorias.get();
  if (categoriasCache) return categoriasCache.categories.nodes;

  // Construir árbol desde cache
  const { obtenerCategorias } = await import('@/utilidades/cache');
  const categorias = obtenerCategorias();

  // Agrupar por padre
  const padres = categorias.filter((cat: any) => !cat.parent || !cat.parent.node);
  const resultado = padres.map((padre: any) => {
    const hijos = categorias.filter((cat: any) => cat.parent?.node?.slug === padre.slug);
    return {
      name: padre.name,
      slug: padre.slug,
      count: padre.count,
      children: {
        nodes: hijos.map((hijo: any) => ({
          name: hijo.name,
          slug: hijo.slug,
          count: hijo.count,
        })),
      },
    };
  });

  arbolCategorias.set({ categories: { nodes: resultado } });
  return resultado;
}

export async function listaTerminos() {
  const terminosActuales = terminos.get();

  if (terminosActuales.length > 0) return terminosActuales;

  const transcripciones = await extrearTranscripciones();
  const terminosProcesados: Termino[] = [];

  if (!transcripciones) return;

  transcripciones.forEach((transcripcion) => {
    extraerTerminos(transcripcion, terminosProcesados);
  });

  terminos.set(terminosProcesados.filter((termino) => termino.conteo > 2));

  return terminosProcesados;
}

async function extrearTranscripciones(cursorTranscripciones: string = '', transcripciones: string[] = []) {
  const PeticionTranscripciones = gql`
    query {
      transcripciones(first: 1000${cursorTranscripciones ? `, after: "${cursorTranscripciones}"` : ''}) {
        pageInfo {
          hasNextPage
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        
        nodes {
          transcripcion(format: RAW)
        }
      }
    }
  `;

  const { transcripciones: algunasTranscripciones } = await pedirDatos<{
    transcripciones: { pageInfo: MetaInfo; nodes: { transcripcion: string }[] };
  }>(PeticionTranscripciones);

  transcripciones.push(...algunasTranscripciones.nodes.map((transcripcion) => transcripcion.transcripcion));

  if (algunasTranscripciones.pageInfo.hasNextPage) {
    return await extrearTranscripciones(algunasTranscripciones.pageInfo.endCursor, transcripciones);
  } else {
    return transcripciones;
  }
}

export async function listaGlosario(cursorGlosario: string = '', glosarioProcesado: TerminoGlosario[] = []) {
  const glosarioActual = glosario.get();

  if (glosarioActual.length > 0) return glosarioActual;

  const PeticionGlosario = gql`
    query {
      terminos(first: 1000${cursorGlosario ? `, after: "${cursorGlosario}"` : ''}) {
        pageInfo {
          hasNextPage
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }

        nodes {
          title
          slug
        }
      }
    }
  `;

  const { terminos: algunasDefiniciones } = await pedirDatos<{
    terminos: { nodes: TerminoGlosario[]; pageInfo: MetaInfo };
  }>(PeticionGlosario);

  glosarioProcesado.push(...algunasDefiniciones.nodes);

  if (algunasDefiniciones.pageInfo.hasNextPage) {
    return await listaGlosario(algunasDefiniciones.pageInfo.endCursor, glosarioProcesado);
  } else {
    glosario.set(glosarioProcesado);
    return glosarioProcesado;
  }
}

export async function listaPaginas() {
  if (datosPaginas.get().length > 0) return datosPaginas.get();

  const EsquemaPaginas = gql`
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
        }
      }
    }
  `;

  const { pages } = await pedirDatos<{ pages: { nodes: PaginaMenu[] } }>(EsquemaPaginas);

  /** Preprocesar el resultado */

  // Ordenar las páginas según el orden que se define en WP
  const paginas = pages.nodes.sort((a, b) => {
    if (a.menuOrder < b.menuOrder) return -1;
    if (a.menuOrder > b.menuOrder) return 1;
    return 0;
  });

  // Llenar con valores predeterminados los íconos en caso de que no se llene en WP
  paginas.forEach((pagina) => {
    pagina.iconoA = pagina.iconoA.length ? pagina.iconoA : '1';
    pagina.iconoB = pagina.iconoB.length ? pagina.iconoB : '2';
  });

  datosPaginas.set(paginas);
  return paginas;
}

export async function listaCategoriasPrincipales() {
  if (categoriasPrincipales.get().length > 0) return categoriasPrincipales.get();

  const { obtenerCategoriasPrincipales } = await import('@/utilidades/cache');
  const categorias = obtenerCategoriasPrincipales();
  categoriasPrincipales.set(categorias);

  return categorias;
}
