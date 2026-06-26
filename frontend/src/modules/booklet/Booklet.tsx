import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search, Scale } from "lucide-react";
import * as api from "../../lib/api";
import { useI18n } from "../../lib/i18n";

export default function Booklet() {
  const { lang, t } = useI18n();
  const [codes, setCodes] = useState<api.BookletCode[]>([]);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.getBooklet().then((c) => {
      setCodes(c);
      if (c[0]) setActiveCode(c[0].code);
    }).catch(() => {});
  }, []);

  const current = codes.find((c) => c.code === activeCode) || null;

  const filtered = useMemo(() => {
    if (!current) return [];
    const q = query.trim().toLowerCase();
    if (!q) return current.articles;
    return current.articles.filter(
      (a) =>
        a.article.toLowerCase().includes(q) ||
        a.text.toLowerCase().includes(q) ||
        a.topics.some((tp) => tp.toLowerCase().includes(q))
    );
  }, [current, query]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-brand font-bold flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-gold" />
          {lang === "ar" ? "كُتيّب القوانين" : "Livret des lois"}
        </h1>
        <p className="text-slate-400 mt-1">
          {lang === "ar"
            ? "تصفّح المواد القانونية الجزائرية وابحث فيها بكلّ بساطة."
            : "Parcours et recherche les articles du droit algérien, en clair."}
        </p>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        <aside className="space-y-2">
          {codes.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setActiveCode(c.code);
                setQuery("");
              }}
              className={`w-full text-start card p-4 hover:border-gold/40 transition ${
                activeCode === c.code ? "border-gold/60" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-gold shrink-0" />
                <span className="font-semibold leading-snug">{c.code}</span>
              </div>
              {c.code_ar && (
                <div className="text-xs text-slate-500 mt-1" dir="rtl">
                  {c.code_ar}
                </div>
              )}
              <div className="text-xs text-slate-500 mt-1">
                {c.article_count} {lang === "ar" ? "مادة" : "articles"}
              </div>
            </button>
          ))}
        </aside>

        <section className="space-y-4">
          {current && (
            <>
              <div className="card p-4">
                {current.reference && (
                  <div className="text-xs text-slate-500 mb-2">{current.reference}</div>
                )}
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-gold/50 transition">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={lang === "ar" ? "ابحث في المواد…" : "Rechercher un article…"}
                    className="bg-transparent outline-none flex-1 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filtered.map((a) => (
                  <article key={a.article} className="card p-5">
                    <div className="font-semibold text-gold mb-1">{a.article}</div>
                    <p className="text-sm text-slate-200 leading-relaxed">{a.text}</p>
                    {a.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {a.topics.map((tp, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400"
                          >
                            {tp}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
                {filtered.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-8">
                    {lang === "ar" ? "لا نتيجة." : "Aucun résultat."}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
