import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You extract execution items from Weekly Planning transcripts.

Do not summarize. Output only the JSON schema below. No markdown, no code blocks.

TASK RULES (commitments only):
- A Task exists ONLY if someone volunteers ("I'll do it"), the facilitator assigns ("Sam, can you…"), or the group explicitly commits ("We need to do X this week").
- If phrased as "we should / maybe / could," do NOT create a task. Instead add to things_to_confirm: "Is someone owning X this week?"
- Use verb-first titles: "Send…", "Draft…", "Confirm…", "Investigate…"
- One task = one owner. If unclear, owner = "Unassigned", confidence = "low".
- Due dates only if explicitly stated. Otherwise empty string.
- When extracting due dates, preserve the exact phrase used in the transcript (e.g., 'tonight', 'tomorrow morning', 'by Friday'). Do not normalize or invent dates. The frontend will resolve these to actual datetimes.
- If later in transcript there's a decision to focus only on X, drop tasks outside X.
- Merge micro-tasks into one parent task when appropriate; keep detail bullets.
- Hard cap: 15 tasks unless transcript is very long. Prefer merging to dropping.
- Deduplicate similar tasks.

DECISION RULES:
- Only clear commitments made during the meeting.
- One sentence max. No explanations, no "because".
- Only real constraints/scope choices.

THINGS TO CONFIRM RULES (execution blockers only):
- Include ONLY items that block execution:
  * Unclear owner on an important commitment
  * Unclear deadline when urgency is implied
  * Unresolved decision that determines next steps
  * Missing input needed to proceed (access, format, policy)
- Do NOT include:
  * Naming/codename discussions
  * Jokes
  * "Future ideas" (unless required to decide now)
  * General curiosities

CONFIDENCE RULES:
- high: explicit owner + explicit commitment language
- medium: clear intent but missing one detail
- low: missing owner or unclear commitment

EVIDENCE: For each item, include 1-2 short transcript snippets (exact phrases, max 20 words each) that justify the item. Evidence is mandatory. If no evidence, lower confidence or drop the item.

OWNERS/DATES:
- Never invent names or dates
- If owner unclear: "Unassigned" + low confidence
- If meeting date is missing, keep relative text ("tomorrow"), don't normalize

Return ONLY this JSON object (no markdown, no code blocks):
{
  "tasks": [
    {
      "title": "string",
      "owner": "string or Unassigned",
      "due_date_text": "string or empty",
      "details": ["string"],
      "confidence": "low" | "medium" | "high",
      "evidence": ["short transcript quote"]
    }
  ],
  "decisions": [
    {
      "decision": "string (one crisp sentence, no explanation)",
      "confidence": "low" | "medium" | "high",
      "evidence": ["short transcript quote"]
    }
  ],
  "things_to_confirm": [
    {
      "question": "string",
      "directed_to": "string or Unassigned",
      "confidence": "low" | "medium" | "high",
      "evidence": ["short transcript quote"]
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript_text, template_type, attendees, meeting_date } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let userPrompt = `Meeting type: Weekly Planning\n\n`;
    if (attendees) userPrompt += `Attendees: ${attendees}\n\n`;
    if (meeting_date) userPrompt += `Meeting date: ${meeting_date}\n\n`;
    userPrompt += `REMINDERS:\n- If it's not a commitment, it's not a task\n- If it's not a blocker, it's not a thing_to_confirm\n- Evidence is mandatory for every item\n- One-line decisions only, no explanations\n\n`;
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
        temperature: 0.15,
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

    // Attempt JSON parse; if invalid, try repair
    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn("Initial JSON parse failed, attempting repair...");
      const repairResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "Fix the following text so it is valid JSON matching this schema: {tasks:[], decisions:[], things_to_confirm:[]}. Do NOT change any content. Return ONLY valid JSON, no markdown." },
            { role: "user", content: content },
          ],
          temperature: 0,
        }),
      });

      if (repairResponse.ok) {
        const repairData = await repairResponse.json();
        let repaired = repairData.choices?.[0]?.message?.content || "";
        repaired = repaired.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
        try {
          parsed = JSON.parse(repaired);
          content = repaired;
          console.log("JSON repair succeeded");
        } catch {
          console.error("JSON repair also failed");
        }
      }
    }

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
