"use client";

import { Phone, Shield, MessageCircle, Gamepad2, Users } from 'lucide-react';
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
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.37 21.85 12.04 21.85C17.5 21.85 21.95 17.4 21.95 11.94C21.95 6.48 17.5 2 12.04 2ZM16.56 14.81C16.36 15.21 15.46 15.68 15.18 15.78C14.9 15.88 14.52 15.93 14.13 15.78C13.74 15.63 12.93 15.35 12 14.55C10.92 13.6 10.23 12.45 10.08 12.2C9.93 11.95 9.78 11.75 9.93 11.55C10.08 11.35 10.23 11.23 10.38 11.08C10.53 10.93 10.6 10.8 10.73 10.6C10.85 10.4 10.9 10.25 10.83 10.05C10.76 9.85 10.28 8.65 10.08 8.15C9.88 7.65 9.68 7.75 9.53 7.75C9.38 7.75 9.11 7.78 8.88 7.78C8.65 7.78 8.31 7.85 8.03 8.13C7.75 8.41 7.11 9 7.11 10.13C7.11 11.25 8.06 12.33 8.18 12.48C8.31 12.63 9.75 14.95 12.08 15.9C13.97 16.65 14.33 16.5 14.78 16.45C15.23 16.4 16.18 15.88 16.41 15.28C16.63 14.68 16.63 14.18 16.56 14.08C16.48 13.98 16.28 13.88 16.08 13.78" />
        </svg>
      ),
      onClick: () => window.open('https://web.whatsapp.com', '_blank'),
      color: 'bg-emerald-500/20 text-emerald-500',
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
