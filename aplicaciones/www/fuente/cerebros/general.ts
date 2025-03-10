import type { Categorias, PaginaMenu } from '@/tipos';
import { gql, pedirDatos } from '@/utilidades/ayudas';
import { atom, map } from 'nanostores';

export const menuAbierto = atom(false);
export const datosPaginas = map<PaginaMenu[]>([]);
export const arbolCategorias = atom<Categorias | null>(null);

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

  return respuesta.categories.nodes;
}
