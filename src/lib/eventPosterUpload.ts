import { requireSupabase } from '@/lib/supabase';

const ALLOWED_POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_POSTER_SIZE = 5 * 1024 * 1024;
const LOCAL_POSTER_MAX_WIDTH = 1400;
const LOCAL_POSTER_MAX_HEIGHT = 820;

function safeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-');
}

export async function uploadEventPoster(file: File, organizerId: string) {
  validateEventPoster(file);

  const supabase = requireSupabase();
  const path = `events/${organizerId}/${Date.now()}-${safeFileName(file.name)}`;

  const { error } = await supabase.storage
    .from('event-posters')
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Poster upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('event-posters').getPublicUrl(path);
  return data.publicUrl;
}

export function validateEventPoster(file: File) {
  if (!ALLOWED_POSTER_TYPES.includes(file.type)) {
    throw new Error('Please upload JPG, PNG, or WEBP image.');
  }

  if (file.size > MAX_POSTER_SIZE) {
    throw new Error('Poster image must be under 5MB.');
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read poster image.'));
    reader.readAsDataURL(file);
  });
}

export async function createLocalPosterDataUrl(file: File) {
  validateEventPoster(file);

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, LOCAL_POSTER_MAX_WIDTH / bitmap.width, LOCAL_POSTER_MAX_HEIGHT / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare poster image.');
    context.fillStyle = '#F7F6EB';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return readFileAsDataUrl(file);
  }
}
