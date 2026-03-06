CREATE TABLE public.gold_standards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_case_id UUID REFERENCES public.transcript_cases(id) ON DELETE SET NULL,
  transcript_title TEXT NOT NULL,
  transcript_text TEXT NOT NULL,
  expected_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_things_to_confirm JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gold_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for gold_standards" ON public.gold_standards FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_gold_standards_transcript ON public.gold_standards(transcript_case_id);