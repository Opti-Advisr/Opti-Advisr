# Builds the Lambda deployment zips that Terraform expects in
# backend/lambdas/ (cost_retriever.zip, resource_manager.zip, ai_agent.zip).
# Run from anywhere: powershell -File scripts/package-lambdas.ps1
$ErrorActionPreference = "Stop"

$root = Split-Path $PSScriptRoot -Parent
$lambdas = @("cost_retriever", "resource_manager", "ai_agent")

foreach ($name in $lambdas) {
    $src = Join-Path $root "backend\lambdas\$name"
    $zip = Join-Path $root "backend\lambdas\$name.zip"
    if (Test-Path $zip) { Remove-Item $zip -Force }
    Compress-Archive -Path (Join-Path $src "*") -DestinationPath $zip
    Write-Host "Built backend/lambdas/$name.zip"
}
