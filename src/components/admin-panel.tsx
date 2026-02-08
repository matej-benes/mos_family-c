"use client";

import { useMikyos } from '@/hooks/use-mikyos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gamepad2, Users, Moon, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from './ui/scroll-area';

export function AdminPanel() {
  const { currentUser, users, gameState, toggleGameMode, setBedtime } = useMikyos();

  if (!currentUser || !['superadmin', 'starší'].includes(currentUser.role)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You do not have permission to view this page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleBedtimeChange = (userId: string, time: string) => {
    setBedtime(userId, time);
  };

  return (
    <Tabs defaultValue="users" className="h-full flex flex-col">
       <div className="flex-shrink-0">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users & Game</TabsTrigger>
            <TabsTrigger value="approvals"><ShieldCheck className="mr-2 h-4 w-4" />Approvals</TabsTrigger>
        </TabsList>
       </div>
       <div className="flex-1 mt-4 min-h-0">
            <TabsContent value="users" className="h-full m-0">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Users & Game Management</CardTitle>
                        <CardDescription>Manage user settings and global game state.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-6 min-h-0">
                        {currentUser.role === 'superadmin' && (
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                                <div className="flex items-center gap-3">
                                <Gamepad2 className="h-6 w-6" />
                                <div>
                                    <Label htmlFor="game-mode" className="text-base font-semibold">Game Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Currently: <span className="font-bold">{gameState.replace('_', ' ')}</span>
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
                            <h3 className="text-lg font-semibold mb-2">Manage Users</h3>
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
                                        aria-label={`Bedtime for ${user.name}`}
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
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>App & Contact Approvals</CardTitle>
                        <CardDescription>This feature is coming soon.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Functionality for approving apps and contacts for 'mladší' users will be available here.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </div>
    </Tabs>
  );
}
