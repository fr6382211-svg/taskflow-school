import { supabase } from '../lib/supabase';
import { subscribeToPostgresChanges } from '../lib/realtime';

export interface DigitalIdCard {
  id: string;
  cardNumber: string;
  fullName: string;
  idNumber: string | null;
  roleLabel: string;
  classLabel: string | null;
  photoUrl: string | null;
  workspaceId: string;
  issuedAt: string;
  status: 'active' | 'revoked';
}

export interface AdminDigitalIdCard extends DigitalIdCard {
  userId: string;
  userName: string;
  userEmail: string;
  issuedByName: string | null;
}

function mapMine(row: Record<string, unknown>): DigitalIdCard {
  return {
    id: row.id as string,
    cardNumber: row.card_number as string,
    fullName: row.full_name as string,
    idNumber: (row.id_number as string) ?? null,
    roleLabel: row.role_label as string,
    classLabel: (row.class_label as string) ?? null,
    photoUrl: (row.photo_url as string) ?? null,
    workspaceId: row.workspace_id as string,
    issuedAt: row.issued_at as string,
    status: row.status as 'active' | 'revoked',
  };
}

function mapAdmin(row: Record<string, unknown>): AdminDigitalIdCard {
  return {
    ...mapMine(row),
    userId: row.user_id as string,
    userName: row.user_name as string,
    userEmail: row.user_email as string,
    issuedByName: (row.issued_by_name as string) ?? null,
  };
}

/** The signed-in user's own permanent digital ID card (or null if admin hasn't issued one). */
export async function getMyDigitalCard(): Promise<DigitalIdCard | null> {
  const { data, error } = await supabase.rpc('get_my_digital_card');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? mapMine(row as Record<string, unknown>) : null;
}

export function subscribeMyDigitalCard(userId: string, cb: (card: DigitalIdCard | null) => void, onError?: (e: unknown) => void) {
  let active = true;
  const load = async () => {
    try {
      const card = await getMyDigitalCard();
      if (active) cb(card);
    } catch (e) { onError?.(e); }
  };
  void load();
  const unsubscribe = subscribeToPostgresChanges({
    topic: `digital-card:${userId}`,
    table: 'digital_id_cards',
    filter: `user_id=eq.${userId}`,
    onChange: () => void load(),
    onError,
  });
  return () => { active = false; unsubscribe(); };
}

/** Admin: every card ever issued (active + revoked). */
export async function adminListDigitalCards(): Promise<AdminDigitalIdCard[]> {
  const { data, error } = await supabase.rpc('admin_list_digital_cards');
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(mapAdmin);
}

export interface IssueDigitalCardInput {
  userId: string;
  cardNumber: string;
  fullName: string;
  idNumber?: string;
  roleLabel?: string;
  classLabel?: string;
  photoUrl?: string;
}

/** Admin: issue (create) a permanent digital ID card for a user. Replaces any existing active card. */
export async function adminIssueDigitalCard(input: IssueDigitalCardInput): Promise<string> {
  const { data, error } = await supabase.rpc('admin_issue_digital_card', {
    p_user_id: input.userId,
    p_card_number: input.cardNumber,
    p_full_name: input.fullName,
    p_id_number: input.idNumber ?? null,
    p_role_label: input.roleLabel ?? 'Siswa',
    p_class_label: input.classLabel ?? null,
    p_photo_url: input.photoUrl ?? null,
  });
  if (error) throw error;
  return (data as { card_id: string })?.card_id;
}

/** Admin: permanently delete a digital ID card. */
export async function adminDeleteDigitalCard(cardId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_digital_card', { p_card_id: cardId });
  if (error) throw error;
}

export function subscribeAdminDigitalCards(onChange: () => void, onError?: (e: unknown) => void) {
  return subscribeToPostgresChanges({
    topic: 'admin-digital-cards',
    table: 'digital_id_cards',
    onChange,
    onError,
  });
}
