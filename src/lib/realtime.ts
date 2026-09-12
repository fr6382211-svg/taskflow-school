import { supabase } from './supabase';

let channelSequence = 0;

type RealtimeErrorHandler = (error: unknown) => void;

interface PostgresSubscriptionOptions {
  topic: string;
  table: string;
  filter?: string;
  onChange: () => void;
  onError?: RealtimeErrorHandler;
}

export function subscribeToPostgresChanges({
  topic,
  table,
  filter,
  onChange,
  onError,
}: PostgresSubscriptionOptions) {
  let active = true;
  const uniqueTopic = `${topic}:${++channelSequence}`;

  // IMPORTANT: register postgres_changes BEFORE calling subscribe().
  const channel = supabase
    .channel(uniqueTopic)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      () => {
        if (active) onChange();
      },
    );

  channel.subscribe((status) => {
    if (!active) return;
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      onError?.(new Error(`Realtime subscription failed: ${status}`));
    }
  });

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}
