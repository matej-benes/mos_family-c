"use client";

import { useState } from 'react';
import { ShieldBan, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMikyos } from '@/hooks/use-mikyos';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LockScreenProps {
  message: string;
  isLoginScreen?: boolean;
}

export function LockScreen({ message, isLoginScreen = false }: LockScreenProps) {
  const { login, currentUser, logout } = useMikyos();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = () => {
    if (username && pin) {
      login(username, pin);
    }
  };

  if (!isLoginScreen) {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-background">
        <Card className="w-full max-w-sm mx-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="text-center">
            <div className="mx-auto bg-primary/20 text-primary rounded-full p-3 w-fit mb-4">
                <ShieldBan className="h-10 w-10" />
            </div>
            <CardTitle className="font-headline text-2xl">
                Systém uzamčen
            </CardTitle>
            <CardDescription>{message}</CardDescription>
            </CardHeader>
            {currentUser && currentUser.role !== 'superadmin' && (
                <CardContent>
                    <Button onClick={logout} variant="outline" className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Odhlásit se
                    </Button>
                </CardContent>
            )}
        </Card>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
      <Card className="w-full max-w-sm mx-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/20 text-primary rounded-full p-3 w-fit mb-4">
            <LogIn className="h-10 w-10" />
          </div>
          <CardTitle className="font-headline text-2xl">
            MikyOS Family Connect
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
                <Label htmlFor="username">Uživatelské jméno</Label>
                <Input 
                    id="username" 
                    placeholder="Zadejte své jméno" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input 
                    id="pin" 
                    type="password" 
                    placeholder="Zadejte svůj PIN" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                />
            </div>
            <Button onClick={handleLogin} className="w-full mt-2">
              <LogIn className="mr-2 h-4 w-4" /> Přihlásit se
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
