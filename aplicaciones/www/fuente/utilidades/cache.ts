import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type {
  Documento,
  Personaje,
  CategoriaBasico,
  Pagina,
  Glosario,
  CategoriaPrincipal,
  TranscripcionesCruzadas,
} from '@/tipos';

const cacheDir = join(process.cwd(), '.cache');

function leerCache<T>(archivo: string): T {
  const ruta = join(cacheDir, archivo);
  if (!existsSync(ruta)) {
    throw new Error(
      `❌ Archivo de caché no encontrado: ${archivo}\nEjecuta 'yarn prebuild' primero para generar la caché.`
    );
  }
  return JSON.parse(readFileSync(ruta, 'utf-8'));
}

export function obtenerDocumentos(): Documento[] {
  return leerCache<Documento[]>('documentos.json');
}

export function obtenerDocumento(slug: string): Documento | undefined {
  const documentos = obtenerDocumentos();
  return documentos.find((doc) => doc.slug === slug);
}

export function obtenerPersonajes(): Personaje[] {
  return leerCache<Personaje[]>('personajes.json');
}

export function obtenerPersonaje(slug: string): (Personaje & { entrevistas?: { nodes: any[] } }) | undefined {
  const personajes = obtenerPersonajes();
  return personajes.find((p) => p.slug === slug) as any;
}

export function obtenerCategorias(): CategoriaBasico[] {
  return leerCache<CategoriaBasico[]>('categorias.json');
}

export function obtenerCategoria(slug: string): CategoriaBasico | undefined {
  const categorias = obtenerCategorias();
  return categorias.find((c) => c.slug === slug);
}

export function obtenerPaginas(): (Pagina & { principal?: boolean; menuOrder?: number; iconoB?: string })[] {
  return leerCache<(Pagina & { principal?: boolean; menuOrder?: number; iconoB?: string })[]>('paginas.json');
}

export function obtenerPagina(slug: string): Pagina | undefined {
  const paginas = obtenerPaginas();
  return paginas.find((p) => p.slug === slug);
}

export function obtenerGlosario(): Glosario[] {
  return leerCache<Glosario[]>('glosario.json');
}

export function obtenerTerminoGlosario(slug: string): Glosario | undefined {
  const glosario = obtenerGlosario();
  return glosario.find((t) => t.slug === slug);
}

export function obtenerCategoriasPrincipales(): CategoriaPrincipal[] {
  return leerCache<CategoriaPrincipal[]>('categorias-principales.json');
}

export function obtenerTranscripcionesCategoria(slug: string): TranscripcionesCruzadas[] {
  const todas = leerCache<Record<string, TranscripcionesCruzadas[]>>('transcripciones-categorias.json');
  return todas[slug] || [];
}

export function obtenerTodasTranscripcionesCategorias(): Record<string, TranscripcionesCruzadas[]> {
  return leerCache<Record<string, TranscripcionesCruzadas[]>>('transcripciones-categorias.json');
}
