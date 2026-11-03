import type { Lang } from './pages';

// Interface strings that are not page content.
export type Theme = 'light' | 'dark' | 'auto';

type Strings = {
  skip: string;
  footerContact: string;
  siteName: string;
  theme: string;
  themes: Record<Theme, string>;
};

export const UI: Record<Lang, Strings> = {
  en: {
    skip: 'Skip to content',
    footerContact: 'Not what you’re looking for? Get in touch with us:',
    siteName: 'EA Barcelona',
    theme: 'Theme',
    themes: { light: 'Light', dark: 'Dark', auto: 'Auto' },
  },
  ca: {
    skip: 'Salta al contingut',
    footerContact: 'No és el que busques? Posa’t en contacte amb nosaltres:',
    siteName: 'EA Barcelona',
    theme: 'Tema',
    themes: { light: 'Clar', dark: 'Fosc', auto: 'Automàtic' },
  },
  es: {
    skip: 'Saltar al contenido',
    footerContact: '¿No es lo que buscas? Ponte en contacto con nosotros:',
    siteName: 'EA Barcelona',
    theme: 'Tema',
    themes: { light: 'Claro', dark: 'Oscuro', auto: 'Automático' },
  },
};
