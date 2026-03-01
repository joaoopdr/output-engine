import type { ParsedOutput, Confidence, MeetingTask, MeetingDecision, MeetingQuestion } from "@/types/meeting";
import { resolveDate } from "@/lib/dateUtils";

const VALID_CONFIDENCE: Confidence[] = ["low", "medium", "high"];
const MAX_TASKS = 15;
const MAX_DECISIONS = 15;
const MAX_QUESTIONS = 15;

// Summary-like prefixes to filter out
const SUMMARY_PREFIXES = /^(discussed|talk about|meeting about|went over|reviewed|covered|chatted about)/i;

export interface ValidationResult {
  valid: boolean;
  output: ParsedOutput | null;
  errors: string[];
}

function generateId(): string {
  return crypto.randomUUID();
}

function isVerbFirst(title: string): boolean {
  const firstWord = title.trim().split(/\s+/)[0]?.toLowerCase() || "";
  // Common action verbs
  const verbs = ["send", "draft", "confirm", "investigate", "create", "update", "review", "fix", "add", "remove", "write", "build", "deploy", "test", "check", "schedule", "set", "get", "prepare", "finalize", "complete", "share", "submit", "follow", "reach", "contact", "organize", "plan", "implement", "design", "research", "analyze", "coordinate", "arrange", "ensure", "verify", "validate", "configure", "migrate", "refactor", "document", "present", "demo", "deliver", "ship", "launch", "publish", "release", "merge", "push", "pull", "clean", "move", "transfer", "assign", "delegate", "notify", "inform", "escalate", "resolve", "close", "open", "start", "finish", "give", "take", "make", "do", "run", "sort", "handle", "address", "discuss"];
  return verbs.some(v => firstWord.startsWith(v));
}

export function validateModelOutput(raw: string, meetingDateISO?: string): ValidationResult {
  const errors: string[] = [];

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, output: null, errors: ["Invalid JSON output from model"] };
  }

  if (!parsed || typeof parsed !== "object") {
    return { valid: false, output: null, errors: ["Output is not a JSON object"] };
  }

  if (!Array.isArray(parsed.tasks)) errors.push("Missing or invalid 'tasks' array");
  if (!Array.isArray(parsed.decisions)) errors.push("Missing or invalid 'decisions' array");
  const rawQuestions = parsed.things_to_confirm || parsed.open_questions;
  if (!Array.isArray(rawQuestions)) errors.push("Missing or invalid 'things_to_confirm' array");

  if (errors.length > 0) return { valid: false, output: null, errors };

  // Post-processing: filter summary tasks, enforce verb-first, cap, dedupe
  let tasks: MeetingTask[] = parsed.tasks
    .filter((t: any) => !SUMMARY_PREFIXES.test(String(t.title || "").trim()))
    .slice(0, MAX_TASKS)
    .map((t: any) => {
      const title = String(t.title || "");
      const confidence = VALID_CONFIDENCE.includes(t.confidence) ? t.confidence : "low";
      return {
        id: generateId(),
        title,
        owner: String(t.owner || "Unassigned"),
        due_date_text: String(t.due_date_text || ""),
        description_bullets: Array.isArray(t.description_bullets) ? t.description_bullets.map(String) : [],
        details: Array.isArray(t.details) ? t.details.map(String) : (Array.isArray(t.description_bullets) ? t.description_bullets.map(String) : []),
        confidence: !isVerbFirst(title) && confidence === "high" ? "medium" as Confidence : confidence,
        evidence: Array.isArray(t.evidence) ? t.evidence.map(String) : [],
        notes: String(t.notes || ""),
      };
    });

  const decisions: MeetingDecision[] = parsed.decisions.slice(0, MAX_DECISIONS).map((d: any) => ({
    id: generateId(),
    decision: String(d.decision || ""),
    context: String(d.context || ""),
    confidence: VALID_CONFIDENCE.includes(d.confidence) ? d.confidence : "low",
    evidence: Array.isArray(d.evidence) ? d.evidence.map(String) : [],
  }));

  const open_questions: MeetingQuestion[] = rawQuestions.slice(0, MAX_QUESTIONS).map((q: any) => ({
    id: generateId(),
    question: String(q.question || ""),
    directed_to: String(q.directed_to || q.suggested_owner || ""),
    suggested_owner: String(q.suggested_owner || q.directed_to || ""),
    confidence: VALID_CONFIDENCE.includes(q.confidence) ? q.confidence : "low",
    evidence: Array.isArray(q.evidence) ? q.evidence.map(String) : [],
  }));

  if (tasks.some(t => !t.title)) errors.push("Some tasks have empty titles");
  if (decisions.some(d => !d.decision)) errors.push("Some decisions have empty statements");
  if (open_questions.some(q => !q.question)) errors.push("Some questions are empty");

  return {
    valid: errors.length === 0,
    output: { tasks, decisions, open_questions },
    errors,
  };
}
