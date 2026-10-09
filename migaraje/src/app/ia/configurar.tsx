import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { TextField } from '@/components/Form';
import { Screen } from '@/components/Screen';
import { Bullets, Button, Card, InfoBox, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { deleteApiKey, friendlyAIError, getApiKey, saveApiKey, testApiKey } from '@/services/ai';
import { confirm, haptic, toast } from '@/services/feedback';

function maskKey(key: string): string {
  return key.length > 12 ? `${key.slice(0, 7)}…${key.slice(-4)}` : '••••';
}

export default function AISetupScreen() {
  const theme = useTheme();
  const [stored, setStored] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      getApiKey()
        .then(setStored)
        .catch(() => setStored(null));
    }, []),
  );

  const save = async () => {
    const key = value.trim();
    if (!key) return;
    setBusy(true);
    setMessage(null);
    try {
      await saveApiKey(key);
      await testApiKey();
      setStored(key);
      setValue('');
      haptic('success');
      toast('¡Asistente activado!', '🤖');
      setMessage({ ok: true, text: 'La clave funciona. Ya puedes escanear facturas y hacer preguntas.' });
    } catch (e) {
      setMessage({ ok: false, text: friendlyAIError(e) });
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await testApiKey();
      setMessage({ ok: true, text: 'Todo bien: el asistente responde.' });
    } catch (e) {
      setMessage({ ok: false, text: friendlyAIError(e) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await confirm('¿Quitar la clave?', 'El asistente dejará de funcionar hasta que pongas otra.', 'Quitar', true))) return;
    await deleteApiKey();
    setStored(null);
    setMessage(null);
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText style={styles.emoji}>🤖</AppText>
        <AppText variant="title" center>
          Tu mecánico de confianza, con IA
        </AppText>
        <AppText muted center>
          Es opcional. Toda la app funciona sin esto; el asistente agrega:
        </AppText>
      </View>
      <Card>
        <Bullets
          items={[
            'Le tomas foto a la factura del taller y llena el registro por ti.',
            'Te explica cada trabajo en palabras sencillas y si parece razonable según tu historial.',
            'Le puedes preguntar lo que quieras sobre tu carro o moto.',
          ]}
        />
      </Card>

      <SectionHeader title="Cómo activarlo" />
      <Card style={styles.gap}>
        <AppText>
          1. Crea una cuenta en la consola de Anthropic (la empresa que hace Claude) y genera una clave de API.
        </AppText>
        <Button title="Abrir consola de Anthropic" icon="open-in-new" variant="secondary" onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')} />
        <AppText>2. Pega aquí tu clave (empieza con «sk-ant-»).</AppText>
        {stored ? (
          <InfoBox tone="success" icon="key-variant" title="Clave guardada" text={maskKey(stored)} />
        ) : null}
        <TextField
          value={value}
          onChangeText={setValue}
          placeholder={stored ? 'Pegar una clave nueva' : 'sk-ant-…'}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          icon="key-variant"
        />
        <Button title="Guardar y probar" icon="check" loading={busy} disabled={!value.trim()} onPress={save} />
        {stored ? (
          <View style={styles.row}>
            <Button title="Probar" variant="secondary" icon="lan-connect" style={styles.flex} disabled={busy} onPress={test} />
            <Button title="Quitar clave" variant="danger" icon="delete-outline" style={styles.flex} onPress={remove} />
          </View>
        ) : null}
        {message ? (
          <InfoBox tone={message.ok ? 'success' : 'danger'} icon={message.ok ? 'check-circle-outline' : 'alert-circle-outline'} text={message.text} />
        ) : null}
      </Card>

      <SectionHeader title="Privacidad y costos" />
      <Card style={styles.gap}>
        <AppText variant="small">
          🔐 Tu clave se guarda cifrada solo en este teléfono. Nunca la enviamos a ningún otro lado.
        </AppText>
        <AppText variant="small">
          📤 Solo cuando usas el asistente se envían a Anthropic la foto o los datos del servicio que estás consultando.
        </AppText>
        <AppText variant="small">
          💳 Anthropic cobra a tu cuenta por cada consulta (normalmente unos centavos de dólar por factura). Puedes poner un límite de gasto en su consola.
        </AppText>
      </Card>

      {stored ? (
        <View style={styles.actions}>
          <Button title="Escanear una factura" icon="camera-document" onPress={() => router.replace('/ia/escanear')} />
          <Button title="Hacer una pregunta" icon="chat-question-outline" variant="secondary" onPress={() => router.replace('/ia/chat')} />
        </View>
      ) : null}
      <AppText variant="caption" center color={theme.textMuted} style={styles.note}>
        Las respuestas de la IA pueden equivocarse. Para decisiones importantes, confirma con un mecánico.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  emoji: { fontSize: 56, lineHeight: 66 },
  gap: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
  actions: { gap: Spacing.sm, marginTop: Spacing.xl },
  note: { marginTop: Spacing.lg },
});
