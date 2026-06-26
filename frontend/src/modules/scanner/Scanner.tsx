import { useState } from "react";
import {
  Upload,
  Loader2,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileWarning,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import { scanContract, getDemoScan, type ScanResult } from "../../lib/api";
import { speak } from "../../lib/voice";
import { useI18n } from "../../lib/i18n";

const verdictStyles: Record<string, { ring: string; bg: string; text: string; label: string }> = {
  red: { ring: "border-rose-500/60", bg: "bg-rose-500/10", text: "text-rose-400", label: "Abusif" },
  orange: { ring: "border-amber-500/60", bg: "bg-amber-500/10", text: "text-amber-300", label: "Risqué" },
  green: { ring: "border-emerald-500/60", bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Conforme" },
};

function scoreColor(s: number) {
  if (s >= 75) return "text-emerald-400";
  if (s >= 50) return "text-amber-300";
  return "text-rose-400";
}

export default function Scanner() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pick(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const r = await scanContract(file);
      setResult(r);
    } catch (e: any) {
      setError(e.message || "Échec de l'analyse");
    } finally {
      setLoading(false);
    }
  }

  async function runDemo() {
    setLoading(true);
    setError(null);
    setFile(null);
    setPreview(null);
    try {
      const r = await getDemoScan();
      setResult(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-brand font-bold">{t("scanner.title")}</h1>
          <p className="text-slate-400 mt-1">{t("scanner.subtitle")}</p>
        </div>
        <button onClick={runDemo} className="btn-ghost">
          <PlayCircle className="w-4 h-4" /> {t("scanner.runDemo")}
        </button>
      </header>

      {!result && (
        <div className="card p-8">
          <label className="block border-2 border-dashed border-slate-700 hover:border-gold/60 rounded-2xl p-12 text-center cursor-pointer transition">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
            />
            <Upload className="w-10 h-10 mx-auto mb-3 text-slate-500" />
            <div className="font-medium">
              {file ? file.name : "Dépose une photo ou clique pour choisir"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              JPG · PNG · PDF — analyse OCR en arabe et français
            </div>
          </label>
          {preview && (
            <div className="mt-6 flex flex-col md:flex-row gap-5 items-center">
              <img
                src={preview}
                alt="aperçu"
                className="max-h-64 rounded-xl border border-slate-800"
              />
              <button
                disabled={loading}
                onClick={analyze}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Analyser le contrat
                  </>
                )}
              </button>
            </div>
          )}
          {error && (
            <div className="mt-4 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
      )}

      {result && <ScanResultView result={result} onReset={() => setResult(null)} />}
    </div>
  );
}

function ScanResultView({
  result,
  onReset,
}: {
  result: ScanResult;
  onReset: () => void;
}) {
  const reds = result.clauses.filter((c) => c.verdict === "red").length;
  const oranges = result.clauses.filter((c) => c.verdict === "orange").length;
  const greens = result.clauses.filter((c) => c.verdict === "green").length;

  function speakSummary() {
    const reds = result.clauses.filter((c) => c.verdict === "red").length;
    const ar =
      `درجة شرعية العقد ${result.overall_score} من 100. ` +
      (reds > 0
        ? `انتبه: يحتوي هذا العقد على ${reds} بنود غير قانونية. لا توقّع قبل مراجعتها.`
        : "العقد متوازن بشكل عام، لكن اقرأ كل بند بعناية.");
    speak(ar, { rate: 0.9 });
  }

  return (
    <div className="space-y-6">
      <section className="card p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">
            Document détecté
          </div>
          <div className="text-2xl font-bold">{result.document_type}</div>
          <div className="text-slate-400 mt-2 max-w-xl">{result.summary}</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={`text-5xl font-extrabold ${scoreColor(result.overall_score)}`}>
              {result.overall_score}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">
              légitimité / 100
            </div>
          </div>
          <button onClick={speakSummary} className="btn-ghost" title="Écouter en darija">
            <Volume2 className="w-4 h-4" /> Darija
          </button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatPill label="Abusives" value={reds} color="rose" icon={AlertTriangle} />
        <StatPill label="Risquées" value={oranges} color="amber" icon={AlertCircle} />
        <StatPill label="Conformes" value={greens} color="emerald" icon={CheckCircle2} />
      </section>

      <section className="space-y-3">
        {result.clauses.map((c) => (
          <ClauseCard key={c.id} clause={c} />
        ))}
      </section>

      {(result.missing_clauses.length > 0 || result.authenticity_flags.length > 0) && (
        <section className="card p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-amber-400" /> Détection additionnelle
          </h3>
          {result.missing_clauses.length > 0 && (
            <div className="mb-3">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-1.5">
                Clauses manquantes
              </div>
              <ul className="text-sm space-y-1">
                {result.missing_clauses.map((m, i) => (
                  <li key={i} className="text-amber-300">— {m}</li>
                ))}
              </ul>
            </div>
          )}
          {result.authenticity_flags.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-1.5">
                Signes d'authenticité
              </div>
              <ul className="text-sm space-y-1">
                {result.authenticity_flags.map((f, i) => (
                  <li key={i} className="text-slate-400">— {f}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="card p-6">
        <h3 className="font-semibold mb-3">Prochaines étapes</h3>
        <ol className="space-y-2 text-sm">
          {result.next_steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 shrink-0 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="text-center">
        <button onClick={onReset} className="btn-ghost">
          Analyser un autre document
        </button>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: "rose" | "amber" | "emerald";
  icon: any;
}) {
  const map = {
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  } as const;
  return (
    <div className={`card border ${map[color]} p-4 flex items-center gap-3`}>
      <Icon className="w-5 h-5" />
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-xs uppercase tracking-widest text-slate-400 mt-1">
          {label}
        </div>
      </div>
    </div>
  );
}

function ClauseCard({ clause }: { clause: import("../../lib/api").ClauseAnalysis }) {
  const s = verdictStyles[clause.verdict];
  function speakClause() {
    speak(clause.explanation_ar || clause.explanation, { rate: 0.9 });
  }
  return (
    <div className={`card border ${s.ring} p-5`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`pill ${s.bg} ${s.text} border ${s.ring}`}>
              {s.label}
            </span>
            <span className="pill bg-slate-800 text-slate-400">
              Confiance {Math.round(clause.confidence * 100)}%
            </span>
          </div>
          <h4 className="font-semibold text-lg">{clause.title}</h4>
          <blockquote className="mt-2 text-sm text-slate-400 italic border-l-2 border-slate-700 pl-3">
            "{clause.text}"
          </blockquote>
          <p className="mt-3 text-sm text-slate-200">{clause.explanation}</p>

          {clause.citations.length > 0 && (
            <div className="mt-4 space-y-2">
              {clause.citations.map((cit, i) => (
                <div
                  key={i}
                  className="text-xs bg-slate-950/60 border border-slate-800 rounded-lg p-3"
                >
                  <div className="font-semibold text-gold mb-0.5">
                    {cit.code} · {cit.article}
                  </div>
                  <div className="text-slate-400">{cit.excerpt}</div>
                </div>
              ))}
            </div>
          )}

          {clause.fair_rewrite && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-widest text-emerald-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Réécriture équitable
              </div>
              <div className="text-sm bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-3">
                {clause.fair_rewrite}
              </div>
            </div>
          )}
        </div>
        <button onClick={speakClause} className="btn-ghost shrink-0" title="Écouter en darija">
          <Volume2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
