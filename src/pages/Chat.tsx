import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Archive, AtSign, Check, CheckCheck, Edit3, FileUp, MessageCircle, Paperclip, Pin, Plus, Search, Send, Smile, Trash2, Users, WifiOff, X, Zap } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useConnectionState } from '../hooks/useConnectionState';
import { createConversation, editMessage, ensureWorkspaceConversation, fetchMessages, listConversations, listWorkspaceUsers, loadConversationMembers, markConversationRead, markMessagesRead, sendMessage, softDeleteMessage, subscribeConversationList, subscribeMessages, subscribePresence, subscribeTyping, togglePinMessage, toggleReaction, type ChatConversation, type ChatMember, type ChatMessage } from '../services/chatService';
import { cn, errorMessage } from '../lib/utils';

const REACTIONS=['👍','❤️','😂','🔥','💪','🎯'];
function formatTime(value:string){return new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
function initials(name:string){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();}

export default function Chat(){
  const {user,profile}=useAuth(); const {workspaceId}=useWorkspace(); const connection=useConnectionState();
  const [conversations,setConversations]=useState<ChatConversation[]>([]); const [conversation,setConversation]=useState<ChatConversation|null>(null); const [members,setMembers]=useState<ChatMember[]>([]); const [messages,setMessages]=useState<ChatMessage[]>([]);
  const [query,setQuery]=useState(''); const [messageSearch,setMessageSearch]=useState(''); const [body,setBody]=useState(''); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [typing,setTyping]=useState(false); const [presence,setPresence]=useState<any>({}); const [replyTo,setReplyTo]=useState<ChatMessage|null>(null); const typingRef=useRef<{setTyping:(typing:boolean)=>void;dispose:()=>void}|null>(null); const [editing,setEditing]=useState<ChatMessage|null>(null); const [editBody,setEditBody]=useState(''); const [menuId,setMenuId]=useState<string|null>(null); const [attachment,setAttachment]=useState<File|null>(null); const [showNew,setShowNew]=useState(false); const [newKind,setNewKind]=useState<'direct'|'group'>('direct'); const [newTitle,setNewTitle]=useState(''); const [userSearch,setUserSearch]=useState(''); const [userResults,setUserResults]=useState<ChatMember[]>([]); const [selectedUsers,setSelectedUsers]=useState<ChatMember[]>([]); const listRef=useRef<HTMLDivElement>(null); const fileRef=useRef<HTMLInputElement>(null);
  // Mobile: two separate "screens" (list vs thread) instead of a cramped stacked column. xl+ always shows both side by side.
  const [mobileView,setMobileView]=useState<'list'|'thread'>('list');
  // Read-receipts: only mark a message read once it has actually been visible on screen, not the instant it loads.
  const messageRefs=useRef<Map<string,HTMLElement>>(new Map());
  const pendingReadsRef=useRef<Set<string>>(new Set());
  const flushTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const observerRef=useRef<IntersectionObserver|null>(null);

  const loadList=async()=>{if(!user?.id)return;setLoading(true);try{const data=await listConversations(user.id,workspaceId);setConversations(data);setConversation(prev=>prev?data.find(c=>c.id===prev.id)||prev:data[0]??null);}catch(e){setError(errorMessage(e))}finally{setLoading(false)}};
  useEffect(()=>{void loadList(); if(!user?.id)return; const unsub=subscribeConversationList(user.id,workspaceId,()=>void loadList(),e=>setError(errorMessage(e))); return unsub;},[user?.id,workspaceId]);
  useEffect(()=>{if(!user?.id||conversations.length)return;void ensureWorkspaceConversation(workspaceId,user.id).then(()=>loadList()).catch(e=>setError(errorMessage(e)));},[user?.id,workspaceId,conversations.length]);
  useEffect(()=>{if(!conversation)return;setError('');const unsub=subscribeMessages(conversation.id,setMessages,e=>setError(errorMessage(e)));void loadConversationMembers(conversation.id).then(setMembers).catch(e=>setError(errorMessage(e)));return unsub;},[conversation?.id]);
  useEffect(()=>{typingRef.current?.dispose();typingRef.current=null;if(!conversation||!user?.id)return;const t=subscribeTyping(conversation.id,user.id,users=>setTyping(users.length>0));const p=subscribePresence(conversation.id,user.id,setPresence);typingRef.current=t;return()=>{t.dispose();p.dispose();typingRef.current=null;}},[conversation?.id,user?.id]);
  useEffect(()=>{listRef.current?.scrollTo({top:listRef.current.scrollHeight,behavior:'smooth'});},[messages.length,conversation?.id]);
  useEffect(()=>{if(!showNew)return;void listWorkspaceUsers(workspaceId,userSearch).then(setUserResults).catch(()=>setUserResults([]));},[showNew,userSearch,workspaceId]);

  // Flush accumulated visible-but-unread message ids as a single batch, debounced so rapid scrolling doesn't spam requests.
  const flushReads=useCallback(()=>{
    if(!user?.id||!conversation)return;
    const ids=Array.from(pendingReadsRef.current);
    if(!ids.length)return;
    pendingReadsRef.current.clear();
    void markMessagesRead(ids,user.id).then(()=>markConversationRead(conversation.id,user.id)).catch(()=>undefined);
  },[user?.id,conversation]);

  const scheduleFlush=useCallback(()=>{
    if(flushTimerRef.current)clearTimeout(flushTimerRef.current);
    flushTimerRef.current=setTimeout(flushReads,600);
  },[flushReads]);

  const registerMessageEl=useCallback((id:string,el:HTMLElement|null)=>{
    const map=messageRefs.current;
    const prev=map.get(id);
    if(prev&&observerRef.current)observerRef.current.unobserve(prev);
    if(el){map.set(id,el);observerRef.current?.observe(el);}else{map.delete(id);}
  },[]);

  // Set up (or tear down) the IntersectionObserver whenever the active conversation changes.
  useEffect(()=>{
    if(!conversation||!user?.id)return;
    const root=listRef.current??null;
    const observer=new IntersectionObserver(entries=>{
      let changed=false;
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        const id=(entry.target as HTMLElement).dataset.messageId;
        const unread=(entry.target as HTMLElement).dataset.unread==='1';
        if(id&&unread){pendingReadsRef.current.add(id);changed=true;}
      }
      if(changed)scheduleFlush();
    },{root,threshold:0.6});
    observerRef.current=observer;
    messageRefs.current.forEach(el=>observer.observe(el));
    return()=>{observer.disconnect();observerRef.current=null;if(flushTimerRef.current)clearTimeout(flushTimerRef.current);flushReads();};
  },[conversation?.id,user?.id,scheduleFlush,flushReads]);

  const filteredConversations=useMemo(()=>conversations.filter(c=>`${c.title??''}`.toLowerCase().includes(query.trim().toLowerCase())),[conversations,query]);
  const filteredMessages=useMemo(()=>{const q=messageSearch.trim().toLowerCase();if(!q)return messages;return messages.filter(m=>m.body.toLowerCase().includes(q)||m.senderName.toLowerCase().includes(q)||m.attachmentName?.toLowerCase().includes(q));},[messages,messageSearch]);
  const onlineIds=useMemo(()=>{const ids=new Set<string>();Object.values(presence??{}).forEach((entries:any)=>entries?.forEach?.((e:any)=>{if(e?.status==='ONLINE'||e?.status==='FOCUSING')ids.add(String(e.userId));}));return ids;},[presence]);

  function openConversation(c:ChatConversation){setConversation(c);setMobileView('thread');}
  function backToList(){setMobileView('list');}

  async function submit(){if(!conversation||!user?.id||(!body.trim()&&!attachment))return;const next=body;setBody('');const file=attachment;setAttachment(null);try{await sendMessage({conversationId:conversation.id,userId:user.id,body:next,replyTo:replyTo?.id??null,file});setReplyTo(null);}catch(e){setBody(next);setAttachment(file);setError(errorMessage(e));}}
  async function saveEdit(){if(!editing||!user?.id)return;try{await editMessage(editing.id,user.id,editBody);setEditing(null);setEditBody('');}catch(e){setError(errorMessage(e));}}
  async function startChat(){if(!user?.id||selectedUsers.length===0)return;try{const kind=newKind;const title=kind==='direct'?selectedUsers[0].name:(newTitle.trim()||'Study Group');const id=await createConversation(workspaceId,kind,title,selectedUsers.map(x=>x.id));setShowNew(false);setSelectedUsers([]);setNewTitle('');setUserSearch('');await loadList();const created=await supabaseLikeConversation(id);if(created){setConversation(created);setMobileView('thread');}}catch(e){setError(errorMessage(e));}}
  async function supabaseLikeConversation(id:string){const data=await listConversations(user!.id,workspaceId);return data.find(c=>c.id===id)??data[0]??null;}

  return <div className="mx-auto max-w-7xl space-y-4 fade-up">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2"><h1 className="editorial-heading text-2xl font-extrabold tracking-tight">Chat</h1><Badge tone={connection==='ONLINE'?'green':connection==='DEGRADED'?'amber':'red'}>{connection}</Badge></div><p className="mt-1 text-sm text-slate-500">Workspace collaboration: percakapan realtime, DM, grup, reply, reaction, lampiran, typing, presence, dan read receipt.</p></div><div className="flex gap-2"><Button variant="outline" icon={<Plus size={15}/>} onClick={()=>setShowNew(true)}>Percakapan baru</Button><Button variant="ghost" icon={<Archive size={15}/>} onClick={()=>setQuery('')}>Bersihkan pencarian</Button></div></div>
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <Card className={cn('overflow-hidden',mobileView==='thread'&&'hidden xl:block')}><div className="border-b border-slate-100 p-3 dark:border-slate-800"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} className="input pl-9" placeholder="Cari ruang…"/></div></div><div className="max-h-[70dvh] overflow-y-auto">{loading&&<div className="p-5 text-sm text-slate-400">Memuat percakapan…</div>}{filteredConversations.map(c=><button key={c.id} type="button" onClick={()=>openConversation(c)} className={cn('flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900',conversation?.id===c.id&&'bg-[var(--ed-terracotta-soft,rgba(196,98,45,.08))]')}><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ed-terracotta-soft,#eef2ff)] font-bold text-[var(--ed-terracotta-ink,#4338ca)]">{c.kind==='direct'?<MessageCircle size={17}/>:<Users size={17}/>}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{c.title||'Untitled'}</div><div className="mt-0.5 text-[11px] text-slate-400">{c.kind==='direct'?'Direct message':'Grup'}{(c.unreadCount??0)>0&&<span className="ml-2 rounded-full bg-[var(--ed-terracotta,#4f46e5)] px-1.5 py-0.5 text-[10px] font-bold text-white">{c.unreadCount}</span>}</div></div></button>)}{!loading&&filteredConversations.length===0&&<div className="p-6"><EmptyState title="Belum ada percakapan" description="Buat DM atau grup baru untuk mulai berkolaborasi."/></div>}</div></Card>
      <Card className={cn('overflow-hidden',mobileView==='list'&&'hidden xl:block')}><div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800"><div className="flex min-w-0 items-center gap-2"><button type="button" onClick={backToList} className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 xl:hidden dark:hover:bg-slate-900" aria-label="Kembali ke daftar percakapan"><ArrowLeft size={16}/></button><div className="min-w-0"><div className="truncate font-bold">{conversation?.title??'Pilih percakapan'}</div><div className="text-[11px] text-slate-500">{conversation?`${members.length} anggota • ${onlineIds.size} online`:'Workspace chat'}</div></div></div><div className="flex items-center gap-2">{connection==='OFFLINE'&&<WifiOff size={16} className="text-rose-500"/>}</div></div>
        <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/><input className="input h-9 pl-9 text-xs" value={messageSearch} onChange={e=>setMessageSearch(e.target.value)} placeholder="Cari di percakapan…"/></div></div>
        {error&&<div className="m-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}<button className="ml-2 font-bold underline" onClick={()=>setError('')}>Tutup</button></div>}
        {connection==='OFFLINE'&&<div className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Sedang offline — pesan akan terkirim otomatis saat online kembali.</div>}
        <div ref={listRef} className="h-[56dvh] overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950/50">{!conversation?<div className="grid h-full place-items-center text-center text-sm text-slate-400"><div><MessageCircle className="mx-auto mb-2" size={30}/><div>Pilih ruang percakapan.</div></div></div>:filteredMessages.length===0?<div className="grid h-full place-items-center"><EmptyState title="Belum ada pesan" description="Kirim pesan pertama di ruang ini."/></div>:<div className="space-y-3">{filteredMessages.map((m)=>{const isMine=m.senderId===user?.id;const isUnread=!isMine&&!m.readBy.includes(user?.id??'');return <div key={m.id} ref={el=>registerMessageEl(m.id,el)} data-message-id={m.id} data-unread={isUnread?'1':'0'} className={cn('group flex',isMine?'justify-end':'justify-start')}><div className={cn('max-w-[88%] rounded-2xl px-3 py-2.5 shadow-sm',isMine?'bg-[var(--ed-terracotta,#4f46e5)] text-white':'border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100')}>{!isMine&&<div className="mb-1 flex items-center gap-2 text-[10px] font-extrabold opacity-75"><span>{m.senderName}</span>{onlineIds.has(m.senderId)&&<span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>}</div>}{m.replyTo&&<div className="mb-2 rounded-lg border-l-2 border-current/30 bg-black/5 px-2 py-1 text-[10px] opacity-70">↪ Balasan ke pesan sebelumnya</div>}{m.deletedAt?<div className="italic opacity-60">Pesan dihapus.</div>:<><div className="whitespace-pre-wrap text-sm leading-6">{m.body}</div>{m.attachmentUrl&&<a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold underline"><Paperclip size={13}/><span className="truncate">{m.attachmentName}</span></a>}</>}
              <div className="mt-2 flex items-center gap-2 text-[10px] opacity-60"><span>{formatTime(m.createdAt)}</span>{m.editedAt&&<span>(diedit)</span>}{m.isPinned&&<Pin size={11}/>} {isMine&&(m.readBy.length>0?<CheckCheck size={12}/>:<Check size={12}/>)}</div>
              <div className="mt-1 flex flex-wrap gap-1">{Object.entries(m.reactions).filter(([,n])=>n>0).map(([r,n])=><button key={r} type="button" className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]" onClick={()=>void toggleReaction(m.id,user!.id,r)}>{r} {n}</button>)}<button type="button" className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]" onClick={()=>void toggleReaction(m.id,user!.id,'👍')}>👍</button></div>
              <div className={cn('mt-2 flex flex-wrap gap-1 opacity-0 transition group-hover:opacity-100',menuId===m.id&&'opacity-100')}><button type="button" className="rounded-lg bg-black/5 p-1.5" title="Balas" onClick={()=>setReplyTo(m)}><MessageCircle size={12}/></button><button type="button" className="rounded-lg bg-black/5 p-1.5" title="Pin" onClick={()=>void togglePinMessage(m.id,user!.id,!m.isPinned)}><Pin size={12}/></button>{isMine&&<><button type="button" className="rounded-lg bg-black/5 p-1.5" title="Edit" onClick={()=>{setEditing(m);setEditBody(m.body)}}><Edit3 size={12}/></button><button type="button" className="rounded-lg bg-black/5 p-1.5" title="Hapus" onClick={()=>void softDeleteMessage(m.id,user!.id).catch(e=>setError(errorMessage(e)))}><Trash2 size={12}/></button></>}<button type="button" className="rounded-lg bg-black/5 p-1.5" title="Reaction" onClick={()=>setMenuId(menuId===m.id?null:m.id)}><Smile size={12}/></button></div>
              {menuId===m.id&&<div className="mt-1 flex flex-wrap gap-1 rounded-xl border border-current/10 bg-black/5 p-1">{REACTIONS.map(r=><button key={r} type="button" className="rounded-lg px-2 py-1 text-sm hover:bg-white/20" onClick={()=>void toggleReaction(m.id,user!.id,r).then(()=>setMenuId(null)).catch(e=>setError(errorMessage(e)))}>{r}</button>)}</div>}
            </div></div>;})}{messages.length>20&&<div className="pt-1 text-center text-[10px] text-slate-400">Menampilkan {filteredMessages.length} dari {messages.length} pesan</div>}</div>}</div>
        {conversation&&<div className="border-t border-slate-100 p-3 dark:border-slate-800">{replyTo&&<div className="mb-2 flex items-center justify-between rounded-xl bg-[var(--ed-terracotta-soft,#eef2ff)] px-3 py-2 text-xs text-[var(--ed-terracotta-ink,#4338ca)]"><span className="truncate">Membalas: {replyTo.body}</span><button onClick={()=>setReplyTo(null)}><X size={13}/></button></div>}{attachment&&<div className="mb-2 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-xs dark:bg-slate-900"><span className="truncate">📎 {attachment.name}</span><button onClick={()=>setAttachment(null)}><X size={13}/></button></div>}<div className="flex gap-2"><input ref={fileRef} type="file" className="hidden" onChange={e=>setAttachment(e.target.files?.[0]??null)}/><button type="button" className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900" onClick={()=>fileRef.current?.click()} title="Lampiran"><FileUp size={16}/></button><input className="input" value={body} onChange={e=>{setBody(e.target.value);typingRef.current?.setTyping(Boolean(e.target.value));}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void submit()}}} placeholder="Tulis pesan… @mention • Enter untuk kirim"/><Button onClick={()=>void submit()} icon={<Send size={15}/>} disabled={!body.trim()&&!attachment}>Kirim</Button></div><div className="mt-2 flex items-center justify-between text-[11px] text-slate-400"><span className="inline-flex items-center gap-1">{typing?<><Zap size={11}/> Seseorang sedang mengetik…</>:<><AtSign size={11}/> Mention & reply siap digunakan.</>}</span><span>{connection==='OFFLINE'?'Offline queue aktif':'Supabase Realtime aktif'}</span></div></div>}
      </Card>
    </div>

    <Modal open={!!editing} onClose={()=>setEditing(null)} title="Edit pesan"><textarea className="input min-h-28" value={editBody} onChange={e=>setEditBody(e.target.value)} /><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={()=>setEditing(null)}>Batal</Button><Button onClick={()=>void saveEdit()}>Simpan</Button></div></Modal>
    <Modal open={showNew} onClose={()=>setShowNew(false)} title="Buat percakapan" wide><div className="grid gap-5 md:grid-cols-[180px_1fr]"><div className="space-y-2"><button type="button" className={cn('w-full rounded-xl border p-3 text-left text-sm font-bold',newKind==='direct'&&'border-[var(--ed-terracotta,#4f46e5)] bg-[var(--ed-terracotta-soft,#eef2ff)]')} onClick={()=>setNewKind('direct')}>Direct Message<div className="mt-1 text-[11px] font-normal text-slate-500">Percakapan 1:1.</div></button><button type="button" className={cn('w-full rounded-xl border p-3 text-left text-sm font-bold',newKind==='group'&&'border-[var(--ed-terracotta,#4f46e5)] bg-[var(--ed-terracotta-soft,#eef2ff)]')} onClick={()=>setNewKind('group')}>Study Group<div className="mt-1 text-[11px] font-normal text-slate-500">Kolaborasi beberapa orang.</div></button></div><div><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/><input className="input pl-9" value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Cari anggota workspace…"/></div>{newKind==='group'&&<input className="input mt-2" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Nama grup"/>}<div className="mt-3 flex flex-wrap gap-2">{selectedUsers.map(u=><button key={u.id} type="button" className="rounded-full bg-[var(--ed-terracotta-soft,#eef2ff)] px-3 py-1.5 text-xs font-bold text-[var(--ed-terracotta-ink,#4338ca)]" onClick={()=>setSelectedUsers(x=>x.filter(s=>s.id!==u.id))}>{u.name} ×</button>)}</div><div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-200">{userResults.map(u=><button key={u.id} type="button" className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left hover:bg-slate-50" onClick={()=>{if(newKind==='direct')setSelectedUsers([u]);else setSelectedUsers(x=>x.some(s=>s.id===u.id)?x:[...x,u]);}}><div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-xs font-black">{initials(u.name)}</div><div className="flex-1"><div className="text-sm font-bold">{u.name}</div><div className="text-xs text-slate-400">{u.email}</div></div><span className="h-2 w-2 rounded-full bg-emerald-500"/></button>)}{userSearch&&userResults.length===0&&<div className="p-5 text-sm text-slate-400">Tidak ada anggota.</div>}</div><div className="mt-4 flex justify-end"><Button disabled={selectedUsers.length===0||newKind==='group'&&selectedUsers.length<1} onClick={()=>void startChat()}>Mulai chat</Button></div></div></div></Modal>
  </div>;
}
