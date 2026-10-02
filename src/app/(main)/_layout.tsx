import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../store/auth';
import { Icon, IconName } from '../../ui/Icon';
import { colors } from '../../theme/colors';
export default function MainLayout() {
  const { ready, me, can, loginRoute } = useAuth();
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.accent}/></View>;
  if (!me) return <Redirect href={loginRoute ?? '/'}/>;
  const icon = (name: IconName) => function TabIcon({ color }: { color: unknown }) { return <Icon name={name} color={String(color)}/>; };
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 58 }, tabBarLabelStyle: { fontWeight: '600', fontSize: 11 } }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('grid') }}/>
    <Tabs.Screen name="pos" options={{ title: 'POS', tabBarIcon: icon('menu'), href: can('CREATE_ORDER') ? undefined : null }}/>
    <Tabs.Screen name="tables" options={{ title: 'Tables', tabBarIcon: icon('table'), href: can('VIEW_TABLES') ? undefined : null }}/>
    <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: icon('order'), href: can('VIEW_ORDER') ? undefined : null }}/>
    <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('more') }}/>
  </Tabs>;
}
