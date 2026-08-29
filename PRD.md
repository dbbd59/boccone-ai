# Boccone AI — Product Requirements Document (PRD)

## 1. Overview

**Boccone AI** is a mobile-first food diary and calorie/macronutrient tracker.

Users can:

- authenticate with Google / Apple (and optionally email/password);
- manually set daily nutrition targets;
- configure an AI provider, API key, and model;
- log meals manually, from text, or from one or more photos;
- review and edit AI output before saving;
- browse their diary and calendar;
- inspect statistics;
- use an AI assistant grounded in their own food history.

The product is **not medical** and must not position itself as a clinical or diagnostic nutrition app.

The project must be built as an **open-source monorepo** suitable for GitHub publication and as a strong engineering portfolio project.

---

## 2. Mandatory files

The repository MUST contain at least:

- `README.md`
- `PRD.md`
- `AGENTS.md`
- `.env.example`

### 2.1 `AGENTS.md`

Before feature implementation begins, create and maintain a root-level `AGENTS.md` file.

`AGENTS.md` is the operating manual for coding agents (including Codex) and contributors.

It MUST describe:

- repository structure;
- package responsibilities;
- dependency boundaries;
- vertical-slice development rules;
- coding standards;
- testing standards;
- design-system rules;
- auth/security constraints;
- AI-provider abstraction rules;
- migration rules;
- admin/back office rules;
- logging and secret-handling rules;
- definition of done;
- anti-patterns to avoid.

---

## 3. Product principles

### 3.1 Non-medical product

Boccone AI tracks calories and macros.

It MUST NOT:

- provide medical advice;
- diagnose conditions;
- claim clinical or professional nutritional accuracy;
- position itself as a healthcare tool;
- present the AI assistant as a dietitian.

### 3.2 AI is assistive, not authoritative

AI output is always an estimate.

Every AI-generated meal MUST pass through a confirmation/edit screen before being saved.

### 3.3 Mobile-first

The primary product is a **native mobile app**.

### 3.4 Open-source quality

The codebase must prioritize:

- maintainability;
- explicit boundaries;
- good DX;
- clean architecture;
- strong typing;
- reusable patterns;
- production-aware constraints.

### 3.5 Privacy-conscious

Meal photos are transient and MUST NOT be permanently stored.

### 3.6 Admin access is operational and complete

An admin back office exists as the operational control surface for the product.
Authorized admins MUST be able to inspect, create, update, and delete all
application data exposed by implemented product verticals, including targets,
meals, diary entries, and known meals.

This is not a secrets or security surface. Admin CRUD MUST NOT reveal plaintext
AI API keys, encryption keys, session secrets, or enable silent impersonation.

---

## 4. Product scope

### 4.1 Target user

A normal consumer who wants to track food, calories, and macros against self-defined targets.

### 4.2 Out of scope for MVP

Do NOT implement these in MVP unless explicitly reprioritized:

- barcode-based nutrition lookup;
- weight tracking;
- medical plans;
- auto-calculation of calorie needs from height/weight/activity;
- health-device integrations;
- social features;
- offline-first sync;
- stored meal photo history;
- AI fine-tuning or user-specific training.

---

## 5. Core MVP features

### 5.1 Authentication

Users can authenticate with:

- Google;
- Apple;
- optionally email/password and password reset flows.

Password reset / account recovery should be supported if email/password auth is included.

### 5.2 Daily targets

Users can manually set daily targets for:

- calories;
- protein;
- carbohydrates;
- fat.

Each target should be independently optional.

### 5.3 Meal creation

Users can create meals via:

- camera;
- gallery;
- natural-language text;
- manual entry.

Supported meal categories for MVP:

- Breakfast
- Lunch
- Dinner
- Snack

The category is chosen by the user.

### 5.4 AI meal analysis

AI meal analysis must support:

- one or more images per meal;
- provider-agnostic execution;
- normalized structured output;
- uncertainty/range display;
- confirmation/edit before save.

### 5.5 Diary and calendar

Users can:

- open a day;
- browse meal history;
- navigate via calendar;
- inspect totals;
- edit or delete existing meals.

### 5.6 Statistics

MVP statistics include:

- daily calorie totals;
- average calories over time;
- average macros;
- simple weekly trends;
- simple monthly trends;
- days above/below/in target;
- meal-category breakdown.

### 5.7 Known meals

Support “known meals” / recurring meals.

