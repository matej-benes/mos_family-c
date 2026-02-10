
"use client";

import { useMemo } from 'react';
import { useMikyos } from '@/hooks/use-mikyos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, CircleDashed, Lock } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function CallingPanel() {
  const { currentUser, users, startCall, activeCall } = useMikyos();

  const contacts = useMemo(() => {
    if (!currentUser) return [];
    // Filter out self and superadmins from the list of potential contacts
    return users.filter(u => u.id !== currentUser.id && u.role !== 'superadmin');
  }, [currentUser, users]);
  
  const isCalling = !!activeCall;
  
  if (!currentUser) return null;

  const approvedContactIds = currentUser.approvals?.contacts || [];
  const approvedUsers = contacts.filter(u => approvedContactIds.includes(u.id));
  const unapprovedUsers = contacts.filter(u => !approvedContactIds.includes(u.id));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Telefon</CardTitle>
        <CardDescription>
          {currentUser.role === 'mladsi' 
            ? "Můžeš volat pouze schváleným kontaktům." 
            : "Zavolejte ostatním členům rodiny."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        <ScrollArea className="flex-1 -mr-6 pr-6">
          <div className="space-y-6">

            {/* Privileged roles see one simple list */}
            {(['starsi', 'ostatni', 'superadmin'].includes(currentUser.role)) && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Dostupné kontakty</h3>
                {contacts.length > 0 ? (
                  contacts.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`} data-ai-hint={user.dataAiHint} />
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
                  <p className="text-muted-foreground text-center py-8">Nejsou dostupní žádní další uživatelé.</p>
                )}
              </div>
            )}

            {/* 'mladsi' role sees separated lists */}
            {currentUser.role === 'mladsi' && (
              <TooltipProvider>
              <>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">
                    Schválené kontakty
                  </h3>
                  {approvedUsers.length > 0 ? (
                    approvedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`} data-ai-hint={user.dataAiHint} />
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
                     <p className="text-sm text-muted-foreground text-center py-4">Nemáš žádné schválené kontakty.</p>
                   )}
                </div>

                {unapprovedUsers.length > 0 && <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive/80 px-3">
                    Neschválené kontakty
                  </h3>
                  {unapprovedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`} data-ai-hint={user.dataAiHint} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">Role: {user.role}</p>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {/* Disabled button wrapper for tooltip to work */}
                            <span tabIndex={0}>
                              <Button size="icon" variant="outline" disabled>
                                <Lock className="h-5 w-5" />
                                <span className="sr-only">Zavolat {user.name}</span>
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tento kontakt musí být schválen ve zprávách.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))
                  }
                </div>}
              </>
              </TooltipProvider>
            )}
            
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
