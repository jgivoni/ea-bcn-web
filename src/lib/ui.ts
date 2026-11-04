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
  },
};
