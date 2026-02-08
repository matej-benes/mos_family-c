"use client";

import { useMikyos } from '@/hooks/use-mikyos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gamepad2, Users, Moon, ShieldCheck, PlusCircle, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useState } from 'react';
import { Badge } from './ui/badge';
import type { User } from '@/lib/types';


export function AdminPanel() {
  const { currentUser, users, gameState, toggleGameMode, setBedtime, updateUserApprovals } = useMikyos();
  const [newApprovalItems, setNewApprovalItems] = useState<{[key: string]: string}>({});

  if (!currentUser || !['superadmin', 'starší'].includes(currentUser.role)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Přístup odepřen</CardTitle>
          <CardDescription>Pro zobrazení této stránky nemáte oprávnění.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleBedtimeChange = (userId: string, time: string) => {
    setBedtime(userId, time);
  };
  
  const handleNewItemChange = (key: string, value: string) => {
    setNewApprovalItems(prev => ({...prev, [key]: value}));
  };
  
  const handleAddItem = (user: User, type: 'apps' | 'contacts') => {
    const key = `${user.id}-${type}`;
    const newItem = newApprovalItems[key]?.trim();
    if (!newItem) return;
  
    const currentApprovals = user.approvals || { apps: [], contacts: [] };
    // Prevent duplicates
    if ((currentApprovals[type] || []).includes(newItem)) return;

    const updatedItems = [...(currentApprovals[type] || []), newItem];
  
    const newApprovals = {
      ...currentApprovals,
      [type]: updatedItems,
    };
  
    updateUserApprovals(user.id, newApprovals);
    handleNewItemChange(key, ''); // Clear input
  }
  
  const handleRemoveItem = (user: User, type: 'apps' | 'contacts', itemToRemove: string) => {
    const currentApprovals = user.approvals || { apps: [], contacts: [] };
    const updatedItems = (currentApprovals[type] || []).filter(item => item !== itemToRemove);
    
    const newApprovals = {
      ...currentApprovals,
      [type]: updatedItems,
    };
    
    updateUserApprovals(user.id, newApprovals);
  }

  const youngerUsers = users.filter(u => u.role === 'mladší');


  return (
    <Tabs defaultValue="users" className="h-full flex flex-col">
       <div className="flex-shrink-0">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Uživatelé a Hra</TabsTrigger>
            <TabsTrigger value="approvals"><ShieldCheck className="mr-2 h-4 w-4" />Schvalování</TabsTrigger>
        </TabsList>
       </div>
       <div className="flex-1 mt-4 min-h-0">
            <TabsContent value="users" className="h-full m-0">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Správa uživatelů a hry</CardTitle>
                        <CardDescription>Spravujte uživatelská nastavení a globální stav hry.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-6 min-h-0">
                        {currentUser.role === 'superadmin' && (
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                                <div className="flex items-center gap-3">
                                <Gamepad2 className="h-6 w-6" />
                                <div>
                                    <Label htmlFor="game-mode" className="text-base font-semibold">Herní režim</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Aktuálně: <span className="font-bold">{gameState.replace('_', ' ')}</span>
                                    </p>
                                </div>
                                </div>
                                <Switch
                                    id="game-mode"
                                    checked={gameState === 'hraje_se'}
                                    onCheckedChange={toggleGameMode}
                                />
                            </div>
                        )}
                        <div className="flex-1 flex flex-col min-h-0">
                            <h3 className="text-lg font-semibold mb-2">Spravovat uživatele</h3>
                            <ScrollArea className="flex-1 -mr-6 pr-6">
                                <div className="space-y-4">
                                {users.filter(u => u.role !== 'superadmin').map(user => (
                                    <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-4">
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
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Moon className="h-5 w-5 text-muted-foreground" />
                                        <Input
                                        type="time"
                                        defaultValue={user.bedtime}
                                        onChange={(e) => handleBedtimeChange(user.id, e.target.value)}
                                        className="w-full sm:w-auto"
                                        aria-label={`Večerka pro ${user.name}`}
                                        />
                                    </div>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="approvals" className="h-full m-0">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Schvalování aplikací a kontaktů</CardTitle>
                        <CardDescription>Spravujte, které aplikace a kontakty mohou 'mladší' uživatelé používat.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                      <ScrollArea className="h-full -mr-6 pr-6">
                        <Accordion type="single" collapsible className="w-full">
                          {youngerUsers.map(user => (
                            <AccordionItem value={user.id} key={user.id}>
                              <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span>{user.name}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="space-y-6 pt-4">
                                <div>
                                  <Label className="text-base font-semibold">Schválené aplikace</Label>
                                  <div className="flex gap-2 my-2" onKeyDown={(e) => e.key === 'Enter' && handleAddItem(user, 'apps')}>
                                    <Input 
                                      placeholder="Např. YouTube Kids"
                                      value={newApprovalItems[`${user.id}-apps`] || ''}
                                      onChange={(e) => handleNewItemChange(`${user.id}-apps`, e.target.value)}
                                    />
                                    <Button onClick={() => handleAddItem(user, 'apps')}><PlusCircle className="mr-2 h-4 w-4" />Přidat</Button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(user.approvals?.apps || []).length > 0 ? (
                                      (user.approvals?.apps || []).map(app => (
                                        <Badge key={app} variant="secondary" className="text-sm py-1 pl-3 pr-2">
                                          {app}
                                          <button onClick={() => handleRemoveItem(user, 'apps', app)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5">
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))
                                    ) : (
                                      <p className="text-sm text-muted-foreground">Žádné schválené aplikace.</p>
                                    )}
                                  </div>
                                </div>
                  
                                <div>
                                  <Label className="text-base font-semibold">Schválené kontakty</Label>
                                  <div className="flex gap-2 my-2" onKeyDown={(e) => e.key === 'Enter' && handleAddItem(user, 'contacts')}>
                                    <Input 
                                      placeholder="Např. Babička"
                                      value={newApprovalItems[`${user.id}-contacts`] || ''}
                                      onChange={(e) => handleNewItemChange(`${user.id}-contacts`, e.target.value)}
                                    />
                                    <Button onClick={() => handleAddItem(user, 'contacts')}><PlusCircle className="mr-2 h-4 w-4" />Přidat</Button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                     {(user.approvals?.contacts || []).length > 0 ? (
                                      (user.approvals?.contacts || []).map(contact => (
                                        <Badge key={contact} variant="secondary" className="text-sm py-1 pl-3 pr-2">
                                          {contact}
                                          <button onClick={() => handleRemoveItem(user, 'contacts', contact)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5">
                                             <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))
                                    ) : (
                                       <p className="text-sm text-muted-foreground">Žádné schválené kontakty.</p>
                                    )}
                                  </div>
                                </div>
                  
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                           {youngerUsers.length === 0 && (
                              <p className="text-muted-foreground text-center py-4">
                                  Nejsou zde žádní uživatelé s rolí 'mladší'.
                              </p>
                           )}
                        </Accordion>
                      </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
        </div>
    </Tabs>
  );
}
