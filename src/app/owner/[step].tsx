import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { messageOf, post, Session } from '../../api/client';
import { OwnerAuthShell } from '../../components/OwnerAuthShell';
import { useAuth } from '../../store/auth';
import { useOnboarding } from '../../store/onboarding';
import { Field } from '../../ui/Kit';
import { colors } from '../../theme/colors';
import { PhoneField } from '../../ui/PhoneField';
import { Icon } from '../../ui/Icon';

const ownerImage = require('../../../assets/restaurant_owner_illustration.png');

function AuthSubmitButton({ label, busy, onPress }: { label: string; busy: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" disabled={busy} onPress={onPress} style={({ pressed }) => [authStyles.submit, (pressed || busy) && authStyles.pressed]}>
    {busy ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={authStyles.submitText}>{label}</Text><View style={authStyles.submitArrow}><Icon name="chevron" size={20} color="#FFFFFF" /></View></>}
  </Pressable>;
}

const titles: Record<string, string> = { 'verify-email': 'Verify your email', 'set-password': 'Create a password', 'verify-login': 'Verify sign in', 'forgot-password': 'Reset password', 'reset-password': 'Set new password' };
export default function OwnerStep() {
  const { step } = useLocalSearchParams<{ step: string }>(); const flow = useOnboarding(); const accept = useAuth((s) => s.accept);
  const { width } = useWindowDimensions();
  const [values, setValues] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const v = (name: string) => values[name] || ''; const change = (name: string) => (value: string) => setValues((old) => ({ ...old, [name]: value }));
  const field = (name: string, label: string, opts: { secure?: boolean; keyboard?: 'email-address' | 'phone-pad' | 'numeric'; auto?: 'email' } = {}) => <Field key={name} label={label} value={v(name)} onChangeText={change(name)} autoCapitalize="none" secureTextEntry={opts.secure} keyboardType={opts.keyboard} autoComplete={opts.auto}/>;
  async function submit() {
    setError(''); setBusy(true);
    try {
      if (step === 'register') {
        const required = ['firstName','lastName','email','phoneCountryCode','phone','name','businessType','address','city','state','postalCode'];
        if (required.some((key) => !v(key).trim())) throw new Error('Please complete every required field.');
        const data = await post<{ username: string }>('/auth/owner/register', { owner: { firstName: v('firstName').trim(), lastName: v('lastName').trim(), email: v('email').trim(), phoneCountryCode: v('phoneCountryCode'), phone: v('phone').trim() }, restaurant: { name: v('name').trim(), businessType: v('businessType').trim(), address: v('address').trim(), city: v('city').trim(), state: v('state').trim(), postalCode: v('postalCode').trim(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } });
        flow.set({ username: data.username }); router.replace('/owner/verify-email');
      } else if (step === 'verify-email') { const data = await post<{ setupToken: string }>('/auth/owner/verify-email', { username: flow.username, code: v('code') }); flow.set({ setupToken: data.setupToken }); router.replace('/owner/set-password'); }
      else if (step === 'set-password') { if (v('password').length < 12 || v('password') !== v('confirm')) throw new Error('Use at least 12 characters and matching passwords.'); const session = await post<Session>('/auth/owner/set-password', { username: flow.username, password: v('password'), setupToken: flow.setupToken }); await accept(session); router.replace('/(main)'); }
      else if (step === 'login') { const data = await post<{ loginChallenge: string }>('/auth/owner/login', { username: v('username').trim().toUpperCase(), password: v('password') }); flow.set({ username: v('username').trim().toUpperCase(), loginChallenge: data.loginChallenge }); router.replace('/owner/verify-login'); }
      else if (step === 'verify-login') { const session = await post<Session>('/auth/owner/verify-login', { username: flow.username, code: v('code'), loginChallenge: flow.loginChallenge }); await accept(session); router.replace('/(main)'); }
      else if (step === 'forgot-password') { await post('/auth/owner/forgot-password', { usernameOrEmail: v('usernameOrEmail') }); Alert.alert('Check your email', 'If the account exists, a reset code has been sent.'); router.replace('/owner/reset-password'); }
      else if (step === 'reset-password') { if (v('password').length < 12 || v('password') !== v('confirm')) throw new Error('Use at least 12 characters and matching passwords.'); await post('/auth/owner/reset-password', { username: v('username').toUpperCase(), code: v('code'), password: v('password') }); Alert.alert('Password updated', 'Sign in with your new password.'); router.replace('/owner/login'); }
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  if (step === 'login') return <OwnerAuthShell title="Welcome back" subtitle="Sign in to manage your restaurant.">
    <View style={[authStyles.formCard, authStyles.loginCard]}>
      <View style={authStyles.loginCardHeading}><View style={authStyles.headingCopy}><Text style={authStyles.sectionTitle}>Restaurant owner</Text><Text style={authStyles.sectionSubtitle}>Enter your owner credentials to continue.</Text></View><Image source={ownerImage} style={authStyles.ownerImage} resizeMode="contain" /></View>
      {field('username','Username')}
      {field('password','Password',{secure:true})}
      <Pressable accessibilityRole="button" onPress={() => router.push('/owner/forgot-password')} style={authStyles.forgot}><Text style={authStyles.linkText}>Forgot password?</Text></Pressable>
      {!!error && <Text style={authStyles.error}>{error}</Text>}
      <AuthSubmitButton label="Sign in" busy={busy} onPress={submit} />
    </View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/owner/register')} style={authStyles.createLink}><View style={authStyles.createInner}><View style={authStyles.createIcon}><Icon name="plus" size={19} color={colors.accent} /></View><View style={authStyles.createCopy}><Text style={authStyles.createTitle}>Create a restaurant account</Text><Text style={authStyles.createSubtitle}>Register a new restaurant and get started.</Text></View></View></Pressable>
  </OwnerAuthShell>;

  if (step === 'register') return <OwnerAuthShell title="Create a restaurant account" subtitle="Set up your restaurant and owner profile to get started.">
    <View style={authStyles.formCard}>
      <Text style={authStyles.sectionTitle}>Your details</Text>
      <Text style={authStyles.sectionSubtitle}>Tell us who will manage the restaurant.</Text>
      <View style={[authStyles.fieldRow, width < 430 && authStyles.stackedRow]}><View style={[authStyles.rowField, width < 430 && authStyles.stackedField]}>{field('firstName','First name')}</View><View style={[authStyles.rowField, width < 430 && authStyles.stackedField]}>{field('lastName','Last name')}</View></View>
      {field('email','Email',{keyboard:'email-address',auto:'email'})}
      <PhoneField label="Mobile number" countryCode={v('phoneCountryCode')} onCountryChange={change('phoneCountryCode')} number={v('phone')} onNumberChange={change('phone')}/>
    </View>
    <View style={authStyles.formCard}>
      <Text style={authStyles.sectionTitle}>Restaurant details</Text>
      <Text style={authStyles.sectionSubtitle}>Add the details for your new workspace.</Text>
      {field('name','Restaurant name')}
      {field('businessType','Business type')}
      {field('address','Address')}
      <View style={[authStyles.fieldRow, width < 430 && authStyles.stackedRow]}><View style={[authStyles.rowField, width < 430 && authStyles.stackedField]}>{field('city','City')}</View><View style={[authStyles.rowField, width < 430 && authStyles.stackedField]}>{field('state','State / province')}</View></View>
      {field('postalCode','Postal code')}
      <Text style={authStyles.note}>Country, currency and locale follow your selected phone country. Timezone uses your device settings.</Text>
    </View>
    {!!error && <Text style={authStyles.error}>{error}</Text>}
    <AuthSubmitButton label="Create restaurant account" busy={busy} onPress={submit} />
    <View style={authStyles.signInRow}><Text style={authStyles.signInText}>Already have an account?</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/owner/login')}><Text style={authStyles.linkText}>Sign in</Text></Pressable></View>
  </OwnerAuthShell>;
  return <OwnerAuthShell title={titles[step] || 'Owner account'} subtitle={step?.includes('verify') ? `Enter the 6-digit code sent to your email. ${flow.username ? `Account: ${flow.username}` : ''}` : 'Secure your restaurant account.'}>
    <View style={authStyles.formCard}>
      {(step === 'verify-email' || step === 'verify-login') && field('code','6-digit code',{keyboard:'numeric'})}
      {(step === 'set-password' || step === 'reset-password') && <>{step === 'reset-password' && <>{field('username','Username')}{field('code','Reset code',{keyboard:'numeric'})}</>}{field('password','New password',{secure:true})}{field('confirm','Confirm password',{secure:true})}</>}
      {step === 'forgot-password' && field('usernameOrEmail','Username or email')}
      {!!error && <Text style={authStyles.error}>{error}</Text>}
      <AuthSubmitButton label={step === 'forgot-password' ? 'Send reset code' : step === 'set-password' || step === 'reset-password' ? 'Save password' : 'Verify and continue'} onPress={submit} busy={busy} />
    </View>
    {step === 'verify-email' && <Pressable accessibilityRole="button" onPress={async () => { try { await post('/auth/owner/resend-code', { username: flow.username }); Alert.alert('Code sent', 'Check your email.'); } catch(e) { setError(messageOf(e)); } }} style={authStyles.resend}><Text style={authStyles.linkText}>Resend code</Text></Pressable>}
  </OwnerAuthShell>;
}

const authStyles = StyleSheet.create({
  formCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DAE8E3', borderRadius: 20, padding: 20, gap: 14, marginBottom: 18, shadowColor: '#0B3B2C', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  loginCard: { backgroundColor: '#F0FAF7', borderColor: '#B2DAD0' },
  loginCardHeading: { flexDirection: 'row', alignItems: 'center', minHeight: 68, marginBottom: 5 },
  headingCopy: { flex: 1, minWidth: 0, gap: 4 },
  ownerImage: { width: 64, height: 64, marginLeft: 8, flexShrink: 0 },
  sectionTitle: { color: '#082B2A', fontSize: 21, lineHeight: 27, fontWeight: '800' },
  sectionSubtitle: { color: '#758590', fontSize: 14, lineHeight: 20 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  stackedRow: { flexDirection: 'column' },
  rowField: { flex: 1, minWidth: 0 },
  stackedField: { flex: 0, width: '100%' },
  forgot: { alignSelf: 'flex-end', paddingVertical: 3 },
  linkText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  submit: { minHeight: 54, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 44, marginTop: 4 },
  submitText: { color: '#FFFFFF', fontSize: 16, lineHeight: 21, fontWeight: '800', textAlign: 'center' },
  submitArrow: { position: 'absolute', right: 18, top: 0, bottom: 0, justifyContent: 'center' },
  pressed: { opacity: 0.75 },
  createLink: { minHeight: 88, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.accent, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF' },
  createInner: { width: '100%', maxWidth: 305, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  createIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  createCopy: { flexShrink: 1, minWidth: 0 },
  createTitle: { color: colors.accent, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  createSubtitle: { color: '#758590', fontSize: 12, lineHeight: 17, marginTop: 3 },
  note: { color: '#758590', fontSize: 12, lineHeight: 18 },
  signInRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 3 },
  signInText: { color: '#758590', fontSize: 14 },
  resend: { alignSelf: 'center', padding: 10 },
});
