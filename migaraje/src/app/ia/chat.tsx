import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { SimpleMarkdown } from '@/components/SimpleMarkdown';
import { Button, InfoBox } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAllOverviews, useSettings } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { askAssistant, friendlyAIError, getApiKey, historyContext, vehicleContext, type ChatTurn } from '@/services/ai';
import { haptic } from '@/services/feedback';

const SUGGESTIONS = [
  '¿Cada cuándo debo cambiar el aceite de mi vehículo?',
  'Me chillan los frenos, ¿qué puede ser?',
  '¿Qué revisar antes de un viaje largo?',
  'El taller me recomienda cambiar amortiguadores, ¿cómo sé si es necesario?',
];

export default function ChatScreen() {
  const params = useLocalSearchParams<{ pregunta?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const overviews = useAllOverviews();
  const scrollRef = useRef<ScrollView>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState(params.pregunta ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getApiKey()
        .then((k) => setHasKey(!!k))
        .catch(() => setHasKey(false));
    }, []),
  );

  const context = useMemo(() => {
    if (overviews.length === 0) return 'El usuario todavía no ha registrado vehículos.';
    return overviews
      .map((o) => `${vehicleContext(o.vehicle, settings, o.odo.estimatedKm)}\nHistorial:\n${historyContext(o.services, settings, 10)}`)
      .join('\n\n');
  }, [overviews, settings]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    haptic('light');
    const next: ChatTurn[] = [...turns, { role: 'user', text: question }];
    setTurns(next);
    setInput('');
    setLoading(true);
    setError(null);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const answer = await askAssistant(next, context);
      setTurns([...next, { role: 'assistant', text: answer }]);
    } catch (e) {
      setError(friendlyAIError(e));
      setTurns(turns);
      setInput(question);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (hasKey === false) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: theme.background }]}>
        <AppText style={styles.emoji}>🤖</AppText>
        <AppText variant="title" center>
          Pregúntale al mecánico
        </AppText>
        <AppText muted center style={styles.centerText}>
          Haz preguntas sobre tu carro o moto y recibe respuestas claras, tomando en cuenta tu historial. Para usarlo, activa el asistente (es opcional).
        </AppText>
        <Button title="Activar asistente" icon="robot-outline" onPress={() => router.push('/ia/configurar')} />
        <Button title="Mejor ver la guía de síntomas" variant="ghost" onPress={() => router.replace('/guia/sintomas')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          {turns.length === 0 ? (
            <View style={styles.welcome}>
              <AppText style={styles.emoji}>👨‍🔧</AppText>
              <AppText variant="heading" center>
                ¿En qué te ayudo?
              </AppText>
              <AppText muted center>
                Conozco tus vehículos y su historial. Pregúntame lo que quieras, sin pena.
              </AppText>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <Chip key={s} label={s} onPress={() => send(s)} />
                ))}
              </View>
            </View>
          ) : null}
          {turns.map((t, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                t.role === 'user'
                  ? [styles.userBubble, { backgroundColor: theme.primary }]
                  : [styles.botBubble, { backgroundColor: theme.card, borderColor: theme.border }],
              ]}>
              {t.role === 'user' ? (
                <AppText color="#FFFFFF">{t.text}</AppText>
              ) : (
                <SimpleMarkdown text={t.text} />
              )}
            </View>
          ))}
          {loading ? (
            <View style={[styles.bubble, styles.botBubble, styles.typing, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ActivityIndicator color={theme.primary} />
              <AppText muted>Pensando…</AppText>
            </View>
          ) : null}
          {error ? <InfoBox tone="danger" icon="alert-circle-outline" text={error} /> : null}
        </View>
      </ScrollView>
      <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
        <View style={[styles.inner, styles.inputRow]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escribe tu pregunta…"
            placeholderTextColor={theme.textMuted}
            multiline
            style={[styles.input, { color: theme.text, backgroundColor: theme.cardAlt }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            disabled={!input.trim() || loading}
            onPress={() => send(input)}
            style={[styles.send, { backgroundColor: input.trim() && !loading ? theme.primary : theme.border }]}>
            <Icon name="send" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <AppText variant="caption" center style={styles.disclaimer}>
          La IA puede equivocarse. Confirma lo importante con un mecánico.
        </AppText>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  centerText: { maxWidth: 420 },
  emoji: { fontSize: 52, lineHeight: 62 },
  messages: { padding: Spacing.lg, flexGrow: 1 },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.md },
  welcome: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl },
  suggestions: { gap: Spacing.sm, marginTop: Spacing.md, alignItems: 'center' },
  bubble: { padding: Spacing.md, borderRadius: Radius.lg, maxWidth: '88%' },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  botBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: StyleSheet.hairlineWidth },
  typing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inputBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, paddingHorizontal: Spacing.lg, paddingTop: 12, paddingBottom: 12, fontSize: 16 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { marginTop: 4 },
});
