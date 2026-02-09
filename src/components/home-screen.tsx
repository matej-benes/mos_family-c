"use client";

import { Phone, Shield, MessageCircle, Gamepad2, SlidersHorizontal } from 'lucide-react';
import { AppIcon, type AppIconProps } from './app-icon';
import { useMikyos } from '@/hooks/use-mikyos';

export function HomeScreen() {
  const { currentUser, setActiveApp } = useMikyos();

  const apps: AppIconProps[] = [
    {
      id: 'calling',
      label: 'Telefon',
      icon: <Phone className="h-8 w-8" />,
      onClick: () => setActiveApp('calling'),
      color: 'bg-green-500/20 text-green-500',
    },
     {
      id: 'messaging',
      label: 'Zprávy',
      icon: <MessageCircle className="h-8 w-8" />,
      onClick: () => setActiveApp('messaging'),
      color: 'bg-blue-500/20 text-blue-500',
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: <Shield className="h-8 w-8" />,
      onClick: () => setActiveApp('admin'),
      color: 'bg-red-500/20 text-red-500',
      roles: ['superadmin', 'starší'],
    },
    {
      id: 'game1',
      label: 'Super Hra',
      icon: <Gamepad2 className="h-8 w-8" />,
      onClick: () => {},
      color: 'bg-yellow-500/20 text-yellow-500',
    },
  ];

  const visibleApps = apps.filter(
    app => !app.roles || (currentUser && app.roles.includes(currentUser.role))
  );

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
        {visibleApps.map(app => (
          <AppIcon key={app.id} {...app} />
        ))}
      </div>
    </div>
  );
}
