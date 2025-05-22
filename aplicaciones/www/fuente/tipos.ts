export interface CamposGenerales {
  title: string;
  slug: string;
  status: 'publish' | 'future' | 'draft' | 'pending' | 'private' | 'trash';
}

export interface Evento extends CamposGenerales {
  fecha: string;
  tipo: 'colombia' | 'tecnologico';
  content: string;
  categories: { nodes: CategoriaBasico[] };
}

export interface PaginaMenu extends CamposGenerales {
  menuOrder: number;
  iconoA: string;
  iconoB: string;
}

export type Imagen = { node: { altText: string; sourceUrl: string } };

export type Audio = { node: { title: string; link: string; mimeType: string } };

export interface CategoriaBasico {
  name: string;
  slug: string;
  count: number;
}

export interface Pagina extends CamposGenerales {
  iconoA: string;
  featuredImage: Imagen | null;
  content: string | null;
  descripcion: string;
}

export interface MetaInfo {
  hasNextPage: boolean;
  endCursor: string;
}

export interface DocumentoSimple extends CamposGenerales {
  fecha: string;
  descripcion: string;
  categories: { nodes: CategoriaBasico[] };
}

export interface EventoLinea extends CamposGenerales {
  fecha: number;
  contenido: string;
  categories: CategoriaBasico[];
  tipo: 'colombia' | 'tecnologico' | 'documento';
}

export interface Glosario extends CamposGenerales {
  content: string;
}

export interface Personaje extends CamposGenerales {
  content: string;
  featuredImage: Imagen | null;
}

export interface TranscripcionWP {
  title: string;
  transcripcion: string;
  databaseId: number;
  ordenAudios: number[];
  categories: CategoriasWP;
  audios: AudiosWP;
}

export interface AudiosWP {
  nodes: { databaseId: number; archivos: Audio }[];
}

export interface EntrevistaWP {
  fecha: string;
  content: string;
  ordenTranscripciones: number[];
  transcripciones: { nodes: TranscripcionWP[] };
}
export interface EntrevistaPersonaje {
  personaje: {
    title: string;
    slug: string;
    featuredImage: Imagen | null;
    content: string;
    entrevistas: { nodes: EntrevistaWP[] };
  };
}

export interface EntrevistaCruzada {
  transcripciones: { nodes: TranscripcionesCruzadas[] };
}

export interface TranscripcionesCruzadas extends TranscripcionWP {
  entrevista: {
    node: {
      fecha: string;
      ordenTranscripciones: number[];
      personajes: { nodes: { title: string; slug: string; featuredImage: Imagen | null }[] };
    };
  };
}

export interface Termino {
  termino: string;
  slug: string;
  conteo: number;
}

export interface TerminoGlosario {
  title: string;
  slug: string;
}

export interface EntrevistasProcesadas {
  categoriasPersonaje: CategoriaProcesada[];
  entrevistas: EntrevistaSingularProcesada[];
}

export interface EntrevistaSingularProcesada {
  fecha: Date;
  secciones: SeccionEntrevistaProcesada[];
}

export interface SeccionEntrevistaProcesada {
  contenido: string;
  audios: { url: string; titulo: string; tipo: string }[];
  categorias: CategoriaProcesada[];
}

export interface SeccionEntrevistaProcesadaCruzada extends SeccionEntrevistaProcesada {
  personajes: { nombre: string; slug: string }[];
  fechaEntrevista: Date;
}

export interface Documento {
  id: string;
  slug: string;
  title: string;
  descripcion: string;
  fecha: string;
  autores: string;
  fuente: string;
  identificador: string;
  archivos: { nodes: { filePath: string }[] };
  tiposDeDocumentos: { nodes: { slug: string; name: string }[] };
  featuredImage: { node: { filePath: string } };
  categories: CategoriasWP;
  categorias: CategoriaProcesada[];
}

export interface CategoriaProcesada {
  slug: string;
  nombre: string;
  conteo: number;
  hijos: {
    slug: string;
    nombre: string;
    conteo: number;
  }[];
}

export interface CategoriasWP {
  edges: {
    node: {
      slug: string;
      name: string;
      count: number;
      parent: { node: { slug: string; name: string; count: number } };
    };
  }[];
}

export interface CategoriasWPNodos {
  nodes: {
    slug: string;
    name: string;
    count: number;
    children: { nodes: { slug: string; name: string; count: number }[] };
  }[];
}
