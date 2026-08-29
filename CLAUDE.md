# Copilot Instructions — Smart Pantry (MealPlanner)

> **Canonical reference for AI assistants and contributors.**
> Keep this file up-to-date whenever architecture decisions change.

---

## 1. Project Overview

**Smart Pantry** is a full-stack AI-powered meal planner built with **Next.js 16** (App Router). It lets users manage their pantry, get AI recipe suggestions, plan meals, and collaborate on shopping lists.

| Layer          | Technology                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, React 19, React Compiler enabled)                                                                       |
| Language       | TypeScript (strict mode)                                                                                                        |
| Database       | PostgreSQL via Prisma ORM 7 (`@prisma/adapter-pg` driver adapter)                                                               |
| Auth           | NextAuth v4 (Credentials provider, JWT strategy)                                                                                |
| State (server) | Server Components (initial reads) + TanStack React Query v5 (client-side caching, optimistic updates)                           |
| State (client) | Zustand (UI-only state — never server/auth state)                                                                               |
| Forms          | React Hook Form + Zod validation                                                                                                |
| UI             | shadcn/ui (New York style) + Radix UI primitives + Tailwind CSS v4                                                              |
| Icons          | Lucide React                                                                                                                    |
| Notifications  | Sonner (`components/ui/sonner.tsx`), driven globally via TanStack Query's `MutationCache`                                       |
| Linting        | ESLint (next/core-web-vitals + typescript + simple-import-sort + type-aware promise checks + full jsx-a11y + JSX quality rules) |
| Formatting     | Prettier                                                                                                                        |

---

## 2. Folder Structure

```
meal-planner/
├── prisma/
│   ├── schema.prisma            # Single schema, all domain models
│   ├── seed.mts                 # Reference-data seed (allergies) — the one sanctioned place outside server/ that touches Prisma
│   └── migrations/              # Prisma Migrate output
│
├── public/                      # Static assets
│
├── src/
│   ├── proxy.ts                 # Next.js middleware (auth redirect logic)
│   │
│   ├── actions/                 # ⭐ Next.js Server Actions (grouped by domain)
│   │   └── <domain>/
│   │       └── actions.ts       # 'use server' functions — default entry point for mutations
│   │
│   ├── app/                     # Next.js App Router pages & API routes
│   │   ├── layout.tsx           # Root layout (providers wrap here)
│   │   ├── globals.css          # Tailwind + shadcn theme tokens
│   │   ├── page.tsx             # Dashboard (home) — Server Component
│   │   ├── not-found.tsx        # 404 page
│   │   ├── <route>/
│   │   │   ├── page.tsx              # Server Component — fetches initial data, no 'use client'
│   │   │   └── <Route>Client.tsx     # Client Component — interactivity, React Query, handlers
│   │   └── api/                 # REST API routes (only when Pattern C applies, see §3.2)
│   │       ├── auth/            # NextAuth handler
│   │       └── <domain>/       # Domain API routes
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (do NOT edit directly)
│   │   ├── providers/           # Provider tree (Query → Session → App)
│   │   ├── auth/                # Auth-related components (PrivateRoute — UX safety net, not a security boundary)
│   │   └── <domain>/           # Domain-specific components
│   │
│   ├── hooks/
│   │   ├── use<Feature>.ts      # Top-level hooks (useLogin, useRegister, etc.)
│   │   └── <domain>/           # Domain-scoped hooks
│   │       ├── use<Feature>.ts  # React Query hooks (client-side queries + mutations)
│   │       └── use<Page>Page.ts # Page-level orchestrator hooks
│   │
│   ├── lib/
│   │   ├── auth.ts              # NextAuth config (authOptions)
│   │   ├── auth-server.ts       # Server-side auth helpers (requireUser, requireUserId, permission checks)
│   │   ├── config.ts            # Env vars (validated at startup)
│   │   ├── prisma.ts            # Singleton PrismaClient + PG Pool
│   │   ├── queryClient.ts       # TanStack Query client factory
│   │   ├── utils.ts             # cn() — kept here (not utils/) to match shadcn/ui's baked-in `@/lib/utils` import in every generated component
│   │   ├── api/                 # Thin client-side fetch wrappers — only for domains with API routes (Pattern C)
│   │   │   └── <domain>.ts
│   │   └── schemas/             # Zod schemas (validation + types)
│   │       └── <domain>.ts
│   │
│   ├── constants/
│   │   ├── queryKeys.ts         # Centralized query key registry
│   │   └── <domain>.ts          # Domain constants & theme maps (pure data, no functions — see §4.8a)
│   │
│   ├── utils/
│   │   └── <domain>.ts          # Pure helper functions, grouped by domain (see §4.8a)
│   │
│   ├── server/                  # ⭐ Data-access layer (Prisma calls ONLY)
│   │   └── <domain>/
│   │       ├── queries.ts       # Read operations (findMany, findFirst, etc.)
│   │       └── mutations.ts     # Write operations (create, update, delete)
│   │
│   ├── services/                # ⭐ Server-side domain/application services (business logic, orchestration)
│   │   └── <domain>.ts          # e.g. services/profile.ts — composes server/, calls external APIs
│   │
│   ├── stores/                  # Zustand stores — UI-only state, never server or auth state
│   │   └── <domain>Store.ts
│   │
│   └── types/
│       ├── next-auth.d.ts       # NextAuth type augmentation
│       ├── action.ts            # Server Action result contract (ActionResult<T>)
│       ├── <domain>.ts          # DTOs that don't map 1:1 onto a Prisma model (joins, computed fields)
│       └── state/
│           └── <domain>.ts      # Store state types
│
├── tests/                        # Vitest tests — mirrors src/'s path structure, kept separate from it
│   ├── utils/
│   │   └── <domain>.test.ts      # e.g. tests/utils/dietarySafety.test.ts tests src/utils/dietarySafety.ts
│   └── services/
│       └── <domain>.test.ts
│
├── components.json              # shadcn/ui config
├── eslint.config.mjs
├── vitest.config.mts             # native tsconfig-paths resolution — see §9.5
├── next.config.ts               # React Compiler enabled
├── prisma.config.ts             # Prisma datasource config
├── tsconfig.json                # Path alias: @/* → ./src/*
└── package.json
```

