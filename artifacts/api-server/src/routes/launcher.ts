import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ── Silent background launcher (VBScript — no console window) ─────────────────
// Double-click this. No window appears. Bots start silently, logs go to launcher.log

const SILENT_VBS = `' GFN Bot Launcher -- Objective First (Silent Background Mode)
' Double-click to start all bots silently.
' Output is saved to launcher.log in the same folder.
' To stop bots: open Task Manager and end "node.exe"

Dim fso, folder, logFile
Set fso = CreateObject("Scripting.FileSystemObject")
folder  = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\\"))
logFile = folder & "launcher.log"

' ── Check gfn-launcher.cjs is present ───────────────────────────────────────
If Not fso.FileExists(folder & "gfn-launcher.cjs") Then
  MsgBox "gfn-launcher.cjs not found in:" & vbCrLf & folder & vbCrLf & vbCrLf & _
         "Download gfn-launcher.cjs from the dashboard and place it in the same folder.", _
         vbExclamation, "GFN Launcher"
  WScript.Quit 1
End If

' ── Find node.exe — checks PATH then common install locations ────────────────
Dim nodePath, shell
Set shell = CreateObject("WScript.Shell")
nodePath = ""

' Try common install directories (covers system install, user install, and nvm)
Dim candidates(4)
candidates(0) = shell.ExpandEnvironmentStrings("%ProgramFiles%")     & "\\nodejs\\node.exe"
candidates(1) = shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\\nodejs\\node.exe"
candidates(2) = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%")      & "\\Programs\\nodejs\\node.exe"
candidates(3) = shell.ExpandEnvironmentStrings("%USERPROFILE%")       & "\\.nvm\\current\\node.exe"
candidates(4) = shell.ExpandEnvironmentStrings("%APPDATA%")           & "\\nvm\\current\\node.exe"

Dim i
For i = 0 To 4
  If fso.FileExists(candidates(i)) Then
    nodePath = """" & candidates(i) & """"
    Exit For
  End If
Next

' Fall back to hoping node is on PATH
If nodePath = "" Then nodePath = "node"

' ── Check node_modules — first-run setup must be done via launch.bat first ──
If Not fso.FolderExists(folder & "node_modules") Then
  MsgBox "First-time setup required." & vbCrLf & vbCrLf & _
         "Please run launch.bat once first so it can install the required dependencies." & vbCrLf & _
         "After that completes, you can use start-background.vbs for silent launches.", _
         vbInformation, "GFN Launcher — Setup Needed"
  WScript.Quit 0
End If

' ── Launch silently (window style 0 = completely hidden) ────────────────────
Dim cmd
cmd = "cmd /c cd /d """ & folder & """ && " & nodePath & " gfn-launcher.cjs >> """ & logFile & """ 2>&1"
shell.Run cmd, 0, False

MsgBox "GFN bots are running in the background!" & vbCrLf & vbCrLf & _
       "Status log: " & logFile & vbCrLf & _
       "Check the dashboard for bot status and auth codes." & vbCrLf & vbCrLf & _
       "To stop: open Task Manager and end node.exe", _
       vbInformation, "GFN Launcher Started"
`;

// ── Windows batch file (shows console — useful for debugging) ─────────────────

