import { Link } from "react-router-dom";
import {
  MessageCircle,
  ScanLine,
  MapPin,
  Gamepad2,
  Volume2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";

export default function Home() {
  const { user } = useAuth();
  const { t } = useI18n();

  const modules = [
    {
      to: "/chat",
      icon: MessageCircle,
      color: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
      iconColor: "text-sky-400",
      title: t("home.assistant.title"),
      sub: t("home.assistant.sub"),
      cta: t("home.assistant.cta"),
    },
    {
      to: "/scanner",
      icon: ScanLine,
      color: "from-rose-500/20 to-orange-500/10 border-rose-500/30",
      iconColor: "text-rose-400",
      title: t("home.scanner.title"),
      sub: t("home.scanner.sub"),
      cta: t("home.scanner.cta"),
    },
    {
      to: "/gps",
      icon: MapPin,
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
      iconColor: "text-emerald-400",
      title: t("home.gps.title"),
      sub: t("home.gps.sub"),
      cta: t("home.gps.cta"),
    },
    {
      to: "/rpg",
      icon: Gamepad2,
      color: "from-violet-500/20 to-fuchsia-500/10 border-violet-500/30",
      iconColor: "text-violet-400",
      title: t("home.rpg.title"),
      sub: t("home.rpg.sub"),
      cta: t("home.rpg.cta"),
    },
  ];

  return (
    <div className="space-y-12">
      <section className="text-center pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold mb-5">
          <Volume2 className="w-3.5 h-3.5" /> {t("home.badge")}
        </div>
        <h1 className="text-5xl md:text-6xl font-brand font-extrabold tracking-tight">
          {t("home.hello")} {user?.name?.split(" ")[0]},
          <br />
          <span className="bg-gradient-to-r from-gold to-copper-light bg-clip-text text-transparent">
            {t("home.question")}
          </span>
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

      <section className="grid md:grid-cols-2 gap-5">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.to}
              to={m.to}
              className={`group card p-6 border bg-gradient-to-br ${m.color} hover:-translate-y-1 transition`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-950/40 border border-slate-700 flex items-center justify-center mb-4">
                <Icon className={`w-6 h-6 ${m.iconColor}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{m.title}</h3>
              <p className="text-sm text-slate-300 mb-5">{m.sub}</p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-white group-hover:gap-3 transition-all">
                {m.cta} <ArrowRight className="w-4 h-4" />
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
