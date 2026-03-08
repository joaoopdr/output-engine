import type { MeetingTask, MeetingDecision, MeetingQuestion, TemplateType } from "@/types/meeting";

interface ShareProps {
  tasks: MeetingTask[];
  decisions: MeetingDecision[];
  questions: MeetingQuestion[];
  title: string;
  attendees: string;
  meetingDate: string;
  templateType: TemplateType;
}

function meetingLabel(t: TemplateType) {
  return t === "customer_handoff" ? "Customer Handoff" : "Weekly Planning";
}

function subjectTitle(title: string) {
  return title || "today's meeting";
}

function groupTasksByOwner(tasks: MeetingTask[]) {
  const groups: Record<string, MeetingTask[]> = {};
  for (const t of tasks) {
    const owner = t.owner || "Unassigned";
    if (!groups[owner]) groups[owner] = [];
    groups[owner].push(t);
  }
  return groups;
}

export function generateEmail(props: ShareProps): string {
  const { tasks, decisions, questions, title, attendees, meetingDate, templateType } = props;
  const label = meetingLabel(templateType);
  const subject = `${label} recap — ${subjectTitle(title)}`;
  const greeting = attendees ? `Hi ${attendees},` : "Hi team,";

  let body = `Subject: ${subject}\n\n${greeting}\n\nHere's a summary of what we agreed in today's ${label.toLowerCase()}.\n\n`;

  if (decisions.length > 0) {
    body += "DECISIONS\n";
    for (const d of decisions) {
      body += `- ${d.text}\n`;
    }
    body += "\n";
  }

  if (tasks.length > 0) {
    body += "ACTION ITEMS\n";
    const grouped = groupTasksByOwner(tasks);
    for (const [owner, ownerTasks] of Object.entries(grouped)) {
      for (const t of ownerTasks) {
        const due = t.due_date_text || t.due_date_display || "no date set";
        body += `${owner}: ${t.title} — due ${due}\n`;
      }
    }
    body += "\n";
  }

  if (questions.length > 0) {
    body += "THINGS TO CONFIRM\n";
    for (const q of questions) {
      body += `- ${q.question}${q.directed_to ? ` (directed to ${q.directed_to})` : ""}\n`;
    }
    body += "\n";
  }

  body += "Let me know if anything looks off.\n\n[Your name]";
  return body;
}

export function generateSlack(props: ShareProps): string {
  const { tasks, decisions, questions, title, templateType } = props;
  const label = meetingLabel(templateType);

  let msg = `*${label} recap — ${subjectTitle(title)}*\n\n`;

  if (decisions.length > 0) {
    msg += "*Decisions*\n";
    for (const d of decisions) {
      msg += `- ${d.text}\n`;
    }
    msg += "\n";
  }

  if (tasks.length > 0) {
    msg += "*Action items*\n";
    for (const t of tasks) {
      const due = t.due_date_text || t.due_date_display || "no date";
      msg += `- ${t.owner || "Unassigned"} → ${t.title} (${due})\n`;
    }
    msg += "\n";
  }

  if (questions.length > 0) {
    msg += "*To confirm*\n";
    for (const q of questions) {
      msg += `- ${q.question} → ${q.directed_to || "Unassigned"}\n`;
    }
    msg += "\n";
  }

  return msg.trimEnd();
}
