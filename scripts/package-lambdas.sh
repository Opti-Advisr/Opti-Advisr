#!/usr/bin/env bash
# Builds the Lambda deployment zips that Terraform expects in
# backend/lambdas/ (cost_retriever.zip, resource_manager.zip, ai_agent.zip).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend/lambdas"

for name in cost_retriever resource_manager ai_agent; do
  rm -f "$name.zip"
  (cd "$name" && zip -r "../$name.zip" . >/dev/null)
  echo "Built backend/lambdas/$name.zip"
done
