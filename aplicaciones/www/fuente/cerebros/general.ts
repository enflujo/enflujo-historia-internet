import type { CategoriasWP, MetaInfo, PaginaMenu, Termino } from '@/tipos';
import { extraerTerminos, gql, pedirDatos } from '@/utilidades/ayudas';
import { atom, map } from 'nanostores';

export const menuAbierto = atom(false);
export const datosPaginas = map<PaginaMenu[]>([]);
export const arbolCategorias = atom<{ categories: CategoriasWP } | null>(null);
export const terminos = atom<Termino[]>([]);

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

  const respuesta = await pedirDatos<{ categories: CategoriasWP }>(PeticionCategorias);
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
