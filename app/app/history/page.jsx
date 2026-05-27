"use client";

import Link from "next/link";
import { TransactionHistory } from "@/app/app/components/TransactionHistory";

export default function HistoryPage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Arena History</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Total match and market events from StrikeNation contracts on X Layer
          </p>
        </div>
        <Link href="/app/battle/quick" className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-sm hover:opacity-90">
          New Battle
        </Link>
      </div>

      <TransactionHistory title="Total Arena Match History" limit={20} scope="global" />
    </div>
  );
}
