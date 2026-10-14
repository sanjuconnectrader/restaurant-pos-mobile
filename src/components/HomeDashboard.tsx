import { router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { pos, Summary, Table } from '../api/pos';
import { useLive } from '../hooks/useLive';
import { useAuth } from '../store/auth';
import { colors } from '../theme/colors';
import { Icon, IconName } from '../ui/Icon';
import { money } from '../ui/Kit';

const empty: Summary = { grossSales: '0', refunds: '0', netSales: '0', completedOrders: 0 };

function QuickAction({ icon, label, tint, onPress, width }: { icon: IconName; label: string; tint: string; onPress: () => void; width: number }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, { width, backgroundColor: tint }, pressed && styles.pressed]}>
    <View style={styles.quickTop}><View style={styles.quickIcon}><Icon name={icon} size={22} color={colors.accent} /></View><View style={styles.quickArrow}><Icon name="chevron" size={15} color={colors.accent} /></View></View>
    <Text style={styles.quickLabel}>{label}</Text>
  </Pressable>;
}

function MoreRow({ icon, title, tint, onPress }: { icon: IconName; title: string; tint: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.moreRow, pressed && styles.pressed]}>
    <View style={[styles.moreIcon, { backgroundColor: tint }]}><Icon name={icon} size={21} color={colors.accent} /></View>
    <Text style={styles.moreTitle}>{title}</Text>
    <View style={styles.moreArrow}><Icon name="chevron" size={16} color={colors.accent} /></View>
  </Pressable>;
}

