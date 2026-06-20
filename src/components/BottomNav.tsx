'use client';

import Link from 'next/link';
import { Package, Plus, List, Factory, Truck, TrendingUp } from 'lucide-react';

interface BottomNavProps {
  current: 'home' | 'new' | 'list' | 'production' | 'shipping' | 'more';
}

export default function BottomNav({ current }: BottomNavProps) {
  const navItems = [
    { key: 'home', href: '/', icon: Package, label: '首页' },
    { key: 'new', href: '/order/new', icon: Plus, label: '下单' },
    { key: 'list', href: '/order/list', icon: List, label: '订单' },
    { key: 'production', href: '/production', icon: Factory, label: '生产' },
    { key: 'shipping', href: '/shipping', icon: Truck, label: '发货' },
    { key: 'more', href: '/more', icon: TrendingUp, label: '更多' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="grid grid-cols-6 h-12">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}