This is not model training.
It is a reusable pattern system that helps recognize common meals and suggest reuse.

### 5.8 AI assistant

The AI assistant is part of MVP.

It can answer questions grounded in the user’s data, for example:

- how many calories are left today;
- how the week went;
- how much protein was eaten this week;
- what a reasonable dinner could be based on remaining target.

The assistant must stay within non-medical boundaries.

---

## 6. Visual identity and mascot

The recurring mascot across the project is a **stylized broccoli AI character**.

Requirements for the mascot:

- broccoli-based;
- cute, friendly, modern, and recognizable;
- stylized rather than highly realistic;
- should work well as an app branding character;
- should feel AI-related through subtle visual language, not through clichéd sci-fi accessories;
- **must not wear headphones/headsets**;
- should be usable in onboarding, empty states, assistant surfaces, and branding assets.

The design system and product visuals should feel:

- calm;
- modern;
- soft;
- food-oriented;
- trustworthy;
- mobile-app appropriate.

Avoid:

- clinical aesthetic;
- gym/bodybuilding clichés;
- excessive realism;
- visual noise.

---

## 7. Architecture

### 7.1 Monorepo

Use a **monorepo**.

Preferred tooling:

- Bun 1.4 workspaces;
- Turborepo.

Recommended structure:

```text
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
```

### 7.2 Applications

#### `apps/mobile`

- Expo + React Native + TypeScript;
- primary end-user application;
- uses Expo Router;
- contains meal flows, diary, statistics, settings, assistant, onboarding.

#### `apps/api`

- ElysiaJS + TypeScript on Bun;
- contains authentication integration, business logic, AI orchestration, authorization, and data access.

#### `apps/admin`

- web-based back office;
- internal/admin-facing;
- developed progressively in parallel with the main product.

### 7.3 Backend stack

Preferred backend stack:

- TypeScript;
- ElysiaJS;
- Bun runtime;
- Drizzle ORM;
- PostgreSQL;
- Better Auth;
- Railway deployment.

### 7.4 Frontend/mobile stack

Preferred mobile stack:

- Expo;
- React Native;
- TypeScript;
- Expo Router.
- TanStack Query for server state and async request lifecycle;
- Hey API-generated clients from the backend OpenAPI contract;
- Zod schemas for runtime validation at external-data boundaries.

Mobile user-facing copy must use a centralized, typed localization layer. The
initial mobile locales are English and Italian, with a persisted in-app
language selector and device-locale detection as the default. Every new mobile
vertical must add translation keys instead of hardcoding labels or messages.
The admin app is English-only for now.

The generated API client is a shared package. Authentication remains owned by
Better Auth's client SDK; feature and session-resource requests use the Hey API
client and TanStack Query.

---

## 8. Authentication requirements

Authentication is a **first-priority implementation area**.

Use **Better Auth** unless there is a concrete blocker.

Support:

- Google login;
- Apple login;
- optional email/password sign-up/sign-in;
- password reset / account recovery if email/password is supported;
- backend-authenticated sessions;
- secure authorization boundaries.

Do NOT build a custom authentication system.

---

## 9. AI provider abstraction

Use an AI-agnostic abstraction layer.

Preferred direction: **TanStack AI** or another robust provider-agnostic wrapper if it proves clearly better during implementation.

The architecture MUST support user-configured:

- provider;
- API key;
- model.

Supported providers should be easy to extend and may include:

- OpenAI;
- Anthropic;
- Gemini;
- OpenRouter;
- OpenAI-compatible providers;
- future providers.

Provider-specific logic MUST live in the AI layer/package only.

Do NOT scatter provider-specific code across the app or routes.

### 9.1 AI-generated meal contract

The meal analysis output must be normalized to a shared contract similar to:

```ts
export type MealAnalysis = {
  name: string;
  calories: {
    estimated: number;
    min: number;
    max: number;
  };
  macros: {
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  items: Array<{
    name: string;
    estimatedAmount?: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  }>;
  confidence: "low" | "medium" | "high";
};
```

Use runtime validation (preferably Zod).

---

## 10. AI credentials

AI credentials may be stored server-side for cross-device access.

They MUST:

- be encrypted before persistence;
- never be stored in plaintext;
- never appear in logs;
- never be returned in plaintext to clients;
- never be visible in the admin app;
- only be decrypted in memory when needed for provider calls.

Use authenticated encryption (e.g. AES-256-GCM) and a server-side master key stored securely in Railway environment secrets.

