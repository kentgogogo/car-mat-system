#!/bin/bash
set -e

echo '=== 1. 安装 pm2 ==='
npm install -g pm2 2>/dev/null || true

echo '=== 2. 创建自动部署脚本 ==='
cat > /opt/deploy.sh << 'DEPLOY'
#!/bin/bash
set -e
cd /opt
LATEST=$(curl -s https://api.github.com/repos/kentgogogo/car-mat-system/commits/main | grep -o '"sha":"[^"]*"' | head -1 | cut -d'"' -f4)
CURRENT=""
if [ -f /opt/.last-commit ]; then
  CURRENT=$(cat /opt/.last-commit)
fi
if [ "$LATEST" = "$CURRENT" ] && [ "$1" != '--force' ]; then
  echo '无新代码，跳过'
  exit 0
fi
echo '发现新代码，开始部署...'
cd /opt
pm2 stop car-mat-system 2>/dev/null || true
rm -rf car-mat-system-main
wget -q -O com.zip https://codeload.github.com/kentgogogo/car-mat-system/zip/refs/heads/main
unzip -q com.zip
cd car-mat-system-main
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build
pm2 start 'pnpm start' --name car-mat-system 2>/dev/null || pm2 restart car-mat-system
echo "$LATEST" > /opt/.last-commit
echo '部署完成！'
DEPLOY
chmod +x /opt/deploy.sh

echo '=== 3. 首次部署 ==='
bash /opt/deploy.sh --force

echo '=== 4. pm2开机自启 ==='
pm2 save
pm2 startup 2>/dev/null || true

echo '=== 5. 定时自动检查（每5分钟） ==='
(crontab -l 2>/dev/null | grep -v deploy.sh; echo '*/5 * * * * /bin/bash /opt/deploy.sh >> /opt/deploy.log 2>&1') | crontab -

echo ''
echo '✅ 全部搞定！'
echo '服务地址：http://175.178.227.243:5000'
echo '以后代码更新自动部署，不用手动操作了'