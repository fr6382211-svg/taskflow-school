# Fathur SchoolHub V7.2 — Massive Integrated Rebuild

## Fokus
V7.2 memperkuat V7.1 menjadi Personal School Operating System yang lebih terintegrasi, dengan Chat 2.0 sebagai collaboration layer utama.

## Perbaikan build
- `AppShell.tsx`: referensi `paletteCommands` dinormalkan ke `commandItems`.
- `useConnectionState.ts` / `connectionService.ts`: unsubscribe React Effect sekarang mengembalikan `void` yang valid.
- `Calendar.tsx`: `year` dan `month` dideklarasikan sebelum dipakai oleh effect.
- `goalService.ts`: penghitungan hari Senin tidak lagi menggunakan `Intl.DateTimeFormat` option `weekday: numeric` yang tidak valid pada TypeScript DOM.
- `vite.config.d.ts` stale dibuang dari root build input.

## Chat 2.0
### UI
- Conversation inbox per workspace.
- Direct Message dan Study Group.
- Search ruang.
- Search pesan yang sudah dimuat.
- Reply.
- Edit pesan milik sendiri.
- Soft delete pesan milik sendiri.
- Pin pesan.
- Reaction multi-emoji.
- Read receipt.
- Typing indicator.
- Presence channel realtime.
- Attachment upload sampai 15 MB ke private Supabase Storage bucket.
- Responsive mobile/desktop layout.
- Offline queue integration.
- Unread badge per conversation.
- New conversation modal dengan user search.

### Realtime
- Messages.
- Reactions.
- Read receipts.
- Conversation/member updates.
- Presence.
- Typing broadcast.

### Security
- Conversation access melalui membership RLS.
- Attachment bucket private.
- Attachment read hanya untuk anggota conversation/admin.
- Conversation creation dilakukan melalui security-definer RPC dengan workspace validation.
- Message edit/delete dibatasi author/admin.

## Supabase
Migration baru:
- `0023_chat_2_collaboration.sql`

Perubahan schema utama:
- `messages.edited_at`
- `messages.is_pinned`
- `messages.attachment_path`
- `messages.attachment_type`
- `messages.attachment_size`
- `messages.mention_user_ids`
- `conversations.kind`
- `conversations.avatar_url`
- `conversations.archived_at`
- private bucket `chat-attachments`
- RPC `create_conversation_with_members`

## Integrity
Paket mempertahankan modul existing dan tidak dimaksudkan menghapus fitur lama. Business state tetap cloud-first melalui Supabase; browser storage hanya untuk kebutuhan session/auth atau offline cache/queue sesuai arsitektur V7.
