"use client";

export default function MarketsPage() {
  const markets = [
    {
      id: 1,
      title: "Nigeria to beat Brazil tonight",
      pool: "$12,402",
      odds: "1.84x",
      type: "Match Event",
    },
    {
      id: 2,
      title: "Argentina top-3 by quarter end",
      pool: "$8,917",
      odds: "2.10x",
      type: "Seasonal",
    },
    {
      id: 3,
      title: "Underdog scores >= 2 goals",
      pool: "$4,205",
      odds: "3.40x",
      type: "Performance",
    },
    {
      id: 4,
      title: "England clean sheet vs Japan",
      pool: "$2,150",
      odds: "1.55x",
      type: "Match Event",
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Open Markets</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Intent-based predictions • Settling on X Layer
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((m) => (
          <div key={m.id} className="flex flex-col justify-between border border-border bg-card p-5 hover:border-primary/50 transition-colors">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest bg-muted px-2 py-1 mb-3 inline-block">{m.type}</span>
              <p className="font-display text-xl uppercase italic mb-4">{m.title}</p>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <span className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Pool</span>
                <span className="font-display text-xl">{m.pool}</span>
              </div>
              <button className="bg-primary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90">
                {m.odds} • Back
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
