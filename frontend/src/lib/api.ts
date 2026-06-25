const BASE = "/api";

export interface Citation {
  code: string;
  article: string;
  excerpt: string;
}

export interface ClauseAnalysis {
  id: number;
  text: string;
  verdict: "green" | "orange" | "red";
  severity: number;
  title: string;
  explanation: string;
  citations: Citation[];
  fair_rewrite: string | null;
  confidence: number;
}

export interface ScanResult {
  document_type: string;
  overall_score: number;
  summary: string;
  raw_text: string;
  clauses: ClauseAnalysis[];
  missing_clauses: string[];
  authenticity_flags: string[];
  next_steps: string[];
}

export interface Procedure {
  id: string;
  title: string;
  title_ar: string | null;
  domain: string;
  steps: { step: number; label: string; detail: string }[];
  where: string;
  documents: string[];
  delay: string;
  cost: string;
  official_url: string | null;
  legal_basis: string[];
  match_score: number;
}

export interface Scenario {
  id: string;
  day: number;
  title: string;
  story: string;
  question: string;
  choices: { id: string; label: string }[];
  total: number;
  index: number;
}

export interface AnswerResponse {
  correct: boolean;
  xp: number;
  feedback: string;
  citation: string | null;
}

export interface Level {
  name: string;
  name_ar: string;
  min_xp: number;
  emoji: string;
}

export async function scanContract(file: File): Promise<ScanResult> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(`${BASE}/scanner/analyze`, { method: "POST", body: form });
  if (!r.ok) throw new Error(`Scanner failed: ${r.status}`);
  return r.json();
}

export async function getDemoScan(): Promise<ScanResult> {
  const r = await fetch(`${BASE}/scanner/demo`);
  if (!r.ok) throw new Error("Demo failed");
  return r.json();
}

export async function searchProcedure(query: string): Promise<Procedure[]> {
  const r = await fetch(`${BASE}/gps/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error("Search failed");
  return r.json();
}

export async function listProcedures(): Promise<Procedure[]> {
  const r = await fetch(`${BASE}/gps/all`);
  if (!r.ok) throw new Error("List failed");
  return r.json();
}

export async function listScenarios(): Promise<Scenario[]> {
  const r = await fetch(`${BASE}/rpg/scenarios`);
  if (!r.ok) throw new Error("Scenarios failed");
  return r.json();
}

export async function answerScenario(
  scenario_id: string,
  choice_id: string
): Promise<AnswerResponse> {
  const r = await fetch(`${BASE}/rpg/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_id, choice_id }),
  });
  if (!r.ok) throw new Error("Answer failed");
  return r.json();
}

export async function getLevels(): Promise<Level[]> {
  const r = await fetch(`${BASE}/rpg/levels`);
  if (!r.ok) throw new Error("Levels failed");
  return r.json();
}
