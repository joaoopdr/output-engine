import type { MeetingTask, MeetingDecision, MeetingQuestion } from "@/types/meeting";

export function exportAsMarkdown(
  tasks: MeetingTask[],
  decisions: MeetingDecision[],
  questions: MeetingQuestion[],
  title?: string
): string {
  let md = title ? `# ${title}\n\n` : "";

  md += "## Tasks\n\n";
  tasks.forEach((t, i) => {
    md += `### ${i + 1}. ${t.title}\n`;
    md += `- **Owner:** ${t.owner}\n`;
    if (t.due_date_text) md += `- **Due:** ${t.due_date_text}\n`;
    md += `- **Confidence:** ${t.confidence}\n`;
    if (t.details && t.details.length > 0) {
      md += `- **Details:**\n`;
      t.details.forEach((b) => (md += `  - ${b}\n`));
    } else if (t.description_bullets && t.description_bullets.length > 0) {
      md += `- **Details:**\n`;
      t.description_bullets.forEach((b) => (md += `  - ${b}\n`));
    }
    if (t.notes) md += `- **Notes:** ${t.notes}\n`;
    md += "\n";
  });

  md += "## Decisions\n\n";
  decisions.forEach((d, i) => {
    md += `${i + 1}. **${d.decision}** _(${d.confidence})_\n`;
  });

  md += "\n## Things to Confirm\n\n";
  questions.forEach((q, i) => {
    md += `${i + 1}. ${q.question}`;
    if (q.directed_to) md += ` → ${q.directed_to}`;
    md += ` _(${q.confidence})_\n`;
  });

  return md;
}

export function exportAsJSON(
  tasks: MeetingTask[],
  decisions: MeetingDecision[],
  questions: MeetingQuestion[]
): string {
  return JSON.stringify({
    tasks: tasks.map(t => ({
      title: t.title,
      owner: t.owner,
      due_date_text: t.due_date_text,
      details: t.details || t.description_bullets,
      confidence: t.confidence,
      evidence: t.evidence,
    })),
    decisions: decisions.map(d => ({
      decision: d.decision,
      confidence: d.confidence,
      evidence: d.evidence,
    })),
    things_to_confirm: questions.map(q => ({
      question: q.question,
      directed_to: q.directed_to,
      confidence: q.confidence,
      evidence: q.evidence,
    })),
  }, null, 2);
}
