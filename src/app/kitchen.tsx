import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Order, pos } from '../api/pos';
import { useLive } from '../hooks/useLive';
import { Card, Chip, Row, Screen, State } from '../ui/Kit';
import { colors } from '../theme/colors';
import { Icon } from '../ui/Icon';
export default function Kitchen() {
  const { data, loading, error, refresh } = useLive(useCallback(() => pos.orders(), []), [] as Order[]);
  const queue = data.filter((order) => ['CONFIRMED','PREPARING','READY'].includes(order.status));
  return <Screen title="Kitchen queue" subtitle="Incoming and in-progress orders" back><View style={styles.overview}><View style={styles.icon}><Icon name="kitchen" color={colors.accent}/></View><View><Text style={styles.count}>{queue.length} in queue</Text><Text style={styles.hint}>Orders awaiting or receiving preparation</Text></View></View>{loading || error || !queue.length ? <State loading={loading} error={error} empty="Kitchen queue is clear." retry={refresh}/> : queue.map((order) => <Card key={order.id} style={styles.card}><Row title={`Order ${order.orderNumber || order.id.slice(0,8)}`} detail={order.type.replaceAll('_',' ')} onPress={() => router.push(`/order/${order.id}`)} right={<Chip label={order.status.replaceAll('_', ' ')}/>} /></Card>)}</Screen>;
}
const styles = StyleSheet.create({ overview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 17, backgroundColor: '#EDF5F1', borderWidth: 1, borderColor: '#D7E9E0', borderRadius: 17 }, icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#DDEFE7', alignItems: 'center', justifyContent: 'center' }, count: { color: colors.ink, fontSize: 17, fontWeight: '700' }, hint: { color: colors.muted, fontSize: 12, marginTop: 4 }, card: { borderRadius: 16, padding: 15 } });
