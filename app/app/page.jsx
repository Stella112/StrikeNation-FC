import Link from "next/link";

const stats = [
  { label: "Squad OVR", value: "94.2", delta: "+1.4", tone: "text-success" },
  { label: "Win streak", value: "5W", delta: "Live form", tone: "text-accent" },
  { label: "Country PTS", value: "1,840", delta: "+212", tone: "text-success" },
  { label: "$STRIKE", value: "12,450", delta: "+580", tone: "text-success" },
];

const liveMatches = [
  { home: "NGA", away: "BRA", score: "2 - 1", minute: "Live 67'" },
  { home: "ARG", away: "ENG", score: "0 - 0", minute: "44'" },
  { home: "JPN", away: "KOR", score: "3 - 2", minute: "FT" },
  { home: "IDN", away: "CHN", score: "1 - 0", minute: "Live 22'" },
];

const activity = [
  { type: "Goal", copy: "Agent #9 EAGLE scored vs 0xAlpha...B2", time: "12m" },
  { type: "Upgrade", copy: "Tier 1 upgrade applied to Agent #10", time: "1h" },
  { type: "Vote", copy: "Nigeria FanDAO voted: 3-4-3 vs Brazil", time: "3h" },
  { type: "Service", copy: "x402 service Heat Map Scout purchased", time: "8h" },
];

export default function ArenaDashboard() {
  return (
    <div className="mx-auto max-w-[1560px] p-5 md:p-10 space-y-10">
      <section className="border-b border-border pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Manager dashboard
            </div>
            <h1 className="font-display text-5xl uppercase italic leading-none md:text-7xl">
              Welcome back, <span className="text-primary">Coach</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Real-time pulse of your squad, country and the StrikeNation arena.
            </p>
          </div>
          <Link href="/app/battle/quick" className="inline-flex items-center justify-center bg-primary px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground hover:opacity-90">
            Play Match
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-border bg-card p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{stat.label}</div>
            <div className="mt-2 font-display text-5xl uppercase italic leading-none">{stat.value}</div>
            <div className={`mt-3 font-mono text-[10px] uppercase tracking-widest ${stat.tone}`}>{stat.delta}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <DashboardCard
          href="/app/battle/quick"
          accent="bg-primary"
          title="Play Match"
          text="Instant AI battle or two-wallet PvP challenge with on-chain settlement."
        />
        <DashboardCard
          href="/app/squad"
          accent="bg-secondary"
          title="Tune Squad"
          text="Edit your 11 Strike Agents, formations, tactics and AI brain weights."
        />
        <DashboardCard
          href="/app/scout"
          accent="bg-accent"
          title="Marketplace"
          text="x402-powered premium agent services, scouts and tactical packs."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-3xl uppercase italic">Live Matches</h2>
            <Link href="/app/worldcup" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-primary">
              View all -&gt;
            </Link>
          </div>
          <div>
            {liveMatches.map((match) => (
              <div key={`${match.home}-${match.away}`} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border px-5 py-5 last:border-b-0">
                <div className="flex items-center gap-4">
                  <span className="font-display text-2xl uppercase italic">{match.home}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">vs</span>
                  <span className="font-display text-2xl uppercase italic">{match.away}</span>
                </div>
                <div className="text-right">
                  <div className="font-display text-4xl uppercase italic leading-none">{match.score}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">{match.minute}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-3xl uppercase italic">Activity</h2>
          </div>
          <div>
            {activity.map((item) => (
              <div key={`${item.type}-${item.time}`} className="border-b border-border px-5 py-5 last:border-b-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{item.type}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{item.time}</span>
                </div>
                <p className="text-base font-semibold">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardCard({ href, accent, title, text }) {
  return (
    <Link href={href} className="group min-h-52 border border-border bg-card p-7 transition-colors hover:border-primary">
      <div className={`mb-6 grid h-12 w-12 place-items-center rounded-sm ${accent} font-display text-xl text-primary-foreground`}>
        //
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl uppercase italic leading-none">{title}</h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">{text}</p>
        </div>
        <span className="font-mono text-xl text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1">↗</span>
      </div>
    </Link>
  );
}
