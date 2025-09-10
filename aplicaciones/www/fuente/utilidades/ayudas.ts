import type { AudiosWP, CategoriaProcesada, CategoriasWP, Termino, TerminoGlosario } from '@/tipos';
import { apiBase, base } from './constantes';
import slugificar from 'slug';
import { listaGlosario } from '@/cerebros/general';
export const gql = String.raw;

export async function pedirDatos<Esquema>(query: string) {
  const peticion = await fetch(`${apiBase}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then((res) => res.json());

  if (peticion.errors) {
    throw new Error(JSON.stringify(peticion.errors, null, 2));
  }

  return peticion.data as Esquema;
}

/**
 * Ayuda a crear el título con estilos propios.
 *
 * @param tituloPagina El nombre o título de la página actual, se puede dejar vacío para la Maloca.
 * @returns Título para el encabezado con estilos personalizados.
 */
export const crearTitulo = (tituloPagina: string) => {
  const nombreProyecto = `..:: Historia del Internet ::..`;
  return tituloPagina ? `${tituloPagina} | ${nombreProyecto}` : nombreProyecto;
};

export const esquemaPagina = (slug: string) => gql`
  page(id: "${slug}", idType: URI) {
    title
    status
    slug
    iconoA
    descripcion(format: RAW)
    content(format: RENDERED)
  }`;

export function extraerTerminos(texto: string, terminos: Termino[], glosario?: TerminoGlosario[]): string {
  // Expresión que captura términos entre asteriscos, ignorando espacios extra
  const regex = /\*\s*([^\*]+?)\s*\*/g;
  let terminoEntreAstreiscos;

  // Mapa para acceso rápido a los términos por su slug
  const terminosMap = new Map<string, Termino>();

  // Poblar el mapa inicial
  terminos.forEach((termino) => {
    terminosMap.set(termino.slug, termino);
  });

  // Almacenaremos los reemplazos para hacerlos al final
  const reemplazos: { original: string; anotado: string }[] = [];

  while ((terminoEntreAstreiscos = regex.exec(texto)) !== null) {
    const terminoOriginal = terminoEntreAstreiscos[1].trim();
    const slug = slugificar(terminoOriginal);

    if (!terminosMap.has(slug)) {
      const nuevoTermino = { termino: terminoOriginal, slug, conteo: 1 };
      terminos.push(nuevoTermino);
      terminosMap.set(slug, nuevoTermino);
    } else {
      terminosMap.get(slug)!.conteo++;
    }

    const existeEnGlosario = glosario?.some((termino) => termino.slug === slug);
    const htmlBasico = `<span class="terminoAnotado">${terminoOriginal}</span>`;
    const textoAnotado = existeEnGlosario
      ? `<a class="terminoGlosario" href="${base}/glosario#${slug}">${terminoOriginal}</a>`
      : htmlBasico;

    // Preparamos el reemplazo
    reemplazos.push({
      original: terminoEntreAstreiscos[0], // El texto original capturado
      anotado: textoAnotado,
    });
  }

  // Reemplazo masivo, más eficiente
  reemplazos.forEach(({ original, anotado }) => {
    texto = texto.replace(original, anotado);
  });

  return texto;
}

export async function convertirTextoAHTML(
  textoSinProcesar: string,
  terminos: Termino[] = []
): Promise<{ texto: string; terminos: Termino[] }> {
  // Expresiones unificadas para títulos y divisiones
  let texto = textoSinProcesar
    .replace(/^### (.*)$/gm, '<h3 class="titulo3">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="titulo2">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="titulo1">$1</h1>')
    .replace(/\$/g, '<span class="division"></span>');

  // Procesamiento de términos anotados
  let glosario: TerminoGlosario[] | undefined;
  try {
    glosario = await listaGlosario();
  } catch (error) {
    console.error('Error al obtener el glosario:', error);
  }

  texto = extraerTerminos(texto, terminos, glosario);

  // Transformación de párrafos
  texto = texto
    .split(/\r?\n\r?\n/)
    .map((parrafo) => {
      // Reemplazar saltos de línea por `<br>` y detectar timestamps
      const conSaltos = parrafo.replace(/\r?\n/g, '<br>');

      // Expresión para capturar "[min:seg:ms]" al inicio
      const match = conSaltos.match(/^([^\[]*\[\d{1,}:\d{1,}:\d{1,}\])/);

      if (match) {
        // Si hay timestamp, se formatea el contenido
        const [personaTiempo, ...resto] = conSaltos.split(']');
        return `<p><span class="personaTiempo">${personaTiempo}]</span> ${resto.join(']').trim()}</p>`;
      } else {
        // Si no, se devuelve el párrafo directo
        return `<p>${conSaltos.trim()}</p>`;
      }
    })
    .join('\n');

  return { texto, terminos };
}

export function procesarAudiosTranscripcion(audios: AudiosWP, orden: number[]) {
  // Si no hay audios o no tienen nodos, devolver un array vacío
  if (!audios || !audios.nodes || audios.nodes.length === 0) {
    return [];
  }

  const respuesta = audios.nodes.filter((audio) => audio.archivos);

  if (respuesta.length === 0) {
    return [];
  }

  respuesta.sort((a, b) => {
    return orden.indexOf(a.databaseId) - orden.indexOf(b.databaseId);
  });

  return respuesta.map((audio) => {
    return { url: audio.archivos.node.link, titulo: audio.archivos.node.title, tipo: audio.archivos.node.mimeType };
  });
}

export function procesarCategorias(categoriasWP: CategoriasWP) {
  const categorias: CategoriaProcesada[] = [];

  categoriasWP.edges.forEach(({ node }) => {
    const tienePariente = node.parent && node.parent.node;

    // Las categorías principales no tienen padre
    if (!tienePariente) {
      const existe = categorias.find((categoria) => categoria.slug === node.slug);
      if (!existe) {
        categorias.push({
          slug: node.slug,
          nombre: node.name,
          conteo: node.count || 0,
          hijos: [],
          indice: 0
        });
      }
    } else {
      // Si tiene padre, lo agregamos a la lista de hijos
      let padre = categorias.find((categoria) => categoria.slug === node.parent.node.slug);
      if (!padre) {
        padre = {
          slug: node.parent.node.slug,
          nombre: node.parent.node.name,
          conteo: node.parent.node.count || 0,
          hijos: [],
          indice: 0
        };
        categorias.push(padre);
      }

      padre.hijos.push({
        slug: node.slug,
        nombre: node.name,
        conteo: node.count || 0,
      });
    }
  });

  categorias.sort((a, b) => a.nombre.localeCompare(b.nombre));

  return categorias;
}