---

## 11. Data and privacy rules

### 11.1 Meal photos

Meal photos are transient.

They MUST NOT be stored in:

- PostgreSQL;
- object storage;
- analytics;
- logs;
- backups.

Only the normalized meal data and user-confirmed nutrition values may be persisted.

### 11.2 Ownership and authorization

User-owned data must always be authorized server-side from the authenticated session.

Never trust a client-supplied user ID.

---

## 12. Admin back office

A back office **does make sense** and should be included in the architecture.

However, it should be **operational and controlled**, not overpowered.

### 12.1 Purpose

The admin app exists to:

- inspect user accounts;
- inspect meal/target data;
- debug issues;
- create, update, and remove application data to resolve operational issues;
- manage account state;
- support the product’s operations.

### 12.2 Allowed admin capabilities

Admins may:

- search users;
- inspect user profile metadata;
- create users and update their name/email;
- manage the explicit `user`/`admin` role boundary;
- inspect daily targets;
- inspect meals and meal items;
- create, edit, and delete all application data exposed by an implemented
  product vertical, including targets, meals, diary entries, and known meals;
- require confirmation for destructive actions and audit every sensitive
  mutation;
- suspend or unsuspend users;
- trigger account deletion flows;
- inspect AI provider/model metadata;
- inspect whether a credential exists.

### 12.3 Forbidden admin capabilities

Admins MUST NOT:

- view AI API keys in plaintext;
- decrypt credentials for display;
- access secrets or encryption keys;
- access session secrets;
- silently impersonate users.

### 12.4 Audit logs

Sensitive admin actions MUST create audit logs.

The initial authentication vertical includes the account-management slice:
user listing/detail, create, profile update, role change, ban/unban, account
removal, and an audit log. These operations remain server-authorized and use
Better Auth's admin plugin; the admin frontend is English-only.

---

## 13. Design system

The project MUST have a real design system.

Do not assemble screens from one-off components and hardcoded tokens.

### 13.1 Token layer

Create shared design tokens for:

- colors;
- spacing;
- typography;
- sizing;
- radii;
- shadows/elevation;
- motion.

Prefer semantic tokens such as:

- `background.primary`
- `background.secondary`
- `text.primary`
- `text.secondary`
- `border.default`
- `accent.primary`
- `feedback.positive`
- `feedback.warning`
- `feedback.negative`
- `nutrition.protein`
- `nutrition.carbs`
- `nutrition.fat`

### 13.2 UI packages

Prefer separate UI packages for mobile and web/admin:

- `packages/ui-mobile`
- `packages/ui-web`

with shared design tokens.

### 13.3 Core primitives

Build reusable primitives such as:

- Text;
- Button;
- IconButton;
- Input;
- Surface/Card;
- Stack;
- Screen;
- Divider;
- EmptyState;
- ErrorState;
- Skeleton;
- Sheet/Modal;
- Progress indicators.

---

## 14. UX rules

### 14.1 Today screen

The Today screen is the primary home screen.
It should show:

- calories consumed today;
- calorie target if configured;
- macro totals and targets;
- meal sections;
- obvious primary “Add Meal” action.

### 14.2 Confirmation screen

AI-generated meals MUST go through a confirmation screen showing:

- meal name;
- estimated calories;
- calorie range;
- protein/carbs/fat;
- confidence;
- food items;
- estimated quantities;
- editable fields;
- category selector;
- save action.

### 14.3 Manual entry

Manual entry must work even without AI configured.

### 14.4 AI text input

Natural-language input must produce the same normalized flow as image-based AI input.

---

## 15. Testing requirements

Testing is mandatory.

Prioritize:

- domain logic;
- totals and aggregations;
- target calculations;
- provider normalization;
- encryption/decryption;
- authorization;
- important API integration paths;
- critical end-to-end flows.

Do not make the default suite depend on live paid AI requests.
Provider calls must be mockable.

---

## 16. Definition of done

A feature is done only when the full relevant vertical slice is complete, including:

- schema/migration if needed;
- contract/validation;
- backend logic;
- API endpoint;
- mobile UI;
- admin UI if relevant;
- loading, empty, and error states;
- tests;
- documentation updates.

A screen alone is not a completed feature.
An endpoint alone is not a completed feature.

---

## 17. Implementation strategy and order

This section is intentionally prescriptive.

### 17.1 Overall approach

Development MUST happen through vertical slices.

