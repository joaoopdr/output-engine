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

const FILLER_WORDS = new Set(["hamburger"]);

const STOP_WORDS = new Set(["the", "a", "and", "to", "in", "of", "is", "it", "we", "for", "that", "this", "on", "with", "be", "as", "at", "by", "an", "or", "not", "are", "was", "has", "have", "do", "does"]);

const ABBREVIATIONS: Record<string, string> = {
  "navigation": "nav",
};

const VERB_SYNONYMS: Record<string, string> = {
  "deliver": "build",
  "complete": "implement",
  "finish": "implement",
  "create": "build",
  "develop": "implement",
  "ship": "build",
  "produce": "build",
  "write": "draft",
  "draft": "draft",
  "add": "implement",
  "setup": "configure",
  "set": "configure",
  "deploy": "build",
  "release": "build",
  "launch": "build",
  "fix": "resolve",
  "resolve": "resolve",
  "investigate": "resolve",
  "implement": "resolve",
};

function normalizeWord(w: string): string {
  if (FILLER_WORDS.has(w)) return "";
  const abbr = ABBREVIATIONS[w] || w;
  return VERB_SYNONYMS[abbr] || abbr;
}

function depluralize(word: string): string {
  if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function stem(word: string): string {
  if (word.endsWith("ing") && word.length > 4) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 3) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

function tokenize(text: string, applyStemming = false): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w && !STOP_WORDS.has(w));
  const processed = words
    .map(depluralize)
    .map(w => applyStemming ? stem(w) : w)
    .map(normalizeWord)
    .filter(w => w.length > 0);
  return processed;
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

  // F1 score per category
  const taskF1 = (taskRecall + taskPrecision) > 0
    ? (2 * taskRecall * taskPrecision) / (taskRecall + taskPrecision)
    : 1.0; // if no expected AND no actual = perfect

  // Decision F1
  const decisionF1 = (decisionRecall + decisionPrecision) > 0
    ? (2 * decisionRecall * decisionPrecision) / (decisionRecall + decisionPrecision)
    : 1.0;

  // Confirm F1
  const confirmF1 = (confirmRecall + confirmPrecision) > 0
    ? (2 * confirmRecall * confirmPrecision) / (confirmRecall + confirmPrecision)
    : 1.0;

  // Weighted overall — hallucinations NEVER affect this number
  const overall = (taskF1 * 0.5) + (decisionF1 * 0.3) + (confirmF1 * 0.2);
  // DO NOT modify overall_score after this point — hallucinations are display-only.

  // Scoring sanity check
  if (import.meta.env.DEV) {
    console.log('[scorer] F1s:', taskF1, decisionF1, confirmF1, '→', overall);
  }

  // INVARIANT: scoreCase({task_recall:1,task_precision:1,decision_recall:1,
  // decision_precision:1,confirm_recall:1,confirm_precision:1,hallucinations:0})
  // must return overall_score=1.0 and grade="A"
  if (taskRecall === 1 && taskPrecision === 1 && decisionRecall === 1 &&
      decisionPrecision === 1 && confirmRecall === 1 && confirmPrecision === 1 &&
      taskResult.hallucinated.length === 0 && overall !== 1.0) {
    console.error("SCORING INVARIANT VIOLATED: perfect inputs produced overall_score=" + overall + " instead of 1.0");
  }

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
  if (score >= 0.90) return "A";
  if (score >= 0.80) return "B";
  if (score >= 0.70) return "C";
  return "F";
}
