import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View, useWindowDimensions } from 'react-native';
import { messageOf } from '../../api/client';
import { pos, Table } from '../../api/pos';
import { useLive } from '../../hooks/useLive';
import { useAuth } from '../../store/auth';
import { Button, Card, Chip, Field, Screen, State } from '../../ui/Kit';
import { colors } from '../../theme/colors';
export default function Tables() {
  const { data, loading, error, refresh } = useLive(useCallback(() => pos.tables(), []), [] as Table[]); const { can } = useAuth(); const { width } = useWindowDimensions();
  const [form, setForm] = useState(false), [editing, setEditing] = useState(''), [number, setNumber] = useState(''), [name, setName] = useState(''), [section, setSection] = useState(''), [capacity, setCapacity] = useState('2'), [busy, setBusy] = useState(false);
  async function save() { setBusy(true); try { const values = { tableNumber: number.trim(), name: name.trim(), section: section.trim(), capacity: Number(capacity) }; if (editing) await pos.editTable(editing, values); else await pos.addTable(values); setForm(false); setEditing(''); setNumber(''); setName(''); await refresh(); } catch(e) { Alert.alert('Could not save table', messageOf(e)); } finally { setBusy(false); } }
  async function create(table: Table) { try { const order = await pos.addOrder({ type:'DINE_IN', tableId:table.id }); router.push(`/order/${order.id}`); } catch(e) { Alert.alert('Could not start order', messageOf(e)); } }
  return <Screen title="Tables" subtitle="Live floor availability" action={can('MANAGE_TABLES') ? <Button label="Add" icon="plus" variant="secondary" onPress={() => { setEditing(''); setNumber(''); setName(''); setSection(''); setCapacity('2'); setForm(true); }}/> : undefined}>
    {form && <Card><Text style={{ fontWeight:'700',color:colors.ink }}>{editing ? 'Edit table' : 'Add table'}</Text><Field label="Table number" value={number} onChangeText={setNumber}/><Field label="Name (optional)" value={name} onChangeText={setName}/><Field label="Section (optional)" value={section} onChangeText={setSection}/><Field label="Seats" value={capacity} onChangeText={setCapacity} keyboardType="numeric"/><Button label="Save table" onPress={save} loading={busy} disabled={!number.trim() || Number(capacity) < 1}/><Button label="Cancel" variant="text" onPress={() => setForm(false)}/></Card>}
    {(loading || error || !data.length) ? <State loading={loading} error={error} empty="No tables yet. Add one to take dine-in orders." retry={refresh}/> : <View style={{ flexDirection:'row',flexWrap:'wrap',gap:10 }}>{data.map((table) => <Card key={table.id} style={{ width: width < 360 ? '100%' : '47%', flexGrow:1 }}><Text style={{ fontSize:18,fontWeight:'700',color:colors.ink }}>Table {table.tableNumber}</Text><Text style={{ color:colors.muted }}>{table.name || table.section || `${table.capacity} seats`}</Text><Chip label={table.status}/>{table.status === 'AVAILABLE' && can('CREATE_ORDER') && <Button label="Start order" variant="secondary" onPress={() => create(table)}/ >}{can('MANAGE_TABLES') && <Button label="Edit" variant="text" onPress={() => { setEditing(table.id); setNumber(table.tableNumber); setName(table.name || ''); setSection(table.section || ''); setCapacity(String(table.capacity)); setForm(true); }}/>}</Card>)}</View>}
  </Screen>;
}
