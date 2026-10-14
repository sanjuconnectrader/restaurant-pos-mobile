import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { messageOf } from '../../api/client';
import { pos, Table } from '../../api/pos';
import { useLive } from '../../hooks/useLive';
import { useAuth } from '../../store/auth';
import { Button, Card, Field, Screen, State } from '../../ui/Kit';
import { Icon } from '../../ui/Icon';
import { colors } from '../../theme/colors';

type Filter = 'ALL' | 'AVAILABLE' | 'OCCUPIED';

export default function Tables() {
  const { data, loading, error, refresh } = useLive(useCallback(() => pos.tables(), []), [] as Table[]);
  const { can } = useAuth();
  const { width } = useWindowDimensions();
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const contentWidth = Math.min(width, 720) - 40;
  const columns = contentWidth >= 600 ? 3 : contentWidth >= 390 ? 2 : 1;
  const cardWidth = (contentWidth - 12 * (columns - 1)) / columns;
  const available = data.filter((table) => table.status === 'AVAILABLE').length;
  const occupied = data.filter((table) => table.status === 'OCCUPIED').length;
  const visible = data.filter((table) => filter === 'ALL' || table.status === filter);

  function openForm(table?: Table) {
    setEditing(table?.id || '');
    setNumber(table?.tableNumber || '');
    setName(table?.name || '');
    setSection(table?.section || '');
    setCapacity(table ? String(table.capacity) : '2');
    setForm(true);
  }

  async function save() {
    const seats = Number(capacity);
    if (!number.trim() || !Number.isInteger(seats) || seats < 1) return;
    setBusy(true);
    try {
      const values = { tableNumber: number.trim(), name: name.trim(), section: section.trim(), capacity: seats };
      if (editing) await pos.editTable(editing, values);
      else await pos.addTable(values);
      setForm(false);
      setEditing('');
      await refresh();
    } catch (error) { Alert.alert('Could not save table', messageOf(error)); }
    finally { setBusy(false); }
  }

  function confirmDelete(table: Table) {
    Alert.alert('Delete table?', `Table ${table.tableNumber} will be removed. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete table', style: 'destructive', onPress: async () => {
        setDeleting(table.id);
        try {
          await pos.removeTable(table.id);
          if (editing === table.id) setForm(false);
          await refresh();
        } catch (error) { Alert.alert('Could not delete table', messageOf(error)); }
        finally { setDeleting(''); }
      } },
    ]);
  }

  async function startOrder(table: Table) {
    try { const order = await pos.addOrder({ type: 'DINE_IN', tableId: table.id }); router.push(`/order/${order.id}`); }
    catch (error) { Alert.alert('Could not start order', messageOf(error)); }
  }

  return <Screen title="Tables" subtitle="Manage your dining floor" bottomSpace={108} action={can('MANAGE_TABLES') ? <Button label="Add table" icon="plus" onPress={() => openForm()} /> : undefined}>
    <View style={styles.overview}>
      <View style={styles.overviewTop}><View style={styles.overviewIcon}><Icon name="table" size={22} color={colors.accent} /></View><Text style={styles.eyebrow}>FLOOR OVERVIEW</Text></View>
      <View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricValue}>{data.length}</Text><Text style={styles.metricLabel}>Total tables</Text></View><View style={styles.metric}><Text style={[styles.metricValue, { color: colors.accent }]}>{available}</Text><Text style={styles.metricLabel}>Available</Text></View><View style={[styles.metric, { borderRightWidth: 0 }]}><Text style={styles.metricValue}>{occupied}</Text><Text style={styles.metricLabel}>Occupied</Text></View></View>
    </View>

    {form && <Card style={styles.formCard}>
      <View><Text style={styles.formTitle}>{editing ? 'Edit table' : 'New table'}</Text><Text style={styles.hint}>Add the details guests and staff will see.</Text></View>
      <View style={styles.fieldGrid}><View style={styles.fieldHalf}><Field label="Table number" value={number} onChangeText={setNumber} placeholder="e.g. 01" /></View><View style={styles.fieldHalf}><Field label="Seats" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholder="2" /></View></View>
      <Field label="Display name (optional)" value={name} onChangeText={setName} placeholder="e.g. Window table" />
      <Field label="Section (optional)" value={section} onChangeText={setSection} placeholder="e.g. Main dining" />
      <View style={styles.formActions}><View style={styles.fieldHalf}><Button label="Cancel" variant="secondary" onPress={() => setForm(false)} /></View><View style={styles.fieldHalf}><Button label={editing ? 'Save changes' : 'Create table'} onPress={save} loading={busy} disabled={!number.trim() || !Number.isInteger(Number(capacity)) || Number(capacity) < 1} /></View></View>
    </Card>}

    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Your tables</Text><Text style={styles.hint}>{data.length} total</Text></View>
    <View style={styles.filters}>{(['ALL', 'AVAILABLE', 'OCCUPIED'] as Filter[]).map((option) => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: filter === option }} onPress={() => setFilter(option)} style={[styles.filter, filter === option && styles.filterSelected]}><Text style={[styles.filterText, filter === option && styles.filterTextSelected]}>{option === 'ALL' ? 'All' : option === 'AVAILABLE' ? 'Available' : 'Occupied'}</Text></Pressable>)}</View>

    {loading || error ? <State loading={loading} error={error} retry={refresh} /> : !data.length ? <State empty="No tables yet. Add one to manage your floor." /> : !visible.length ? <State empty={`No ${filter.toLowerCase()} tables right now.`} /> : <View style={styles.grid}>{visible.map((table) => {
      const isAvailable = table.status === 'AVAILABLE';
      return <View key={table.id} style={[styles.tableCard, { width: cardWidth }]}>
        <View style={styles.cardTop}><View style={[styles.tableIcon, !isAvailable && styles.tableIconMuted]}><Icon name="table" size={21} color={isAvailable ? colors.accent : colors.muted} /></View><View style={[styles.status, isAvailable ? styles.statusAvailable : styles.statusBusy]}><View style={[styles.statusDot, { backgroundColor: isAvailable ? colors.accent : colors.warning }]} /><Text numberOfLines={1} style={[styles.statusText, { color: isAvailable ? colors.accent : colors.warning }]}>{table.status.replaceAll('_', ' ').toLowerCase()}</Text></View></View>
        <View><Text numberOfLines={1} style={styles.cardTitle}>Table {table.tableNumber}</Text>{!!table.name && <Text numberOfLines={1} style={styles.cardName}>{table.name}</Text>}</View>
        <Text numberOfLines={1} style={styles.cardMeta}>{table.capacity} {table.capacity === 1 ? 'seat' : 'seats'}{table.section ? ` · ${table.section}` : ''}</Text>
        {(can('MANAGE_TABLES') || (isAvailable && can('CREATE_ORDER'))) && <View style={styles.cardActions}>{isAvailable && can('CREATE_ORDER') && <Pressable accessibilityRole="button" onPress={() => startOrder(table)} style={styles.orderAction}><Text style={styles.orderText}>Start order</Text><Icon name="chevron" size={16} color={colors.accent} /></Pressable>}{can('MANAGE_TABLES') && <View style={styles.manageActions}><Pressable accessibilityRole="button" accessibilityLabel={`Edit table ${table.tableNumber}`} onPress={() => openForm(table)} style={styles.textAction}><Text style={styles.editText}>Edit</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete table ${table.tableNumber}`} disabled={deleting === table.id} onPress={() => confirmDelete(table)} style={styles.textAction}><Text style={styles.deleteText}>{deleting === table.id ? 'Deleting' : 'Delete'}</Text></Pressable></View>}</View>}
      </View>;
    })}</View>}
  </Screen>;
}

