import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { isAuthenticated, getStoredUserId, registerDevice } from '../services/api';
import { usageTrackingService } from '../services/usageTrackingService';

interface AuthState {
  isReady: boolean;
  isLoggedIn: boolean;
  userId: string | null;
  deviceId: string | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isReady: false,
  isLoggedIn: false,
  userId: null,
  deviceId: null,
  refreshAuth: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isReady: false,
    isLoggedIn: false,
    userId: null,
    deviceId: null,
    refreshAuth: async () => {},
  });

  const refreshAuth = useCallback(async () => {
    try {
      const authed = await isAuthenticated();
      if (authed) {
        const userId = await getStoredUserId();
        const deviceResult = await registerDevice();
        await usageTrackingService.ensureBackgroundTrackingScheduled();
        setState(prev => ({
          ...prev,
          isReady: true,
          isLoggedIn: true,
          userId,
          deviceId: deviceResult.deviceId || null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isReady: true,
          isLoggedIn: false,
          userId: null,
          deviceId: null,
        }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        isReady: true,
        isLoggedIn: false,
        userId: null,
        deviceId: null,
      }));
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{ ...state, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
