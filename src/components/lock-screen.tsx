"use client";

import { ShieldBan, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMikyos } from '@/hooks/use-mikyos';

interface LockScreenProps {
  message: string;
  isLoginScreen?: boolean;
}

export function LockScreen({ message, isLoginScreen = false }: LockScreenProps) {
  const { login } = useMikyos();

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
      <Card className="w-full max-w-sm mx-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/20 text-primary rounded-full p-3 w-fit mb-4">
            <ShieldBan className="h-10 w-10" />
          </div>
          <CardTitle className="font-headline text-2xl">
            {isLoginScreen ? 'MikyOS Family Connect' : 'System Locked'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {isLoginScreen && (
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => login('superadmin')}>
              <LogIn className="mr-2 h-4 w-4" /> Login as Super Admin
            </Button>
            <Button variant="secondary" onClick={() => login('starší')}>
            <LogIn className="mr-2 h-4 w-4" /> Login as Starší
            </Button>
            <Button variant="outline" onClick={() => login('mladší')}>
            <LogIn className="mr-2 h-4 w-4" /> Login as Mladší
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