---

## 3. Architecture & Data Flow

### 3.1 Request Lifecycle

```
Browser → proxy.ts (middleware: auth guard) → App Router
              │
              ├─ Public pages (/login, /register) → render directly
              └─ Protected pages → require JWT token
```

### 3.2 Three Patterns for Server Communication

> **⚡ KEY RULE: Server Components fetch initial data. Server Actions are the default for mutations. API routes exist for client-side cached queries, optimistic updates, and external consumers — not as the default mutation path.**

#### Pattern A — Server Components (default for initial reads)

Every route's `page.tsx` is a **Server Component**. It fetches its own initial data and hands it to a colocated Client Component as props — no client-side loading spinner for first paint.

```
app/<route>/page.tsx (Server Component)
        │
        ├─ requireUserId() → server/<domain>/queries.ts → Prisma → DB
        │
        └─ renders <RouteClient initialData={...} />
```

- Page components fetch via `requireUserId()`/`requireUser()` (`src/lib/auth-server.ts`) and functions from `src/server/<domain>/queries.ts`
- Interactive logic (state, event handlers, React Query, drag & drop) lives in a sibling `<Route>Client.tsx` marked `'use client'`
- Never fetch data in a `useEffect` on mount if a Server Component can provide it as `initialData`

#### Pattern B — Server Actions (default for mutations)

Use for **all writes** unless the UI specifically needs React Query's optimistic-update lifecycle (Pattern C) or the mutation must be reachable over HTTP.

```
Client/Server Component → Server Action ('use server') → services/<domain>.ts (if there's business logic) → server/<domain>/mutations.ts → Prisma → DB
```

- Server Actions live in `src/actions/<domain>/actions.ts`
- They call `src/services/<domain>.ts` for multi-step business logic, or `src/server/<domain>/` directly for simple CRUD
- Validation uses Zod schemas from `src/lib/schemas/`
- Return plain objects `{ success: true } | { error: string }` (no `NextResponse`)
- A Server Action can be used directly as a React Query `mutationFn` — optimistic updates do **not** require an API route. Prefer this over Pattern C unless you also need the query-side caching benefits below.

#### Pattern C — API Routes + React Query (client-side queries, and mutations that need it)

Use when the UI needs client-side **caching, background refetch, or stale-while-revalidate** (`useQuery`), or when the endpoint must be consumed by something other than this Next.js app (mobile client, webhook, third-party integration).

```
Client Component → React Query (useQuery/useMutation) → lib/api/<domain>.ts (fetch) → API Route → server/<domain>/ → Prisma → DB
                        │
                        └─ onMutate: optimistic cache update
                        └─ onError: rollback
                        └─ onSettled: invalidate & refetch
```

- API routes live in `src/app/api/<domain>/`
- Client-side fetch wrappers live in `src/lib/api/<domain>.ts`
- React Query hooks live in `src/hooks/<domain>/`
- Query keys are centralized in `src/constants/queryKeys.ts`
- Do **not** use a Server Action as a client-side `queryFn` — Server Actions are for mutations/commands, not for React Query's query/refetch model

### 3.3 When to Use Which

