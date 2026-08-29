AGENTS.md — Boccone AI Implementation Guide

This file instructs coding agents and contributors on how to work inside the Boccone AI repository.

1. Core mission

Build a maintainable, production-aware, open-source monorepo for Boccone AI.

The repository must feel cohesive, readable, typed, and intentional.

2. Development model

2.1 Vertical slices only

Implement features vertically from A to Z.

A vertical slice includes, where relevant:

database schema and migration;

shared contracts;

backend business logic;

API route(s);

mobile UI;

admin UI;

loading/error/empty states;

tests;

documentation.

Do NOT implement features horizontally in disconnected layers.

3. Initial implementation order

Follow this priority order unless explicitly changed:

repository scaffolding;

backend scaffolding;

authentication and auth flows;

design system foundation;

product features;

continue evolving the admin app progressively in parallel.

4. Repository structure

Expected structure:

apps/
mobile/
api/
admin/

packages/
ai/
auth/
db/
contracts/
design-tokens/
api-client/
ui-mobile/
ui-web/
config/
utils/

Keep responsibilities explicit.

5. Dependency boundaries

App packages may depend on shared packages.

Shared packages must not depend on app packages.

Provider-specific AI code belongs only in packages/ai.

Public API contracts belong in packages/contracts.

OpenAPI-generated client artifacts belong in a shared API client package; do not hand-write endpoint clients in mobile or admin apps.

Regenerate that package from `packages/api-client/openapi.yaml` with `bun run generate`; generated files are not hand-edited.

Better Auth's client SDK owns authentication calls. Use the generated Hey API client plus TanStack Query for authenticated application resources.

Elysia route factories are kept modular and use `AnyElysia` only at composition
boundaries where Elysia's recursive route types become impractical. Route
handlers still use explicit application types, central JSON parsing, Zod
validation, and server-side `requireSession` checks. Admin account operations
delegate to Better Auth's admin plugin, are revalidated against public Zod
contracts, and write an audit record after each successful mutation.

Database schema belongs in packages/db.

Do not expose raw DB tables directly as public API contracts.

6. Stack constraints

Mobile

Expo

React Native

TypeScript

Expo Router

TanStack Query for server state

Hey API-generated clients from the OpenAPI contract

Zod for runtime validation

Mobile localization

All mobile user-facing copy must use the typed localization layer in
`apps/mobile/src/i18n`. The initial locales are English and Italian. Use the
persisted `LanguageSelector` and add translation keys for every new mobile
vertical; do not hardcode mobile labels or messages. The admin app remains
English-only until explicitly changed.

API

ElysiaJS on Bun

TypeScript

Drizzle ORM

PostgreSQL

Better Auth

Infra

Railway

Bun 1.4 workspaces

Turborepo

7. Security rules

Never store AI keys in plaintext.

Never log secrets.

Never expose AI keys via the admin app.

Never persist meal photos.

Always enforce server-side authorization.

Validate all inputs.

Use migrations.

Password-reset links may be logged only by the development sender. Production must use a configured transactional email provider and must never fall back to console delivery.

8. AI rules

Use a provider-agnostic abstraction layer (prefer TanStack AI unless proven unsuitable).

Every provider implementation must return normalized structured output.

Do not leak provider-specific SDK responses to the app.

9. Admin app rules

The admin app is an operational control surface with full CRUD over application
data introduced by the product verticals. It is not a secrets or security
surface: operational control never includes plaintext credentials, encryption
keys, session secrets, or silent impersonation.

Allowed:

user search;

user creation and profile updates;

role changes, account suspension/reactivation, and account removal;

inspect meals/targets;

inspect, create, update, and delete all application data exposed by the
current product verticals, including targets, meals, diary entries, and known
meals;

safe corrections and destructive actions must be explicit, authorized, and
audited;

account state management;

audit logs.

Forbidden:

viewing plaintext AI keys;

accessing secrets;

silent impersonation.

10. Design system rules

Use semantic tokens from packages/design-tokens. Never hardcode colors,
font sizes, or spacing values in app or UI package code.

Build reusable primitives in packages/ui-mobile and packages/ui-web with
mirrored component names, props, variants, and tones. See
docs/design-system.md for the architecture, theming contract, and
component inventory.

Every component must resolve colors through the active theme
(ThemeProvider / useTheme), so light, dark, and system theming work
everywhere. Do not reference light-theme values directly.

Interactive components must guarantee a minimum 44px touch target on
mobile and visible focus states on web.

Avoid random hardcoded styles.

Mobile localization is a product foundation: keep all mobile user-facing copy
in the central typed translations and keep locale selection persistent. Do not
add a second localization mechanism in a feature package.

The recurring mascot is a stylized broccoli AI character without headphones.

11. Code quality rules

Prefer explicit code over premature abstraction.

Avoid any.

Avoid giant route files.

Keep business logic out of presentation components and thin route handlers.

Write readable modules.

Reuse established patterns.

12. Testing rules

Test critical flows and domain logic.

Prioritize:

calculations;

auth boundaries;

encryption/decryption;

AI normalization;

meal creation/editing;

admin authorization.

Do not require live paid AI calls in default tests.

13. Definition of done

A feature is done when:

implementation works end-to-end;

validations exist;

auth is enforced;

relevant admin support exists if applicable;

tests pass;

types pass;

lint passes;

loading/error/empty states exist;

docs are updated.

14. Anti-patterns

Do NOT introduce:

microservices;

custom auth;

offline sync architecture for MVP;

photo persistence;

duplicated contracts;

god objects;

route-handler spaghetti.

15. If unsure

If you are uncertain, inspect the codebase and reuse existing patterns rather than inventing a new architecture.
