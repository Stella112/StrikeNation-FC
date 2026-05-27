import Link from "next/link";

export default function ArenaDashboard() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Hero Card */}
      <section className="bg-card border border-border p-6 rounded-sm flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Welcome back, Adekunle</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Nigeria FanDAO | Rank #3 | Squad Level 2
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/app/battle/quick" className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 rounded-sm hover:opacity-90">
            Quick Battle
          </Link>
          <Link href="/app/battle/pvp" className="bg-secondary text-secondary-foreground font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 rounded-sm hover:opacity-90">
            Challenge Player
          </Link>
          <Link href="/app/squad" className="border border-border bg-background font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 rounded-sm hover:bg-muted hover:text-foreground">
            View Squad
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* A. My Squad Panel */}
          <section className="bg-card border border-border p-6 rounded-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl uppercase italic">My Squad</h2>
              <Link href="/app/squad" className="font-mono text-[9px] uppercase tracking-widest underline text-muted-foreground hover:text-primary">Manage Squad →</Link>
            </div>
            <div className="relative aspect-[16/9] md:aspect-[2/1] bg-pitch/10 border border-pitch/30 rounded-sm overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col justify-around py-4 opacity-80 pointer-events-none">
                <div className="flex justify-center gap-16"><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div></div>
                <div className="flex justify-center gap-24"><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div></div>
                <div className="flex justify-center gap-12"><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div></div>
                <div className="flex justify-center gap-6"><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div><div className="size-6 rounded-full bg-primary ring-2 ring-background"></div></div>
              </div>
              <div className="z-10 text-center font-mono text-[10px] uppercase tracking-widest bg-background/80 px-4 py-2 border border-border backdrop-blur-sm">
                4-3-3 Attack Formation Active
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="text-xs font-mono uppercase tracking-widest bg-muted p-2 border border-border">ST — Naija Finisher — 92 OVR</div>
              <div className="text-xs font-mono uppercase tracking-widest bg-muted p-2 border border-border">GK — Wall Keeper — 87 OVR</div>
              <div className="text-xs font-mono uppercase tracking-widest bg-muted p-2 border border-border">CAM — Data Captain — 90 OVR</div>
            </div>
          </section>

          {/* B. Arena Panel */}
          <section className="bg-card border border-border p-6 rounded-sm">
            <h2 className="font-display text-2xl uppercase italic mb-6">Battle Arena</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-border p-5 flex flex-col justify-between bg-background hover:border-primary transition-colors group">
                <div>
                  <h3 className="font-display text-xl uppercase italic mb-2">Quick Battle</h3>
                  <p className="text-xs text-muted-foreground mb-4">Battle an AI squad instantly. Good for solo demo, quick gameplay, no waiting, practice + earning points.</p>
                </div>
                <Link href="/app/battle/quick" className="bg-primary text-primary-foreground font-mono text-[9px] uppercase tracking-widest font-bold px-4 py-2 text-center rounded-sm group-hover:opacity-90">Start Quick Battle</Link>
              </div>
              <div className="border border-border p-5 flex flex-col justify-between bg-background hover:border-secondary transition-colors group">
                <div>
                  <h3 className="font-display text-xl uppercase italic mb-2">Challenge Player</h3>
                  <p className="text-xs text-muted-foreground mb-4">Battle another real wallet. Good for PvP, country rivalries, stronger leaderboard points.</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/app/battle/pvp" className="flex-1 bg-secondary text-secondary-foreground font-mono text-[9px] uppercase tracking-widest font-bold px-4 py-2 text-center rounded-sm group-hover:opacity-90">Create</Link>
                  <Link href="/app/battle/pvp" className="flex-1 border border-secondary text-foreground font-mono text-[9px] uppercase tracking-widest font-bold px-4 py-2 text-center rounded-sm hover:bg-secondary hover:text-secondary-foreground">Join</Link>
                </div>
              </div>
            </div>
          </section>
          
          {/* F. Battle History */}
          <section className="bg-card border border-border p-6 rounded-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl uppercase italic">Battle History</h2>
              <Link href="/app/history" className="font-mono text-[9px] uppercase tracking-widest underline text-muted-foreground hover:text-primary">View Full History →</Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between border border-border bg-background p-3">
                <span className="font-mono text-[10px] uppercase tracking-widest">Nigeria vs Brazil</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-success font-bold">Won 3–1</span>
              </div>
              <div className="flex items-center justify-between border border-border bg-background p-3">
                <span className="font-mono text-[10px] uppercase tracking-widest">Nigeria vs Argentina</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-destructive font-bold">Lost 1–2</span>
              </div>
              <div className="flex items-center justify-between border border-border bg-background p-3">
                <span className="font-mono text-[10px] uppercase tracking-widest">Nigeria vs Underdog</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-success font-bold">Won 2–0</span>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* C. AI Strategy Panel */}
          <section className="bg-card border border-border p-6 rounded-sm bg-primary/5">
            <h2 className="font-display text-xl uppercase italic mb-4 flex items-center gap-2 text-primary">
              <span className="animate-pulse">●</span> AI Strategy
            </h2>
            <div className="border border-primary/20 bg-background p-4 mb-4">
              <p className="text-sm italic text-muted-foreground mb-3">"Use 4-3-3 Attack. Opponent's left side is weak. Push through the right wing with medium risk."</p>
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-60">Confidence: 87%</div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-primary text-primary-foreground font-mono text-[9px] uppercase tracking-widest font-bold px-3 py-2 rounded-sm hover:opacity-90">Accept</button>
              <button className="flex-1 border border-border bg-background font-mono text-[9px] uppercase tracking-widest font-bold px-3 py-2 rounded-sm hover:bg-muted">Regenerate</button>
            </div>
          </section>

          {/* D. Country Leaderboard Panel */}
          <section className="bg-card border border-border p-6 rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl uppercase italic">Leaderboard</h2>
              <Link href="/app/leaderboard" className="font-mono text-[9px] uppercase tracking-widest underline text-muted-foreground hover:text-primary">View All →</Link>
            </div>
            <div className="border border-border">
              <div className="grid grid-cols-[30px_1fr_60px] p-2 bg-muted font-mono text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
                <span>Rk</span><span>Country</span><span className="text-right">Pts</span>
              </div>
              <div className="grid grid-cols-[30px_1fr_60px] p-2 bg-background font-mono text-[10px] uppercase tracking-widest border-b border-border">
                <span className="text-primary">1</span><span>Brazil</span><span className="text-right font-bold">142k</span>
              </div>
              <div className="grid grid-cols-[30px_1fr_60px] p-2 bg-background font-mono text-[10px] uppercase tracking-widest border-b border-border">
                <span>2</span><span>Argentina</span><span className="text-right font-bold">131k</span>
              </div>
              <div className="grid grid-cols-[30px_1fr_60px] p-2 bg-primary/10 text-primary font-mono text-[10px] uppercase tracking-widest border-b border-border">
                <span>3</span><span>Nigeria</span><span className="text-right font-bold">128k</span>
              </div>
              <div className="grid grid-cols-[30px_1fr_60px] p-2 bg-background font-mono text-[10px] uppercase tracking-widest">
                <span>4</span><span>England</span><span className="text-right font-bold">97k</span>
              </div>
            </div>
          </section>

          {/* E. Side Market Intents Panel */}
          <section className="bg-card border border-border p-6 rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl uppercase italic">Side Predictions</h2>
              <Link href="/app/markets" className="font-mono text-[9px] uppercase tracking-widest underline text-muted-foreground hover:text-primary">Markets →</Link>
            </div>
            <div className="space-y-3">
              <div className="border border-border p-3 bg-background group">
                <p className="text-xs mb-2">Will Nigeria beat Brazil today?</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-muted font-mono text-[9px] uppercase tracking-widest py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors">Back</button>
                  <button className="flex-1 bg-muted font-mono text-[9px] uppercase tracking-widest py-1.5 hover:bg-foreground hover:text-background transition-colors">View Intent</button>
                </div>
              </div>
              <div className="border border-border p-3 bg-background group">
                <p className="text-xs mb-2">Which country enters top 3 this week?</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-muted font-mono text-[9px] uppercase tracking-widest py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors">Back</button>
                  <button className="flex-1 bg-muted font-mono text-[9px] uppercase tracking-widest py-1.5 hover:bg-foreground hover:text-background transition-colors">View Intent</button>
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
