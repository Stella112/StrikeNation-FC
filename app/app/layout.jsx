"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { xLayer } from "@/lib/contracts";
import { Providers } from "../providers";

export function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { address, chainId, isConnected } = useAccount();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [walletError, setWalletError] = useState("");
  const isXLayer = chainId === xLayer.id;

  const navigation = [
    { name: "Overview", href: "/app", icon: "▦" },
    { name: "My Profile", href: "/app/onboarding", icon: "◉" },
    { name: "My Squad", href: "/app/squad", icon: "♟" },
    { name: "Play Match", href: "/app/battle/quick", icon: "⚔" },
    { name: "Leaderboard", href: "/app/leaderboard", icon: "♕" },
    { name: "Marketplace", href: "/app/scout", icon: "▤" },
    { name: "FanDAO", href: "/app/fandao", icon: "⚑" },
    { name: "Markets", href: "/app/markets", icon: "◈" },
    { name: "History", href: "/app/history", icon: "↺" },
    { name: "World Cup", href: "/app/worldcup", icon: "◎" },
  ];

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  async function connectWallet() {
    setWalletError("");
    try {
      const connector =
        connectors.find((item) => item.name.toLowerCase().includes("okx")) ||
        connectors.find((item) => item.name.toLowerCase().includes("injected")) ||
        connectors[0];

      if (!connector) {
        setWalletError("No wallet found. Unlock OKX Wallet, then refresh.");
        return;
      }

      await connectAsync({ connector, chainId: xLayer.id });
    } catch (error) {
      setWalletError(error?.shortMessage || error?.message || "Wallet connection was cancelled.");
    }
  }

  async function switchToXLayer() {
    setWalletError("");
    try {
      await switchChainAsync({ chainId: xLayer.id });
    } catch (error) {
      setWalletError(error?.shortMessage || error?.message || "Could not switch to X Layer.");
    }
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <aside className="w-[300px] flex-shrink-0 border-r border-border bg-card/80 flex-col hidden md:flex">
        <div className="h-[70px] flex items-center px-8 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-sm border border-primary/30 bg-primary/10 text-primary font-display italic">
              SN
            </span>
            <span className="font-display text-2xl uppercase italic leading-none tracking-tight">
              Strike<span className="text-primary">Nation</span>
            </span>
            <span className="rounded-sm border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Dashboard</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-5 px-5 space-y-2">
          <div className="px-2 pb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Menu</div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-sm font-mono text-xs uppercase tracking-[0.22em] transition-colors border ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:bg-muted hover:text-foreground hover:border-border"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="m-5 border border-border bg-background p-5">
          <div className="font-display text-2xl uppercase italic">Season <span className="text-primary">01</span></div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Group stage / day 4</div>
          <div className="mt-4 h-2 overflow-hidden bg-muted">
            <div className="h-full w-[42%] bg-primary"></div>
          </div>
          <Link href="/app/onboarding" className="mt-4 block text-right font-mono text-[9px] uppercase tracking-widest text-muted-foreground hover:text-primary">
            View profile -&gt;
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[70px] flex-shrink-0 border-b border-border bg-background/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-10">
          <div className="flex items-center gap-4">
            <span
              className={`font-mono text-[10px] uppercase tracking-widest hidden sm:inline-flex items-center gap-1.5 ${
                isConnected && isXLayer ? "text-success" : "text-muted-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isConnected && isXLayer ? "bg-success animate-pulse" : "bg-muted-foreground"
                }`}
              ></span>
              {isConnected ? (isXLayer ? "X Layer Connected" : "Wrong Network") : "Wallet Not Connected"}
            </span>
            {walletError && <span className="hidden lg:inline text-[10px] font-mono uppercase tracking-widest text-destructive">{walletError}</span>}
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="border border-border bg-card px-3 py-2 text-foreground">NG Nigeria DAO</span>
              <span className={isConnected ? "text-primary" : "text-muted-foreground"}>{isConnected ? "Wallet Verified" : "Connect Wallet"}</span>
              <span>/</span>
              <span>2,450 XP</span>
            </div>

            {isConnected ? (
              <div className="flex items-center gap-2">
                {!isXLayer && (
                  <button
                    onClick={switchToXLayer}
                    disabled={isSwitching}
                    className="font-mono text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1.5 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {isSwitching ? "Switching..." : "Switch X Layer"}
                  </button>
                )}
                <button
                  onClick={() => disconnect()}
                  className="font-mono text-[10px] uppercase tracking-widest border border-border bg-card px-4 py-2 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  title="Disconnect wallet"
                >
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="font-mono text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-5 py-3 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            <div className="h-9 w-9 rounded-full bg-muted border border-border overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=adekunle" alt="Avatar" className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
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
