import { apiBase } from './constantes';

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

function extraerTerminos(texto: string): string[] {
  const regex = /\*([^\*]+?)\*/g;
  const frases: string[] = [];
  let match;

  while ((match = regex.exec(texto)) !== null) {
    // const slug = slugificar(match[1].trim());

    frases.push(match[1].trim());
  }

  return frases;
}

export function convertirTextoAHTML(input: string): string {
  const terminos = extraerTerminos(input);

  terminos.forEach((termino) => {
    const regex = new RegExp(`\\*${termino}\\*`, 'g');
    input = input.replace(regex, `<span class="terminoAnotado">${termino}</span>`);
  });

  return input
    .split(/\r?\n\r?\n/) // divide por párrafos dobles
    .map((parrafo) => {
      // convertir saltos de línea dentro del párrafo en <br>
      const conSaltos = parrafo.replace(/\r?\n/g, '<br>');

      // buscar patrón desde el inicio hasta el primer ] con timestamp
      const match = conSaltos.match(/^(.{0,100}?\[\d{2}:\d{2}:\d{2}\])/);

      if (match) {
        const personaTiempo = match[1];
        const resto = conSaltos.slice(personaTiempo.length).trim();
        return `<p><span class="personaTiempo">${personaTiempo}</span> ${resto}</p>`;
      } else {
        return `<p>${conSaltos.trim()}</p>`;
      }
    })
    .join('\n');
}
