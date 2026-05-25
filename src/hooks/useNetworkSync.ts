import { useState, useEffect, useCallback } from 'react';
import * as Network from 'expo-network';
import { syncQueue } from '../utils/syncService';

export const useNetworkSync = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const checkAndSync = useCallback(async () => {
    const state = await Network.getNetworkStateAsync();
    const connected = state.isConnected && state.isInternetReachable ? true : false;
    setIsConnected(connected);

    if (connected && !isSyncing) {
      setIsSyncing(true);
      try {
        await syncQueue();
        setLastSyncTime(new Date());
      } catch (e) {
        console.warn('Sync error:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [isSyncing]);

  useEffect(() => {
    checkAndSync();
    const interval = setInterval(checkAndSync, 30000);
    return () => clearInterval(interval);
  }, [checkAndSync]);

  return { isConnected, isSyncing, lastSyncTime, checkAndSync };
};
