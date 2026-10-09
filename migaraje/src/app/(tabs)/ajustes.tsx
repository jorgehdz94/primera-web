import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip, Field, Segmented, SwitchRow, TextField } from '@/components/Form';
import { Screen, TabHeader } from '@/components/Screen';
import { Button, Card, Divider, InfoBox, ListRow, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { getApiKey } from '@/services/ai';
import { confirm, showMessage, toast } from '@/services/feedback';
import { pickBackup, shareBackup } from '@/services/files';
import { notificationsSupported, requestNotificationPermission, sendTestNotification } from '@/services/notifications';
import { deletePhotos } from '@/services/photos';
import { useStore } from '@/store';
import type { DistanceUnit, OdometerReminder, ThemePreference } from '@/types';

const CURRENCIES = ['$', 'Q', 'S/', 'Bs', '€', '₡', 'L', 'C$', 'RD$', 'Gs'];
const HOURS = [7, 8, 9, 10, 12, 18, 20];

export default function SettingsScreen() {
  const theme = useTheme();
  const data = useAppData();
  const { settings } = data;
  const updateSettings = useStore((s) => s.updateSettings);
  const setDistanceUnit = useStore((s) => s.setDistanceUnit);
  const importData = useStore((s) => s.importData);
  const loadDemo = useStore((s) => s.loadDemo);
  const resetAll = useStore((s) => s.resetAll);
  const [name, setName] = useState(settings.userName);
  const [hasKey, setHasKey] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getApiKey()
        .then((k) => setHasKey(!!k))
        .catch(() => setHasKey(false));
    }, []),
  );

  const changeUnit = async (unit: DistanceUnit) => {
    if (unit === settings.distanceUnit) return;
    const hasData = data.vehicles.length > 0;
    if (hasData) {
      const ok = await confirm(
        unit === 'mi' ? '¿Cambiar a millas?' : '¿Cambiar a kilómetros?',
        'Convertiremos todos tus kilometrajes, intervalos y recordatorios a la nueva unidad.',
        'Cambiar',
      );
      if (!ok) return;
    }
    setDistanceUnit(unit);
    toast(unit === 'mi' ? 'Ahora usas millas' : 'Ahora usas kilómetros');
  };

  const toggleNotifications = async (value: boolean) => {
    if (value && notificationsSupported) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showMessage(
          'Permiso necesario',
          'Para recibir recordatorios, permite las notificaciones de MiGaraje en los ajustes de tu teléfono.',
        );
        return;
      }
    }
    updateSettings({ notificationsEnabled: value });
  };

  const doExport = async () => {
    setBusy('export');
    try {
      await shareBackup(data);
    } catch (e) {
      showMessage('No se pudo exportar', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    setBusy('import');
    try {
      const imported = await pickBackup();
      if (!imported) return;
      const ok = await confirm(
        '¿Restaurar este respaldo?',
        `Contiene ${imported.vehicles.length} vehículo(s) y ${imported.services.length} servicio(s). Reemplazará los datos actuales de la app.`,
        'Restaurar',
        true,
      );
      if (!ok) return;
      importData(imported);
      toast('Respaldo restaurado');
    } catch (e) {
      showMessage('No se pudo importar', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  };

  const doReset = async () => {
    const ok = await confirm(
      '¿Borrar todos los datos?',
      'Se eliminarán vehículos, servicios, talleres y fotos de esta app. Te recomendamos exportar un respaldo antes. Esta acción no se puede deshacer.',
      'Borrar todo',
      true,
    );
    if (!ok) return;
    deletePhotos(data.services.flatMap((s) => s.photos));
    resetAll();
  };

  return (
    <Screen safeTop>
      <TabHeader subtitle="MiGaraje" title="Ajustes" />

      <Card>
        <TextField
          label="¿Cómo te llamas?"
          value={name}
          onChangeText={setName}
          onBlur={() => updateSettings({ userName: name.trim() })}
          onSubmitEditing={() => updateSettings({ userName: name.trim() })}
          placeholder="Tu nombre"
          returnKeyType="done"
          hint="Para saludarte en la pantalla de inicio."
        />
        <Field label="Apariencia">
          <Segmented<ThemePreference>
            value={settings.theme}
            onChange={(v) => updateSettings({ theme: v })}
            options={[
              { value: 'system', label: 'Automático', icon: 'theme-light-dark' },
              { value: 'light', label: 'Claro', icon: 'white-balance-sunny' },
              { value: 'dark', label: 'Oscuro', icon: 'weather-night' },
            ]}
          />
        </Field>
        <Field label="Distancia">
          <Segmented<DistanceUnit>
            value={settings.distanceUnit}
            onChange={changeUnit}
            options={[
              { value: 'km', label: 'Kilómetros' },
              { value: 'mi', label: 'Millas' },
            ]}
          />
        </Field>
        <Field label="Moneda">
          <View style={styles.chips}>
            {CURRENCIES.map((c) => (
              <Chip key={c} label={c} selected={settings.currency === c} onPress={() => updateSettings({ currency: c })} />
            ))}
          </View>
        </Field>
      </Card>

      <SectionHeader title="Recordatorios" />
      <Card>
        {!notificationsSupported ? (
          <InfoBox tone="warning" icon="cellphone-cog" text="Las notificaciones funcionan en la app de iPhone y Android. En la versión web solo verás los avisos dentro de la app." />
        ) : null}
        <SwitchRow
          icon="bell-ring-outline"
          label="Avisarme de mantenimientos"
          hint="Una semana antes y el día que toca, además de documentos por vencer."
          value={settings.notificationsEnabled}
          onChange={toggleNotifications}
        />
        <Divider />
        <Field label="Hora de los avisos">
          <View style={styles.chips}>
            {HOURS.map((h) => (
              <Chip key={h} label={`${h}:00`} selected={settings.notifyHour === h} onPress={() => updateSettings({ notifyHour: h })} />
            ))}
          </View>
        </Field>
        <Field
          label="Recordarme actualizar el kilometraje"
          hint="Con el kilometraje al día calculamos mejor cuándo te toca cada servicio.">
          <Segmented<OdometerReminder>
            value={settings.odometerReminder}
            onChange={(v) => updateSettings({ odometerReminder: v })}
            options={[
              { value: 'semanal', label: 'Semanal' },
              { value: 'mensual', label: 'Mensual' },
              { value: 'nunca', label: 'Nunca' },
            ]}
          />
        </Field>
        {notificationsSupported ? (
          <Button
            title="Probar notificación"
            icon="bell-check-outline"
            variant="secondary"
            onPress={async () => {
              const ok = await sendTestNotification();
              if (ok) toast('Llegará en unos segundos', '🔔');
              else showMessage('Permiso necesario', 'Activa las notificaciones de MiGaraje en los ajustes de tu teléfono.');
            }}
          />
        ) : null}
      </Card>

      <SectionHeader title="Asistente con IA" />
      <Card padded={false} style={styles.listCard}>
        <ListRow
          icon="robot-outline"
          iconColor="#9333EA"
          iconBackground="#9333EA1F"
          title={hasKey ? 'Asistente activado' : 'Activar asistente (opcional)'}
          subtitle={
            hasKey
              ? 'Puedes escanear facturas, pedir explicaciones y hacer preguntas.'
              : 'Lee tus facturas con la cámara y te explica todo en palabras sencillas.'
          }
          onPress={() => router.push('/ia/configurar')}
        />
      </Card>

      <SectionHeader title="Tus datos" />
      <Card>
        <AppText variant="small" muted style={styles.dataText}>
          Todo se guarda solo en tu teléfono. Exporta un respaldo de vez en cuando (por ejemplo a tu correo o a la nube) para no perder tu historial si cambias de teléfono. Las fotos no se incluyen en el respaldo.
        </AppText>
        <View style={styles.buttons}>
          <Button title="Exportar respaldo" icon="database-export" variant="secondary" loading={busy === 'export'} onPress={doExport} />
          <Button title="Restaurar respaldo" icon="database-import" variant="secondary" loading={busy === 'import'} onPress={doImport} />
          <Button
            title="Cargar datos de ejemplo"
            icon="eye-outline"
            variant="ghost"
            onPress={async () => {
              const ok = await confirm('¿Cargar datos de ejemplo?', 'Se agregarán un carro y una moto de ejemplo con su historial. Puedes borrarlos cuando quieras.', 'Cargar');
              if (ok) {
                loadDemo();
                toast('Datos de ejemplo cargados', '🚗');
              }
            }}
          />
          <Button title="Borrar todos los datos" icon="delete-outline" variant="danger" onPress={doReset} />
        </View>
      </Card>

      <View style={styles.about}>
        <AppText variant="caption" center>
          MiGaraje v{Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
        <AppText variant="caption" center color={theme.textMuted}>
          Hecho para que entiendas qué le hacen a tu vehículo y por qué. 🧡
        </AppText>
        <AppText variant="caption" center color={theme.textMuted}>
          La información es una guía general: siempre manda el manual de tu vehículo.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  listCard: { paddingHorizontal: Spacing.lg },
  dataText: { marginBottom: Spacing.md },
  buttons: { gap: Spacing.sm },
  about: { marginTop: Spacing.xl, gap: 4 },
});
