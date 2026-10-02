import { router } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import { useCallback } from 'react';
import { pos, Summary } from '../../api/pos';
import { useLive } from '../../hooks/useLive';
import { useAuth } from '../../store/auth';
import { Button, Card, Row, Screen, Section, State, money } from '../../ui/Kit';
import { colors } from '../../theme/colors';
const empty: Summary = { grossSales: '0', refunds: '0', netSales: '0', completedOrders: 0 };
export default function Home() {
  const { me, can } = useAuth(); const currency = me?.restaurant.currencyCode; const { width } = useWindowDimensions();
  const { data, loading, error, refresh } = useLive(useCallback(() => pos.dashboard(), []), empty, can('VIEW_REVENUE'), can('VIEW_REVENUE'));
  const name = me?.user.firstName || 'there';
  return <Screen title={`Hello, ${name}`} subtitle={`${me?.restaurant.name || ''} · ${me?.user.role || ''}`}>
    {can('VIEW_REVENUE') && <><Section title="Today at a glance"/><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {[['Net sales', money(data.netSales,currency)], ['Completed orders', String(data.completedOrders)], ['Gross sales', money(data.grossSales,currency)], ['Refunds', money(data.refunds,currency)]].map(([label,value]) => <Card key={label} style={{ width: width < 390 ? '100%' : '48%', flexGrow: 1 }}><Text style={{ color:colors.muted,fontSize:13 }}>{label}</Text><Text style={{ color:colors.ink,fontSize:22,fontWeight:'700' }}>{value}</Text></Card>)}
    </View>{(loading || error) && <State loading={loading} error={error} retry={refresh}/>}</>}
    <Section title="Quick actions"/><Card>
      {can('CREATE_ORDER') && <Row title="New order" detail="Start service" icon="plus" onPress={() => router.push('/(main)/pos')}/>}
      {can('VIEW_ORDER') && <Row title="Active orders" detail="Track and update orders" icon="order" onPress={() => router.push('/(main)/orders')}/>}
      {can('VIEW_TABLES') && <Row title="Tables & reservations" detail="See floor availability" icon="table" onPress={() => router.push('/(main)/tables')}/>}
      {can('MANAGE_KITCHEN_STATUS') && <Row title="Kitchen" detail="Prepare incoming orders" icon="kitchen" onPress={() => router.push('/kitchen')}/>}
    </Card><Button label="Refresh" variant="text" onPress={refresh}/>
  </Screen>;
}
