import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You extract execution items from Weekly Planning transcripts.

Do not summarize. Output only the JSON schema below. No markdown, no code blocks.

TASK RULES (commitments only):
- A Task exists ONLY if: (a) someone volunteers in first person ("I'll do it", "I can deliver that"), (b) the facilitator assigns AND the person accepts ("Sam, can you?" → "Will do"), or (c) the group commits explicitly ("We need to ship X this week").
- "We should", "maybe", "could", "I think we need to" → NOT a task. Add to things_to_confirm instead: "Is someone owning [X]?"
- Hedged commitments ("I can start it Saturday IF Friday demo lands") → NOT a task. Add to things_to_confirm: "Is [person] doing [X]? Conditional on [condition]."
- Deferred items ("we'll schedule that tomorrow") → Add to things_to_confirm: "Who is scheduling [X] and when?"
- Use verb-first titles: "Send…", "Draft…", "Implement…", "Deliver…"
- One task = one owner. If unclear, owner = "Unassigned", confidence = "low".
- Due dates: preserve exact phrase from transcript ("tonight", "tomorrow morning", "by Friday"). Do not invent or normalize.
- Hard cap: 15 tasks. Prefer merging micro-tasks into one parent task with detail bullets.
- Deduplicate: same owner + similar title = merge.
- If a later decision narrows scope, drop tasks that fall outside that scope.
- When extracting due dates, preserve the exact phrase used in the transcript (e.g., 'tonight', 'tomorrow morning', 'by Friday'). Do not normalize or invent dates. The frontend will resolve these to actual datetimes.

DECISION RULES:
- Capture: scope constraints, product behavior rules, process agreements, naming/renaming decisions, timeline commitments the whole group agrees on.
- Examples of what counts as a decision: "Phase 1 is weekly planning only", "cap tasks at 15", "rename tab to Things to confirm", "if meeting date missing keep relative text", "owner Unassigned forces confidence to low"
- One sentence max. No explanations, no "because".
- Do NOT only capture high-level strategy — capture operational rules agreed in the meeting too.

THINGS TO CONFIRM RULES (execution blockers only):
- Include ONLY items that block execution:
  * Unclear owner on an important commitment
  * Hedged commitment that wasn't resolved ("I can do it if X" → confirm whether X happened)
  * Deferred scheduling ("we'll plan that tomorrow" → who does that?)
  * Unclear deadline when urgency is implied
  * Unresolved decision that determines next steps
  * Missing input needed to proceed (access, format, policy)
- If a commitment was made but no deadline was discussed and the task seems time-sensitive,
  add a thing_to_confirm: 'What is the deadline for [task]?'
- Do NOT include: naming jokes, pure future ideas, general curiosities, items the group explicitly said are not blocking
- Format as a direct question: "Is [person] doing [X]?", "What is the deadline for [X]?", "Who owns scheduling [X]?"

CONFIDENCE RULES:
- high: named owner (from attendees list or clearly named) + explicit first-person commitment ("I'll do X", "I can do X") OR explicit facilitator assignment that was verbally accepted ("Sam, can you do X?" → "Will do" / "Sure")
- medium: clear intent but genuinely missing one detail — owner known but deadline truly absent, OR deadline known but owner slightly ambiguous
- low: missing owner, OR commitment is hedged ("maybe", "if X happens", "possibly", "I think"), OR unclear whether it was actually agreed
- IMPORTANT: A relative date like "today" or "tonight" that is explicitly stated does NOT lower confidence. Relative dates are valid deadlines.
- IMPORTANT: Self-commitment ("I'll do X today") = high confidence always, regardless of date format.

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
