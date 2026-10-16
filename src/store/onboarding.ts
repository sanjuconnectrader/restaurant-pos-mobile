import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
type Onboarding = { username: string; setupToken: string; loginChallenge: string; set: (part: Partial<Omit<Onboarding, 'set'>>) => void };
export const useOnboarding = create<Onboarding>((set) => ({ username: '', setupToken: '', loginChallenge: '', set: (part) => set(part) }));
const pendingKey = 'pos_pending_owner_username';
export const rememberPendingUsername = (username: string) => SecureStore.setItemAsync(pendingKey, username);
export const loadPendingUsername = () => SecureStore.getItemAsync(pendingKey);
export const forgetPendingUsername = () => SecureStore.deleteItemAsync(pendingKey);
