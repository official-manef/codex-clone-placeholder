# Environment reference

Copy `.env.example` to `.env.local` for development. Empty optional values and `false` flags preserve the unlinked Convex demo. Configure only the runtime that executes a capability; frontend hosting, Convex deployments and infrastructure tooling do not automatically share environment values.

The table states actual template consumption. **Active** means implemented code reads the setting. **Adapter-only** means code reads it when the server adapter is explicitly called; no public workflow is installed. **Recipe-only** means the value is not consumed by application code yet. An environment variable alone never creates accounts, cloud resources, login flows or payment processing.

## Public application and SEO settings

These values are intentionally browser-visible. The root layout and metadata/SEO helpers consume them; never put credentials in a variable starting with `PUBLIC_`.

| Setting                           | Default | Consumption                                                                                                                                                                       |
| --------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_CONVEX_URL`               | Empty   | **Active:** creates the Convex client when set; use your deployment's client URL. Empty shows the unlinked demo.                                                                  |
| `PUBLIC_SITE_URL`                 | Empty   | **Active:** trusted canonical/sharing origin. HTTPS outside localhost; no path, credentials, query or fragment. Empty keeps the site non-indexable.                               |
| `PUBLIC_SEO_INDEXABLE`            | `false` | **Active:** explicit indexing opt-in, subject to each route's indexing policy. Set `true` only for a public production site with a configured origin. Keep preview/staging false. |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Empty   | **Active:** optional Google verification meta-tag content. Supply the token only, not an HTML tag or an API key.                                                                  |
| `PUBLIC_BING_SITE_VERIFICATION`   | Empty   | **Active:** optional Bing verification meta-tag content. Supply the token only.                                                                                                   |
| `PUBLIC_TWITTER_SITE`             | Empty   | **Active:** optional Twitter/X site handle, for example `@youraccount`.                                                                                                           |

Brand name, description, locale and theme stay in `src/lib/config/app.ts`; asset paths and dimensions stay in `assets.config.ts`. Environment settings supply deployment-specific values, not duplicate branding. Indexing directives are crawler instructions, never access control; private data still requires authentication and authorization.

`robots.txt` allows crawling so search engines can read the page's noindex directive.
It advertises `sitemap.xml` only when indexing is enabled; the sitemap is otherwise empty.
The sitemap includes only the current public landing page. Add actual public product URLs
to `sitemapDocument` when those routes exist, excluding private/demo/error pages and avoiding
invented last-modified dates. Do not block a page in robots.txt when relying on its noindex
tag. Use authentication for private previews. [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing),
[sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Private optional integrations

`src/lib/server/integrations/config.ts` consumes these settings lazily through `resolveIntegration(capability, env)`. SvelteKit server callers pass `$env/dynamic/private`; Convex Node actions pass their deployment environment. No resolved private configuration belongs in page data, a public barrel or client logs.

| Setting            | Default   | Consumption                                                                                                             |
| ------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `PAYMENTS_ENABLED` | `false`   | **Adapter-only:** enables config resolution for `createCheckout` and signature verification. Calls fail while disabled. |
| `PAYMENT_PROVIDER` | `doku`    | **Adapter-only:** only the real DOKU adapter is supported; an unknown enabled provider fails.                           |
| `DOKU_ENVIRONMENT` | `sandbox` | **Adapter-only:** `sandbox` or `production`; selects fixed provider endpoints.                                          |
| `DOKU_CLIENT_ID`   | Empty     | **Adapter-only:** required merchant identity when payments are enabled.                                                 |
| `DOKU_SECRET_KEY`  | Empty     | **Adapter-only, secret:** required for request signing and notification verification.                                   |
| `EMAIL_ENABLED`    | `false`   | **Adapter-only:** enables config resolution for `sendEmail`; calls fail while disabled.                                 |
| `EMAIL_PROVIDER`   | `resend`  | **Adapter-only:** only the real Resend adapter is supported; an unknown enabled provider fails.                         |
| `RESEND_API_KEY`   | Empty     | **Adapter-only, secret:** required sending credential when email is enabled.                                            |
| `EMAIL_FROM`       | Empty     | **Adapter-only:** required verified sender address, optionally `Name <address>`.                                        |

These transports are tested with mocks, not a completed merchant/mail sandbox lifecycle. Implement the order ledger, webhook idempotency, authorization, outbox and other acceptance requirements in [Optional integrations](integrations.md) before exposing a feature to users.

## Auth and cloud recipes

The three enable flags below are **active guards only when their resolver is called**: `false` returns a disabled result; `true` throws until that application integration is implemented. They are not a startup scan, login mechanism or deployment command. All remaining values below are planning placeholders ignored by the current app.

| Setting                          | Default           | Consumption / intended mapping                                                                                                                                                                                  |
| -------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_ENABLED`                   | `false`           | **Guard only:** the auth resolver rejects `true`.                                                                                                                                                               |
| `AUTH_PROVIDER`                  | `oidc`            | **Recipe-only:** proposed approach; choose the supported Svelte auth library before mapping its settings.                                                                                                       |
| `AUTH_ISSUER_URL`                | Empty             | **Recipe-only:** exact OIDC token issuer when implementing that approach.                                                                                                                                       |
| `AUTH_AUDIENCE`                  | Empty             | **Recipe-only:** intended token audience; map to the Convex provider application ID.                                                                                                                            |
| `AUTH_CLIENT_ID`                 | Empty             | **Recipe-only:** client registration identifier; not necessarily the token audience.                                                                                                                            |
| `AUTH_CLIENT_SECRET`             | Empty             | **Recipe-only, secret:** confidential server client credential only if the chosen library/flow requires it. Never expose to a browser.                                                                          |
| `GCP_ENABLED`                    | `false`           | **Guard only:** the GCP resolver rejects `true`.                                                                                                                                                                |
| `GCP_PROJECT_ID`                 | Empty             | **Recipe-only:** selected project; grants no access by itself.                                                                                                                                                  |
| `GCP_LOCATION`                   | Empty             | **Recipe-only:** selected service location/region; determine availability for that service.                                                                                                                     |
| `GCP_STORAGE_BUCKET`             | Empty             | **Recipe-only:** existing bucket name if Cloud Storage is selected. No bucket or storage adapter is created.                                                                                                    |
| `GOOGLE_APPLICATION_CREDENTIALS` | Omitted/commented | **Recipe-only in this app:** optional local ADC configuration-file path. Google auth libraries consume it only after an integration is installed. Never paste JSON contents here or commit the credential file. |
| `CLOUDFLARE_ENABLED`             | `false`           | **Guard only:** the Cloudflare resolver rejects `true`.                                                                                                                                                         |
| `CLOUDFLARE_ACCOUNT_ID`          | Empty             | **Recipe-only:** selected account for infrastructure/API access.                                                                                                                                                |
| `CLOUDFLARE_ZONE_ID`             | Empty             | **Recipe-only:** selected zone for zone-scoped APIs; not needed for every Cloudflare service.                                                                                                                   |
| `CLOUDFLARE_API_TOKEN`           | Empty             | **Recipe-only, secret:** scoped infrastructure API token; unnecessary in app runtime for ordinary DNS/proxy use.                                                                                                |

Auth variable names are this project's convention, not universal SDK names. GCP production on Cloud Run should use an attached service identity; the optional local ADC path is not a production credential strategy. Cloudflare Workers bindings are runtime objects configured through the platform, not strings passed to the integration resolver. Vendor CLIs may read their own variables independently of these application flags. See the [auth, GCP and Cloudflare recipes](integrations.md#authentication-recipe) for implementation and migration requirements.

## Convex deployment and release settings

| Setting             | Where it belongs                            | Consumption                                                                                                                                                                 |
| ------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONVEX_DEPLOYMENT` | Local CLI-managed `.env.local`              | Convex CLI selects the linked development deployment. Do not copy another project's value into a generated app.                                                             |
| `CONVEX_DEPLOY_KEY` | Hosting/CI secret store only when deploying | The deployment script and Convex CLI use it. Production keys belong only in Production; preview keys belong only in Preview. Do not put a production key in local examples. |

Store backend keys on the appropriate Convex deployment using the dashboard or `bunx convex env set`; adding them to the frontend host does not configure Convex actions. Keep development, preview and production values separate. When adding a new variable, update `.env.example`, this consumer matrix and the actual runtime validator together. Do not add an SDK solely because a placeholder exists.
