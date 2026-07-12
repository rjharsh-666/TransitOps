# TransitOps — Full Build Guide (Next.js + Clerk + Neon Postgres + Prisma)

This guide assumes your current repo state: Next.js app already scaffolded (App Router, based on your file tree), `prisma/schema.prisma` already written (from `db-schema.md`), dependencies already installed per your `package.json`. We go from **zero working app** to **all pages wired to the DB with business rules enforced**.

> **Note on versions**: your `package.json` shows `next@16`, `react@19.2`, `@clerk/nextjs@7`, `prisma@6`/`@prisma/client@7` (mismatched majors — fix that in Step 0). Code below targets App Router + Clerk v7 middleware API + Prisma 6 syntax, since Prisma client 7 isn't a real published major as of this writing — pin both to `^6.19.3` to avoid a broken install.

---

## Step 0 — Fix the dependency mismatch

```bash
# in package.json, set:
# "@prisma/client": "^6.19.3"
# "prisma": "^6.19.3"
npm install
```

---

## Step 1 — Neon Postgres setup

1. Go to https://neon.tech → sign in → **New Project** → name it `transitops`, pick a region close to you.
2. In the Neon dashboard, open **Connection Details** → copy the **pooled** connection string (used by the app at runtime) and the **direct** connection string (used by Prisma Migrate).
   - Pooled looks like: `postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
   - Direct looks like: `postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`
3. Neon free tier auto-suspends idle databases — first request after idle will be slow (cold start), that's expected, not a bug.

## Step 2 — Clerk setup

1. Go to https://dashboard.clerk.com → **Create application** → name it `TransitOps`. Enable **Email + Password** (turn off social logins for the hackathon unless you want them).
2. Copy the **Publishable key** and **Secret key** from **API Keys**.
3. Go to **Users** → for each of your 4 seed roles, create a test user manually (or you'll do it via sign-up in the app) and note their **User ID** (`user_xxx`) — you need these for the seed script's `createdById` / `userId` foreign keys.
4. Go to **Configure → Sessions → Customize session token** and add this claim so the role is available on every request without an extra DB call:
   ```json
   {
     "publicMetadata": "{{user.public_metadata}}"
   }
   ```
5. Set each user's role: **Users → click user → Metadata → Public metadata**:
   ```json
   { "role": "FleetManager" }
   ```
   (repeat with `Driver`, `SafetyOfficer`, `FinancialAnalyst` for the other three test users)
6. Go to **Webhooks → Add Endpoint**. URL will be `https://<your-deployed-domain>/api/webhooks/clerk` (for local dev, use the Clerk CLI or `ngrok`/`localtunnel` and point it there — see Step 3.6). Subscribe to `user.created` and `user.updated`. Copy the **Signing Secret**.

## Step 3 — `.env` file

Create `.env` at the project root (already gitignored per your file tree):

```bash
# .env

# --- Database (Neon) ---
# Pooled connection — used by the running app (serverless-friendly)
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
# Direct connection — used only by Prisma Migrate / Prisma Studio
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"

# --- Clerk ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxx"
CLERK_SECRET_KEY="sk_test_xxxxxxxxxxxx"
CLERK_WEBHOOK_SECRET="whsec_xxxxxxxxxxxx"

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

Update `schema.prisma`'s datasource block to use both URLs (needed because Neon pooled connections don't support the DDL Prisma Migrate issues):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Step 4 — Run the first migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

This creates all 7 tables in Neon and generates the typed client into `node_modules/@prisma/client`.

Verify it worked:
```bash
npx prisma studio
```
This opens a GUI on `localhost:5555` — you should see all 7 empty tables (`users`, `vehicles`, `drivers`, `trips`, `maintenance_logs`, `fuel_logs`, `expenses`).

---

## Step 5 — Target file structure

Building on your existing tree, this is what `src/` should look like once you're done. Build it in this order — each numbered group is one step in this guide.

```
src/
├── middleware.ts                     # (2) Clerk auth + RBAC gate
├── lib/
│   ├── prisma.ts                     # (1) Prisma client singleton
│   ├── rbac.ts                       # (2) role → allowed routes/actions map
│   └── utils.ts                      # shadcn's cn() helper (likely already exists)
├── app/
│   ├── layout.tsx                    # ClerkProvider + ThemeProvider wrap
│   ├── globals.css
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── dashboard/page.tsx            # (7) KPI dashboard
│   ├── vehicles/page.tsx             # (8) Vehicle Registry
│   ├── drivers/page.tsx              # (9) Driver Management
│   ├── trips/page.tsx                # (10) Trip Management
│   ├── maintenance/page.tsx          # (11) Maintenance
│   ├── fuel-expenses/page.tsx        # (12) Fuel & Expense
│   ├── reports/page.tsx              # (13) Reports & Analytics
│   ├── unauthorized/page.tsx         # RBAC deny page
│   └── api/
│       ├── webhooks/clerk/route.ts   # (3) user.created/updated sync
│       ├── vehicles/route.ts         # GET (list+filter), POST (create)
│       ├── vehicles/[id]/route.ts    # GET, PATCH, DELETE
│       ├── vehicles/available/route.ts
│       ├── drivers/route.ts
│       ├── drivers/[id]/route.ts
│       ├── drivers/available/route.ts
│       ├── trips/route.ts            # GET (list), POST (create Draft)
│       ├── trips/[id]/route.ts       # GET, PATCH (edit while Draft)
│       ├── trips/[id]/dispatch/route.ts
│       ├── trips/[id]/complete/route.ts
│       ├── trips/[id]/cancel/route.ts
│       ├── maintenance/route.ts
│       ├── maintenance/[id]/route.ts
│       ├── maintenance/[id]/close/route.ts
│       ├── fuel-logs/route.ts
│       ├── expenses/route.ts
│       ├── dashboard/kpis/route.ts
│       └── reports/route.ts
└── components/
    ├── nav-sidebar.tsx
    ├── kpi-card.tsx
    ├── data-table.tsx                # generic table w/ sort+filter (bonus)
    ├── vehicle-form-dialog.tsx
    ├── driver-form-dialog.tsx
    ├── trip-form-dialog.tsx
    ├── maintenance-form-dialog.tsx
    ├── fuel-log-form-dialog.tsx
    ├── expense-form-dialog.tsx
    └── status-badge.tsx
