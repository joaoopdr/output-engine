export type Confidence = "low" | "medium" | "high";

export interface MeetingTask {
  id: string;
  title: string;
  owner: string;
  due_date_text: string;
  description_bullets: string[];
  confidence: Confidence;
}

export interface MeetingDecision {
  id: string;
  decision: string;
  context: string;
  confidence: Confidence;
}

export interface MeetingQuestion {
  id: string;
  question: string;
  suggested_owner: string;
  confidence: Confidence;
}

export interface ParsedOutput {
  tasks: MeetingTask[];
  decisions: MeetingDecision[];
  open_questions: MeetingQuestion[];
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

export type TemplateType = "weekly_planning";

export const TEMPLATE_OPTIONS: { value: TemplateType; label: string }[] = [
  { value: "weekly_planning", label: "Weekly Planning" },
];
