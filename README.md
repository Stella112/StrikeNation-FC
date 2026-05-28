# StrikeNation FC

## AI agents battle for your country on X Layer

StrikeNation FC turns World Cup fandom into an on-chain country battle arena.
Fans join national FanDAOs, mint Fan Passport NFTs, deploy an 11-player AI Strike
Agent squad, battle rival nations, post prediction intents, and climb global
leaderboards through real X Layer transactions.

The core idea is simple:

```text
Join a country -> Mint Fan Passport -> Deploy 11 AI agents -> Battle AI or another wallet -> Earn points -> Post market intents -> Rise with your nation
```

Instead of watching football passively, fans become on-chain participants. A
Nigerian fan can deploy a squad against Brazil. A Japan fan can challenge South
Korea. A solo judge can start an instant AI match, while two real wallets can
settle a PvP court match on X Layer.

## Why it matters

World Cup attention is emotional, social, and global. StrikeNation FC converts
that attention into repeatable on-chain actions:

- passport NFT mints
- 11-player squad NFT mints
- AI-powered battle transactions
- wallet-vs-wallet PvP matches
- country leaderboard updates
- Exchange OS-ready market intents
- USDT0 live match staking flows
- x402-protected premium AI scouting

The result is a game-first World Cup product where every fan action creates an
on-chain footprint.

## Product features

### Country FanDAOs

Users join a national FanDAO such as Nigeria, Brazil, Argentina, England, Japan,
South Korea, Saudi Arabia, Qatar, India, China, Indonesia, Iran, Australia, or an
Underdog faction. Each country has points, identity, rivalry, and leaderboard
position.

### Fan Passport NFT

Each wallet mints one Fan Passport NFT. This is the user's country membership
and profile anchor on X Layer.

### 11-player AI Strike Agent squad

After minting a passport, each fan mints an 11-player Strike Agent squad. The
squad represents the fan in matches and evolves through battle activity.
Managers can rename all 11 agents in Squad Management; the names are stored per
wallet in the app and sent into Claude so battle strategy and commentary use the
manager's own squad identity.

### Quick Battle

Quick Battle is the always-available mode. The user chooses an AI-controlled
opponent country, receives an AI strategy, submits the match on-chain, and then
watches a 60-second compressed football broadcast with:

- moving pitch players
- match timer
- half-time flow
- goals, fouls, cards, offside-style events
- whistle/audio cues
- Claude-powered commentary
- final score and X Layer transaction link

The Arena also reads a server-side API-Football feed for upcoming World Cup
fixtures and player notes. That football context is passed to Claude so the
recommendation feels like a match desk using real fixture signals instead of a
generic random call.

### Challenge Player

PvP mode supports real wallet-vs-wallet gameplay:

```text
Wallet A creates match -> Wallet B joins -> strategies are submitted -> match settles on X Layer
```

This gives the app a true multiplayer mode while keeping Quick Battle available
when no second wallet is online.

### Arena history and profile history

The History page shows total arena activity across StrikeNation contracts, not
only one user. The Profile page shows the connected wallet's own Fan Passport,
squad, battle, market, and staking history.

### Country leaderboard

Country points are read from the deployed `StrikeNationArena` contract. Wins and
participation feed national rankings.

### World Cup live page

The real World Cup page is intentionally marked "coming soon" until real-world
World Cup matches start. Once live fixtures are active, Claude-powered agents are
designed to post outcome reads and users can approve prediction intents or stake
USDT0 on match outcomes.

### Exchange OS-ready prediction layer

Agents can post market intents such as:

- Will Nigeria FanDAO beat Brazil today?
- Will this AI squad win the next arena match?
- Which country will top the leaderboard?
- What is the likely outcome of a real World Cup fixture?

These are structured as Exchange OS-ready intents so StrikeNation can plug into
X Layer's outcome market infrastructure as it opens.

### x402 premium AI scouting

Premium Scout reports are protected by x402. Users can pay for AI-generated
country scouting reports, opponent weakness reads, and tactical breakdowns.

## AI system

StrikeNation uses Claude Sonnet as the agent brain. The app sends match context,
country identity, opponent style, configurable squad names, API-Football fixture
context, player notes, and recent state to the server-side agent API.
Claude returns:

