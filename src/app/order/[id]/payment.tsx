import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { messageOf, post } from '../../../api/client';
import { isAxiosError } from 'axios';
import { Order, pos } from '../../../api/pos';
import { useLive } from '../../../hooks/useLive';
import { useAuth } from '../../../store/auth';
import { Button, Card, Chip, Field, Row, Screen, State, money } from '../../../ui/Kit';
import { colors } from '../../../theme/colors';
export default function Payment() {
  const { id } = useLocalSearchParams<{ id: string }>(); const currency = useAuth((s) => s.me?.restaurant.currencyCode); const { data: order, loading, error, refresh } = useLive(useCallback(() => pos.order(id), [id]), null as Order | null);
  const [method, setMethod] = useState('CASH'), [cash, setCash] = useState(''), [reference, setReference] = useState(''), [busy, setBusy] = useState(false), [key, setKey] = useState(() => Crypto.randomUUID());
  async function confirm() { if (!order || order.status !== 'BILL_REQUESTED') return; setBusy(true); try { const result = await post<{ receipt?: { id: string } }>(`/orders/${id}/payments`, { method, ...(method === 'CASH' ? { cashReceived:cash } : {}), ...(reference.trim() ? { externalReference:reference.trim() } : {}), idempotencyKey:key, confirmed:true }); if (result.receipt?.id) router.replace(`/receipt/${result.receipt.id}`); else { const receipt = await pos.receiptByOrder(id); router.replace(`/receipt/${receipt.id}`); } }
    catch(e) { try { const updated = await pos.order(id); if (updated.status === 'CLOSED') { const receipt = await pos.receiptByOrder(id); router.replace(`/receipt/${receipt.id}`); return; } } catch { /* report original error */ } Alert.alert('Payment not confirmed', messageOf(e)); if (isAxiosError(e) && e.response && e.response.status < 500) setKey(Crypto.randomUUID()); await refresh(); } finally { setBusy(false); } }
  if (loading || error || !order) return <Screen title="Payment" back><State loading={loading} error={error} empty="Order unavailable" retry={refresh}/></Screen>;
  if (order.status !== 'BILL_REQUESTED') return <Screen title="Payment" back><State empty={`Order is ${order.status.replaceAll('_',' ').toLowerCase()}. Payment is available after requesting the bill.`}/></Screen>;
  return <Screen title="Take payment" subtitle={`Order ${order.orderNumber || id.slice(0,8)}`} back><Card><Row title="Amount due" right={<Text style={{ fontSize:24,fontWeight:'700',color:colors.ink }}>{money(order.total,currency)}</Text>}/></Card><Card><Text style={{ fontWeight:'700',color:colors.ink }}>Payment method</Text>{[['CASH','Cash'],['CARD_MANUAL','Card (manual)'],['UPI_MANUAL','UPI (manual)'],['OTHER','Other']].map(([value,label]) => <Chip key={value} label={label} selected={method === value} onPress={() => { if (value !== method) setKey(Crypto.randomUUID()); setMethod(value); }}/>)}{method === 'CASH' && <><Field label="Cash received" value={cash} onChangeText={(v) => { if (v !== cash) setKey(Crypto.randomUUID()); setCash(v); }} keyboardType="decimal-pad"/>{Number(cash) >= Number(order.total) && <Text style={{ color:colors.muted }}>Change: {money(Number(cash) - Number(order.total),currency)}</Text>}</>}{method !== 'CASH' && <Field label="Reference (optional)" value={reference} onChangeText={setReference}/>}</Card><Button label="Confirm payment" loading={busy} disabled={method === 'CASH' && Number(cash) < Number(order.total)} onPress={() => Alert.alert('Confirm payment?', 'Confirm only after receiving the full amount.', [{ text:'Back',style:'cancel' }, { text:'Confirm',onPress:confirm }])}/></Screen>;
}
