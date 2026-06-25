import { useEffect, useState } from "react";
import {
  Search,
  Loader2,
  MapPin,
  FileText,
  Clock,
  Wallet,
  ExternalLink,
  Volume2,
  Building2,
} from "lucide-react";
import {
  listProcedures,
  searchProcedure,
  type Procedure,
} from "../../lib/api";
import { speak } from "../../lib/voice";

const SUGGESTIONS = [
  "Mon propriétaire ne me rend pas la caution",
  "Mon patron refuse de payer les heures sup",
  "Le magasin refuse de me rembourser",
  "Je veux un avocat gratuit",
];

export default function GPS() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Procedure | null>(null);

  useEffect(() => {
    listProcedures().then(setResults).catch(() => {});
  }, []);

  async function run(q?: string) {
    const search = q ?? query;
    if (!search.trim()) return;
    setQuery(search);
    setLoading(true);
    try {
      const r = await searchProcedure(search);
      setResults(r);
      setSelected(r[0] || null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">GPS juridique</h1>
        <p className="text-slate-400 mt-1">
          Décris ton problème en français ou en darija. Mizan te dit exactement
          où aller, quels documents emporter et combien de temps ça prend.
        </p>
      </header>

      <div className="card p-5">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus-within:border-gold/50 transition">
          <Search className="w-5 h-5 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Ex: mon propriétaire garde ma caution…"
            className="bg-transparent outline-none flex-1 text-base"
          />
          <button
            onClick={() => run()}
            disabled={loading}
            className="btn-primary !py-2 !px-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Chercher"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => run(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">
        <aside className="space-y-2">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left card p-4 hover:border-gold/40 transition ${
                selected?.id === p.id ? "border-gold/60" : ""
              }`}
            >
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                {p.domain}
              </div>
              <div className="font-semibold leading-snug">{p.title}</div>
              {p.title_ar && (
                <div className="text-xs text-slate-500 mt-1" dir="rtl">
                  {p.title_ar}
                </div>
              )}
            </button>
          ))}
        </aside>

        {selected && <ProcedureDetail proc={selected} />}
      </div>
    </div>
  );
}

function ProcedureDetail({ proc }: { proc: Procedure }) {
  function listen() {
    const txt = `${proc.title}. ${proc.steps
      .map((s, i) => `Étape ${i + 1}: ${s.label}. ${s.detail}`)
      .join(". ")}`;
    speak(txt, { rate: 0.9 });
  }

  return (
    <article className="card p-6 space-y-5">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-1">
            {proc.domain}
          </div>
          <h2 className="text-2xl font-bold">{proc.title}</h2>
        </div>
        <button onClick={listen} className="btn-ghost">
          <Volume2 className="w-4 h-4" /> Écouter
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Meta icon={Building2} label="Où" value={proc.where} />
        <Meta icon={Clock} label="Délai" value={proc.delay} />
        <Meta icon={Wallet} label="Coût" value={proc.cost} />
        <Meta
          icon={FileText}
          label="Documents"
          value={`${proc.documents.length} requis`}
        />
      </div>

      <section>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gold" /> Étapes
        </h3>
        <ol className="space-y-3">
          {proc.steps.map((s) => (
            <li key={s.step} className="flex gap-3">
              <div className="w-7 h-7 shrink-0 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-sm">
                {s.step}
              </div>
              <div>
                <div className="font-semibold">{s.label}</div>
                <div className="text-sm text-slate-400">{s.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Documents à emporter</h3>
        <ul className="text-sm space-y-1.5">
          {proc.documents.map((d, i) => (
            <li key={i} className="flex items-center gap-2 text-slate-300">
              <FileText className="w-4 h-4 text-slate-500" /> {d}
            </li>
          ))}
        </ul>
      </section>

      {proc.legal_basis.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2">Base légale</h3>
          <div className="flex flex-wrap gap-2">
            {proc.legal_basis.map((b, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-md bg-gold/10 border border-gold/30 text-gold"
              >
                {b}
              </span>
            ))}
          </div>
        </section>
      )}

      {proc.official_url && (
        <a
          href={proc.official_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-light"
        >
          Service officiel <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </article>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-widest mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
