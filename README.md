# StrikeNation FC

StrikeNation FC is a World Cup AI-agent FanDAO arena for the Build X Hackathon.

Users join a country FanDAO, mint a Fan Passport, deploy an 11-player Strike
Agent squad, run Quick Battles against an AI squad, challenge a second wallet in
PvP, enter a simple outcome market, climb a national leaderboard, and generate a
shareable X post.

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
7. Back YES or NO in the outcome market.
8. Watch the leaderboard and NFT level update.
9. Copy the generated X post.

## Mainnet verification

Run this after deploy to verify the live X Layer contracts:

```powershell
npm run verify:xlayer
```

The script mints test passports and squads, runs Quick Battle, creates/joins a
two-wallet PvP match with a temporary funded wallet, settles the court, places a
prediction, and posts an Exchange OS-ready market intent.
