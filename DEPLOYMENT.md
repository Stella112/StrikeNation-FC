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
FanPassportNFT: 0x339ad5eDFDefe246f286e052ED7B700F59E80d86
StrikeAgentNFT: 0xa89cD378fACA30c787dC1C96Ce2B34632650b46E
StrikeNationArena: 0xdfd726FF311a888347f1f90E7C18Fdcbf5F96B77
USDT0: 0x779Ded0c9e1022225f8E0630b35a9b54bE713736
```
