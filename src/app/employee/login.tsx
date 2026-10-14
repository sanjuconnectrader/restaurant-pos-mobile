import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { messageOf, post, Session } from '../../api/client';
import { OwnerAuthShell } from '../../components/OwnerAuthShell';
import { useAuth } from '../../store/auth';
import { Field } from '../../ui/Kit';
import { Icon } from '../../ui/Icon';
import { colors } from '../../theme/colors';

const teamImage = require('../../../assets/team_member_illustration.png');

export default function EmployeeLogin() {
  const [username, setUsername] = useState(''); const [pin, setPin] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const accept = useAuth((s) => s.accept);
  async function login() { setBusy(true); setError(''); try { const session = await post<Session>('/auth/employee/login', { username: username.trim().toUpperCase(), pin }); await accept(session); router.replace('/(main)'); } catch(e) { setError(messageOf(e)); } finally { setBusy(false); } }
  return <OwnerAuthShell title="Welcome back" subtitle="Sign in to your restaurant team.">
    <View style={styles.card}>
      <View style={styles.cardHeading}>
        <View style={styles.headingCopy}>
          <Text style={styles.sectionTitle}>Team member</Text>
          <Text style={styles.sectionSubtitle}>Use the username and PIN provided by your manager.</Text>
        </View>
        <Image source={teamImage} style={styles.teamImage} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>
      <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="characters" />
      <Field label="PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={8} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable accessibilityRole="button" disabled={busy} onPress={login} style={({ pressed }) => [styles.submit, (pressed || busy) && styles.pressed]}>
        {busy ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.submitText}>Sign in</Text><View style={styles.submitArrow}><Icon name="chevron" size={20} color="#FFFFFF" /></View></>}
      </Pressable>
    </View>
  </OwnerAuthShell>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DAE8E3', borderRadius: 20, padding: 20, gap: 14, shadowColor: '#0B3B2C', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', minHeight: 72, marginBottom: 5 },
  headingCopy: { flex: 1, minWidth: 0, gap: 4 },
  teamImage: { width: 68, height: 68, marginLeft: 8, flexShrink: 0 },
  sectionTitle: { color: '#082B2A', fontSize: 21, lineHeight: 27, fontWeight: '800' },
  sectionSubtitle: { color: '#758590', fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  submit: { minHeight: 54, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 44, marginTop: 4 },
  submitText: { color: '#FFFFFF', fontSize: 16, lineHeight: 21, fontWeight: '800', textAlign: 'center' },
  submitArrow: { position: 'absolute', right: 18, top: 0, bottom: 0, justifyContent: 'center' },
  pressed: { opacity: 0.75 },
});
