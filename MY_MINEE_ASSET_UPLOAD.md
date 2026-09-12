# My Minee Asset Upload

Admin can upload individual files or a `.zip` archive from the My Minee page.

- A ZIP is read in the browser and each contained file is uploaded separately.
- Non-image files are supported; the UI shows an appropriate file card and download/open action.
- Images, video, audio, and PDF files get inline previews where supported by the browser.
- Files are stored in Supabase Storage bucket `my-minee`; metadata is stored in `romantic_gallery`.
- The archive itself is not required to be stored in the application bundle.
- New metadata fields: `original_name`, `file_type`, `file_size`, `source_archive`, `previewable`.
- Run `supabase/migrations/0010_my_minee_assets.sql` before using the expanded asset library.
- The browser dependency `jszip` is required for ZIP import.
