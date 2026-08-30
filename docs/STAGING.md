# Boccone staging

Staging only. Production is not part of these commands or this deployment.

## Railway topology

Project: `boccone`

Environment: `staging`

Runtime services:

- `boccone-api` — public Elysia API.
- `boccone-admin` — public Vite admin web app.
- `Postgres` — private Railway PostgreSQL service, with its managed volume.

There is no current worker, broker, or cache runtime in this repository, so no
Railway service is created for one. The mobile app is an APK build, not a
Railway service.

Public URLs are recorded here after provisioning:

- API: <https://boccone-api-staging.up.railway.app>
- Admin: <https://boccone-admin-staging.up.railway.app>

The API and Admin use Railway-provided `*.up.railway.app` domains unless an
owned Boccone domain is verified and explicitly configured. PostgreSQL stays
private; application connections use the Railway reference variable
`${{Postgres.DATABASE_URL}}`.

## CLI operations

All commands must select the `staging` environment explicitly. The first link
is local CLI state only:

```bash
railway link --project boccone --environment staging
railway status --project boccone --environment staging --json
railway service list --project boccone --environment staging --json
```

Deploy the API and Admin from the repository root after their service
configuration has been set:

```bash
railway up --project boccone --service boccone-api --environment staging --ci
railway up --project boccone --service boccone-admin --environment staging --ci
```

The API is the single migration owner. Run/check migrations only against the
staging database:

```bash
railway logs --project boccone --service boccone-api --environment staging
railway service redeploy --project boccone --service boccone-api --environment staging
```

Useful verification commands:

```bash
railway service list --project boccone --environment staging --json
railway domain list --project boccone --service boccone-api --environment staging --json
railway domain list --project boccone --service boccone-admin --environment staging --json
railway logs --project boccone --service boccone-api --environment staging
```

Required API variables are set only on `boccone-api` in `staging`:

- `NODE_ENV=production` for production-like secure runtime behavior.
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
- `BETTER_AUTH_SECRET` generated and stored in Railway, never committed.
- `BETTER_AUTH_URL` equal to the final public API URL.
- `CORS_ALLOWED_ORIGINS` containing the final Admin origin only.
- `AI_ENCRYPTION_KEY` generated and stored in Railway when BYOK settings are enabled.

The Admin service uses a same-origin API proxy. This is required for the
HttpOnly Better Auth cookie because Railway's `*.up.railway.app` hosts are
different cookie sites:

- `API_PROXY_URL` equal to the final public API URL.
- `VITE_API_URL` equal to the final public Admin URL, so browser requests use
  `/api/*` on the Admin origin.

Do not print variable values. Use `railway variable list --json` only through a
redacted inspection when variable names need checking.

## HTTPS verification

After domains are assigned, verify actual endpoints, not only deployment
status:

```bash
curl --fail --silent --show-error https://<api-staging-domain>/api/health
curl --fail --silent --show-error -I https://<admin-staging-domain>/
```

For custom domains, `railway domain status <domain> --project boccone
--service <service> --environment staging` is authoritative for DNS and TLS.
Do not claim external DNS was changed unless it was changed with authenticated
DNS tooling.

## Android staging APK

Workflow: `.github/workflows/android-staging.yml`.

It uses GitHub-hosted Ubuntu, Bun 1.4, Java 17, Expo prebuild for Android, and
Gradle. It does not use iOS, EAS, or Railway credentials. The GitHub
`staging` environment must contain the non-secret variable `STAGING_API_URL`
with the final HTTPS API URL. The workflow rejects localhost, production, and
non-HTTPS targets before native generation.

Trigger manually from Actions (`workflow_dispatch`) or through a push to
`main`. Download artifact `boccone-staging-apk`; it contains only
`boccone-staging-android.apk`, a staging preview APK.

Install on a connected Android device with:

```bash
adb install -r boccone-staging-android.apk
```

No backend secret is included in the mobile build. The API URL is public
configuration and is embedded by Expo during the Android bundle step.
