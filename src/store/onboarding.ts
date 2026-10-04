import { create } from 'zustand';
type Onboarding = { username: string; setupToken: string; loginChallenge: string; set: (part: Partial<Omit<Onboarding, 'set'>>) => void };
export const useOnboarding = create<Onboarding>((set) => ({ username: '', setupToken: '', loginChallenge: '', set: (part) => set(part) }));
