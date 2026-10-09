import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TextField } from '@/components/Form';
import { Icon, type IconName } from '@/components/Icon';
import { Button } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/services/feedback';
import { notificationsSupported, requestNotificationPermission } from '@/services/notifications';
import { useStore } from '@/store';

interface Slide {
  icon: IconName;
  color: string;
  title: string;
  text: string;
  bullets: string[];
}

const SLIDES: Slide[] = [
  {
    icon: 'notebook-outline',
    color: '#EE6A1F',
    title: 'La bitácora de tu carro o moto',
    text: 'Registra todo lo que le hacen en el taller, no solo el cambio de aceite.',
    bullets: ['Qué le hicieron y cuándo', 'Quién fue el responsable y en qué taller', 'Cuánto costó, fotos de la factura y garantías'],
  },
  {
    icon: 'lightbulb-on-outline',
    color: '#2463EB',
    title: 'Entiende qué te hicieron y por qué',
    text: 'Cada trabajo viene explicado en palabras sencillas.',
    bullets: [
      'Qué es, por qué se hace y qué pasa si no se hace',
      'Te avisamos si algo se hizo antes de tiempo',
      'Preguntas para hacerle al mecánico',
    ],
  },
  {
    icon: 'bell-ring-outline',
    color: '#16A34A',
    title: 'Te recordamos lo importante',
    text: 'Calculamos cuándo te toca cada mantenimiento según tus kilómetros.',
    bullets: ['Cambio de aceite, frenos, llantas y más', 'Seguro, verificación y otros documentos', 'Avisos una semana antes y el día que toca'],
  },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const updateSettings = useStore((s) => s.updateSettings);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const loadDemo = useStore((s) => s.loadDemo);

  const finish = async (next: 'vehiculo' | 'demo' | 'explorar') => {
    haptic('success');
    if (name.trim()) updateSettings({ userName: name.trim() });
    if (notificationsSupported) await requestNotificationPermission().catch(() => false);
    if (next === 'demo') loadDemo();
    completeOnboarding();
    router.replace('/');
    if (next === 'vehiculo') setTimeout(() => router.push('/vehiculo/nuevo'), 50);
  };

  const isLast = step === SLIDES.length;
  const slide = SLIDES[Math.min(step, SLIDES.length - 1)];

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: theme.primary }]}>
            <Icon name="garage-variant" size={22} color="#FFFFFF" />
          </View>
          <AppText variant="heading">MiGaraje</AppText>
        </View>

        {!isLast ? (
          <View style={styles.slide}>
            <View style={[styles.hero, { backgroundColor: `${slide.color}1A` }]}>
              <Icon name={slide.icon} size={88} color={slide.color} />
            </View>
            <AppText variant="display" center>
              {slide.title}
            </AppText>
            <AppText muted center style={styles.text}>
              {slide.text}
            </AppText>
            <View style={styles.bullets}>
              {slide.bullets.map((b) => (
                <View key={b} style={[styles.bullet, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Icon name="check-circle" size={22} color={slide.color} />
                  <AppText style={styles.flex}>{b}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.slide}>
            <View style={[styles.hero, { backgroundColor: theme.primarySoft }]}>
              <AppText style={styles.wave}>👋</AppText>
            </View>
            <AppText variant="display" center>
              ¡Empecemos!
            </AppText>
            <AppText muted center style={styles.text}>
              Agrega tu primer vehículo. Si prefieres, primero explora la app con datos de ejemplo.
            </AppText>
            <View style={styles.nameField}>
              <TextField label="¿Cómo te llamas? (opcional)" value={name} onChangeText={setName} placeholder="Tu nombre" returnKeyType="done" />
            </View>
          </View>
        )}

        <View style={styles.dots}>
          {[...SLIDES, null].map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === step ? theme.primary : theme.border, width: i === step ? 22 : 8 }]} />
          ))}
        </View>

        {!isLast ? (
          <View style={styles.actions}>
            <Button title="Siguiente" size="lg" full onPress={() => setStep((s) => s + 1)} />
            <Button title="Saltar" variant="ghost" onPress={() => setStep(SLIDES.length)} />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button title="Agregar mi vehículo" icon="car-side" size="lg" full onPress={() => finish('vehiculo')} />
            <Button title="Ver con datos de ejemplo" icon="eye-outline" variant="secondary" full onPress={() => finish('demo')} />
            <Button title="Solo quiero explorar" variant="ghost" onPress={() => finish('explorar')} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Spacing.xl },
  inner: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'center' },
  logo: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  hero: { width: 168, height: 168, borderRadius: 84, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  wave: { fontSize: 80, lineHeight: 96 },
  text: { maxWidth: 420 },
  bullets: { alignSelf: 'stretch', gap: Spacing.sm, marginTop: Spacing.md },
  bullet: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
  nameField: { alignSelf: 'stretch', marginTop: Spacing.md },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: Spacing.lg },
  dot: { height: 8, borderRadius: 4 },
  actions: { gap: Spacing.sm, alignItems: 'center' },
});
