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
