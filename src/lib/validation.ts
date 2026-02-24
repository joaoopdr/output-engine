import type { ParsedOutput, Confidence, MeetingTask, MeetingDecision, MeetingQuestion } from "@/types/meeting";

const VALID_CONFIDENCE: Confidence[] = ["low", "medium", "high"];
const MAX_TASKS = 25;
const MAX_DECISIONS = 15;
const MAX_QUESTIONS = 15;

export interface ValidationResult {
  valid: boolean;
  output: ParsedOutput | null;
  errors: string[];
}

function generateId(): string {
  return crypto.randomUUID();
}

export function validateModelOutput(raw: string): ValidationResult {
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
  // Accept both keys
  const rawQuestions = parsed.things_to_confirm || parsed.open_questions;
  if (!Array.isArray(rawQuestions)) errors.push("Missing or invalid 'things_to_confirm' / 'open_questions' array");

  if (errors.length > 0) return { valid: false, output: null, errors };

  const tasks: MeetingTask[] = parsed.tasks.slice(0, MAX_TASKS).map((t: any) => ({
    id: generateId(),
    title: String(t.title || ""),
    owner: String(t.owner || "Unassigned"),
    due_date_text: String(t.due_date_text || ""),
    description_bullets: Array.isArray(t.description_bullets) ? t.description_bullets.map(String) : [],
    details: Array.isArray(t.details) ? t.details.map(String) : (Array.isArray(t.description_bullets) ? t.description_bullets.map(String) : []),
    confidence: VALID_CONFIDENCE.includes(t.confidence) ? t.confidence : "low",
    evidence: Array.isArray(t.evidence) ? t.evidence.map(String) : [],
    notes: String(t.notes || ""),
  }));

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

  if (tasks.some((t) => !t.title)) errors.push("Some tasks have empty titles");
  if (decisions.some((d) => !d.decision)) errors.push("Some decisions have empty statements");
  if (open_questions.some((q) => !q.question)) errors.push("Some questions are empty");

  return {
    valid: errors.length === 0,
    output: { tasks, decisions, open_questions },
    errors,
  };
}
