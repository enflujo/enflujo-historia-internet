import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cacheDir = join(__dirname, '..', '.cache');

// Leer apiBase desde constantes.ts
const constantesPath = join(__dirname, '..', 'fuente', 'utilidades', 'constantes.ts');
const constantesContent = readFileSync(constantesPath, 'utf-8');
const apiBaseMatch = constantesContent.match(/export const apiBase = ['"]([^'"]+)['"]/);
const apiBase = apiBaseMatch ? apiBaseMatch[1] : 'https://historiasinternetpre.uniandes.edu.co';

console.log(`🌐 API Base: ${apiBase}\n`);

// Variable global para glosario (usada en procesamiento)
let glosarioCompleto = [];

// ========== FUNCIONES DE PROCESAMIENTO ==========
function slugificar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extraerTerminos(texto, terminos, glosario) {
  const regex = /\*\s*([^\*]+?)\s*\*/g;
  const terminosMap = new Map();
  terminos.forEach((t) => terminosMap.set(t.slug, t));

  const reemplazos = [];
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const terminoOriginal = match[1].trim();
    const slug = slugificar(terminoOriginal);

    if (!terminosMap.has(slug)) {
      const nuevoTermino = { termino: terminoOriginal, slug, conteo: 1 };
      terminos.push(nuevoTermino);
      terminosMap.set(slug, nuevoTermino);
    } else {
      terminosMap.get(slug).conteo++;
    }

    const existeEnGlosario = glosario.some((t) => t.slug === slug);
    const textoAnotado = existeEnGlosario
      ? `<a class="terminoGlosario" href="/glosario#${slug}">${terminoOriginal}</a>`
      : `<span class="terminoAnotado">${terminoOriginal}</span>`;

    reemplazos.push({ original: match[0], anotado: textoAnotado });
  }

  reemplazos.forEach(({ original, anotado }) => {
    texto = texto.replace(original, anotado);
  });

  return texto;
}

