import type { Audio, Termino } from '@/tipos';
import { apiBase } from './constantes';
import slugificar from 'slug';
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

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extraerTerminos(texto: string, terminos: Termino[]): string {
  const regex = /\*([^\*]+?)\*/g;
  let terminoEntreAstreiscos;

  while ((terminoEntreAstreiscos = regex.exec(texto)) !== null) {
    const terminoOriginal = terminoEntreAstreiscos[1].trim();
    const slug = slugificar(terminoOriginal);
    const existe = terminos.find((frase) => frase.slug === slug);

    if (!existe) {
      terminos.push({ termino: terminoOriginal, slug, conteo: 1 });
    } else {
      existe.conteo++;
    }
    const terminoEscapado = escaparRegex(terminoOriginal);

    const regex = new RegExp(`\\*${terminoEscapado}\\*`, 'g');
    texto = texto.replace(regex, `<span class="terminoAnotado">${terminoOriginal}</span>`);
  }

  return texto;
}

export function convertirTextoAHTML(
  textoSinProcesar: string,
  terminos: Termino[] = []
): { texto: string; terminos: Termino[] } {
  let texto = textoSinProcesar
    .replace(/^### (.*)$/gm, '<h3 class="titulo3">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="titulo2">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="titulo1>$1</h1>');

  // Reemplazar $ por doble salto de línea
  texto = texto.replace(/\$/g, '<span class="division"></span>');

  texto = extraerTerminos(texto, terminos)
    .split(/\r?\n\r?\n/) // divide por párrafos dobles
    .map((parrafo) => {
      // convertir saltos de línea dentro del párrafo en <br>
      const conSaltos = parrafo.replace(/\r?\n/g, '<br>');

      // buscar patrón desde el inicio hasta el primer ] con timestamp
      const match = conSaltos.match(/^([^\[]*\[\d{1,}:\d{1,}:\d{1,}\])/);

      if (match) {
        const personaTiempo = match[1];
        const resto = conSaltos.slice(personaTiempo.length).trim();
        return `<p><span class="personaTiempo">${personaTiempo}</span> ${resto}</p>`;
      } else {
        return `<p>${conSaltos.trim()}</p>`;
      }
    })
    .join('\n');

  return { texto, terminos };
}

export function extraerNumeroDesdeTitulo(texto: string): number {
  const busqueda = texto.match(/\d+/); // Busca la primera secuencia de dígitos
  return busqueda ? parseInt(busqueda[0], 10) : Infinity; // Si no encuentra número, lo manda al final
}

export function procesarAudiosTranscripcion(audios: { nodes: { archivos: Audio }[] }) {
  // Si no hay audios o no tienen nodos, devolver un array vacío
  if (!audios || !audios.nodes || audios.nodes.length === 0) {
    return [];
  }

  return audios.nodes
    .filter((audio) => audio.archivos)
    .map((audio) => {
      return {
        url: `${apiBase}${audio.archivos.node.filePath}`,
        titulo: audio.archivos.node.title,
      };
    });
}
