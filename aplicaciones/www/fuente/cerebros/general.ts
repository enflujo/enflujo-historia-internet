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
  const categorias = arbolCategorias.get();
  if (categorias) return categorias.categories.nodes;

  const PeticionCategorias = gql`
    query {
      categories(where: { hideEmpty: true, parent: 0 }, first: 200) {
        nodes {
          name
          slug
          count
          children(where: { hideEmpty: true }, first: 200) {
            nodes {
              name
              slug
              count
            }
          }
        }
      }
    }
  `;

  const respuesta = await pedirDatos<{ categories: CategoriasWPNodos }>(PeticionCategorias);
  arbolCategorias.set(respuesta);

  return respuesta.categories.nodes;
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

  const Peticion = gql`
    query {
      categories(where: { orderby: SLUG, order: ASC, parent: null, hideEmpty: true }) {
        nodes {
          slug
          name
        }
      }
    }
  `;

  const { categories } = await pedirDatos<{ categories: CategoriasWPNodos }>(Peticion);
  const categorias = categories.nodes.map((cat) => ({ slug: cat.slug, name: cat.name }));
  categoriasPrincipales.set(categorias);

  return categorias;
}
