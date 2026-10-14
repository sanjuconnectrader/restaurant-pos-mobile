import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { del, get, messageOf, patch, post, User } from '../api/client';
import { useLive } from '../hooks/useLive';
import { useAuth } from '../store/auth';
import { colors } from '../theme/colors';
import { Button, Card, Chip, Field, State } from './Kit';
import { PhoneField } from './PhoneField';

type Member = User & { designation: string; phone?: string; phoneCountryCode?: string; tags?: string[] };
const teamImage = require('../../assets/team_member_illustration.png');
const roles = ['MANAGER', 'CASHIER', 'WAITER', 'KITCHEN'];
const tagOptions = ['WAITER', 'KITCHEN', 'CHEF', 'BILLER'];

export function TeamManager() {
  const { data, loading, error, refresh } = useLive(useCallback(() => get<Member[]>('/employees'), []), [] as Member[]);
  const myId = useAuth((state) => state.me?.user.id);
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 720) - 40;
  const cardWidth = contentWidth >= 600 ? (contentWidth - 12) / 2 : contentWidth;
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState('WAITER');
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  function openForm(member?: Member) {
    setEditing(member?.id || null); setFirst(member?.firstName || ''); setLast(member?.lastName || '');
    setEmail(member?.email || ''); setPhoneCountry(member?.phoneCountryCode || '');
    setPhone(member?.phone || ''); setDesignation(member?.designation || '');
    setRole(member?.role || 'WAITER'); setTags(member?.tags || []); setForm(true);
  }
  function closeForm() { setForm(false); setEditing(null); }
  async function save() {
    if (!first.trim() || !last.trim() || !designation.trim()) return;
    setBusy(true);
    try {
      const values = { firstName: first.trim(), lastName: last.trim(), email: email.trim() || null, phone: phone.trim() || null, phoneCountryCode: phoneCountry || undefined, designation: designation.trim(), role, tags };
      if (editing) await patch(`/employees/${editing}`, values);
      else {
        const result = await post<{ user: User; initialPin: string }>('/employees', values);
        Alert.alert('Team member added', `Username: ${result.user.username}\nInitial PIN: ${result.initialPin}\nShare this PIN privately. It is shown only once.`);
      }
      closeForm(); await refresh();
    } catch (error) { Alert.alert('Could not save team member', messageOf(error)); }
    finally { setBusy(false); }
  }
  function deleteMember(member: Member) {
    Alert.alert('Delete team member?', `${member.firstName} ${member.lastName} will lose access and be removed from your team. Past orders and records will remain.`, [
      { text: 'Keep member', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(member.id);
        try { await del(`/employees/${member.id}`); setViewing(null); await refresh(); }
        catch (error) { Alert.alert('Could not delete team member', messageOf(error)); }
        finally { setDeleting(null); }
      } },
    ]);
  }
  async function update(member: Member, changes: object) {
    try { await patch(`/employees/${member.id}`, changes); await refresh(); }
    catch (error) { Alert.alert('Could not update team member', messageOf(error)); }
  }
  function resetPin(member: Member) {
    Alert.alert('Reset PIN?', `This will replace the PIN for ${member.firstName}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: async () => {
        try { const result = await post<{ initialPin: string }>(`/employees/${member.id}/reset-pin`); Alert.alert('New PIN', result.initialPin); }
        catch (error) { Alert.alert('Could not reset PIN', messageOf(error)); }
      } },
    ]);
  }

  return <>
    <View style={styles.heading}><View style={{ flex: 1 }}><Text style={styles.headingTitle}>Your team</Text><Text style={styles.hint}>{data.length} {data.length === 1 ? 'member' : 'members'} in this restaurant</Text></View>{data.length > 0 && <Button label="Add member" icon="plus" onPress={() => openForm()}/>}</View>
    {form && <Card style={styles.formCard}>
      <Text style={styles.formTitle}>{editing ? 'Edit team member' : 'Add team member'}</Text>
      <Text style={styles.hint}>Enter the details used for their staff account.</Text>
      <View style={styles.nameRow}><View style={styles.nameField}><Field label="First name" value={first} onChangeText={setFirst} autoCapitalize="words"/></View><View style={styles.nameField}><Field label="Last name" value={last} onChangeText={setLast} autoCapitalize="words"/></View></View>
      <Field label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
      <PhoneField label="Mobile number" optional countryCode={phoneCountry} onCountryChange={setPhoneCountry} number={phone} onNumberChange={setPhone}/>
      <Field label="Designation" value={designation} onChangeText={setDesignation} placeholder="e.g. Server" autoCapitalize="words" maxLength={255}/>
      <Text style={styles.detailLabel}>ACCESS ROLE</Text>
      <Text style={styles.hint}>Choose one permission level for this account.</Text>
      <View style={styles.roles}>{roles.map((option) => <Chip key={option} label={option.toLowerCase()} selected={role === option} onPress={() => setRole(option)}/>)}</View>
      <Text style={styles.detailLabel}>DISPLAY TAGS</Text>
      <Text style={styles.hint}>Select any labels to show on this member’s card. Tags do not change access.</Text>
      <View style={styles.roles}>{tagOptions.map((tag) => <Chip key={tag} label={tag.toLowerCase()} selected={tags.includes(tag)} onPress={() => setTags((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag])}/>)}</View>
      <View style={styles.formActions}><View style={styles.actionHalf}><Button label="Cancel" variant="secondary" onPress={closeForm}/></View><View style={styles.actionHalf}><Button label={editing ? 'Save changes' : 'Create member'} loading={busy} disabled={!first.trim() || !last.trim() || !designation.trim()} onPress={save}/></View></View>
    </Card>}
    {loading || error ? <State loading={loading} error={error} retry={refresh}/> : !data.length && !form ? <View style={styles.empty}><Image source={teamImage} resizeMode="contain" style={styles.emptyImage} accessibilityLabel="Restaurant team illustration"/><Text style={styles.emptyTitle}>Build your team</Text><Text style={styles.emptyCopy}>No team members have been added yet. Add your first teammate to help run service.</Text><Button label="Add Team Member" icon="plus" onPress={() => openForm()}/></View> : <View style={styles.grid}>
      {data.map((member) => <View key={member.id} style={[styles.memberCard, { width: cardWidth }]}>
        <View style={styles.memberTop}><View style={styles.avatar}><Text style={styles.avatarText}>{(member.firstName[0] || '').toUpperCase()}{(member.lastName[0] || '').toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.memberName}>{member.firstName} {member.lastName}</Text><Text numberOfLines={1} style={styles.memberRole}>{member.designation}</Text></View><View style={styles.status}><Text style={styles.statusText}>{member.active === false ? 'Inactive' : 'Active'}</Text></View></View>
        <View style={styles.meta}><Text numberOfLines={1} style={styles.username}>@{member.username}</Text><Text style={styles.role}>{member.role.toLowerCase()}</Text></View>
        {!!member.tags?.length && <View style={styles.roles}>{member.tags.map((tag) => <Chip key={tag} label={tag.toLowerCase()} selected/>)}</View>}
        {viewing === member.id && <View style={styles.details}><Text style={styles.detailLabel}>CONTACT</Text><Text style={styles.detailValue}>{member.email || 'No email added'}</Text>{!!member.phone && <Text style={styles.detailValue}>{member.phone}</Text>}<Text style={styles.detailLabel}>ACCESS ROLE</Text><View style={styles.roles}>{roles.map((option) => <Chip key={option} label={option.toLowerCase()} selected={member.role === option} onPress={() => { if (member.role !== option) Alert.alert('Change role?', `${member.firstName} will have ${option.toLowerCase()} permissions.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Change', onPress: () => update(member, { role: option }) }]); }}/>)}</View><Button label="Reset PIN" variant="secondary" onPress={() => resetPin(member)}/><Button label={member.active === false ? 'Activate' : 'Deactivate'} variant="secondary" onPress={() => update(member, { active: member.active === false })}/></View>}
        <View style={styles.actions}><Pressable accessibilityRole="button" onPress={() => setViewing(viewing === member.id ? null : member.id)} style={styles.action}><Text style={styles.actionText}>{viewing === member.id ? 'Hide' : 'View'}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => openForm(member)} style={styles.action}><Text style={styles.actionText}>Edit</Text></Pressable><Pressable accessibilityRole="button" disabled={member.id === myId || deleting === member.id} onPress={() => deleteMember(member)} style={styles.action}><Text style={[styles.deleteText, member.id === myId && styles.disabled]}>{deleting === member.id ? 'Deleting' : 'Delete'}</Text></Pressable></View>
      </View>)}
    </View>}
  </>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, headingTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' }, hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  formCard: { borderRadius: 18, padding: 18, gap: 14 }, formTitle: { color: colors.ink, fontSize: 19, fontWeight: '700' }, nameRow: { flexDirection: 'row', gap: 10 }, nameField: { flex: 1 }, formActions: { flexDirection: 'row', gap: 10 }, actionHalf: { flex: 1 },
  empty: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 28, gap: 12 }, emptyImage: { width: 210, height: 180 }, emptyTitle: { color: colors.ink, fontSize: 22, fontWeight: '700', textAlign: 'center' }, emptyCopy: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 300 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, memberCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 13 }, memberTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.accent, fontSize: 14, fontWeight: '800' }, memberName: { color: colors.ink, fontSize: 15, fontWeight: '700' }, memberRole: { color: colors.muted, fontSize: 12, marginTop: 3 }, status: { backgroundColor: colors.accentSoft, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 }, statusText: { color: colors.accent, fontSize: 10, fontWeight: '700' }, meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, username: { color: colors.muted, fontSize: 12, flex: 1 }, role: { color: colors.accent, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }, details: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 9 }, detailLabel: { color: colors.muted, fontSize: 10, letterSpacing: 1, fontWeight: '800' }, detailValue: { color: colors.ink, fontSize: 13 }, roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }, action: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center' }, actionText: { color: colors.accent, fontSize: 13, fontWeight: '700' }, deleteText: { color: colors.danger, fontSize: 13, fontWeight: '700' }, disabled: { opacity: 0.4 },
});
