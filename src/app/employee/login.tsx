import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { messageOf, post, Session } from '../../api/client';
import { useAuth } from '../../store/auth';
import { Button, Card, Field, Screen } from '../../ui/Kit';
import { colors } from '../../theme/colors';
export default function EmployeeLogin() {
  const [username, setUsername] = useState(''); const [pin, setPin] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const accept = useAuth((s) => s.accept);
  async function login() { setBusy(true); setError(''); try { const session = await post<Session>('/auth/employee/login', { username: username.trim().toUpperCase(), pin }); await accept(session); router.replace('/(main)'); } catch(e) { setError(messageOf(e)); } finally { setBusy(false); } }
  return <Screen title="Team sign in" subtitle="Use the username and PIN provided by your manager." back><Card><Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="characters"/><Field label="PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={8}/>{!!error && <Text style={{ color:colors.danger }}>{error}</Text>}<Button label="Sign in" loading={busy} onPress={login}/></Card></Screen>;
}
