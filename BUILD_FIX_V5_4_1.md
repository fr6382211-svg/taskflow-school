# v5.4.1 Clean Remote Rebuild

This rebuild removes compile-time dependence on the old `@boredkevin/ui` package name by mapping it to the project's own `@schoolhub/ui` implementation. The vendor internals use the local `@bkui/*` alias.

It also aligns the MediaBox autoplay contract so host code can pass music-preference and artist-history options safely.

No runtime feature has been removed.
