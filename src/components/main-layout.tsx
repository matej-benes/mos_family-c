"use client";

import { useMikyos } from '@/hooks/use-mikyos';
import { LockScreen } from '@/components/lock-screen';
import { HomeScreen } from '@/components/home-screen';
import { Header } from '@/components/header';
import { CallApp } from '@/components/call-app';
import { AdminPanel } from '@/components/admin-panel';
import { AiPanel } from '@/components/ai-panel';

export function MainLayout() {
  const { isLocked, lockMessage, activeApp, currentUser } = useMikyos();

  if (!currentUser) {
    return <LockScreen message="Please log in to continue." isLoginScreen />;
  }

  if (isLocked) {
    return <LockScreen message={lockMessage} />;
  }
  
  const renderActiveApp = () => {
    switch (activeApp) {
      case 'call':
        return <CallApp />;
      case 'admin':
        return <AdminPanel />;
      case 'ai':
        return <AiPanel />;
      default:
        return <HomeScreen />;
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="w-full h-full rounded-xl bg-card/50 border p-4">
          {renderActiveApp()}
        </div>
      </main>
    </div>
  );
}
