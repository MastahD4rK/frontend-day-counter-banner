// Automated or semi-automated mapping for character images
// This helps to dynamically match character names with their multi-folder paths

const IMAGES_INDEX: Record<string, string> = {
  // Genshin Impact
  'neuvillette': '/images/genshin/fontaine/neuvillette.webp',
  'zibai': '/images/genshin/liyue/zibai.webp',
  
  // Zenless Zone Zero (Season 2)
  'sunna': '/images/zzz/season2/sunna.webp?v=update-01',
  'yixuan': '/images/zzz/season2/yixuan.webp?v=update-01',

  // Honkai Star Rail
  'blackswan': '/images/hsr/penacony/blackswan.webp?v=initial',
  'evernight': '/images/hsr/amphoreus/evernight.webp?v=initial',
  'hysilens': '/images/hsr/amphoreus/hysilens.webp?v=update-01',
  'yaoguang': '/images/hsr/planarcadia/yaoguang.webp?v=initial',
};

/**
 * Resuelve la imagen de un personaje basándose en su nombre
 * @param characterName Nombre del personaje (ej. "Neuvillette")
 * @param fallback Imagen por defecto de la API
 * @returns La ruta de la imagen local o el fallback
 */
export function resolveCharacterImage(characterName: string, fallback: string = ''): string {
  if (!characterName) return fallback;
  
  const normalized = characterName.toLowerCase().trim().replace(/\s+/g, '');
  
  // Si encontramos el personaje en nuestro índice de carpetas regionales (Genshin/HSR)
  if (IMAGES_INDEX[normalized]) {
    return IMAGES_INDEX[normalized];
  }

  // De lo contrario, usamos la imagen que ya venía de la API
  return fallback;
}
