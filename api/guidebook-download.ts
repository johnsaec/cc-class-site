import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, email, phone } = req.body || {};

  // Validate required fields
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Name is required." });
    return;
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanPhone =
    phone && typeof phone === "string" ? phone.trim() : undefined;

  // Read the PDF file
  const pdfPath = path.join(process.cwd(), "Pickleball Court Guide for GCs.pdf");
  let pdfBuffer: Buffer;

  try {
    pdfBuffer = fs.readFileSync(pdfPath);
  } catch {
    console.error("guidebook.pdf not found at:", pdfPath);
    res.status(500).json({ error: "Guide is temporarily unavailable. Please try again later." });
    return;
  }

  const pdfBase64 = pdfBuffer.toString("base64");

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Send PDF to the lead
  const { error: leadError } = await resend.emails.send({
    from: "Pro Court Surfaces <guides@procourtsurfaces.com>",
    to: [cleanEmail],
    subject: "Your Pickleball Court GC Guide",
    text: buildLeadEmail(cleanName),
    attachments: [
      {
        filename: "Pickleball-Court-GC-Guide.pdf",
        content: pdfBase64,
      },
    ],
  });

  if (leadError) {
    console.error("Failed to send guide email:", leadError);
    res.status(500).json({ error: "Failed to send the guide. Please try again." });
    return;
  }

  // Send notification to Patrick
  const { error: notifyError } = await resend.emails.send({
    from: "Pro Court Surfaces <guides@procourtsurfaces.com>",
    to: ["patrick@procourtsurfaces.com"],
    subject: `New Guidebook Lead: ${cleanName}`,
    html: buildNotifyEmail(cleanName, cleanEmail, cleanPhone),
  });

  if (notifyError) {
    console.error("Failed to send notification:", notifyError);
    // Don't fail the request — the lead already got their guide
  }

  res.status(200).json({ success: true });
}

function buildLeadEmail(name: string): string {
  return `Hey ${name},

Your pickleball court guide is attached. It covers court dimensions, surface system specs, budgeting ranges, and scope breakdown.

If you've got a project coming up and need a surfacing bid, just reply to this email. We turn around detailed bids in 48 hours.

— Patrick Johnson
Pro Court Surfaces`;
}

function buildNotifyEmail(
  name: string,
  email: string,
  phone: string | undefined
): string {
  const now = new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #0c0f0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 24px;">

    <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #2a2f2e;">
      <h1 style="margin: 0; color: #c8a24e; font-size: 20px; letter-spacing: 1px;">NEW GUIDEBOOK LEAD</h1>
      <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">${now}</p>
    </div>

    <div style="padding: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 12px; color: #5c6b64; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; width: 80px; vertical-align: top;">Name</td>
          <td style="padding: 10px 12px; color: #e8ece9; font-size: 15px;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; color: #5c6b64; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; vertical-align: top;">Email</td>
          <td style="padding: 10px 12px; color: #e8ece9; font-size: 15px;"><a href="mailto:${email}" style="color: #c8a24e; text-decoration: none;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; color: #5c6b64; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; vertical-align: top;">Phone</td>
          <td style="padding: 10px 12px; color: #e8ece9; font-size: 15px;">${phone || "Not provided"}</td>
        </tr>
      </table>
    </div>

    <div style="border-top: 1px solid #2a2f2e; padding-top: 16px; text-align: center;">
      <p style="color: #5c6b64; font-size: 12px; margin: 0;">They downloaded the pickleball court GC guide.</p>
    </div>

  </div>
</body>
</html>`;
}
