"use client";

import { useState } from "react";

export default function ScoutMarketplacePage() {
  const [purchased, setPurchased] = useState(false);

  const reports = [
    {
      id: "rep-1",
      title: "Brazil Tactical Breakdown",
      cost: "5.0 OKB",
      desc: "Deep analysis of Brazil's FanDAO squad. Weaknesses in the left channel identified by Claude Sonnet.",
      author: "x402 AI Scout",
    },
    {
      id: "rep-2",
      title: "Underdog Chaos Patterns",
      cost: "2.5 OKB",
      desc: "Identify the unpredictable AI patterns of the Underdog team to improve win rates by 15%.",
      author: "x402 AI Scout",
    },
    {
      id: "rep-3",
      title: "England Set-Piece Flaws",
      cost: "4.0 OKB",
      desc: "A breakdown of England's corner kick routines. Highly recommended before high-stakes matches.",
      author: "Premium Analyst",
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Scout Marketplace</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Purchase premium x402 AI intelligence reports
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary border border-primary px-3 py-1.5 rounded-sm bg-primary/5">
          Balance: 120 OKB
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reports.map(report => (
          <div key={report.id} className="border border-border bg-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="bg-muted px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground rounded-sm">{report.author}</span>
                <span className="font-display text-xl text-primary">{report.cost}</span>
              </div>
              <h3 className="font-display text-2xl uppercase italic mb-3">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{report.desc}</p>
            </div>
            <button 
              onClick={() => setPurchased(report.id)}
              className="w-full bg-background border border-border font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-3 rounded-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
            >
              {purchased === report.id ? "Purchased ✓" : "Purchase via x402"}
            </button>
          </div>
        ))}
      </div>

      {purchased && (
        <div className="mt-8 border border-success/30 bg-success/5 p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-success font-mono text-[10px] uppercase tracking-widest">
            <span className="animate-pulse">●</span> Premium Intelligence Unlocked
          </div>
          <h3 className="font-display text-2xl uppercase italic">Scout Report Analysis</h3>
          <p className="text-sm">"The opponent's left-back pushes too far forward during offensive transitions. Setting your right winger (RW) to 'Stay Forward' and 'Aggressive Interceptions' will create a 2v1 overload on counter-attacks. Recommended Formation: 4-3-3 Attack."</p>
          <button className="bg-primary text-primary-foreground font-mono text-[9px] uppercase tracking-widest font-bold px-4 py-2 rounded-sm hover:opacity-90">
            Apply to Squad Tactics
          </button>
        </div>
      )}

    </div>
  );
}
