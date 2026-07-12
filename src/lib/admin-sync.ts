import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";

export function getUserEmail(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>) {
  return user.emailAddresses[0]?.emailAddress ?? "";
}

export function getUserName(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || getUserEmail(user);
}

export async function syncClerkUsersToDatabase() {
  const client = await clerkClient();
  const { data } = await client.users.getUserList({ limit: 500, orderBy: "-created_at" });

  const synced = await Promise.all(
    data.map((user) => {
      const role = (user.publicMetadata?.role as Role | undefined) ?? "Driver";

      return prisma.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: getUserEmail(user),
          name: getUserName(user),
          role,
        },
        update: {
          email: getUserEmail(user),
          name: getUserName(user),
          role,
        },
      });
    })
  );

  return { synced: synced.length };
}