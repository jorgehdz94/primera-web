import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useSettings } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { formatDate } from '@/logic/dates';
import { formatDistance, formatMoney, vehicleTitle } from '@/logic/format';
import { STATUS_LABELS, statusHeadline, type PlanStatus, type PlanStatusKind } from '@/logic/maintenance';
import { serviceTotal } from '@/logic/stats';
import { haptic } from '@/services/feedback';
import type { ServiceRecord, Vehicle, Workshop } from '@/types';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Card, IconCircle, Pill, ProgressBar, toneColors, type Tone } from './ui';

export function statusTone(status: PlanStatusKind): Tone {
  switch (status) {
    case 'vencido':
      return 'danger';
    case 'pronto':
      return 'warning';
    case 'ok':
      return 'success';
    default:
      return 'neutral';
  }
}

export function vehicleIcon(v: Pick<Vehicle, 'type'>): IconName {
  return v.type === 'moto' ? 'motorbike' : 'car-side';
}

export function VehicleAvatar({ vehicle, size = 52 }: { vehicle: Pick<Vehicle, 'type' | 'color'>; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: `${vehicle.color}22` }]}>
      <Icon name={vehicleIcon(vehicle)} size={size * 0.58} color={vehicle.color} />
    </View>
  );
}

export function VehicleChip({ vehicle }: { vehicle: Vehicle }) {
  return (
    <View style={[styles.vehicleChip, { backgroundColor: `${vehicle.color}1F` }]}>
      <Icon name={vehicleIcon(vehicle)} size={14} color={vehicle.color} />
      <AppText variant="caption" color={vehicle.color} style={styles.bold} numberOfLines={1}>
        {vehicle.nickname || vehicleTitle(vehicle)}
      </AppText>
    </View>
  );
}

/** Fila con el estado de un mantenimiento: icono, nombre, cuánto falta y barra de progreso. */
export function PlanStatusRow({ status, onPress, compact }: { status: PlanStatus; onPress?: () => void; compact?: boolean }) {
  const theme = useTheme();
  const settings = useSettings();
  const tone = statusTone(status.status);
  const c = toneColors(tone, theme);
  const content = (
    <View style={styles.statusRow}>
      <IconCircle icon={status.category.icon} color={c.fg} background={c.bg} size={compact ? 38 : 44} />
      <View style={styles.flex}>
        <View style={styles.statusTop}>
          <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>
            {status.label}
          </AppText>
          <Pill label={STATUS_LABELS[status.status]} tone={tone} />
        </View>
        <AppText variant="small" muted numberOfLines={2}>
          {statusHeadline(status, settings.distanceUnit)}
        </AppText>
        {status.status !== 'sin_datos' && status.status !== 'desactivado' ? (
          <View style={styles.progress}>
            <ProgressBar value={status.progress} color={c.fg} height={6} />
          </View>
        ) : null}
      </View>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

export function workshopLabel(service: ServiceRecord, workshops: Workshop[]): string | undefined {
  return workshops.find((w) => w.id === service.workshopId)?.name ?? service.workshopName;
}

/** Tarjeta de un servicio en la bitácora. */
export function ServiceCard({
  service,
  vehicle,
  workshops,
  showVehicle,
}: {
  service: ServiceRecord;
  vehicle?: Vehicle;
  workshops: Workshop[];
  showVehicle?: boolean;
}) {
  const theme = useTheme();
  const settings = useSettings();
  const first = getCategory(service.items[0]?.categoryId ?? 'otro');
  const names = service.items.map((i) => getCategory(i.categoryId).name);
  const shop = workshopLabel(service, workshops);
  const who = [service.mechanic, shop].filter(Boolean).join(' · ');
  const total = serviceTotal(service);
  return (
    <Card onPress={() => router.push(`/servicio/${service.id}`)} style={styles.serviceCard}>
      <View style={styles.serviceRow}>
        <IconCircle icon={first.icon} color={theme.primary} background={theme.primarySoft} size={44} />
        <View style={styles.flex}>
          <View style={styles.serviceTop}>
            <AppText variant="caption" style={styles.flex}>
              {formatDate(service.date)}
              {service.km !== undefined ? ` · ${formatDistance(service.km, settings.distanceUnit)}` : ''}
            </AppText>
            {total > 0 ? <AppText variant="smallStrong">{formatMoney(total, settings.currency)}</AppText> : null}
          </View>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {names.slice(0, 3).join(', ')}
            {names.length > 3 ? ` y ${names.length - 3} más` : ''}
          </AppText>
          {who ? (
            <View style={styles.who}>
              <Icon name="account-wrench" size={14} color={theme.textMuted} />
              <AppText variant="caption" numberOfLines={1} style={styles.flex}>
                {who}
              </AppText>
            </View>
          ) : null}
          {showVehicle && vehicle ? (
            <View style={styles.vehicleChipWrap}>
              <VehicleChip vehicle={vehicle} />
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

/** Tarjeta expandible: muestra el título y al tocar despliega el contenido. */
export function Expandable({
  title,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  right,
  children,
  initiallyOpen = false,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  iconBackground?: string;
  right?: ReactNode;
  children: ReactNode;
  initiallyOpen?: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <Card padded={false} style={styles.expandable}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          haptic('selection');
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((o) => !o);
        }}
        style={styles.expandHeader}>
        {icon ? (
          <IconCircle icon={icon} color={iconColor ?? theme.primary} background={iconBackground ?? theme.primarySoft} size={40} />
        ) : null}
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{title}</AppText>
          {subtitle ? (
            <AppText variant="small" muted numberOfLines={open ? undefined : 2}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right}
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={22} color={theme.textMuted} />
      </Pressable>
      {open ? <View style={[styles.expandBody, { borderTopColor: theme.border }]}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
    maxWidth: 200,
  },
  bold: { fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', paddingVertical: Spacing.sm },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progress: { marginTop: 6 },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  serviceCard: { marginBottom: Spacing.md },
  serviceRow: { flexDirection: 'row', gap: Spacing.md },
  serviceTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  who: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  vehicleChipWrap: { marginTop: 6 },
  expandable: { marginBottom: Spacing.md, overflow: 'hidden' },
  expandHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  expandBody: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.md },
});
