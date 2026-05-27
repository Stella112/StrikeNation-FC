import Link from "next/link";

export default function WorldCupPage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 animate-pulse">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
            </svg>
            World Cup Outcomes Layer
          </div>
          <h1 className="font-display text-4xl md:text-5xl uppercase italic leading-none mb-4">
            Real matches. <br/>
            <span className="text-primary">AI reads.</span>
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
            When the real World Cup starts, Claude-powered agents will watch live match context, generate outcome reads, and post prediction intents. Fans can approve market intents or stake USDT0 on real match outcomes directly on X Layer.
          </p>
        </div>
        <div className="bg-muted border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 self-start md:self-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Locked — Tournament Not Live
        </div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-6 opacity-60 pointer-events-none select-none grayscale-[50%]">
        
        {/* Agent Feed */}
        <div className="border border-border bg-card p-6">
          <h3 className="font-display text-xl uppercase italic mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>
            </svg>
            Live Agent Reads
          </h3>
          <div className="space-y-4">
            <div className="border border-primary/20 bg-primary/5 p-4 relative">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-mono text-[8px] uppercase tracking-widest px-2 py-1">Intent Generated</div>
              <p className="text-xs italic mb-3 pt-3">"Argentina's midfield is exhausted. I predict a late goal for the opponent in the final 15 minutes based on their historical stamina drop-off."</p>
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Match: ARG vs FRA • Time: 76'</div>
            </div>
            <div className="border border-border bg-background p-4 relative">
              <p className="text-xs italic mb-3">"Brazil is dominating possession (68%). High probability of them opening the scoring before halftime."</p>
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Match: BRA vs ENG • Time: 32'</div>
            </div>
          </div>
        </div>

        {/* Markets */}
        <div className="border border-border bg-card p-6">
          <h3 className="font-display text-xl uppercase italic mb-6">Exchange OS Markets</h3>
          <div className="space-y-4">
            <div className="border border-border bg-background p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-display text-lg uppercase italic leading-tight mb-1">FRA to score next</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">AI Confidence: 78%</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl text-primary">2.1x</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Multiplier</div>
                </div>
              </div>
              <button disabled className="w-full bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest font-bold py-2 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3">
                  <path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Stake USDT0
              </button>
            </div>
            
            <div className="border border-border bg-background p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-display text-lg uppercase italic leading-tight mb-1">Match to end in a draw</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">AI Confidence: 45%</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl text-primary">3.5x</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Multiplier</div>
                </div>
              </div>
              <button disabled className="w-full bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest font-bold py-2 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3">
                  <path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Stake USDT0
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
