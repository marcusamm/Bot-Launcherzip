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

  // After clicking the card a side panel appears with a Play/SPIL button.
  // GFN renders this as a custom web component so page.locator('button') misses it.
  // el.click() fires a synthetic event that custom components ignore.
  // Strategy: find the element via JS to get its screen coordinates,
  // then use page.mouse.click() to deliver a real mouse event.
  log(bot.name, 'Waiting for Play button (JS scan)...');

  // Poll up to 15 seconds for the panel play button to appear
  let playCoords = null;
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline && !playCoords) {
    playCoords = await page.evaluate(() => {
      const PLAY_RE = /^(play|spil|launch|afspil|start|spela|spielen|gioca|jouer)$/i;
      const all = Array.from(document.querySelectorAll('*'));
      for (const el of all) {
        const text = (el.textContent || '').trim();
        if (!PLAY_RE.test(text)) continue;

        // Get the bounding rect — must be visible and not in the very top navbar area
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;  // not visible
        if (r.top < 120) continue;                        // skip top nav bar (nav "Spil" lives there)

        // Must have no large block children (leaf-ish element, not a container div)
        const hasBlockChild = Array.from(el.children).some(c => {
          const cs = window.getComputedStyle(c);
          return cs.display === 'block' || cs.display === 'flex' || cs.display === 'grid';
        });
        if (hasBlockChild) continue;

        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      return null;
    });
    if (!playCoords) await sleep(800);
  }

  if (!playCoords) {
    await saveScreenshot(page, bot, 'hll-no-play-btn');
    throw new Error('Play button not found after clicking HLL card. Check screenshot hll-no-play-btn.png');
  }

  log(bot.name, \`Clicking Play button at (\${Math.round(playCoords.x)}, \${Math.round(playCoords.y)}) via mouse...\`);
  await page.mouse.click(playCoords.x, playCoords.y);
  await sleep(2000);
  // Double-click in case the first didn't register
  await page.mouse.click(playCoords.x, playCoords.y);

  log(bot.name, 'Launching HLL -- waiting for stream...');
  await page.waitForSelector('canvas, video, [data-testid="stream-container"]', { timeout: 120_000 });
  await sleep(5000);
  log(bot.name, 'Stream started');
}

// ── account type detection ────────────────────────────────────
// Name the bot "steam1", "epic1", etc. to control which launcher path runs.
// Default (no keyword in name) = steam.

function getAccountType(bot) {
  if (/epic/i.test(bot.name)) return 'epic';
  return 'steam';
}

// ── wait for GFN loading overlay to clear ─────────────────────
// After stream starts, <gfn-loading-launcher> overlays the video and intercepts
// all pointer events. We must wait for it to vanish before any in-game clicks.

async function waitForStreamInteractive(page, bot) {
  // GFN shows "Resume" when there is an existing session on this account.
  // Click it immediately if present so the stream reconnects.
  log(bot.name, 'Checking for Resume button...');
  const resumed = await page.evaluate(() => {
    const RESUME_RE = /^(resume|genoptag|fortsetzen|reprendre|riprendi|reanudar)$/i;
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      const text = (el.textContent || '').trim();
      if (!RESUME_RE.test(text)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      el.click();
      return true;
    }
    return false;
  });
  if (resumed) {
    log(bot.name, 'Clicked Resume — reconnecting to existing session');
    await sleep(4000);
  }

  log(bot.name, 'Waiting for GFN loading overlay to clear (queue + cloud launch)...');
  try {
    await page.waitForFunction(() => {
      const el = document.querySelector('gfn-loading-launcher');
      if (!el) return true;
      // gone if zero-size (hidden by Angular)
      const r = el.getBoundingClientRect();
      return r.width === 0 && r.height === 0;
    }, undefined, { timeout: 300_000 }); // up to 5 min (queue can be long)
  } catch {
    log(bot.name, 'Warning: loading overlay may still be present — proceeding anyway');
  }
  await sleep(3000); // extra settle time
  log(bot.name, 'Stream is interactive');
}

// ── Epic: handle EOS launcher that appears inside the stream ──

async function handleEpicLaunch(page, bot, cx, cy) {
  log(bot.name, 'Epic account — waiting for EOS launcher in stream...');
  await sleep(10_000);
  await saveScreenshot(page, bot, 'eos-appeared');

  // EOS library: HLL tile is usually top-left of the library grid.
  // ⚠ Calibrate these coordinates against screenshot-*-eos-appeared.png
  const hllTileX = cx * 0.35;
  const hllTileY = cy * 0.75;
  log(bot.name, \`Clicking HLL in EOS library at (\${Math.round(hllTileX)}, \${Math.round(hllTileY)})...\`);
  await page.mouse.click(hllTileX, hllTileY);
  await sleep(3000);
  await saveScreenshot(page, bot, 'eos-hll-selected');

  // EOS game detail "Launch" button — right-side panel
  // ⚠ Calibrate against screenshot-*-eos-hll-selected.png
  const launchX = cx * 1.5;
  const launchY = cy * 1.3;
  log(bot.name, \`Clicking Launch in EOS at (\${Math.round(launchX)}, \${Math.round(launchY)})...\`);
  await page.mouse.click(launchX, launchY);
  await sleep(5000);
  await saveScreenshot(page, bot, 'eos-after-launch');
}

// ── join Objective First ──────────────────────────────────────
// Coordinates assume GFN streams at 1280×720.
// ⚠ If buttons are off, look at the saved screenshots and adjust.

async function joinServer(page, bot) {
  const serverName  = bot.serverName || 'Objective First';
  const accountType = getAccountType(bot);
  log(bot.name, \`Joining server: \${serverName} (account type: \${accountType})\`);

  const vp = page.viewportSize() || { width: 1280, height: 720 };
  const cx = vp.width  / 2;
  const cy = vp.height / 2;

  // Click stream center to ensure browser focus is on the stream
  await page.mouse.click(cx, cy);
  await sleep(1000);

  // Epic accounts need to launch HLL from the EOS launcher that appears in stream
  if (accountType === 'epic') {
    await handleEpicLaunch(page, bot, cx, cy);
    log(bot.name, 'Epic: waiting for HLL to launch from EOS (~240s)...');
    await sleep(240_000);
  } else {
    // Steam: game launches automatically after GFN stream starts
    log(bot.name, 'Steam: game launching automatically (~240s)...');
    await sleep(240_000);
  }

  await saveScreenshot(page, bot, 'loading-screen');

  // Click once to dismiss the HLL loading/intro screen
  log(bot.name, 'Dismissing loading screen...');
  await page.mouse.click(cx, cy);
  await sleep(25_000); // wait for main menu to fully render
  await saveScreenshot(page, bot, 'main-menu');

  // ── Main menu → Server Browser ────────────────────────────
  // HLL main menu: left-side vertical panel. "SERVER BROWSER" is roughly
  // at 16% from left, 72% from top on a 1280×720 stream.
  // ⚠ Calibrate against screenshot-*-main-menu.png if it misses.
  const menuX = cx * 0.32;  // ~205px on 1280-wide stream
  const serverBrowserY = cy * 1.44; // ~518px on 720-tall stream
  log(bot.name, \`Clicking Server Browser at (\${Math.round(menuX)}, \${Math.round(serverBrowserY)})...\`);
  await page.mouse.click(menuX, serverBrowserY);
  await sleep(5000);
  await saveScreenshot(page, bot, 'server-browser-open');

  // ── Search bar — click and type server name ───────────────
  // Search bar is near the top of the server browser panel
  // ⚠ Calibrate against screenshot-*-server-browser-open.png
  const searchX = cx * 1.1;
  const searchY = cy * 0.28;
  log(bot.name, \`Clicking search bar at (\${Math.round(searchX)}, \${Math.round(searchY)})...\`);
  await page.mouse.click(searchX, searchY);
  await sleep(500);
  // Clear any existing text first
  await page.keyboard.press('Control+a');
  await page.keyboard.type(serverName, { delay: 80 });
  await sleep(4000); // wait for results to filter
  await saveScreenshot(page, bot, 'server-search-results');

  // ── Click Join on the first result ───────────────────────
  // Join button is on the right side of the first server row
  // ⚠ Calibrate against screenshot-*-server-search-results.png
  const joinX = cx * 1.82;
  const joinY  = cy * 0.55;
  log(bot.name, \`Clicking Join at (\${Math.round(joinX)}, \${Math.round(joinY)})...\`);
  await page.mouse.click(joinX, joinY);
  await sleep(5000);
  await saveScreenshot(page, bot, 'join-clicked');

  log(bot.name, \`Joining \${serverName} — check screenshots if anything went wrong\`);
}

// ── anti-kick loop ────────────────────────────────────────────

async function antiKickLoop(page, bot) {
  log(bot.name, \`Anti-kick running (W press every \${ANTI_KICK_MS / 60000} min)\`);
  const vp = page.viewportSize() || { width: 1280, height: 720 };
  const cx = vp.width  / 2;
  const cy = vp.height / 2;

  while (true) {
    await sleep(ANTI_KICK_MS);
    try {
      const stream = page.locator('canvas, video, [data-testid="stream-container"]').first();
      if (!await stream.isVisible().catch(() => false)) {
        log(bot.name, 'Stream lost -- marking as error');
        await apiPatch(\`/bots/\${bot.id}\`, { status: 'error', errorMessage: 'Stream lost' });
        return;
      }
      // Use mouse.click() — stream.click() fails when gfn-loading-launcher intercepts
      await page.mouse.click(cx, cy);
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
      '--start-maximized',          // GFN needs a real-size window — minimized causes "Resume" instead of stream
      '--mute-audio',               // no sound from 17 browser tabs
      '--disable-notifications',
      '--no-first-run',
      '--no-default-browser-check',
    ];

    // Fixed 1280×720 viewport — all coordinate calculations are relative to this
    const launchOpts = {
      channel:  'msedge',
      headless: false,
      args:     edgeArgs,
      viewport: { width: 1280, height: 720 },
    };

    if (bot.browserProfilePath) {
      browser = await chromium.launchPersistentContext(bot.browserProfilePath, launchOpts);
    } else {
      const b = await chromium.launch(launchOpts);
      browser  = await b.newContext();
    }

    const page = await browser.newPage();

    await ensureLoggedIn(page, bot);
    await launchHellLetLoose(page, bot);
    await waitForStreamInteractive(page, bot); // wait for gfn-loading-launcher to clear
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
