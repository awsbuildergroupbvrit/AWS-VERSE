# AWS-VERSE

The workshop site serves static assets from `public/`. On Vercel, `api/registration.mjs` runs the registration API against Cloudflare D1. The existing Worker uses the same registration logic and schema.

## Deploy on Vercel

1. Import the AWS-VERSE GitHub repository and use `main` as the production branch. Keep the repository root as the root directory. The included Vercel configuration selects the Other preset and the `public` output directory. The frontend needs no compilation or npm dependencies.
2. Connect a Cloudflare D1 database. For a new database, run `drizzle/0000_registration.sql` once in its D1 console. To share seats with another live instance, point both sites to the same database. Separate databases each have their own 60-seat limit.
3. In Vercel project settings, set `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, and `D1_API_TOKEN`. The server-side token needs D1 Edit permission on the selected Cloudflare account. Use a separate test database for previews that accept test registrations.
4. Deploy after setting the variables. Visit `/api/registration` to verify the connection. A configured, empty database returns `{"remaining":60,"capacity":60}`. The site returns a 503 for registration when the database is unavailable.

## Local preview

With Node.js 24 or later, run `node build.mjs` and then `node preview.mjs`. The preview uses a local SQLite database under `.local/` and prints its URL when ready.
