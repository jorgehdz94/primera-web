import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Platform, type ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store';

function tabIcon(name: IconName, focusedName: IconName = name) {
  function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Icon name={focused ? focusedName : name} color={color} size={size} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const theme = useTheme();
  const onboarded = useStore((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/bienvenida" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          ...(Platform.OS === 'web' ? { height: 62, paddingTop: 4, paddingBottom: 6 } : null),
        },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11, lineHeight: 14 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Garaje', tabBarIcon: tabIcon('garage-variant', 'garage-variant') }} />
      <Tabs.Screen name="bitacora" options={{ title: 'Bitácora', tabBarIcon: tabIcon('notebook-outline', 'notebook') }} />
      <Tabs.Screen name="aprende" options={{ title: 'Aprende', tabBarIcon: tabIcon('lightbulb-on-outline', 'lightbulb-on') }} />
      <Tabs.Screen name="talleres" options={{ title: 'Talleres', tabBarIcon: tabIcon('store-outline', 'store') }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: tabIcon('cog-outline', 'cog') }} />
    </Tabs>
  );
}
