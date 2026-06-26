# SkrepayShop — deploy Render API + Netlify platform desde terminal
# Uso:
#   $env:RENDER_API_KEY = "rnd_..."
#   $env:NETLIFY_AUTH_TOKEN = "..."   # opcional
#   .\scripts\deploy-skrepay.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Read-DotEnvValue {
    param([string]$File, [string]$Key)
    if (-not (Test-Path $File)) { return $null }
    foreach ($line in Get-Content $File) {
        if ($line -match "^\s*$Key=(.*)$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

$deployEnv = Join-Path $Root ".env.deploy.local"
if (Test-Path $deployEnv) {
    Get-Content $deployEnv | ForEach-Object {
        if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$' -and $_ -notmatch '^\s*#') {
            $name = $Matches[1]
            $value = $Matches[2].Trim().Trim('"').Trim("'")
            if (-not [string]::IsNullOrWhiteSpace($value)) {
                Set-Item -Path "env:$name" -Value $value
            }
        }
    }
}

$renderKey = $env:RENDER_API_KEY
$netlifyToken = $env:NETLIFY_AUTH_TOKEN
$renderServiceName = if ($env:RENDER_SERVICE_NAME) { $env:RENDER_SERVICE_NAME } else { "skrepayshop-api" }
$renderServiceId = $env:RENDER_SERVICE_ID
$netlifySiteId = $env:NETLIFY_SITE_ID

$backendEnv = Join-Path $Root "skrepayshop-api\apps\backend\.env"
$databaseUrl = Read-DotEnvValue -File $backendEnv -Key "DATABASE_URL"

Write-Host "== SkrepayShop deploy ==" -ForegroundColor Cyan
Write-Host "Repo: $Root"

if (-not $renderKey) {
    Write-Host ""
    Write-Host "FALTA RENDER_API_KEY" -ForegroundColor Red
    Write-Host "1. Render Dashboard -> Account Settings -> API Keys -> Create"
    Write-Host "2. En PowerShell:"
    Write-Host '   $env:RENDER_API_KEY = "rnd_TU_CLAVE"'
    Write-Host "3. Vuelve a ejecutar: .\scripts\deploy-skrepay.ps1"
    exit 1
}

$headers = @{
    Authorization = "Bearer $renderKey"
    Accept        = "application/json"
}

if (-not $renderServiceId) {
    Write-Host "Buscando servicio Render '$renderServiceName'..."
    $cursor = ""
    $found = $null
    do {
        $url = "https://api.render.com/v1/services?limit=100"
        if ($cursor) { $url += "&cursor=$cursor" }
        $page = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
        foreach ($item in $page) {
            $svc = $item.service
            if ($svc.name -eq $renderServiceName) {
                $found = $svc
                break
            }
        }
        if ($found) { break }
        $cursor = $page[-1].cursor
    } while ($cursor)

    if (-not $found) {
        Write-Host "No se encontro el servicio '$renderServiceName'." -ForegroundColor Red
        Write-Host "Crea el servicio en Render o define RENDER_SERVICE_ID."
        exit 1
    }
    $renderServiceId = $found.id
    Write-Host "Servicio: $($found.name) ($renderServiceId)"
} else {
    Write-Host "Servicio Render: $renderServiceId"
}

if ($databaseUrl) {
    Write-Host "Actualizando DATABASE_URL en Render..."
    $body = @{ value = $databaseUrl } | ConvertTo-Json
    Invoke-RestMethod `
        -Method Put `
        -Uri "https://api.render.com/v1/services/$renderServiceId/env-vars/DATABASE_URL" `
        -Headers (@{ Authorization = "Bearer $renderKey"; "Content-Type" = "application/json" }) `
        -Body $body | Out-Null
    Write-Host "DATABASE_URL actualizado."
} else {
    Write-Host "AVISO: no hay DATABASE_URL en skrepayshop-api/apps/backend/.env" -ForegroundColor Yellow
}

$renderCli = Join-Path $env:TEMP "render-cli\cli_v1.1.0.exe"
if (-not (Test-Path $renderCli)) {
    Write-Host "Descargando Render CLI..."
    $zip = Join-Path $env:TEMP "render-cli.zip"
    Invoke-WebRequest -Uri "https://github.com/render-oss/cli/releases/download/v1.1.0/cli_1.1.0_windows_amd64.zip" -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath (Split-Path $renderCli) -Force
}

$env:CI = "true"
Write-Host "Ajustando root directory -> skrepayshop-api"
& $renderCli services update $renderServiceId --root-directory skrepayshop-api --output json --confirm | Out-Null

Write-Host "Disparando deploy en Render..."
$deploy = Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.render.com/v1/services/$renderServiceId/deploys" `
    -Headers (@{ Authorization = "Bearer $renderKey"; "Content-Type" = "application/json" }) `
    -Body (@{ clearCache = "clear" } | ConvertTo-Json)
Write-Host "Deploy Render iniciado: $($deploy.id)"

if ($netlifyToken) {
    Write-Host ""
    Write-Host "Desplegando Netlify (skrepayshop-platform)..."
    Set-Location (Join-Path $Root "skrepayshop-platform")
    if ($netlifySiteId) {
        npx netlify deploy --prod --build --site $netlifySiteId
    } else {
        npx netlify deploy --prod --build
    }
} else {
    Write-Host ""
    Write-Host "Netlify: conectado a GitHub - haz git push origin main para publicar skrepay.com." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Listo. Cuando termine Render, prueba:" -ForegroundColor Green
Write-Host "  https://skrepayshop-api.onrender.com/health"
Write-Host "  https://skrepay.com/login"
