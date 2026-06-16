import { readFileSync, existsSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { generateImportMap } from "payload/dist/bin/generateImportMap/index.js";
import { sanitizeConfig } from "payload/dist/config/sanitize.js";

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadDotEnv();
  const configPath = path.join(process.cwd(), "payload.config.ts");
  const imported = await import(pathToFileURL(configPath).href);
  const rawConfig = imported.default ?? imported;
  const config = await sanitizeConfig(rawConfig);
  await generateImportMap(config, { log: true, force: true });
  console.log("Import map generated");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
