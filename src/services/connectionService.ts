export type ConnectionState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'DEGRADED';

type Listener = (state: ConnectionState) => void;
const listeners = new Set<Listener>();
let current: ConnectionState = typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE';
let activeSyncs = 0;

function publish(state: ConnectionState) { current = state; listeners.forEach((listener) => listener(state)); }
function networkState() { return navigator.onLine ? current === 'OFFLINE' ? 'ONLINE' : current : 'OFFLINE'; }

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => publish('ONLINE'));
  window.addEventListener('offline', () => publish('OFFLINE'));
}

export function getConnectionState() { return networkState(); }
export function setConnectionState(state: ConnectionState) { publish(state); }
export function markSyncStart() { activeSyncs += 1; publish('SYNCING'); }
export function markSyncEnd(ok = true) { activeSyncs = Math.max(0, activeSyncs - 1); publish(activeSyncs ? 'SYNCING' : ok ? 'ONLINE' : 'DEGRADED'); }
export function subscribeConnection(listener: Listener) { listeners.add(listener); listener(networkState()); return () => { listeners.delete(listener); }; }
