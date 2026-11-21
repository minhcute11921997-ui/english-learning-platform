# Launch local AI Vision Classifier for EngLearn (SigLIP + Calibrated Probe on CUDA)
# Pass -WithOllama if you enable AI_TIER2_MODE=async or sync in server/.env
param(
    [switch]$WithOllama
)

$ErrorActionPreference = "Stop"

if ($WithOllama) {
    $env:OLLAMA_KEEP_ALIVE = "-1"
    $env:OLLAMA_NUM_PARALLEL = "1"
    $env:OLLAMA_FLASH_ATTENTION = "1"
    $env:OLLAMA_MAX_LOADED_MODELS = "1"

    Write-Host "Checking Ollama on http://localhost:11434 ..."
    try {
        Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -UseBasicParsing | Out-Null
        Write-Host "Ollama is already running."
    } catch {
        Write-Host "Starting ollama serve..."
        Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$uvicornExe = Join-Path $scriptDir ".venv\Scripts\uvicorn.exe"
if (-not (Test-Path $uvicornExe)) {
    throw "Virtual environment not found at $uvicornExe. Run python -m venv ai-service\.venv first."
}

Write-Host "Starting Vision Classifier (SigLIP + Calibrated Probe + Multi-Facet) on http://0.0.0.0:8001 ..."
& $uvicornExe app:app --app-dir $scriptDir --host 0.0.0.0 --port 8001
