# Google Maps embedded configuration

This project intentionally includes `.env.production` in the project archive so Vite can read `VITE_GOOGLE_MAPS_API_KEY` during production builds.

The application reads the key from `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` in the Google Maps integration.

Before publishing the repository, restrict the Google Maps key in Google Cloud by HTTP referrer and API. This key is a browser-facing Maps key, not a server secret.
