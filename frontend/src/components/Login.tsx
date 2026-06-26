import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Scale, Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { user, login, register } = useAuth();
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
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/40 flex items-center justify-center mb-3">
            <Scale className="w-7 h-7 text-gold" />
          </div>
          <h1 className="text-2xl font-bold">Mizan</h1>
          <p className="text-sm text-slate-500 mt-1">
            ميزان · le droit algérien, accessible
          </p>
        </div>

        <div className="card p-6">
          <div className="flex gap-2 mb-6 bg-slate-950/60 p-1 rounded-xl">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "login" ? "bg-slate-800 text-white" : "text-slate-400"
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "register" ? "bg-slate-800 text-white" : "text-slate-400"
              }`}
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <Field
                icon={UserIcon}
                placeholder="Nom complet"
                value={name}
                onChange={setName}
                type="text"
              />
            )}
            <Field
              icon={Mail}
              placeholder="Email"
              value={email}
              onChange={setEmail}
              type="email"
            />
            <Field
              icon={Lock}
              placeholder="Mot de passe"
              value={password}
              onChange={setPassword}
              type="password"
            />

            {error && <div className="text-rose-400 text-sm">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "login" ? (
                "Se connecter"
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Information juridique — ne remplace pas la consultation d'un avocat.
        </p>
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
