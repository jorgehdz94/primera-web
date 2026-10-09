import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptic, showMessage } from '@/services/feedback';
import { persistPhoto, pickPhoto, type PhotoSource } from '@/services/photos';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { IconButton } from './ui';

interface Props {
  photos: string[];
  /** Si se pasa, permite agregar y quitar fotos. */
  onChange?: (photos: string[]) => void;
  max?: number;
}

export function PhotoStrip({ photos, onChange, max = 8 }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [viewing, setViewing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async (source: PhotoSource) => {
    if (!onChange || busy) return;
    setBusy(true);
    try {
      const picked = await pickPhoto(source);
      if (picked) onChange([...photos, persistPhoto(picked)]);
    } catch (e) {
      showMessage('No se pudo agregar la foto', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {photos.map((uri) => (
          <Pressable
            key={uri}
            accessibilityRole="imagebutton"
            accessibilityLabel="Ver foto"
            onPress={() => {
              haptic('selection');
              setViewing(uri);
            }}>
            <Image source={{ uri }} style={[styles.thumb, { backgroundColor: theme.cardAlt }]} contentFit="cover" transition={150} />
            {onChange ? (
              <Pressable
                accessibilityLabel="Quitar foto"
                hitSlop={6}
                onPress={() => onChange(photos.filter((p) => p !== uri))}
                style={[styles.remove, { backgroundColor: theme.overlay }]}>
                <Icon name="close" size={14} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </Pressable>
        ))}
        {onChange && photos.length < max ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => add('camara')}
              style={[styles.addBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Icon name="camera" size={26} color={theme.primary} />
              <AppText variant="caption">Tomar foto</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => add('galeria')}
              style={[styles.addBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Icon name="image-multiple" size={26} color={theme.primary} />
              <AppText variant="caption">Galería</AppText>
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      <Modal visible={viewing !== null} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <View style={styles.viewer}>
          {viewing ? <Image source={{ uri: viewing }} style={styles.full} contentFit="contain" /> : null}
          <View style={[styles.close, { top: insets.top + Spacing.md }]}>
            <IconButton icon="close" label="Cerrar" onPress={() => setViewing(null)} color="#FFFFFF" background="rgba(255,255,255,0.18)" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  thumb: { width: 96, height: 96, borderRadius: Radius.md },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBox: {
    width: 96,
    height: 96,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center' },
  full: { width: '100%', height: '100%' },
  close: { position: 'absolute', right: Spacing.lg },
});
