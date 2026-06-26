import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Volume2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import * as api from "../../lib/api";
import { speak, stopSpeaking } from "../../lib/voice";
import { useI18n } from "../../lib/i18n";

export default function RPG() {
  const { t } = useI18n();
  const [scenarios, setScenarios] = useState<api.Scenario[]>([]);
  const [levels, setLevels] = useState<api.Level[]>([]);
  const [idx, setIdx] = useState(0);
  const [xp, setXp] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<api.AnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      api.listScenarios(),
      api.getLevels(),
      api.getProgress().catch((): api.Progress => ({ xp: 0, completed: [] })),
    ])
      .then(([scn, lvls, prog]) => {
        setScenarios(scn);
        setLevels(lvls);
        setXp(prog.xp);
        setCompleted(prog.completed);
        const firstUnfinished = scn.findIndex((s) => !prog.completed.includes(s.id));
        setIdx(firstUnfinished === -1 ? scn.length : firstUnfinished);
      })
      .finally(() => setReady(true));
    return () => stopSpeaking();
  }, []);

  const scenario = scenarios[idx];
  const finished = ready && scenarios.length > 0 && idx >= scenarios.length;

  const currentLevel = useMemo(() => {
    if (!levels.length) return null;
    let lvl = levels[0];
    for (const l of levels) if (xp >= l.min_xp) lvl = l;
    return lvl;
  }, [xp, levels]);

  const nextLevel = useMemo(() => {
    if (!levels.length || !currentLevel) return null;
    const i = levels.findIndex((l) => l.name === currentLevel.name);
    return levels[i + 1] || null;
  }, [levels, currentLevel]);

  async function submit(choiceId: string) {
    if (!scenario || loading || feedback) return;
    setPicked(choiceId);
    setLoading(true);
    try {
      const r = await api.answerScenario(scenario.id, choiceId);
      setFeedback(r);
      const newXp = xp + r.xp;
      const newCompleted = Array.from(new Set([...completed, scenario.id]));
      setXp(newXp);
      setCompleted(newCompleted);
      api.saveProgress(newXp, newCompleted).catch(() => {});
      if (r.lesson_ar) setTimeout(() => speak(r.lesson_ar!, { rate: 0.9 }), 400);
    } finally {
      setLoading(false);
    }
  }

  function next() {
    stopSpeaking();
    setPicked(null);
    setFeedback(null);
    setIdx((i) => i + 1);
  }

  async function restart() {
    stopSpeaking();
    setXp(0);
    setCompleted([]);
    setIdx(0);
    setPicked(null);
    setFeedback(null);
    api.saveProgress(0, []).catch(() => {});
  }

  function narrate() {
    if (!scenario) return;
    const ar = [scenario.story_ar, scenario.question_ar].filter(Boolean).join(" ");
    speak(ar || `${scenario.story} ${scenario.question}`, { rate: 0.9 });
  }

  if (!ready) return <div className="text-slate-400">Chargement du simulateur…</div>;
  if (finished) return <FinalScreen xp={xp} level={currentLevel} onRestart={restart} />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-brand font-bold flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-gold" /> {t("rpg.title")}
          </h1>
          <p className="text-slate-400 mt-1">{t("rpg.subtitle")}</p>
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
            <span className="pill bg-slate-800 text-slate-300">Jour {scenario.day}</span>
            <span className="pill bg-violet-500/10 text-violet-300 border border-violet-500/30">
              {scenario.domain}
            </span>
            <span>{scenario.title}</span>
          </div>
          <button onClick={narrate} className="btn-ghost !px-3 !py-1.5 !text-xs" title="Écouter en arabe">
            <Volume2 className="w-3.5 h-3.5" /> Écouter en arabe
          </button>
        </div>

        <p className="text-lg leading-relaxed">{scenario.story}</p>
        {scenario.story_ar && (
          <p className="text-base leading-relaxed text-slate-400" dir="rtl">
            {scenario.story_ar}
          </p>
        )}
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
          <div className="space-y-3">
            <div
              className={`rounded-xl border p-4 space-y-1.5 ${
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
            </div>

            {feedback.lesson && (
              <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
                    <BookOpen className="w-3.5 h-3.5" /> Ce qu'il faut retenir
                  </div>
                  {feedback.lesson_ar && (
                    <button
                      onClick={() => speak(feedback.lesson_ar!, { rate: 0.9 })}
                      className="btn-ghost !px-2.5 !py-1 !text-xs"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Réécouter
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-100">{feedback.lesson}</p>
                {feedback.lesson_ar && (
                  <p className="text-sm text-slate-400 mt-2" dir="rtl">
                    {feedback.lesson_ar}
                  </p>
                )}
              </div>
            )}

            <button onClick={next} className="btn-primary">
              {idx + 1 < scenarios.length ? "Scénario suivant" : "Voir le bilan"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </article>

      <div className="text-center">
        <button onClick={restart} className="btn-ghost !text-xs">
          <RotateCcw className="w-3.5 h-3.5" /> Recommencer depuis le début
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
  currentLevel: api.Level | null;
  nextLevel: api.Level | null;
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
          Scénario {Math.min(scenarioIdx, total)}/{total}
        </span>
        <span className="font-semibold text-gold">{xp} XP</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-lg">{currentLevel?.emoji}</span>
        <div className="flex-1">
          <div className="text-sm font-semibold leading-none">{currentLevel?.name || "—"}</div>
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
  level: api.Level | null;
  onRestart: () => void;
}) {
  return (
    <div className="card p-10 text-center max-w-xl mx-auto">
      <Trophy className="w-14 h-14 mx-auto text-gold mb-4" />
      <h2 className="text-3xl font-bold">Bravo, parcours terminé</h2>
      <div className="mt-6 text-6xl">{level?.emoji}</div>
      <div className="text-xl font-semibold mt-2">{level?.name}</div>
      {level?.name_ar && (
        <div className="text-slate-400" dir="rtl">
          {level.name_ar}
        </div>
      )}
      <div className="text-slate-400 mt-1">{xp} XP totalisés</div>
      <p className="text-sm text-slate-400 mt-6">
        Tu connais maintenant tes droits sur le bail, le travail, la consommation,
        le prêt et le licenciement. Ta progression est enregistrée sur ton compte.
      </p>
      <button onClick={onRestart} className="btn-primary mt-6 mx-auto">
        <RotateCcw className="w-4 h-4" /> Rejouer
      </button>
    </div>
  );
}
