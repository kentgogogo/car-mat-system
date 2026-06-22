#!/bin/bash
cd /opt
LATEST=$(curl -s https://api.github.com/repos/kentgogogo/car-mat-system/commits/main | grep -o '"sha":"[^"]*"' | head -1 | cut -d'"' -f4)
SAVED=""
if [ -f /opt/.last-commit ]; then
  SAVED=$(cat /opt/.last-commit)
fi
if [ "$LATEST" = "$SAVED" ] && [ "$1" != "--force" ]; then
  echo "无新代码，跳过部署"
  exit 0
fi

echo "发现新代码，开始部署..."

pm2 stop car-mat-system 2>/dev/null || true
rm -rf car-mat-system-main com.zip

wget -q -O com.zip https://codeload.github.com/kentgogogo/car-mat-system/zip/refs/heads/main
unzip -q com.zip

cd car-mat-system-main
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build

pm2 start 'pnpm start' --name car-mat-system 2>/dev/null || pm2 restart car-mat-system
pm2 save

echo "$LATEST" > /opt/.last-commit
echo "Deployed: $LATEST"