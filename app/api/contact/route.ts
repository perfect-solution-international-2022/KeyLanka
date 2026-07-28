import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail, renderContactNotificationEmail } from "@/lib/mail";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email(),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, "contact", { limit: 5, windowMs: 60 * 60 * 1000 });
  if (rateLimit.limited) return rateLimitResponse(rateLimit.retryAfter);

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const saved = await prisma.contactMessage.create({ data: parsed.data });

  await sendMail({
    to: process.env.CONTACT_TO_EMAIL ?? "info@keylanka.lk",
    subject: "New Key Lanka contact form message",
    html: renderContactNotificationEmail(parsed.data),
    replyTo: parsed.data.email,
  });

  return NextResponse.json(saved, { status: 201 });
}
