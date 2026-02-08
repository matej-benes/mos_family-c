"use client";

import type { ReactNode } from 'react';
import { createContext, useCallback, useEffect, useState } from 'react';
import type { User, UserRole, GameState, ActiveApp } from '@/lib/types';
import { MOCK_USERS } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface MikyosContextType {
  currentUser: User | null;
  users: User[];
  gameState: GameState;
  activeApp: ActiveApp;
  isLocked: boolean;
  lockMessage: string;
  login: (role: UserRole) => void;
  logout: () => void;
  setActiveApp: (app: ActiveApp) => void;
  toggleGameMode: () => void;
  setBedtime: (userId: string, time: string) => void;
}

export const MikyosContext = createContext<MikyosContextType | undefined>(undefined);

export function MikyosProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [gameState, setGameState] = useState<GameState>('nehraje_se');
  const [activeApp, setActiveApp] = useState<ActiveApp>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [lockMessage, setLockMessage] = useState<string>('');
  const { toast } = useToast();

  const checkLockState = useCallback(() => {
    if (!currentUser) {
      setIsLocked(true);
      setLockMessage('Please log in to continue.');
      return;
    }

    if (currentUser.role === 'superadmin') {
      setIsLocked(false);
      return;
    }

    if (gameState === 'nehraje_se') {
      setIsLocked(true);
      setLockMessage('Game is not active. Please wait for the Super Admin.');
      return;
    }

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    if (currentUser.bedtime) {
      const [bedtimeHours, bedtimeMinutes] = currentUser.bedtime.split(':').map(Number);
      
      // Simple bedtime check: locks from bedtime until 6 AM.
      if (
        (currentHours > bedtimeHours || (currentHours === bedtimeHours && currentMinutes >= bedtimeMinutes)) 
        || currentHours < 6
      ) {
        setIsLocked(true);
        setLockMessage('It\'s past your bedtime! The OS is locked until morning.');
        return;
      }
    }

    setIsLocked(false);
    setLockMessage('');
  }, [currentUser, gameState]);

  useEffect(() => {
    checkLockState();
  }, [currentUser, gameState, checkLockState]);

  const login = (role: UserRole) => {
    const userToLogin = users.find(u => u.role === role);
    if (userToLogin) {
      setCurrentUser(userToLogin);
      setActiveApp(null);
      toast({ title: "Logged In", description: `Welcome, ${userToLogin.name}!` });
    }
  };

  const logout = () => {
    toast({ title: "Logged Out", description: "You have been logged out." });
    setCurrentUser(null);
    setActiveApp(null);
  };

  const setBedtime = (userId: string, time: string) => {
    setUsers(prevUsers =>
      prevUsers.map(u => (u.id === userId ? { ...u, bedtime: time } : u))
    );
    // Also update current user if it's them
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, bedtime: time } : null);
    }
    toast({ title: "Bedtime Updated", description: `Bedtime set to ${time} for user.` });
  };
  
  const toggleGameMode = () => {
    if (currentUser?.role !== 'superadmin') {
      toast({ variant: 'destructive', title: "Permission Denied", description: "Only Super Admin can change the game mode." });
      return;
    }
    setGameState(prev => {
      const newState = prev === 'hraje_se' ? 'nehraje_se' : 'hraje_se';
      toast({ title: "Game Mode Changed", description: `Game is now ${newState.replace('_', ' ')}.` });
      return newState;
    });
  }

  const value = {
    currentUser,
    users,
    gameState,
    activeApp,
    isLocked,
    lockMessage,
    login,
    logout,
    setActiveApp,
    toggleGameMode,
    setBedtime,
  };

  return <MikyosContext.Provider value={value}>{children}</MikyosContext.Provider>;
}
