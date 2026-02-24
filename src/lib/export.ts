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
    if (t.description_bullets.length > 0) {
      md += `- **Details:**\n`;
      t.description_bullets.forEach((b) => (md += `  - ${b}\n`));
    }
    md += "\n";
  });

  md += "## Decisions\n\n";
  decisions.forEach((d, i) => {
    md += `${i + 1}. **${d.decision}**`;
    if (d.context) md += ` — ${d.context}`;
    md += ` _(${d.confidence})_\n`;
  });

  md += "\n## Open Questions\n\n";
  questions.forEach((q, i) => {
    md += `${i + 1}. ${q.question}`;
    if (q.suggested_owner) md += ` → ${q.suggested_owner}`;
    md += ` _(${q.confidence})_\n`;
  });

  return md;
}

export function exportAsJSON(
  tasks: MeetingTask[],
  decisions: MeetingDecision[],
  questions: MeetingQuestion[]
): string {
  return JSON.stringify({ tasks, decisions, open_questions: questions }, null, 2);
}
