"use client";

import { useMikyos } from '@/hooks/use-mikyos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gamepad2, Users, Moon, ShieldCheck, PlusCircle, X, Wallpaper, Lock, Unlock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import type { User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export function AdminPanel() {
  const { currentUser, users, gameState, toggleGameMode, setBedtime, updateUserApprovals, wallpaperUrl, setWallpaper, setManualLock, clearManualLock } = useMikyos();
  const [newApprovalItems, setNewApprovalItems] = useState<{[key: string]: string}>({});
  const [selectedContacts, setSelectedContacts] = useState<{[key: string]: string}>({});
  const [wallpaperInput, setWallpaperInput] = useState('');
  const [manualLockMessages, setManualLockMessages] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (wallpaperUrl) {
      setWallpaperInput(wallpaperUrl);
    } else {
      setWallpaperInput('');
    }
  }, [wallpaperUrl]);
  
  useEffect(() => {
    // Pre-fill lock messages from user data
    const initialLockMessages: {[key: string]: string} = {};
    users.forEach(user => {
      if (user.isManuallyLocked && user.manualLockMessage) {
        initialLockMessages[user.id] = user.manualLockMessage;
      }
    });
    setManualLockMessages(initialLockMessages);
  }, [users]);


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
  
  const handleContactSelectChange = (userId: string, contactId: string) => {
    setSelectedContacts(prev => ({...prev, [userId]: contactId}));
  };

  const handleAddItem = (user: User, type: 'apps' | 'contacts') => {
    const currentApprovals = user.approvals || { apps: [], contacts: [] };
    let newApprovals = {...currentApprovals};

    if (type === 'apps') {
      const key = `${user.id}-apps`;
      const newItem = newApprovalItems[key]?.trim();
      if (!newItem || (currentApprovals.apps || []).includes(newItem)) return;

      newApprovals = {
        ...currentApprovals,
        apps: [...(currentApprovals.apps || []), newItem],
      };
      handleNewItemChange(key, ''); // Clear input
    } else { // contacts
      const contactIdToAdd = selectedContacts[user.id];
      if (!contactIdToAdd || (currentApprovals.contacts || []).includes(contactIdToAdd)) return;

      newApprovals = {
        ...currentApprovals,
        contacts: [...(currentApprovals.contacts || []), contactIdToAdd],
      };
      handleContactSelectChange(user.id, ''); // Clear selection
    }
  
    updateUserApprovals(user.id, newApprovals);
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

  const handleManualLockMessageChange = (userId: string, message: string) => {
    setManualLockMessages(prev => ({ ...prev, [userId]: message }));
  };

  const handleSetManualLock = (userId: string) => {
    const message = manualLockMessages[userId];
    if (message) {
      setManualLock(userId, message);
    }
  };

  const youngerUsers = users.filter(u => u.role === 'mladší');
  const allPossibleContacts = users.filter(u => u.role !== 'superadmin');


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
                        <CardDescription>Spravujte uživatelská nastavení, globální stav hry a vzhled.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-6 min-h-0">
                        <div className="flex-shrink-0 flex flex-col gap-6">
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
                            <div className="p-4 border rounded-lg bg-background">
                              <div className="flex items-center gap-3 mb-3">
                                  <Wallpaper className="h-6 w-6" />
                                  <div>
                                      <Label htmlFor="wallpaper-url" className="text-base font-semibold">Centrální tapeta</Label>
                                      <p className="text-sm text-muted-foreground">Zadejte URL obrázku pro pozadí aplikace.</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <Input
                                      id="wallpaper-url"
                                      placeholder="https://.../obrazek.png"
                                      value={wallpaperInput}
                                      onChange={(e) => setWallpaperInput(e.target.value)}
                                  />
                                  <Button onClick={() => setWallpaper(wallpaperInput)}>Nastavit</Button>
                                  <Button variant="outline" onClick={() => { setWallpaper(''); }}>Odstranit</Button>
                              </div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            <h3 className="text-lg font-semibold mb-2">Spravovat uživatele</h3>
                            <ScrollArea className="flex-1 -mr-6 pr-6">
                                <div className="space-y-4">
                                {users.filter(u => u.role !== 'superadmin').map(user => (
                                    <div key={user.id} className="p-4 border rounded-lg flex flex-col gap-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                                        {user.role === 'mladší' && (
                                            <div className="space-y-3 pt-3 border-t">
                                                 <Label htmlFor={`lock-msg-${user.id}`} className="font-semibold">Manuální uzamčení</Label>
                                                {user.isManuallyLocked ? (
                                                     <div className='space-y-2'>
                                                        <p className='text-sm text-destructive-foreground bg-destructive/80 p-2 rounded-md'>
                                                            <span className='font-bold'>Uzamčeno:</span> {user.manualLockMessage}
                                                        </p>
                                                        <Button onClick={() => clearManualLock(user.id)} variant="outline" size="sm">
                                                            <Unlock className="mr-2 h-4 w-4" />Odemknout
                                                        </Button>
                                                     </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id={`lock-msg-${user.id}`}
                                                            placeholder="Zpráva (např. Ukliď si pokoj!)"
                                                            value={manualLockMessages[user.id] || ''}
                                                            onChange={(e) => handleManualLockMessageChange(user.id, e.target.value)}
                                                        />
                                                        <Button onClick={() => handleSetManualLock(user.id)} disabled={!manualLockMessages[user.id]}>
                                                            <Lock className="mr-2 h-4 w-4" />Zamknout
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                          {youngerUsers.map(user => {
                            const approvedContactIds = user.approvals?.contacts || [];
                            const availableContacts = allPossibleContacts.filter(c => c.id !== user.id && !approvedContactIds.includes(c.id));
                            
                            return (
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
                                  <div className="flex gap-2 my-2">
                                    <Select
                                        value={selectedContacts[user.id] || ''}
                                        onValueChange={(contactId) => handleContactSelectChange(user.id, contactId)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Vyberte kontakt" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableContacts.length > 0 ? availableContacts.map(contact => (
                                                <SelectItem key={contact.id} value={contact.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={contact.avatarUrl} />
                                                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span>{contact.name}</span>
                                                    </div>
                                                </SelectItem>
                                            )) : (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">Všichni dostupní uživatelé jsou již schváleni.</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={() => handleAddItem(user, 'contacts')} disabled={!selectedContacts[user.id]}><PlusCircle className="mr-2 h-4 w-4" />Přidat</Button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                     {(user.approvals?.contacts || []).length > 0 ? (
                                      (user.approvals?.contacts || []).map(contactId => {
                                        const contact = users.find(u => u.id === contactId);
                                        if (!contact) return null;
                                        return (
                                          <Badge key={contact.id} variant="secondary" className="text-sm py-1 pl-2 pr-2 h-8 flex items-center">
                                              <Avatar className="h-6 w-6 mr-2">
                                                  <AvatarImage src={contact.avatarUrl} />
                                                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <span>{contact.name}</span>
                                              <button onClick={() => handleRemoveItem(user, 'contacts', contact.id)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5">
                                                 <X className="h-3 w-3" />
                                              </button>
                                          </Badge>
                                        )
                                      })
                                    ) : (
                                       <p className="text-sm text-muted-foreground">Žádné schválené kontakty.</p>
                                    )}
                                  </div>
                                </div>
                  
                              </AccordionContent>
                            </AccordionItem>
                          )})}
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
