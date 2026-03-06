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
- RECAP ASSIGNMENTS: When a facilitator lists multiple tasks for one person in a recap ("Sam, you'll do X. Also Y. And Z."), create a SEPARATE task for each item — do not merge them into one.
- CASUAL ACCEPTANCE: Informal acceptance counts as a commitment: "okay", "sure", "I can do that", "I'll write a couple" — these are valid commitments even from non-facilitator attendees.
- SOFT HEDGES FROM FACILITATOR: If the facilitator suggests a task with a hedge ("add it if it's easy", "maybe do X", "if you have time"), do NOT create a task. Add to things_to_confirm: "Is [person] doing [X]?"
- MERGED TASKS WITH MULTIPLE COMMITMENTS: If a facilitator assigns multiple distinct deliverables in one sentence ("rewrite the prompt AND write the phrase list"), create separate tasks for each deliverable, do not merge them.
- "I can do X" or "I'll try X" with NO follow-up confirmation from the group or facilitator is NOT a task. Add to things_to_confirm: "Is [person] doing [X]? Not yet confirmed."
- "I can do X if it's easy" / "if I have time" / "don't go overboard" = things_to_confirm, never a task.
- The distinction: facilitator or group explicitly accepts the offer = task. Unaccepted offer = things_to_confirm.
- When there is no end-of-meeting recap, scan the ENTIRE transcript for commitments. Do not rely only on a summary section. Every "I'll do X", "I can do X by Y", facilitator assignment accepted = task, regardless of where it appears.
- MERGING RULE: When one person commits to multiple related sub-tasks in a single turn ("I need to: set up X, write Y, add Z, test all three — done by Friday"), create ONE merged task with all sub-tasks as detail bullets. Title should be the parent feature name. Do NOT create separate tasks for each sub-task.

DECISION RULES:
- Capture: scope constraints, product behavior rules, process agreements, naming/renaming decisions, timeline commitments the whole group agrees on.
- Examples of what counts as a decision: "Phase 1 is weekly planning only", "cap tasks at 15", "rename tab to Things to confirm", "if meeting date missing keep relative text", "owner Unassigned forces confidence to low"
- One sentence max. No explanations, no "because".
- Do NOT only capture high-level strategy — capture operational rules agreed in the meeting too.
- Capture decisions that emerge from multi-speaker discussion, not just single authoritative statements. If the group converges on a rule through back-and-forth ("it should only be blockers" / "yes" / "exactly"), that is a decision.
- Capture architectural/product decisions too: repair pass strategy, evidence inclusion, dedupe approach, Friday scope.
- Examples of decisions often missed: "repair pass before regenerate", "evidence required per item", "dedupe micro-tasks into one with bullets", "Friday demo = paste → outputs → edit → export only"
- DISCUSSION-EMERGENT DECISIONS: A → B agrees → group accepts = decision, even across multiple turns.
- Capture commonly missed categories: evidence requirements, demo/milestone scope, output quality rules, UI behavior agreed by group.
- Treat every statement in the facilitator's end-of-meeting recap as a candidate decision.
- Deadline changes are decisions: if a due date is explicitly moved during the meeting ("Nina, push it to Monday" / "Monday confirmed"), capture as: "[Task] deadline changed to [new date]."
- Deferrals are decisions: "not this week", "next sprint", "add to backlog", "defer to next week" = a decision. Capture as: "[X] is deferred to [timeframe]."
- Scope cuts are decisions even when mid-meeting and informal: "drop the migration", "profile page only", "documents only" = decisions. Capture EVERY scope cut explicitly.

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
- If the facilitator suggests a task with a hedge ("if it's easy", "if you have time", "don't go overboard"), add to things_to_confirm: "Is [person] doing [X]? It was flagged as optional."
- If a decision was mostly but not fully resolved (someone said "that's basically decided" but no one gave a clean final answer), add to things_to_confirm with medium confidence.
- If meeting date is not recorded or missing and the transcript contains relative dates, add to things_to_confirm: "Meeting date was not provided — relative dates like 'tonight' and 'tomorrow morning' could not be resolved. Please add the meeting date and regenerate."
- When the facilitator explicitly lists "things to confirm" at the end, extract EVERY item as a separate entry.
- directed_to should be the person most associated with the item from earlier in transcript — not Unassigned — if a name was mentioned.
- If a decision was described as "basically decided but not confirmed," add with medium confidence.
- "I can do X" without acceptance → things_to_confirm: "Is [person] doing [X]? Not confirmed."
- When a facilitator explicitly says "put it in things to confirm" or "flag it as a maybe" or "mark it as to confirm" — that item MUST appear in things_to_confirm. This is the highest-priority signal.
- Unowned items where the facilitator explicitly says "nobody's committed to it" or "it's unowned" must always go to things_to_confirm even if someone vaguely offered.

CONFIDENCE RULES:
- high: named owner (from attendees list or clearly named) + explicit first-person commitment ("I'll do X", "I can do X") OR explicit facilitator assignment that was verbally accepted ("Sam, can you do X?" → "Will do" / "Sure")
- medium: clear intent but genuinely missing one detail — owner known but deadline truly absent, OR deadline known but owner slightly ambiguous
- low: missing owner, OR commitment is hedged ("maybe", "if X happens", "possibly", "I think"), OR unclear whether it was actually agreed
- IMPORTANT: A relative date like "today" or "tonight" that is explicitly stated does NOT lower confidence. Relative dates are valid deadlines.
- IMPORTANT: Self-commitment ("I'll do X today") = high confidence always, regardless of date format.
- MERGED TASKS: When multiple commitments from the same owner are merged into one task, confidence is determined by the strongest individual sub-commitment. If all sub-tasks have explicit owners and explicit deadlines, the merged task is high — do not downgrade because the title is compound.

EVIDENCE: For each item, include 1-2 short transcript snippets (exact phrases, max 20 words each) that justify the item. Evidence is mandatory. If no evidence, lower confidence or drop the item.

OWNERS/DATES:
- Never invent names or dates
- If owner unclear: "Unassigned" + low confidence
- If meeting date is missing, keep relative text ("tomorrow"), don't normalize
- If the meeting date field is blank or says "(not recorded)", treat ALL relative dates as unresolvable. Set due_date_text to the exact phrase from transcript, set due_date_iso to null. Do not attempt to resolve.
- New attendees who speak informally still count as valid owners if they accept a task.

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
        temperature: 0,
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
