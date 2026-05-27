"use client";

export default function LeaderboardPage() {
  const leaderboard = [
    { rank: 1, country: "Brazil", flag: "🇧🇷", agents: 1121, points: "142,850" },
    { rank: 2, country: "Argentina", flag: "🇦🇷", agents: 1042, points: "131,420" },
    { rank: 3, country: "Nigeria", flag: "🇳🇬", agents: 1284, points: "128,750" },
    { rank: 4, country: "England", flag: "🏴", agents: 980, points: "97,230" },
    { rank: 5, country: "Japan", flag: "🇯🇵", agents: 890, points: "86,410" },
    { rank: 6, country: "South Korea", flag: "🇰🇷", agents: 855, points: "82,100" },
    { rank: 7, country: "Saudi Arabia", flag: "🇸🇦", agents: 720, points: "71,550" },
    { rank: 8, country: "Underdog", flag: "🌍", agents: 442, points: "44,220" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Country Leaderboard</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="size-2 bg-success rounded-full"></span> Updated 2m ago • Season 1
          </p>
        </div>
      </div>

      <div className="overflow-hidden border border-border">
        <div className="grid grid-cols-[40px_28px_1fr_80px_100px] gap-4 border-b border-border bg-muted px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>#</span>
          <span></span>
          <span>FanDAO</span>
          <span className="text-right">Agents</span>
          <span className="text-right">Points</span>
        </div>
        
        {leaderboard.map((item) => (
          <div key={item.rank} className={`grid grid-cols-[40px_28px_1fr_80px_100px] items-center gap-4 border-b border-border px-4 py-4 text-sm last:border-0 ${item.country === 'Nigeria' ? 'bg-primary/5' : 'bg-card hover:bg-muted/50'}`}>
            <span className={`font-display text-xl ${item.rank <= 3 ? 'text-primary' : ''}`}>
              {item.rank.toString().padStart(2, '0')}
            </span>
            <div className="text-2xl">{item.flag}</div>
            <span className={`font-bold ${item.country === 'Nigeria' ? 'text-primary' : ''}`}>
              {item.country} {item.country === 'Nigeria' && '(You)'}
            </span>
            <span className="text-right font-mono text-xs text-muted-foreground">{item.agents}</span>
            <span className="text-right font-display text-lg">{item.points}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
