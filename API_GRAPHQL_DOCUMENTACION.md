# Documentación API GraphQL - Historia del Internet

**Una guía para acceder a los datos del proyecto "Historia del Internet" usando GraphQL**

---

## Introducción

Este proyecto almacena información sobre la historia del internet en Colombia en una base de datos WordPress con capacidades GraphQL. Si deseas usar nuestros datos para tus propias investigaciones, esta guía te mostrará cómo hacerlo de forma sencilla.

### ¿Qué es GraphQL?

GraphQL es un lenguaje para pedir datos de una API. A diferencia de las APIs tradicionales que devuelven datos fijos, con GraphQL **tú eliges exactamente qué datos necesitas**.

**Analogía simple:** Si una API tradicional es como pedir una pizza completa, GraphQL es como decir al restaurante exactamente qué ingredientes quieres en tu pizza.

### ¿Cómo acceder?

**URL base:** `https://historiasinternetpre.uniandes.edu.co/graphql`

**Método:** POST (envías datos al servidor)

**Formato:** JSON

---

## Primeros pasos

### Ejemplo básico con curl (terminal)

```bash
curl -X POST https://historiasinternetpre.uniandes.edu.co/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ pages { nodes { title slug } } }"
  }'
```

### Con JavaScript/Node.js

```javascript
async function obtenerDatos(query) {
  const response = await fetch('https://historiasinternetpre.uniandes.edu.co/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  return data;
}

// Usar la función
const query = `{
  pages {
    nodes {
      title
      slug
    }
  }
}`;

obtenerDatos(query).then((resultado) => console.log(resultado));
```

### Con Python

```python
import requests
import json

API_URL = "https://historiasinternetpre.uniandes.edu.co/graphql"

def obtener_datos(query):
    response = requests.post(
        API_URL,
        json={"query": query}
    )
    return response.json()

# Usar la función
query = """
{
  pages {
    nodes {
      title
      slug
    }
  }
}
"""

resultado = obtener_datos(query)
print(json.dumps(resultado, indent=2))
```

---

## Tipos de datos principales

El proyecto tiene varios tipos de contenido que puedes consultar:

| Tipo            | Descripción                         | Ejemplo                           |
| --------------- | ----------------------------------- | --------------------------------- |
| **pages**       | Páginas estáticas del sitio         | Inicio, Acerca de, Investigación  |
| **eventos**     | Eventos históricos del internet     | Nacimiento de ARPANET, primer .co |
| **documentos**  | Documentos, artículos, referencias  | PDFs, textos académicos           |
| **personajes**  | Personas importantes en la historia | Fundadores, investigadores        |
| **entrevistas** | Entrevistas a personajes            | Transcripciones de entrevistas    |
| **terminos**    | Términos del glosario               | Definiciones técnicas             |

---

## Consultas por tipo de datos

### 1. **PÁGINAS** (Pages)

Las páginas son contenido estático del sitio web.

#### Campos disponibles:

- `title` - Título de la página
- `slug` - URL amigable de la página
- `content` - Contenido HTML de la página
- `descripcion` - Descripción corta
- `iconoA` - Ícono principal
- `iconoB` - Ícono secundario
- `menuOrder` - Orden en el menú

#### Consulta para obtener todas las páginas:

```graphql
{
  pages {
    nodes {
      title
      slug
      content
      descripcion
      menuOrder
    }
  }
}
```

#### Consulta para obtener una página específica:

```graphql
{
  page(id: "inicio", idType: URI) {
    title
    slug
    content
    descripcion
    iconoA
    iconoB
  }
}
```

**Nota:** Algunos slugs útiles: `inicio`, `acerca-de`, `introduccion-investigacion`, `linea-de-tiempo`, `glosario`

---

### 2. **EVENTOS** (Eventos)

Los eventos son momentos importantes en la historia del internet.

#### Campos disponibles:

- `title` - Nombre del evento
- `slug` - URL amigable
- `fecha` - Fecha del evento (formato: YYYY-MM-DD)
- `tipo` - Tipo: `colombia` o `tecnologico`
- `content` - Descripción del evento
- `categories` - Categorías asociadas
- `status` - Estado: `publish`, `draft`, etc.

#### Consulta para obtener eventos:

```graphql
{
  eventos(first: 100) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      title
      slug
      fecha
      tipo
      content
      categories {
        nodes {
          name
          slug
        }
      }
    }
  }
}
```

#### Consulta con paginación (obtener siguientes 100):

```graphql
{
  eventos(first: 100, after: "CURSOR_ANTERIOR") {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      title
      fecha
      tipo
    }
  }
}
```

**Tipos de eventos:**

- `tecnologico` - Hitos tecnológicos mundiales
- `colombia` - Eventos importantes en Colombia

---

### 3. **DOCUMENTOS** (Documentos)

Documentos, artículos y referencias del proyecto.

#### Campos disponibles:

