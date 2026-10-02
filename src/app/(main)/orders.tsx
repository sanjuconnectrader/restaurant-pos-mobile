import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { pos, Order } from '../../api/pos';
import { useLive } from '../../hooks/useLive';
import { useAuth } from '../../store/auth';
import { Card, Chip, Row, Screen, State, money } from '../../ui/Kit';
export default function Orders() {
  const { data, loading, error, refresh } = useLive(useCallback(() => pos.orders(), []), [] as Order[]); const [filter, setFilter] = useState('Active'); const currency = useAuth((s) => s.me?.restaurant.currencyCode);
  const visible = data.filter((order) => filter === 'All' || (filter === 'Active' ? !['CLOSED','CANCELLED'].includes(order.status) : filter === 'Completed' ? order.status === 'CLOSED' : order.status === 'CANCELLED'));
  return <Screen title="Orders" subtitle="Track service and payments"><View style={{ flexDirection:'row',flexWrap:'wrap',gap:8 }}>{['Active','Completed','Cancelled','All'].map((name)=><Chip key={name} label={name} selected={filter===name} onPress={()=>setFilter(name)}/>)}</View>
    {(loading || error || !visible.length) ? <State loading={loading} error={error} empty="No orders in this view." retry={refresh}/> : visible.map((order) => <Card key={order.id}><Row title={`Order ${order.orderNumber || order.id.slice(0,8)}`} detail={`${order.type.replaceAll('_',' ')} · ${new Date(order.createdAt).toLocaleString()}`} onPress={() => router.push(`/order/${order.id}`)} right={<Text style={{ fontWeight:'700' }}>{money(order.total,currency)}</Text>}/><Chip label={order.status.replaceAll('_',' ')}/></Card>)}
  </Screen>;
}
