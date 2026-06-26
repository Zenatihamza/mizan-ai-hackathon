import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Scale, Loader2, Mail, Lock, User as UserIcon, Languages } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";

export default function Login() {
  const { user, login, register } = useAuth();
  const { t, lang, toggle } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-gold/50 text-sm font-medium transition"
          >
            <Languages className="w-4 h-4 text-gold" />
            {lang === "fr" ? "العربية" : "Français"}
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/40 flex items-center justify-center mb-3">
            <Scale className="w-7 h-7 text-gold" />
          </div>
          <h1 className="text-3xl font-brand font-bold">
            Justic<span className="text-gold">IA</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t("login.subtitle")}</p>
        </div>

        <div className="card p-6">
          <div className="flex gap-2 mb-6 bg-slate-950/60 p-1 rounded-xl">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "login" ? "bg-slate-800 text-white" : "text-slate-400"
              }`}
            >
              {t("login.tabLogin")}
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "register" ? "bg-slate-800 text-white" : "text-slate-400"
              }`}
            >
              {t("login.tabRegister")}
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <Field icon={UserIcon} placeholder={t("login.name")} value={name} onChange={setName} type="text" />
            )}
            <Field icon={Mail} placeholder={t("login.email")} value={email} onChange={setEmail} type="email" />
            <Field icon={Lock} placeholder={t("login.password")} value={password} onChange={setPassword} type="password" />

            {error && <div className="text-rose-400 text-sm">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "login" ? (
                t("login.doLogin")
              ) : (
                t("login.doRegister")
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">{t("common.disclaimer")}</p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type,
}: {
  icon: any;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-gold/50 transition">
      <Icon className="w-4 h-4 text-slate-500" />
      <input
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none flex-1 text-sm"
      />
    </div>
  );
}
