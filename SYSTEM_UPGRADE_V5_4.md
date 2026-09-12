# Fathur School Hub v5.4 — Build-Safe Unified Upgrade

This release unifies the MediaBox remote stack with School Hub contracts.

- Restores RoomState searchSettings and API-key record types.
- Restores WatchParty settings management methods.
- Exports YouTube parse/search types consistently.
- Allows all translation keys used by legacy/new Remote UI while retaining runtime fallback.
- Keeps Location Context Engine's expanded attendance/route fields.
- Uses a neutral internal UI namespace `@schoolhub/ui`; no user-facing BoredKevin branding is introduced.
- Preserves existing School Hub routes and features.
