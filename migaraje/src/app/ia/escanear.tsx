import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip, Field } from '@/components/Form';
import { Screen } from '@/components/Screen';
import { SimpleMarkdown } from '@/components/SimpleMarkdown';
import { Bullets, Button, Card, EmptyState, IconCircle, InfoBox, SectionHeader } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { getCategory, hasCategory } from '@/data/categories';
import { useAppData } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { formatDate, isValidISODate, todayISO } from '@/logic/dates';
import { formatDistance, formatMoney, vehicleTitle } from '@/logic/format';
import { friendlyAIError, getApiKey, scanInvoice, type InvoiceScan } from '@/services/ai';
import { haptic, showMessage } from '@/services/feedback';
import { persistPhoto, pickPhoto, type PickedPhoto, type PhotoSource } from '@/services/photos';
import { useDraftStore } from '@/store/draft';

const LOADING_MESSAGES = ['Leyendo la factura…', 'Identificando los trabajos…', 'Buscando quién hizo el trabajo…', 'Preparando la explicación…'];

function LoadingMessage() {
  const theme = useTheme();
  const [i, setI] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setI((n) => (n + 1) % LOADING_MESSAGES.length), 2200);
    return () => clearInterval(timer);
  }, []);
  return (
    <Card style={styles.loading}>
      <ActivityIndicator color={theme.primary} size="large" />
      <AppText variant="subheading">{LOADING_MESSAGES[i]}</AppText>
      <AppText variant="caption">Puede tardar unos segundos.</AppText>
    </Card>
  );
}

