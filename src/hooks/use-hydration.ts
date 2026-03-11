'use client';

import { useSyncExternalStore, useCallback } from 'react';

/**
 * Hook para verificar se o Zustand já foi hidratado do localStorage
 * Necessário para evitar problemas de hidratação no SSR
 */
export function useHydration() {
  const subscribe = useCallback((callback: () => void) => {
    // Não precisa de subscrição real para hidratação
    return () => {};
  }, []);

  const getSnapshot = useCallback(() => {
    // Retorna true apenas no cliente após montagem
    return true;
  }, []);

  const getServerSnapshot = useCallback(() => {
    // No servidor, sempre retorna false
    return false;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
