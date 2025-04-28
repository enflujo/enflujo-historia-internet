import type { CategoriasWP, PaginaMenu } from '@/tipos';
import { gql, pedirDatos } from '@/utilidades/ayudas';
import { atom, map } from 'nanostores';

export const menuAbierto = atom(false);
export const datosPaginas = map<PaginaMenu[]>([]);
export const arbolCategorias = atom<{ categories: CategoriasWP } | null>(null);
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

  const respuesta = await pedirDatos<{ categories: CategoriasWP }>(EsquemaCategorias);
  arbolCategorias.set(respuesta);
  // const aplanadas: any = respuesta.categories.nodes.flatMap((categoria) => {
  //   return categoria.children.nodes.map((subcategoria) => {
  //     return { ...subcategoria, parent: categoria.slug };
  //   });
  // });
  // console.log(aplanadas);

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
  interface ITranscripciones {
    transcripciones: {
      nodes: {
        title: string;
        transcripcion: string;
        slug: string;
      }[];
    };
  }
  const EsquemaTranscripciones = gql`
    query {
      transcripciones {
        nodes {
          title
          transcripcion(format: RENDERED)
          slug
        }
      }
    }
  `;
  const { transcripciones } = await pedirDatos<ITranscripciones>(EsquemaTranscripciones);

  if (transcripciones.nodes.length) {
    transcripciones.nodes.forEach((transcripcion) => {
      const { transcripcion: contenido } = transcripcion;
      //const terminos = contenido.match(/\*(.*?)\*/g);
      let parrafos = contenido.split('\r\n');
      parrafos = parrafos.map((parrafo) => `<p>${parrafo}</p>`);
      transcripcion.transcripcion = parrafos.join('');
    });
  }
  //console.log(transcripciones.nodes);
}
