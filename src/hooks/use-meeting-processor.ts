import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { validateModelOutput } from "@/lib/validation";
import type { ParsedOutput, Run } from "@/types/meeting";
import { toast } from "sonner";

export function useMeetingProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRun, setCurrentRun] = useState<Run | null>(null);
  const [parsedOutput, setParsedOutput] = useState<ParsedOutput | null>(null);

  const process = async (input: {
    transcript_text: string;
    title?: string;
    attendees?: string;
    template_type: string;
    meeting_date?: string;
    meeting_date_iso?: string;
  }) => {
    setIsProcessing(true);
    setParsedOutput(null);
    setCurrentRun(null);

    try {
      const { data: tc, error: tcErr } = await supabase
        .from("transcript_cases")
        .insert({
          title: input.title || null,
          template_type: input.template_type,
          transcript_text: input.transcript_text,
          attendees_text: input.attendees || null,
        })
        .select()
        .single();

      if (tcErr || !tc) throw new Error(tcErr?.message || "Failed to save transcript");

      const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-transcript", {
        body: {
          transcript_text: input.transcript_text,
          template_type: input.template_type,
          attendees: input.attendees,
          meeting_date: input.meeting_date,
        },
      });

      if (fnErr) throw new Error(fnErr.message || "Edge function error");

      const rawOutput = fnData?.raw_output || "";
      const validation = validateModelOutput(rawOutput, input.meeting_date);

      const { data: run, error: runErr } = await supabase
        .from("runs")
        .insert({
          transcript_case_id: tc.id,
          prompt_version: "v11",
          model_name: "google/gemini-3-flash-preview",
          raw_model_output: rawOutput,
          parsed_output_json: validation.output as any,
          validation_status: validation.valid ? "ok" : "fail",
          error_message: validation.errors.length > 0 ? validation.errors.join("; ") : null,
        })
        .select()
        .single();

      if (runErr) throw new Error(runErr?.message || "Failed to save run");

      setCurrentRun(run as any);
      setParsedOutput(validation.output);

      if (!validation.valid) {
        toast.error("Output validation failed", { description: validation.errors.join(", ") });
      } else {
        toast.success("Outputs generated successfully");
      }

      return { run, output: validation.output, transcriptCase: tc };
    } catch (err: any) {
      toast.error("Processing failed", { description: err.message });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { process, isProcessing, currentRun, parsedOutput, setParsedOutput };
}
