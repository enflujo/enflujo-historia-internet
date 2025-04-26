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

export type Imagen = {
  node: { altText: string; sourceUrl: string };
};

export type Audio = {
  node: { title: string; filePath: string };
};

export interface CategoriaBasico {
  name: string;
  slug: string;
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

export interface Categorias {
  categories: {
    nodes: (CategoriaBasico & {
      children: {
        nodes: (CategoriaBasico & {
          children: { nodes: CategoriaBasico[] };
        })[];
      };
    })[];
  };
}

export interface CategoriaWP {
  name: string;
  slug: string;
  children: {
    nodes: {
      name: string;
      slug: string;
    }[];
  };
}
[];
export interface Entrevista {
  fecha: string;
  content: string;
  transcripciones: {
    nodes: {
      transcripcion: string;
      categories: {
        nodes: CategoriaWP[];
      };
      audios: {
        nodes: {
          archivos: Audio;
        }[];
      };
    }[];
  };
}
export interface EntrevistaPersonaje {
  personaje: {
    title: string;
    slug: string;
    featuredImage: Imagen | null;
    content: string;
    entrevistas: {
      nodes: Entrevista[];
    };
  };
}
export interface Categoria {
  nombre: string;
  slug: string;
  conteo: number;
  hijos: {
    nombre: string;
    slug: string;
    conteo: number;
  }[];
}

export interface Termino {
  termino: string;
  conteo: number;
}

export interface EntrevistasProcesadas {
  categoriasPersonaje: Categoria[];
  entrevistas: EntrevistaSingularProcesada[];
}

export interface EntrevistaSingularProcesada {
  fecha: Date;
  secciones: { contenido: string; audios: { url: string; titulo: string }[] }[];
}