const WINDOWS_BAT = `@echo off
title GFN Bot Launcher -- Objective First
color 0A
cls

echo ============================================================
echo   GFN Bot Launcher -- Objective First Control Panel
echo   (Debug mode -- use start-background.vbs for silent mode)
echo ============================================================
echo.

:: ── Find Node.js ─────────────────────────────────────────────
set "NODE_EXE="

where node >nul 2>&1
if %errorlevel% equ 0 (
    set "NODE_EXE=node"
    goto :node_found
)

if exist "%ProgramFiles%\\nodejs\\node.exe" (
    set "NODE_EXE=%ProgramFiles%\\nodejs\\node.exe"
    set "PATH=%ProgramFiles%\\nodejs;%PATH%"
    goto :node_found
)

if exist "%ProgramFiles(x86)%\\nodejs\\node.exe" (
    set "NODE_EXE=%ProgramFiles(x86)%\\nodejs\\node.exe"
    set "PATH=%ProgramFiles(x86)%\\nodejs;%PATH%"
    goto :node_found
)

if exist "%LOCALAPPDATA%\\Programs\\nodejs\\node.exe" (
    set "NODE_EXE=%LOCALAPPDATA%\\Programs\\nodejs\\node.exe"
    set "PATH=%LOCALAPPDATA%\\Programs\\nodejs;%PATH%"
    goto :node_found
)

if exist "%USERPROFILE%\\.nvm\\current\\node.exe" (
    set "NODE_EXE=%USERPROFILE%\\.nvm\\current\\node.exe"
    goto :node_found
)

:: Not found anywhere
echo  [ERROR] Node.js was not found on this machine.
echo.
echo  Please install it from:  https://nodejs.org
echo  Download the LTS version, run the installer, then try again.
echo.
echo  If you already installed it, try restarting your PC first,
echo  then run this file again.
echo.
pause
exit /b 1

:node_found
for /f "tokens=*" %%i in ('"%NODE_EXE%" --version') do set NODE_VER=%%i
echo  Node.js %NODE_VER% found at: %NODE_EXE%
echo.

:: ── Check gfn-launcher.cjs is present ────────────────────────
if not exist "%~dp0gfn-launcher.cjs" (
    echo  [ERROR] gfn-launcher.cjs not found in this folder.
    echo.
    echo  Download gfn-launcher.cjs from the dashboard and place it
    echo  in the same folder as this .bat file:
    echo  %~dp0
    echo.
    pause
    exit /b 1
)

:: ── First-run: install Playwright ────────────────────────────
cd /d "%~dp0"
if not exist "node_modules\\" (
    echo  [SETUP] First run -- installing Playwright...
    echo  This takes about a minute. Please wait.
    echo.
    call npm install playwright
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
    echo.
    echo  [SETUP] Installing Edge browser driver...
    call npx playwright install msedge
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] Edge driver install failed.
        pause
        exit /b 1
    )
    echo.
    echo  Setup complete!
    echo.
)

:: ── Launch ────────────────────────────────────────────────────
echo  Starting GFN bots...
echo  Keep this window open while bots are running.
echo  (After setup is done, use start-background.vbs for no-window mode)
echo.
echo ============================================================
echo.

"%NODE_EXE%" gfn-launcher.cjs

echo.
echo ============================================================
echo  Launcher stopped.
pause
`;

// ── Node.js automation script ────────────────────────────────────────────────

