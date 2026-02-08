"use client";

import { useMikyos } from '@/hooks/use-mikyos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, CircleDashed } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export function CallingPanel() {
  const { currentUser, users, startCall, activeCall } = useMikyos();

  const otherUsers = users.filter(user => user.id !== currentUser?.id && user.role !== 'superadmin');
  
  const isCalling = !!activeCall;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Telefon</CardTitle>
        <CardDescription>Zavolejte ostatním členům rodiny. Vyžaduje připojení k internetu (např. přes hotspot).</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        <h3 className="text-lg font-semibold">Dostupní uživatelé</h3>
        <ScrollArea className="flex-1 -mr-6 pr-6">
          <div className="space-y-4">
            {otherUsers.length > 0 ? (
              otherUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl} data-ai-hint={user.dataAiHint} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">Role: {user.role}</p>
                    </div>
                  </div>
                  <Button onClick={() => startCall(user.id)} size="icon" variant="outline" disabled={isCalling}>
                    {isCalling && activeCall?.calleeId === user.id ? <CircleDashed className="h-5 w-5 animate-spin"/> : <Phone className="h-5 w-5" />}
                    <span className="sr-only">Zavolat {user.name}</span>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">Nejsou dostupní žádní další uživatelé.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
