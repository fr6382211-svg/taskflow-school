import { useEffect, useState } from 'react';
import { getConnectionState, subscribeConnection, type ConnectionState } from '../services/connectionService';

export function useConnectionState() {
  const [state, setState] = useState<ConnectionState>(getConnectionState());
  useEffect(() => {
    const unsubscribe = subscribeConnection(setState);
    return () => { unsubscribe(); };
  }, []);
  return state;
}
