import process from "node:process";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: npm run export -- --input <design.json> --out <dir>");
  process.exit(0);
}

console.log("Design Desk export CLI scaffold is installed. Deterministic export is implemented in Milestone 20.");
