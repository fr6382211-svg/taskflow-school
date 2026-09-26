import { supabase } from '../lib/supabase';
import { subscribeToPostgresChanges } from '../lib/realtime';
import { enqueueMutation } from './offlineQueueService';
import { createNotificationOnce } from './notificationService';
import type { WorkspaceId } from '../context/WorkspaceContext';

export interface ChatConversation {
  id: string;
  workspaceId: WorkspaceId;
  title: string | null;
  kind: 'direct' | 'group' | 'workspace';
  isGroup: boolean;
  createdBy: string;
  updatedAt: string;
  unreadCount?: number;
  members?: ChatMember[];
}
export interface ChatMember { id:string; name:string; email:string; photoUrl:string|null; workspaceId:WorkspaceId; lastReadAt:string|null; }
export interface ChatMessage {
  id:string;
  conversationId:string;
  senderId:string;
  senderName:string;
  senderPhotoUrl:string|null;
  body:string;
  replyTo:string|null;
  createdAt:string;
  editedAt:string|null;
  deletedAt:string|null;
  isPinned:boolean;
  mentionUserIds:string[];
  attachmentPath:string|null;
  attachmentName:string|null;
  attachmentType:string|null;
  attachmentSize:number|null;
  attachmentUrl?:string|null;
  reactions:Record<string,number>;
  readBy:string[];
}

function mapConversation(r:any):ChatConversation {
  return {
    id:r.id, workspaceId:r.workspace_id, title:r.title ?? null,
    kind:r.kind ?? (r.is_group ? 'group' : 'direct'), isGroup:!!r.is_group,
    createdBy:r.created_by, updatedAt:r.updated_at, unreadCount:Number(r.unread_count ?? 0),
    members:Array.isArray(r.members)?r.members.map(mapMember):undefined,
  };
}
function mapMember(r:any):ChatMember { return {id:r.id??r.user_id,name:r.name??'Pengguna',email:r.email??'',photoUrl:r.photo_url??null,workspaceId:r.workspace_id??'fathur',lastReadAt:r.last_read_at??null}; }

/**
 * Lists people the user can start a chat with. `crossWorkspace` (used for
 * "New conversation" search) intentionally ignores the workspace filter so
 * Fathur and Mazet — who live in separate workspaces for schedule/tasks —
 * can still find and message each other directly.
 */
export async function listWorkspaceUsers(workspaceId:WorkspaceId, q='', crossWorkspace=true):Promise<ChatMember[]> {
  let query=supabase.from('users').select('id,name,email,photo_url,workspace_id,status').eq('status','active').order('name').limit(100);
  if(!crossWorkspace) query=query.eq('workspace_id',workspaceId);
  if(q.trim()) query=query.or(`name.ilike.%${q.trim().replace(/[%_]/g,'') }%,email.ilike.%${q.trim().replace(/[%_]/g,'')}%`);
  const {data,error}=await query; if(error) throw error; return (data??[]).map(mapMember);
}

export async function listConversations(userId:string, workspaceId:WorkspaceId):Promise<ChatConversation[]> {
  const {data,error}=await supabase.from('conversation_members')
    .select('conversation_id,last_read_at,conversations!inner(id,workspace_id,kind,title,is_group,created_by,updated_at)')
    .eq('user_id',userId).eq('conversations.workspace_id',workspaceId).order('last_read_at',{ascending:false}).limit(100);
  if(error) throw error;
  const rows=(data??[]).map((r:any)=>({...(r.conversations||{}),last_read_at:r.last_read_at}));
  const result:ChatConversation[]=[];
  for(const row of rows){
    const count=await supabase.from('messages').select('id',{count:'exact',head:true}).eq('conversation_id',row.id).gt('created_at',row.last_read_at??'1970-01-01T00:00:00.000Z').neq('sender_id',userId).is('deleted_at',null);
    result.push(mapConversation({...row,unread_count:count.count??0}));
  }
  return result.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}

export async function ensureWorkspaceConversation(workspaceId:WorkspaceId,userId:string):Promise<ChatConversation>{
  const conversations=await listConversations(userId,workspaceId);
  const workspace=conversations.find(c=>c.kind==='workspace');
  if(workspace) return workspace;
  const id=await createConversation(workspaceId,'workspace',`${workspaceId==='fathur'?'Fathur':'Mazet'} Study Room`,[]);
  const {data,error}=await supabase.from('conversations').select('*').eq('id',id).single(); if(error) throw error; return mapConversation(data);
}

