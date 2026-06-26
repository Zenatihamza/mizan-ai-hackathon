const BASE = "/api";
const TOKEN_KEY = "mizan_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function authedFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const r = await fetch(`${BASE}${path}`, { ...init, headers });
  if (r.status === 401) {
    clearToken();
    throw new Error("Session expirée — reconnecte-toi");
  }
  return r;
}

async function jsonFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const r = await authedFetch(path, { ...init, headers });
  if (!r.ok) {
    const detail = await r.json().catch(() => ({}));
    throw new Error(detail.detail || `Erreur ${r.status}`);
  }
  return r.json();
}

// ---------- Types ----------
export interface User {
  id: number;
  name: string;
  email: string;
}
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

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
  explanation_ar: string | null;
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
  title_ar: string | null;
  domain: string;
  story: string;
  story_ar: string | null;
  question: string;
  question_ar: string | null;
  choices: { id: string; label: string }[];
  total: number;
  index: number;
}
export interface AnswerResponse {
  correct: boolean;
  xp: number;
  feedback: string;
  feedback_ar: string | null;
  citation: string | null;
  lesson: string | null;
  lesson_ar: string | null;
}
export interface Level {
  name: string;
  name_ar: string;
  min_xp: number;
  emoji: string;
}
export interface Progress {
  xp: number;
  completed: string[];
}

export interface ChatCitation {
  code: string;
  article: string;
  excerpt: string;
}
export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  content_ar: string | null;
  citations: ChatCitation[];
}
export interface ConversationSummary {
  id: number;
  title: string;
}
export interface ConversationDetail {
  id: number;
  title: string;
  messages: ChatMessage[];
}
export interface SendMessageResponse {
  conversation_id: number;
  title: string;
  reply: ChatMessage;
}

// ---------- Auth ----------
export function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return jsonFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}
export function login(email: string, password: string): Promise<AuthResponse> {
  return jsonFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
export function me(): Promise<User> {
  return jsonFetch("/auth/me");
}

// ---------- Scanner ----------
export async function scanContract(file: File): Promise<ScanResult> {
  const form = new FormData();
  form.append("file", file);
  const r = await authedFetch("/scanner/analyze", { method: "POST", body: form });
  if (!r.ok) throw new Error(`Analyse échouée: ${r.status}`);
  return r.json();
}
export function getDemoScan(): Promise<ScanResult> {
  return jsonFetch("/scanner/demo");
}

// ---------- GPS ----------
export function searchProcedure(query: string): Promise<Procedure[]> {
  return jsonFetch("/gps/search", { method: "POST", body: JSON.stringify({ query }) });
}
export function listProcedures(): Promise<Procedure[]> {
  return jsonFetch("/gps/all");
}

// ---------- RPG ----------
export function listScenarios(): Promise<Scenario[]> {
  return jsonFetch("/rpg/scenarios");
}
export function answerScenario(scenario_id: string, choice_id: string): Promise<AnswerResponse> {
  return jsonFetch("/rpg/answer", {
    method: "POST",
    body: JSON.stringify({ scenario_id, choice_id }),
  });
}
export function getLevels(): Promise<Level[]> {
  return jsonFetch("/rpg/levels");
}
export function getProgress(): Promise<Progress> {
  return jsonFetch("/rpg/progress");
}
export function saveProgress(xp: number, completed: string[]): Promise<Progress> {
  return jsonFetch("/rpg/progress", {
    method: "POST",
    body: JSON.stringify({ xp, completed }),
  });
}

// ---------- Chat ----------
export function listConversations(): Promise<ConversationSummary[]> {
  return jsonFetch("/chat/conversations");
}
export function getConversation(id: number): Promise<ConversationDetail> {
  return jsonFetch(`/chat/conversations/${id}`);
}
export function deleteConversation(id: number): Promise<{ ok: boolean }> {
  return jsonFetch(`/chat/conversations/${id}`, { method: "DELETE" });
}
export function sendChatMessage(
  message: string,
  conversation_id?: number
): Promise<SendMessageResponse> {
  return jsonFetch("/chat/message", {
    method: "POST",
    body: JSON.stringify({ message, conversation_id: conversation_id ?? null }),
  });
}
