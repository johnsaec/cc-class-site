import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

// ── Competitor list ──────────────────────────────────────────────
const COMPETITORS = [
  { name: "CourTex Construction", url: "https://courtexconstruction.com", threat: "high" },
  { name: "KMS Sport Surfaces", url: "https://kmssportsurfaces.com", threat: "medium" },
  { name: "Aguilar Athletic Services", url: "https://www.aguilarathletics.com", threat: "medium" },
  { name: "Build My Courts", url: "https://buildmycourts.com", threat: "medium" },
  { name: "Sport Court of Austin", url: "https://www.sportcourtofaustin.com", threat: "low" },
] as const;

// ── Types ────────────────────────────────────────────────────────
interface Finding {
  type: "pricing" | "products" | "announcement" | "locations" | "warranty" | "certifications" | "website" | "hiring" | "other";
  significance: "high" | "medium" | "low";
  detail: string;
}

interface CompetitorReport {
  name: string;
  url: string;
  findings: Finding[];
  summary: string;
}

interface MonitorReport {
  date: string;
  executive_summary: string;
  competitors: CompetitorReport[];
  action_items: string[];
}

// ── Claude prompt ────────────────────────────────────────────────
function buildPrompt(): string {
  const competitorList = COMPETITORS.map(
    (c) => `- ${c.name} (${c.url}) — threat level: ${c.threat}`
  ).join("\n");

  return `You have a web search tool. Use it to run web searches about each of these companies. Do a separate web search for each company name.

Companies to research:
${competitorList}

For each company, search the web for their name and look for recent news, pricing info, new services, job postings, new locations, warranty details, certifications, or website updates.

After completing all your searches, output ONLY a JSON object with no other text. No explanation, no markdown fences, no commentary — just the raw JSON.

The JSON must follow this exact structure:
{"date":"${new Date().toISOString().split("T")[0]}","executive_summary":"2-3 sentences summarizing key findings","competitors":[{"name":"Company Name","url":"https://...","findings":[{"type":"pricing|products|announcement|locations|warranty|certifications|website|hiring|other","significance":"high|medium|low","detail":"1-2 sentence finding"}],"summary":"1 sentence summary"}],"action_items":["recommended action"]}

Rules:
- Include all 5 companies even if you find nothing notable (use empty findings array)
- If no findings for a company, set summary to "No notable changes detected."
- Focus on what matters to a sport court surfacing subcontractor in Central Texas`;
}

