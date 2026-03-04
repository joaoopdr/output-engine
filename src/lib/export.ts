import type { MeetingTask, MeetingDecision, MeetingQuestion } from "@/types/meeting";

export function exportAsMarkdown(
  tasks: MeetingTask[],
  decisions: MeetingDecision[],
  questions: MeetingQuestion[],
  title?: string,
  meetingDate?: string,
  attendees?: string
): string {
  let md = `# ${title || "Untitled Meeting"}\n`;
  md += `Date: ${meetingDate || "Date not recorded"}\n`;
  md += `Attendees: ${attendees || "Not specified"}\n\n`;
  md += "---\n\n";

  md += "## Tasks\n\n";
  tasks.forEach((t) => {
    const owner = t.owner ? `[${t.owner}]` : "";
    const due = t.due_date_display || t.due_date_text;
    const dueStr = due ? `[${due}]` : "";
    md += `- ${owner} ${dueStr} ${t.title}\n`.replace(/\s+/g, " ");
    (t.details || t.description_bullets || []).forEach((b) => {
      md += `  - ${b}\n`;
    });
    if (t.notes) md += `  - 📝 ${t.notes}\n`;
  });

  md += "\n## Decisions\n\n";
  decisions.forEach((d) => {
    md += `- ${d.decision}\n`;
  });

  md += "\n## Things to confirm\n\n";
  questions.forEach((q) => {
    const directed = q.directed_to ? `[${q.directed_to}]` : "";
    md += `- ${directed} ${q.question}\n`.replace(/\s+/g, " ");
  });

  return md.trim() + "\n";
}

export function exportAsPlainText(
  tasks: MeetingTask[],
  decisions: MeetingDecision[],
  questions: MeetingQuestion[],
  title?: string,
  meetingDate?: string,
  attendees?: string
): string {
  let txt = `Meeting: ${title || "Untitled Meeting"} — ${meetingDate || "Date not recorded"}\n`;
  txt += `Attendees: ${attendees || "Not specified"}\n\n`;

  txt += "TASKS\n";
  tasks.forEach((t, i) => {
    const due = t.due_date_display || t.due_date_text;
    txt += `${i + 1}. ${t.owner || "Unassigned"} — ${t.title} (due ${due || "no date"})\n`;
  });

  txt += "\nDECISIONS\n";
  decisions.forEach((d, i) => {
    txt += `${i + 1}. ${d.decision}\n`;
  });

  txt += "\nTO CONFIRM\n";
  questions.forEach((q, i) => {
    const dir = q.directed_to ? ` → ${q.directed_to}` : "";
    txt += `${i + 1}. ${q.question}${dir}\n`;
  });

  return txt.trim() + "\n";
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
      due_date_iso: t.due_date_iso || null,
      details: t.details || t.description_bullets || [],
      confidence: t.confidence,
      evidence: t.evidence || [],
    })),
    decisions: decisions.map(d => ({
      decision: d.decision,
      confidence: d.confidence,
      evidence: d.evidence || [],
    })),
    things_to_confirm: questions.map(q => ({
      question: q.question,
      directed_to: q.directed_to,
      confidence: q.confidence,
      evidence: q.evidence || [],
    })),
  }, null, 2);
}
