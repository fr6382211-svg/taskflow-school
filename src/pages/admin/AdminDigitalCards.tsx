import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Search, UserRound, ShieldCheck } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { mapUser } from '../../services/userService';
import type { UserProfile } from '../../types';
import {
  type AdminDigitalIdCard,
  adminDeleteDigitalCard,
  adminIssueDigitalCard,
  adminListDigitalCards,
  subscribeAdminDigitalCards,
} from '../../services/digitalCardService';

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.';
}

function fmt(date: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

export default function AdminDigitalCards() {
  const [cards, setCards] = useState<AdminDigitalIdCard[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminDigitalIdCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ userId: '', cardNumber: '', fullName: '', idNumber: '', roleLabel: 'Siswa', classLabel: '', photoUrl: '' });

  async function load() {
    setLoading(true);
    try {
      const [cardRows, { data: userRows, error: userErr }] = await Promise.all([
        adminListDigitalCards(),
        supabase.from('users').select('*').order('name', { ascending: true }),
      ]);
      if (userErr) throw userErr;
      setCards(cardRows);
      setUsers((userRows ?? []).map(mapUser));
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void load();
    const unsubscribe = subscribeAdminDigitalCards(() => void load(), (e) => setError(errorMessage(e)));
    return unsubscribe;
  }, []);

  const filtered = useMemo(
    () => cards.filter((c) => `${c.fullName} ${c.userEmail} ${c.cardNumber}`.toLowerCase().includes(q.toLowerCase())),
    [cards, q],
  );

  function openCreate(prefillUserId?: string) {
    const u = users.find((x) => x.uid === prefillUserId);
    setForm({
      userId: prefillUserId ?? '',
      cardNumber: '',
      fullName: u?.name ?? '',
      idNumber: '',
      roleLabel: u?.role === 'admin' ? 'Guru/Staf' : 'Siswa',
      classLabel: '',
      photoUrl: u?.photoURL ?? '',
    });
    setError('');
    setCreateOpen(true);
  }

  async function submitCreate() {
    if (!form.userId || !form.cardNumber.trim() || !form.fullName.trim()) {
      setError('Pilih user, isi nomor kartu, dan nama lengkap.');
      return;
    }
    setBusy(true); setError('');
    try {
      await adminIssueDigitalCard({
        userId: form.userId,
        cardNumber: form.cardNumber.trim(),
        fullName: form.fullName.trim(),
        idNumber: form.idNumber.trim() || undefined,
        roleLabel: form.roleLabel.trim() || 'Siswa',
        classLabel: form.classLabel.trim() || undefined,
        photoUrl: form.photoUrl.trim() || undefined,
      });
      setCreateOpen(false);
      await load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  async function submitDelete() {
    if (!deleteTarget) return;
    setBusy(true); setError('');
    try {
      await adminDeleteDigitalCard(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5 fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <AdminHeader
          title="Kartu Digital"
          description="Kartu identitas digital permanen. Hanya admin yang bisa membuat dan menghapus kartu."
        />
        <Button icon={<Plus size={16} />} onClick={() => openCreate()}>Buat Kartu</Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input className="input pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, atau nomor kartu..." />
      </div>

      {error && !createOpen && !deleteTarget && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Memuat kartu…</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Belum ada kartu digital" description="Klik 'Buat Kartu' untuk menerbitkan kartu identitas digital pertama." />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((c) => (
              <div key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-900">
                    {c.photoUrl ? <img src={c.photoUrl} alt="" className="h-full w-full object-cover" /> : <UserRound size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black">{c.fullName}</span>
                      <Badge tone={c.status === 'active' ? 'green' : 'red'}>{c.status === 'active' ? 'Aktif' : 'Dicabut'}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">{c.userEmail} • No. {c.cardNumber}{c.classLabel ? ` • ${c.classLabel}` : ''} • {c.roleLabel}</div>
                    <div className="mt-0.5 text-xs text-slate-400">Diterbitkan {fmt(c.issuedAt)}{c.issuedByName ? ` oleh ${c.issuedByName}` : ''}</div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:justify-end">
                  <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => { setDeleteTarget(c); setError(''); }}>Hapus</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Buat Kartu Digital">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500">User</label>
            <select className="input mt-1" value={form.userId} onChange={(e) => openCreate(e.target.value)}>
              <option value="">Pilih user…</option>
              {users.map((u) => <option key={u.uid} value={u.uid}>{u.name} — {u.email}</option>)}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500">Nomor Kartu</label>
              <input className="input mt-1" value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} placeholder="Misal: 2026-0001" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Nomor Induk (opsional)</label>
              <input className="input mt-1" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="NISN / NIP" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Nama Lengkap</label>
            <input className="input mt-1" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500">Peran</label>
              <input className="input mt-1" value={form.roleLabel} onChange={(e) => setForm({ ...form, roleLabel: e.target.value })} placeholder="Siswa / Guru / Staf" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Kelas (opsional)</label>
              <input className="input mt-1" value={form.classLabel} onChange={(e) => setForm({ ...form, classLabel: e.target.value })} placeholder="Misal: XII IPA 1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">URL Foto (opsional)</label>
            <input className="input mt-1" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://..." />
          </div>
          {error && <div className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
          <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            <span>Kartu bersifat permanen dan tampil di Dashboard pemilik akun. Hanya admin yang dapat membuat atau menghapusnya. Jika user sudah punya kartu aktif, kartu lama otomatis dicabut.</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button loading={busy} onClick={submitCreate}>Terbitkan Kartu</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus kartu digital?">
        {deleteTarget && (
          <>
            <p className="text-sm leading-6 text-slate-500">
              Kartu digital <span className="font-bold">{deleteTarget.fullName}</span> ({deleteTarget.userEmail}) akan dihapus permanen dan tidak akan tampil lagi di Dashboard mereka.
            </p>
            {error && <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button variant="danger" loading={busy} onClick={submitDelete}>Hapus Permanen</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
