export type Confidence = "low" | "medium" | "high";
export type Priority = "urgent" | "this week" | "when possible";

export interface MeetingTask {
  id: string;
  title: string;
  owner: string;
  due_date_text: string;
  due_date_iso?: string | null;
  due_date_display?: string;
  due_date_confidence?: "exact" | "assumed" | "unresolved";
  description_bullets: string[];
  details: string[];
  confidence: Confidence;
  priority: Priority;
  priority_reason: string;
  evidence: string[];
  notes: string;
  side?: "internal" | "customer";
  story_points?: number;
  acceptance_criteria?: string[];
}

export interface MeetingDecision {
  id: string;
  decision: string;
  context: string;
  confidence: Confidence;
  evidence: string[];
}

export interface MeetingQuestion {
  id: string;
  question: string;
  directed_to: string;
  suggested_owner: string; // kept for backward compat
  confidence: Confidence;
  evidence: string[];
}

export interface HandoffContext {
  customer_name: string;
  customer_goal: string;
  success_criteria: string[];
  constraints: string[];
  key_stakeholders: { name: string; role: string; side: "internal" | "customer" }[];
}

export interface ParsedOutput {
  tasks: MeetingTask[];
  decisions: MeetingDecision[];
  open_questions: MeetingQuestion[];
  handoff_context?: HandoffContext;
}

export interface TranscriptCase {
  id: string;
  title: string | null;
  template_type: string;
  transcript_text: string;
  attendees_text: string | null;
  created_at: string;
}

export interface Run {
  id: string;
  transcript_case_id: string;
  prompt_version: string;
  model_name: string;
  raw_model_output: string | null;
  parsed_output_json: ParsedOutput | null;
  validation_status: "pending" | "ok" | "fail";
  error_message: string | null;
  created_at: string;
}

export interface EditedOutput {
  id: string;
  run_id: string;
  final_tasks_json: MeetingTask[];
  final_decisions_json: MeetingDecision[];
  final_questions_json: MeetingQuestion[];
  edit_notes: string | null;
  created_at: string;
}

export type TemplateType = "weekly_planning" | "customer_handoff" | "sprint_planning";

export const TEMPLATE_OPTIONS: { value: TemplateType; label: string }[] = [
  { value: "weekly_planning", label: "Weekly Planning" },
  { value: "customer_handoff", label: "Customer Handoff" },
  { value: "sprint_planning", label: "Sprint Planning" },
];
