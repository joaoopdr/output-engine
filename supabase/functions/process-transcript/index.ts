import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a meeting output extractor. Given a meeting transcript, extract structured work outputs.

RULES:
- Tasks must be actionable (not summaries). Use verb-first titles: "Send…", "Draft…", "Confirm…", "Investigate…"
- One task = one owner. If unclear, set owner to "Unassigned" and confidence to "low".
- Due dates only if explicitly stated in transcript. Otherwise empty string.
- Deduplicate similar tasks.
- Target 5-15 tasks unless transcript is very long.
- Decisions must be clear commitments made during the meeting.
- Open questions are blockers or unknowns that need resolution.
- Set confidence to "low" when owners/dates/details are ambiguous.

Return ONLY a JSON object with this exact structure (no markdown, no code blocks):
{
  "tasks": [
    {
      "title": "string",
      "owner": "string or Unassigned",
      "due_date_text": "string or empty",
      "description_bullets": ["string"],
      "confidence": "low" | "medium" | "high"
    }
  ],
  "decisions": [
    {
      "decision": "string",
      "context": "string or empty",
      "confidence": "low" | "medium" | "high"
    }
  ],
  "open_questions": [
    {
      "question": "string",
      "suggested_owner": "string or empty",
      "confidence": "low" | "medium" | "high"
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript_text, template_type, attendees } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let userPrompt = `Meeting type: ${template_type || "weekly_planning"}\n\n`;
    if (attendees) userPrompt += `Attendees: ${attendees}\n\n`;
    userPrompt += `Transcript:\n${transcript_text}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code blocks if present
    content = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    return new Response(JSON.stringify({ raw_output: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-transcript error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