const LAUNCHER_JS = `#!/usr/bin/env node
/**
 * GFN Bot Launcher — Objective First Control Panel
 *
 * Place this file in the same folder as start-background.vbs / launch.bat
 *
 * Run via:
 *   start-background.vbs  — silent background mode (no windows, logs to launcher.log)
 *   launch.bat            — debug mode (console window visible)
 *
 * Optional env vars:
 *   API_BASE   Control panel API URL  (default: http://127.0.0.1:8787/api)
 *   BOT_IDS    Comma-separated bot IDs to launch  (default: all configured bots)
 */

const { chromium } = require('playwright');
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const API_BASE        = (process.env.API_BASE || 'http://127.0.0.1:8787/api').replace(/\\/$/, '');
const GFN_URL         = 'https://play.geforcenow.com';
const ANTI_KICK_MS    = 4 * 60 * 1000;   // press key every 4 minutes
const AUTH_POLL_MS    = 3_000;
const AUTH_TIMEOUT_MS = 10 * 60 * 1000;

// ── logging — writes to console AND launcher.log ──────────────

const LOG_FILE = path.join(__dirname, 'launcher.log');

function log(botName, msg) {
  const ts   = new Date().toLocaleTimeString();
  const line = \`[\${ts}] [\${botName}] \${msg}\`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\\n'); } catch {}
}

function logSys(msg) {
  const ts   = new Date().toISOString();
  const line = \`[\${ts}] [SYS] \${msg}\`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\\n'); } catch {}
}

// ── API helpers ───────────────────────────────────────────────

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const url = API_BASE + path;
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function apiPatch(apiPath, body) {
  return new Promise((resolve, reject) => {
    const url  = API_BASE + apiPath;
    const json = JSON.stringify(body);
    const mod  = url.startsWith('https') ? https : http;
    const opts = Object.assign(new URL(url), {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) },
    });
    const req = mod.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(json);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── wait for auth code entered in dashboard ───────────────────

async function waitForAuthCode(bot) {
  log(bot.name, 'Waiting for 2FA code -- open the dashboard and enter the code on this bot card');
  const deadline = Date.now() + AUTH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(AUTH_POLL_MS);
    const fresh = await apiGet(\`/bots/\${bot.id}\`);
    if (fresh.authCode && fresh.authCode.trim().length >= 4) {
      log(bot.name, 'Auth code received: ' + fresh.authCode);
      return fresh.authCode.trim();
    }
  }
  throw new Error('Timed out waiting for auth code (10 min)');
}

// ── helpers ───────────────────────────────────────────────────

async function saveScreenshot(page, bot, label) {
  try {
    const file = path.join(__dirname, \`screenshot-\${bot.name}-\${label}.png\`);
    await page.screenshot({ path: file, fullPage: false });
    log(bot.name, 'Screenshot saved: ' + file);
  } catch {}
}

// ── GFN login ─────────────────────────────────────────────────

async function ensureLoggedIn(page, bot) {
  log(bot.name, 'Navigating to GFN...');
  await page.goto(GFN_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });

  // Give the SPA extra time to fully render
  await sleep(6000);

  // Dismiss cookie consent if present (common on fresh profiles)
  const cookieSelectors = [
    'button:has-text("Accept All")',
    'button:has-text("Accept all")',
    'button:has-text("Accept")',
    'button:has-text("I Accept")',
    'button:has-text("Agree")',
    'button:has-text("OK")',
    '[aria-label*="accept" i]',
    '[id*="cookie"] button',
    '[class*="cookie"] button',
  ].join(', ');
  const cookieBtn = page.locator(cookieSelectors).first();
  if (await cookieBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    log(bot.name, 'Dismissing cookie consent...');
    await cookieBtn.click().catch(() => {});
    await sleep(2000);
  }

  // Check if already logged in
  const loggedInSelectors = [
    '[data-testid="account-button"]',
    '[data-testid="user-avatar"]',
    '[aria-label*="account" i]',
    '[aria-label*="profile" i]',
    '[class*="avatar"]',
    '[class*="userAvatar"]',
    '[class*="account-icon"]',
  ].join(', ');
  const accountBtn = page.locator(loggedInSelectors).first();
  if (await accountBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    log(bot.name, 'Session active -- skipping login');
    return;
  }

  log(bot.name, 'Logging in as ' + bot.gfnEmail);
  await saveScreenshot(page, bot, '1-before-signin');

  // Use JS to find and click the sign-in link regardless of visual overlap.
  // GFN hides the header behind the game carousel, so Playwright selectors fail.
  const clicked = await page.evaluate(() => {
    const patterns = [
      /sign[\s-]?in/i,
      /log[\s-]?in/i,
      /login/i,
      /log[\s-]?ind/i,   // Danish
      /logga[\s-]?in/i,  // Swedish
      /kirjaudu/i,        // Finnish
    ];
    const all = Array.from(document.querySelectorAll('a, button'));
    // Prefer elements whose text matches sign-in patterns
    const byText = all.find(el => {
      const t = (el.textContent || '').trim();
      return patterns.some(p => p.test(t));
    });
    if (byText) { byText.click(); return 'text:' + (byText.textContent || '').trim(); }

    // Fallback: any link whose href contains login/signin
    const byHref = all.find(el => {
      const href = el.href || '';
      return /login|signin|sign-in/i.test(href);
    });
    if (byHref) { byHref.click(); return 'href:' + byHref.href; }

    return null;
  });

  if (clicked) {
    log(bot.name, 'Clicked sign-in via JS: ' + clicked);
    await sleep(4000);
    await saveScreenshot(page, bot, '3-after-signin-click');
  } else {
    // Last resort: navigate directly to GFN login trigger URL
    log(bot.name, 'No sign-in button found via JS, navigating to login URL...');
    await page.goto(GFN_URL + '/en-us/', { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
    await sleep(4000);
    await saveScreenshot(page, bot, '3-direct-login-nav');
  }

  // NVIDIA login page — email/username field
  const emailSelectors = [
    'input[id="emailOrUsername"]',
    'input[id="username"]',
    'input[name="username"]',
    'input[name="email"]',
    'input[type="email"]',
    'input[placeholder*="email" i]',
    'input[placeholder*="username" i]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
  ].join(', ');

  const emailField = page.locator(emailSelectors).first();
  await emailField.fill(bot.gfnEmail, { timeout: 20_000 });
  await sleep(500);

  const nextBtn = page.locator([
    'button:has-text("Continue")',
    'button:has-text("Next")',
    'button:has-text("Sign in")',
    'button:has-text("Sign In")',
    'button[type="submit"]',
  ].join(', ')).first();
  await nextBtn.click({ timeout: 10_000 });
  await sleep(3000);

  // Password field (appears after email step)
  const passField = page.locator('input[type="password"], input[id="password"], input[name="password"]').first();
  if (await passField.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await passField.fill(bot.gfnPassword || '');
    await sleep(500);
    const submitBtn = page.locator([
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'button:has-text("Continue")',
    ].join(', ')).first();
    await submitBtn.click({ timeout: 10_000 });
    await sleep(3000);
  }

  await saveScreenshot(page, bot, '4-after-password');

  // 2FA code if required
  const codeField = page.locator([
    'input[autocomplete="one-time-code"]',
    'input[name*="code" i]',
    'input[placeholder*="code" i]',
    'input[id*="otp" i]',
    'input[id*="code" i]',
    'input[type="tel"]',
  ].join(', ')).first();

  if (await codeField.isVisible({ timeout: 8000 }).catch(() => false)) {
    log(bot.name, '2FA required -- enter the code in the dashboard');
    await apiPatch(\`/bots/\${bot.id}\`, { status: 'awaiting_auth' });
    const code = await waitForAuthCode(bot);
    await codeField.fill(code);
    const verifyBtn = page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Confirm"), button:has-text("Continue")').first();
    await verifyBtn.click({ timeout: 10_000 });
    await sleep(3000);
    await apiPatch(\`/bots/\${bot.id}\`, { authCode: null });
    log(bot.name, 'Auth code accepted');
  }

  // Wait for GFN to confirm login
  await sleep(4000);
  await saveScreenshot(page, bot, '5-post-login');
  log(bot.name, 'Login complete');
}

// ── launch Hell Let Loose on GFN ─────────────────────────────

async function launchHellLetLoose(page, bot) {
  // GFN uses hash routing: /mall/#/layout/games
  log(bot.name, 'Navigating to GFN games library...');
  await page.goto(GFN_URL + '/mall/#/layout/games', { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {});
  await sleep(6000);

  // Use Playwright locator — handles scrolling + clicking automatically
  // GFN uses a custom <gfn-game-tile> web component for each game card
  log(bot.name, 'Finding Hell Let Loose card...');

  // Try the custom element selector first (most reliable)
  let hllTile = page.locator('gfn-game-tile').filter({ hasText: /hell/i }).first();
  let tileCount = await hllTile.count();

  if (tileCount === 0) {
    // Fallback: any element with HLL in a data attribute
    hllTile = page.locator('[data-title*="Hell" i], [aria-label*="Hell Let" i], [title*="Hell Let" i]').first();
    tileCount = await hllTile.count();
  }

  if (tileCount === 0) {
    await saveScreenshot(page, bot, 'hll-not-found');
    throw new Error('Could not find Hell Let Loose card. Check screenshot hll-not-found.png');
  }

  log(bot.name, 'Clicking HLL card...');
  await hllTile.scrollIntoViewIfNeeded();
  await sleep(500);
  await hllTile.click();
  await sleep(3000);
  await saveScreenshot(page, bot, 'hll-after-card-click');

  // After clicking the card a Play popup appears (says "Spil" in Danish, "Play" in English)
  // Only look inside <button> tags to avoid matching the nav "Spil" link
  log(bot.name, 'Waiting for Play button...');
  const playBtn = page.locator('button').filter({ hasText: /^(play|spil|launch|afspil|start)$/i }).first();
  const hasPlay = await playBtn.count() > 0;

  if (!hasPlay) {
    await saveScreenshot(page, bot, 'hll-no-play-btn');
    throw new Error('Play button not found after clicking HLL card. Check screenshot hll-no-play-btn.png');
  }

  log(bot.name, 'Clicking Play button...');
  await playBtn.scrollIntoViewIfNeeded();
  await playBtn.click({ timeout: 15_000 });

  log(bot.name, 'Launching HLL -- waiting for stream...');
  await page.waitForSelector('canvas, video, [data-testid="stream-container"]', { timeout: 120_000 });
  await sleep(5000);
  log(bot.name, 'Stream started');
}

// ── join Objective First ──────────────────────────────────────

async function joinServer(page, bot) {
  const serverName = bot.serverName || 'Objective First';
  log(bot.name, 'Joining server: ' + serverName);

  const stream = page.locator('canvas, video, [data-testid="stream-container"]').first();
  await stream.click();
  await sleep(2000);
  await page.keyboard.press('Escape');
  await sleep(1000);
  await page.keyboard.press('F1');
  await sleep(2000);

  log(bot.name, 'NOTE: auto server-join needs calibration for your HLL version -- join manually this first session');
}

// ── anti-kick loop ────────────────────────────────────────────

async function antiKickLoop(page, bot) {
  log(bot.name, \`Anti-kick running (W press every \${ANTI_KICK_MS / 60000} min)\`);
  while (true) {
    await sleep(ANTI_KICK_MS);
    try {
      const stream = page.locator('canvas, video, [data-testid="stream-container"]').first();
      if (!await stream.isVisible().catch(() => false)) {
        log(bot.name, 'Stream lost -- marking as error');
        await apiPatch(\`/bots/\${bot.id}\`, { status: 'error', errorMessage: 'Stream lost' });
        return;
      }
      await stream.click();
      await page.keyboard.down('w');
      await sleep(200);
      await page.keyboard.up('w');
      log(bot.name, 'anti-kick ping');
    } catch (err) {
      log(bot.name, 'Anti-kick warning: ' + err.message);
    }
  }
}

// ── run a single bot ──────────────────────────────────────────

async function runBot(bot) {
  if (!bot.gfnEmail) {
    log(bot.name, 'No GFN email -- skipping');
    return;
  }

  log(bot.name, \`Starting (profile: \${bot.browserProfilePath || 'none'})\`);
  await apiPatch(\`/bots/\${bot.id}\`, { status: 'launching' });

  let browser;
  try {
    const edgeArgs = [
      '--window-state=minimized',   // start minimized -- stays out of the way
      '--mute-audio',               // no sound from 17 browser tabs
      '--disable-notifications',
      '--no-first-run',
      '--no-default-browser-check',
    ];

    if (bot.browserProfilePath) {
      browser = await chromium.launchPersistentContext(bot.browserProfilePath, {
        channel:  'msedge',
        headless: false,
        args:     edgeArgs,
      });
    } else {
      const b = await chromium.launch({ channel: 'msedge', headless: false, args: edgeArgs });
      browser  = await b.newContext();
    }

    const page = await browser.newPage();

    await ensureLoggedIn(page, bot);
    await launchHellLetLoose(page, bot);
    await joinServer(page, bot);

    await apiPatch(\`/bots/\${bot.id}\`, { status: 'running' });
    log(bot.name, 'RUNNING in background');

    await antiKickLoop(page, bot);

  } catch (err) {
    log(bot.name, 'Fatal error: ' + err.message);
    await apiPatch(\`/bots/\${bot.id}\`, { status: 'error', errorMessage: err.message });
    if (browser) await browser.close().catch(() => {});
  }
}

// ── entry point ───────────────────────────────────────────────

async function main() {
  // Rotate log file if it gets large (>5 MB)
  try {
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > 5 * 1024 * 1024) {
      fs.renameSync(LOG_FILE, LOG_FILE + '.old');
    }
  } catch {}

  logSys('============================================================');
  logSys('GFN Bot Launcher -- Objective First');
  logSys('API: ' + API_BASE);
  logSys('Log: ' + LOG_FILE);
  logSys('============================================================');

  let bots;
  try {
    bots = await apiGet('/bots');
  } catch (err) {
    logSys('ERROR: Could not reach API at ' + API_BASE);
    logSys('Make sure the control panel server is running.');
    process.exit(1);
  }

  const filterIds = process.env.BOT_IDS
    ? process.env.BOT_IDS.split(',').map(s => parseInt(s.trim(), 10))
    : null;

  const targets = bots.filter(b =>
    b.gfnEmail && (!filterIds || filterIds.includes(b.id))
  );

  if (targets.length === 0) {
    logSys('No bots with a GFN email configured. Set emails in the dashboard first.');
    process.exit(0);
  }

  logSys(\`Launching \${targets.length} bot(s) in background...\`);

  await Promise.allSettled(targets.map(bot => runBot(bot)));

  logSys('All bots stopped.');
}

main().catch(err => {
  logSys('Launcher crashed: ' + err.message);
  process.exit(1);
});
`;

// ── routes ────────────────────────────────────────────────────────────────────

router.get("/launcher/download-vbs", (req, res): void => {
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", 'attachment; filename="start-background.vbs"');
  res.send(SILENT_VBS);
});

router.get("/launcher/download-bat", (req, res): void => {
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", 'attachment; filename="bot-launcher.bat"');
  res.send(WINDOWS_BAT);
});

router.get("/launcher/download", (req, res): void => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="gfn-launcher.cjs"');
  res.send(LAUNCHER_JS);
});

export default router;
