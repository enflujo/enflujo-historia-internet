import type { AudiosWP, Termino } from '@/tipos';
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

export function extraerTerminos(texto: string, terminos: Termino[]): string {
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

    // Preparamos el reemplazo
    reemplazos.push({
      original: terminoEntreAstreiscos[0], // El texto original capturado
      anotado: `<span class="terminoAnotado">${terminoOriginal}</span>`,
    });
  }

  // Reemplazo masivo, más eficiente
  reemplazos.forEach(({ original, anotado }) => {
    texto = texto.replace(original, anotado);
  });

  return texto;
}

export function convertirTextoAHTML(
  textoSinProcesar: string,
  terminos: Termino[] = []
): { texto: string; terminos: Termino[] } {
  // Expresiones unificadas para títulos y divisiones
  let texto = textoSinProcesar
    .replace(/^### (.*)$/gm, '<h3 class="titulo3">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="titulo2">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="titulo1">$1</h1>')
    .replace(/\$/g, '<span class="division"></span>');

  // Procesamiento de términos anotados
  texto = extraerTerminos(texto, terminos);

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

export function extraerNumeroDesdeTitulo(texto: string): number {
  const busqueda = texto.match(/\d+/); // Busca la primera secuencia de dígitos
  return busqueda ? parseInt(busqueda[0], 10) : Infinity; // Si no encuentra número, lo manda al final
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