// ── Email HTML builder ───────────────────────────────────────────
function buildEmailHtml(report: MonitorReport): string {
  const significanceColor: Record<string, string> = {
    high: "#e74c3c",
    medium: "#c8a24e",
    low: "#6b7280",
  };

  const typeEmoji: Record<string, string> = {
    pricing: "💰",
    products: "📦",
    announcement: "📢",
    locations: "📍",
    warranty: "🛡️",
    certifications: "🏅",
    website: "🌐",
    hiring: "👥",
    other: "📌",
  };

  const competitorCards = report.competitors
    .map((comp) => {
      const findingsHtml =
        comp.findings.length === 0
          ? `<p style="color: #6b7280; font-style: italic; margin: 8px 0;">No notable changes detected.</p>`
          : comp.findings
              .map(
                (f) => `
            <div style="margin: 8px 0; padding: 8px 12px; background: #1a1f1e; border-left: 3px solid ${significanceColor[f.significance]}; border-radius: 4px;">
              <span style="font-size: 12px; text-transform: uppercase; color: ${significanceColor[f.significance]}; font-weight: 600;">${typeEmoji[f.type] || "📌"} ${f.type} — ${f.significance}</span>
              <p style="margin: 4px 0 0; color: #d1d5db; font-size: 14px;">${f.detail}</p>
            </div>`
              )
              .join("");

      return `
        <div style="margin: 16px 0; padding: 16px; background: #141918; border: 1px solid #2a2f2e; border-radius: 8px;">
          <h3 style="margin: 0 0 4px; color: #c8a24e; font-size: 16px;">
            <a href="${comp.url}" style="color: #c8a24e; text-decoration: none;">${comp.name}</a>
          </h3>
          <p style="margin: 0 0 12px; color: #9ca3af; font-size: 13px;">${comp.summary}</p>
          ${findingsHtml}
        </div>`;
    })
    .join("");

  const actionItemsHtml = report.action_items
    .map(
      (item) =>
        `<li style="margin: 6px 0; color: #d1d5db; font-size: 14px;">${item}</li>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #0c0f0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px;">

    <!-- Header -->
    <div style="text-align: center; padding: 16px 0 24px; border-bottom: 1px solid #2a2f2e;">
      <h1 style="margin: 0; color: #c8a24e; font-size: 20px; letter-spacing: 1px;">PRO COURT SURFACES</h1>
      <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Competitor Intelligence Brief</p>
      <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">${report.date}</p>
    </div>

    <!-- Executive Summary -->
    <div style="margin: 20px 0; padding: 16px; background: linear-gradient(135deg, #1a1f1e, #141918); border: 1px solid #c8a24e33; border-radius: 8px;">
      <h2 style="margin: 0 0 8px; color: #c8a24e; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Executive Summary</h2>
      <p style="margin: 0; color: #e5e7eb; font-size: 14px; line-height: 1.5;">${report.executive_summary}</p>
    </div>

    <!-- Competitor Cards -->
    ${competitorCards}

    <!-- Action Items -->
    ${
      report.action_items.length > 0
        ? `
    <div style="margin: 20px 0; padding: 16px; background: #141918; border: 1px solid #c8a24e55; border-radius: 8px;">
      <h2 style="margin: 0 0 12px; color: #c8a24e; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Recommended Actions</h2>
      <ul style="margin: 0; padding-left: 20px;">${actionItemsHtml}</ul>
    </div>`
        : ""
    }

    <!-- Footer -->
    <div style="text-align: center; padding: 16px 0; border-top: 1px solid #2a2f2e; margin-top: 24px;">
      <p style="margin: 0; color: #4b5563; font-size: 11px;">Automated daily brief from Pro Court Surfaces CI Monitor</p>
      <p style="margin: 4px 0 0; color: #4b5563; font-size: 11px;">Powered by Claude AI + web search</p>
    </div>

  </div>
</body>
</html>`;
}

// ── Fallback plain-text email ────────────────────────────────────
function buildFallbackEmail(rawText: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #0c0f0e; font-family: monospace;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
    <h1 style="color: #c8a24e; font-size: 20px;">Competitor Monitor — Raw Output</h1>
    <p style="color: #e74c3c; font-size: 13px;">JSON parsing failed. Showing raw Claude response:</p>
    <pre style="color: #d1d5db; font-size: 13px; white-space: pre-wrap; background: #141918; padding: 16px; border-radius: 8px; border: 1px solid #2a2f2e;">${rawText}</pre>
  </div>
</body>
</html>`;
}

// ── Main handler ─────────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Auth: Vercel cron sends CRON_SECRET in the Authorization header.
  // Also allow manual testing via ?test= query param.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    res.status(500).json({ error: "CRON_SECRET not configured" });
    return;
  }

  const authHeader = req.headers.authorization;
  const testParam = req.query.test as string | undefined;
  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` || testParam === cronSecret;

  if (!isAuthorized) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    console.log("Starting competitor monitor...");
    // ── Call Claude with web_search ──
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [{ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 5 }],
      messages: [{ role: "user", content: buildPrompt() }],
    });

    console.log("Claude response received, stop_reason:", message.stop_reason);
    // Extract ALL text blocks from response (web_search produces multiple)
    const rawText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("\n");

    // ── Parse JSON from Claude response ──
    let report: MonitorReport;
    let emailHtml: string;

    try {
      // Try to extract JSON from the response (Claude may wrap it in markdown)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      report = JSON.parse(jsonMatch[0]) as MonitorReport;
      emailHtml = buildEmailHtml(report);
    } catch {
      // Fallback: send raw text if JSON parsing fails
      emailHtml = buildFallbackEmail(rawText);
    }

    // ── Send email via Resend ──
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: "CI Monitor <monitor@procourtsurfaces.com>",
      to: ["patrick@procourtsurfaces.com"],
      subject: `Competitor Brief — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      html: emailHtml,
    });

    if (emailError) {
      res.status(500).json({ error: "Email send failed", details: emailError });
      return;
    }

    res.status(200).json({ success: true, message: "Competitor brief sent" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Monitor failed:", errorMessage);
    res.status(500).json({ error: "Monitor failed", details: errorMessage });
  }
}
