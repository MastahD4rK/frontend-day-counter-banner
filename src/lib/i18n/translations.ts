import { writable, derived } from 'svelte/store';

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

const translations: Record<Locale, Record<string, string>> = {
  es: {
    'nav.all': 'Todos',
    'nav.genshin': 'Genshin',
    'nav.hsr': 'HSR',
    'nav.zzz': 'ZZZ',
    'game.genshin': 'Genshin Impact',
    'game.hsr': 'Honkai: Star Rail',
    'game.zzz': 'Zenless Zone Zero',
    'nav.server': 'Servidor',
    'server.america': 'América',
    'server.europe': 'Europa',
    'server.asia': 'Asia',
    'server.sar': 'SAR',
    'header.sync': 'Sincronizado con servidores oficiales',
    'loading.message': 'Consultando el rastro galáctico...',
    'error.title': 'Error de Sincronización',
    'empty.message': 'No se detectaron anomalías temporales para esta sección.',
    'empty.submessage': 'Vuelve en la siguiente actualización',
    'card.finished': 'EXPIRADO',
    'card.open': 'Portal Abierto',
    'card.view': 'Ver a',
    'card.sync': 'SYNC_UTC',
    'card.days': 'D',
    'card.hours': 'H',
    'card.minutes': 'M',
    'card.seconds': 'S',
  },
  en: {
    'nav.all': 'All',
    'nav.genshin': 'Genshin',
    'nav.hsr': 'HSR',
    'nav.zzz': 'ZZZ',
    'game.genshin': 'Genshin Impact',
    'game.hsr': 'Honkai: Star Rail',
    'game.zzz': 'Zenless Zone Zero',
    'header.sync': 'Synchronized with official servers',
    'loading.message': 'Scanning the galactic trail...',
    'error.title': 'Synchronization Error',
    'empty.message': 'No temporal anomalies detected in this sector.',
    'empty.submessage': 'Check back in the next update',
    'card.finished': 'Event Finished',
    'card.open': 'Portal Open',
    'card.view': 'View',
    'card.sync': 'SYNC_UTC',
    'card.days': 'D',
    'card.hours': 'H',
    'card.minutes': 'M',
    'card.seconds': 'S',
  }
};

export const locale = writable<Locale>('es');

export const t = derived(locale, ($locale) => {
  return (key: string) => translations[$locale][key] || key;
});
