import { Tabs } from 'expo-router/js-tabs';
import { useSession } from '../../../auth/AuthContext';
import { TabGlyph } from '../../../components/ui';
import { MODULE_TABS, tabsFor } from '../../../modules';
import { colors } from '../../../theme';

const icon = (glyph) => function TabIcon({ color, focused }) {
  return <TabGlyph glyph={glyph} color={color} focused={focused} />;
};

export default function TabsLayout() {
  const { session } = useSession();
  const { tabs } = tabsFor(session);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('H') }} />
      {Object.entries(MODULE_TABS).map(([name, tab]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ title: tab.title, tabBarIcon: icon(tab.glyph), href: tabs.includes(name) ? undefined : null }}
        />
      ))}
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('≡') }} />
    </Tabs>
  );
}
