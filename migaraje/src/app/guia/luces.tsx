import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Expandable } from '@/components/domain';
import { Chip } from '@/components/Form';
import { Screen } from '@/components/Screen';
import { Card, InfoBox } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { LIGHT_COLOR_INFO, LIGHTS, type LightColor } from '@/data/lights';

const LIGHT_HEX: Record<LightColor, string> = {
  rojo: '#E5383B',
  amarillo: '#F2A30F',
  verde: '#22A35A',
  azul: '#2E6BEA',
};

const CAN_DRIVE = {
  no: { tone: 'danger' as const, text: 'No sigas manejando' },
  con_cuidado: { tone: 'warning' as const, text: 'Puedes seguir con cuidado, llévalo a revisar' },
  si: { tone: 'success' as const, text: 'Puedes seguir manejando' },
};

export default function LightsScreen() {
  const [color, setColor] = useState<LightColor | 'todas'>('todas');
  const list = LIGHTS.filter((l) => color === 'todas' || l.color === color);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Luces del tablero' }} />
      <AppText variant="title">¿Qué significa esa luz?</AppText>
      <AppText muted style={styles.intro}>
        El color te dice qué tan urgente es. Toca una luz para saber qué hacer.
      </AppText>

      <Card style={styles.legend}>
        {(Object.keys(LIGHT_COLOR_INFO) as LightColor[]).map((c) => (
          <View key={c} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: LIGHT_HEX[c] }]} />
            <View style={styles.flex}>
              <AppText variant="smallStrong">{LIGHT_COLOR_INFO[c].label}</AppText>
              <AppText variant="caption">{LIGHT_COLOR_INFO[c].text}</AppText>
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.chips}>
        <Chip label="Todas" selected={color === 'todas'} onPress={() => setColor('todas')} />
        {(Object.keys(LIGHT_HEX) as LightColor[]).map((c) => (
          <Chip key={c} label={LIGHT_COLOR_INFO[c].label.split(' ')[0]} color={LIGHT_HEX[c]} selected={color === c} onPress={() => setColor(c)} />
        ))}
      </View>

      {list.map((l) => (
        <Expandable
          key={l.id}
          title={l.name}
          subtitle={l.moto ? 'En motos' : undefined}
          icon={l.icon}
          iconColor={LIGHT_HEX[l.color]}
          iconBackground={`${LIGHT_HEX[l.color]}22`}>
          <View>
            <AppText variant="overline">Qué significa</AppText>
            <AppText>{l.meaning}</AppText>
          </View>
          <View>
            <AppText variant="overline">Qué hacer</AppText>
            <AppText>{l.action}</AppText>
          </View>
          <InfoBox
            tone={CAN_DRIVE[l.canDrive].tone}
            icon={l.canDrive === 'no' ? 'hand-back-left-outline' : l.canDrive === 'si' ? 'check-circle-outline' : 'alert-circle-outline'}
            text={CAN_DRIVE[l.canDrive].text}
          />
        </Expandable>
      ))}
      <AppText variant="caption" center style={styles.disclaimer}>
        Los símbolos pueden variar entre marcas. Consulta el manual de tu vehículo.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 4, marginBottom: Spacing.lg },
  legend: { gap: Spacing.md, marginBottom: Spacing.lg },
  legendRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  dot: { width: 16, height: 16, borderRadius: 8, marginTop: 2 },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  disclaimer: { marginTop: Spacing.lg },
});
