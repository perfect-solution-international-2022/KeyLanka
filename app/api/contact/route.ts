import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail, renderContactNotificationEmail } from "@/lib/mail";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const saved = await prisma.contactMessage.create({ data: parsed.data });

  await sendMail({
    to: process.env.CONTACT_TO_EMAIL ?? "info@keylanka.lk",
    subject: `New contact form message from ${parsed.data.name}`,
    html: renderContactNotificationEmail(parsed.data),
    replyTo: parsed.data.email,
  });

  return NextResponse.json(saved, { status: 201 });
}
