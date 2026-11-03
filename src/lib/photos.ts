import type { ImageMetadata } from 'astro';

// Content refers to photos by file name without extension, for example `image: community`.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.{jpg,jpeg,png}', { eager: true });

const photos = new Map<string, ImageMetadata>();
for (const [path, module] of Object.entries(files)) {
  const key = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  photos.set(key, module.default);
}

export function photo(key: string): ImageMetadata {
  const found = photos.get(key);
  if (!found) throw new Error(`No photo named "${key}" in src/assets/photos`);
  return found;
}
