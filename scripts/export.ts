import { mkdir, copyFile, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import type { DesignFile } from "../src/model";
import { assertValidDesign } from "../src/model";
import { collectExportAssets, createAssetManifest, generateExportFiles } from "../src/export";

function usage() {
  console.log("Usage: npm run export -- --input <design.json> --out <dir>");
}

function valueAfter(args: readonly string[], flag: string) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

async function exists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function rejectRemoteAsset(src: string) {
  if (/^https?:\/\//i.test(src)) {
    throw new Error(`Remote asset is not allowed in local export: ${src}`);
  }
}

function assetSourcePath(src: string, inputFile: string) {
  rejectRemoteAsset(src);
  if (src.startsWith("/")) {
    return path.join(process.cwd(), "public", src.slice(1));
  }
  return path.resolve(path.dirname(inputFile), src);
}

async function copyAssets(design: DesignFile, inputFile: string, outDir: string) {
  const refs = collectExportAssets(design);
  const copiedRefs: ({ copied: boolean; source: string; outputPath: string })[] = [];

  for (const ref of refs) {
    const sourcePath = assetSourcePath(ref.source, inputFile);
    const targetPath = path.join(outDir, ref.outputPath);
    const copied = await exists(sourcePath);
    if (copied) {
      await mkdir(path.dirname(targetPath), { recursive: true });
      await copyFile(sourcePath, targetPath);
    }
    copiedRefs.push({ ...ref, copied });
  }

  await writeOutputFile(outDir, "assets/asset-manifest.json", createAssetManifest(copiedRefs));
}

async function writeOutputFile(outDir: string, relativePath: string, content: string) {
  const target = path.join(outDir, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    return;
  }

  const input = valueAfter(args, "--input");
  const out = valueAfter(args, "--out");
  if (!input || !out) {
    usage();
    process.exitCode = 1;
    return;
  }

  const inputFile = path.resolve(input);
  const outDir = path.resolve(out);
  const parsed = JSON.parse(await readFile(inputFile, "utf8")) as DesignFile;
  assertValidDesign(parsed);

  for (const file of generateExportFiles(parsed)) {
    await writeOutputFile(outDir, file.path, file.content);
  }
  await copyAssets(parsed, inputFile, outDir);

  console.log(`Exported ${parsed.name} to ${outDir}`);
}

await main();
