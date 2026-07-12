# ⚡ Hackathon Starter - Dual Engine

A lightning-fast, production-ready Next.js 15 boilerplate designed specifically for 8-to-48 hour hackathons. It comes pre-configured with secure authentication, a complete UI component library, and a "Dual-Engine" database architecture allowing you to instantly switch between MongoDB (NoSQL) or PostgreSQL (Relational) at minute zero.

## 🚀 Tech Stack

* **Framework:** Next.js 15 (App Router, Turbopack)
* **Language:** TypeScript
* **Styling:** Tailwind CSS v4 + Framer Motion
* **UI Components:** shadcn/ui (Radix) + Lucide Icons + Sonner (Toasts)
* **Authentication:** Clerk
* **State Management:** Zustand
* **Database (Engine 1):** MongoDB + Mongoose (For rapid, document-based features)
* **Database (Engine 2):** PostgreSQL + Prisma v7 (For complex, relational features)

---

## ⏱️ "Minute Zero" Execution Plan

When the hackathon starts, do not fork this repo. Clone it fresh, wipe the git history, and choose your weapon.

### 1. Initialize Fresh Workspace
```bash
git clone <your-repo-url> my-hackathon-project
cd my-hackathon-project
rm -rf .git  # Delete the boilerplate git history (Use `rmdir /s /q .git` on Windows cmd)
git init
npm install
```

### 2. Choose Your Database Engine

**Option A: The prompt requires fast, flexible data (Choose MongoDB)**

1. Delete `src/lib/database/_prisma` and the root `/prisma` folder.
2. Rename `src/lib/database/_mongodb` to `src/lib/database/mongodb`.
3. Strip the dead weight:
```bash
npm uninstall prisma @prisma/client @prisma/adapter-pg pg
```

**Option B: The prompt requires highly relational data (Choose Prisma / PostgreSQL)**

1. Delete `src/lib/database/_mongodb` folder.
2. Rename `src/lib/database/_prisma` to `src/lib/database/prisma`.
3. Strip the dead weight:
```bash
npm uninstall mongoose
```
4. Push the schema to your Neon/Supabase database:
```bash
npx prisma db push
npx prisma generate
```

### 3. Setup Environment Variables

Rename `.env.example` to `.env` and fill in your keys:

```env
# CLERK AUTHENTICATION
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# DATABASE CONNECTIONS
MONGODB_URI="mongodb+srv://..."
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

### 4. Start Hacking

```bash
npm run dev
```

## 📁 Project Structure

```text
hackathon-starter/
├── prisma/                 # Prisma Schema (Used only if Option B is selected)
├── src/
│   ├── app/                # Next.js App Router (Pages & API)
│   │   ├── globals.css     # Tailwind Entry
│   │   └── layout.tsx      # Wraps app in <ClerkProvider>
│   ├── components/         # Reusable UI
│   │   └── ui/             # shadcn/ui generated components
│   ├── lib/                
│   │   ├── database/       # The Dual-Engine Database Logic
│   │   │   ├── _mongodb/   # Mongoose connection cache
│   │   │   └── _prisma/    # Prisma v7 client singleton
│   │   └── utils.ts        # shadcn utility functions
│   └── proxy.ts            # Clerk route protection (formerly middleware.ts)
```

## 🎨 UI & Components

This repo comes pre-loaded with shadcn/ui (Radix foundation, Nova preset).
Available instant components: `<Button />`, `<Input />`, `<Card />`, `<Dialog />`, `<Form />`, and toast notifications via `<Toaster />` (Sonner).

## 🛡️ Authentication

Authentication is handled via [Clerk](https://clerk.com).

* The home page (`/`) is public.
* Everything else is locked down. If a user tries to access `/dashboard` or an API route without being logged in, they will automatically be redirected to the sign-in page via `src/proxy.ts`.

---

*Built with speed, stability, and scale in mind. Now go win that hackathon! 🏆*
