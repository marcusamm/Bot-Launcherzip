#!/usr/bin/env node
/**
 * Local development starter — cross-platform (Windows/Mac/Linux)
 * Run with:  npm start
 */

import { execSync, spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = dirname(fileURLToPath(import.meta.url));

// ── Load .env ──────────────────────────────────────────────────────────────
const envFile = resolve(ROOT, ".env");
if (existsSync(envFile)) {
  const lines = readFileSync(envFile, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
  console.log("✓ Loaded .env");
} else {
  console.warn("⚠  No .env file found. Copy .env.example → .env and set DATABASE_URL.\n");
}

// ── Ensure pnpm is available ───────────────────────────────────────────────
function hasPnpm() {
  try { execSync("pnpm --version", { stdio: "ignore" }); return true; }
  catch { return false; }
}
if (!hasPnpm()) {
  console.log("Installing pnpm...");
  execSync("npm install -g pnpm", { stdio: "inherit" });
}

// ── Ensure deps are installed ──────────────────────────────────────────────
if (!existsSync(resolve(ROOT, "node_modules"))) {
  console.log("Installing dependencies...");
  execSync("pnpm install", { cwd: ROOT, stdio: "inherit" });
}

// ── Ports ──────────────────────────────────────────────────────────────────
const API_PORT = process.env.API_PORT ?? "8787";
const UI_PORT  = process.env.UI_PORT  ?? "3000";

const apiEnv = { ...process.env, PORT: API_PORT, NODE_ENV: "development" };
const uiEnv  = { ...process.env, PORT: UI_PORT, API_PORT, BASE_PATH: "/", NODE_ENV: "development" };

// ── Build API server first (blocking) ─────────────────────────────────────
console.log("\nBuilding API server...");
execSync("pnpm --filter @workspace/api-server run build", {
  cwd: ROOT,
  stdio: "inherit",
  env: apiEnv,
});
console.log("✓ API server built\n");

// ── Helper: spawn with coloured prefix ────────────────────────────────────
const RESET = "\x1b[0m";
const BLUE  = "\x1b[34m";
const GREEN = "\x1b[32m";

function spawnService(name, color, cmd, args, env) {
  const prefix = `${color}[${name}]${RESET} `;
  const proc = spawn(cmd, args, { cwd: ROOT, env, shell: true });
  proc.stdout?.on("data", (d) =>
    d.toString().split("\n").filter(Boolean).forEach((l) => console.log(prefix + l))
  );
  proc.stderr?.on("data", (d) =>
    d.toString().split("\n").filter(Boolean).forEach((l) => console.error(prefix + l))
  );
  proc.on("exit", (code) => {
    if (code !== 0 && code !== null)
      console.error(`${prefix}exited with code ${code}`);
  });
  return proc;
}

// ── Start both services ────────────────────────────────────────────────────
console.log(`Starting GFN Bot Manager`);
console.log(`  API  → http://localhost:${API_PORT}/api`);
console.log(`  UI   → http://localhost:${UI_PORT}\n`);

const api = spawnService("API", BLUE,  "pnpm", ["--filter", "@workspace/api-server", "run", "start"], apiEnv);
const ui  = spawnService("UI",  GREEN, "pnpm", ["--filter", "@workspace/gfn-bots",   "run", "dev"],   uiEnv);

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => { api.kill(sig); ui.kill(sig); process.exit(0); });
}
