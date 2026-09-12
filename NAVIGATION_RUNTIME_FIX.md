# Fathur School Hub v2.4 - Navigation & Runtime Fix

- Menu routing now uses explicit destinations.
- MediaBox and Watch Party menu items use TimeBox contextual query routes.
- Added /mediabox and /watch-party aliases for safe navigation.
- Added route-level RuntimeErrorBoundary so one broken page does not blank the whole application.
- Runtime errors now show a recovery screen with technical detail and Dashboard action.
- TimeBox scrolls to the MediaBox area for contextual menu routes.
- Netlify SPA fallback is included at public/_redirects.

After deployment:
1. npm install
2. npm run build
3. git add .
4. git commit -m "Fix navigation and runtime isolation"
5. git push origin main
