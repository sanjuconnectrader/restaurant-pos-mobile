import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { messageOf, post, Session } from '../../api/client';
import { useAuth } from '../../store/auth';
import { useOnboarding } from '../../store/onboarding';
import { Button, Card, Field, Screen } from '../../ui/Kit';
import { colors } from '../../theme/colors';
import { PhoneField } from '../../ui/PhoneField';

const titles: Record<string, string> = { login: 'Owner sign in', register: 'Create your account', 'verify-email': 'Verify your email', 'set-password': 'Create a password', 'verify-login': 'Verify sign in', 'forgot-password': 'Reset password', 'reset-password': 'Set new password' };
export default function OwnerStep() {
  const { step } = useLocalSearchParams<{ step: string }>(); const flow = useOnboarding(); const accept = useAuth((s) => s.accept);
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
  return <Screen title={titles[step] || 'Owner account'} subtitle={step === 'register' ? 'Set up your restaurant to get started.' : step === 'login' ? 'Sign in with your owner username and password.' : step?.includes('verify') ? `Enter the 6-digit code sent to your email. ${flow.username ? `Account: ${flow.username}` : ''}` : undefined} back>
    <Card>
      {step === 'register' && <>{field('firstName','First name')}{field('lastName','Last name')}{field('email','Email',{keyboard:'email-address',auto:'email'})}<PhoneField label="Mobile number" countryCode={v('phoneCountryCode')} onCountryChange={change('phoneCountryCode')} number={v('phone')} onNumberChange={change('phone')}/><Text style={{ fontWeight:'700',color:colors.ink,marginTop:8 }}>Restaurant details</Text>{field('name','Restaurant name')}{field('businessType','Business type')}{field('address','Address')}{field('city','City')}{field('state','State / province')}{field('postalCode','Postal code')}<Text style={{color:colors.muted,fontSize:12}}>Country, currency and locale use the selected phone country. Timezone uses the device settings.</Text></>}
      {step === 'login' && <>{field('username','Username')}{field('password','Password',{secure:true})}</>}
      {(step === 'verify-email' || step === 'verify-login') && field('code','6-digit code',{keyboard:'numeric'})}
      {(step === 'set-password' || step === 'reset-password') && <>{step === 'reset-password' && <>{field('username','Username')}{field('code','Reset code',{keyboard:'numeric'})}</>}{field('password','New password',{secure:true})}{field('confirm','Confirm password',{secure:true})}</>}
      {step === 'forgot-password' && field('usernameOrEmail','Username or email')}
      {!!error && <Text style={{ color:colors.danger }}>{error}</Text>}
      <Button label={step === 'register' ? 'Create account' : step === 'login' ? 'Continue' : step === 'forgot-password' ? 'Send reset code' : step === 'set-password' || step === 'reset-password' ? 'Save password' : 'Verify and continue'} onPress={submit} loading={busy}/>
    </Card>
    {step === 'login' && <View style={{ gap: 4 }}><Button label="Forgot password?" variant="text" onPress={() => router.push('/owner/forgot-password')}/><Button label="Create an account" variant="text" onPress={() => router.push('/owner/register')}/></View>}
    {step === 'verify-email' && <Button label="Resend code" variant="text" onPress={async () => { try { await post('/auth/owner/resend-code', { username: flow.username }); Alert.alert('Code sent', 'Check your email.'); } catch(e) { setError(messageOf(e)); } }}/ >}
  </Screen>;
}
