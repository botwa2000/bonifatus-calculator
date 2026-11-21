# Search Console on /admin/stats — one-time access

The "Google Search" panel on `/admin/stats` is filled nightly by the `search_console` feed in
`lib/stats/store-import.ts` (tables from `drizzle/migrations/0027_search-console.sql`). It uses the
**same Google service account as the Play feeds** (`PLAY_SERVICE_ACCOUNT_JSON`, already a Swarm secret),
asking only for the read-only scope `webmasters.readonly`. No new secret is needed and nothing goes in
the repo.

Checked on 2026-11-21 from the production container: the service account gets a token, but Google answers
`403 Search Console API has not been used in project 227257601473 before or it is disabled`.
Two things are needed, both by the owner of the Search Console property:

## 1. Turn on the Search Console API in the service account's Cloud project

1. Open <https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=227257601473>
   (signed in with the Google account that owns the Play / Cloud project).
2. Click **Enable**. It can take a few minutes to apply.

## 2. Give the service account read access to the property

1. Find the service account's address: Google Play Console → **Users and permissions** — it is the
   `…@….iam.gserviceaccount.com` user already there. (The dashboard also shows it in the panel's
   "Not connected" message once step 1 is done.)
2. Open <https://search.google.com/search-console> → choose the **bonifatus.com** property
   (the domain property `sc-domain:bonifatus.com` if it exists, else `https://bonifatus.com/`).
3. **Settings → Users and permissions → Add user**: paste the service-account address,
   permission **Restricted** (read-only), **Add**.

## 3. Check

On `/admin/stats` click **↻ Store import** (or wait for 04:30 UTC). The "Google Search" panel then shows
clicks, impressions and average position per Ratgeber page and the grade calculator, and each page's
index status. `Health & imports` lists `search_console` with its result.

If more than one bonifatus.com property is visible, set `GSC_SITE_URL` (a `prod_GSC_SITE_URL` secret listed in
`docker-stack.prod.yml`) to the one to use, e.g. `sc-domain:bonifatus.com`; otherwise nothing to configure.
