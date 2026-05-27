"use client";

export default function FanDAOPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Nigeria FanDAO</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="size-2 bg-success rounded-full"></span> Active • 12,840 Members
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Treasury Balance</div>
            <div className="font-display text-2xl text-primary">24,500 OKB</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        
        {/* Left: Proposals */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-display text-2xl uppercase italic">Active Proposals</h2>
            <button className="bg-primary text-primary-foreground font-mono text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-sm hover:opacity-90">
              Create Proposal
            </button>
          </div>

          <div className="space-y-4">
            {/* Proposal 1 */}
            <div className="border border-border bg-card p-5 transition-colors hover:border-primary/50">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-primary/20 text-primary font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-sm">Voting Open</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Ends in 2 days</span>
              </div>
              <h3 className="font-display text-xl mb-2">Upgrade Striker AI Training Model to v2.1</h3>
              <p className="text-sm text-muted-foreground mb-6">Allocate 5,000 OKB from the treasury to purchase premium Claude Sonnet API credits for offensive strategy generation.</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest">
                  <span>Yes (74%)</span>
                  <span>No (26%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-success w-[74%]"></div>
                  <div className="h-full bg-destructive w-[26%]"></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-success/10 text-success border border-success/20 font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-sm hover:bg-success hover:text-success-foreground transition-colors">Vote Yes</button>
                <button className="flex-1 bg-destructive/10 text-destructive border border-destructive/20 font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors">Vote No</button>
              </div>
              <p className="mt-3 text-center font-mono text-[9px] text-muted-foreground">Your voting power: 245 Votes (Based on Passport XP)</p>
            </div>

            {/* Proposal 2 */}
            <div className="border border-border bg-card p-5 opacity-70">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-muted text-muted-foreground font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-sm">Passed</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Executed on X Layer</span>
              </div>
              <h3 className="font-display text-xl mb-2">Fund National Match Rewards Pool</h3>
              <p className="text-sm text-muted-foreground">Distribute 10,000 OKB to top 100 players on the national leaderboard this season.</p>
            </div>
          </div>
        </div>

        {/* Right: Members & Passport */}
        <div className="space-y-6">
          <div className="bg-card border border-primary p-6 rounded-sm text-center">
            <div className="text-4xl mb-4">🛂</div>
            <h3 className="font-display text-xl uppercase italic mb-1">Your Fan Passport</h3>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Level 12 • 2,450 XP</div>
            <div className="w-full bg-background border border-border py-2 font-mono text-xs mb-4">0x4F...9A21</div>
            <button className="w-full border border-primary text-primary font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 hover:bg-primary hover:text-primary-foreground">
              Upgrade Passport
            </button>
          </div>

          <div className="bg-card border border-border p-5 rounded-sm">
            <h3 className="font-display text-xl uppercase italic mb-4">Top Members</h3>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[9px] w-4 ${i <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>0{i}</span>
                    <div className="size-6 bg-muted rounded-full overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="avatar" />
                    </div>
                    <span className="font-mono text-[10px] uppercase">0x{Math.floor(Math.random()*10000)}...{Math.floor(Math.random()*1000)}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">{10000 - i * 1500} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
