const API_FOOTBALL_BASE_URL = process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";
const WORLD_CUP_LEAGUE_ID = process.env.API_FOOTBALL_WORLD_CUP_LEAGUE_ID || "1";
const WORLD_CUP_SEASON = process.env.API_FOOTBALL_SEASON || "2026";

const fallbackFixtures = [
  {
    id: "wc-preview-1",
    date: "2026-06-11T00:00:00Z",
    status: "Scheduled",
    minute: null,
    home: { id: 1, name: "Mexico", code: "MEX", goals: null },
    away: { id: 2, name: "South Africa", code: "RSA", goals: null },
    venue: "World Cup opener",
    round: "Group Stage",
  },
  {
    id: "wc-preview-2",
    date: "2026-06-12T00:00:00Z",
    status: "Scheduled",
    minute: null,
    home: { id: 3, name: "United States", code: "USA", goals: null },
    away: { id: 4, name: "Canada", code: "CAN", goals: null },
    venue: "World Cup preview",
    round: "Group Stage",
  },
  {
    id: "wc-preview-3",
    date: "2026-06-13T00:00:00Z",
    status: "Scheduled",
    minute: null,
    home: { id: 5, name: "Brazil", code: "BRA", goals: null },
    away: { id: 6, name: "Japan", code: "JPN", goals: null },
    venue: "Arena simulation",
    round: "Group Stage",
  },
];

const fallbackPlayers = [
  { name: "Direct Runner", team: "Nigeria", position: "Forward", rating: "7.2", note: "attacks early space" },
  { name: "Press Anchor", team: "Brazil", position: "Midfielder", rating: "7.0", note: "wins second balls" },
  { name: "Set Piece Guard", team: "England", position: "Defender", rating: "6.9", note: "dominates aerial duels" },
];

function normalizeFixture(item) {
  return {
    id: item.fixture?.id,
    date: item.fixture?.date,
    status: item.fixture?.status?.long || item.fixture?.status?.short || "Scheduled",
    minute: item.fixture?.status?.elapsed ?? null,
    home: {
      id: item.teams?.home?.id,
      name: item.teams?.home?.name,
      code: item.teams?.home?.code || item.teams?.home?.name?.slice(0, 3)?.toUpperCase(),
      goals: item.goals?.home ?? null,
    },
    away: {
      id: item.teams?.away?.id,
      name: item.teams?.away?.name,
      code: item.teams?.away?.code || item.teams?.away?.name?.slice(0, 3)?.toUpperCase(),
      goals: item.goals?.away ?? null,
    },
    venue: item.fixture?.venue?.name || "World Cup venue",
    round: item.league?.round || "World Cup",
  };
}

function normalizePlayers(payload, teamName) {
  return (payload?.response || [])
    .slice(0, 5)
    .map((item) => {
      const stats = item.statistics?.[0] || {};
      return {
        name: item.player?.name,
        team: stats.team?.name || teamName,
        position: stats.games?.position || "Player",
        rating: stats.games?.rating || "n/a",
        note: `${stats.games?.appearences || 0} apps, ${stats.goals?.total || 0} goals, ${stats.goals?.assists || 0} assists`,
      };
    })
    .filter((player) => player.name);
}

function buildTicker(fixtures) {
  return fixtures.slice(0, 6).map((fixture) => {
    const home = fixture.home?.code || fixture.home?.name?.slice(0, 3)?.toUpperCase() || "HOM";
    const away = fixture.away?.code || fixture.away?.name?.slice(0, 3)?.toUpperCase() || "AWY";
    const score =
      fixture.home?.goals !== null && fixture.away?.goals !== null
        ? `${fixture.home.goals} - ${fixture.away.goals}`
        : "vs";
    const status = fixture.minute ? `${fixture.minute}'` : fixture.status || "Soon";
    return `${home} ${score} ${away} - ${status}`;
  });
}

async function apiFootball(path, key) {
  const response = await fetch(`${API_FOOTBALL_BASE_URL}${path}`, {
    headers: { "x-apisports-key": key },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`API-Football ${response.status}`);
  }

  return response.json();
}

export async function GET() {
  const key = process.env.API_FOOTBALL_KEY || process.env.APIFOOTBALL_KEY;

  if (!key) {
    return Response.json({
      source: "fallback-no-api-key",
      leagueId: WORLD_CUP_LEAGUE_ID,
      season: WORLD_CUP_SEASON,
      fixtures: fallbackFixtures,
      playerStats: fallbackPlayers,
      ticker: buildTicker(fallbackFixtures),
      note: "Add API_FOOTBALL_KEY to use live API-Football data.",
    });
  }

  try {
    const fixturePayload = await apiFootball(
      `/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}&next=8`,
      key,
    );
    const fixtures = (fixturePayload.response || []).map(normalizeFixture).filter((fixture) => fixture.id);
    const primaryFixture = fixtures[0];
    let playerStats = [];

    if (primaryFixture?.home?.id) {
      try {
        const homePlayers = await apiFootball(
          `/players?team=${primaryFixture.home.id}&season=${WORLD_CUP_SEASON}`,
          key,
        );
        playerStats = playerStats.concat(normalizePlayers(homePlayers, primaryFixture.home.name));
      } catch {}
    }

    if (primaryFixture?.away?.id) {
      try {
        const awayPlayers = await apiFootball(
          `/players?team=${primaryFixture.away.id}&season=${WORLD_CUP_SEASON}`,
          key,
        );
        playerStats = playerStats.concat(normalizePlayers(awayPlayers, primaryFixture.away.name));
      } catch {}
    }

    const normalizedFixtures = fixtures.length ? fixtures : fallbackFixtures;

    return Response.json({
      source: "api-football",
      leagueId: WORLD_CUP_LEAGUE_ID,
      season: WORLD_CUP_SEASON,
      fixtures: normalizedFixtures,
      playerStats: playerStats.length ? playerStats.slice(0, 10) : fallbackPlayers,
      ticker: buildTicker(normalizedFixtures),
    });
  } catch (error) {
    return Response.json({
      source: "fallback-api-error",
      leagueId: WORLD_CUP_LEAGUE_ID,
      season: WORLD_CUP_SEASON,
      fixtures: fallbackFixtures,
      playerStats: fallbackPlayers,
      ticker: buildTicker(fallbackFixtures),
      error: error.message,
    });
  }
}
