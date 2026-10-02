import { create } from 'zustand';
import { clearSession, get, getAccessToken, getRefreshToken, loadSession, Me, revokeSession, saveSession, Session, setExpiredHandler } from '../api/client';

type LoginRoute = '/owner/login' | '/employee/login' | null;
type AuthState = { ready: boolean; me: Me | null; loginRoute: LoginRoute; accept: (session: Session) => Promise<void>; restore: () => Promise<void>; signOut: () => Promise<void>; can: (permission: string) => boolean };
export const useAuth = create<AuthState>((set, getState) => ({
  ready: false, me: null, loginRoute: null,
  can: (permission) => !!getState().me?.permissions.includes(permission),
  accept: async (session) => { await saveSession(session); const me = await get<Me>('/auth/me'); set({ me, ready: true, loginRoute: null }); },
  restore: async () => {
    try { if (await loadSession()) set({ me: await get<Me>('/auth/me') }); }
    catch { await clearSession(); set({ me: null }); }
    finally { set({ ready: true }); }
  },
  signOut: async () => {
    const role = getState().me?.user.role;
    const access = getAccessToken();
    const refresh = getRefreshToken();
    set({ me: null, ready: true, loginRoute: role === 'OWNER' ? '/owner/login' : '/employee/login' });
    try { await clearSession(); } catch { /* navigation still completes if device storage fails */ }
    if (access && refresh) void revokeSession(access, refresh).catch(() => {});
  },
}));
setExpiredHandler(() => {
  const role = useAuth.getState().me?.user.role;
  useAuth.setState({ me: null, ready: true, loginRoute: role === 'OWNER' ? '/owner/login' : role ? '/employee/login' : null });
});
