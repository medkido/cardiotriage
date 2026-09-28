import { NextRequest, NextResponse } from "next/server";
import { computeTriage } from "@/lib/triage";

export const runtime = "nodejs";

interface RequestBody {
  selectedFlagIds?: string[];
  notes?: string;
  childAge?: string;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const selectedFlagIds = Array.isArray(body.selectedFlagIds) ? body.selectedFlagIds : [];
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : "";
  const childAge = typeof body.childAge === "string" ? body.childAge.slice(0, 40) : "";

  // Deterministic scoring happens in plain code, not in the model.
  const result = computeTriage(selectedFlagIds);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // The app still works without a key: the deterministic tier is
    // returned, just without the plain-language explanation layer.
    return NextResponse.json({ result, explanation: null });
  }

  const cardiacList = result.cardiacFlagsMatched.map((f) => `- ${f.label}`).join("\n") || "(none)";
  const reassuringList = result.reassuringFlagsMatched.map((f) => `- ${f.label}`).join("\n") || "(none)";

  const systemPrompt = `You are a triage explanation assistant for a pediatric chest pain decision-support tool used by clinicians and informed parents.

A deterministic rules engine, not you, has already classified this case into a risk tier based on a published red-flag checklist. Your ONLY job is to explain that classification clearly and suggest reasonable next steps consistent with it.

Hard rules:
- Never change, soften, or override the tier you are given. If the tier is "high", your explanation must not suggest the family can safely wait or that it's probably nothing.
- Never state a diagnosis ("this is psychosomatic", "this is not cardiac"). Describe risk and likely category, not a diagnosis.
- Always end by stating this tool is decision support only and does not replace in-person clinical evaluation.
- Keep the explanation to 3-5 short sentences plus a one-line safety-net instruction. Plain language, no jargon dump.
- Do not invent findings that were not provided.`;

  const userPrompt = `Child age (if provided): ${childAge || "not provided"}
Free-text context from the intake form: ${notes || "(none provided)"}

Risk tier assigned by the rules engine: ${result.tier.toUpperCase()}
Headline: ${result.headline}

Cardiac red flags matched:
${cardiacList}

Reassuring (non-cardiac) features matched:
${reassuringList}

Write the plain-language explanation and safety-net instruction for this case.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ result, explanation: null, apiError: errText }, { status: 200 });
    }

    const data = await response.json();
    const explanation = Array.isArray(data.content)
      ? data.content
          .filter((block: { type: string }) => block.type === "text")
          .map((block: { text: string }) => block.text)
          .join("\n")
      : null;

    return NextResponse.json({ result, explanation });
  } catch (err) {
    return NextResponse.json({ result, explanation: null, apiError: String(err) }, { status: 200 });
  }
}