```

---

## Step 6 — Core lib files

### 6.1 `src/lib/prisma.ts` — singleton client (avoids exhausting Neon connections in dev)

```ts
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 6.2 `src/lib/rbac.ts` — the page-access matrix

Adjust the matrix to match whatever you finalize in `copilot-instructions.md §4`; this is a reasonable default based on the spec's role descriptions.

```ts
// src/lib/rbac.ts
export type Role = "FleetManager" | "Driver" | "SafetyOfficer" | "FinancialAnalyst";

// Route prefix -> roles allowed to view/use it
export const PAGE_ACCESS: Record<string, Role[]> = {
  "/dashboard": ["FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"],
  "/vehicles": ["FleetManager"],
  "/drivers": ["FleetManager", "SafetyOfficer"],
  "/trips": ["FleetManager", "Driver"],
  "/maintenance": ["FleetManager"],
  "/fuel-expenses": ["FleetManager", "FinancialAnalyst"],
  "/reports": ["FinancialAnalyst", "FleetManager"],
};

export function isAllowed(pathname: string, role: Role | undefined): boolean {
  if (!role) return false;
  const match = Object.keys(PAGE_ACCESS).find((p) => pathname.startsWith(p));
  if (!match) return true; // routes not listed are open to any authed role
  return PAGE_ACCESS[match].includes(role);
}

// Server-side helper for API routes: throws-style guard
export function assertRole(role: Role | undefined, allowed: Role[]) {
  if (!role || !allowed.includes(role)) {
    const err = new Error("Forbidden") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
}
```

### 6.3 `src/middleware.ts` — Clerk auth gate + RBAC redirect

```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAllowed, type Role } from "@/lib/rbac";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims } = await auth.protect(); // redirects to sign-in if not authed

  const role = (sessionClaims?.publicMetadata as { role?: Role } | undefined)?.role;
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    // API routes do their own assertRole() checks per-handler; just require auth here.
    return NextResponse.next();
  }

  if (!isAllowed(pathname, role)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### 6.4 `src/app/layout.tsx`

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TransitOps",
  description: "Smart Transport Operations Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 6.5 Sign-in / sign-up pages

```tsx
// src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn />
    </div>
  );
}
```

```tsx
// src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp />
    </div>
  );
}
```

> By default a new sign-up has **no role** in `publicMetadata`. Either (a) assign roles manually in the Clerk dashboard for your 4 hackathon demo accounts (simplest, do this), or (b) add a post-signup "choose your role" screen that calls an API route which uses the Clerk backend SDK to set `publicMetadata.role`. For an 8-hour hackathon, do (a).

### 6.6 Clerk webhook → sync `User` table

```bash
npm install svix
```

```ts
// src/app/api/webhooks/clerk/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET!;
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let evt: any;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const type = evt.type as string;

  if (type === "user.created" || type === "user.updated") {
    const data = evt.data;
    const email = data.email_addresses?.[0]?.email_address ?? "";
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || email;
    const role = (data.public_metadata?.role as Role | undefined) ?? "Driver";

    await prisma.user.upsert({
      where: { id: data.id },
      create: { id: data.id, email, name, role },
      update: { email, name, role },
    });
  }

  return new Response("ok", { status: 200 });
}
```

For local testing without a public URL, run:
```bash
npx @clerk/clerk-cli listen --forward-to localhost:3000/api/webhooks/clerk
```
or use `ngrok http 3000` and paste that URL into the Clerk webhook endpoint config.

---

## Step 7 — API routes

Every route below follows the same shape: `auth()` from Clerk to get the user + role, `assertRole()` to gate write actions, `prisma` for the query, `NextResponse.json`. Error handling is centralized with a tiny wrapper.

### 7.0 Shared API helper

```ts
// src/lib/api-helpers.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { Role } from "@/lib/rbac";

