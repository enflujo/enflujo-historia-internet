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

export function extraerTerminos(texto: string, terminos: Termino[]): string {
  const regex = /\*([^\*]+?)\*/g;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const terminoOriginal = match[1].trim();
    // const terminoNormalizado = singularizarFrase(terminoOriginal.toLowerCase());
    const slug = slugificar(terminoOriginal);
    const existe = terminos.find((frase) => frase.slug === slug);

    if (!existe) {
      terminos.push({ termino: terminoOriginal, slug, conteo: 1 });
    } else {
      existe.conteo++;
    }

    const regex = new RegExp(`\\*${terminoOriginal}\\*`, 'g');
    texto = texto.replace(regex, `<span class="terminoAnotado">${terminoOriginal}</span>`);
  }

  return texto;
}

export function singularizarFrase(frase: string): string {
  return frase
    .split(' ')
    .map((palabra) => singularizar(palabra))
    .join(' ');
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

export function pluralizar(palabra: string): string {
  let plural;

  const ultimaLetra = palabra[palabra.length - 1];
  const ultimasDosLetras = palabra.slice(-2);
  const ultimasTresLetras = palabra.slice(-3);
  if (ultimaLetra === 'x') {
    // No hay plural
    plural = palabra;
  }

  if (ultimaLetra === 's') {
    switch (palabra) {
      case 'pies':
        plural = 'pieses';
        break;
      case 'cafés':
        plural = 'cafeses';
        break;
      case 'acortamientos':
        plural = 'acortamiento';
        break;
      case 'abreviaturas':
        plural = 'abreviatura';
        break;
      case 'siglas':
        plural = 'sigla';
        break;
      case 'símbolos':
        plural = 'símbolo';
        break;
      default:
        //normally though it doesn't change
        plural = palabra;
    }
  } else if (ultimaLetra === 'z') {
    //quita la z y pone ces
    const seccion = palabra.substring(0, palabra.length - 1);
    plural = seccion + 'ces';
  } else if (ultimaLetra === 'c') {
    const seccion = palabra.substring(0, palabra.length - 1);
    plural = seccion + 'ques';
  } else if (ultimaLetra === 'g') {
    plural = palabra + 'ues';
  } else if (
    ultimaLetra === 'a' ||
    ultimaLetra === 'e' ||
    ultimaLetra === 'é' ||
    ultimaLetra === 'i' ||
    ultimaLetra === 'o' ||
    ultimaLetra === 'u'
  ) {
    plural = palabra + 's';
  } else if (ultimaLetra === 'á') {
    const seccion = palabra.substring(0, palabra.length - 1);
    plural = seccion + 'aes';
  } else if (ultimaLetra === 'ó') {
    const seccion = palabra.substring(0, palabra.length - 1);
    plural = seccion + 'oes';
  } else if (ultimasTresLetras === 'ión') {
    const seccion = palabra.substring(0, palabra.length - 3);
    plural = seccion + 'iones';
  } else if (ultimasDosLetras === 'ín') {
    const seccion = palabra.substring(0, palabra.length - 2);
    plural = seccion + 'ines';
  } else {
    plural = palabra + 'es';
  }

  return plural;
}

export function singularizar(palabra: string): string {
  const excepciones: Record<string, string> = {
    pieses: 'pies',
    pies: 'pie',
    cafeses: 'cafés',
    acortamientos: 'acortamiento',
    abreviaturas: 'abreviatura',
    siglas: 'sigla',
    símbolos: 'símbolo',
  };

  if (excepciones[palabra]) {
    return excepciones[palabra];
  }

  if (palabra.endsWith('ciones')) {
    return palabra.slice(0, -5) + 'ción';
  }

  if (palabra.endsWith('iones')) {
    return palabra.slice(0, -5) + 'ión';
  }

  if (palabra.endsWith('ines')) {
    return palabra.slice(0, -4) + 'ín';
  }

  if (palabra.endsWith('ces')) {
    return palabra.slice(0, -3) + 'z';
  }

  if (palabra.endsWith('ques')) {
    return palabra.slice(0, -4) + 'c';
  }

  if (palabra.endsWith('gues')) {
    return palabra.slice(0, -4) + 'g';
  }

  if (palabra.endsWith('aes')) {
    return palabra.slice(0, -3) + 'á';
  }

  if (palabra.endsWith('oes')) {
    return palabra.slice(0, -3) + 'ó';
  }

  if (palabra.endsWith('es')) {
    const posibleSingular = palabra.slice(0, -2);
    // Evita truncar palabras que ya terminaban en 'es'
    if (posibleSingular.length > 2) return posibleSingular;
  }

  if (palabra.endsWith('s')) {
    const posibleSingular = palabra.slice(0, -1);
    if (posibleSingular.length > 1) return posibleSingular;
  }

  return palabra;
}
