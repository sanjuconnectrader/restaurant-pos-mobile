import { router } from 'expo-router';
import { useCallback } from 'react';
import { Text } from 'react-native';
import { Order, pos } from '../api/pos';
import { useLive } from '../hooks/useLive';
import { Card, Chip, Row, Screen, State } from '../ui/Kit';
export default function Kitchen() {
  const { data, loading, error, refresh } = useLive(useCallback(() => pos.orders(), []), [] as Order[]);
  const queue = data.filter((order) => ['CONFIRMED','PREPARING','READY'].includes(order.status));
  return <Screen title="Kitchen queue" subtitle="Incoming and in-progress orders" back>{loading || error || !queue.length ? <State loading={loading} error={error} empty="Kitchen queue is clear." retry={refresh}/> : queue.map((order) => <Card key={order.id}><Row title={`Order ${order.orderNumber || order.id.slice(0,8)}`} detail={order.type.replaceAll('_',' ')} onPress={() => router.push(`/order/${order.id}`)} right={<Chip label={order.status}/>}/></Card>)}</Screen>;
}
