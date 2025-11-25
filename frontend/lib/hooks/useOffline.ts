/**
 * useOffline Hook - Detect offline status and queue actions for sync
 */

'use client';

import { useState, useEffect } from 'react';

interface OfflineQueue {
  diceRolls: any[];
  chatMessages: any[];
  characterUpdates: any[];
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<OfflineQueue>({
    diceRolls: [],
    chatMessages: [],
    characterUpdates: [],
  });

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('[Offline] Back online');
      setIsOnline(true);
      syncQueue();
    };

    const handleOffline = () => {
      console.log('[Offline] Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueDiceRoll = (roll: any) => {
    if (isOnline) {
      // If online, send immediately
      return sendDiceRoll(roll);
    }

    // If offline, queue for later
    setQueue((prev) => ({
      ...prev,
      diceRolls: [...prev.diceRolls, roll],
    }));

    // Store in IndexedDB for persistence
    storeInDB('pendingRolls', roll);

    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
      navigator.serviceWorker.ready.then((registration: any) => {
        return registration.sync.register('sync-dice-rolls');
      });
    }

    return Promise.resolve({ queued: true });
  };

  const queueChatMessage = (message: any) => {
    if (isOnline) {
      return sendChatMessage(message);
    }

    setQueue((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, message],
    }));

    storeInDB('pendingMessages', message);

    if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
      navigator.serviceWorker.ready.then((registration: any) => {
        return registration.sync.register('sync-chat-messages');
      });
    }

    return Promise.resolve({ queued: true });
  };

  const queueCharacterUpdate = (characterId: string, updates: any) => {
    if (isOnline) {
      return sendCharacterUpdate(characterId, updates);
    }

    const update = { id: characterId, data: updates };
    setQueue((prev) => ({
      ...prev,
      characterUpdates: [...prev.characterUpdates, update],
    }));

    storeInDB('pendingCharacterUpdates', update);

    if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
      navigator.serviceWorker.ready.then((registration: any) => {
        return registration.sync.register('sync-character-updates');
      });
    }

    return Promise.resolve({ queued: true });
  };

  const syncQueue = async () => {
    if (!isOnline) return;

    console.log('[Offline] Syncing queued actions...');

    // Sync dice rolls
    for (const roll of queue.diceRolls) {
      await sendDiceRoll(roll);
    }

    // Sync chat messages
    for (const message of queue.chatMessages) {
      await sendChatMessage(message);
    }

    // Sync character updates
    for (const update of queue.characterUpdates) {
      await sendCharacterUpdate(update.id, update.data);
    }

    // Clear queue
    setQueue({
      diceRolls: [],
      chatMessages: [],
      characterUpdates: [],
    });

    console.log('[Offline] Sync complete');
  };

  return {
    isOnline,
    queueDiceRoll,
    queueChatMessage,
    queueCharacterUpdate,
    pendingCount:
      queue.diceRolls.length + queue.chatMessages.length + queue.characterUpdates.length,
  };
}

// Helper functions
async function sendDiceRoll(roll: any) {
  const response = await fetch('/api/dice/roll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roll),
  });
  return response.json();
}

async function sendChatMessage(message: any) {
  const response = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  return response.json();
}

async function sendCharacterUpdate(characterId: string, updates: any) {
  const response = await fetch(`/api/characters/${characterId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
}

function storeInDB(storeName: string, data: any) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('RollScapeDB', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.add(data);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };

    request.onerror = () => reject(request.error);
  });
}
