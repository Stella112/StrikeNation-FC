"use client";

import { useMemo, useState } from "react";

const countries = [
  { code: "NG", name: "Nigeria", style: "Underdog speed", weakness: "open midfield after counters" },
  { code: "BR", name: "Brazil", style: "Creative pressure", weakness: "left channel recovery" },
  { code: "AR", name: "Argentina", style: "Calm finishers", weakness: "wide overloads" },
  { code: "EN", name: "England", style: "Set-piece machine", weakness: "slow pivots under press" },
  { code: "UD", name: "Underdog", style: "Chaos market", weakness: "volatile defensive shape" },
  { code: "JP", name: "Japan", style: "Technical tempo", weakness: "aerial duels" },
  { code: "KR", name: "South Korea", style: "High press engine", weakness: "space behind fullbacks" },
  { code: "SA", name: "Saudi Arabia", style: "Counter strike", weakness: "deep block fatigue" },
  { code: "QA", name: "Qatar", style: "Host nation nerve", weakness: "central transitions" },
  { code: "IR", name: "Iran", style: "Defensive wall", weakness: "late pressure switches" },
  { code: "AU", name: "Australia", style: "Physical duels", weakness: "short passing traps" },
  { code: "ID", name: "Indonesia", style: "Rising crowd", weakness: "set-piece marking" },
  { code: "IN", name: "India", style: "Rising crowd", weakness: "press resistance" },
  { code: "CN", name: "China", style: "Pressure build", weakness: "quick diagonal balls" },
];

export default function ScoutMarketplacePage() {
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);
  const [query, setQuery] = useState("");

  const reports = useMemo(
    () =>
      countries
        .map((country) => ({
          id: country.code,
          title: `${country.name} Tactical Report`,
          cost: "x402",
          desc: `${country.name} FanDAO plays with ${country.style}. Claude scout focuses on ${country.weakness}.`,
          author: country.code,
          country,
        }))
        .filter((report) =>
          `${report.country.code} ${report.country.name} ${report.country.style} ${report.country.weakness}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [query],
  );

  async function purchaseReport(report) {
    setLoading(report.id);
    setError("");
    setReportData(null);

    try {
      const response = await fetch("/api/agent/premium-scout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentName: "Naija Finisher",
          country: "Nigeria",
          opponent: report.title,
          playstyle: "4-3-3 AI Captain",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || data.error || "x402 payment required.");
        return;
      }

      setPurchased(report.id);
      setReportData(data);
    } catch (err) {
      setError(err?.message || "Could not request x402 scout report.");
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Scout Marketplace</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Search country scout reports protected by the x402 payment boundary.
          </p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full md:w-80 border border-border bg-background px-4 py-3 font-mono text-[10px] uppercase tracking-widest"
          placeholder="Search country"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="border border-border bg-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="bg-muted px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground rounded-sm">
                  {report.author} AI Scout
                </span>
                <span className="font-display text-xl text-primary">{report.cost}</span>
              </div>
              <h3 className="font-display text-2xl uppercase italic mb-3">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{report.desc}</p>
            </div>
            <button
              onClick={() => purchaseReport(report)}
              className="w-full bg-background border border-border font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-3 rounded-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
            >
              {loading === report.id ? "Checking x402..." : purchased === report.id ? "Purchased" : "Purchase via x402"}
            </button>
          </div>
        ))}
      </div>

      {!reports.length && (
        <div className="border border-border bg-card p-5 text-sm text-muted-foreground">
          No country report matches that search.
        </div>
      )}

      {error && (
        <div className="mt-8 border border-primary/30 bg-primary/5 p-6 font-mono text-[10px] uppercase tracking-widest text-primary">
          {error}
        </div>
      )}

      {purchased && (
        <div className="mt-8 border border-success/30 bg-success/5 p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-success font-mono text-[10px] uppercase tracking-widest">
            <span className="animate-pulse">●</span> Premium Intelligence Unlocked
          </div>
          <h3 className="font-display text-2xl uppercase italic">Scout Report Analysis</h3>
          <p className="text-sm">"{reportData?.summary || "Premium x402 scouting report unlocked."}"</p>
          {reportData?.recommendedCourtPlan && <p className="text-sm text-muted-foreground">{reportData.recommendedCourtPlan}</p>}
        </div>
      )}
    </div>
  );
}
