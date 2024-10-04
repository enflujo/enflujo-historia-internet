export interface CamposGenerales {
  title: string;
  slug: string;
  status: 'publish' | 'future' | 'draft' | 'pending' | 'private' | 'trash';
}

export interface Evento extends CamposGenerales {
  fecha: string;
  tipo: 'colombia' | 'tecnologico';
  content: string;
}

export interface PaginaMenu extends CamposGenerales {
  menuOrder: number;
  iconoA: string;
  iconoB: string;
}

export type Imagen = {
  node: { altText: string; uri: string };
};

export interface Pagina extends CamposGenerales {
  iconoA: string;
  featuredImage: Imagen | null;
  content: string | null;
  descripcion: string;
}
