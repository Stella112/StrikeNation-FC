# StrikeNation FC

StrikeNation FC is a World Cup AI-agent FanDAO arena for the Build X Hackathon.

Users join a country FanDAO, mint a Fan Passport, deploy an 11-player Strike
Agent squad, run Quick Battles against an AI squad, challenge a second wallet in
PvP, post live World Cup match intents, stake USDT0 on outcome predictions, climb
a national leaderboard, and generate a shareable X post.

## Run locally

Install dependencies once:

```powershell
npm install
```

Run the Next.js app:

```powershell
npm run dev
```

Then open:

```text
http://localhost:5173
```

## X Layer deployment

See `DEPLOYMENT.md`.

### Deployed mainnet contracts

StrikeNation FC is deployed on X Layer mainnet (`chainId: 196`).

| Contract | Purpose | Address |
| --- | --- | --- |
| `FanPassportNFT` | Country FanDAO passport NFT minted once per fan wallet | [`0x339ad5eDFDefe246f286e052ED7B700F59E80d86`](https://www.okx.com/web3/explorer/xlayer/address/0x339ad5eDFDefe246f286e052ED7B700F59E80d86) |
| `StrikeAgentNFT` | 11-player AI Strike Agent squad NFT contract | [`0xa89cD378fACA30c787dC1C96Ce2B34632650b46E`](https://www.okx.com/web3/explorer/xlayer/address/0xa89cD378fACA30c787dC1C96Ce2B34632650b46E) |
| `StrikeNationArena` | Quick Battle, PvP court matches, leaderboards, market intents, live match staking | [`0xdfd726FF311a888347f1f90E7C18Fdcbf5F96B77`](https://www.okx.com/web3/explorer/xlayer/address/0xdfd726FF311a888347f1f90E7C18Fdcbf5F96B77) |
| `USDT0` | X Layer token used for live match staking/payment flows | [`0x779Ded0c9e1022225f8E0630b35a9b54bE713736`](https://www.okx.com/web3/explorer/xlayer/address/0x779Ded0c9e1022225f8E0630b35a9b54bE713736) |

The frontend reads these addresses from `lib/contracts.js`.

## Claude agent brain

Put your Claude key in `.env.local`:

```text
CLAUDE_API_KEY=your_key_here
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=140
```

Do not prefix it with `NEXT_PUBLIC_`. The app calls `/api/agent/recommend`,
which runs server-side so the key is not exposed to the browser.

## x402 premium scout

The premium scout endpoint lives at:

```text
POST /api/agent/premium-scout
```

It is designed as an x402-protected paid AI service. Configure:

```text
X402_PAY_TO_ADDRESS=your_receiving_wallet
X402_PREMIUM_SCOUT_PRICE=$0.01
OKX_API_KEY=your_okx_facilitator_key
OKX_SECRET_KEY=your_okx_facilitator_secret
OKX_PASSPHRASE=your_okx_facilitator_passphrase
OKX_PROJECT_ID=your_okx_dev_portal_project_id
OKX_X402_API_PREFIX=/api/v6/pay/x402
X402_FACILITATOR_BASE_URL=https://web3.okx.com
```

There is no demo bypass. Without facilitator credentials, the endpoint returns
`402 Payment Required` and stays locked.

## MVP flow

1. Connect OKX Wallet.
2. Choose a country FanDAO.
3. Mint a Fan Passport.
4. Mint an 11-player Strike Agent squad.
5. Start Quick Battle against an AI-controlled squad.
6. Use Challenge Player to create or join a two-wallet PvP court.
7. Post a Live Match intent for a real World Cup fixture.
8. Approve and stake USDT0 on Home, Draw, or Away.
9. Back YES or NO in the side outcome market.
10. Watch the leaderboard and NFT level update.
11. Copy the generated X post.

## Mainnet verification

Run this after deploy to verify the live X Layer contracts:

```powershell
npm run verify:xlayer
```

The script mints test passports and squads, runs Quick Battle, creates/joins a
two-wallet PvP match with a temporary funded wallet, settles the court, places a
prediction, posts an Exchange OS-ready market intent, and posts a live match
market intent. USDT0 staking requires the testing wallet to hold USDT0 on X Layer.
