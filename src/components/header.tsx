"use client";

import { useState, useEffect } from 'react';
import { Home, LogOut, Moon, Sun, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMikyos } from '@/hooks/use-mikyos';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';

export function Header() {
  const [time, setTime] = useState('');
  const { currentUser, setActiveApp, logout } = useMikyos();

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const timerId = setInterval(updateClock, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <header className="flex items-center justify-between p-3 border-b bg-card/20">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold font-headline tracking-tight text-primary-foreground">
          MikyOS
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setActiveApp(null)}
          aria-label="Go to Home Screen"
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center gap-4">
        {time && <div className="hidden sm:block text-lg font-medium tabular-nums">{time}</div>}
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Image
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                  data-ai-hint={currentUser.dataAiHint}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Role: {currentUser.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
