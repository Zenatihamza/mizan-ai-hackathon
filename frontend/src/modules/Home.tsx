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

const modules = [
  {
    to: "/chat",
    icon: MessageCircle,
    color: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
    iconColor: "text-sky-400",
    title: "Assistant juridique",
    sub: "Pose ta question en français ou en arabe, reçois tes droits et les démarches — avec l'historique de tes échanges.",
    cta: "Poser une question",
  },
  {
    to: "/scanner",
    icon: ScanLine,
    color: "from-rose-500/20 to-orange-500/10 border-rose-500/30",
    iconColor: "text-rose-400",
    title: "Scanner de contrats",
    sub: "Détecte les clauses abusives, illégales, et propose une réécriture équitable avec l'article de loi.",
    cta: "Scanner un document",
  },
  {
    to: "/gps",
    icon: MapPin,
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    iconColor: "text-emerald-400",
    title: "Mes démarches",
    sub: "Décris ton problème, reçois la procédure exacte : bureau, documents, délais et coût.",
    cta: "Trouver mon chemin",
  },
  {
    to: "/rpg",
    icon: Gamepad2,
    color: "from-violet-500/20 to-fuchsia-500/10 border-violet-500/30",
    iconColor: "text-violet-400",
    title: "Apprendre mes droits",
    sub: "Vis des situations réelles et apprends le droit algérien, expliqué à voix haute en arabe.",
    cta: "Commencer",
  },
];

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="space-y-12">
      <section className="text-center pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold mb-5">
          <Volume2 className="w-3.5 h-3.5" /> Expliqué en arabe — à voix haute
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Bonjour {user?.name?.split(" ")[0]},
          <br />
          <span className="bg-gradient-to-r from-gold to-amber-200 bg-clip-text text-transparent">
            que dit la loi ?
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-slate-400 text-lg">
          Mizan répond à tes questions juridiques, lit tes contrats, te guide vers
          la bonne démarche et t'apprend tes droits — en français et en arabe.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/chat" className="btn-primary">
            Poser une question <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/scanner" className="btn-ghost">
            Scanner un contrat
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
            <h4 className="font-semibold mb-1">Chaque réponse est sourcée</h4>
            <p className="text-sm text-slate-400">
              Mizan cite l'article de loi qui justifie chaque réponse, et t'oriente
              vers l'aide juridictionnelle en cas de doute.
              <span className="text-slate-500">
                {" "}
                Cette plateforme informe, elle ne remplace pas un avocat.
              </span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
