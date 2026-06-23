#!/bin/bash
set -e

echo '=== 安装 Directus ==='

mkdir -p /opt/directus/database /opt/directus/uploads /opt/directus/extensions

cat > /opt/directus/dc.yml << 'ENDOFFILE'
version: '3'
services:
  directus:
    image: directus/directus:latest
    ports:
      - '8055:8055'
    volumes:
      - ./database:/directus/database
      - ./uploads:/directus/uploads
      - ./extensions:/directus/extensions
    environment:
      KEY: 'd1r3ctu5-k3y-2026'
      SECRET: 'd1r3ctu5-s3cr3t-2026'
      ADMIN_EMAIL: 'admin@car-mat.com'
      ADMIN_PASSWORD: 'CarMat2026!'
      DB_CLIENT: 'sqlite3'
      DB_FILENAME: '/directus/database/data.db'
      WEBSOCKETS_ENABLED: 'true'
      DEFAULT_LANGUAGE: 'zh-CN'
    restart: unless-stopped
ENDOFFILE

echo 'docker-compose文件已创建'

cd /opt/directus
docker compose -f dc.yml up -d

echo '=== 完成 ==='
echo '访问: http://175.178.227.243:8055'
echo '账号: admin@car-mat.com'
echo '密码: CarMat2026!'