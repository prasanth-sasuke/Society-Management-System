import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiRequest, setAuthToken, setUnauthorizedHandler } from '../api/client';
import { endpoints } from '../api/endpoints';

const TOKEN_KEY = 'sos.token';
const SESSION_KEY = 'sos.session';

const AuthContext = createContext(null);

export function useSession() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}

async function saveSession(token, session) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

async function clearSaved() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

function pickSession(data) {
  return { user: data.user, permissions: data.permissions || {}, scope: data.scope || null };
}

export function SessionProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState(null);

  const signOut = useCallback(async (message = null) => {
    setAuthToken(null);
    setSession(null);
    setNotice(message);
    await clearSaved();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => signOut('Your session has expired. Please sign in again.'));
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Open the app straight away with the saved session, then confirm it with the server in the background.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let token = null;
      try {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
        const saved = await SecureStore.getItemAsync(SESSION_KEY);
        if (token && saved && !cancelled) {
          setAuthToken(token);
          setSession(JSON.parse(saved));
        }
      } catch {
        await clearSaved().catch(() => {});
        token = null;
      } finally {
        if (!cancelled) setIsLoading(false);
      }
      if (!token || cancelled) return;
      try {
        const fresh = pickSession(await apiRequest(endpoints.me));
        if (cancelled) return;
        setSession(fresh);
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(fresh));
      } catch {
        // A 401 signs out via the unauthorized handler; offline keeps the saved session.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const data = await apiRequest(endpoints.login, { method: 'POST', body: { email, password }, auth: false });
    const next = pickSession(data);
    setAuthToken(data.token);
    await saveSession(data.token, next);
    setNotice(null);
    setSession(next);
  }, []);

  const value = useMemo(() => ({ isLoading, session, notice, signIn, signOut }), [isLoading, session, notice, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
