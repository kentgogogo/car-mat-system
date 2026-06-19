# 汽车脚垫工厂管理系统

## 项目概述
这是一个手机端优先的汽车脚垫工厂管理系统，使用 Next.js + SQLite 构建，包含订单管理、生产管理、客户管理和工人计件统计功能。

## 技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **数据库**: SQLite (better-sqlite3)
- **图表**: recharts
- **二维码**: qrcode

## 目录结构
```
src/
├── app/                    # 页面路由
│   ├── api/               # API 路由
│   │   ├── stats/         # 统计数据
│   │   ├── order/         # 订单创建/客户联想
│   │   ├── orders/        # 订单列表/详情/更新
│   │   ├── production/    # 生产管理
│   │   ├── qrcode/        # 二维码生成
│   │   ├── customer/      # 客户管理
│   │   ├── worker-stats/  # 工人统计
│   │   └── workers/       # 工人列表
│   ├── order/             # 订单相关页面
│   │   ├── new/           # 下单页面
│   │   ├── list/          # 订单列表
│   │   ├── detail/        # 订单详情
│   │   └── edit/          # 订单编辑
│   ├── production/        # 生产管理页面
│   ├── worker/complete/   # 工人计件页面
│   ├── customer/          # 客户管理
│   │   ├── page.tsx       # 客户列表
│   │   └── detail/        # 客户详情
│   └── more/              # 更多功能（工人统计）
├── components/ui/         # Shadcn UI 组件库
├── lib/
│   ├── db.ts              # SQLite 数据库配置
│   └── utils.ts           # 工具函数
└── hooks/                 # 自定义 Hooks
```

## 数据库表结构
- **customers**: 客户表（id, name, phone, created_at）
- **workers**: 工人表（id, name, price_per_piece, created_at）
- **orders**: 订单表（完整订单信息，包含状态和付款状态）
- **production**: 生产表（生产编号、关联订单号、产品信息、工人姓名、完成时间）

## 主要功能
1. **首页仪表盘**: 统计卡片、订单趋势图、快捷入口
2. **下单管理**: 表单下单、自动生成订单号（HC-YYYY-MM-DD-三位流水号）、客户联想
3. **订单管理**: 列表筛选、详情查看、编辑、状态更新
4. **生产管理**: 生产记录列表、二维码生成（扫码进入工人计件页面）
5. **工人计件**: 扫码确认完成、记录工人姓名和时间
6. **客户管理**: 客户列表、搜索、查看历史订单
7. **工人统计**: 按月统计计件数量、可设置单价计算工资

## API 接口
- `/api/stats` - 首页统计数据
- `/api/order` - 创建订单、获取客户联想
- `/api/orders` - 订单列表/详情/更新/删除
- `/api/production` - 生产记录/更新状态
- `/api/qrcode` - 二维码生成
- `/api/customer` - 客户管理
- `/api/worker-stats` - 工人统计
- `/api/workers` - 工人列表

## 设计规范
- 手机端优先，响应式设计
- 中文界面，简洁清爽
- 蓝色系主题色
- 底部导航栏：首页、下单、订单、生产、更多

## 开发规范
- 仅使用 pnpm 包管理器
- 使用 Link 组件导航，避免 `<a>` 标签
- TypeScript strict 模式
- 禁止隐式 any