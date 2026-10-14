import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { pos, Order } from '../../api/pos';
import { useLive } from '../../hooks/useLive';
import { useAuth } from '../../store/auth';
import { Card, Chip, Row, Screen, State, money } from '../../ui/Kit';
import { colors } from '../../theme/colors';
export default function Orders() {
  const { data, loading, error, refresh } = useLive(useCallback(() => pos.orders(), []), [] as Order[]); const [filter, setFilter] = useState('Active'); const currency = useAuth((s) => s.me?.restaurant.currencyCode);
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 720) - 40;
  const cardWidth = contentWidth >= 600 ? (contentWidth - 12) / 2 : contentWidth;
  const activeCount = data.filter((order) => !['CLOSED', 'CANCELLED'].includes(order.status)).length;
  const visible = data.filter((order) => filter === 'All' || (filter === 'Active' ? !['CLOSED','CANCELLED'].includes(order.status) : filter === 'Completed' ? order.status === 'CLOSED' : order.status === 'CANCELLED'));
  return <Screen title="Orders" subtitle="Track service and payments" bottomSpace={112}><View style={styles.overview}><Text style={styles.overviewLabel}>ACTIVE ORDERS</Text><Text style={styles.overviewValue}>{activeCount}</Text><Text style={styles.overviewCaption}>Orders currently in service</Text></View><View style={styles.filters}>{['Active','Completed','Cancelled','All'].map((name)=><Chip key={name} label={name} selected={filter===name} onPress={()=>setFilter(name)}/>)}</View><View style={styles.listHeading}><Text style={styles.listTitle}>{filter} orders</Text><Text style={styles.count}>{visible.length} shown</Text></View>
    {(loading || error || !visible.length) ? <State loading={loading} error={error} empty="No orders in this view." retry={refresh}/> : <View style={styles.grid}>{visible.map((order) => <Card key={order.id} style={{ width: cardWidth, borderRadius: 17, padding: 16 }}><View style={styles.cardTop}><Text numberOfLines={1} style={styles.cardNumber}>Order {order.orderNumber || order.id.slice(0,8)}</Text><Chip label={order.status.replaceAll('_',' ')}/></View><Text style={styles.cardMeta}>{order.type.replaceAll('_',' ').toLowerCase()} · {new Date(order.createdAt).toLocaleString()}</Text><View style={styles.cardFooter}><Text style={styles.cardTotal}>{money(order.total,currency)}</Text><View style={styles.cardLink}><Row title="View order" onPress={() => router.push(`/order/${order.id}`)}/></View></View></Card>)}</View>}
  </Screen>;
}

const styles = StyleSheet.create({
  overview: { backgroundColor: '#EDF5F1', borderColor: '#D7E9E0', borderWidth: 1, borderRadius: 18, padding: 18 }, overviewLabel: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 }, overviewValue: { color: colors.ink, fontSize: 35, fontWeight: '800', marginTop: 5 }, overviewCaption: { color: colors.muted, fontSize: 12, marginTop: 2 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, listTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' }, count: { color: colors.muted, fontSize: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, cardNumber: { color: colors.ink, fontSize: 17, fontWeight: '700', flex: 1 }, cardMeta: { color: colors.muted, fontSize: 12, textTransform: 'capitalize' }, cardFooter: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardTotal: { color: colors.ink, fontSize: 18, fontWeight: '700', flexShrink: 1 }, cardLink: { width: 125 },
});