- `title` - Título del documento
- `slug` - URL amigable
- `tituloCorto` - Título abreviado
- `descripcion` - Resumen del documento
- `fecha` - Fecha del documento
- `autores` - Quién escribió
- `fuente` - Dónde se obtuvo
- `identificador` - ID único
- `archivos` - Archivos adjuntos
- `tiposDeDocumentos` - Clasificación (artículo, libro, etc.)
- `categories` - Temas relacionados
- `featuredImage` - Imagen de portada

#### Consulta para obtener documentos:

```graphql
{
  documentos(first: 50) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      title
      slug
      tituloCorto
      descripcion
      fecha
      autores
      fuente
      tiposDeDocumentos {
        nodes {
          name
          slug
        }
      }
      categories {
        edges {
          node {
            name
            slug
          }
        }
      }
      archivos {
        nodes {
          filePath
        }
      }
    }
  }
}
```

#### Obtener documentos de un tipo específico:

```graphql
{
  documentosTipo(slug: "articulo", first: 50) {
    nodes {
      title
      descripcion
      autores
      fecha
    }
  }
}
```

---

### 4. **PERSONAJES** (Personajes)

Personas importantes en la historia del internet.

#### Campos disponibles:

- `title` - Nombre del personaje
- `slug` - URL amigable
- `content` - Biografía o descripción
- `featuredImage` - Foto del personaje
- `entrevistas` - Entrevistas realizadas a este personaje

#### Consulta para obtener personajes:

```graphql
{
  personajes(first: 50) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      title
      slug
      content
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
}
```

#### Obtener un personaje específico con sus entrevistas:

```graphql
{
  personajeBy(slug: "nombre-del-personaje") {
    title
    content
    featuredImage {
      node {
        sourceUrl
      }
    }
    entrevistas {
      nodes {
        fecha
        content
      }
    }
  }
}
```

---

### 5. **ENTREVISTAS** (Entrevistas)

Entrevistas a personajes clave del proyecto.

#### Campos disponibles:

- `title` - Título o tema de la entrevista
- `slug` - URL amigable
- `fecha` - Fecha de la entrevista
- `content` - Contenido o preámbulo
- `personajes` - Personas entrevistadas
- `transcripciones` - Texto de la entrevista
- `ordenTranscripciones` - Orden de las secciones

#### Consulta para obtener entrevistas:

```graphql
{
  entrevistas(first: 50) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      title
      slug
      fecha
      personajes {
        nodes {
          title
          slug
        }
      }
      transcripciones {
        nodes {
          title
          transcripcion
        }
      }
    }
  }
}
```

---

### 6. **TÉRMINOS** (Glosario)

Términos técnicos definidos en el glosario.

#### Campos disponibles:

- `title` - Término
- `slug` - URL amigable
- `content` - Definición

#### Consulta para obtener términos:

```graphql
{
  terminos(first: 100) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      title
      slug
      content
    }
  }
}
```

#### Obtener un término específico:

```graphql
{
  terminoBy(slug: "arpanet") {
    title
    content
  }
}
```

---

### 7. **CATEGORÍAS** (Categories)

Temas y categorías para clasificar contenido.

#### Campos disponibles:

- `name` - Nombre de la categoría
- `slug` - URL amigable
- `count` - Cuántos items tienen esta categoría
- `description` - Descripción
- `children` - Subcategorías
- `parent` - Categoría padre

#### Consulta para obtener el árbol de categorías:

```graphql
{
  categories(first: 100) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      name
      slug
      count
      description
      children {
        nodes {
          name
          slug
          count
        }
      }
      parent {
        node {
          name
          slug
        }
      }
    }
  }
}
```

---

## Paginación

Como habrás notado, muchas consultas devuelven `pageInfo` y usan `first`. Esto es para **paginación**: obtener los datos en pequeños lotes en lugar de todo a la vez.

### Conceptos clave:

- **`first: N`** - Obtener los primeros N resultados
- **`after: "CURSOR"`** - Obtener resultados después del cursor
- **`hasNextPage`** - ¿Hay más resultados?
- **`endCursor`** - Cursor para obtener la siguiente página

### Ejemplo de paginación completa:

```javascript
async function obtenerTodos(tipoContenido) {
  const API_URL = 'https://historiasinternetpre.uniandes.edu.co/graphql';
  const todos = [];
  let tieneMas = true;
  let cursor = null;

  while (tieneMas) {
    const query = `{
      ${tipoContenido}(first: 100${cursor ? `, after: "${cursor}"` : ''}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          title
          slug
          fecha
        }
      }
    }`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const { data } = await response.json();
    const contenido = data[tipoContenido];

    todos.push(...contenido.nodes);
    tieneMas = contenido.pageInfo.hasNextPage;
    cursor = contenido.pageInfo.endCursor;

    console.log(`Obtenidos ${todos.length} items...`);
  }

  return todos;
}

// Usar:
obtenerTodos('eventos').then((eventos) => {
  console.log(`Total eventos: ${eventos.length}`);
  console.log(eventos);
});
```

---

## Filtros y búsquedas

### Filtrar por estado de publicación:

