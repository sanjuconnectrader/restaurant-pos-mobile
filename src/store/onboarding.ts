import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
type Onboarding = { username: string; setupToken: string; loginChallenge: string; set: (part: Partial<Omit<Onboarding, 'set'>>) => void };
export const useOnboarding = create<Onboarding>((set) => ({ username: '', setupToken: '', loginChallenge: '', set: (part) => set(part) }));
const pendingKey = 'pos_pending_owner_username';
export type PendingRegistration = { username: string; email: string; recoveryToken: string };
export async function rememberPendingRegistration(pending: PendingRegistration) {
  const previous = await loadPendingRegistration();
  const recoveryToken = pending.recoveryToken || (previous?.username === pending.username ? previous.recoveryToken : '');
  await SecureStore.setItemAsync(pendingKey, JSON.stringify({ ...pending, recoveryToken }));
}
export async function loadPendingRegistration(): Promise<PendingRegistration | null> {
  const raw = await SecureStore.getItemAsync(pendingKey);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'username' in parsed && typeof parsed.username === 'string') {
      return { username: parsed.username, email: 'email' in parsed && typeof parsed.email === 'string' ? parsed.email : '', recoveryToken: 'recoveryToken' in parsed && typeof parsed.recoveryToken === 'string' ? parsed.recoveryToken : '' };
    }
  }
  catch { return { username: raw, email: '', recoveryToken: '' }; }
  return { username: raw, email: '', recoveryToken: '' };
}
export const forgetPendingRegistration = () => SecureStore.deleteItemAsync(pendingKey);
