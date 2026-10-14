import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { messageOf, post } from '../../../api/client';
import { isAxiosError } from 'axios';
import { Order, pos } from '../../../api/pos';
import { useLive } from '../../../hooks/useLive';
import { useAuth } from '../../../store/auth';
import { Button, Card, Field, Screen, State, money } from '../../../ui/Kit';
import { colors } from '../../../theme/colors';
import { Icon } from '../../../ui/Icon';
export default function Payment() {
  const { id } = useLocalSearchParams<{ id: string }>(); const currency = useAuth((s) => s.me?.restaurant.currencyCode); const { data: order, loading, error, refresh } = useLive(useCallback(() => pos.order(id), [id]), null as Order | null);
  const [method, setMethod] = useState('CASH'), [cash, setCash] = useState(''), [reference, setReference] = useState(''), [busy, setBusy] = useState(false), [key, setKey] = useState(() => Crypto.randomUUID());
  async function confirm() { if (!order || order.status !== 'BILL_REQUESTED') return; setBusy(true); try { const result = await post<{ receipt?: { id: string } }>(`/orders/${id}/payments`, { method, ...(method === 'CASH' ? { cashReceived:cash } : {}), ...(reference.trim() ? { externalReference:reference.trim() } : {}), idempotencyKey:key, confirmed:true }); if (result.receipt?.id) router.replace(`/receipt/${result.receipt.id}`); else { const receipt = await pos.receiptByOrder(id); router.replace(`/receipt/${receipt.id}`); } }
    catch(e) { try { const updated = await pos.order(id); if (updated.status === 'CLOSED') { const receipt = await pos.receiptByOrder(id); router.replace(`/receipt/${receipt.id}`); return; } } catch { /* report original error */ } Alert.alert('Payment not confirmed', messageOf(e)); if (isAxiosError(e) && e.response && e.response.status < 500) setKey(Crypto.randomUUID()); await refresh(); } finally { setBusy(false); } }
  if (loading || error || !order) return <Screen title="Payment" back><State loading={loading} error={error} empty="Order unavailable" retry={refresh}/></Screen>;
  if (order.status !== 'BILL_REQUESTED') return <Screen title="Payment" back><State empty={`Order is ${order.status.replaceAll('_',' ').toLowerCase()}. Payment is available after requesting the bill.`}/></Screen>;
  return <Screen title="Take payment" subtitle={`Order ${order.orderNumber || id.slice(0,8)}`} back>
    <View style={styles.amountCard}><View style={styles.amountIcon}><Icon name="wallet" size={24} color={colors.accent}/></View><Text style={styles.amountLabel}>AMOUNT DUE</Text><Text style={styles.amountValue}>{money(order.total,currency)}</Text><Text style={styles.amountHint}>Confirm after the full amount has been received.</Text></View>
    <View><Text style={styles.sectionTitle}>Payment method</Text><Text style={styles.sectionHint}>Select how the guest is paying.</Text></View>
    <View style={styles.methodGrid}>{[['CASH','Cash'],['CARD_MANUAL','Card (manual)'],['UPI_MANUAL','UPI (manual)'],['OTHER','Other']].map(([value,label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: method === value }} onPress={() => { if (value !== method) setKey(Crypto.randomUUID()); setMethod(value); }} style={[styles.methodCard, method === value && styles.methodSelected]}><Text style={styles.methodName}>{label}</Text><View style={[styles.radio, method === value && styles.radioSelected]}/></Pressable>)}</View>
    <Card style={styles.detailCard}>{method === 'CASH' ? <><Field label="Cash received" value={cash} onChangeText={(v) => { if (v !== cash) setKey(Crypto.randomUUID()); setCash(v); }} keyboardType="decimal-pad" placeholder="0.00"/>{Number(cash) >= Number(order.total) && <View style={styles.changeRow}><Text style={styles.changeLabel}>Change due</Text><Text style={styles.changeValue}>{money(Number(cash) - Number(order.total),currency)}</Text></View>}</> : <Field label="Reference (optional)" value={reference} onChangeText={setReference} placeholder="Transaction reference"/>}</Card>
    <Button label="Confirm payment" loading={busy} disabled={method === 'CASH' && (!cash.trim() || !Number.isFinite(Number(cash)) || Number(cash) < Number(order.total))} onPress={() => Alert.alert('Confirm payment?', 'Confirm only after receiving the full amount.', [{ text:'Back',style:'cancel' }, { text:'Confirm',onPress:confirm }])}/>
  </Screen>;
}

const styles = StyleSheet.create({
  amountCard: { backgroundColor: '#EDF5F1', borderWidth: 1, borderColor: '#D7E9E0', borderRadius: 18, padding: 19, gap: 7 }, amountIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#DDEFE7', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }, amountLabel: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 }, amountValue: { color: colors.ink, fontSize: 32, fontWeight: '800' }, amountHint: { color: colors.muted, fontSize: 12 }, sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '700' }, sectionHint: { color: colors.muted, fontSize: 12, marginTop: 4 }, methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, methodCard: { width: '48%', flexGrow: 1, minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14 }, methodSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accent }, methodName: { color: colors.ink, fontSize: 13, fontWeight: '700', flexShrink: 1 }, radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border }, radioSelected: { borderWidth: 5, borderColor: colors.accent }, detailCard: { borderRadius: 16, padding: 17 }, changeRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }, changeLabel: { color: colors.muted, fontSize: 13 }, changeValue: { color: colors.accent, fontSize: 16, fontWeight: '700' },
});
