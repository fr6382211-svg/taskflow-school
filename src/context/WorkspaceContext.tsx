import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

export type WorkspaceId = 'fathur' | 'mazet';

export interface WorkspaceDefinition {
  id: WorkspaceId;
  name: string;
  eyebrow: string;
  description: string;
  schoolLabel: string;
  birthdayLabel: string;
  birthdayMonth: number;
  birthdayDay: number;
  accent: string;
  scheduleSource: 'supabase' | 'mazet-json';
}

export const WORKSPACES: Record<WorkspaceId, WorkspaceDefinition> = {
  fathur: { id:'fathur', name:'Fathur', eyebrow:'Fathur Workspace', description:'Workspace akademik pribadi Fathur.', schoolLabel:'SMAN 2 Tuban', birthdayLabel:'Ulang Tahun Fathur', birthdayMonth:3, birthdayDay:12, accent:'indigo', scheduleSource:'supabase' },
  mazet: { id:'mazet', name:'Mazet', eyebrow:'Mazet Workspace', description:'Workspace kuliah Mazet dengan jadwal kuliah terpisah.', schoolLabel:'Mazet • Kuliah', birthdayLabel:'Ulang Tahun Mazet', birthdayMonth:5, birthdayDay:30, accent:'violet', scheduleSource:'mazet-json' },
};

interface WorkspaceContextValue {
  workspace: WorkspaceDefinition;
  workspaceId: WorkspaceId;
  setWorkspaceId: (id: WorkspaceId) => void;
  switchWorkspace: (id: WorkspaceId) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin } = useAuth();
  const [workspaceId, setWorkspaceIdState] = useState<WorkspaceId>('fathur');

  useEffect(() => {
    const stored = user?.user_metadata?.preferred_workspace;
    const profileWorkspace = profile?.workspaceId;
    const preferred = isAdmin ? (stored === 'mazet' || stored === 'fathur' ? stored : profileWorkspace) : profileWorkspace;
    setWorkspaceIdState(preferred === 'mazet' ? 'mazet' : 'fathur');
  }, [user?.id, user?.user_metadata?.preferred_workspace, profile?.workspaceId, isAdmin]);

  const setWorkspaceId = (id: WorkspaceId) => {
    if (!isAdmin) return;
    setWorkspaceIdState(id);
  };

  const workspace = useMemo(() => WORKSPACES[workspaceId], [workspaceId]);
  const value = useMemo(() => ({ workspace, workspaceId, setWorkspaceId, switchWorkspace: setWorkspaceId }), [workspace, workspaceId, isAdmin]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return context;
}
