"use client";

import Link from "next/link";

export default function HistoryPage() {
  const history = [
    {
      id: "M-4821",
      date: "2m ago",
      opponent: "Elite AI",
      result: "Won 3–1",
      points: "+100 PTS",
      hash: "0x7af1a...c20e",
      summary: "Used wings to bypass 3-5-2 central overload."
    },
    {
      id: "M-4819",
      date: "1h ago",
      opponent: "0x8F2...1A9",
      result: "Lost 1–2",
      points: "-50 PTS",
      hash: "0x9be2c...f11a",
      summary: "Opponent counter-attacked heavily through center."
    },
    {
      id: "M-4790",
      date: "5h ago",
      opponent: "Underdog AI",
      result: "Won 2–0",
      points: "+150 PTS",
      hash: "0x3cc4d...e44b",
      summary: "Solid defense, clinical finishing from Eagle."
    },
    {
      id: "M-4755",
      date: "1d ago",
      opponent: "0x1A4...9B2",
      result: "Draw 1–1",
      points: "+10 PTS",
      hash: "0x5ee1a...d99c",
      summary: "Balanced match. Both defenses held firm."
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Battle History</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Your recent matches settled on X Layer
          </p>
        </div>
        <Link href="/app/battle/quick" className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-sm hover:opacity-90">
          New Battle
        </Link>
      </div>

      <div className="space-y-4">
        {history.map((match) => (
          <div key={match.id} className="border border-border bg-card p-5">
            <div className="flex flex-wrap md:flex-nowrap items-start justify-between gap-4 mb-4 pb-4 border-b border-border/50">
              <div className="flex items-center gap-4">
                <span className={`font-display text-2xl ${match.result.startsWith('Won') ? 'text-success' : match.result.startsWith('Lost') ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {match.result}
                </span>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">vs {match.opponent}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest mt-1">{match.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-display text-xl ${match.points.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                  {match.points}
                </div>
                <a href={`#${match.hash}`} className="font-mono text-[9px] uppercase tracking-widest text-primary hover:underline mt-1 block">
                  Tx: {match.hash} ↗
                </a>
              </div>
            </div>
            
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">AI Match Summary</div>
              <p className="text-sm italic">"{match.summary}"</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
