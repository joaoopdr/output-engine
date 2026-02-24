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
  if (!Array.isArray(parsed.open_questions)) errors.push("Missing or invalid 'open_questions' array");

  if (errors.length > 0) return { valid: false, output: null, errors };

  // Validate and normalize tasks
  const tasks: MeetingTask[] = parsed.tasks.slice(0, MAX_TASKS).map((t: any) => ({
    id: generateId(),
    title: String(t.title || ""),
    owner: String(t.owner || "Unassigned"),
    due_date_text: String(t.due_date_text || ""),
    description_bullets: Array.isArray(t.description_bullets) ? t.description_bullets.map(String) : [],
    confidence: VALID_CONFIDENCE.includes(t.confidence) ? t.confidence : "low",
  }));

  const decisions: MeetingDecision[] = parsed.decisions.slice(0, MAX_DECISIONS).map((d: any) => ({
    id: generateId(),
    decision: String(d.decision || ""),
    context: String(d.context || ""),
    confidence: VALID_CONFIDENCE.includes(d.confidence) ? d.confidence : "low",
  }));

  const open_questions: MeetingQuestion[] = parsed.open_questions.slice(0, MAX_QUESTIONS).map((q: any) => ({
    id: generateId(),
    question: String(q.question || ""),
    suggested_owner: String(q.suggested_owner || ""),
    confidence: VALID_CONFIDENCE.includes(q.confidence) ? q.confidence : "low",
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
