# Fathur School Hub v5.4 — Unified Build Rebuild

This release unifies the MediaBox remote contract with School Hub while retaining existing School Hub routes and location intelligence.

- RoomState includes search settings required by Remote/TV settings.
- API-key/search result contracts live in one typed module.
- WatchParty context exposes settings, rate-limit, key-management, volume, and optional-title APIs.
- YouTube parser/search exports are consistent.
- Translation keys accept all feature keys and retain runtime fallback.
- Location types include attendance, route, uncertainty, late-risk, and no-movement states.
- Internal UI namespace is neutral: `@schoolhub/ui`.
