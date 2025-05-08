export const apiBase = 'https://wordpress.enflujo.com'; // import.meta.env.PROD ? 'https://historiasinternetpre.uniandes.edu.co' : 'http://localhost:4040';
export const base = import.meta.env.BASE_URL;

export const opcionesFecha: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};
