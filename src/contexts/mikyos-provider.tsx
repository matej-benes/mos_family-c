"use client";

import type { ReactNode } from 'react';
import { createContext, useCallback, useEffect, useState, useMemo } from 'react';
import type { User, UserRole, GameState, ActiveApp } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';


interface MikyosContextType {
  currentUser: User | null;
  users: User[];
  gameState: GameState;
  activeApp: ActiveApp;
  isLocked: boolean;
  lockMessage: string;
  login: (username: string, pin: string) => void;
  logout: () => void;
  setActiveApp: (app: ActiveApp) => void;
  toggleGameMode: () => void;
  setBedtime: (userId: string, time: string) => void;
}

export const MikyosContext = createContext<MikyosContextType | undefined>(undefined);

export function MikyosProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeApp, setActiveApp] = useState<ActiveApp>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [lockMessage, setLockMessage] = useState<string>('');
  const { toast } = useToast();
  const firestore = useFirestore();

  const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: usersData, isLoading: usersLoading } = useCollection<User>(usersCollection);

  const gameStateDoc = useMemoFirebase(() => firestore ? doc(firestore, 'gameState', 'global') : null, [firestore]);
  const { data: gameStateData, isLoading: gameStateLoading } = useDoc<{mode: GameState}>(gameStateDoc);

  const users = useMemo(() => usersData || [], [usersData]);
  const gameState = useMemo(() => gameStateData?.mode || 'nehraje_se', [gameStateData]);
  
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
    // Re-check every minute
    const interval = setInterval(checkLockState, 60000);
    return () => clearInterval(interval);
  }, [checkLockState]);

  // Update current user details if they change in the database
  useEffect(() => {
    if (currentUser) {
        const liveUser = users.find(u => u.id === currentUser.id);
        if (liveUser) {
            setCurrentUser(liveUser);
        }
    }
  }, [users, currentUser]);


  const login = (username: string, pin: string) => {
    const userToLogin = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin);
    if (userToLogin) {
      setCurrentUser(userToLogin);
      setActiveApp(null);
      toast({ title: `Vítej, ${userToLogin.name}!`, description: "Jsi přihlášen." });
    } else {
        toast({ variant: 'destructive', title: "Login Failed", description: "Invalid username or PIN." });
    }
  };

  const logout = () => {
    toast({ title: "Logged Out", description: "You have been logged out." });
    setCurrentUser(null);
    setActiveApp(null);
  };

  const setBedtime = (userId: string, time: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { bedtime: time });
    toast({ title: "Bedtime Updated", description: `Bedtime for user has been requested.` });
  };
  
  const toggleGameMode = () => {
    if (currentUser?.role !== 'superadmin' || !firestore) {
      toast({ variant: 'destructive', title: "Permission Denied", description: "Only Super Admin can change the game mode." });
      return;
    }
    const newState = gameState === 'hraje_se' ? 'nehraje_se' : 'hraje_se';
    const gameStateRef = doc(firestore, 'gameState', 'global');
    setDocumentNonBlocking(gameStateRef, { mode: newState }, { merge: true });
    toast({ title: "Game Mode Changed", description: `Game is now ${newState.replace('_', ' ')}.` });
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
