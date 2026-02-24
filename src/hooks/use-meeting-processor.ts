import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { validateModelOutput } from "@/lib/validation";
import type { ParsedOutput, TranscriptCase, Run } from "@/types/meeting";
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
  }) => {
    setIsProcessing(true);
    setParsedOutput(null);
    setCurrentRun(null);

    try {
      // 1. Create transcript case
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

      // 2. Call edge function
      const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-transcript", {
        body: {
          transcript_text: input.transcript_text,
          template_type: input.template_type,
          attendees: input.attendees,
        },
      });

      if (fnErr) throw new Error(fnErr.message || "Edge function error");

      const rawOutput = fnData?.raw_output || "";

      // 3. Validate
      const validation = validateModelOutput(rawOutput);

      // 4. Save run
      const { data: run, error: runErr } = await supabase
        .from("runs")
        .insert({
          transcript_case_id: tc.id,
          prompt_version: "v1",
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
