"use client";

import { useState } from 'react';
import { ShieldBan, LogIn, LogOut, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useMikyos } from '@/hooks/use-mikyos';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Device } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';


interface LockScreenProps {
  message: string;
  isLoginScreen?: boolean;
}

export function LockScreen({ message, isLoginScreen = false }: LockScreenProps) {
  const { login, currentUser, logout, deviceUser, deviceId, users } = useMikyos();
  const [pin, setPin] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  // State for hidden section
  const [clickCount, setClickCount] = useState(0);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showHiddenSection, setShowHiddenSection] = useState(false);

  // Fetch device history if the device is unregistered
  const deviceDocRef = useMemoFirebase(
    () => (firestore && deviceId && !deviceUser ? doc(firestore, 'devices', deviceId) : null),
    [firestore, deviceId, deviceUser]
  );
  const { data: deviceData } = useDoc<Device>(deviceDocRef);


  const handleLogin = () => {
    if (pin) {
      login(pin);
    }
  };

  const handleHeaderClick = () => {
    if (showHiddenSection || showPasswordField) return; // Don't react if already triggered
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 10) {
      setShowPasswordField(true);
      setClickCount(0); // Reset for next time
    }
  };

  const handlePasswordCheck = () => {
    if (passwordInput === 'Mikmat2008') {
      setShowHiddenSection(true);
      setShowPasswordField(false);
      toast({ title: 'Přístup povolen', description: 'Zobrazuji seznam ID uživatelů.' });
    } else {
      toast({ variant: 'destructive', title: 'Špatné heslo', description: 'Přístup zamítnut.' });
      setShowPasswordField(false);
    }
    setPasswordInput('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Zkopírováno!', description: 'ID bylo zkopírováno do schránky.' });
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
            {currentUser && (
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
            <div onClick={handleHeaderClick} className="cursor-pointer" title="Secret Action">
              <CardHeader className="text-center">
                <div className="mx-auto bg-destructive/20 text-destructive rounded-full p-3 w-fit mb-4">
                  <ShieldBan className="h-10 w-10" />
                </div>
                <CardTitle className="font-headline text-2xl">
                  Neregistrované zařízení
                </CardTitle>
                <CardDescription>
                  {deviceData?.lastKnownUserName
                    ? `Toto zařízení bylo dříve používáno účtem ${deviceData.lastKnownUserName}.`
                    : 'Toto zařízení není přiřazeno žádnému uživateli.'}
                  {' '}Pro aktivaci použijte níže uvedené ID.
                </CardDescription>
              </CardHeader>
            </div>
            <CardContent className="flex flex-col gap-4 pt-6">
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
                
                {showPasswordField && (
                    <div className="space-y-2 animate-in fade-in-50">
                        <Label htmlFor="hidden-password">Heslo pro zobrazení ID</Label>
                        <div className="flex gap-2">
                          <Input
                              id="hidden-password"
                              type="password"
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handlePasswordCheck()}
                          />
                          <Button onClick={handlePasswordCheck}>Ověřit</Button>
                        </div>
                    </div>
                )}
                
                {showHiddenSection && (
                    <div className="space-y-3 pt-4 border-t animate-in fade-in-50">
                        <Label className="font-bold">Seznam ID uživatelů</Label>
                        <ScrollArea className="h-40 rounded-md border p-2 bg-background">
                           <div className="space-y-3">
                            {users.map(user => (
                              <div key={user.id}>
                                <p className="font-semibold text-sm">{user.name}</p>
                                <div className="flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground bg-muted p-2 rounded">
                                  <span>{user.id}</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(user.id)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                           </div>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
