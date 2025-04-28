import type { Termino } from '@/tipos';
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

function extraerTerminos(texto: string, terminos: Termino[]): string {
  const regex = /\*([^\*]+?)\*/g;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const termino = match[1].trim();
    const slug = slugificar(termino);
    const existe = terminos.find((frase) => frase.slug === slug);

    if (!existe) {
      terminos.push({ termino, slug, conteo: 1 });
    } else {
      existe.conteo++;
    }

    const regex = new RegExp(`\\*${termino}\\*`, 'g');
    texto = texto.replace(regex, `<span class="terminoAnotado">${termino}</span>`);
  }

  return texto;
}

export function convertirTextoAHTML(
  textoSinProcesar: string,
  terminos: Termino[] = []
): { texto: string; terminos: Termino[] } {
  const texto = extraerTerminos(textoSinProcesar, terminos)
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