export async function createConversation(workspaceId:WorkspaceId,kind:'direct'|'group'|'workspace',title:string,memberIds:string[]):Promise<string>{
  const {data,error}=await supabase.rpc('create_conversation_with_members',{p_workspace_id:workspaceId,p_kind:kind,p_title:title,p_member_ids:memberIds});
  if(error) throw error; return String(data);
}

export async function loadConversationMembers(conversationId:string):Promise<ChatMember[]> {
  const {data,error}=await supabase.from('conversation_members').select('user_id,last_read_at,users!inner(id,name,email,photo_url,workspace_id)').eq('conversation_id',conversationId).order('joined_at');
  if(error) throw error; return (data??[]).map((r:any)=>mapMember({...r.users,last_read_at:r.last_read_at}));
}

async function loadAttachmentUrl(path:string|null):Promise<string|null>{
  if(!path) return null;
  const {data,error}=await supabase.storage.from('chat-attachments').createSignedUrl(path,3600);
  if(error) return null;
  return data?.signedUrl??null;
}

export async function fetchMessages(conversationId:string):Promise<ChatMessage[]> {
  const {data,error}=await supabase.from('messages').select('id,conversation_id,sender_id,body,reply_to,created_at,edited_at,deleted_at,is_pinned,mention_user_ids,attachment_path,attachment_name,attachment_type,attachment_size,users(name,photo_url),message_reactions(reaction),message_reads(user_id)').eq('conversation_id',conversationId).order('created_at',{ascending:true}).limit(500);
  if(error) throw error;
  return Promise.all((data??[]).map(async(r:any)=>{
    const reactions:Record<string,number>={}; (r.message_reactions??[]).forEach((x:any)=>{reactions[x.reaction]=(reactions[x.reaction]??0)+1;});
    return {id:r.id,conversationId:r.conversation_id,senderId:r.sender_id,senderName:r.users?.name??'Pengguna',senderPhotoUrl:r.users?.photo_url??null,body:r.body,replyTo:r.reply_to??null,createdAt:r.created_at,editedAt:r.edited_at??null,deletedAt:r.deleted_at??null,isPinned:!!r.is_pinned,mentionUserIds:r.mention_user_ids??[],attachmentPath:r.attachment_path??null,attachmentName:r.attachment_name??null,attachmentType:r.attachment_type??null,attachmentSize:r.attachment_size?Number(r.attachment_size):null,attachmentUrl:await loadAttachmentUrl(r.attachment_path??null),reactions,readBy:(r.message_reads??[]).map((x:any)=>x.user_id)};
  }));
}

export function subscribeMessages(conversationId:string,cb:(messages:ChatMessage[])=>void,onError?:(e:unknown)=>void){
  let active=true; const load=()=>void fetchMessages(conversationId).then(v=>{if(active)cb(v)}).catch(onError);
  load();
  const unsubs=[
    subscribeToPostgresChanges({topic:`chat:${conversationId}:messages`,table:'messages',filter:`conversation_id=eq.${conversationId}`,onChange:load,onError}),
    subscribeToPostgresChanges({topic:`chat:${conversationId}:reactions`,table:'message_reactions',onChange:load,onError}),
    subscribeToPostgresChanges({topic:`chat:${conversationId}:reads`,table:'message_reads',onChange:load,onError}),
  ];
  return()=>{active=false;unsubs.forEach(unsub=>unsub());};
}

export function subscribeConversationList(userId:string,workspaceId:WorkspaceId,cb:()=>void,onError?:(e:unknown)=>void){
  const unsubs=[
    subscribeToPostgresChanges({topic:`conversation-list:${userId}:${workspaceId}:members`,table:'conversation_members',onChange:cb,onError}),
    subscribeToPostgresChanges({topic:`conversation-list:${userId}:${workspaceId}:conversations`,table:'conversations',filter:`workspace_id=eq.${workspaceId}`,onChange:cb,onError}),
    subscribeToPostgresChanges({topic:`conversation-list:${userId}:${workspaceId}:messages`,table:'messages',onChange:cb,onError}),
  ];
  return()=>unsubs.forEach(unsub=>unsub());
}