| Scenario                                                        | Pattern                                            | Why                                                                                                |
| --------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Initial page data (pantry list, recipe list)                    | **Server Component**                               | No loading spinner, no client JS needed for first paint                                            |
| Form submission (register, create recipe)                       | **Server Action**                                  | No client-side caching needed; simpler, less boilerplate                                           |
| Toggle checkbox, inline edit, delete with undo                  | **Server Action as mutationFn, or API Route + RQ** | Optimistic update — Server Action mutationFn is preferred unless the query side also needs caching |
| List data with background refetch / stale-while-revalidate      | **API Route + RQ (useQuery)**                      | Client-side caching is React Query's job, not Server Actions'                                      |
| Endpoint consumed outside this app (mobile, webhook, 3rd party) | **API Route**                                      | Needs a real HTTP contract                                                                         |
| Multi-step business logic (AI recipe generation, meal planning) | **Server Action → services/**                      | Keeps orchestration out of the action and out of server/ (see §3.4)                                |

### 3.4 Domain / Application Services (`services/`)

`services/` holds **server-side** business logic that is more than a single Prisma call — orchestration across multiple `server/<domain>/` functions, external API calls (Gemini), or domain rules (allergy filtering, missing-ingredient calculation). It is never a client-side fetch wrapper.

```
actions/recipes/actions.ts (generateRecipeAction)
        │
        ▼
services/recipeGenerator.ts     # fetches diet/allergy/servings, calls services/ai.ts,
        │                         validates the result, persists, logs the AIGeneration
        ▼
services/ai.ts (Gemini REST client) + server/profile/queries.ts + server/recipes/mutations.ts
        │                             (getUserDietaryProfile)      + server/ai/mutations.ts
        ▼
Prisma
```

This is the **actual, built** shape — not aspirational. `services/ai.ts` is the one Gemini
client (raw `fetch`, no SDK dependency); every AI feature calls it rather than hitting
`generativelanguage.googleapis.com` directly. Diet type, allergies, and servings come from
`server/profile/queries.ts`'s `getUserDietaryProfile` and are passed to Gemini as hard
constraints via `services/ai.ts`'s `buildPromptText` (one canonical template — every call
gets the same field order: request, servings, diet, allergies — rather than ad hoc string
concatenation per call site). Allergy/diet compliance is also checked in code after the
fact (`utils/dietarySafety.ts`, category- and keyword-based) with one retry before failing
outright — for something safety-relevant like a food allergy, trusting the prompt alone
isn't enough. Pantry-aware "what can I make right now" matching (`server/pantry/`) is
still deferred — there's no pantry data yet — see `services/recipeGenerator.ts`'s doc
comment for where it slots in.

- Only create a `services/<domain>.ts` file when logic genuinely spans multiple data-access calls or talks to an external system — a single `create`/`update` call does not need a service, call `server/<domain>/mutations.ts` directly from the action
- Services are called from Server Actions and API routes, never directly from components or hooks

---

## 4. Coding Conventions

### 4.1 General

- **TypeScript strict mode** — no `any`, no implicit returns, no unused vars
- **Path aliases** — always use `@/` imports (maps to `src/`), never relative `../../`
- **Named exports** — prefer named over default exports (exception: page components use `export default`)
- **File naming** — `camelCase.ts` for modules, `PascalCase.tsx` for components, `use<Name>.ts` for hooks
- **No barrel files** — import directly from the source file, not from `index.ts`
- **Import order is enforced, not manual** — `eslint-plugin-simple-import-sort` (`simple-import-sort/imports`, `.../exports`) auto-groups and alphabetizes imports. Don't hand-order imports; run `npm run lint:fix` if the linter flags a file
- **`react-hooks/exhaustive-deps` and `@typescript-eslint/no-unused-vars` are both `warn`**, inherited from `eslint-config-next/typescript` — no separate setup needed, but don't ignore the warnings either
- **Type-only imports use `import type`** — enforced by `@typescript-eslint/consistent-type-imports` (`warn`)
- **No stray `console.*` calls** — `no-console` (`warn`); use a real logging path or remove before committing
- **Async code is checked for unhandled promises** — `@typescript-eslint/no-floating-promises` / `no-misused-promises` (`warn`), type-aware, scoped to `**/*.{ts,tsx}` via a dedicated `languageOptions.parser`/`projectService` block in `eslint.config.mjs` (`eslint-config-next` doesn't enable type-aware parsing by default). If you add a rule that needs real type info, it has to go in that block, not the general one — plain `parserOptions` without `projectService` won't have access to the type checker
  - `no-misused-promises` has `checksVoidReturn: { attributes: false }` — passing an async handler directly to a JSX prop (`onClick={async () => ...}`, `onSubmit={handleSubmit(onSubmit)}` from React Hook Form) is normal and intentionally _not_ flagged; the rule still catches genuine misuse (a promise used where a boolean/condition is expected)
  - A truly fire-and-forget call outside JSX (e.g. `signOut()` in a plain event handler) should be marked with `void` — see `AppSidebar.tsx`'s `handleLogout` — rather than silently left unawaited
- **JSX/component-quality rules** (`react/jsx-sort-props`, `no-unstable-nested-components`, `jsx-no-leaked-render`, `button-has-type`, `jsx-no-useless-fragment`, `destructuring-assignment`, etc., all `warn` except a few genuine-bug-risk ones at `error`) apply to everything under `src/**/*.{ts,tsx}` **except `src/components/ui/**`** — those are shadcn-generated and never hand-edited (see below), so linting them against our stylistic rules would just be permanent unfixable noise. `react/function-component-definition` is set to `function-declaration` (not the more common `arrow-function`) because that's what every component in this codebase — including every Next.js page/layout special file — already uses
- **Full `eslint-plugin-jsx-a11y` recommended ruleset** is active (not just the handful `core-web-vitals` bundles) — same `components/ui/**` exclusion applies
- When adding a rule that references a plugin already registered by `eslint-config-next` (`react`, `jsx-a11y`, `react-hooks`) — don't re-import and re-spread that plugin's own config object; flat config errors on redefining a plugin under the same name. Add a `rules`-only block instead (see `eslint.config.mjs` for the pattern)
- `curly` is `['warn', 'multi-line']`, not `'all'` — this codebase's dominant style is single-line guard clauses (`if (!list) return { error: '...' };`); forcing braces everywhere would fight that on 70+ existing lines for no real safety gain. Braces are still required once a block body wraps past one line

### 4.2 React & Components

- Page components (`app/<route>/page.tsx`) are **Server Components** by default — no `'use client'`. They fetch initial data via `requireUserId()` + `server/<domain>/queries.ts` and render a colocated `<Route>Client.tsx`
- Exception: a page with no server data to fetch and that is interactive edge-to-edge (e.g. `login`/`register` forms) can stay a single `'use client'` file — the Server/Client split exists to isolate client JS around data fetching, not as a mechanical rule for every route
- The truly interactive part of a page (state, event handlers, React Query, drag & drop, optimistic updates) lives in `<Route>Client.tsx` marked `'use client'`
- `<PrivateRoute>` wraps client-side trees as a **UX safety net only** — it is not a security boundary, and is unnecessary on pages that are already Server Components (their `requireUser()`/`requireUserId()` call redirects before anything renders). Reach for it only on pages that stay client components end-to-end. The real protection is always server-side: `requireUser()`/`requireUserId()` in every Server Component and Server Action, `requireApiUserId()` in every API route (see §5)
- The provider tree order is: `QueryProvider → SessionProvider → InnerApp`
- Use **shadcn/ui** primitives from `@/components/ui/` — do NOT modify these files directly; extend via composition
- Domain components go in `src/components/<domain>/`
- Keep components focused — extract complex logic into custom hooks

### 4.3 State Management

- **Initial server state** → fetched directly in Server Components, passed down as props
- **Client-side interactive server state** → TanStack React Query (cache, background sync, optimistic updates) — use where a Server Action `mutationFn` isn't sufficient on its own (see §3.2 Pattern C)
- **Global client state** → Zustand stores, but **UI-only**: sidebar state, theme, filters, wizard/multi-step-form state. Never session, auth, or other server data
- **Auth state on the client** → `useSession()` from NextAuth directly. There is no Zustand mirror of the session
- **Local component state** → `useState` / `useReducer`
- **Form state** → React Hook Form with Zod resolver
- Never duplicate server state in Zustand — let React Query (client-side) or the Server Component fetch (initial) be the source of truth for server data

### 4.4 Data Access (server/)

- `src/server/<domain>/queries.ts` — **read-only** Prisma operations
- `src/server/<domain>/mutations.ts` — **write** Prisma operations
- These are plain async functions (not actions, not routes) — they are called by Server Components, Server Actions, API routes, and `services/`
- Always scope queries to the authenticated user (pass `userId` as parameter)
- **Never call Prisma directly inside Server Components, Server Actions, API routes, components, hooks, or services.** Every database interaction MUST go through a function defined in `src/server/<domain>/queries.ts` or `src/server/<domain>/mutations.ts`
- For resources with **shared access** (e.g. `ShoppingList` + `ShoppingListCollaborator`), ownership alone is not a valid authorization check. Formalize it as a helper — e.g. `requireShoppingListAccess(userId, listId)` in `lib/auth-server.ts` — that checks _owner OR collaborator_, and have every query/mutation for that domain go through it instead of ad hoc `where: { id, userId }` filters
- If an operation needs more than one `server/` call, an external API, or non-trivial business rules, put that orchestration in `src/services/<domain>.ts` (see §3.4) rather than inlining it in the Server Action

### 4.5 API Routes

- Authenticate every route with `requireApiUserId()` from `@/lib/auth-server` — not `requireUserId()`/`requireUser()`, which redirect and are only valid in Server Components/Actions. `requireApiUserId()` returns `string | NextResponse` so the route can early-return a 401 JSON response instead
- Return early with `NextResponse.json({ error }, { status })` on failure
- Use proper HTTP methods: `GET` for reads, `POST` for creates, `PATCH` for partial updates, `PUT` for full updates, `DELETE` for removals
- Dynamic params use `{ params: Promise<{ id: string }> }` (Next.js 16 async params)

### 4.6 Hooks (React Query)

- One file per domain feature: `use<Domain><Feature>.ts`
- Export individual hooks: `useCreate<Entity>`, `useUpdate<Entity>`, `useDelete<Entity>`
- Page-level orchestrator hooks (`use<Page>Page.ts`) compose multiple feature hooks and expose derived state + handlers
- Optimistic update pattern:
  ```ts
  onMutate → cancel queries → snapshot prev → apply optimistic update → return { prev }
  onError  → rollback from context
  onSettled → invalidate queries
  ```
- Query keys come from `queryKeys` object in `@/constants/queryKeys.ts` — never hardcode key arrays
- A feature can use `useMutation` **without** owning any `useQuery` — `hooks/profile/useProfile.ts` does this purely for the pending/error lifecycle and the global toasts, since the profile page's initial data comes from its Server Component. Don't add an API route or a query key just to make a mutation hook feel complete
- **Toast notifications are global, not per-hook.** `lib/queryClient.ts` registers a `MutationCache` with `onSuccess`/`onError` that read `mutation.meta.successMessage` / `mutation.meta.errorMessage` (typed via `types/react-query.d.ts`) and call `sonner`'s `toast.success`/`toast.error`. To add feedback to a mutation, add `meta: { successMessage: '...', errorMessage: '...' }` to its `useMutation(...)` call — don't call `toast()` directly inside `onSuccess`/`onError`, and don't build a new notification hook per feature
- Omit `meta.successMessage` for high-frequency, low-stakes mutations that already have their own visual feedback (e.g. a checkbox toggle) — a toast there is noise, not signal. Always set `errorMessage` (or accept the thrown error's own message as the fallback) so failures are never silent

### 4.7 Validation

- All validation schemas live in `src/lib/schemas/<domain>.ts`
- Use **Zod** for both client-side (React Hook Form resolver) and server-side (Server Action input parsing) — never trust client-side validation alone
- Export inferred TypeScript types alongside schemas: `export type XFormValues = z.infer<typeof xSchema>`

### 4.8 Types

- Domain DTOs and payloads → `src/types/<domain>.ts`
- Store state types → `src/types/state/<domain>.ts`
- Prisma-generated enums and models can be imported directly from `@prisma/client` — **do not** hand-write a type that just duplicates a Prisma model shape
- Only define a type in `src/types/<domain>.ts` when it genuinely differs from the Prisma shape (a join, a computed field, an aggregate) — e.g. `PantryItemDTO` that nests `ingredient: { id, name }` instead of a raw foreign key
- Keep types close to usage — if only used in one file, define inline
- A type that only exists to shape a domain constant map (e.g. `ColorTheme` in `types/shopping.ts`, used by `COLOR_THEMES` in `constants/shopping.ts`) still belongs here, not next to the constant — import it into the constants file rather than declaring it inline there

### 4.8a Constants & Utils

- Domain constants (enum label maps, theme configs, option lists — no functions) → `src/constants/<domain>.ts`
- Pure helper functions (no Prisma access, no external calls) → `src/utils/<domain>.ts`
- A file that used to mix both (e.g. the old `lib/recipe-constants.ts` with `DIFFICULTY_LABELS` + `cardGradientFor()`) is split: the data goes to `constants/`, the function goes to `utils/` and imports the data it needs from `constants/`
- **Exception: `lib/utils.ts` stays in `lib/`, not `utils/`.** Every shadcn/ui component under `components/ui/` is generated with a hardcoded `import { cn } from '@/lib/utils'`, and those files are read-only (§4.2) — moving `cn` would mean hand-editing every generated component, and `npx shadcn add` would just reintroduce the `@/lib/utils` import on the next component anyway
- `lib/` itself is not a dumping ground — before adding a new file there, check whether it's actually a constant, a util, a type, a schema, or genuine app infrastructure (auth, prisma, query client, config). Only the last category belongs directly in `lib/`
- Server Action plumbing (`ActionResult<T>` type + `unwrapAction()`) is split the same way: the type lives in `types/action.ts` (imported by `actions/<domain>/actions.ts`), the function lives in `utils/action.ts` (imported by React Query hooks that wrap a Server Action as a `mutationFn`)

### 4.9 Domain Services (services/)

- Create `src/services/<domain>.ts` only when logic spans multiple `server/` calls, calls an external API (Gemini), or encodes non-trivial business rules — not for a plain single-table CRUD wrapper
- `services/profile.ts` is the reference example for cross-domain orchestration: it checks email uniqueness against `server/auth/queries.ts` before writing through `server/profile/mutations.ts`, verifies a bcrypt hash before a password change, and confirms the typed email before a cascade delete
- `services/ai.ts` + `services/recipeGenerator.ts` are the reference example for calling an external API: `ai.ts` is the single Gemini REST client (plain `fetch`, structured output via `generationConfig.responseSchema` derived from the Prisma enums so it can't drift from what the DB accepts); `recipeGenerator.ts` calls it, persists via `server/recipes/mutations.ts`, and logs the call via `server/ai/mutations.ts`. Add new AI features by calling `ai.ts`, not by hitting `generativelanguage.googleapis.com` from a second call site
- Throw a domain error subclass (e.g. `ProfileError`, `AIGenerationError`) for expected, user-facing failures. The calling action catches it and returns `{ error: e.message }`; anything else re-throws as a real 500 rather than being flattened into a friendly string
- Services are plain async functions called from `actions/` or `app/api/`, never from components or hooks directly
- Services call `server/<domain>/` for data access — they never import Prisma directly

### 4.10 Adapting Figma / v0 Exports

Generated UI code is a **visual spec, not a drop-in component**. Before committing an export:

- **Strip dependencies we don't have.** There is no animation library in this project — delete `motion/react` (`<motion.div>`, `initial`/`animate`/`transition`) rather than adding one for entrance effects. Use Tailwind transitions if a state change genuinely needs to be animated
- **Replace raw elements with our primitives** — `<input>` → `@/components/ui/input`, `<select>` → `Select*`, hand-rolled peer-checkbox toggles → `Switch`, `confirm()`-style destructive flows → `AlertDialog`. Exports reinvent these because they have no design system to import from
- **Exports hold everything in one `useState` object.** Split it: form fields go to React Hook Form + a Zod schema, dialog open/close goes to `useState`, and the whole thing gets composed in a `use<Page>Page.ts` orchestrator
- **Mocked data is a question, not a decision.** An export that hardcodes `"Alex Thompson"` or a `preferences` object the schema has no column for means either a migration or a cut feature — decide deliberately instead of shipping the placeholder
- **Re-check accessibility.** Exports routinely ship label-less inputs, `<div>` buttons, and icon-only controls. The full `jsx-a11y` ruleset is on, so these surface as lint errors — fix them at the markup level, don't disable the rule
- **Split by section.** A 400-line export becomes one `<Route>Client.tsx` plus a component per card in `src/components/<domain>/` (see `src/components/profile/`)

---

## 5. Authentication Flow

1. **Middleware** (`proxy.ts`): Checks JWT on every request. Redirects unauthenticated users to `/login`, and authenticated users away from `/login` and `/register`
2. **NextAuth** (`lib/auth.ts`): Credentials provider with bcrypt. JWT strategy. Session shape augmented in `types/next-auth.d.ts`
3. **Client-side session access**: components call NextAuth's `useSession()` directly — there is no Zustand mirror of session state. Auth is not a candidate for `stores/`; only UI state belongs there
   - The JWT carries a snapshot of `name`/`email`, so editing them in the profile would otherwise leave the sidebar stale until the next login. `useProfilePage` calls `useSession().update({ name, email })` after a successful save, and the `jwt` callback in `lib/auth.ts` applies that patch when `trigger === 'update'`. Any future flow that changes a field mirrored into the token must do the same
4. **PrivateRoute** (`components/auth/PrivateRoute.tsx`): a client-side UX guard (avoids a flash of protected content while the session resolves). It is **not** a security boundary — never treat "wrapped in `<PrivateRoute>`" as equivalent to "protected". Real authorization happens server-side, on every request
5. **Server-side auth** (`lib/auth-server.ts`):
   - `requireUser()` / `requireUserId()` — for Server Components and Server Actions. Redirects to `/login` if unauthenticated (never returns an error value, so callers don't need to check for one)
   - `requireApiUserId()` — for API routes. Returns `string | NextResponse`, so a route can early-return a 401 JSON response instead of redirecting (this is the renamed `getAuthUserId()`)
   - For shared resources, add a scoped helper on top when it's actually needed, e.g. `requireShoppingListAccess(userId, listId)` that checks owner OR `ShoppingListCollaborator` membership — `userId` alone is not sufficient authorization once collaborators exist (see §4.4). Not built yet: there's currently no way to add a collaborator to a list, so this check would be speculative until an invite flow exists
   - These server-side checks are the actual security boundary

---

## 6. Database & Prisma

- **Single schema file**: `prisma/schema.prisma`
- **Driver adapter**: Uses `@prisma/adapter-pg` with a `pg.Pool` (not the default Prisma connection)
- **Singleton pattern**: `lib/prisma.ts` caches the pool and client on `globalThis` in development
- **Pool tuning**: Via env vars `PG_MAX_POOL_SIZE`, `PG_IDLE_TIMEOUT_MS`, `PG_CONN_TIMEOUT_MS`
- **Migrations**: Use `npx prisma migrate dev` for development, `npx prisma migrate deploy` for production
- **Seeding**: `npm run db:seed` runs `prisma/seed.mts` (wired via `migrations.seed` in `prisma.config.ts`). It loads reference data the app assumes exists — currently the `Allergy` catalogue — and is idempotent, so it is safe to re-run. It is `.mts` and self-contained on purpose: Node runs it directly, so `@/` aliases don't resolve and it constructs its own `PrismaClient`. This is the **only** sanctioned exception to "Prisma access only through `server/`" (§10.6), because it runs outside the Next.js app entirely
- **Reference data is a dependency, not a fixture** — a feature that reads a seeded table should degrade visibly when it's empty rather than silently render nothing (see `AllergiesSection`, which tells you to run the seed)
- **Schema conventions**: UUIDs for all IDs, `createdAt`/`updatedAt` timestamps, cascade deletes on ownership relations, composite IDs for join tables

### Domain Models

| Domain         | Models                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------- |
| User & Auth    | `User`, `Allergy`, `UserAllergy`                                                         |
| Profile        | `User` (diet, servings, leftovers, notification prefs) + `UserAllergy` selection         |
| Ingredients    | `Ingredient`                                                                             |
| Pantry         | `PantryItem`                                                                             |
| Recipes        | `Recipe` (incl. `difficulty`, `cookTimeMinutes`), `RecipeIngredient`, `RecipeFavorite`   |
| Meal Planning  | `MealPlan`                                                                               |
| Shopping Lists | `ShoppingList`, `ShoppingCategory`, `ShoppingListItem`, `ShoppingListCollaborator`       |
| AI             | `AIGeneration` — audit log of every `services/ai.ts` call (prompt, raw response, tokens) |

---

## 7. Adding a New Feature (Checklist)

When building a new domain feature, follow this order:

### Step 1 — Schema

- [ ] Add/update models in `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name <descriptive_name>`

### Step 2 — Data Access

- [ ] Create `src/server/<domain>/queries.ts` (read operations)
- [ ] Create `src/server/<domain>/mutations.ts` (write operations)

### Step 3 — Types

- [ ] Define DTOs and payloads in `src/types/<domain>.ts`
- [ ] Define store state types in `src/types/state/<domain>.ts` (if needed)

### Step 4 — Validation

- [ ] Create Zod schemas in `src/lib/schemas/<domain>.ts`

### Step 5 — Domain Service (only if needed)

- [ ] If the feature's writes span multiple `server/` calls, call an external API, or encode non-trivial business rules, create `src/services/<domain>.ts` (see §3.4 / §4.9). Skip this step for plain single-table CRUD.

### Step 6 — Server Communication (choose the pattern from §3.2/§3.3)

**Mutations (default: Server Action):**

- [ ] Create Server Action in `src/actions/<domain>/actions.ts`, calling `services/<domain>.ts` (if created) or `server/<domain>/mutations.ts` directly

**If the UI needs React Query's caching/optimistic lifecycle (Pattern C):**

- [ ] Create API route(s) in `src/app/api/<domain>/`
- [ ] Create fetch wrapper(s) in `src/lib/api/<domain>.ts`
- [ ] Add query keys to `src/constants/queryKeys.ts`
- [ ] Create React Query hooks in `src/hooks/<domain>/` — a Server Action can be used as the `mutationFn` even here if only the mutation (not the query) needs React Query

### Step 7 — UI

- [ ] Create `src/app/<route>/page.tsx` as a **Server Component** that fetches initial data via `requireUserId()` + `server/<domain>/queries.ts`
- [ ] Create `src/app/<route>/<Route>Client.tsx` (`'use client'`) for interactive logic, wrapped with `<PrivateRoute>` if protected
- [ ] Create domain components in `src/components/<domain>/`
- [ ] Create page orchestrator hook in `src/hooks/<domain>/use<Page>Page.ts`
- [ ] Add route to sidebar nav in `AppSidebar.tsx`

### Step 8 — Constants (if applicable)

- [ ] Add constants/theme maps in `src/constants/<domain>.ts`, and any pure helpers in `src/utils/<domain>.ts`

---

## 8. Environment Variables

| Variable             | Required | Description                                           |
| -------------------- | -------- | ----------------------------------------------------- |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string                          |
| `NEXTAUTH_SECRET`    | Yes      | Secret for JWT signing                                |
| `GEMINI_API_KEY`     | Yes      | Google Generative Language API key — `services/ai.ts` |
| `NEXTAUTH_URL`       | No       | Base URL (defaults to `http://localhost:3000`)        |
| `PG_MAX_POOL_SIZE`   | No       | Max PG pool connections (default: 10)                 |
| `PG_IDLE_TIMEOUT_MS` | No       | Pool idle timeout (default: 30000)                    |
| `PG_CONN_TIMEOUT_MS` | No       | Pool connection timeout (default: 2000)               |

---

## 9. Scripts

```bash
npm run dev           # Start dev server
npm run db:seed       # Seed reference data (allergies) — idempotent
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix lint issues
npm run typecheck     # TypeScript type checking
npm run format        # Format with Prettier
npm run format:check  # Check formatting
npm test              # Run the Vitest test suite once
npm run test:watch    # Vitest in watch mode
```

---

## 9.5 Testing (Vitest)

- **Why Vitest, not Jest**: the project started on Jest (`next/jest`) and migrated once the suite was still small enough for the switch to be cheap — faster (esbuild vs. SWC-via-`next/jest`), less config (native tsconfig-paths resolution instead of a hand-written alias map), and a nicer watch mode. Nothing under test touches React components or a Next-specific API, so `next/jest`'s main selling point (CSS/image mocking, bundler parity) wasn't buying anything here. Re-litigate this only if component testing needs actually show up.
- **Config**: `vitest.config.mts` at the repo root. `resolve.tsconfigPaths: true` is Vite's native tsconfig-paths resolution (no plugin dependency) — it reads `tsconfig.json`'s `paths` directly, which is exactly what `next/jest` couldn't do reliably. `test.clearMocks: true` clears every mock's call history between tests — without it, `.mock.calls[0]` in one test can silently pick up a call made by an earlier one.
- **Environment**: `test.environment: 'node'` — every test so far covers server-only logic (`services/`, `lib/`, `server/`), no DOM. Switch to `'jsdom'` (globally or per-file via a `// @vitest-environment jsdom` docblock) when component tests are added; don't flip the whole suite for that.
- **File convention**: a top-level `tests/` directory that mirrors `src/`'s path structure — `src/utils/dietarySafety.ts` is tested by `tests/utils/dietarySafety.test.ts`, `src/services/ai.ts` by `tests/services/ai.test.ts`, and so on. Test code is kept physically separate from application code (not co-located), so `src/` stays exclusively what ships. Every test file imports the module under test via the `@/` alias (`@/utils/dietarySafety`), never a relative path — the alias survives the file living in a different tree, and it matches this codebase's "always `@/`, never relative" convention (§4.1) instead of fighting it.
- **Globals**: not enabled. Every test file imports `describe`/`it`/`expect`/`vi`/etc. explicitly from `'vitest'` rather than relying on `test.globals: true` — keeps things working without adding `"vitest/globals"` to tsconfig's `types` (which would narrow global type auto-inclusion for the whole app, not just tests).
- **ESLint**: `@vitest/eslint-plugin`'s `recommended` config is scoped to `**/*.test.ts(x)` in `eslint.config.mjs` — Vitest-specific correctness rules (`expect-expect`, `no-identical-title`, `valid-expect`, `no-disabled-tests`). No globals config needed on the ESLint side either, for the same reason as above.
- **What gets mocked vs. left real** — see `tests/services/recipeGenerator.test.ts` and `tests/services/ai.test.ts` as the reference pair:
  - **Mock the I/O boundary**: anything that hits Prisma (`server/<domain>/queries.ts` / `mutations.ts`) or an external API (`fetch` in `services/ai.ts`) gets `vi.mock()`'d. Tests never touch a real database or make a real network call.
  - **`@/lib/config` needs mocking too, even indirectly** — it calls `getRequiredEnvVar()` at module load time for `DATABASE_URL`/`NEXTAUTH_SECRET`/`GEMINI_API_KEY`, so importing anything that transitively imports it (directly, or via `vi.importActual` pulling in a real dependency) throws in the test environment unless it's mocked first.
  - **Leave pure logic real**: `services/recipeGenerator.test.ts` mocks `services/ai.ts`'s network call but uses the real `utils/dietarySafety.ts` functions, driving them with fabricated ingredient lists — that exercises the actual retry/fail-safe branching instead of asserting against a second, hand-rolled mock of what the logic "should" do.
  - **Preserve real error classes across a mock**: `vi.mock('@/services/ai', async () => ({ ...(await vi.importActual('@/services/ai')), generateRecipeFromPrompt: vi.fn() }))` keeps the real `AIGenerationError` class so `instanceof` checks in the code under test (and in the test's own assertions) still work — mocking the whole module with hand-rolled stand-ins would silently break that. Note the factory is `async` and uses `vi.importActual` (not `vi.mock`'s Jest analogue, `jest.requireActual`, which is synchronous) — Vitest's mock factories support async natively.
- **Testing style**: assert on behavior/contracts (what a function returns, what it calls downstream with), not on private implementation details — e.g. `ai.test.ts` verifies the prompt Gemini receives by inspecting the mocked `fetch` call's body, rather than exporting the internal `buildPromptText` helper just to unit-test it in isolation.

---

## 10. Key Decisions & Constraints

1. **Server Components fetch, Server Actions write, API routes are for client-caching/optimistic/external needs** — `page.tsx` files are Server Components that fetch initial data; Server Actions are the default for all mutations (and can be used directly as a React Query `mutationFn` for optimistic updates); API routes exist only for client-side cached queries (`useQuery`), or endpoints consumed outside this app. API routes are **not** required just because a mutation wants optimistic UI.
2. **React Compiler is ON** — `reactCompiler: true` in `next.config.ts`. Do not use `useMemo` / `useCallback` / `React.memo` unless the compiler cannot optimize the case (rare).
3. **Pages are Server Components** — Initial data fetching happens server-side in `page.tsx`. Interactivity is isolated to a colocated `<Route>Client.tsx` (`'use client'`), keeping client JS to the parts that actually need it.
4. **Auth is not duplicated in Zustand** — Client components use NextAuth's `useSession()` directly. Zustand is reserved for UI-only state (sidebar, theme, filters, wizard state) and is never a mirror of session or other server data.
5. **shadcn/ui components are read-only** — Never edit files in `src/components/ui/`. Extend via wrapper components or composition.
6. **Prisma access only through server/** — Never import `prisma` directly in Server Components, Server Actions, API routes, components, hooks, or services. Every DB call must be a named function defined in `src/server/<domain>/queries.ts` (reads) or `src/server/<domain>/mutations.ts` (writes). This keeps the data-access layer testable and co-located. The single exception is `prisma/seed.mts`, which runs outside the app (see §6).
7. **`services/` is server-side domain logic, not a client fetch layer** — Use it only when an operation spans multiple `server/` calls, hits an external API, or encodes non-trivial business rules (e.g. AI recipe generation). A single-table CRUD action calls `server/` directly; it does not need a service.
8. **`PrivateRoute` is a UX safety net, not a security boundary** — The actual authorization boundary is server-side: `requireUser()`/`requireUserId()` in every Server Component, Server Action, and API route. For shared resources (e.g. `ShoppingList` + `ShoppingListCollaborator`), authorization must check owner-or-collaborator, not just `userId` equality — formalize this as a helper (e.g. `requireShoppingListAccess`) rather than repeating the check ad hoc.
9. **Query keys are centralized** — All React Query keys are defined in `src/constants/queryKeys.ts`. Never hardcode query key arrays.
10. **One hook file per feature** — Keep hooks small and focused. Compose them in page-level orchestrator hooks.
11. **Types should not duplicate Prisma models** — Import Prisma-generated types/enums directly. Only hand-write a type in `src/types/<domain>.ts` when it genuinely diverges from the Prisma shape (a DTO with joins or computed fields).
12. **Layer-oriented structure is fine at current scale** — `components/`, `hooks/`, `actions/`, `server/`, `services/`, `types/`, `constants/`, `utils/` grouped by domain subfolder is the current structure and is sustainable for now. If a domain's logic ends up spread thin across all of these directories as the app grows, consider consolidating into a `features/<domain>/` folder (colocating actions, components, queries, mutations, hooks, schemas, types per domain) — but this is a deliberate future migration, not a rule to apply today.
13. **`lib/` is for app infrastructure only, not a catch-all** — constants go in `constants/<domain>.ts`, pure helper functions go in `utils/<domain>.ts`, and DTOs/domain types go in `types/<domain>.ts` (see §4.8/§4.8a). `lib/` is reserved for things that are genuinely cross-cutting plumbing (auth config, the Prisma client, the query client, env var loading, Zod schemas, API fetch wrappers) — plus the one deliberate exception, `lib/utils.ts`'s `cn()`, kept there because every shadcn/ui component is generated importing it from that exact path.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
