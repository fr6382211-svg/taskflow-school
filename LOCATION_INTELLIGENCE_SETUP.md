# Location & Routine Intelligence — v4.4

Configured master locations:
- School: -6.900682597550797, 112.04823280837307, radius 400m
- Home: -6.913402437279368, 112.05846677928949, radius 100m
- Tutoring: -6.902286975850672, 112.05698734436636, radius 200m

Google Maps:
- Environment variable: VITE_GOOGLE_MAPS_API_KEY
- The provided production key is stored in `.env.production` for local packaging only and `.env.production` is gitignored.

Database migration:
- `supabase/migrations/0016_location_routine_intelligence.sql`

The browser Location Engine uses Geolocation API in HTTPS production. Google Maps is loaded lazily only on the location dashboard panel.