const styles = StyleSheet.create({
  overview: { borderRadius: 18, padding: 18, backgroundColor: '#EDF5F1', borderWidth: 1, borderColor: '#D7E9E0', gap: 18 }, overviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, overviewIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#DDEFE7', alignItems: 'center', justifyContent: 'center' }, eyebrow: { fontSize: 11, letterSpacing: 1.1, fontWeight: '800', color: colors.accent }, metrics: { flexDirection: 'row' }, metric: { flex: 1, borderRightWidth: 1, borderRightColor: '#D2E2D9', paddingLeft: 12 }, metricValue: { color: colors.ink, fontSize: 24, fontWeight: '800', letterSpacing: -1 }, metricLabel: { color: colors.muted, fontSize: 12, marginTop: 3 },
  formCard: { borderRadius: 18, padding: 18, gap: 15 }, formTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' }, hint: { color: colors.muted, fontSize: 13, marginTop: 4 }, fieldGrid: { flexDirection: 'row', gap: 12 }, fieldHalf: { flex: 1 }, formActions: { flexDirection: 'row', gap: 10 }, sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' }, filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, filter: { paddingHorizontal: 14, minHeight: 36, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, filterSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, filterText: { color: colors.muted, fontSize: 13, fontWeight: '600' }, filterTextSelected: { color: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tableCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 15, gap: 13, justifyContent: 'space-between' }, cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 5 }, tableIcon: { width: 39, height: 39, borderRadius: 11, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, tableIconMuted: { backgroundColor: colors.background }, status: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 11, paddingHorizontal: 7, paddingVertical: 6, maxWidth: '70%' }, statusAvailable: { backgroundColor: colors.accentSoft }, statusBusy: { backgroundColor: '#FBF2E6' }, statusDot: { width: 6, height: 6, borderRadius: 3 }, statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize', flexShrink: 1 }, cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' }, cardName: { color: colors.muted, fontSize: 12, marginTop: 3 }, cardMeta: { color: colors.muted, fontSize: 12 }, cardActions: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, gap: 7 }, orderAction: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, orderText: { color: colors.accent, fontSize: 13, fontWeight: '700' }, manageActions: { flexDirection: 'row', alignItems: 'center', gap: 14 }, textAction: { minHeight: 32, justifyContent: 'center' }, editText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, deleteText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
});
