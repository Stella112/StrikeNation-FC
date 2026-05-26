const fs = require("fs");
const path = require("path");
const { Wallet } = require("ethers");

const wallet = Wallet.createRandom();
const root = path.join(__dirname, "..");
const walletPath = path.join(root, ".agent-wallet.json");
const envPath = path.join(root, ".env.local");

fs.writeFileSync(
  walletPath,
  JSON.stringify(
    {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
      purpose: "StrikeNation FC agent/deployer wallet. Fund only with the gas/reward amount you are comfortable using.",
      network: {
        name: "X Layer",
        chainId: 196,
        rpcUrl: "https://rpc.xlayer.tech",
      },
    },
    null,
    2,
  ),
  { mode: 0o600 },
);

fs.writeFileSync(
  envPath,
  [
    "XLAYER_RPC_URL=https://rpc.xlayer.tech",
    `DEPLOYER_PRIVATE_KEY=${wallet.privateKey}`,
    "CLAUDE_API_KEY=",
    "",
  ].join("\n"),
  { mode: 0o600 },
);

console.log(`Agent wallet address: ${wallet.address}`);
console.log("Private key saved locally to .agent-wallet.json and .env.local");