export async function getSessionRole(): Promise<{ userId: string; role: Role } | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  const role = (sessionClaims?.publicMetadata as { role?: Role } | undefined)?.role;
  if (!role) return null;
  return { userId, role };
}

export function handleApiError(err: unknown) {
  console.error(err);
  const status = (err as { status?: number })?.status ?? 500;
  if ((err as { code?: string })?.code === "P2002") {
    return NextResponse.json({ error: "Duplicate value violates a unique constraint" }, { status: 409 });
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  return NextResponse.json({ error: message }, { status });
}
```

### 7.1 Vehicles — `src/app/api/vehicles/route.ts`

```ts
// src/app/api/vehicles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const region = searchParams.get("region") ?? undefined;

    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(type && { type }),
        ...(status && { status: status as any }),
        ...(region && { region }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vehicles);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager"]);

    const body = await req.json();
    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: body.registrationNumber,
        nameModel: body.nameModel,
        type: body.type,
        maxLoadCapacity: body.maxLoadCapacity,
        odometer: body.odometer ?? 0,
        acquisitionCost: body.acquisitionCost,
        region: body.region ?? null,
        status: "Available",
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
```

```ts
// src/app/api/vehicles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(id) } });
    if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager"]);

    const { id } = await params;
    const body = await req.json();
    const vehicle = await prisma.vehicle.update({ where: { id: Number(id) }, data: body });
    return NextResponse.json(vehicle);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager"]);

    const { id } = await params;
    await prisma.vehicle.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
```

```ts
// src/app/api/vehicles/available/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vehicles = await prisma.vehicle.findMany({
      where: { status: "Available" },
      orderBy: { registrationNumber: "asc" },
    });
    return NextResponse.json(vehicles);
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 7.2 Drivers — same pattern, `src/app/api/drivers/route.ts`

```ts
// src/app/api/drivers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const drivers = await prisma.driver.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(drivers);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager", "SafetyOfficer"]);

    const body = await req.json();
    const driver = await prisma.driver.create({
      data: {
        name: body.name,
        licenseNumber: body.licenseNumber,
        licenseCategory: body.licenseCategory,
        licenseExpiryDate: new Date(body.licenseExpiryDate),
        contactNumber: body.contactNumber,
        safetyScore: body.safetyScore ?? 100,
        status: "Available",
        userId: body.userId ?? null,
      },
    });
    return NextResponse.json(driver, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
```

```ts
// src/app/api/drivers/available/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const drivers = await prisma.driver.findMany({
      where: { status: "Available", licenseExpiryDate: { gte: new Date() } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(drivers);
  } catch (err) {
    return handleApiError(err);
  }
}
```

`src/app/api/drivers/[id]/route.ts` mirrors the vehicle `[id]` route exactly (GET/PATCH/DELETE), just swap `prisma.vehicle` → `prisma.driver` and role list to `["FleetManager", "SafetyOfficer"]` for writes.

### 7.3 Trips — the core business-rule logic

Create as **Draft** (validates cargo weight, vehicle/driver availability up front so the form gives instant feedback), then separate endpoints for the state transitions so each one's transaction is isolated and auditable.

```ts
// src/app/api/trips/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    const trips = await prisma.trip.findMany({
      where: { ...(status && { status: status as any }) },
      include: { vehicle: true, driver: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(trips);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager", "Driver"]);

    const body = await req.json();
    const { vehicleId, driverId, cargoWeight, plannedDistance, source, destination } = body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });

    if (!vehicle || vehicle.status !== "Available") {
      return NextResponse.json({ error: "Vehicle is not available" }, { status: 400 });
    }
    if (!driver || driver.status !== "Available" || driver.licenseExpiryDate < new Date()) {
      return NextResponse.json({ error: "Driver is not available or license expired" }, { status: 400 });
    }
    if (Number(cargoWeight) > Number(vehicle.maxLoadCapacity)) {
      return NextResponse.json(
        { error: `Cargo weight ${cargoWeight}kg exceeds vehicle max load ${vehicle.maxLoadCapacity}kg` },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        source,
        destination,
        vehicleId,
        driverId,
        cargoWeight,
        plannedDistance,
        status: "Draft",
        createdById: session.userId,
      },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
```

