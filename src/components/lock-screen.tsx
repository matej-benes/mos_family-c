"use client";

import { useState } from 'react';
import { ShieldBan, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMikyos } from '@/hooks/use-mikyos';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LockScreenProps {
  message: string;
  isLoginScreen?: boolean;
}

export function LockScreen({ message, isLoginScreen = false }: LockScreenProps) {
  const { login, currentUser, logout, deviceUser, deviceId } = useMikyos();
  const [pin, setPin] = useState('');

  const handleLogin = () => {
    if (pin) {
      login(pin);
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
        {deviceUser ? (
          <>
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={deviceUser.avatarUrl} data-ai-hint={deviceUser.dataAiHint} />
                <AvatarFallback>{deviceUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline text-2xl">
                Vítej, {deviceUser.name}
              </CardTitle>
              <CardDescription>{message}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Zadejte svůj PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button onClick={handleLogin} className="w-full mt-2">
                <LogIn className="mr-2 h-4 w-4" /> Přihlásit se
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto bg-destructive/20 text-destructive rounded-full p-3 w-fit mb-4">
                <ShieldBan className="h-10 w-10" />
              </div>
              <CardTitle className="font-headline text-2xl">
                Neregistrované zařízení
              </CardTitle>
              <CardDescription>
                Toto zařízení není přiřazeno žádnému uživateli. Pro aktivaci použijte níže uvedené ID.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="space-y-2 text-center">
                    <Label htmlFor="deviceId" className="text-muted-foreground">ID tohoto zařízení</Label>
                    <Input
                      id="deviceId"
                      type="text"
                      readOnly
                      value={deviceId || 'Načítání...'}
                      className="text-center font-mono text-sm"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <p className="text-xs text-muted-foreground px-4">
                        Zkopírujte toto ID a v administraci ho přidejte do seznamu zařízení pro požadovaného uživatele.
                    </p>
                </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
