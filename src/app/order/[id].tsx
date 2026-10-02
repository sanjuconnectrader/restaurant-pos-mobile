import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { messageOf } from '../../api/client';
import { Category, MenuItem, Order, pos } from '../../api/pos';
import { useLive } from '../../hooks/useLive';
import { useAuth } from '../../store/auth';
import { Button, Card, Chip, Field, Row, Screen, Section, State, money } from '../../ui/Kit';
import { colors } from '../../theme/colors';
export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { can, me } = useAuth(); const currency = me?.restaurant.currencyCode;
  const { data: order, loading, error, refresh } = useLive(useCallback(() => pos.order(id), [id]), null as Order | null);
  const { data: menu } = useLive(useCallback(() => pos.menu(), []), [] as MenuItem[]); const { data: categories } = useLive(useCallback(() => pos.categories(), []), [] as Category[]);
  const [category, setCategory] = useState('All'), [quantity, setQuantity] = useState('1'), [notes, setNotes] = useState(''), [busy, setBusy] = useState('');
  async function run(key: string, action: () => Promise<unknown>) { setBusy(key); try { await action(); await refresh(); } catch(e) { Alert.alert('Action failed', messageOf(e)); } finally { setBusy(''); } }
  if (loading && !order || error && !order) return <Screen title="Order" back><State loading={loading} error={error} retry={refresh}/></Screen>;
  if (!order) return <Screen title="Order" back><State empty="Order unavailable."/></Screen>;
  const editable = ['DRAFT','CONFIRMED','PREPARING','READY','SERVED'].includes(order.status);
  const active = order.items?.filter((item) => item.status === 'ACTIVE') || [];
  return <Screen title={`Order ${order.orderNumber || order.id.slice(0,8)}`} subtitle={`${order.type.replaceAll('_',' ')} · ${order.status.replaceAll('_',' ')}`} back>
    <Card><Section title="Items"/>{active.length ? active.map((item) => <Row key={item.id} title={`${item.quantity} × ${item.itemNameSnapshot}`} detail={item.notes || undefined} right={<Text style={{ color:colors.ink,fontWeight:'700' }}>{money(Number(item.unitPriceSnapshot) * item.quantity,currency)}</Text>}/>) : <Text style={{ color:colors.muted }}>No items yet. Add from the menu below.</Text>}
      <View style={{ borderTopWidth:1,borderColor:colors.border,paddingTop:12,gap:7 }}><Row title="Subtotal" right={<Text>{money(order.subtotal,currency)}</Text>}/><Row title="Tax" right={<Text>{money(order.tax,currency)}</Text>}/><Row title="Total" right={<Text style={{ fontSize:20,fontWeight:'700',color:colors.ink }}>{money(order.total,currency)}</Text>}/></View>
    </Card>
    {editable && can('UPDATE_ORDER') && <><Section title="Add menu items"/><View style={{ flexDirection:'row',flexWrap:'wrap',gap:8 }}><Chip label="All" selected={category === 'All'} onPress={() => setCategory('All')}/>{categories.filter((c) => c.active).map((c) => <Chip key={c.id} label={c.name} selected={category === c.id} onPress={() => setCategory(c.id)}/>)}</View><Card><Field label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric"/><Field label="Notes for next item (optional)" value={notes} onChangeText={setNotes}/>{menu.filter((item) => item.active && item.available && (category === 'All' || item.categoryId === category)).map((item) => <Row key={item.id} title={item.name} detail={money(item.price,currency)} right={<Button label="Add" variant="secondary" loading={busy === item.id} onPress={() => run(item.id, async () => { await pos.addItem(id, { menuItemId:item.id,quantity:Number(quantity),notes:notes.trim() }); setNotes(''); })}/>}/>)}{!menu.length && <Text style={{ color:colors.muted }}>No available menu items.</Text>}</Card></>}
    {editable && can('VOID_ORDER_ITEM') && active.length > 0 && <Card><Section title="Adjust items"/>{active.map((item) => <Row key={item.id} title={item.itemNameSnapshot} right={<Button label="Void" variant="text" onPress={() => Alert.alert('Void item?', 'Choose a reason.', [{ text:'Cancel',style:'cancel' }, ...(['CUSTOMER_CHANGED_MIND','WRONG_ITEM','EMPLOYEE_ERROR','KITCHEN_UNAVAILABLE','OTHER'] as const).map((reason) => ({ text:reason.replaceAll('_',' '),onPress:()=>run(item.id,()=>pos.voidItem(id,item.id,reason)) }))])}/>}/>)}</Card>}
    <Section title="Next step"/><Card>
      {order.status === 'DRAFT' && can('UPDATE_ORDER') && <Button label="Send to kitchen" disabled={!active.length} onPress={() => run('confirm', () => pos.action(id,'confirm'))} loading={busy === 'confirm'}/>}
      {order.status === 'CONFIRMED' && can('MANAGE_KITCHEN_STATUS') && <Button label="Start preparing" onPress={() => run('preparing', () => pos.action(id,'preparing'))}/>}
      {order.status === 'PREPARING' && can('MANAGE_KITCHEN_STATUS') && <Button label="Mark ready" onPress={() => run('ready', () => pos.action(id,'ready'))}/>}
      {order.status === 'READY' && can('UPDATE_ORDER') && <Button label="Mark served" onPress={() => run('served', () => pos.action(id,'served'))}/>}
      {['CONFIRMED','PREPARING','READY','SERVED'].includes(order.status) && can('UPDATE_ORDER') && <Button label="Request bill" variant="secondary" onPress={() => run('bill', () => pos.action(id,'bill'))}/>}
      {order.status === 'BILL_REQUESTED' && can('COMPLETE_PAYMENT') && <Button label="Take payment" icon="wallet" onPress={() => router.push(`/order/${id}/payment`)}/>}
      {order.status === 'CLOSED' && can('PRINT_RECEIPT') && <Button label="View receipt" icon="receipt" onPress={async () => { try { const receipt = await pos.receiptByOrder(id); router.push(`/receipt/${receipt.id}`); } catch(e) { Alert.alert('Receipt unavailable',messageOf(e)); } }}/ >}
      {editable && can('CANCEL_ORDER') && <Button label="Cancel order" variant="text" onPress={() => Alert.alert('Cancel order?', 'This will release its table and cannot be undone.', [{ text:'Keep order',style:'cancel' }, { text:'Cancel order',style:'destructive',onPress:()=>run('cancel',()=>pos.action(id,'cancel')) }])}/>}
    </Card>
  </Screen>;
}