**Dispatch** — the double-booking guard: re-check status *inside* the transaction, not before it, so two concurrent dispatch calls can't both pass the check using stale data.

```ts
// src/app/api/trips/[id]/dispatch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager", "Driver"]);

    const { id } = await params;
    const tripId = Number(id);

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip || trip.status !== "Draft") {
        throw Object.assign(new Error("Trip is not in Draft status"), { status: 400 });
      }

      // Re-check inside the transaction — guards against a concurrent dispatch
      // of the same vehicle/driver from a different trip.
      const vehicle = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } });
      const driver = await tx.driver.findUnique({ where: { id: trip.driverId } });
      if (!vehicle || vehicle.status !== "Available") {
        throw Object.assign(new Error("Vehicle no longer available"), { status: 409 });
      }
      if (!driver || driver.status !== "Available") {
        throw Object.assign(new Error("Driver no longer available"), { status: 409 });
      }

      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: { status: "Dispatched", dispatchedAt: new Date() },
      });
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "OnTrip" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "OnTrip" } });

      return updatedTrip;
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
```

> **On the "hard guarantee under concurrent load" note from your schema doc**: the interactive `$transaction` above is correct for Postgres's default `Read Committed` isolation *as long as every write path funnels through this same function* — since the re-read happens inside the transaction, it sees any row already committed by a concurrent dispatch. If you want to be airtight against a rare race where two dispatches read at the exact same instant, add `tx.$executeRaw`SELECT ... FOR UPDATE` on the vehicle/driver rows before the check; skip this for the hackathon unless you have time.

**Complete** — same transaction shape:

```ts
// src/app/api/trips/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager", "Driver"]);

    const { id } = await params;
    const tripId = Number(id);
    const body = await req.json(); // { actualDistance, fuelConsumed, odometerReading }

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip || trip.status !== "Dispatched") {
        throw Object.assign(new Error("Trip is not Dispatched"), { status: 400 });
      }

      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          status: "Completed",
          completedAt: new Date(),
          actualDistance: body.actualDistance,
          fuelConsumed: body.fuelConsumed,
        },
      });
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: "Available",
          ...(body.odometerReading && { odometer: body.odometerReading }),
        },
      });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } });

      return updatedTrip;
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
```

**Cancel** (only valid on a Dispatched trip, per the spec's "cancelling a *dispatched* trip"):

```ts
// src/app/api/trips/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager", "Driver"]);

    const { id } = await params;
    const tripId = Number(id);

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip || trip.status !== "Dispatched") {
        throw Object.assign(new Error("Only a Dispatched trip can be cancelled"), { status: 400 });
      }

      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: { status: "Cancelled", cancelledAt: new Date() },
      });
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "Available" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } });

      return updatedTrip;
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 7.4 Maintenance

```ts
// src/app/api/maintenance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const logs = await prisma.maintenanceLog.findMany({
      include: { vehicle: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(logs);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager"]);

    const body = await req.json();
    const result = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: {
          vehicleId: body.vehicleId,
          maintenanceType: body.maintenanceType,
          description: body.description ?? null,
          cost: body.cost ?? 0,
          status: "Open",
          startDate: new Date(body.startDate),
        },
      }),
      prisma.vehicle.update({ where: { id: body.vehicleId }, data: { status: "InShop" } }),
    ]);

    return NextResponse.json(result[0], { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
```

```ts
// src/app/api/maintenance/[id]/close/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager"]);

    const { id } = await params;
    const logId = Number(id);

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUnique({ where: { id: logId }, include: { vehicle: true } });
      if (!log || log.status !== "Open") {
        throw Object.assign(new Error("Maintenance log is not Open"), { status: 400 });
      }

      const updatedLog = await tx.maintenanceLog.update({
        where: { id: logId },
        data: { status: "Closed", endDate: new Date() },
      });

      // Restore to Available unless the vehicle was separately marked Retired.
      if (log.vehicle.status !== "Retired") {
        await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: "Available" } });
      }

      return updatedLog;
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 7.5 Fuel logs & Expenses

