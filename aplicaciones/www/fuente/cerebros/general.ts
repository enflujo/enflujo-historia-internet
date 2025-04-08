import type { Categorias, PaginaMenu } from '@/tipos';
import { gql, pedirDatos } from '@/utilidades/ayudas';
import { atom, map } from 'nanostores';

export const menuAbierto = atom(false);
export const datosPaginas = map<PaginaMenu[]>([]);
export const arbolCategorias = atom<Categorias | null>(null);
export const categoriasTodas = atom<{ [categoria: string]: string }[]>([]);

export async function listaCategorias() {
  const categorias = arbolCategorias.get();
  if (categorias) return categorias.categories.nodes;

  const EsquemaCategorias = gql`
    query {
      categories(where: { hideEmpty: true, parent: 0 }, first: 200) {
        nodes {
          name
          slug
          children(where: { hideEmpty: true }, first: 200) {
            nodes {
              name
              slug
            }
          }
        }
      }
    }
  `;

  const respuesta = await pedirDatos<Categorias>(EsquemaCategorias);
  arbolCategorias.set(respuesta);
  const aplanadas: any = respuesta.categories.nodes.flatMap((categoria) => {
    return categoria.children.nodes.map((subcategoria) => {
      return { ...subcategoria, parent: categoria.slug };
    });
  });
  console.log(aplanadas);

  // Guardar las subcategorías en el store
  // categoriasTodas.set(respuesta.categories.nodes.flatMap((categoria) => {
  //   return categoria.children.nodes.map((subcategoria) => {
  //     return {
  //       ...subcategoria,
  //     };
  //   });
  // };

  return respuesta.categories.nodes;
}

export async function relaciones() {
  const EsquemaTranscripciones = gql`
    query {
      transcripciones {
        nodes {
        }
      }
    }`;
  const respuesta = await pedirDatos(EsquemaTranscripciones);
}
