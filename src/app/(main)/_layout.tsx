import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../store/auth';
import { Icon, IconName } from '../../ui/Icon';
import { colors } from '../../theme/colors';
export default function MainLayout() {
  const { ready, me, can, loginRoute } = useAuth();
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.accent}/></View>;
  if (!me) return <Redirect href={loginRoute ?? '/'}/>;
  const icon = (name: IconName) => function TabIcon({ color }: { color: unknown }) { return <Icon name={name} color={String(color)}/>; };
  return <Tabs tabBar={(props) => <BottomNav {...(props as unknown as BottomNavProps)} />} screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true, sceneStyle: { backgroundColor: colors.background } }}>
    <Tabs.Screen name="index" options={{ title: 'Welcome', tabBarIcon: icon('home') }}/>
    <Tabs.Screen name="tables" options={{ title: 'Tables', tabBarIcon: icon('table'), href: can('VIEW_TABLES') ? undefined : null }}/>
    <Tabs.Screen name="pos" options={{ title: 'New order', tabBarIcon: icon('newOrder'), href: can('CREATE_ORDER') ? undefined : null }}/>
    <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: icon('receipt'), href: can('VIEW_ORDER') ? undefined : null }}/>
    <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('grid') }}/>
  </Tabs>;
}

type BottomNavProps = { state: { index: number; routes: { key: string; name: string }[] }; descriptors: Record<string, { options: { tabBarAccessibilityLabel?: string; tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => ReactNode } }>; navigation: { emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented?: boolean }; navigate: (name: string) => void } };
function BottomNav({ state, descriptors, navigation }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  return <View style={[navStyles.wrapper, { height: 78 + bottomInset, paddingBottom: bottomInset + 4 }]}><View style={navStyles.bar}>{state.routes.map((route, index) => { const focused = state.index === index; const { options } = descriptors[route.key]; const onPress = () => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!focused && !event.defaultPrevented) navigation.navigate(route.name); }; return <Pressable key={route.key} accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}} accessibilityLabel={options.tabBarAccessibilityLabel || route.name} onPress={onPress} style={navStyles.item}>{focused && <View style={navStyles.activePill} />}{options.tabBarIcon?.({ focused, color: '#FFFFFF', size: 30 })}</Pressable>; })}</View></View>;
}

const navStyles = StyleSheet.create({ wrapper: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 4 }, bar: { flex: 1, backgroundColor: '#102B29', borderRadius: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 7, shadowColor: '#0B3B2C', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 7 }, item: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', zIndex: 1 }, activePill: { position: 'absolute', width: 55, height: 55, borderRadius: 28, backgroundColor: colors.accent } });
