import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { TextField } from '@/components/Form';
import { Icon, type IconName } from '@/components/Icon';
import { Screen, TabHeader } from '@/components/Screen';
import { Card, ListRow, SectionHeader } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { CATEGORIES, GROUP_LABELS, type CategoryGroup, type ServiceCategory } from '@/data/categories';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/services/feedback';

interface Topic {
  emoji: string;
  title: string;
  text: string;
  href: Href;
  color: string;
  icon: IconName;
}

const TOPICS: Topic[] = [
  {
    emoji: '🩺',
    title: '¿Qué le pasa a mi vehículo?',
    text: 'Elige el síntoma y te decimos qué puede ser y qué tan urgente es.',
    href: '/guia/sintomas',
    color: '#16A34A',
    icon: 'stethoscope',
  },
  {
    emoji: '🚨',
    title: 'Luces del tablero',
    text: 'Qué significa cada testigo y si puedes seguir manejando.',
    href: '/guia/luces',
    color: '#DC2626',
    icon: 'car-info',
  },
  {
    emoji: '💧',
    title: 'Detector de fugas',
    text: '¿Una mancha debajo? Toca su color y descubre qué líquido es.',
    href: '/guia/fugas',
    color: '#2463EB',
    icon: 'water-alert',
  },
  {
    emoji: '🧰',
    title: 'Tips para ir al taller',
    text: 'Cómo pedir presupuestos, qué preguntar y cómo evitar cobros de más.',
    href: '/guia/consejos',
    color: '#CA8A04',
    icon: 'account-hard-hat',
  },
  {
    emoji: '📖',
    title: 'Glosario del taller',
    text: '¿Rótulas? ¿Homocinética? Palabras de mecánico explicadas fácil.',
    href: '/guia/glosario',
    color: '#9333EA',
    icon: 'book-open-variant',
  },
  {
    emoji: '🤖',
    title: 'Pregúntale al mecánico (IA)',
    text: 'Haz cualquier pregunta sobre tu carro o moto y recibe una respuesta clara.',
    href: '/ia/chat',
    color: '#0891B2',
    icon: 'robot-outline',
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function LearnScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = normalize(query.trim());
    const list = CATEGORIES.filter((c) => c.id !== 'otro').filter(
      (c) => !q || normalize(`${c.name} ${c.what} ${c.why}`).includes(q),
    );
    const map = new Map<CategoryGroup, ServiceCategory[]>();
    for (const c of list) map.set(c.group, [...(map.get(c.group) ?? []), c]);
    return [...map.entries()];
  }, [query]);

  return (
    <Screen safeTop>
      <TabHeader subtitle="Entiende tu vehículo" title="Aprende" />

      <View style={styles.grid}>
        {TOPICS.map((t) => (
          <Pressable
            key={t.title}
            accessibilityRole="button"
            onPress={() => {
              haptic('selection');
              router.push(t.href);
            }}
            style={({ pressed }) => [
              styles.topic,
              { backgroundColor: theme.card, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.topicIcon, { backgroundColor: `${t.color}1F` }]}>
              <Icon name={t.icon} size={26} color={t.color} />
            </View>
            <AppText variant="subheading">{t.title}</AppText>
            <AppText variant="caption">{t.text}</AppText>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Guía de servicios" />
      <AppText muted style={styles.intro}>
        Qué es cada trabajo, por qué se hace, cada cuándo toca y qué preguntarle al mecánico.
      </AppText>
      <TextField value={query} onChangeText={setQuery} placeholder="Buscar: bujías, clutch, anticongelante…" icon="magnify" autoCorrect={false} />

      {groups.map(([group, cats]) => (
        <View key={group} style={styles.group}>
          <AppText variant="overline" style={styles.groupTitle}>
            {GROUP_LABELS[group]}
          </AppText>
          <Card padded={false} style={styles.groupCard}>
            {cats.map((c, i) => (
              <View key={c.id} style={i > 0 ? [styles.separator, { borderTopColor: theme.border }] : undefined}>
                <ListRow
                  title={c.name}
                  subtitle={c.what}
                  subtitleLines={2}
                  icon={c.icon}
                  onPress={() => router.push(`/guia/servicio/${c.id}`)}
                />
              </View>
            ))}
          </Card>
        </View>
      ))}
      {groups.length === 0 ? (
        <AppText muted center>
          No encontramos ese tema. Prueba con otra palabra o usa el glosario.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  topic: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: 6,
  },
  topicIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  pressed: { opacity: 0.8 },
  intro: { marginBottom: Spacing.md },
  group: { marginBottom: Spacing.md },
  groupTitle: { marginBottom: Spacing.sm },
  groupCard: { paddingHorizontal: Spacing.lg },
  separator: { borderTopWidth: StyleSheet.hairlineWidth },
});
