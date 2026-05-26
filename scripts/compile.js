const fs = require("fs");
const path = require("path");
const solc = require("solc");

const root = path.join(__dirname, "..");
const contractPath = path.join(root, "contracts", "StrikeNation.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "StrikeNation.sol": {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const errors = output.errors.filter((item) => item.severity === "error");
  output.errors.forEach((item) => console.log(item.formattedMessage));
  if (errors.length > 0) {
    process.exit(1);
  }
}

const artifactDir = path.join(root, "artifacts");
fs.mkdirSync(artifactDir, { recursive: true });

for (const [name, artifact] of Object.entries(output.contracts["StrikeNation.sol"])) {
  fs.writeFileSync(
    path.join(artifactDir, `${name}.json`),
    JSON.stringify(
      {
        contractName: name,
        abi: artifact.abi,
        bytecode: `0x${artifact.evm.bytecode.object}`,
      },
      null,
      2,
    ),
  );
}

console.log(`Compiled ${Object.keys(output.contracts["StrikeNation.sol"]).join(", ")}`);

