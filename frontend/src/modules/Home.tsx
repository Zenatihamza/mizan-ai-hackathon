import { Link } from "react-router-dom";
import { ScanLine, MapPin, Gamepad2, Volume2, ArrowRight } from "lucide-react";

const modules = [
  {
    to: "/scanner",
    icon: ScanLine,
    color: "from-rose-500/20 to-orange-500/10 border-rose-500/30",
    iconColor: "text-rose-400",
    title: "Scanner de contrats",
    sub: "Détecte les clauses abusives, illégales et propose une réécriture équitable.",
    cta: "Scanner un document",
  },
  {
    to: "/gps",
    icon: MapPin,
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    iconColor: "text-emerald-400",
    title: "GPS juridique",
    sub: "Décris ton problème, reçois la procédure exacte : bureau, documents, délais.",
    cta: "Trouver mon chemin",
  },
  {
    to: "/rpg",
    icon: Gamepad2,
    color: "from-violet-500/20 to-fuchsia-500/10 border-violet-500/30",
    iconColor: "text-violet-400",
    title: "Simulateur de vie juridique",
    sub: "Apprends tes droits en vivant des situations réelles. Gagne de l'XP.",
    cta: "Commencer le jeu",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold mb-5">
          <Volume2 className="w-3.5 h-3.5" /> Disponible en darija — voix incluse
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Le droit algérien,
          <br />
          <span className="bg-gradient-to-r from-gold to-amber-200 bg-clip-text text-transparent">
            enfin lisible.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-slate-400 text-lg">
          Mizan AI lit tes contrats, te guide vers la bonne procédure et
          t'apprend tes droits — en français, en arabe et en darija.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/scanner" className="btn-primary">
            Scanner un contrat <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/gps" className="btn-ghost">
            Explorer les procédures
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-5">
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
            <h4 className="font-semibold mb-1">IA responsable, droit ancré</h4>
            <p className="text-sm text-slate-400">
              Chaque réponse cite l'article de loi qui la justifie. Quand l'IA
              n'est pas certaine, elle te renvoie vers l'aide juridictionnelle.
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
