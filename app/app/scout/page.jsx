"use client";

import { useState } from "react";

export default function ScoutMarketplacePage() {
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);

  const reports = [
    {
      id: "rep-1",
      title: "Brazil Tactical Breakdown",
      cost: "x402",
      desc: "Deep analysis of Brazil's FanDAO squad. Weaknesses in the left channel identified by Claude Sonnet.",
      author: "x402 AI Scout",
    },
    {
      id: "rep-2",
      title: "Underdog Chaos Patterns",
      cost: "x402",
      desc: "Identify unpredictable AI patterns from the Underdog team before a high-risk match.",
      author: "x402 AI Scout",
    },
    {
      id: "rep-3",
      title: "England Set-Piece Flaws",
      cost: "x402",
      desc: "A breakdown of England set-piece routines before a wallet-vs-wallet challenge.",
      author: "Premium Analyst",
    },
  ];

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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Scout Marketplace</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Premium intelligence is protected by the x402 payment boundary.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reports.map((report) => (
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
              onClick={() => purchaseReport(report)}
              className="w-full bg-background border border-border font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-3 rounded-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
            >
              {loading === report.id ? "Checking x402..." : purchased === report.id ? "Purchased" : "Purchase via x402"}
            </button>
          </div>
        ))}
      </div>

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