function convertirTextoAHTML(textoSinProcesar, terminos, glosario) {
  let texto = textoSinProcesar
    .replace(/^### (.*)$/gm, '<h3 class="titulo3">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="titulo2">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="titulo1">$1</h1>')
    .replace(/\$/g, '<span class="division"></span>');

  texto = extraerTerminos(texto, terminos, glosario);

  texto = texto
    .split(/\r?\n\r?\n/)
    .map((parrafo) => {
      const conSaltos = parrafo.replace(/\r?\n/g, '<br>');
      const match = conSaltos.match(/^([^\[]*\[\d{1,}:\d{1,}:\d{1,}\])/);

      if (match) {
        const [personaTiempo, ...resto] = conSaltos.split(']');
        return `<p><span class="personaTiempo">${personaTiempo}]</span> ${resto.join(']').trim()}</p>`;
      } else {
        return `<p>${conSaltos.trim()}</p>`;
      }
    })
    .join('\n');

  return texto;
}

function procesarAudiosTranscripcion(audios, orden) {
  if (!audios || !audios.nodes || audios.nodes.length === 0) return [];

  const respuesta = audios.nodes.filter((audio) => audio.archivos);
  if (respuesta.length === 0) return [];

  respuesta.sort((a, b) => orden.indexOf(a.databaseId) - orden.indexOf(b.databaseId));

  return respuesta.map((audio) => ({
    url: audio.archivos.node.link,
    titulo: audio.archivos.node.title,
    tipo: audio.archivos.node.mimeType,
  }));
}

function procesarCategorias(categoriasWP) {
  const categorias = [];

  categoriasWP.edges.forEach(({ node }) => {
    const tienePariente = node.parent && node.parent.node;

    if (!tienePariente) {
      const existe = categorias.find((c) => c.slug === node.slug);
      if (!existe) {
        categorias.push({
          slug: node.slug,
          nombre: node.name,
          conteo: node.count || 0,
          hijos: [],
          indice: 0,
        });
      }
    } else {
      let padre = categorias.find((c) => c.slug === node.parent.node.slug);
      if (!padre) {
        padre = {
          slug: node.parent.node.slug,
          nombre: node.parent.node.name,
          conteo: node.parent.node.count || 0,
          hijos: [],
          indice: 0,
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

// Crear directorio de caché si no existe
if (!existsSync(cacheDir)) {
  mkdirSync(cacheDir, { recursive: true });
}

const gql = String.raw;

async function pedirDatos(query, reintentos = 3, espera = 2000) {
  const url = `${apiBase}/graphql`;

  for (let intento = 1; intento <= reintentos; intento++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const text = await res.text();
      const contentType = res.headers.get('content-type') || '';

      if (!res.ok) {
        if (intento < reintentos && (res.status === 530 || res.status === 503 || res.status >= 500)) {
          console.warn(`⚠️  Error ${res.status}, reintentando en ${espera / 1000}s... (${intento}/${reintentos})`);
          await new Promise((resolve) => setTimeout(resolve, espera));
          espera *= 2; // Backoff exponencial
          continue;
        }
        throw new Error(`Error HTTP ${res.status} pidiendo ${url}:\n` + text.slice(0, 400));
      }

      if (!contentType.includes('application/json')) {
        throw new Error(`Respuesta NO JSON desde ${url}:\n` + text.slice(0, 400));
      }

      const peticion = JSON.parse(text);

      if (peticion.errors) {
        throw new Error(JSON.stringify(peticion.errors, null, 2));
      }

      return peticion.data;
    } catch (error) {
      if (intento === reintentos) throw error;
      console.warn(`⚠️  Error en petición, reintentando... (${intento}/${reintentos})`);
      await new Promise((resolve) => setTimeout(resolve, espera));
      espera *= 2;
    }
  }
}

async function fetchConPaginacion(tipoContenido, queryBuilder, procesarNodos = (nodos) => nodos) {
  console.log(`📥 Obteniendo ${tipoContenido}...`);
  const todos = [];
  let tieneMas = true;
  let cursor = null;
  let pagina = 1;

  while (tieneMas) {
    const query = queryBuilder(cursor);
    const respuesta = await pedirDatos(query);
    const datos = respuesta[tipoContenido];

    if (!datos || !datos.nodes) break;

    const nodosProcesados = procesarNodos(datos.nodes);
    todos.push(...nodosProcesados);

    console.log(`  ✓ Página ${pagina}: ${nodosProcesados.length} items (Total: ${todos.length})`);

    tieneMas = datos.pageInfo?.hasNextPage || false;
    cursor = datos.pageInfo?.endCursor || null;
    pagina++;

    if (!tieneMas) break;
  }

  console.log(`✅ ${tipoContenido}: ${todos.length} items totales\n`);
  return todos;
}

// ========== DOCUMENTOS ==========
async function fetchDocumentos() {
  return fetchConPaginacion(
    'documentos',
    (cursor) => gql`
      query {
        documentos(first: 1000${cursor ? `, after: "${cursor}"` : ''}) {
          nodes {
            id
            slug
            title
            descripcion
            fecha
            autores
            fuente
            identificador
            archivos {
              nodes {
                filePath
              }
            }
            tiposDeDocumentos {
              nodes {
                slug
                name
              }
            }
            featuredImage {
              node {
                filePath
              }
            }
            categories {
              edges {
                node {
                  name
                  slug
                  count
                  parent {
                    node {
                      slug
                      name
                      count
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `
  );
}

// ========== PERSONAJES ==========
async function fetchPersonajes() {
  return fetchConPaginacion(
    'personajes',
    (cursor) => gql`
      query {
        personajes(first: 1000${cursor ? `, after: "${cursor}"` : ''}) {
          nodes {
            title
            slug
            content(format: RENDERED)
            featuredImage {
              node {
                altText
                sourceUrl
              }
            }
            entrevistas {
              nodes {
                fecha
                ordenTranscripciones
                transcripciones(first: 200) {
                  nodes {
                    title
                    transcripcion(format: RAW)
                    databaseId
                    ordenAudios
                    categories {
                      edges {
                        node {
                          name
                          slug
                          count
                          parent {
                            node {
                              slug
                              name
                              count
                            }
                          }
                        }
                      }
                    }
                    audios(first: 200) {
                      nodes {
                        databaseId
                        archivos {
                          node {
                            link
                            mimeType
                            title
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    // Procesar personajes - agregar HTML procesado a las transcripciones
    (nodos) => {
      return nodos.map((personaje) => {
        if (!personaje.entrevistas || !personaje.entrevistas.nodes) return personaje;

        const entrevistasConHTML = personaje.entrevistas.nodes.map((entrevista) => {
          if (!entrevista.transcripciones || !entrevista.transcripciones.nodes) return entrevista;

          const transcripcionesConHTML = entrevista.transcripciones.nodes.map((transcripcion) => {
            const terminos = [];
            const transcripcionHTML = transcripcion.transcripcion
              ? convertirTextoAHTML(transcripcion.transcripcion, terminos, glosarioCompleto)
              : '';

            return {
              ...transcripcion,
              transcripcionHTML,
              terminos,
              audios: procesarAudiosTranscripcion(transcripcion.audios, transcripcion.ordenAudios || []),
              categorias: procesarCategorias(transcripcion.categories),
            };
          });

          return {
            ...entrevista,
            transcripciones: { nodes: transcripcionesConHTML },
          };
        });

        return {
          ...personaje,
          entrevistas: { nodes: entrevistasConHTML },
        };
      });
    }
  );
}

// ========== CATEGORÍAS ==========
async function fetchCategorias() {
  return fetchConPaginacion(
    'categories',
    (cursor) => gql`
      query {
        categories(where: { hideEmpty: true }, first: 1000${cursor ? `, after: "${cursor}"` : ''}) {
          nodes {
            name
            slug
            count
            parent {
              node {
                slug
                name
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `
  );
}

// ========== CATEGORÍAS CON TRANSCRIPCIONES ==========
async function fetchTranscripcionesPorCategoria(slug) {
  return fetchConPaginacion(
    'transcripciones',
    (cursor) => gql`
      query {
        transcripciones(where: {categoryName: "${slug}"}, first: 1000${cursor ? `, after: "${cursor}"` : ''}) {
          nodes {
            title
            transcripcion(format: RAW)
            ordenAudios
            databaseId
            categories {
              edges {
                node {
                  name
                  slug
                  parent {
                    node {
                      slug
                      name
                    }
                  }
                }
              }
            }
            audios {
              nodes {
                databaseId
                archivos {
                  node {
                    title
                    link
                    mimeType
                  }
                }
              }
            }
            entrevista {
              node {
                fecha
                ordenTranscripciones
                personajes {
                  nodes {
                    title
                    slug
                    featuredImage {
                      node {
                        altText
                        sourceUrl
                      }
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    // Procesar transcripciones - agregar HTML procesado
    (nodos) => {
      return nodos.map((nodo) => {
        const terminos = [];
        const transcripcionHTML = nodo.transcripcion
          ? convertirTextoAHTML(nodo.transcripcion, terminos, glosarioCompleto)
          : '';

        return {
          ...nodo,
          transcripcionHTML,
          terminos,
          audios: procesarAudiosTranscripcion(nodo.audios, nodo.ordenAudios || []),
          categorias: procesarCategorias(nodo.categories),
        };
      });
    }
  );
}

// ========== PÁGINAS ==========
async function fetchPaginas() {
  return fetchConPaginacion(
    'pages',
    (cursor) => gql`
      query {
        pages(first: 1000${cursor ? `, after: "${cursor}"` : ''}) {
          nodes {
            title
            status
            slug
            iconoA
            iconoB
            menuOrder
            principal
            descripcion(format: RAW)
            featuredImage {
              node {
                altText
                sourceUrl
              }
            }
            content(format: RENDERED)
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    (nodos) => nodos.filter((pagina) => pagina.status === 'publish')
  );
}

// ========== GLOSARIO ==========
async function fetchGlosario() {
  return fetchConPaginacion(
    'terminos',
    (cursor) => gql`
      query {
        terminos(first: 1000${cursor ? `, after: "${cursor}"` : ''}) {
          nodes {
            slug
            title
            content
            status
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    (nodos) => nodos.filter((termino) => termino.status === 'publish')
  );
}

// ========== CATEGORÍAS PRINCIPALES ==========
async function fetchCategoriasPrincipales() {
  console.log(`📥 Obteniendo categorías principales...`);
  const query = gql`
    query {
      categories(where: { parent: 0, hideEmpty: true }, first: 1000) {
        nodes {
          slug
          name
        }
      }
    }
  `;
  const { categories } = await pedirDatos(query);
  console.log(`✅ Categorías principales: ${categories.nodes.length} items\n`);
  return categories.nodes;
}

// ========== MAIN ==========
async function main() {
  const inicio = Date.now();
  console.log('🚀 Iniciando fetch masivo de datos...\n');

  try {
    // 1. Primero obtener glosario (necesario para procesamiento de HTML)
    console.log('📚 Obteniendo glosario primero (necesario para procesamiento)...');
    const glosario = await fetchGlosario();
    glosarioCompleto = glosario; // Guardarlo en variable global
    console.log(`✅ Glosario cargado: ${glosario.length} términos\n`);

    // 2. Fetch en paralelo de datos básicos
    const [documentos, categorias, paginas, categoriasPrincipales] = await Promise.all([
      fetchDocumentos(),
      fetchCategorias(),
      fetchPaginas(),
      fetchCategoriasPrincipales(),
    ]);

    // 3. Fetch de datos que necesitan procesamiento de HTML (usan glosario)
    console.log('\n🔄 Obteniendo datos con procesamiento de HTML...');
    const personajes = await fetchPersonajes();

    // Guardar datos
    console.log('💾 Guardando datos en caché...');
    writeFileSync(join(cacheDir, 'documentos.json'), JSON.stringify(documentos, null, 2));
    writeFileSync(join(cacheDir, 'personajes.json'), JSON.stringify(personajes, null, 2));
    writeFileSync(join(cacheDir, 'categorias.json'), JSON.stringify(categorias, null, 2));
    writeFileSync(join(cacheDir, 'paginas.json'), JSON.stringify(paginas, null, 2));
    writeFileSync(join(cacheDir, 'glosario.json'), JSON.stringify(glosario, null, 2));
    writeFileSync(join(cacheDir, 'categorias-principales.json'), JSON.stringify(categoriasPrincipales, null, 2));

    // Fetch de transcripciones por categoría (secuencial porque depende de las categorías)
    console.log('\n📥 Obteniendo transcripciones por categoría...');
    const transcripcionesPorCategoria = {};
    for (const categoria of categorias) {
      const transcripciones = await fetchTranscripcionesPorCategoria(categoria.slug);
      if (transcripciones.length > 0) {
        transcripcionesPorCategoria[categoria.slug] = transcripciones;
        console.log(`  ✓ ${categoria.name}: ${transcripciones.length} transcripciones`);
      }
    }
    writeFileSync(
      join(cacheDir, 'transcripciones-categorias.json'),
      JSON.stringify(transcripcionesPorCategoria, null, 2)
    );

    const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
    console.log(`\n✅ Fetch completo en ${duracion}s`);
    console.log(`📊 Resumen:`);
    console.log(`   - Documentos: ${documentos.length}`);
    console.log(`   - Personajes: ${personajes.length}`);
    console.log(`   - Categorías: ${categorias.length}`);
    console.log(`   - Páginas: ${paginas.length}`);
    console.log(`   - Términos glosario: ${glosario.length}`);
    console.log(`   - Categorías con transcripciones: ${Object.keys(transcripcionesPorCategoria).length}`);
  } catch (error) {
    console.error('❌ Error durante el fetch:', error);
    process.exit(1);
  }
}

main();
