const light = {
  background: '#F4F5F7',
  card: '#FFFFFF',
  cardAlt: '#EEF0F3',
  text: '#151821',
  textMuted: '#5D6472',
  border: '#E1E4EA',
  primary: '#EE6A1F',
  primaryText: '#FFFFFF',
  primarySoft: '#FFE9DB',
  accent: '#2463EB',
  accentSoft: '#E2EBFF',
  success: '#15803D',
  successSoft: '#DCFCE7',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#0369A1',
  infoSoft: '#E0F2FE',
  tabBar: '#FFFFFF',
  overlay: 'rgba(10, 12, 16, 0.45)',
  shadow: '#0B1220',
};

export type ThemeColors = typeof light;

const dark: ThemeColors = {
  background: '#0D1015',
  card: '#171B22',
  cardAlt: '#20252E',
  text: '#F2F4F7',
  textMuted: '#9BA3B1',
  border: '#2A303B',
  primary: '#FF7A30',
  primaryText: '#FFFFFF',
  primarySoft: '#3B2415',
  accent: '#6EA2FF',
  accentSoft: '#1A2742',
  success: '#34D399',
  successSoft: '#11291F',
  warning: '#FBBF24',
  warningSoft: '#33270C',
  danger: '#F87171',
  dangerSoft: '#3A1818',
  info: '#38BDF8',
  infoSoft: '#0E2735',
  tabBar: '#12161C',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};

export const Colors = { light, dark };

/** Colores para distinguir cada vehículo. */
export const VEHICLE_COLORS = ['#EE6A1F', '#2463EB', '#16A34A', '#9333EA', '#DC2626', '#0891B2', '#CA8A04', '#475569'];

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const MaxContentWidth = 720;
