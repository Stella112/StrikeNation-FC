"use client";

import Link from "next/link";
import { useState } from "react";

const countries = [
  { name: "Nigeria", id: 1, flag: "🇳🇬", identity: "Underdog speed", score: 1240 },
  { name: "Brazil", id: 2, flag: "🇧🇷", identity: "Creative pressure", score: 1390 },
  { name: "Argentina", id: 3, flag: "🇦🇷", identity: "Calm finishers", score: 1315 },
  { name: "England", id: 4, flag: "🏴", identity: "Set-piece machine", score: 1188 },
  { name: "Japan", id: 6, flag: "🇯🇵", identity: "Technical tempo", score: 1264 },
  { name: "South Korea", id: 7, flag: "🇰🇷", identity: "High press engine", score: 1237 },
  { name: "Saudi Arabia", id: 8, flag: "🇸🇦", identity: "Counter strike", score: 1168 },
  { name: "Qatar", id: 9, flag: "🇶🇦", identity: "Host nation nerve", score: 1086 },
  { name: "India", id: 13, flag: "🇮🇳", identity: "Rising crowd", score: 1024 },
  { name: "China", id: 14, flag: "🇨🇳", identity: "Pressure build", score: 1017 },
  { name: "Underdog", id: 5, flag: "🌍", identity: "Chaos market", score: 1112 },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState(null);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="font-display text-4xl uppercase italic mb-2">Arena Setup</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Step {step} of 4 • Complete setup to unlock Arena
        </p>
      </div>

      <div className="space-y-8">
        {/* Step 1: Profile */}
        <div className={`border border-border p-6 rounded-sm bg-card transition-opacity ${step < 1 ? 'opacity-50' : ''}`}>
          <h2 className="font-display text-2xl uppercase italic mb-4">1. Create Player Profile</h2>
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Display Name</label>
                <input type="text" className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. Adekunle" />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">X Handle</label>
                <input type="text" className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="@username" />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Preferred Role</label>
                <select className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option>Striker</option>
                  <option>Captain</option>
                  <option>Scout</option>
                  <option>Manager</option>
                </select>
              </div>
              <button 
                onClick={() => setStep(2)}
                className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm hover:opacity-90 transition-opacity"
              >
                Create Profile
              </button>
            </div>
          ) : (
            <div className="font-mono text-xs text-success">✓ Profile Created</div>
          )}
        </div>

        {/* Step 2: Country */}
        <div className={`border border-border p-6 rounded-sm bg-card transition-opacity ${step < 2 ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="font-display text-2xl uppercase italic mb-4">2. Choose Country FanDAO</h2>
          {step === 2 ? (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {countries.map((c) => (
                  <button 
                    key={c.id} 
                    onClick={() => setSelectedCountry(c.id)}
                    className={`border p-3 text-left transition-colors ${selectedCountry === c.id ? 'border-primary bg-primary/10' : 'border-border hover:border-foreground/50 bg-background'}`}
                  >
                    <div className="text-2xl mb-2">{c.flag}</div>
                    <div className="font-bold text-sm">{c.name}</div>
                    <div className="font-mono text-[9px] text-muted-foreground mt-1 uppercase tracking-widest">{c.score} PTS</div>
                  </button>
                ))}
              </div>
              <button 
                disabled={!selectedCountry}
                onClick={() => setStep(3)}
                className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Join FanDAO
              </button>
            </div>
          ) : step > 2 ? (
            <div className="font-mono text-xs text-success">✓ Joined FanDAO</div>
          ) : null}
        </div>

        {/* Step 3: Passport */}
        <div className={`border border-border p-6 rounded-sm bg-card transition-opacity ${step < 3 ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="font-display text-2xl uppercase italic mb-4">3. Mint Fan Passport</h2>
          {step === 3 ? (
            <div>
              <div className="bg-background border border-border p-6 flex flex-col items-center justify-center text-center mb-6 h-48">
                <div className="text-4xl mb-3">🛂</div>
                <p className="text-sm max-w-sm text-muted-foreground">
                  Your Fan Passport proves your country identity and unlocks the arena. Minting is on X Layer.
                </p>
              </div>
              <button 
                onClick={() => setStep(4)}
                className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm hover:opacity-90 transition-opacity"
              >
                Mint Fan Passport
              </button>
            </div>
          ) : step > 3 ? (
            <div className="font-mono text-xs text-success">✓ Passport Minted</div>
          ) : null}
        </div>

        {/* Step 4: Squad */}
        <div className={`border border-border p-6 rounded-sm bg-card transition-opacity ${step < 4 ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="font-display text-2xl uppercase italic mb-4">4. Mint Strike Agent Squad</h2>
          {step === 4 ? (
            <div>
              <div className="bg-background border border-border p-6 flex flex-col items-center justify-center text-center mb-6 h-48 bg-pitch/10 relative overflow-hidden">
                <div className="absolute inset-4 border-2 border-pitch/30 z-0"></div>
                <div className="z-10">
                  <div className="text-4xl mb-3">⚽</div>
                  <p className="text-sm max-w-sm text-muted-foreground">
                    Deploy your 11-player AI agent squad. Each agent runs custom strategies on-chain.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setStep(5)}
                className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm hover:opacity-90 transition-opacity"
              >
                Mint 11-Player Squad
              </button>
            </div>
          ) : step > 4 ? (
            <div className="font-mono text-xs text-success">✓ Squad Deployed</div>
          ) : null}
        </div>

        {/* Unlock Battle Arena */}
        {step > 4 && (
          <div className="pt-6 border-t border-border flex justify-center">
            <Link 
              href="/app"
              className="bg-success text-success-foreground font-mono text-sm uppercase tracking-widest font-bold px-8 py-4 rounded-sm hover:opacity-90 transition-opacity animate-pulse flex items-center gap-2"
            >
              Enter Battle Arena →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
