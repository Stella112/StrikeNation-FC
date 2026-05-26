# StrikeNation FC X Layer Deployment

## Generated wallet

Fund this address with OKB on X Layer mainnet:

```text
0xe6c3bEf120853C767D6E038669853BCceC9b0EFe
```

The private key is stored locally in:

```text
.agent-wallet.json
.env.local
```

These files are ignored by git. Do not paste the private key into chat or commit it.

## Network

- Chain: X Layer mainnet
- Chain ID: 196
- RPC: `https://rpc.xlayer.tech`
- Explorer: `https://www.okx.com/web3/explorer/xlayer`
- Gas token: OKB

## Deploy

After the wallet is funded:

```powershell
npm run compile
npm run deploy:xlayer
```

The deploy script writes:

```text
deployments/xlayer-mainnet.json
contract-config.js
```

`contract-config.js` is loaded by the frontend so the app can show explorer links
for the live contracts.

## Contracts

- `FanPassportNFT`: country FanDAO membership NFT
- `StrikeAgentNFT`: player-owned evolving agent NFT
- `StrikeNationArena`: battles, predictions, points, rewards

Latest X Layer deployment:

```text
FanPassportNFT: 0x6F03E6B3b9211fe8893F66B9353d9FeD08a7cA5F
StrikeAgentNFT: 0x07C228c901C8046622c94cC4132aC47F6feEC4eE
StrikeNationArena: 0x232bf4469abc5F238F38763EFB56527Eb43A187A
```
