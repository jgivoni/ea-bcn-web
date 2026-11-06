import type { Lang } from './pages';

// Interface strings that are not page content.
export type Theme = 'light' | 'dark' | 'auto';

type Strings = {
  skip: string;
  footerContact: string;
  siteName: string;
  theme: string;
  themes: Record<Theme, string>;
  newer: string;
  older: string;
  recaps: string;
  menu: string;
  mainNav: string;
  language: string;
  notFoundTitle: string;
  notFoundText: string;
  notFoundHome: string;
  search: string;
  searchPlaceholder: string;
  searchNoResults: string;
  searchUnavailable: string;
  close: string;
};

export const UI: Record<Lang, Strings> = {
  en: {
    skip: 'Skip to content',
    footerContact: 'Not what you’re looking for? Get in touch with us:',
    siteName: 'EA Barcelona',
    theme: 'Theme',
    themes: { light: 'Light', dark: 'Dark', auto: 'Auto' },
    newer: 'Newer',
    older: 'Older',
    recaps: 'Recap navigation',
    menu: 'Menu',
    mainNav: 'Main',
    language: 'Language',
    notFoundTitle: 'Page not found',
    notFoundText: 'This page does not exist or has moved.',
    notFoundHome: 'Go to the home page',
    search: 'Search',
    searchPlaceholder: 'Search this site',
    searchNoResults: 'No pages found.',
    searchUnavailable: 'Search is not available right now.',
    close: 'Close',
  },
  ca: {
    skip: 'Salta al contingut',
    footerContact: 'No és el que busques? Posa’t en contacte amb nosaltres:',
    siteName: 'EA Barcelona',
    theme: 'Tema',
    themes: { light: 'Clar', dark: 'Fosc', auto: 'Automàtic' },
    newer: 'Més recent',
    older: 'Anterior',
    recaps: 'Navegació de resums',
    menu: 'Menú',
    mainNav: 'Principal',
    language: 'Idioma',
    notFoundTitle: 'Pàgina no trobada',
    notFoundText: 'Aquesta pàgina no existeix o s’ha mogut.',
    notFoundHome: 'Ves a la pàgina d’inici',
    search: 'Cerca',
    searchPlaceholder: 'Cerca en aquest web',
    searchNoResults: 'No s’ha trobat cap pàgina.',
    searchUnavailable: 'La cerca no està disponible ara mateix.',
    close: 'Tanca',
  },
  es: {
    skip: 'Saltar al contenido',
    footerContact: '¿No es lo que buscas? Ponte en contacto con nosotros:',
    siteName: 'EA Barcelona',
    theme: 'Tema',
    themes: { light: 'Claro', dark: 'Oscuro', auto: 'Automático' },
    newer: 'Más reciente',
    older: 'Anterior',
    recaps: 'Navegación de resúmenes',
    menu: 'Menú',
    mainNav: 'Principal',
    language: 'Idioma',
    notFoundTitle: 'Página no encontrada',
    notFoundText: 'Esta página no existe o se ha movido.',
    notFoundHome: 'Ir a la página de inicio',
    search: 'Buscar',
    searchPlaceholder: 'Buscar en esta web',
    searchNoResults: 'No se ha encontrado ninguna página.',
    searchUnavailable: 'La búsqueda no está disponible ahora mismo.',
    close: 'Cerrar',
  },
};
