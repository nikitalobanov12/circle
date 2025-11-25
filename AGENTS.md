# AGENTS.md - Circle App

## Build & Run Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production (runs prisma generate first)
- `npm run lint` - Run ESLint
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database

## Tech Stack
Next.js 15 (App Router), React 19, TypeScript, Prisma (with Accelerate), NextAuth v5, Tailwind CSS 4, Chakra UI, Zod

## Code Style
- Use `@/*` path alias for imports from `src/` (e.g., `import prisma from '@/lib/prisma'`)
- Client components: Add `'use client'` directive at top of file
- API routes: Use NextResponse for responses, auth() for session, return proper HTTP status codes
- Error handling: Try-catch with console.error and appropriate error responses
- Components: Use React.FC with explicit interface for props, prefer memo() for performance
- Naming: camelCase for variables/functions, PascalCase for components/interfaces
- Prisma: Import from `@/lib/prisma`, use typed queries with select/include

## File Structure
- Pages/routes: `src/app/` (App Router)
- API routes: `src/app/api/*/route.ts` with GET/POST/PATCH/DELETE exports
- Components: `src/components/` organized by feature
- Shared utilities: `src/lib/`
