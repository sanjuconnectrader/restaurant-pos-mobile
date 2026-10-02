import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../store/auth';
import { Button, Card, Screen } from '../ui/Kit';
import { colors } from '../theme/colors';
export default function Entry() {
  const { ready, me } = useAuth();
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.accent}/></View>;
  if (me) return <Redirect href="/(main)"/>;
  return <Screen><View style={{ paddingTop: 64, gap: 12 }}><Text style={{ fontSize: 34, fontWeight: '800', color: colors.ink }}>ServeFlow</Text><Text style={{ fontSize: 17, color: colors.muted }}>Restaurant POS</Text></View><Card><Text style={{ fontSize: 19, fontWeight: '700', color: colors.ink }}>Welcome back</Text><Text style={{ color: colors.muted, lineHeight: 21 }}>Choose how you work with your restaurant.</Text><Button label="Restaurant owner" icon="user" onPress={() => router.push('/owner/login')}/><Button label="Team member" icon="staff" variant="secondary" onPress={() => router.push('/employee/login')}/></Card><Button label="Create a restaurant account" variant="text" onPress={() => router.push('/owner/register')}/></Screen>;
}
