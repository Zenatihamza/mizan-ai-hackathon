import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Scale,
  ScanLine,
  MapPin,
  Gamepad2,
  Home,
  MessageCircle,
  BookOpen,
  Siren,
  LogOut,
  Languages,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";

const tabs = [
  { to: "/", key: "nav.home", icon: Home, exact: true },
  { to: "/chat", key: "nav.assistant", icon: MessageCircle },
  { to: "/scanner", key: "nav.scanner", icon: ScanLine },
  { to: "/gps", key: "nav.gps", icon: MapPin },
  { to: "/rpg", key: "nav.rpg", icon: Gamepad2 },
  { to: "/booklet", key: "nav.booklet", icon: BookOpen },
];

export default function Layout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { t, lang, toggle } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/40 flex items-center justify-center">
              <Scale className="w-5 h-5 text-gold" />
            </div>
            <div className="leading-tight">
              <div className="font-brand font-bold tracking-tight text-lg">
                Justic<span className="text-gold">IA</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                {t("brand.tagline")}
              </div>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" /> {t(tab.key)}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <NavLink
              to="/emergency"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition border ${
                  isActive
                    ? "bg-rose-500/20 border-rose-500/60 text-rose-200"
                    : "bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
                }`
              }
              title={t("nav.emergency")}
            >
              <Siren className="w-4 h-4" />
              <span className="hidden sm:block">{t("nav.emergency")}</span>
            </NavLink>
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-gold/50 text-sm font-medium transition"
              title="Changer de langue"
            >
              <Languages className="w-4 h-4 text-gold" />
              {lang === "fr" ? "العربية" : "Français"}
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 transition"
              >
                <div className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden sm:block text-sm max-w-[120px] truncate">
                  {user?.name}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute end-0 mt-2 w-48 card p-1 z-20">
                    <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-800 truncate">
                      {user?.email}
                    </div>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    >
                      <LogOut className="w-4 h-4" /> {t("common.logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>

      <nav className="md:hidden sticky bottom-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur z-20">
        <div className="grid grid-cols-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.exact}
                className={`flex flex-col items-center gap-1 py-2 text-[10px] ${
                  active ? "text-gold" : "text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                {t(tab.key)}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
