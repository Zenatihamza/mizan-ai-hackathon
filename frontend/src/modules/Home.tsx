import { Link } from "react-router-dom";
import {
  MessageCircle,
  ScanLine,
  MapPin,
  Gamepad2,
  BookOpen,
  Siren,
  Languages,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";

export default function Home() {
  const { user } = useAuth();
  const { t } = useI18n();

  const modules = [
    { to: "/chat", icon: MessageCircle, accent: "text-sky-400", t: "home.assistant" },
    { to: "/scanner", icon: ScanLine, accent: "text-rose-400", t: "home.scanner" },
    { to: "/gps", icon: MapPin, accent: "text-emerald-400", t: "home.gps" },
    { to: "/rpg", icon: Gamepad2, accent: "text-violet-400", t: "home.rpg" },
    { to: "/booklet", icon: BookOpen, accent: "text-gold", t: "home.booklet" },
  ];

  return (
    <div className="space-y-10">
      <section className="text-center pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold mb-5">
          <Languages className="w-3.5 h-3.5" /> {t("home.badge")}
        </div>
        <h1 className="text-5xl md:text-6xl font-brand font-extrabold tracking-tight">
          {t("home.hello")} {user?.name?.split(" ")[0]},
          <br />
          <span className="text-gold">{t("home.question")}</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-slate-400 text-lg">{t("home.intro")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/chat" className="btn-primary">
            {t("home.ctaAsk")} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/scanner" className="btn-ghost">
            {t("home.ctaScan")}
          </Link>
        </div>
      </section>

      {/* Emergency — prominent, the urgent entry point */}
      <Link
        to="/emergency"
        className="block rounded-2xl border border-rose-500/40 bg-rose-500/5 p-6 hover:bg-rose-500/10 transition"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center shrink-0">
            <Siren className="w-6 h-6 text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-rose-200">{t("home.emergency.title")}</h3>
            <p className="text-sm text-slate-300">{t("home.emergency.sub")}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-rose-300 shrink-0" />
        </div>
      </Link>

      <section className="grid md:grid-cols-2 gap-5">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.to}
              to={m.to}
              className="group card p-6 hover:border-gold/40 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                <Icon className={`w-6 h-6 ${m.accent}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t(`${m.t}.title`)}</h3>
              <p className="text-sm text-slate-300 mb-5">{t(`${m.t}.sub`)}</p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-white group-hover:gap-3 transition-all">
                {t(`${m.t}.cta`)} <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
            ⚖️
          </div>
          <div>
            <h4 className="font-semibold mb-1">{t("home.sourced.title")}</h4>
            <p className="text-sm text-slate-400">
              {t("home.sourced.text")}{" "}
              <span className="text-slate-500">{t("common.disclaimer")}</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
