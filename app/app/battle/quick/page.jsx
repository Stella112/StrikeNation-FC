"use client";

import Link from "next/link";
import { useState } from "react";
import { MatchSimulation } from "../MatchSimulation";

export default function QuickBattlePage() {
  const [step, setStep] = useState(1);
  const [opponent, setOpponent] = useState(null);

  const opponents = [
    { id: "balanced", name: "Balanced AI", difficulty: "Medium", reward: "Normal Points", desc: "Standard X Layer AI." },
    { id: "elite", name: "Elite AI", difficulty: "Hard", reward: "Higher Points", desc: "Trained on pro-player strategies." },
    { id: "underdog", name: "Underdog AI", difficulty: "Random", reward: "Bonus Multiplier", desc: "Unpredictable chaos market." }
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl uppercase italic mb-2">Quick Battle</h1>
        <div className="flex gap-2">
          <span className={`h-1 flex-1 ${step >= 1 ? 'bg-primary' : 'bg-border'}`}></span>
          <span className={`h-1 flex-1 ${step >= 2 ? 'bg-primary' : 'bg-border'}`}></span>
          <span className={`h-1 flex-1 ${step >= 3 ? 'bg-primary' : 'bg-border'}`}></span>
          <span className={`h-1 flex-1 ${step >= 4 ? 'bg-primary' : 'bg-border'}`}></span>
          <span className={`h-1 flex-1 ${step >= 5 ? 'bg-primary' : 'bg-border'}`}></span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl uppercase italic">Select Opponent</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {opponents.map(opp => (
              <button 
                key={opp.id}
                onClick={() => setOpponent(opp.id)}
                className={`text-left p-5 border transition-colors ${opponent === opp.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-foreground/50'}`}
              >
                <h3 className="font-display text-xl uppercase italic mb-1">{opp.name}</h3>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-4">{opp.difficulty} Difficulty</div>
                <p className="text-xs mb-4">{opp.desc}</p>
                <div className="font-mono text-[10px] uppercase tracking-widest text-success">Reward: {opp.reward}</div>
              </button>
            ))}
          </div>
          <button 
            disabled={!opponent}
            onClick={() => setStep(2)}
            className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-8 py-3 rounded-sm disabled:opacity-50 hover:opacity-90"
          >
            Choose Opponent
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl uppercase italic">AI Strategy Recommendation</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border bg-card p-6 flex items-center justify-between">
              <div className="text-center">
                <div className="font-display text-xl uppercase">Your Squad</div>
                <div className="font-mono text-[9px] text-muted-foreground uppercase">4-3-3 Attack</div>
              </div>
              <div className="font-display text-2xl italic text-primary">VS</div>
              <div className="text-center">
                <div className="font-display text-xl uppercase">Elite AI</div>
                <div className="font-mono text-[9px] text-muted-foreground uppercase">3-5-2 High Press</div>
              </div>
            </div>
            <div className="border border-primary/20 bg-primary/5 p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-widest">
                <span className="animate-pulse">●</span> Claude Analysis
              </div>
              <p className="text-sm italic">"Opponent's 3-5-2 will crowd the midfield. Switch to attacking through the wings. Use Siete on the right to bypass their central overload."</p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/20 font-mono text-[10px] uppercase tracking-widest">
                <div>Attack Side: <span className="text-primary">Wings</span></div>
                <div>Risk Level: <span className="text-primary">High</span></div>
                <div>Confidence: <span className="text-success">82%</span></div>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setStep(3)} className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-8 py-3 rounded-sm hover:opacity-90">
              Use AI Strategy
            </button>
            <button onClick={() => setStep(3)} className="border border-border bg-background font-mono text-xs uppercase tracking-widest font-bold px-8 py-3 rounded-sm hover:bg-muted">
              Edit Strategy
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl uppercase italic">Confirm Match</h2>
          <div className="border border-border bg-card p-6 space-y-6 max-w-lg">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Stakes</div>
              <div className="font-display text-xl">100 FanDAO Points</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Network</div>
              <div className="font-display text-xl text-success flex items-center gap-2"><span className="size-2 bg-success rounded-full"></span> X Layer Mainnet</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Estimated Gas</div>
              <div className="font-mono text-xs">~0.0001 OKB</div>
            </div>
            <button onClick={() => {
              setStep(4);
            }} className="w-full bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-8 py-4 rounded-sm hover:opacity-90">
              Start Match on X Layer
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <MatchSimulation onComplete={() => setStep(5)} />
      )}

      {step === 5 && (
        <div className="space-y-10 text-center py-8">
          <div className="space-y-2">
            <h2 className="font-display text-6xl uppercase italic text-success">VICTORY</h2>
            <div className="font-display text-4xl">Nigeria 1 - 0 Elite AI</div>
          </div>
          
          <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-6 text-left">
            {/* Match Rewards */}
            <div className="border border-border bg-card p-6 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xl uppercase italic border-b border-border pb-3 mb-4 flex items-center justify-between">
                  Match Rewards
                  <span className="font-mono text-[9px] uppercase text-success">● Settled</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">XP Gained</div>
                    <div className="font-display text-2xl text-success">+450</div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Country Points</div>
                    <div className="font-display text-2xl text-success">+100</div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Tx Hash</div>
                <div className="font-mono text-xs truncate">0x7af1a392b4...c20e</div>
              </div>
            </div>

            {/* Agent Evolution */}
            <div className="border border-primary/20 bg-primary/5 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-mono text-[8px] uppercase tracking-widest px-2 py-1">Squad Upgraded</div>
              <h3 className="font-display text-xl uppercase italic border-b border-primary/20 pb-3 mb-4 text-primary">Agent Evolution</h3>
              
              <div className="flex gap-4 items-center">
                <div className="size-16 rounded-full overflow-hidden border-2 border-primary shrink-0 bg-muted">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=command" alt="Command" className="h-full w-full object-cover scale-110" />
                </div>
                <div>
                  <div className="font-display text-lg uppercase leading-none mb-1">Command</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Role: CB</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                      <span className="text-muted-foreground line-through opacity-70">Sweeper Captain</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                      <span className="text-success font-bold">Elite Sweeper</span>
                    </div>
                    <p className="text-xs italic text-muted-foreground mt-1">"Adapted trait from high defensive actions (9 clearances) this match."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button onClick={() => setStep(1)} className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest font-bold px-6 py-3 rounded-sm hover:opacity-90">
              Battle Again
            </button>
            <Link href="/app" className="border border-border bg-background font-mono text-[10px] uppercase tracking-widest font-bold px-6 py-3 rounded-sm hover:bg-muted">
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