However, the initial sequence should follow the founder’s preferred priority:

1. **authentication + backend scaffolding first**;
2. **sign-up / sign-in / auth flows / password recovery**;
3. **design system foundation**;
4. **feature development afterwards**;
5. **admin back office should continue to evolve progressively in parallel**.

### 17.2 Detailed implementation steps

#### Step 0 — Repository foundation

Build the monorepo foundation:

- Bun 1.4 workspace;
- Turborepo;
- baseline linting/formatting/type-checking;
- `README.md`;
- `PRD.md`;
- `AGENTS.md`;
- environment handling;
- local Postgres setup;
- CI skeleton.

#### Step 1 — Backend scaffolding

Set up the backend skeleton first:

- ElysiaJS app structure;
- Drizzle integration;
- PostgreSQL connection;
- migration system;
- Better Auth integration scaffolding;
- base API conventions;
- error handling conventions;
- logging/redaction baseline.

In parallel, bootstrap the admin app foundation and basic routing.

#### Step 2 — Authentication vertical

Implement authentication thoroughly:

- sign up;
- sign in;
- session handling;
- Google auth;
- Apple auth;
- optional email/password;
- password recovery/reset if email/password is enabled;
- protected backend routes;
- mobile login/onboarding UI;
- admin authorization foundation.

In parallel, continue evolving the admin app with at least:

- admin auth gate;
- role/permission foundation.

#### Step 3 — Design system foundation

Before building many product screens, create the design system foundation:

- design tokens;
- typography;
- spacing;
- color semantics;
- base components;
- theming strategy;
- mobile and web/admin primitives.

The broccoli mascot can begin to be integrated into empty states, onboarding, and branding references.

#### Step 4 — Daily targets

Implement user-configured targets end-to-end.

Continue admin visibility and full CRUD for user targets.

#### Step 5 — Manual meals

Implement manual meal creation, editing, deletion, and Today aggregation.

Continue admin visibility and full CRUD for meals.

#### Step 6 — AI configuration

Implement provider/model/key configuration, secure storage, and connection test.

Continue admin metadata visibility (without key visibility).

#### Step 7 — AI text meals

Implement text-to-meal analysis and confirmation flow.

#### Step 8 — AI image meals

Implement camera/gallery/multi-image meal analysis and confirmation flow.

#### Step 9 — Diary and calendar

Implement historical browsing.

#### Step 10 — Statistics

Implement useful trends and summary views.

#### Step 11 — Known meals

Implement recurring meal recognition and reuse.

#### Step 12 — AI assistant

Implement assistant grounded in user data.

#### Step 13 — Admin operations expansion

Continue evolving the back office in parallel throughout development, and by this stage ensure it supports:

- user search;
- user detail;
- targets inspection and full CRUD;
- meals inspection and full CRUD;
- full CRUD for every other application-data vertical as it lands;
- account state management;
- audit logs.

### 17.3 Ongoing rule for admin work

The admin/back office MUST NOT be postponed until the very end.

It should be developed progressively alongside the main application as relevant product verticals are introduced.

---

## 18. Engineering guardrails

Do NOT introduce unnecessary complexity such as:

- microservices;
- event sourcing;
- CQRS;
- unnecessary background job infrastructure;
- offline sync architecture;
- custom auth;
- random abstractions without proven need.

Prefer a clean modular monolith.

Do NOT:

- leak secrets;
- store AI keys in plaintext;
- store meal photos;
- scatter business logic across route handlers;
- duplicate schemas unnecessarily;
- introduce weak typing with `any`;
- create half-finished parallel patterns.

---

## 19. MVP success criteria

The MVP is successful when a user can:

1. authenticate;
2. configure optional calorie and macro targets;
3. configure an AI provider/model/key;
4. manually add a meal;
5. add a meal from text;
6. add a meal from one or more photos;
7. review/edit AI output;
8. save meals to the diary;
9. browse diary history via calendar;
10. inspect useful statistics;
11. interact with a non-medical AI assistant grounded in their data.

And an authorized admin can:

- inspect users and relevant application data;
- create, update, and delete relevant application data safely;
- do so without access to plaintext AI keys.

---

## 20. Final instruction

Build **one coherent product and one coherent codebase**.

When trade-offs arise, prioritize:

1. correctness;
2. security;
3. maintainability;
4. product coherence;
5. developer experience.

Reuse established patterns once a slice has set a good precedent.
