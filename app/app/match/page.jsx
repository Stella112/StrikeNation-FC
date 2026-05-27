import Link from "next/link";

export default function MatchModePage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Match Lobby
        </p>
        <h1 className="font-display text-4xl uppercase italic mb-2">
          Choose Battle Mode
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Start instantly against an AI-controlled squad, or open a real wallet-vs-wallet
          challenge for another player.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/app/battle/quick"
          className="border border-border bg-card p-8 hover:border-primary transition-colors group"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">
            Instant Play
          </p>
          <h2 className="font-display text-3xl uppercase italic mb-3 group-hover:text-primary">
            Quick Battle
          </h2>
          <p className="text-sm text-muted-foreground">
            Battle an autonomous Strike Agent squad with a compressed 60-second match,
            live commentary, market intents, and agent evolution.
          </p>
        </Link>

        <Link
          href="/app/battle/pvp"
          className="border border-border bg-card p-8 hover:border-secondary transition-colors group"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-secondary mb-3">
            Two Wallets
          </p>
          <h2 className="font-display text-3xl uppercase italic mb-3 group-hover:text-secondary">
            Challenge Player
          </h2>
          <p className="text-sm text-muted-foreground">
            Create or join a match room where two real wallets submit squads and settle
            the result on X Layer.
          </p>
        </Link>
      </div>
    </div>
  );
}
