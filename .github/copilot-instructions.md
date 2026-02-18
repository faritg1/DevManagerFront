# DevManager Frontend — Critical AI Instructions

## 🎯 Purpose & Principles
Strict guidelines for an AI agent to generate production-ready code in this **React 19 + TypeScript + Vite** repository, following **Feature-Sliced Design (FSD)**.

**Non-Negotiable Principles:**
- **Architecture:** Logic must be decomposed into `app`, `pages`, `widgets`, `features`, `entities`, and `shared`. Cross-imports between features are forbidden.
- **UI-First & UX-Driven:** Every async action MUST provide user feedback (loading states, optimistic updates, success/error toasts). **Never leave the user guessing.**
- **React 19 Native:** Use modern hooks (`useActionState`, `useOptimistic`, `use`). No Class components.
- **Type Safety:** Zero `any`. Use `unknown` if truly uncertain. All props must be explicitly typed.

## 🏗️ Architecture: Feature-Sliced Design (FSD)
**Strict Layer Hierarchy (Imports flow DOWN only):**

1. **`src/app/`**: Global setup (Router, Providers, global styles).
2. **`src/pages/`**: Route components. **Composition ONLY**. No business logic here. Assembles Widgets/Features.
3. **`src/widgets/`**: Composition of multiple features/components (e.g., `Header`, `ProjectGrid`).
4. **`src/features/`**: User-facing actions that bring value (e.g., `AuthByEmail`, `CreateProject`). Self-contained.
5. **`src/entities/`**: Business logic & data models (e.g., `User`, `Project`). Defines interfaces and simple API calls.
6. **`src/shared/`**: Reusable primitives (`@shared/ui`), API clients, and constants.

## 💻 React 19 & TypeScript Rules
- **State & Actions:**
  - Use `useActionState` for handling form actions and async state.
  - Use `useOptimistic` for immediate UI feedback before the server responds.
  - Use `use` hook for resource reading (promises/context) instead of `useEffect` where possible.
- **Components:**
  - Functional components ONLY with named exports (`export const MyComponent`).
  - No `forwardRef`; pass `ref` as a standard prop.
- **TypeScript:**
  - Prefer `interface` for public APIs/Props and `type` for unions/aliases.
  - Use `const` assertions (`as const`) for enum-like objects.
  - Avoid object literal props in JSX to prevent re-renders.

## 🎨 UI/UX & Feedback (Crucial)
**Every interaction must feel responsive and polished.**
- **Loading States:**
  - Use `Suspense` boundaries with Skeleton loaders for page data.
  - Use disabled buttons + spinners (from `@shared/ui`) during form submissions (`isPending`).
- **Feedback:**
  - Show a **Toast/Notification** upon success or error of an action.
  - Handle `null` data gracefully (Empty states).
- **Styling:**
  - **Use `@shared/ui` primitives first.** Do not reinvent the wheel.
  - **Dark Mode:** Every Tailwind class must consider `dark:` variant.
  - **Icons:** Use `lucide-react`. Standard sizes: `size={20}` (inline), `size={24}` (headers).

## 🔌 API & AI Integration
- **Clients:**
  - `apiClient`: For standard backend (`/api`). Handles auth tokens automatically.
  - `agentClient`: **STRICTLY** for `/Agent/*` endpoints. No `/api` prefix.
- **AI Service:** Use `src/shared/services/geminiService.ts`. Ignore root `services/`.
- **Entities alias:** `@entities` is available (see `vite.config.ts`) — import domain models from `@entities/<model>`.
- **Data Shape:** Always expect `ApiResponse<T>`.
  - Validate response success manually (`if (response.success)`).
  - Do not use Zod (backend handles validation). Trust the `ApiResponse` type.

## 🛠️ Workflow: Adding a Feature
1. **Model:** Define Types/Interfaces in `src/entities/<model>/`.
2. **Route:** Add constant to `@shared/config/constants` and update `src/app/Router.tsx`.
3. **Feature:** Build logic in `src/features/<name>/` using `useActionState`.
4. **UX Check:** Add loading indicators and success/error handling.
5. **Export:** Ensure public API is available via `index.ts`.

## ⚠️ Forbidden Practices (Zero Tolerance)
- **NO** hardcoded route strings. Use `ROUTES` constants.
- **NO** `localStorage` direct access. Use `AuthContext` or `STORAGE_KEYS`.
- **NO** inline styles. Use Tailwind utility classes.
- **NO** `useEffect` for basic data fetching. Use React Query or Services.
- **NO** nesting `pages` inside `features`.
- **NO** logic inside UI primitives (Keep `shared/ui` dumb).

## 🔧 Debugging
- Env: `VITE_API_URL`, `VITE_GEMINI_API_KEY`.
- Use the Network tab to debug `apiClient` issues (interceptors handle logging).