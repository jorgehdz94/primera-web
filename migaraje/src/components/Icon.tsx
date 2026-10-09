import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Props {
  name: IconName;
  size?: number;
  color: ColorValue;
}

export function Icon({ name, size = 22, color }: Props) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
