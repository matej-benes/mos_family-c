"use client";

import { useMikyos } from '@/hooks/use-mikyos';
import { LockScreen } from '@/components/lock-screen';
import { HomeScreen } from '@/components/home-screen';
import { Header } from '@/components/header';
import { AdminPanel } from '@/components/admin-panel';
import { CallingPanel } from './calling-panel';
import { CallModal } from './call-modal';
import { MessagingPanel } from './messaging-panel';

export function MainLayout() {
  const { isLocked, lockMessage, activeApp, currentUser, incomingCall, activeCall, wallpaperUrl } = useMikyos();

  if (!currentUser) {
    return <LockScreen message="Pro pokračování se prosím přihlaste." isLoginScreen />;
  }

  if (isLocked) {
    return <LockScreen message={lockMessage} />;
  }
  
  const renderActiveApp = () => {
    switch (activeApp) {
      case 'admin':
        return <AdminPanel />;
      case 'messaging':
        return <MessagingPanel />;
      case 'calling':
        return <CallingPanel />;
      default:
        return <HomeScreen />;
    }
  }

  return (
    <>
      {wallpaperUrl && (
        <div
          className="fixed inset-0 z-[-1] bg-cover bg-center"
          style={{ backgroundImage: `url(${wallpaperUrl})` }}
        />
      )}
      <div className="flex flex-col h-screen bg-background/70 text-foreground font-body">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="w-full h-full rounded-xl bg-card/80 border p-4 backdrop-blur-md">
            {renderActiveApp()}
          </div>
        </main>
      </div>
      {(incomingCall || activeCall) && <CallModal />}
    </>
  );
}
