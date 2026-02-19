// Automated or semi-automated mapping for character images
// Maps character names to local assets. The backend sends only names, not image URLs.

const IMAGES_INDEX: Record<string, string> = {
  // Genshin Impact
  'neuvillette': '/images/genshin/fontaine/neuvillette.webp',
  'zibai': '/images/genshin/liyue/zibai.webp',
  
  // Zenless Zone Zero (Season 2)
  'sunna': '/images/zzz/season2/sunna.webp?v=update-01',
  'yixuan': '/images/zzz/season2/yixuan.webp?v=update-01',

  // Honkai Star Rail
  'blackswan': '/images/hsr/penacony/blackswan.webp?v=update-02',
  'evernight': '/images/hsr/amphoreus/evernight.webp?v=initial',
  'hysilens': '/images/hsr/amphoreus/hysilens.webp?v=update-01',
  'yaoguang': '/images/hsr/planarcadia/yaoguang.webp?v=initial',
};

/**
 * Resuelve la imagen de un personaje basándose en su nombre.
 * @param characterName Nombre del personaje (ej. "Neuvillette", "Black Swan", "Yao Guang")
 * @returns La ruta de la imagen local o cadena vacía si no se encuentra
 */
export function resolveCharacterImage(characterName: string): string {
  if (!characterName) return '';
  
  const normalized = characterName.toLowerCase().trim().replace(/\s+/g, '');
  
  return IMAGES_INDEX[normalized] ?? '';
}
