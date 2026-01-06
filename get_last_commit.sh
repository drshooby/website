set -euo pipefail

if git log -1 --pretty=%B | grep -qiF "deploy"; then
  echo "found"
else
  echo "not found"
fi