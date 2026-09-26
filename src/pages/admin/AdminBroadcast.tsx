import { useEffect, useState } from 'react';
import { Send, Users, BellRing } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function AdminBroadcast() {
  const { user } = useAuth();
  const [audience, setAudience] = useState<'all' | 'active'>('active');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'system' | 'announcement' | 'security'>('announcement');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const q = supabase.from('users').select('id', { count: 'exact', head: true });
      const response = audience === 'active' ? await q.eq('status', 'active') : await q;
      setCount(response.count ?? 0);
    };
    void loadCount();
  }, [audience]);

  const send = async () => {
    if (!user?.id || !title.trim() || !message.trim()) return;
    setSending(true); setResult('');
    try {
      let query = supabase.from('users').select('id').limit(2000);
      if (audience === 'active') query = query.eq('status', 'active');
      const { data: users, error: usersError } = await query;
      if (usersError) throw usersError;
      const rows = (users ?? []).map((item) => ({
        user_id: item.id,
        title: title.trim(),
        message: message.trim(),
        type,
        read: false,
        action_url: null,
      }));
      if (rows.length === 0) throw new Error('Tidak ada penerima.');
      const { error } = await supabase.from('notifications').insert(rows);
      if (error) throw error;
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email ?? '',
        action: 'admin_broadcast_notification',
        target_type: 'notifications',
        metadata: { audience, type, recipients: rows.length, title: title.trim() },
      });
      setResult(`Terkirim ke ${rows.length} pengguna.`);
      setTitle(''); setMessage('');
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Broadcast gagal.');
    } finally { setSending(false); }
  };

  return <div className="space-y-6 fade-up">
    <AdminHeader title="Broadcast Center" description="Kirim notifikasi terarah ke pengguna tanpa membuka database secara manual." />
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 font-bold"><Send size={17}/> Pesan baru</div>
        <label><span className="label">Audiens</span><select className="input" value={audience} onChange={e=>setAudience(e.target.value as typeof audience)}><option value="active">Semua pengguna aktif</option><option value="all">Semua pengguna</option></select></label>
        <label><span className="label">Jenis notifikasi</span><select className="input" value={type} onChange={e=>setType(e.target.value as typeof type)}><option value="announcement">Announcement</option><option value="system">System</option><option value="security">Security</option></select></label>
        <label><span className="label">Judul</span><input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Contoh: Jadwal baru tersedia" /></label>
        <label><span className="label">Pesan</span><textarea className="input min-h-36" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Tulis pesan yang akan diterima pengguna..." /></label>
        <div className="flex items-center justify-between gap-3"><div className="text-xs text-slate-500">Pastikan pesan memang relevan untuk audiens yang dipilih.</div><Button onClick={()=>void send()} loading={sending} icon={<Send size={15}/>}>Kirim Broadcast</Button></div>
        {result && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900">{result}</div>}
      </Card>
      <Card className="p-5">
        <div className="flex items-center gap-2 font-bold"><Users size={17}/> Ringkasan</div>
        <div className="mt-5 grid gap-3">
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="text-xs text-slate-500">Target penerima</div><div className="mt-2 text-3xl font-black">{count}</div></div>
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="text-xs text-slate-500">Status</div><div className="mt-2 flex items-center gap-2"><Badge tone="green">LIVE</Badge><span className="text-sm font-semibold">Supabase Notifications</span></div></div>
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-center gap-2 text-sm font-semibold"><BellRing size={15}/> Broadcast dicatat ke audit log.</div></div>
        </div>
      </Card>
    </div>
  </div>;
}
