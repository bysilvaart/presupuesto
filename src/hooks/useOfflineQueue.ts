import { useEffect, useState } from 'react';
import { budgetDB, OfflineQueueItem } from '@/db/dexie';

const flushQueue = async () => {
  const pending = await budgetDB.offlineQueue.where('status').equals('pending').toArray();
  for (const item of pending) {
    // TODO: reemplazar por sincronización real con backend
    await budgetDB.offlineQueue.update(item.id!, { status: 'synced' });
  }
};

export const useOfflineQueue = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const update = async () => {
      const count = await budgetDB.offlineQueue.where('status').equals('pending').count();
      setPendingCount(count);
    };
    update().catch(console.error);
    const listener = () => {
      update().catch(console.error);
    };
    budgetDB.offlineQueue.hook('creating', listener);
    budgetDB.offlineQueue.hook('updating', listener);
    return () => {
      budgetDB.offlineQueue.hook('creating').unsubscribe(listener);
      budgetDB.offlineQueue.hook('updating').unsubscribe(listener);
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'FLUSH_QUEUE' });
      }
      flushQueue().catch((error) => console.error('Error al sincronizar cola', error));
    };
    window.addEventListener('online', sync);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        sync();
      }
    });
    sync();
    return () => {
      window.removeEventListener('online', sync);
    };
  }, []);

  const enqueue = async (item: Omit<OfflineQueueItem, 'id' | 'status' | 'createdAt'>) => {
    await budgetDB.offlineQueue.add({ ...item, status: 'pending', createdAt: Date.now() });
    setPendingCount((count) => count + 1);
  };

  return {
    pendingCount,
    enqueue
  };
};
