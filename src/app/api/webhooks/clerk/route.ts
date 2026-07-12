import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook disabled for local development", { status: 200 });
  }

  const headerList = await headers();
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const webhook = new Webhook(secret);

  let event: any;
  try {
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const data = event.data;
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