```graphql
{
  eventos(first: 50, where: { status: PUBLISH }) {
    nodes {
      title
      status
    }
  }
}
```

### Obtener solo documentos con archivos:

```graphql
{
  documentos(first: 50) {
    nodes {
      title
      archivos {
        nodes {
          filePath
        }
      }
    }
  }
}
```

### Filtrar por categoría:

```graphql
{
  eventos(first: 50, where: { categoryName: "tecnologia" }) {
    nodes {
      title
      categories {
        nodes {
          name
        }
      }
    }
  }
}
```

---

## Casos de uso prácticos

### Caso 1: Crear una línea de tiempo de eventos

```javascript
async function crearLineaTiempo() {
  const query = `{
    eventos(first: 1000) {
      nodes {
        title
        fecha
        tipo
        content
      }
    }
  }`;

  const response = await fetch('https://historiasinternetpre.uniandes.edu.co/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();

  // Ordenar por fecha
  const eventos = data.eventos.nodes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  console.log('Línea de tiempo:');
  eventos.forEach((e) => {
    console.log(`${e.fecha} - ${e.title}`);
  });
}
```

### Caso 2: Analizar categorías más usadas

```javascript
async function analizarCategorias() {
  const query = `{
    categories(first: 100) {
      nodes {
        name
        count
      }
    }
  }`;

  const response = await fetch('https://historiasinternetpre.uniandes.edu.co/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();

  // Ordenar por cantidad de contenido
  const categorias = data.categories.nodes.sort((a, b) => b.count - a.count).slice(0, 10);

  console.log('Top 10 categorías:');
  categorias.forEach((c) => {
    console.log(`${c.name}: ${c.count} items`);
  });
}
```

### Caso 3: Descargar todas las transcripciones de entrevistas

```javascript
async function descargarTranscripciones() {
  const query = `{
    entrevistas(first: 1000) {
      nodes {
        title
        fecha
        personajes {
          nodes {
            title
          }
        }
        transcripciones {
          nodes {
            title
            transcripcion
          }
        }
      }
    }
  }`;

  const response = await fetch('https://historiasinternetpre.uniandes.edu.co/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();
  const entrevistas = data.entrevistas.nodes;

  // Guardar como JSON
  console.log(JSON.stringify(entrevistas, null, 2));
}
```

---

## Probar consultas online

WordPress GraphQL tiene una interfaz llamada **GraphiQL** donde puedes probar consultas interactivamente:

**URL:** `https://historiasinternetpre.uniandes.edu.co/graphql`

En algunos navegadores, si accedes a esa URL, podrás ver un editor donde escribir consultas y ver los resultados en tiempo real.

---

## Preguntas frecuentes

### ¿Puedo descargar todos los datos a la vez?

Técnicamente sí, pero es mejor hacerlo en páginas (paginación) para evitar sobrecargar el servidor. Usa `first: 100` o `first: 1000` y luego ve a la siguiente página.

### ¿Hay límite de consultas?

El servidor permite un número razonable de consultas. Si haces cientos en pocos segundos, podría limitarse tu acceso temporalmente.

### ¿Puedo usar estos datos comercialmente?

Depende de la licencia del proyecto. Por favor revisa el archivo `LICENSE` en el repositorio.

### ¿Qué hago si una consulta falla?

Verifica:

1. La URL sea correcta
2. El JSON esté bien formado
3. Los nombres de campos sean exactos (sensibles a mayúsculas/minúsculas)
4. La conexión a internet funcione

### ¿Cómo filtro por rango de fechas?

```graphql
{
  eventos(first: 100, where: { dateQuery: { after: "2020-01-01", before: "2023-12-31" } }) {
    nodes {
      title
      fecha
    }
  }
}
```

---

## Estructura de respuesta

Todas las consultas devuelven JSON con esta estructura:

```json
{
  "data": {
    "nombreDelTipo": {
      "nodes": [
        { "field1": "valor", "field2": "valor" },
        { "field1": "valor", "field2": "valor" }
      ],
      "pageInfo": {
        "hasNextPage": true,
        "endCursor": "abcd1234"
      }
    }
  },
  "errors": null
}
```

Si hay un error:

```json
{
  "errors": [
    {
      "message": "Descripción del error",
      "locations": [{ "line": 1, "column": 5 }]
    }
  ]
}
```

---

## Recursos adicionales

- [Documentación oficial de GraphQL](https://graphql.org/)
- [Documentación de WordPress GraphQL](https://www.wpgraphql.com/)
- [Cliente GraphQL en JavaScript](https://graphql-request.js.org/)
- [Postman - Herramienta para probar APIs](https://www.postman.com/)

---

## ¿Preguntas o problemas?

Si encuentras problemas o tienes preguntas sobre cómo acceder a los datos, por favor:

1. Revisa esta documentación nuevamente
2. Prueba tu consulta en el editor GraphiQL
3. Abre un issue en el repositorio del proyecto

---

**Última actualización:** Diciembre 2025

**Versión de la API:** 1.0

**Servidor:** `historiasinternetpre.uniandes.edu.co`
