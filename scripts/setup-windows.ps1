# ═══════════════════════════════════════════════════════════════════════
# Senior SDET Portfolio — Windows Setup Script
# ═══════════════════════════════════════════════════════════════════════
#
# PURPOSE: Installs all prerequisites for the 6 portfolio projects.
# RUN AS:  Right-click PowerShell → "Run as Administrator"
#          Then:  .\scripts\setup-windows.ps1
#
# WHAT IT INSTALLS:
#   - Java 17 (LTS) — API test framework (Rest Assured + TestNG)
#   - Maven 3.9+     — Java build tool
#   - Node.js 20+    — Playwright, Pact, k6 HTML reports
#   - Python 3.11+   — AI test generator
#   - k6             — Performance/load testing
#   - Docker Desktop  — WireMock, Grafana, containerized Playwright
#   - Git             — Version control (if not already present)
#
# PACKAGE MANAGER: Uses winget (built into Windows 10/11).
#   If winget is not available, falls back to Chocolatey.
# ═══════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

# ─── Colors and formatting ──────────────────────────────────────────

function Write-Step  { param($msg) Write-Host "`n>>> $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  OK: $msg" -ForegroundColor Green }
function Write-Skip  { param($msg) Write-Host "  SKIP: $msg (already installed)" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  FAIL: $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Senior SDET Portfolio — Windows Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Check if running as Administrator ──────────────────────────────

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Fail "This script requires Administrator privileges."
    Write-Host "  Right-click PowerShell → 'Run as Administrator' → re-run this script." -ForegroundColor Yellow
    exit 1
}

# ─── Detect package manager ─────────────────────────────────────────

$useWinget = $false
$useChoco = $false

if (Get-Command winget -ErrorAction SilentlyContinue) {
    $useWinget = $true
    Write-Ok "Package manager: winget"
} elseif (Get-Command choco -ErrorAction SilentlyContinue) {
    $useChoco = $true
    Write-Ok "Package manager: Chocolatey"
} else {
    Write-Step "Installing Chocolatey (winget not found)..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    $useChoco = $true
    Write-Ok "Chocolatey installed"
}

# ─── Helper: Install if not present ─────────────────────────────────

function Install-Tool {
    param(
        [string]$Name,
        [string]$CheckCommand,
        [string]$WingetId,
        [string]$ChocoId,
        [string]$VersionFlag = "--version"
    )

    Write-Step "Checking $Name..."

    if (Get-Command $CheckCommand -ErrorAction SilentlyContinue) {
        $version = & $CheckCommand $VersionFlag 2>&1 | Select-Object -First 1
        Write-Skip "$Name → $version"
        return
    }

    Write-Host "  Installing $Name..." -ForegroundColor White
    if ($useWinget) {
        winget install --id $WingetId --accept-source-agreements --accept-package-agreements --silent
    } elseif ($useChoco) {
        choco install $ChocoId -y --no-progress
    }

    # Refresh PATH so the tool is available immediately
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

    if (Get-Command $CheckCommand -ErrorAction SilentlyContinue) {
        $version = & $CheckCommand $VersionFlag 2>&1 | Select-Object -First 1
        Write-Ok "$Name installed → $version"
    } else {
        Write-Fail "$Name installed but not found in PATH. You may need to restart your terminal."
    }
}

# ─── 1. Git ─────────────────────────────────────────────────────────

Install-Tool -Name "Git" `
    -CheckCommand "git" `
    -WingetId "Git.Git" `
    -ChocoId "git"

# ─── 2. Java 17 (Temurin LTS — the standard OpenJDK distribution) ──

Write-Step "Checking Java 17..."

$javaOk = $false
if (Get-Command java -ErrorAction SilentlyContinue) {
    $javaVersion = & java -version 2>&1 | Select-Object -First 1
    if ($javaVersion -match "17\.") {
        Write-Skip "Java 17 → $javaVersion"
        $javaOk = $true
    } else {
        Write-Host "  Found Java but not version 17: $javaVersion" -ForegroundColor Yellow
        Write-Host "  Installing Java 17 alongside existing version..." -ForegroundColor White
    }
}

if (-not $javaOk) {
    if ($useWinget) {
        winget install --id EclipseAdoptium.Temurin.17.JDK --accept-source-agreements --accept-package-agreements --silent
    } elseif ($useChoco) {
        choco install temurin17 -y --no-progress
    }

    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

    # Set JAVA_HOME for current session and permanently
    $javaHome = (Get-ChildItem "C:\Program Files\Eclipse Adoptium\jdk-17*" -Directory | Select-Object -First 1).FullName
    if (-not $javaHome) {
        $javaHome = (Get-ChildItem "C:\Program Files\Java\jdk-17*" -Directory | Select-Object -First 1).FullName
    }

    if ($javaHome) {
        $env:JAVA_HOME = $javaHome
        [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
        Write-Ok "JAVA_HOME set to $javaHome"
    } else {
        Write-Fail "Java 17 installed but JAVA_HOME path not found. Set it manually."
    }
}

# ─── 3. Maven ───────────────────────────────────────────────────────

Install-Tool -Name "Maven" `
    -CheckCommand "mvn" `
    -WingetId "Apache.Maven" `
    -ChocoId "maven"

# ─── 4. Node.js 20 LTS ─────────────────────────────────────────────

