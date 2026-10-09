import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { newId } from '@/logic/format';

export type PhotoSource = 'camara' | 'galeria';

export interface PickedPhoto {
  uri: string;
  base64?: string;
  mimeType: string;
  width: number;
  height: number;
}

/** Abre la cámara o la galería. Devuelve null si el usuario canceló. */
export async function pickPhoto(source: PhotoSource, withBase64 = false): Promise<PickedPhoto | null> {
  if (source === 'camara') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new Error('Necesitamos permiso para usar la cámara. Puedes darlo en los ajustes de tu teléfono.');
    }
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.6,
    base64: withBase64 || Platform.OS === 'web',
  };
  const result =
    source === 'camara' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64 ?? undefined,
    mimeType: asset.mimeType ?? 'image/jpeg',
    width: asset.width,
    height: asset.height,
  };
}

function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'fotos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Copia la foto a la carpeta de la app para que no se pierda si se borra de la galería. */
export function persistPhoto(photo: PickedPhoto): string {
  if (Platform.OS === 'web') {
    return photo.base64 ? `data:${photo.mimeType};base64,${photo.base64}` : photo.uri;
  }
  const ext = photo.mimeType === 'image/png' ? 'png' : 'jpg';
  const dest = new File(photosDir(), `${newId()}.${ext}`);
  new File(photo.uri).copySync(dest);
  return dest.uri;
}

/** Borra fotos guardadas por la app (ignora las que ya no existen). */
export function deletePhotos(uris: string[]) {
  if (Platform.OS === 'web') return;
  const base = Paths.document.uri;
  for (const uri of uris) {
    if (!uri.startsWith(base)) continue;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Si no se puede borrar no pasa nada: solo ocupa espacio.
    }
  }
}
