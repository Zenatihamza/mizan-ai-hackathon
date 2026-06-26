import { useEffect, useState } from "react";
import {
  Shield,
  Briefcase,
  Home,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Phone,
  ArrowLeft,
  Siren,
} from "lucide-react";
import * as api from "../../lib/api";
import { useI18n } from "../../lib/i18n";

const ICONS: Record<string, any> = {
  shield: Shield,
  briefcase: Briefcase,
  home: Home,
  alert: AlertTriangle,
};

export default function Emergency() {
  const { lang, t } = useI18n();
  const [data, setData] = useState<api.EmergencyData | null>(null);
  const [active, setActive] = useState<api.EmergencySituation | null>(null);

  useEffect(() => {
    api.getEmergencyData().then(setData).catch(() => {});
  }, []);

  const pick = (s: api.EmergencySituation) => (lang === "ar" ? s.label.ar : s.label.fr);

  if (!data) return <div className="text-slate-400">{t("common.loading")}</div>;

  if (active) {
    return <Guidance situation={active} lang={lang} onBack={() => setActive(null)} />;
  }

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center shrink-0">
          <Siren className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-brand font-bold text-rose-300">
            {lang === "ar" ? "وضع الطوارئ" : "Mode urgence"}
          </h1>
          <p className="text-slate-300 mt-1">
            {lang === "ar"
              ? "ماذا يحدث الآن؟ اختر وضعيتك لتحصل فوراً على حقوقك، ما يجب تجنّبه، والجهات التي تتصل بها."
              : "Que se passe-t-il maintenant ? Choisis ta situation pour avoir tout de suite tes droits, ce qu'il ne faut pas faire et qui contacter."}
          </p>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {data.situations.map((s) => {
          const Icon = ICONS[s.icon] || AlertTriangle;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className="card p-5 text-start flex items-center gap-4 hover:border-rose-500/50 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-gold" />
              </div>
              <div className="font-semibold text-lg">{pick(s)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Guidance({
  situation,
  lang,
  onBack,
}: {
  situation: api.EmergencySituation;
  lang: "fr" | "ar";
  onBack: () => void;
}) {
  const pick = (b: api.Bilingual) => (lang === "ar" ? b.ar : b.fr);
  const Icon = ICONS[situation.icon] || AlertTriangle;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="btn-ghost !py-1.5 !px-3 !text-sm">
          <ArrowLeft className="w-4 h-4" /> {lang === "ar" ? "رجوع" : "Retour"}
        </button>
      </div>

      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Icon className="w-6 h-6 text-gold" />
        </div>
        <h1 className="text-2xl font-brand font-bold">{pick(situation.label)}</h1>
      </header>

      <Section
        title={lang === "ar" ? "حقوقك" : "Tes droits"}
        icon={CheckCircle2}
        tone="emerald"
        items={situation.rights.map(pick)}
      />
      <Section
        title={lang === "ar" ? "ما يجب تجنّبه" : "À ne pas faire"}
        icon={XCircle}
        tone="rose"
        items={situation.donts.map(pick)}
      />
      <Section
        title={lang === "ar" ? "وثائق وأدلة" : "Documents / preuves à réunir"}
        icon={FileText}
        tone="amber"
        items={situation.documents.map(pick)}
      />

      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
          <MapPin className="w-4 h-4 text-gold" /> {lang === "ar" ? "أين تذهب" : "Où aller"}
        </div>
        <p className="text-sm text-slate-300">{pick(situation.where)}</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold mb-3">
          <Phone className="w-4 h-4 text-gold" /> {lang === "ar" ? "من تتصل به" : "Qui appeler"}
        </div>
        <div className="flex flex-wrap gap-2">
          {situation.authorities.map((a, i) => (
            <a
              key={i}
              href={a.phone && a.phone !== "—" ? `tel:${a.phone}` : undefined}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-gold/50 transition"
            >
              <span className="text-sm">{lang === "ar" ? a.name.ar : a.name.fr}</span>
              {a.phone && a.phone !== "—" && (
                <span className="text-gold font-bold">{a.phone}</span>
              )}
            </a>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-600">
        {lang === "ar"
          ? "معلومة عامة عاجلة — لا تغني عن استشارة محامٍ."
          : "Information d'urgence générale — ne remplace pas un avocat."}
      </p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string;
  icon: any;
  tone: "emerald" | "rose" | "amber";
  items: string[];
}) {
  const map = {
    emerald: "border-emerald-500/40 text-emerald-400",
    rose: "border-rose-500/40 text-rose-400",
    amber: "border-amber-500/40 text-amber-300",
  } as const;
  return (
    <div className={`card p-5 border-s-4 ${map[tone].split(" ")[0]}`}>
      <div className={`flex items-center gap-2 text-sm font-semibold mb-3 ${map[tone].split(" ")[1]}`}>
        <Icon className="w-4 h-4" /> {title}
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-slate-200 flex gap-2">
            <span className="text-slate-600">—</span> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
