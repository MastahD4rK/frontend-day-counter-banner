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
    'status.maintenance': 'Sin banners activos — posible mantenimiento',
    'status.error': 'Error al obtener datos de este juego',
    'footer.madeBy': 'Hecho por',
    'footer.disclaimer': 'Este sitio es un proyecto fan no afiliado ni respaldado por COGNOSPHERE PTE. LTD. ni HoYoverse. Genshin Impact, Honkai: Star Rail y Zenless Zone Zero son marcas registradas de COGNOSPHERE PTE. LTD.',
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
    'status.maintenance': 'No active banners — possible maintenance',
    'status.error': 'Error fetching data for this game',
    'footer.madeBy': 'Made by',
    'footer.disclaimer': 'This is a fan project not affiliated with or endorsed by COGNOSPHERE PTE. LTD. or HoYoverse. Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero are trademarks of COGNOSPHERE PTE. LTD.',
  }
};

export const locale = writable<Locale>('es');

export const t = derived(locale, ($locale) => {
  return (key: string) => translations[$locale][key] || key;
});
