import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { joinPresence, type BuddyPresence, type CheerPayload, type PresenceActivity } from '../services/presenceService';

export function usePresence(activity: PresenceActivity) {
  const { user, profile } = useAuth();
  const { workspaceId } = useWorkspace();
  const [buddies, setBuddies] = useState<BuddyPresence[]>([]);
  const [lastCheer, setLastCheer] = useState<CheerPayload | null>(null);
  const handleRef = useRef<ReturnType<typeof joinPresence> | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setBuddies([]);
      return;
    }
    const handle = joinPresence(
      workspaceId,
      { userId: user.id, name: profile?.name || 'Pengguna', activity },
      setBuddies,
      setLastCheer,
    );
    handleRef.current = handle;
    return () => {
      handle.leave();
      handleRef.current = null;
    };
    // Re-join only when identity/workspace changes; activity updates use updateActivity below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, workspaceId, profile?.name]);

  useEffect(() => {
    handleRef.current?.updateActivity(activity);
  }, [activity]);

  const sendCheer = (message: string) => handleRef.current?.sendCheer(message);

  return { buddies, lastCheer, sendCheer, isOnline: buddies.length > 0 };
}
