"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { Providers } from "../providers";

export function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const navigation = [
    { name: "Home", href: "/app" },
    { name: "My Profile", href: "/app/onboarding" },
    { name: "FanDAO", href: "/app/fandao" },
    { name: "Squad", href: "/app/squad" },
    { name: "Arena", href: "/app/battle/quick" },
    { name: "Markets", href: "/app/markets" },
    { name: "Leaderboard", href: "/app/leaderboard" },
    { name: "Scout", href: "/app/scout" },
    { name: "History", href: "/app/history" },
    { name: "World Cup", href: "/app/worldcup" },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-xl uppercase italic leading-none tracking-tight">
              Strike<span className="text-primary">Nation</span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">FC</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-sm font-mono text-xs uppercase tracking-widest transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-success hidden sm:inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
              X LAYER CONNECTED
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>🇳🇬 Nigeria FanDAO</span>
              <span>•</span>
              <span className="text-primary">Passport Verified</span>
              <span>•</span>
              <span>2,450 XP</span>
            </div>
            {isConnected ? (
              <button 
                onClick={() => disconnect()}
                className="font-mono text-[10px] uppercase tracking-widest border border-border px-3 py-1.5 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                {address?.slice(0,6)}...{address?.slice(-4)}
              </button>
            ) : (
              <button className="font-mono text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1.5 rounded-sm hover:opacity-90 transition-opacity">
                Connect Wallet
              </button>
            )}
            <div className="h-8 w-8 rounded-full bg-muted border border-border overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=adekunle" alt="Avatar" className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function WrappedDashboardLayout({ children }) {
  return (
    <Providers>
      <DashboardLayout>{children}</DashboardLayout>
    </Providers>
  );
}