Install-Tool -Name "Node.js" `
    -CheckCommand "node" `
    -WingetId "OpenJS.NodeJS.LTS" `
    -ChocoId "nodejs-lts"

# ─── 5. Python 3.11 ─────────────────────────────────────────────────

Write-Step "Checking Python 3.11+..."

$pythonOk = $false
foreach ($cmd in @("python", "python3", "py")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $pyVer = & $cmd --version 2>&1
        if ($pyVer -match "3\.(1[1-9]|[2-9]\d)") {
            Write-Skip "Python → $pyVer"
            $pythonOk = $true
            break
        }
    }
}

if (-not $pythonOk) {
    Write-Host "  Installing Python 3.11..." -ForegroundColor White
    if ($useWinget) {
        winget install --id Python.Python.3.11 --accept-source-agreements --accept-package-agreements --silent
    } elseif ($useChoco) {
        choco install python311 -y --no-progress
    }
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Write-Ok "Python 3.11 installed"
}

# ─── 6. k6 ──────────────────────────────────────────────────────────

Install-Tool -Name "k6" `
    -CheckCommand "k6" `
    -WingetId "Grafana.k6" `
    -ChocoId "k6" `
    -VersionFlag "version"

# ─── 7. Docker Desktop ──────────────────────────────────────────────

Write-Step "Checking Docker..."

if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerVer = & docker --version 2>&1
    Write-Skip "Docker → $dockerVer"
} else {
    Write-Host "  Installing Docker Desktop..." -ForegroundColor White
    Write-Host "  NOTE: Docker Desktop requires WSL 2. If you don't have WSL 2," -ForegroundColor Yellow
    Write-Host "  run 'wsl --install' first and restart your computer." -ForegroundColor Yellow

    if ($useWinget) {
        winget install --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements --silent
    } elseif ($useChoco) {
        choco install docker-desktop -y --no-progress
    }
    Write-Ok "Docker Desktop installed (restart may be required)"
}

# ─── 8. Playwright Browsers ─────────────────────────────────────────

Write-Step "Checking Playwright browsers..."

$playwrightDir = Join-Path $PSScriptRoot "..\playwright-e2e-framework"
if (Test-Path (Join-Path $playwrightDir "node_modules")) {
    Write-Skip "Playwright node_modules exists"
} else {
    Write-Host "  Will be installed when you run 'npm install' in playwright-e2e-framework/" -ForegroundColor Yellow
}

# ─── Verification ───────────────────────────────────────────────────

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Verification" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

$tools = @(
    @{ Name = "Java";   Cmd = "java";   Args = "-version" },
    @{ Name = "Maven";  Cmd = "mvn";    Args = "-version" },
    @{ Name = "Node";   Cmd = "node";   Args = "--version" },
    @{ Name = "npm";    Cmd = "npm";    Args = "--version" },
    @{ Name = "Python"; Cmd = "python"; Args = "--version" },
    @{ Name = "pip";    Cmd = "pip";    Args = "--version" },
    @{ Name = "k6";     Cmd = "k6";     Args = "version" },
    @{ Name = "Docker"; Cmd = "docker"; Args = "--version" },
    @{ Name = "Git";    Cmd = "git";    Args = "--version" }
)

foreach ($tool in $tools) {
    if (Get-Command $tool.Cmd -ErrorAction SilentlyContinue) {
        $ver = & $tool.Cmd $tool.Args 2>&1 | Select-Object -First 1
        Write-Host "  $($tool.Name.PadRight(10)) $ver" -ForegroundColor Green
    } else {
        Write-Host "  $($tool.Name.PadRight(10)) NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

if ($allGood) {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  All tools installed successfully!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  Some tools are missing. You may need to:" -ForegroundColor Yellow
    Write-Host "    1. Restart your terminal (PATH changes need a new session)" -ForegroundColor Yellow
    Write-Host "    2. Restart your computer (Docker/WSL may require it)" -ForegroundColor Yellow
    Write-Host "    3. Install missing tools manually" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
}

# ─── JAVA_HOME reminder ─────────────────────────────────────────────

Write-Host ""
Write-Host "IMPORTANT: Verify JAVA_HOME points to JDK 17:" -ForegroundColor Cyan
Write-Host "  echo `$env:JAVA_HOME" -ForegroundColor White
Write-Host ""
Write-Host "If it's wrong, set it permanently:" -ForegroundColor Cyan
Write-Host '  [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x", "User")' -ForegroundColor White
Write-Host ""

# ─── Next steps ──────────────────────────────────────────────────────

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Next Steps — Run Each Project" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. API Framework:     cd api-test-framework && mvn clean test" -ForegroundColor White
Write-Host "  2. k6 Performance:    cd performance-testing-k6 && k6 run tests/smoke-test.js" -ForegroundColor White
Write-Host "  3. Playwright E2E:    cd playwright-e2e-framework && npm install && npx playwright install --with-deps && npx playwright test" -ForegroundColor White
Write-Host "  4. AI Generator:      cd ai-test-generator && python -m venv .venv && .venv\Scripts\activate && pip install -e .[dev] && pytest tests/ -v" -ForegroundColor White
Write-Host "  5. Pact Contracts:    cd contract-testing-pact && npm install && npm run test:consumer" -ForegroundColor White
Write-Host "  6. WireMock Mocks:    cd api-mock-service && docker-compose up -d && bash tests/mock-verification.sh" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
