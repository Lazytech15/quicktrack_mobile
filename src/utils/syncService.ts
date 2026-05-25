import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSyncQueue, updateSyncQueueItem, markLogSynced } from '../db/queries';

const API_BASE_URL_KEY = 'api_base_url';
const DEFAULT_API_URL = 'https://api.yourcompany.com/v1';

export const getApiUrl = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(API_BASE_URL_KEY);
  return stored ?? DEFAULT_API_URL;
};

export const setApiUrl = async (url: string): Promise<void> => {
  await AsyncStorage.setItem(API_BASE_URL_KEY, url);
};

export const syncQueue = async (): Promise<{ synced: number; failed: number }> => {
  const queue = getSyncQueue();
  let synced = 0;
  let failed = 0;

  if (queue.length === 0) return { synced, failed };

  const apiUrl = await getApiUrl();

  for (const item of queue as Array<{
    id: number; table_name: string; record_id: number; operation: string; payload: string;
  }>) {
    try {
      const endpoint = `${apiUrl}/${item.table_name.replace('_', '-')}`;
      const method = item.operation === 'INSERT' ? 'POST' : 'PUT';
      const url = item.operation === 'UPDATE'
        ? `${endpoint}/${item.record_id}`
        : endpoint;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: item.payload,
      });

      if (response.ok) {
        updateSyncQueueItem(item.id, 'completed');
        if (item.table_name === 'equipment_logs') {
          markLogSynced(item.record_id);
        }
        synced++;
      } else {
        updateSyncQueueItem(item.id, 'failed');
        failed++;
      }
    } catch {
      updateSyncQueueItem(item.id, 'failed');
      failed++;
    }
  }

  return { synced, failed };
};

export const getTechnicianName = async (): Promise<string> => {
  const name = await AsyncStorage.getItem('technician_name');
  return name ?? 'Field Technician';
};

export const setTechnicianName = async (name: string): Promise<void> => {
  await AsyncStorage.setItem('technician_name', name);
};
