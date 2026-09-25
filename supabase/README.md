# Supabase setup for short card links

1. Create a Supabase project.
2. Open **SQL Editor**, paste `supabase/setup.sql`, and run it.
3. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project's URL and publishable key (the legacy anon key also works).
4. Restart Vite with `npm run dev`. Set the same two variables in the production hosting provider before deploying.

Do not put a `service_role` or secret key in a `VITE_` variable. These values are shipped to browsers. The SQL grants the browser access through narrowly scoped RPC functions and limits uploads to JPEG card files. The `card-media` bucket is public so shared-card images can load for recipients; only upload files intended to be shared publicly.
