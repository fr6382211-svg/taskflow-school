import { useEffect, useState } from 'react';
import { File, FolderOpen, RefreshCw, Trash2 } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { errorMessage } from '../../lib/utils';

type StorageItem = { name: string; id?: string; metadata?: { size?: number; mimetype?: string; updated_at?: string } | null };

export default function AdminStorage() {
  const [bucket, setBucket] = useState('task-files');
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); const { data, error } = await supabase.storage.from(bucket).list('', { limit: 500, sortBy: { column: 'updated_at', order: 'desc' } }); if (error) setError(errorMessage(error)); setItems((data ?? []) as StorageItem[]); setLoading(false); };
  useEffect(()=>{void load();},[bucket]);
  const remove = async (name:string) => { if(!window.confirm(`Hapus ${name}?`)) return; const {error}=await supabase.storage.from(bucket).remove([name]); if(error) setError(errorMessage(error)); else await load(); };
  return <div className="space-y-6 fade-up"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><AdminHeader title="Storage Manager" description="Kelola file yang tersimpan di Storage dari dashboard admin."/><div className="flex gap-2"><select className="input max-w-48" value={bucket} onChange={e=>setBucket(e.target.value)}><option>task-files</option><option>avatars</option></select><Button variant="outline" onClick={()=>void load()} icon={<RefreshCw size={15}/>}>Refresh</Button></div></div>
  {error&&<Card className="border-rose-200 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900">{error}</Card>}
  <Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800">Bucket <strong>{bucket}</strong> • {items.length} item teratas</div><div className="divide-y divide-slate-100 dark:divide-slate-800">{loading?<div className="p-10 text-center text-sm text-slate-500">Memuat file…</div>:items.length===0?<div className="p-10 text-center text-sm text-slate-500">Storage kosong atau tidak ada akses.</div>:items.map(item=><div key={item.name} className="flex items-center gap-3 p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">{item.metadata?.mimetype?.startsWith('image/')?<FolderOpen size={18}/>:<File size={18}/>}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{item.name}</div><div className="text-xs text-slate-500">{item.metadata?.mimetype ?? 'file'} {item.metadata?.size ? `• ${Math.round(item.metadata.size/1024)} KB` : ''}</div></div><Badge tone="slate">{bucket}</Badge><Button size="sm" variant="danger" onClick={()=>void remove(item.name)} icon={<Trash2 size={14}/>}>Hapus</Button></div>)}</div></Card></div>;
}
