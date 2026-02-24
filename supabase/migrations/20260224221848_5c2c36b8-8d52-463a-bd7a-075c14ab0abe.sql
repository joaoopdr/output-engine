
-- Transcript cases (input data)
CREATE TABLE public.transcript_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  template_type TEXT NOT NULL DEFAULT 'weekly_planning',
  transcript_text TEXT NOT NULL,
  attendees_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generation runs
CREATE TABLE public.runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_case_id UUID NOT NULL REFERENCES public.transcript_cases(id) ON DELETE CASCADE,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  model_name TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  raw_model_output TEXT,
  parsed_output_json JSONB,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'ok', 'fail')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Edited outputs (reviewer edits)
CREATE TABLE public.edited_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  final_tasks_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_decisions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  edit_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.transcript_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edited_outputs ENABLE ROW LEVEL SECURITY;

-- For internal tool: allow all operations (no auth required)
CREATE POLICY "Allow all for transcript_cases" ON public.transcript_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for runs" ON public.runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for edited_outputs" ON public.edited_outputs FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_runs_transcript_case ON public.runs(transcript_case_id);
CREATE INDEX idx_runs_validation_status ON public.runs(validation_status);
CREATE INDEX idx_edited_outputs_run ON public.edited_outputs(run_id);
