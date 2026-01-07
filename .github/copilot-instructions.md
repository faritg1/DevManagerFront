# DevManager Frontend - AI Coding Instructions

## Project Overview
DevManager is a talent management platform for tracking projects, resource allocation, and hiring needs. Built with React 19, TypeScript, Vite, and uses HashRouter for client-side routing with Gemini AI integration.

## Architecture & File Structure

**Core routing:** [App.tsx](../App.tsx) defines routes using HashRouter with nested layout structure
- Public routes: `/` (Login), `/register`
- Protected routes: wrapped in `<Layout>` component with sidebar + header
- All screens in [screens/](../screens/) follow similar component patterns

**Layout pattern:** [components/Layout.tsx](../components/Layout.tsx) provides persistent shell
- Sidebar (left), header bar (top), main content area uses `<Outlet />`
- Header includes breadcrumbs and notifications
- Main content area has `overflow-y-auto` for scrolling

**Type definitions:** [types.ts](../types.ts) contains all shared interfaces
- `User`, `Project`, `Opportunity`, `ChatMessage` - reference these for data structures

## Styling System

**No CSS framework** - uses inline Tailwind classes directly in JSX (no `tailwind.config.js`)
- Dark mode: `dark:` prefix variants everywhere (e.g., `dark:bg-[#16222b]`)
- Primary color brand: `bg-primary`, `text-primary`, `hover:bg-primary-dark`
- Background colors: `bg-white dark:bg-[#16222b]` (cards), `dark:bg-[#111b22]` (sidebar/inputs)
- Border colors: `border-slate-200 dark:border-[#233948]`
- Text colors: `text-slate-900 dark:text-white` (primary), `text-slate-500 dark:text-text-secondary`

**Component styling patterns:**
- Cards: `rounded-2xl p-6 bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948]`
- Buttons: `rounded-xl px-6 py-2.5 bg-primary text-white hover:bg-primary-dark shadow-lg`
- Inputs: `rounded-xl border dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] h-12 px-4 focus:ring-2 focus:ring-primary`
- Status badges: Conditional styling based on state (see [Dashboard.tsx](../screens/Dashboard.tsx#L113-L116))

## Development Workflow

**Run dev server:**
```bash
npm run dev  # Starts Vite on port 3000
```

**Environment setup:**
- Create `.env.local` with `GEMINI_API_KEY=your_key`
- Vite config ([vite.config.ts](../vite.config.ts)) exposes as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`

**Build & preview:**
```bash
npm run build   # Production build
npm run preview # Preview production build
```

## AI Integration (Gemini)

**Service location:** [services/geminiService.ts](../services/geminiService.ts)
- Uses `@google/genai` package
- Model: `gemini-3-flash-preview`
- System instruction defines "DevManager Copilot" context with dashboard metrics
- API key loaded from environment, gracefully degrades if missing

**Integration pattern:** Import `sendCopilotMessage(message, context?)` for AI features

## Key Conventions

1. **Navigation:** Always use `useNavigate()` hook from `react-router-dom`, never `<a>` tags
2. **Icons:** Lucide React library - import specific icons (e.g., `import { Plus, Users } from 'lucide-react'`)
3. **Component patterns:** All screens are functional components with typed props (`const ScreenName: React.FC = () => {}`)
4. **State management:** Currently using local component state (no global store)
5. **Data:** Mock data arrays in components - no backend API calls yet (see [Dashboard.tsx](../screens/Dashboard.tsx#L10-L15))

## Screen-Specific Patterns

**Dashboard cards:** ([Dashboard.tsx](../screens/Dashboard.tsx))
- Stat cards use icon in colored background circles
- Project cards have gradient avatar circles with initials
- Hover states with shadow transitions and arrow indicators

**Forms:** ([CreateProject.tsx](../screens/CreateProject.tsx))
- Grid layouts: `grid grid-cols-1 md:grid-cols-2 gap-8`
- Section headers with icons and border-bottom
- Cancel/Save button pairs in header

**Tables:** ([Users.tsx](../screens/Users.tsx))
- Sticky headers with `bg-slate-50 dark:bg-[#111b22]`
- Row hover states: `hover:bg-slate-50 dark:hover:bg-[#233948]/50`

## Important Notes

- HashRouter used (not BrowserRouter) - URLs have `#/path` format
- No authentication implemented yet - routes are "protected" structurally but not functionally
- No global state management - each screen manages own state
- Responsive: Mobile-first with `md:` and `lg:` breakpoints
- Icons use `size={20}` or `size={24}` consistently