```ts
// src/app/api/fuel-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");

    const logs = await prisma.fuelLog.findMany({
      where: { ...(vehicleId && { vehicleId: Number(vehicleId) }) },
      include: { vehicle: true, trip: true },
      orderBy: { logDate: "desc" },
    });
    return NextResponse.json(logs);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager", "FinancialAnalyst"]);

    const body = await req.json();
    const log = await prisma.fuelLog.create({
      data: {
        vehicleId: body.vehicleId,
        tripId: body.tripId ?? null,
        liters: body.liters,
        cost: body.cost,
        logDate: new Date(body.logDate),
        odometerReading: body.odometerReading ?? null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
```

`src/app/api/expenses/route.ts` is identical, swap `prisma.fuelLog` → `prisma.expense` and fields to `{ vehicleId, tripId, expenseType, amount, expenseDate, description }`.

### 7.6 Dashboard KPIs

```ts
// src/app/api/dashboard/kpis/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
      totalVehicles,
      availableVehicles,
      inShopVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { status: { not: "Retired" } } }),
      prisma.vehicle.count({ where: { status: "Available" } }),
      prisma.vehicle.count({ where: { status: "InShop" } }),
      prisma.trip.count({ where: { status: "Dispatched" } }),
      prisma.trip.count({ where: { status: "Draft" } }),
      prisma.driver.count({ where: { status: "OnTrip" } }),
    ]);

    const utilization = totalVehicles > 0 ? Math.round((activeTrips / totalVehicles) * 100) : 0;

    return NextResponse.json({
      activeVehicles: totalVehicles,
      availableVehicles,
      vehiclesInMaintenance: inShopVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilizationPct: utilization,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 7.7 Reports & Analytics

```ts
// src/app/api/reports/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vehicles = await prisma.vehicle.findMany({
      include: { fuelLogs: true, maintenanceLogs: true, expenses: true, trips: true },
    });

    const report = vehicles.map((v) => {
      const totalFuelLiters = v.fuelLogs.reduce((s, f) => s + Number(f.liters), 0);
      const totalFuelCost = v.fuelLogs.reduce((s, f) => s + Number(f.cost), 0);
      const totalMaintenanceCost = v.maintenanceLogs.reduce((s, m) => s + Number(m.cost), 0);
      const totalExpenseCost = v.expenses.reduce((s, e) => s + Number(e.amount), 0);
      const totalDistance = v.trips.reduce((s, t) => s + Number(t.actualDistance ?? 0), 0);

      const fuelEfficiency = totalFuelLiters > 0 ? totalDistance / totalFuelLiters : 0;
      const operationalCost = totalFuelCost + totalMaintenanceCost;

      // Revenue isn't in the current schema (no per-trip billing field) — plug in a
      // per-km rate or a `revenue` column on Trip before this number means anything.
      const assumedRevenuePerKm = 0; // TODO: replace with real billing figure
      const revenue = totalDistance * assumedRevenuePerKm;
      const roi =
        Number(v.acquisitionCost) > 0
          ? (revenue - (totalMaintenanceCost + totalFuelCost)) / Number(v.acquisitionCost)
          : 0;

      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        fuelEfficiency: Number(fuelEfficiency.toFixed(2)),
        operationalCost: Number((operationalCost + totalExpenseCost).toFixed(2)),
        totalDistance,
        roi: Number(roi.toFixed(3)),
      };
    });

    return NextResponse.json(report);
  } catch (err) {
    return handleApiError(err);
  }
}
```

> **Flag for your team**: the ROI formula in the spec needs a `Revenue` figure that isn't in your current schema. Either add a `revenuePerKm` field to `Vehicle` or a `revenue` field to `Trip` before the demo — right now the route above returns `0` for revenue, which will make ROI look wrong on stage. Cheapest fix: add `revenue Decimal? @db.Decimal(12,2)` to `Trip`, backfill it in the seed script, and sum it into the report instead of the placeholder line.

---

## Step 8 — Shared UI pieces

### 8.1 `src/components/status-badge.tsx`

```tsx
// src/components/status-badge.tsx
import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  Available: "bg-emerald-500/15 text-emerald-500",
  OnTrip: "bg-blue-500/15 text-blue-500",
  InShop: "bg-amber-500/15 text-amber-500",
  Retired: "bg-zinc-500/15 text-zinc-400",
  OffDuty: "bg-zinc-500/15 text-zinc-400",
  Suspended: "bg-red-500/15 text-red-500",
  Draft: "bg-zinc-500/15 text-zinc-400",
  Dispatched: "bg-blue-500/15 text-blue-500",
  Completed: "bg-emerald-500/15 text-emerald-500",
  Cancelled: "bg-red-500/15 text-red-500",
  Open: "bg-amber-500/15 text-amber-500",
  Closed: "bg-emerald-500/15 text-emerald-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", COLORS[status] ?? "bg-zinc-500/15 text-zinc-400")}>
      {status}
    </span>
  );
}
```

### 8.2 `src/components/kpi-card.tsx`

```tsx
// src/components/kpi-card.tsx
export function KpiCard({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {value}
        {suffix}
      </p>
    </div>
  );
}
```

### 8.3 `src/components/nav-sidebar.tsx`

```tsx
// src/components/nav-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", roles: ["FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"] },
  { href: "/vehicles", label: "Vehicles", roles: ["FleetManager"] },
  { href: "/drivers", label: "Drivers", roles: ["FleetManager", "SafetyOfficer"] },
  { href: "/trips", label: "Trips", roles: ["FleetManager", "Driver"] },
  { href: "/maintenance", label: "Maintenance", roles: ["FleetManager"] },
  { href: "/fuel-expenses", label: "Fuel & Expenses", roles: ["FleetManager", "FinancialAnalyst"] },
  { href: "/reports", label: "Reports", roles: ["FinancialAnalyst", "FleetManager"] },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  return (
    <aside className="flex h-screen w-56 flex-col justify-between border-r bg-card px-3 py-4">
      <div>
        <div className="mb-6 px-2 text-lg font-bold">TransitOps</div>
        <nav className="flex flex-col gap-1">
          {LINKS.filter((l) => !role || l.roles.includes(role)).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
                pathname.startsWith(link.href) && "bg-accent"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2 px-2">
        <UserButton />
        <span className="text-xs text-muted-foreground">{role}</span>
      </div>
    </aside>
  );
}
```

### 8.4 `src/app/unauthorized/page.tsx`

```tsx
// src/app/unauthorized/page.tsx
export default function Unauthorized() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="text-muted-foreground">Your role doesn't have permission to view this page.</p>
    </div>
  );
}
```

---

## Step 9 — Pages

Every authenticated page shares this shell — wrap each `page.tsx` body in it, or better, make a `src/app/(app)/layout.tsx` route group so you don't repeat the sidebar import on every page:

```tsx
// src/app/(app)/layout.tsx  — move dashboard/vehicles/drivers/etc under this group
import { NavSidebar } from "@/components/nav-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
```

(If you use the route group, move `dashboard/`, `vehicles/`, `drivers/`, `trips/`, `maintenance/`, `fuel-expenses/`, `reports/` under `src/app/(app)/` — the folder name in parens doesn't appear in the URL.)

### 9.1 `src/app/(app)/dashboard/page.tsx`

```tsx
// src/app/(app)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/kpi-card";

