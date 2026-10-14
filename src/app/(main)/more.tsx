import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { checkForAppUpdate, currentAppVersion } from '../../services/app-update-manager';
import { useAuth } from '../../store/auth';
import { Row, Screen } from '../../ui/Kit';
import { Icon, IconName } from '../../ui/Icon';
import { colors } from '../../theme/colors';

function Group({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <View style={styles.group}><View style={styles.groupHeading}><Text style={styles.groupTitle}>{title}</Text>{!!subtitle && <Text style={styles.groupSubtitle}>{subtitle}</Text>}</View><View style={styles.groupCard}>{children}</View></View>;
}
function Option({ title, detail, icon, onPress, last = false }: { title: string; detail?: string; icon: IconName; onPress: () => void; last?: boolean }) {
  return <View style={[styles.option, !last && styles.optionBorder]}><View style={styles.optionIcon}><Icon name={icon} size={20} color={colors.accent}/></View><View style={styles.optionContent}><Row title={title} detail={detail} onPress={onPress}/></View></View>;
}
export default function More() {
  const { me, can, signOut } = useAuth();
  return <Screen title="More" subtitle="Workspace and preferences" bottomSpace={112}>
    <View style={styles.identity}><View style={styles.identityIcon}><Icon name="kitchen" size={24} color={colors.accent}/></View><View style={styles.identityText}><Text numberOfLines={1} style={styles.restaurant}>{me?.restaurant.name || 'Restaurant'}</Text><Text style={styles.identityCaption}>Your workspace</Text></View></View>
    <Group title="Operations" subtitle="Keep daily service running smoothly">
      {can('MANAGE_MENU') && <Option title="Menu & categories" detail="Items, pricing and availability" icon="menu" onPress={() => router.push('/manage/menu')}/>}
      {can('VIEW_EMPLOYEES') && <Option title="Team" detail="People and access" icon="staff" onPress={() => router.push('/manage/employees')}/>}
      {can('VIEW_TABLES') && <Option title="Reservations" detail="Bookings and seating" icon="calendar" onPress={() => router.push('/manage/reservations')}/>}
      {can('PRINT_RECEIPT') && <Option title="Receipts" detail="Past payments" icon="receipt" onPress={() => router.push('/manage/receipts')}/>}
      {can('VIEW_REPORTS') && <Option title="Reports" detail="Sales and performance" icon="chart" onPress={() => router.push('/manage/reports')} last/>}
    </Group>
    <Group title="Workspace" subtitle="Account and restaurant preferences">
      {can('MANAGE_SETTINGS') && <Option title="Settings" detail="Restaurant and payment methods" icon="settings" onPress={() => router.push('/manage/settings')}/>}
      <Option title="Profile" detail="Your account details" icon="user" onPress={() => router.push('/manage/profile')} last/>
    </Group>
    <Group title="Application"><Option title="Check for updates" detail={`Installed version ${currentAppVersion}`} icon="refresh" onPress={() => { void checkForAppUpdate({ force: true, interactive: true }); }} last/></Group>
    <Group title="Account"><Option title="Sign out" detail="Leave this workspace securely" icon="logout" onPress={() => Alert.alert('Sign out?', 'You will need to sign in again.', [{ text:'Cancel',style:'cancel' }, { text:'Sign out',style:'destructive',onPress:()=>{ void signOut(); } }])} last/></Group>
  </Screen>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#EDF5F1', borderWidth: 1, borderColor: '#D8E9E1', borderRadius: 18, padding: 17 }, identityIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#DCEEE6', alignItems: 'center', justifyContent: 'center' }, identityText: { flex: 1 }, restaurant: { color: colors.ink, fontSize: 18, fontWeight: '700' }, identityCaption: { color: colors.muted, fontSize: 12, marginTop: 3 },
  group: { gap: 11 }, groupHeading: { gap: 3, paddingHorizontal: 2 }, groupTitle: { color: colors.ink, fontSize: 19, fontWeight: '700' }, groupSubtitle: { color: colors.muted, fontSize: 12 }, groupCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 17, paddingHorizontal: 14 }, option: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 62 }, optionBorder: { borderBottomWidth: 1, borderBottomColor: colors.border }, optionIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, optionContent: { flex: 1 },
});
