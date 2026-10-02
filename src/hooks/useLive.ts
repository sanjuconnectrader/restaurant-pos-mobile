import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { messageOf } from '../api/client';
import { useAuth } from '../store/auth';
import { subscribeLive } from '../services/live';
export function useLive<T>(load: () => Promise<T>, initial: T, watch = true, enabled = true) {
  const [data, setData] = useState<T>(initial); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const refresh = useCallback(async () => { try { setError(''); setData(await load()); } catch(e) { setError(messageOf(e)); } finally { setLoading(false); } }, [load]);
  useFocusEffect(useCallback(() => { if (enabled) void refresh(); }, [enabled, refresh]));
  const me = useAuth((s) => s.me);
  useEffect(() => {
    if (!watch || !enabled || !me) return;
    return subscribeLive(refresh);
  }, [enabled, me, refresh, watch]);
  return { data, loading, error, refresh };
}