- tactical recommendations
- match commentary
- market-intent suggestions
- premium scout reports
- country-specific hype copy

The API key stays server-side. No Claude key is exposed to the browser.

## X Layer integration

StrikeNation FC is deployed on X Layer mainnet and uses OKX Wallet for user
transactions. Core actions are backed by deployed contracts rather than a demo
database.

### Deployed mainnet contracts

Network: X Layer mainnet (`chainId: 196`)

| Contract | Purpose | Address |
| --- | --- | --- |
| `FanPassportNFT` | Country FanDAO passport NFT minted once per fan wallet | [`0x339ad5eDFDefe246f286e052ED7B700F59E80d86`](https://www.okx.com/web3/explorer/xlayer/address/0x339ad5eDFDefe246f286e052ED7B700F59E80d86) |
| `StrikeAgentNFT` | 11-player AI Strike Agent squad NFT contract | [`0xa89cD378fACA30c787dC1C96Ce2B34632650b46E`](https://www.okx.com/web3/explorer/xlayer/address/0xa89cD378fACA30c787dC1C96Ce2B34632650b46E) |
| `StrikeNationArena` | Quick Battle, PvP court matches, leaderboards, market intents, live match staking | [`0xdfd726FF311a888347f1f90E7C18Fdcbf5F96B77`](https://www.okx.com/web3/explorer/xlayer/address/0xdfd726FF311a888347f1f90E7C18Fdcbf5F96B77) |
| `USDT0` | X Layer token used for live match staking/payment flows | [`0x779Ded0c9e1022225f8E0630b35a9b54bE713736`](https://www.okx.com/web3/explorer/xlayer/address/0x779Ded0c9e1022225f8E0630b35a9b54bE713736) |

The frontend reads these addresses from `lib/contracts.js`.

## Tech stack

- Next.js app router
- Wagmi + viem
- OKX Wallet / injected wallet connection
- X Layer mainnet contracts
- Claude Sonnet server-side agent API
- OKX x402 packages for paid Scout reports
- USDT0 staking and prediction flows

## Run locally

Install dependencies:

```powershell
npm install
```

Run the app:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173
```

## Environment variables

Create `.env.local`:

```text
CLAUDE_API_KEY=your_claude_key
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=140

API_FOOTBALL_KEY=your_api_sports_football_key
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_WORLD_CUP_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026

X402_PAY_TO_ADDRESS=your_receiving_wallet
X402_PREMIUM_SCOUT_PRICE=$0.01
OKX_API_KEY=your_okx_facilitator_key
OKX_SECRET_KEY=your_okx_facilitator_secret
OKX_PASSPHRASE=your_okx_facilitator_passphrase
OKX_PROJECT_ID=your_okx_dev_portal_project_id
OKX_X402_API_PREFIX=/api/v6/pay/x402
X402_FACILITATOR_BASE_URL=https://web3.okx.com
```

Do not prefix private keys with `NEXT_PUBLIC_`.

## Main user flow

1. Connect OKX Wallet.
2. Create a player profile.
3. Choose a country FanDAO.
4. Mint Fan Passport NFT.
5. Mint 11-player Strike Agent squad.
6. Start Quick Battle against an AI-controlled country.
7. Watch the football broadcast and commentary.
8. Challenge another real wallet in PvP.
9. Post prediction or Exchange OS-ready market intents.
10. Stake USDT0 on live match outcomes when available.
11. Track profile history and global arena history.

## Verification

Run this after deployment to verify live X Layer contracts:

```powershell
npm run verify:xlayer
```

The script mints passports and squads, runs Quick Battle, creates and settles a
two-wallet PvP match, places a prediction, posts an Exchange OS-ready market
intent, and posts a live match market intent. USDT0 staking requires the testing
wallet to hold USDT0 on X Layer.

## Hackathon positioning

StrikeNation FC is built around the World Cup theme and focuses on the strongest
Build X categories:

- AI Agent products
- GameFi
- Fan social layers
- NFT identity and progression
- prediction markets
- X Layer transaction growth
- x402 paid AI services
- Exchange OS-ready market creation

The product is not just a football-themed dashboard. It is an on-chain fan arena
where AI agents, national rivalry, market prediction, and wallet activity all
reinforce each other.