type Kpis = {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPct: number;
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/kpis").then((r) => r.json()).then(setKpis);
  }, []);

  if (!kpis) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Active Vehicles" value={kpis.activeVehicles} />
        <KpiCard label="Available Vehicles" value={kpis.availableVehicles} />
        <KpiCard label="In Maintenance" value={kpis.vehiclesInMaintenance} />
        <KpiCard label="Active Trips" value={kpis.activeTrips} />
        <KpiCard label="Pending Trips" value={kpis.pendingTrips} />
        <KpiCard label="Drivers On Duty" value={kpis.driversOnDuty} />
        <KpiCard label="Fleet Utilization" value={kpis.fleetUtilizationPct} suffix="%" />
      </div>
    </div>
  );
}
```

### 9.2 `src/app/(app)/vehicles/page.tsx`

```tsx
// src/app/(app)/vehicles/page.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";

type Vehicle = {
  id: number;
  registrationNumber: string;
  nameModel: string;
  type: string;
  maxLoadCapacity: string;
  odometer: string;
  status: string;
  region: string | null;
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/vehicles");
    setVehicles(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createVehicle(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/vehicles", { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error);
      return;
    }
    toast.success("Vehicle registered");
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vehicle Registry</h1>
        {/* Wire this button to a Dialog with a <form action={createVehicle}> using the shadcn
            Dialog + Input components — omitted here for brevity, same pattern as KPI card above. */}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Reg. No.</th>
              <th>Name/Model</th>
              <th>Type</th>
              <th>Max Load</th>
              <th>Odometer</th>
              <th>Region</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b">
                <td className="py-2 font-medium">{v.registrationNumber}</td>
                <td>{v.nameModel}</td>
                <td>{v.type}</td>
                <td>{v.maxLoadCapacity} kg</td>
                <td>{v.odometer} km</td>
                <td>{v.region ?? "—"}</td>
                <td><StatusBadge status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

`drivers/page.tsx`, `maintenance/page.tsx`, `fuel-expenses/page.tsx`, and `reports/page.tsx` follow the exact same shape: fetch from the matching API route in a `useEffect`, render a table with `StatusBadge` where relevant, add a create-dialog wired to the POST endpoint. Copy `vehicles/page.tsx` and adjust the fields/columns per entity — the pattern doesn't change.

### 9.3 `src/app/(app)/trips/page.tsx` — the one with real logic (state transition buttons)

```tsx
// src/app/(app)/trips/page.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";

type Trip = {
  id: number;
  source: string;
  destination: string;
  status: string;
  cargoWeight: string;
  vehicle: { registrationNumber: string };
  driver: { name: string };
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);

  async function load() {
    const res = await fetch("/api/trips");
    setTrips(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function transition(id: number, action: "dispatch" | "complete" | "cancel", body?: object) {
    const res = await fetch(`/api/trips/${id}/${action}`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error);
      return;
    }
    toast.success(`Trip ${action}d`);
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Trips</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2">Route</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Cargo</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2">{t.source} → {t.destination}</td>
              <td>{t.vehicle.registrationNumber}</td>
              <td>{t.driver.name}</td>
              <td>{t.cargoWeight} kg</td>
              <td><StatusBadge status={t.status} /></td>
              <td className="space-x-2">
                {t.status === "Draft" && (
                  <button className="text-xs text-blue-500" onClick={() => transition(t.id, "dispatch")}>
                    Dispatch
                  </button>
                )}
                {t.status === "Dispatched" && (
                  <>
                    <button
                      className="text-xs text-emerald-500"
                      onClick={() =>
                        transition(t.id, "complete", { actualDistance: 0, fuelConsumed: 0 })
                      }
                    >
                      Complete
                    </button>
                    <button className="text-xs text-red-500" onClick={() => transition(t.id, "cancel")}>
                      Cancel
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

> Replace the hardcoded `{ actualDistance: 0, fuelConsumed: 0 }` with a small dialog form asking for those two numbers before calling `complete` — stubbed here to keep the guide focused on wiring, not every dialog's JSX.

---

## Step 10 — Seed script

```ts
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Replace these 4 with real Clerk test-user IDs from your dashboard.
  const CLERK_IDS = {
    fleetManager: "user_REPLACE_FM",
    driver: "user_REPLACE_DRIVER",
    safetyOfficer: "user_REPLACE_SO",
    financialAnalyst: "user_REPLACE_FA",
  };

  const fleetManager = await prisma.user.upsert({
    where: { id: CLERK_IDS.fleetManager },
    create: { id: CLERK_IDS.fleetManager, email: "fm@transitops.dev", name: "Fatima Manager", role: "FleetManager" },
    update: {},
  });
  const driverUser = await prisma.user.upsert({
    where: { id: CLERK_IDS.driver },
    create: { id: CLERK_IDS.driver, email: "driver@transitops.dev", name: "Alex Driver", role: "Driver" },
    update: {},
  });
  await prisma.user.upsert({
    where: { id: CLERK_IDS.safetyOfficer },
    create: { id: CLERK_IDS.safetyOfficer, email: "safety@transitops.dev", name: "Sam Safety", role: "SafetyOfficer" },
    update: {},
  });
  await prisma.user.upsert({
    where: { id: CLERK_IDS.financialAnalyst },
    create: { id: CLERK_IDS.financialAnalyst, email: "fin@transitops.dev", name: "Fin Analyst", role: "FinancialAnalyst" },
    update: {},
  });

  const van05 = await prisma.vehicle.create({
    data: { registrationNumber: "VAN-05", nameModel: "Ford Transit", type: "Van", maxLoadCapacity: 500, acquisitionCost: 28000, status: "Available", region: "West" },
  });
  const truck12 = await prisma.vehicle.create({
    data: { registrationNumber: "TRK-12", nameModel: "Isuzu NPR", type: "Truck", maxLoadCapacity: 3000, acquisitionCost: 55000, status: "Available", region: "East" },
  });
  await prisma.vehicle.create({
    data: { registrationNumber: "VAN-09", nameModel: "Mercedes Sprinter", type: "Van", maxLoadCapacity: 800, acquisitionCost: 32000, status: "InShop", region: "West" },
  });
  await prisma.vehicle.create({
    data: { registrationNumber: "TRK-01", nameModel: "Volvo FH", type: "Truck", maxLoadCapacity: 5000, acquisitionCost: 90000, status: "Retired", region: "North" },
  });
  const van21 = await prisma.vehicle.create({
    data: { registrationNumber: "VAN-21", nameModel: "Ford Transit", type: "Van", maxLoadCapacity: 500, acquisitionCost: 28000, status: "Available", region: "South" },
  });

  const alex = await prisma.driver.create({
    data: { userId: driverUser.id, name: "Alex Driver", licenseNumber: "LIC-1001", licenseCategory: "B", licenseExpiryDate: new Date("2027-01-01"), contactNumber: "555-0100", status: "Available" },
  });
  await prisma.driver.create({
    data: { name: "Jordan Lee", licenseNumber: "LIC-1002", licenseCategory: "C", licenseExpiryDate: new Date("2024-06-01"), contactNumber: "555-0101", status: "Available" }, // expired
  });
  await prisma.driver.create({
    data: { name: "Priya Shah", licenseNumber: "LIC-1003", licenseCategory: "B", licenseExpiryDate: new Date("2027-01-01"), contactNumber: "555-0102", status: "Suspended" },
  });
  const morgan = await prisma.driver.create({
    data: { name: "Morgan Diaz", licenseNumber: "LIC-1004", licenseCategory: "C", licenseExpiryDate: new Date("2027-06-01"), contactNumber: "555-0103", status: "Available" },
  });

  await prisma.trip.create({
    data: { source: "Warehouse A", destination: "Depot B", vehicleId: van05.id, driverId: alex.id, cargoWeight: 450, plannedDistance: 120, status: "Draft", createdById: fleetManager.id },
  });
  const dispatched = await prisma.trip.create({
    data: { source: "Port", destination: "Warehouse C", vehicleId: truck12.id, driverId: morgan.id, cargoWeight: 2200, plannedDistance: 340, status: "Dispatched", dispatchedAt: new Date(), createdById: fleetManager.id },
  });
  await prisma.vehicle.update({ where: { id: truck12.id }, data: { status: "OnTrip" } });
  await prisma.driver.update({ where: { id: morgan.id }, data: { status: "OnTrip" } });

  const completedTrip = await prisma.trip.create({
    data: { source: "Depot B", destination: "Warehouse A", vehicleId: van21.id, driverId: alex.id, cargoWeight: 300, plannedDistance: 90, actualDistance: 92, fuelConsumed: 10, status: "Completed", dispatchedAt: new Date(), completedAt: new Date(), createdById: fleetManager.id },
  });

  await prisma.fuelLog.create({
    data: { vehicleId: van21.id, tripId: completedTrip.id, liters: 10, cost: 18.5, logDate: new Date(), odometerReading: 15200 },
  });
  await prisma.expense.create({
    data: { vehicleId: van21.id, tripId: completedTrip.id, expenseType: "Toll", amount: 12, expenseDate: new Date() },
  });
  await prisma.maintenanceLog.create({
    data: { vehicleId: van05.id, maintenanceType: "Oil Change", cost: 85, status: "Open", startDate: new Date() },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

Add to `package.json`:
```json
"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
```
(install `ts-node` as a dev dependency: `npm install -D ts-node`), then run:
```bash
npx prisma db seed
```

---

## Step 11 — Run it

```bash
npm run dev
```

1. Visit `localhost:3000` → redirected to `/sign-in` (unauthenticated, per middleware).
2. Sign in as each of your 4 seeded/created Clerk users → confirm the sidebar only shows the pages their role allows, and `/vehicles` as a `Driver` redirects to `/unauthorized`.
3. Walk the example workflow from the spec end-to-end: create `Van-05` trip → Dispatch → Complete → confirm both vehicle and driver flip back to `Available` in `/vehicles` and `/drivers` → create a Maintenance record on it → confirm it disappears from `/api/vehicles/available`.

## Step 12 — CSV export (mandatory deliverable, quick win)

Add a button on `/reports` that hits a small client-side CSV builder — no extra API route needed since you already have the JSON:

```ts
// src/lib/csv.ts
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => r[h]).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

Call `downloadCsv("transitops-report.csv", reportRows)` from a button on the reports page.

---

## What's deliberately left as a stub above (finish before demo)

- Create/edit **dialog forms** for Vehicles, Drivers, Maintenance, Fuel, Expenses (pattern is identical to the trip transition buttons — a form that POSTs, then re-`load()`s).
- The **Complete Trip** dialog asking for `actualDistance` / `fuelConsumed` / `odometerReading` instead of hardcoded zeros.
- A **`revenue`** field somewhere in the schema so ROI in Reports isn't always zero (flagged in Step 7.7).
- Dashboard **filters** by vehicle type/status/region (spec 3.2) — add query params to `/api/dashboard/kpis` the same way `vehicles/route.ts` already does it.
- Bonus items (charts, PDF export, email reminders, dark mode toggle UI, doc management) — dark mode is already wired via `next-themes` in the root layout; the rest are additive once the core flow works.

