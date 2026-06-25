import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Volume2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  answerScenario,
  getLevels,
  listScenarios,
  type AnswerResponse,
  type Level,
  type Scenario,
} from "../../lib/api";
import { speak } from "../../lib/voice";

const XP_KEY = "mizan_rpg_xp";
const IDX_KEY = "mizan_rpg_idx";

export default function RPG() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [idx, setIdx] = useState<number>(() =>
    Number(localStorage.getItem(IDX_KEY) || 0)
  );
  const [xp, setXp] = useState<number>(() =>
    Number(localStorage.getItem(XP_KEY) || 0)
  );
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listScenarios().then(setScenarios).catch(() => {});
    getLevels().then(setLevels).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(XP_KEY, String(xp));
  }, [xp]);
  useEffect(() => {
    localStorage.setItem(IDX_KEY, String(idx));
  }, [idx]);

  const scenario = scenarios[idx];
  const finished = scenarios.length > 0 && idx >= scenarios.length;

  const currentLevel = useMemo(() => {
    if (!levels.length) return null;
    let lvl = levels[0];
    for (const l of levels) if (xp >= l.min_xp) lvl = l;
    return lvl;
  }, [xp, levels]);

  const nextLevel = useMemo(() => {
    if (!levels.length || !currentLevel) return null;
    const idxL = levels.findIndex((l) => l.name === currentLevel.name);
    return levels[idxL + 1] || null;
  }, [levels, currentLevel]);

  async function submit(choiceId: string) {
    if (!scenario || loading || feedback) return;
    setPicked(choiceId);
    setLoading(true);
    try {
      const r = await answerScenario(scenario.id, choiceId);
      setFeedback(r);
      setXp((v) => v + r.xp);
    } finally {
      setLoading(false);
    }
  }

  function next() {
    setPicked(null);
    setFeedback(null);
    setIdx((i) => i + 1);
  }

  function restart() {
    setXp(0);
    setIdx(0);
    setPicked(null);
    setFeedback(null);
  }

  if (!scenarios.length) {
    return <div className="text-slate-400">Chargement du simulateur…</div>;
  }

  if (finished) {
    return <FinalScreen xp={xp} level={currentLevel} onRestart={restart} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Simulateur de vie juridique</h1>
          <p className="text-slate-400 mt-1">
            Vis des situations réelles. Chaque bonne décision te rapporte de l'XP
            et un vrai apprentissage du droit algérien.
          </p>
        </div>
        <XPHeader
          xp={xp}
          currentLevel={currentLevel}
          nextLevel={nextLevel}
          scenarioIdx={idx + 1}
          total={scenarios.length}
        />
      </header>

      <article className="card p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
          <span>
            Jour {scenario.day} · {scenario.title}
          </span>
          <button
            onClick={() =>
              speak(`${scenario.story}. ${scenario.question}`, { rate: 0.9 })
            }
            className="btn-ghost !px-3 !py-1.5 !text-xs"
          >
            <Volume2 className="w-3.5 h-3.5" /> Darija
          </button>
        </div>
        <p className="text-lg leading-relaxed">{scenario.story}</p>
        <p className="font-semibold text-gold">{scenario.question}</p>

        <div className="space-y-3">
          {scenario.choices.map((c) => {
            const isPicked = picked === c.id;
            const showResult = feedback && isPicked;
            return (
              <button
                key={c.id}
                disabled={!!feedback || loading}
                onClick={() => submit(c.id)}
                className={`w-full text-left p-4 rounded-xl border transition ${
                  showResult
                    ? feedback!.correct
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : "border-rose-500/60 bg-rose-500/10"
                    : "border-slate-800 bg-slate-900/60 hover:border-gold/40 hover:bg-slate-800/60"
                } disabled:cursor-default`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${
                      showResult
                        ? feedback!.correct
                          ? "border-emerald-400 text-emerald-400"
                          : "border-rose-400 text-rose-400"
                        : "border-slate-600 text-slate-400"
                    }`}
                  >
                    {c.id}
                  </div>
                  <span className="flex-1">{c.label}</span>
                  {showResult &&
                    (feedback!.correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    ))}
                </div>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div
            className={`rounded-xl border p-4 space-y-2 ${
              feedback.correct
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-amber-500/40 bg-amber-500/5"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {feedback.correct ? (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" /> +{feedback.xp} XP
                </>
              ) : (
                <>Apprentissage · +{feedback.xp} XP</>
              )}
            </div>
            <p className="text-sm text-slate-200">{feedback.feedback}</p>
            {feedback.citation && (
              <div className="text-xs text-gold">📖 {feedback.citation}</div>
            )}
            <button onClick={next} className="btn-primary mt-2">
              {idx + 1 < scenarios.length ? "Scénario suivant" : "Voir le bilan"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </article>

      <div className="text-center">
        <button onClick={restart} className="btn-ghost !text-xs">
          <RotateCcw className="w-3.5 h-3.5" /> Recommencer
        </button>
      </div>
    </div>
  );
}

function XPHeader({
  xp,
  currentLevel,
  nextLevel,
  scenarioIdx,
  total,
}: {
  xp: number;
  currentLevel: Level | null;
  nextLevel: Level | null;
  scenarioIdx: number;
  total: number;
}) {
  const pct = nextLevel
    ? Math.min(
        100,
        Math.round(
          ((xp - (currentLevel?.min_xp ?? 0)) /
            (nextLevel.min_xp - (currentLevel?.min_xp ?? 0))) *
            100
        )
      )
    : 100;
  return (
    <div className="card px-4 py-3 min-w-[260px]">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Scénario {scenarioIdx}/{total}
        </span>
        <span className="font-semibold text-gold">{xp} XP</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-lg">{currentLevel?.emoji}</span>
        <div className="flex-1">
          <div className="text-sm font-semibold leading-none">
            {currentLevel?.name || "—"}
          </div>
          <div className="h-1.5 mt-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-amber-200 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      {nextLevel && (
        <div className="text-[10px] text-slate-500 mt-1">
          Prochain niveau : {nextLevel.name} ({nextLevel.min_xp} XP)
        </div>
      )}
    </div>
  );
}

function FinalScreen({
  xp,
  level,
  onRestart,
}: {
  xp: number;
  level: Level | null;
  onRestart: () => void;
}) {
  return (
    <div className="card p-10 text-center max-w-xl mx-auto">
      <Trophy className="w-14 h-14 mx-auto text-gold mb-4" />
      <h2 className="text-3xl font-bold">Bilan</h2>
      <div className="mt-6 text-6xl">{level?.emoji}</div>
      <div className="text-xl font-semibold mt-2">{level?.name}</div>
      <div className="text-slate-400 mt-1">{xp} XP totalisés</div>
      <p className="text-sm text-slate-400 mt-6">
        Tu connais maintenant tes droits sur le bail, le travail, la consommation
        et le licenciement. Partage ce jeu — chaque citoyen informé est un piège
        évité.
      </p>
      <button onClick={onRestart} className="btn-primary mt-6">
        <RotateCcw className="w-4 h-4" /> Rejouer
      </button>
    </div>
  );
}