export default function HomeDashboard() {
  const { me, can } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const currency = me?.restaurant.currencyCode || 'INR';
  const showRevenue = can('VIEW_REVENUE');
  const { data, loading, error } = useLive(useCallback(() => pos.dashboard(), []), empty, showRevenue, showRevenue);
  const showTables = can('VIEW_TABLES');
  const { data: tables } = useLive(useCallback(() => pos.tables(), []), [] as Table[], showTables, showTables);
  const availableTables = tables.filter((table) => table.status === 'AVAILABLE').length;
  const quickWidth = (Math.min(width - 40, 640) - 10) / 2;
  const bottomInset = insets.bottom;
  const quickActions = [
    can('COMPLETE_PAYMENT') && { icon: 'wallet' as const, label: 'Take payment', tint: '#E3F4EF', onPress: () => router.push('/(main)/orders') },
    can('CREATE_ORDER') && { icon: 'plus' as const, label: 'Place an order', tint: '#DDF0E8', onPress: () => router.push('/(main)/pos') },
    can('VIEW_TABLES') && { icon: 'calendar' as const, label: 'Table booking', tint: '#E9F5EF', onPress: () => router.push('/(main)/tables') },
    can('VIEW_ORDER') && { icon: 'receipt' as const, label: 'Order history', tint: '#D7EDE7', onPress: () => router.push('/(main)/orders') },
  ].filter((action) => action !== false);
  const moreOptions = [
    can('MANAGE_MENU') && { icon: 'menu' as const, title: 'Menu & categories', tint: '#E8F5EF', onPress: () => router.push('/manage/menu') },
    can('VIEW_EMPLOYEES') && { icon: 'staff' as const, title: 'Team', tint: '#EEF4E7', onPress: () => router.push('/manage/employees') },
    can('VIEW_REPORTS') && { icon: 'chart' as const, title: 'Reports', tint: '#E0F2EC', onPress: () => router.push('/manage/reports') },
  ].filter((option) => option !== false);

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14, paddingBottom: bottomInset + 100 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Welcome</Text>
            {!!me?.restaurant.name && <Text numberOfLines={1} style={styles.restaurantName}>{me.restaurant.name}</Text>}
          </View>
          <View accessible accessibilityLabel="Notifications" style={styles.notificationIcon}><Icon name="bell" size={24} color={colors.accent} /></View>
        </View>

        {showRevenue && <>
          <View style={styles.salesCard}>
            <View pointerEvents="none" style={styles.salesArtwork}><Svg width="100%" height="100%"><Defs><LinearGradient id="salesGradient" x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor="#FFFFFF" /><Stop offset="100%" stopColor="#EAF6F0" /></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#salesGradient)" /><Circle cx="96%" cy="-8%" r="125" fill="none" stroke="#157B62" strokeOpacity="0.08" strokeWidth="1" /><Circle cx="96%" cy="-8%" r="90" fill="none" stroke="#157B62" strokeOpacity="0.1" strokeWidth="1" /></Svg></View>
            <View style={styles.salesContent}><View style={styles.salesEyebrow}><View style={styles.salesDot} /><Text style={styles.salesLabel}>TODAY&apos;S SALES</Text><View style={styles.salesEmblem}><Icon name="chart" size={18} color={colors.accent} /></View></View>
            <Text adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5} style={styles.salesValue}>{money(data.netSales, currency)}</Text>
            <Text style={styles.salesCaption}>Net sales across completed payments</Text>
            <View style={styles.salesDivider} />
            <Pressable accessibilityRole="button" onPress={() => router.push('/manage/reports')} style={styles.breakdownButton}><Text style={styles.breakdown}>View amount breakdown</Text><View style={styles.breakdownArrow}><Icon name="chevron" size={16} color={colors.accent} /></View></Pressable></View>
            {(loading || error) && <Text style={styles.status}>{loading ? 'Refreshing…' : error}</Text>}
          </View>
          <View style={styles.metrics}>
            <View style={styles.metricCard}><Text style={styles.metricLabel}>Completed orders</Text><Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>{data.completedOrders}</Text></View>
            {showTables && <Pressable accessibilityRole="button" onPress={() => router.push('/(main)/tables')} style={[styles.metricCard, styles.tableMetric]}><Text style={styles.metricLabel}>Available tables</Text><View style={styles.metricBottom}><Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>{availableTables}</Text><Icon name="table" size={22} color={colors.accent} /></View></Pressable>}
          </View>
        </>}

        {quickActions.length > 0 && <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickGrid}>{quickActions.map((action) => <QuickAction key={action.label} {...action} width={quickWidth} />)}</View>
        </View>}

        {moreOptions.length > 0 && <View style={styles.section}>
          <View style={styles.moreHeading}><Text style={styles.sectionTitle}>More options</Text><Pressable accessibilityRole="button" onPress={() => router.push('/(main)/more')}><Text style={styles.viewAll}>View all</Text></Pressable></View>
          <View style={styles.moreCard}>{moreOptions.map((option) => <MoreRow key={option.title} {...option} />)}</View>
        </View>}
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, flexGrow: 1 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 18 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: '#082B2A', fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  restaurantName: { color: '#758590', fontSize: 13, lineHeight: 19, marginTop: 2 },
  notificationIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5F0', alignItems: 'center', justifyContent: 'center' },
  salesCard: { minHeight: 208, borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D5E9DF', shadowColor: '#0B3B2C', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  salesArtwork: { ...StyleSheet.absoluteFill },
  salesContent: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 16 },
  salesEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  salesDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  salesLabel: { color: colors.accent, fontSize: 11, lineHeight: 16, fontWeight: '800', letterSpacing: 1.1 },
  salesEmblem: { marginLeft: 'auto', width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0F2EA', alignItems: 'center', justifyContent: 'center' },
  salesValue: { color: '#082B2A', fontSize: 40, lineHeight: 51, fontWeight: '800', letterSpacing: -1.3, width: '100%', marginTop: 9 },
  salesCaption: { color: '#758590', fontSize: 12, lineHeight: 18, marginTop: 1 },
  salesDivider: { height: 1, backgroundColor: '#D6E9E0', marginTop: 19, marginBottom: 10 },
  breakdownButton: { minHeight: 33, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  breakdown: { color: colors.accent, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  breakdownArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DDF0E8', alignItems: 'center', justifyContent: 'center' },
  status: { color: colors.muted, fontSize: 12, lineHeight: 17, paddingHorizontal: 22, paddingBottom: 12 },
  metrics: { flexDirection: 'row', gap: 12, marginTop: -10 },
  metricCard: { flex: 1, minWidth: 0, minHeight: 101, borderRadius: 18, backgroundColor: '#EEF7F3', paddingHorizontal: 16, paddingVertical: 15, justifyContent: 'space-between' },
  tableMetric: { backgroundColor: '#E5F3EE' },
  metricBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricLabel: { color: '#758590', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  metricValue: { color: '#082B2A', fontSize: 24, lineHeight: 31, fontWeight: '800' },
  section: { gap: 14 },
  sectionTitle: { color: '#082B2A', fontSize: 20, lineHeight: 26, fontWeight: '800', letterSpacing: -0.3 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: { minHeight: 108, borderRadius: 20, borderWidth: 1, borderColor: '#D9EDE3', justifyContent: 'space-between', padding: 12, shadowColor: '#0B3B2C', shadowOpacity: 0.045, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  quickTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  quickIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  quickArrow: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFFAA', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: '#102B29', fontSize: 14, lineHeight: 18, fontWeight: '800' },
  moreHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewAll: { color: colors.accent, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  moreCard: { gap: 10 },
  moreRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#E1EEE7', paddingHorizontal: 13, shadowColor: '#0B3B2C', shadowOpacity: 0.035, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  moreIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moreTitle: { flex: 1, minWidth: 0, color: '#102B29', fontSize: 15, lineHeight: 20, fontWeight: '700' },
  moreArrow: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F0F8F3', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72 },
});
