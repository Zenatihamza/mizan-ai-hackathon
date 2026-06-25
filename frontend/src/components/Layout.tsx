import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Scale, ScanLine, MapPin, Gamepad2, Home } from "lucide-react";

const tabs = [
  { to: "/", label: "Accueil", icon: Home, exact: true },
  { to: "/scanner", label: "Scanner", icon: ScanLine },
  { to: "/gps", label: "GPS Juridique", icon: MapPin },
  { to: "/rpg", label: "Simulateur", icon: Gamepad2 },
];

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/40 flex items-center justify-center">
              <Scale className="w-5 h-5 text-gold" />
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">Mizan AI</div>
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
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
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
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>

      <nav className="md:hidden sticky bottom-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active =
              t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.exact}
                className={`flex flex-col items-center gap-1 py-2 text-xs ${
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

      <footer className="hidden md:block border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        Mizan AI · Hackathon Nous · une couche de compréhension juridique pour
        l'Algérie
      </footer>
    </div>
  );
}
