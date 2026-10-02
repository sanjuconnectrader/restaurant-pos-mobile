import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { messageOf } from '../../api/client';
import { pos, Table } from '../../api/pos';
import { useLive } from '../../hooks/useLive';
import { Button, Card, Chip, Screen, State } from '../../ui/Kit';
import { colors } from '../../theme/colors';
export default function Pos() {
  const { data: tables, loading, error, refresh } = useLive(useCallback(() => pos.tables(), []), [] as Table[]); const [type, setType] = useState('TAKEAWAY'); const [tableId, setTableId] = useState(''); const [busy, setBusy] = useState(false);
  async function create() { setBusy(true); try { const order = await pos.addOrder(type === 'DINE_IN' ? { type, tableId } : { type }); router.push(`/order/${order.id}`); } catch(e) { Alert.alert('Could not create order', messageOf(e)); } finally { setBusy(false); } }
  return <Screen title="New order" subtitle="Choose service type and start an order"><Card><Text style={{ fontWeight:'700', color:colors.ink }}>Service type</Text>{['TAKEAWAY','DINE_IN','PHONE_ORDER'].map((item) => <Chip key={item} label={item.replaceAll('_',' ')} selected={type === item} onPress={() => { setType(item); setTableId(''); }}/>)}</Card>
    {type === 'DINE_IN' && <Card><Text style={{ fontWeight:'700', color:colors.ink }}>Choose an available table</Text>{loading || error ? <State loading={loading} error={error} retry={refresh}/> : tables.filter((t) => t.status === 'AVAILABLE').length ? tables.filter((t) => t.status === 'AVAILABLE').map((t) => <Chip key={t.id} label={`Table ${t.tableNumber} · ${t.capacity} seats`} selected={tableId === t.id} onPress={() => setTableId(t.id)}/>) : <Text style={{ color:colors.muted }}>No available tables.</Text>}</Card>}
    <Button label="Start order" icon="plus" onPress={create} loading={busy} disabled={type === 'DINE_IN' && !tableId}/>
  </Screen>;
}
