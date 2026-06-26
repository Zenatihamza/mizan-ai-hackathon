import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Scale,
  ScanLine,
  MapPin,
  Gamepad2,
  Home,
  MessageCircle,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../lib/auth";

const tabs = [
  { to: "/", label: "Accueil", icon: Home, exact: true },
  { to: "/chat", label: "Assistant", icon: MessageCircle },
  { to: "/scanner", label: "Scanner", icon: ScanLine },
  { to: "/gps", label: "Démarches", icon: MapPin },
  { to: "/rpg", label: "Apprendre", icon: Gamepad2 },
];

export default function Layout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
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
              <div className="font-bold tracking-tight">Mizan</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                ميزان · justice accessible
              </div>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </NavLink>
              );
            })}
          </nav>

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
                <div className="absolute right-0 mt-2 w-48 card p-1 z-20">
                  <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-800">
                    {user?.email}
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>

      <nav className="md:hidden sticky bottom-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur z-20">
        <div className="grid grid-cols-5">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.exact}
                className={`flex flex-col items-center gap-1 py-2 text-[10px] ${
                  active ? "text-gold" : "text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                {t.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
