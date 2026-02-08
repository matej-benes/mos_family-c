"use client";

import { useState } from 'react';
import { ShieldBan, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useMikyos } from '@/hooks/use-mikyos';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LockScreenProps {
  message: string;
  isLoginScreen?: boolean;
}

export function LockScreen({ message, isLoginScreen = false }: LockScreenProps) {
  const { login } = useMikyos();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = () => {
    if (username && pin) {
      login(username, pin);
    }
  };

  const handleDemoLogin = (role: 'superadmin' | 'starší' | 'mladší') => {
    let demoUsername = '';
    if (role === 'superadmin') demoUsername = 'superadmin';
    if (role === 'starší') demoUsername = 'starsi';
    if (role === 'mladší') demoUsername = 'mladsi';
    login(demoUsername, '1234');
  }


  if (!isLoginScreen) {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-background">
        <Card className="w-full max-w-sm mx-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="text-center">
            <div className="mx-auto bg-primary/20 text-primary rounded-full p-3 w-fit mb-4">
                <ShieldBan className="h-10 w-10" />
            </div>
            <CardTitle className="font-headline text-2xl">
                System Locked
            </CardTitle>
            <CardDescription>{message}</CardDescription>
            </CardHeader>
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
        <CardFooter className="flex flex-col gap-2 pt-4 border-t">
             <p className="text-xs text-muted-foreground">Pro testovací účely:</p>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => handleDemoLogin('superadmin')}>
              Login as Super Admin
            </Button>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => handleDemoLogin('starší')}>
              Login as Starší
            </Button>
             <Button variant="secondary" size="sm" className="w-full" onClick={() => handleDemoLogin('mladší')}>
              Login as Mladší
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
