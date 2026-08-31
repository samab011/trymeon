#!/usr/bin/env bash
# Download the six template photographs into this directory.
set -euo pipefail
cd "$(dirname "$0")"
BASE="https://d8j0ntlcm91z4.cloudfront.net/user_3H6Wd5QJDbzKJXYxaM6xPlNxK18"
declare -A F=(
  [dine]="hf_20260829_175230_0a8a208a-0c88-41f8-98d0-012cd64cf7f1.png"
  [arch]="hf_20260829_175230_9729ef96-308e-4478-8617-d5deed2cdc7c.png"
  [cloth]="hf_20260829_175308_ab0a0f49-c8e3-4a56-84c1-4d9afa5ac137.png"
  [hotel]="hf_20260829_175230_1e33f88a-cdf3-44a8-bcd8-d67b14568a0d.png"
  [car]="hf_20260829_175230_896d5793-9618-448f-b5c8-a017b6dd315e.png"
  [athlete]="hf_20260829_175230_f8095f30-50dc-4505-b072-fcad155391b9.png"
)
for k in "${!F[@]}"; do
  echo "→ $k.png"
  curl -fsSL -o "$k.png" "$BASE/${F[$k]}"
done
echo "Done. Reload the page — the photographs replace the gradient fallbacks."
