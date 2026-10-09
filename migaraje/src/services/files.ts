import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { createBackup, parseBackup } from '@/logic/backup';
import { todayISO } from '@/logic/dates';
import type { AppData } from '@/types';

function downloadOnWeb(content: string, fileName: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function writeCacheFile(fileName: string, content: string): File {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  return file;
}

/** Genera el respaldo en JSON y abre el menú para guardarlo o compartirlo. */
export async function shareBackup(data: AppData): Promise<void> {
  const json = JSON.stringify(createBackup(data), null, 2);
  const fileName = `migaraje-respaldo-${todayISO()}.json`;
  if (Platform.OS === 'web') {
    downloadOnWeb(json, fileName, 'application/json');
    return;
  }
  const file = writeCacheFile(fileName, json);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartir no está disponible en este dispositivo.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Guardar respaldo' });
}

/** Deja elegir un archivo de respaldo y lo valida. Devuelve null si se canceló. */
export async function pickBackup(): Promise<AppData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  let text: string;
  if (Platform.OS === 'web') {
    text = asset.file ? await asset.file.text() : await (await fetch(asset.uri)).text();
  } else {
    text = await new File(asset.uri).text();
  }
  return parseBackup(text);
}

/** Convierte el HTML en PDF y abre el menú para compartirlo (en web abre el diálogo de impresión). */
export async function shareReportPdf(html: string, baseName: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  let target = new File(uri);
  const safeName = baseName.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'historial';
  const named = new File(Paths.cache, `${safeName}.pdf`);
  try {
    if (named.exists) named.delete();
    target.moveSync(named);
    target = named;
  } catch {
    // Si no se pudo renombrar, se comparte con el nombre original.
  }
  await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Compartir historial' });
}
