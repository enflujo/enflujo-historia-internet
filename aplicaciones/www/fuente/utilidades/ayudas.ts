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
