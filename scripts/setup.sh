#!/bin/bash
# 一键配置：deploy.sh下载 + crontab定时任务
echo '=== 1. 下载deploy.sh ==='
wget -O /opt/deploy.sh https://raw.githubusercontent.com/kentgogogo/car-mat-system/main/scripts/deploy.sh
chmod +x /opt/deploy.sh
echo '=== 2. 配置crontab ==='
EXISTING=$(crontab -l 2>/dev/null | grep -v deploy.sh || true)
echo "$EXISTING" > /tmp/crontab.tmp
echo '*/5 * * * * /opt/deploy.sh >> /opt/deploy.log 2>&1' >> /tmp/crontab.tmp
crontab /tmp/crontab.tmp
rm -f /tmp/crontab.tmp
echo '=== 3. 验证 ==='
ls -la /opt/deploy.sh
crontab -l
echo '=== 完成！每5分钟自动检测更新 ==='