export default function ScanScreen() {
  const theme = useTheme();
  const data = useAppData();
  const setServiceDraft = useDraftStore((s) => s.setServiceDraft);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [vehicleId, setVehicleId] = useState<string | undefined>(data.vehicles.length === 1 ? data.vehicles[0].id : undefined);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceScan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { settings } = data;
  const vehicle = data.vehicles.find((v) => v.id === vehicleId);

  useFocusEffect(
    useCallback(() => {
      getApiKey()
        .then((k) => setHasKey(!!k))
        .catch(() => setHasKey(false));
    }, []),
  );

  const choose = async (source: PhotoSource) => {
    try {
      const picked = await pickPhoto(source, true);
      if (picked) {
        setPhoto(picked);
        setResult(null);
        setError(null);
      }
    } catch (e) {
      showMessage('No se pudo abrir la foto', e instanceof Error ? e.message : undefined);
    }
  };

  const analyze = async () => {
    if (!photo || !vehicle) return;
    setLoading(true);
    setError(null);
    try {
      const scan = await scanInvoice(photo, vehicle, settings, todayISO());
      setResult(scan);
      haptic('success');
    } catch (e) {
      setError(friendlyAIError(e));
      haptic('warning');
    } finally {
      setLoading(false);
    }
  };

  const saveResult = () => {
    if (!result || !vehicle || !photo) return;
    const items = result.trabajos
      .filter((t) => hasCategory(t.categoria))
      .map((t) => ({ categoryId: t.categoria, detail: t.detalle || undefined, cost: t.costo ?? undefined }));
    const unique = items.filter((item, i) => items.findIndex((x) => x.categoryId === item.categoryId) === i);
    let savedPhoto: string | undefined;
    try {
      savedPhoto = persistPhoto(photo);
    } catch {
      savedPhoto = undefined;
    }
    setServiceDraft({
      vehicleId: vehicle.id,
      date: result.fecha && isValidISODate(result.fecha) && result.fecha <= todayISO() ? result.fecha : undefined,
      km: result.kilometraje ?? undefined,
      workshopName: result.taller ?? undefined,
      mechanic: result.mecanico ?? undefined,
      items: unique,
      laborCost: result.mano_de_obra ?? undefined,
      totalCost: result.total ?? undefined,
      notes: `Resumen del asistente: ${result.resumen}`,
      photos: savedPhoto ? [savedPhoto] : [],
    });
    router.replace({ pathname: '/servicio/nuevo', params: { draft: '1', vehicleId: vehicle.id } });
  };

  if (data.vehicles.length === 0) {
    return (
      <Screen>
        <EmptyState emoji="🚗" title="Primero agrega un vehículo" text="Así sabremos a quién le hicieron el servicio." action="Agregar vehículo" onAction={() => router.replace('/vehiculo/nuevo')} />
      </Screen>
    );
  }

  if (hasKey === false) {
    return (
      <Screen>
        <View style={styles.hero}>
          <AppText style={styles.emoji}>🧾📸</AppText>
          <AppText variant="title" center>
            Escanea tu factura del taller
          </AppText>
          <AppText muted center>
            Tómale foto a la nota y la IA llena el registro por ti y te explica cada trabajo. Para usarlo, activa el asistente (es opcional).
          </AppText>
        </View>
        <Button title="Activar asistente" icon="robot-outline" onPress={() => router.push('/ia/configurar')} />
        <Button title="Mejor lo registro a mano" variant="ghost" onPress={() => router.replace('/servicio/nuevo')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Escanea tu factura</AppText>
      <AppText muted style={styles.intro}>
        Toma una foto clara de la nota o factura del taller. Detectamos los trabajos, el costo, la fecha y quién lo hizo, y te explicamos qué es cada cosa.
      </AppText>

      {data.vehicles.length > 1 ? (
        <Field label="¿De qué vehículo es?">
          <View style={styles.chips}>
            {data.vehicles.map((v) => (
              <Chip
                key={v.id}
                label={v.nickname || vehicleTitle(v)}
                icon={v.type === 'moto' ? 'motorbike' : 'car-side'}
                color={v.color}
                selected={v.id === vehicleId}
                onPress={() => setVehicleId(v.id)}
              />
            ))}
          </View>
        </Field>
      ) : null}

      {photo ? (
        <Image source={{ uri: photo.uri }} style={[styles.preview, { backgroundColor: theme.cardAlt }]} contentFit="contain" />
      ) : (
        <Card tone="alt" style={styles.placeholder}>
          <IconCircle icon="camera-document" color={theme.primary} background={theme.primarySoft} size={64} />
          <AppText variant="small" muted center>
            Consejo: buena luz, la hoja completa y sin sombras.
          </AppText>
        </Card>
      )}

      <View style={styles.row}>
        <Button title="Tomar foto" icon="camera" variant={photo ? 'secondary' : 'primary'} style={styles.flex} onPress={() => choose('camara')} />
        <Button title="Galería" icon="image-multiple" variant="secondary" style={styles.flex} onPress={() => choose('galeria')} />
      </View>

      {photo && !result && !loading ? (
        <Button title={vehicle ? 'Analizar factura' : 'Elige el vehículo'} icon="creation" size="lg" disabled={!vehicle} onPress={analyze} style={styles.analyze} />
      ) : null}

      {loading ? <LoadingMessage /> : null}
      {error ? (
        <View style={styles.analyze}>
          <InfoBox tone="danger" icon="alert-circle-outline" text={error} />
        </View>
      ) : null}

      {result ? (
        <>
          {!result.legible ? (
            <View style={styles.analyze}>
              <InfoBox tone="warning" icon="image-off-outline" title="No pudimos leerla bien" text="Intenta con otra foto más clara o registra el servicio a mano." />
            </View>
          ) : null}

          <SectionHeader title="Esto fue lo que te hicieron" />
          <Card>
            <SimpleMarkdown text={result.resumen} />
          </Card>

          <View style={styles.facts}>
            <Card tone="alt" style={styles.fact}>
              <AppText variant="caption">Fecha</AppText>
              <AppText variant="bodyStrong">{result.fecha && isValidISODate(result.fecha) ? formatDate(result.fecha) : '—'}</AppText>
            </Card>
            <Card tone="alt" style={styles.fact}>
              <AppText variant="caption">Kilometraje</AppText>
              <AppText variant="bodyStrong">{result.kilometraje != null ? formatDistance(result.kilometraje, settings.distanceUnit) : '—'}</AppText>
            </Card>
            <Card tone="alt" style={styles.fact}>
              <AppText variant="caption">Total</AppText>
              <AppText variant="bodyStrong">{result.total != null ? formatMoney(result.total, settings.currency) : '—'}</AppText>
            </Card>
          </View>
          {result.taller || result.mecanico ? (
            <AppText muted style={styles.who}>
              👨‍🔧 {[result.mecanico, result.taller].filter(Boolean).join(' · ')}
            </AppText>
          ) : null}

          {result.trabajos.map((t, i) => {
            const c = getCategory(t.categoria);
            return (
              <Card key={`${t.categoria}-${i}`} style={styles.item}>
                <View style={styles.itemTop}>
                  <IconCircle icon={c.icon} color={theme.primary} background={theme.primarySoft} size={40} />
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{c.name}</AppText>
                    {t.detalle ? <AppText variant="caption">{t.detalle}</AppText> : null}
                  </View>
                  {t.costo != null ? <AppText variant="smallStrong">{formatMoney(t.costo, settings.currency)}</AppText> : null}
                </View>
                <AppText variant="small">💡 {t.explicacion}</AppText>
              </Card>
            );
          })}

          {result.dudas.length > 0 ? (
            <>
              <SectionHeader title="Vale la pena preguntar" />
              <Card tone="alt">
                <Bullets items={result.dudas} color={theme.accent} />
              </Card>
            </>
          ) : null}

          <View style={styles.actions}>
            <Button title="Revisar y guardar en la bitácora" icon="content-save" size="lg" disabled={result.trabajos.length === 0} onPress={saveResult} />
            <Button title="Analizar otra foto" variant="ghost" onPress={() => { setPhoto(null); setResult(null); }} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xl },
  emoji: { fontSize: 52, lineHeight: 62 },
  intro: { marginTop: 4, marginBottom: Spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  preview: { width: '100%', height: 320, borderRadius: Radius.lg, marginBottom: Spacing.md },
  placeholder: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
  analyze: { marginTop: Spacing.lg },
  loading: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg, paddingVertical: Spacing.xl },
  facts: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  fact: { flex: 1, padding: Spacing.md },
  who: { marginTop: Spacing.md },
  item: { marginTop: Spacing.md, gap: Spacing.sm },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  actions: { gap: Spacing.sm, marginTop: Spacing.xl },
});
