# My Minee setup

The 46 source photos from `my minee.zip` are NOT bundled into the application. The app uses Supabase Storage bucket `my-minee` and metadata table `public.romantic_gallery`.

1. Run `supabase/migrations/0009_my_minee_gallery.sql` in Supabase.
2. Sign in with an admin account.
3. Open **My Minee** and use **Tambah Foto** to upload the 46 JPEGs after extracting the ZIP.
4. The page writes image files to Storage and metadata to the database.

This keeps the photo bytes out of GitHub and out of the deployment bundle.
