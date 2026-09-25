# Supabase setup for short card links

1. Create a Supabase project.
2. Open **SQL Editor**, paste `supabase/setup.sql`, and run it.
3. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project's URL and publishable key (the legacy anon key also works).
4. For Cloudflare Workers Builds, keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Build variables and secrets** so the Vite app can detect Supabase configuration.
5. In the Worker dashboard, add runtime variables under **Settings → Variables and secrets**:
   - `SUPABASE_URL`: the same project URL.
   - `SUPABASE_ANON_KEY`: the same publishable/anon key. Store it as a secret if Cloudflare offers the choice.
6. Deploy the Worker again after adding the runtime variables. The Worker proxies only the app's card upload and shared-card RPC requests through `/api/supabase`; this lets share links use a short card ID instead of embedding card data and images in the URL.

Do not put a `service_role` or secret key in a `VITE_` variable. These values are shipped to browsers. The SQL grants the browser access through narrowly scoped RPC functions and limits uploads to JPEG card files. The `card-media` bucket is public so shared-card images can load for recipients; only upload files intended to be shared publicly.
