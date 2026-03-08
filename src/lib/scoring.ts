export interface ScoreResult {
  task_recall: number;
  task_precision: number;
  task_hallucinations: number;
  decision_recall: number;
  decision_precision: number;
  confirm_recall: number;
  confirm_precision: number;
  overall_score: number;
  matched_tasks: string[];
  missed_tasks: string[];
  hallucinated_tasks: string[];
  matched_decisions: string[];
  missed_decisions: string[];
  matched_confirms: string[];
  missed_confirms: string[];
}

const STOP_WORDS = new Set(["the", "a", "and", "to", "in", "of", "is", "it", "we", "for", "that", "this", "on", "with", "be", "as", "at", "by", "an", "or", "not", "are", "was", "has", "have", "do", "does"]);

const VERB_SYNONYMS: Record<string, string> = {
  "deliver": "implement",
  "complete": "implement",
  "finish": "implement",
  "create": "build",
  "develop": "implement",
  "ship": "build",
  "produce": "build",
  "write": "draft",
  "draft": "write",
  "add": "implement",
  "setup": "configure",
  "set": "configure",
  "deploy": "build",
  "release": "build",
  "launch": "build",
  "fix": "resolve",
  "resolve": "fix",
  "investigate": "fix",
};

function normalizeWord(w: string): string {
  return VERB_SYNONYMS[w] || w;
}

function stem(word: string): string {
  if (word.endsWith("ing") && word.length > 4) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 3) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

function tokenize(text: string, applyStemming = false): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w && !STOP_WORDS.has(w));
  return applyStemming ? words.map(stem).map(normalizeWord) : words.map(normalizeWord);
}

function wordContainment(shorter: string[], longer: string[]): number {
  if (shorter.length === 0) return 0;
  const longerSet = new Set(longer);
  const matched = shorter.filter(w => longerSet.has(w)).length;
  return matched / shorter.length;
}

function similarity(a: string, b: string, useStemming = false): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 1;

  const tokensA = tokenize(a, useStemming);
  const tokensB = tokenize(b, useStemming);
  if (tokensA.length === 0 && tokensB.length === 0) return 1;
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  // 80%+ word containment check
  const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  if (wordContainment(shorter, longer) >= 0.8) return 1;

  const setB = new Set(tokensB);
  const shared = tokensA.filter(t => setB.has(t)).length;
  const total = Math.max(tokensA.length, tokensB.length);
  return shared / total;
}

const MATCH_THRESHOLD = 0.5;

function detailsMatchTitle(details: string[] | undefined, title: string): boolean {
  if (!details || details.length === 0) return false;
  const combined = details.join(" ");
  return similarity(combined, title) >= MATCH_THRESHOLD;
}

function matchItems(
  expected: string[],
  actual: string[],
  useStemming = false,
  actualDetails?: (string[] | undefined)[]
): { matched: string[]; missed: string[]; hallucinated: string[] } {
  const usedActual = new Set<number>();
  const matched: string[] = [];
  const missed: string[] = [];

  for (const exp of expected) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < actual.length; i++) {
      if (usedActual.has(i)) continue;
      let s = similarity(exp, actual[i], useStemming);
      if (s < MATCH_THRESHOLD && actualDetails?.[i]) {
        const detailScore = detailsMatchTitle(actualDetails[i], exp);
        if (detailScore) s = MATCH_THRESHOLD;
      }
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }
    if (bestScore >= MATCH_THRESHOLD && bestIdx >= 0) {
      matched.push(exp);
      usedActual.add(bestIdx);
    } else {
      missed.push(exp);
    }
  }

  const hallucinated = actual.filter((_, i) => !usedActual.has(i));
  return { matched, missed, hallucinated };
}

export function scoreRun(
  expected: { tasks: { title: string; details?: string[] }[]; decisions: { decision: string }[]; things_to_confirm: { question: string }[] },
  actual: { tasks: { title: string; details?: string[] }[]; decisions: { decision: string }[]; open_questions: { question: string }[] }
): ScoreResult {
  const taskResult = matchItems(
    expected.tasks.map(t => t.title),
    actual.tasks.map(t => t.title),
    false,
    actual.tasks.map(t => t.details)
  );
  const decisionResult = matchItems(
    expected.decisions.map(d => d.decision),
    actual.decisions.map(d => d.decision),
    true
  );
  const confirmResult = matchItems(
    expected.things_to_confirm.map(c => c.question),
    actual.open_questions.map(q => q.question),
    true,
    undefined
  );

  const taskRecall = expected.tasks.length > 0 ? taskResult.matched.length / expected.tasks.length : 1;
  const taskPrecision = actual.tasks.length > 0 ? taskResult.matched.length / actual.tasks.length : 1;
  const decisionRecall = expected.decisions.length > 0 ? decisionResult.matched.length / expected.decisions.length : 1;
  const decisionPrecision = actual.decisions.length > 0 ? decisionResult.matched.length / actual.decisions.length : 1;
  const confirmRecall = expected.things_to_confirm.length > 0 ? confirmResult.matched.length / expected.things_to_confirm.length : 1;
  const confirmPrecision = actual.open_questions.length > 0 ? confirmResult.matched.length / actual.open_questions.length : 1;

  const taskScore = (taskRecall + taskPrecision) / 2;
  const decisionScore = (decisionRecall + decisionPrecision) / 2;
  const confirmScore = (confirmRecall + confirmPrecision) / 2;
  const overall = taskScore * 0.5 + decisionScore * 0.3 + confirmScore * 0.2;

  return {
    task_recall: taskRecall,
    task_precision: taskPrecision,
    task_hallucinations: taskResult.hallucinated.length,
    decision_recall: decisionRecall,
    decision_precision: decisionPrecision,
    confirm_recall: confirmRecall,
    confirm_precision: confirmPrecision,
    overall_score: overall,
    matched_tasks: taskResult.matched,
    missed_tasks: taskResult.missed,
    hallucinated_tasks: taskResult.hallucinated,
    matched_decisions: decisionResult.matched,
    missed_decisions: decisionResult.missed,
    matched_confirms: confirmResult.matched,
    missed_confirms: confirmResult.missed,
  };
}

export function formatScore(score: number): string {
  const pct = Math.round(score * 100);
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  return "F";
}
