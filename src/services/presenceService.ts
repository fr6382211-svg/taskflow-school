import { supabase } from '../lib/supabase';
import type { WorkspaceId } from '../context/WorkspaceContext';

export type PresenceActivity = 'dashboard' | 'tasks' | 'schedule' | 'focus' | 'media' | 'idle';

export interface BuddyPresence {
  userId: string;
  name: string;
  activity: PresenceActivity;
  since: string;
}

export interface CheerPayload {
  fromUserId: string;
  fromName: string;
  message: string;
}

export interface CollaborationEvent {
  id: string;
  workspaceId: WorkspaceId;
  userId: string;
  eventType: 'cheer' | 'presence_join' | 'presence_activity' | 'presence_leave';
  payload: Record<string, unknown>;
  createdAt: string;
}

const CHANNEL_PREFIX = 'schoolhub-presence:';

interface PresenceHandle {
  updateActivity: (activity: PresenceActivity) => void;
  sendCheer: (message: string) => void;
  leave: () => void;
}

function persistEvent(workspaceId: WorkspaceId, userId: string, eventType: CollaborationEvent['eventType'], payload: Record<string, unknown>) {
  void supabase.from('collaboration_events').insert({
    workspace_id: workspaceId,
    user_id: userId,
    event_type: eventType,
    payload,
  }).then(({ error }) => {
    if (error) console.debug('Collaboration event persistence skipped:', error.message);
  });
}

export async function loadRecentCollaborationEvents(workspaceId: WorkspaceId, limit = 30): Promise<CollaborationEvent[]> {
  const { data, error } = await supabase
    .from('collaboration_events')
    .select('id,workspace_id,user_id,event_type,payload,created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(100, limit)));
  if (error) throw error;
  return (data ?? []).map((row: { id: string; workspace_id: WorkspaceId; user_id: string; event_type: CollaborationEvent['eventType']; payload: Record<string, unknown>; created_at: string }) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    eventType: row.event_type,
    payload: row.payload ?? {},
    createdAt: row.created_at,
  }));
}

export function joinPresence(
  workspaceId: WorkspaceId,
  self: { userId: string; name: string; activity: PresenceActivity },
  onSync: (buddies: BuddyPresence[]) => void,
  onCheer: (cheer: CheerPayload) => void,
): PresenceHandle {
  const channel = supabase.channel(`${CHANNEL_PREFIX}${workspaceId}`, {
    config: { presence: { key: self.userId } },
  });

  let currentActivity: PresenceActivity = self.activity;

  const track = () => {
    void channel.track({
      userId: self.userId,
      name: self.name,
      activity: currentActivity,
      since: new Date().toISOString(),
    });
  };

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<BuddyPresence>();
      const buddies = Object.values(state)
        .flat()
        .filter((entry) => entry.userId !== self.userId);
      onSync(buddies);
    })
    .on('broadcast', { event: 'cheer' }, ({ payload }) => {
      const cheer = payload as CheerPayload;
      if (cheer?.fromUserId !== self.userId) onCheer(cheer);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        track();
        persistEvent(workspaceId, self.userId, 'presence_join', { name: self.name, activity: currentActivity });
      }
    });

  return {
    updateActivity: (activity) => {
      currentActivity = activity;
      track();
      persistEvent(workspaceId, self.userId, 'presence_activity', { activity });
    },
    sendCheer: (message) => {
      const safeMessage = message.trim().slice(0, 240);
      if (!safeMessage) return;
      void channel.send({
        type: 'broadcast',
        event: 'cheer',
        payload: { fromUserId: self.userId, fromName: self.name, message: safeMessage } satisfies CheerPayload,
      });
      persistEvent(workspaceId, self.userId, 'cheer', { fromName: self.name, message: safeMessage });
    },
    leave: () => {
      persistEvent(workspaceId, self.userId, 'presence_leave', { activity: currentActivity });
      void supabase.removeChannel(channel);
    },
  };
}