export async function sendMessage(args:{conversationId:string;userId:string;body:string;replyTo?:string|null;mentionUserIds?:string[];file?:File|null}) {
  const body=args.body.trim(); if(!body && !args.file) return null;
  if(typeof navigator!=='undefined'&&!navigator.onLine){await enqueueMutation('chat.send_message',{...args,file:null});return null;}
  let attachment_path:string|null=null, attachment_name:string|null=null, attachment_type:string|null=null, attachment_size:number|null=null;
  const file=args.file??null;
  const messageId=crypto.randomUUID();
  if(file){
    if(file.size>15*1024*1024) throw new Error('Lampiran chat maksimal 15 MB.');
    attachment_name=file.name; attachment_type=file.type||'application/octet-stream'; attachment_size=file.size;
    const path=`${args.conversationId}/${args.userId}/${messageId}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    const {error:uploadError}=await supabase.storage.from('chat-attachments').upload(path,file,{upsert:false,cacheControl:'3600'}); if(uploadError) throw uploadError;
    attachment_path=path;
  }
  const {data,error}=await supabase.from('messages').insert({id:messageId,conversation_id:args.conversationId,sender_id:args.userId,body:body||'📎 Lampiran',reply_to:args.replyTo??null,mention_user_ids:args.mentionUserIds??[],attachment_path,attachment_name,attachment_type,attachment_size}).select('*').single();
  if(error) throw error;
  const {data:members}=await supabase.from('conversation_members').select('user_id').eq('conversation_id',args.conversationId).neq('user_id',args.userId);
  for(const member of members??[]){void createNotificationOnce({userId:member.user_id,title:'Pesan baru',message:body||`Lampiran: ${attachment_name??'file'}`,type:'comment',actionUrl:'/chat',idempotencyKey:`message:${messageId}:${member.user_id}`}).catch(()=>undefined);}
  return data;
}

export async function editMessage(messageId:string,userId:string,body:string){const next=body.trim();if(!next)throw new Error('Pesan tidak boleh kosong.');const {data,error}=await supabase.from('messages').update({body:next,edited_at:new Date().toISOString()}).eq('id',messageId).eq('sender_id',userId).select('*').single();if(error)throw error;return data;}
export async function softDeleteMessage(messageId:string,userId:string){const {error}=await supabase.from('messages').update({deleted_at:new Date().toISOString()}).eq('id',messageId).eq('sender_id',userId);if(error)throw error;}
export async function togglePinMessage(messageId:string,userId:string,pinned:boolean){const {error}=await supabase.from('messages').update({is_pinned:pinned}).eq('id',messageId).eq('sender_id',userId);if(error)throw error;}
export async function markMessagesRead(messageIds:string[],userId:string){if(!messageIds.length)return;const rows=messageIds.map(message_id=>({message_id,user_id:userId}));const {error}=await supabase.from('message_reads').upsert(rows,{onConflict:'message_id,user_id'});if(error)throw error;}
export async function markConversationRead(conversationId:string,userId:string){const {error}=await supabase.from('conversation_members').update({last_read_at:new Date().toISOString()}).eq('conversation_id',conversationId).eq('user_id',userId);if(error)throw error;}
export async function toggleReaction(messageId:string,userId:string,reaction:string){const {data:existing,error:lookup}=await supabase.from('message_reactions').select('message_id').eq('message_id',messageId).eq('user_id',userId).eq('reaction',reaction).maybeSingle();if(lookup)throw lookup;if(existing){const {error}=await supabase.from('message_reactions').delete().match({message_id:messageId,user_id:userId,reaction});if(error)throw error;}else{const {error}=await supabase.from('message_reactions').insert({message_id:messageId,user_id:userId,reaction});if(error)throw error;}}

export function subscribeTyping(conversationId:string,userId:string,onTyping:(users:string[])=>void){const channel=supabase.channel(`chat-typing:${conversationId}`).on('broadcast',{event:'typing'},({payload})=>{if(payload?.userId!==userId)onTyping([String(payload.userId)]);});channel.subscribe();return {setTyping:(typing:boolean)=>{void channel.send({type:'broadcast',event:'typing',payload:{userId,typing,at:Date.now()}})},dispose:()=>{void supabase.removeChannel(channel)}};}
export function subscribePresence(conversationId:string,userId:string,onChange:(payload:any)=>void){const channel=supabase.channel(`chat-presence:${conversationId}`).on('presence',{event:'sync'},()=>onChange(channel.presenceState())).on('presence',{event:'join'},(payload)=>onChange(payload)).on('presence',{event:'leave'},(payload)=>onChange(payload));channel.subscribe(async status=>{if(status==='SUBSCRIBED'){await channel.track({userId,status:'ONLINE',at:Date.now()});}});return {setStatus:(status:string)=>{void channel.track({userId,status,at:Date.now()});},dispose:()=>{void supabase.removeChannel(channel);}};}
