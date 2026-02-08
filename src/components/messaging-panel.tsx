"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useMikyos } from '@/hooks/use-mikyos';
import type { User, Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, Lock, MessageSquare } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function MessagingPanel() {
  const { currentUser, users, approveContactInPerson } = useMikyos();
  const [chattingWith, setChattingWith] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const firestore = useFirestore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State for approval flow
  const [requestingApprovalFor, setRequestingApprovalFor] = useState<User | null>(null);
  const [selectedApproverId, setSelectedApproverId] = useState('');
  const [approverPin, setApproverPin] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const approvedContactIds = useMemo(() => currentUser?.approvals?.contacts || [], [currentUser]);
  const canMessageAll = useMemo(() => currentUser && ['starší', 'superadmin'].includes(currentUser.role), [currentUser]);
  
  const contacts = useMemo(() => {
    if (!currentUser) return [];
    return users.filter(u => u.id !== currentUser.id);
  }, [currentUser, users]);

  const olderSiblings = useMemo(() => users.filter(u => u.role === 'starší'), [users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (!firestore || !currentUser || !chattingWith) {
      setMessages([]);
      setChatId(null);
      return;
    }

    const getOrCreateChat = async () => {
      const participants = [currentUser.id, chattingWith.id].sort();
      const generatedChatId = participants.join('_');
      setChatId(generatedChatId);
      
      const messagesCollectionRef = collection(firestore, 'chats', generatedChatId, 'messages');
      const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
      });
      return unsubscribe;
    };
    const unsubscribePromise = getOrCreateChat();
    return () => { unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe()); };
  }, [chattingWith, currentUser, firestore]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !currentUser || !chattingWith || !chatId || !newMessage.trim()) return;

    await addDoc(collection(firestore, 'chats', chatId, 'messages'), {
      text: newMessage,
      senderId: currentUser.id,
      timestamp: serverTimestamp()
    });

    await setDoc(doc(firestore, 'chats', chatId), { 
      participants: [currentUser.id, chattingWith.id].sort(),
      lastMessage: { text: newMessage, senderId: currentUser.id, timestamp: serverTimestamp() }
    }, { merge: true });

    setNewMessage('');
  };

  const handleContactClick = (user: User) => {
    if (canMessageAll || approvedContactIds.includes(user.id)) {
      setChattingWith(user);
    } else {
      setRequestingApprovalFor(user);
    }
  };

  const handleCancelRequest = () => {
    setRequestingApprovalFor(null);
    setSelectedApproverId('');
    setApproverPin('');
  };

  const handleApproveInPerson = async () => {
    if (!currentUser || !requestingApprovalFor || !selectedApproverId || !approverPin) return;
    
    setIsApproving(true);
    const success = await approveContactInPerson(currentUser.id, requestingApprovalFor.id, selectedApproverId, approverPin);
    setIsApproving(false);

    if (success) {
      setChattingWith(requestingApprovalFor);
      setRequestingApprovalFor(null);
      setSelectedApproverId('');
      setApproverPin('');
    } else {
      setApproverPin('');
    }
  };

  if (!currentUser) return null;

  if (requestingApprovalFor) {
    const selectedApprover = users.find(u => u.id === selectedApproverId);
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 border-b p-3">
          <Button variant="ghost" size="icon" onClick={handleCancelRequest}>
            <ArrowLeft />
          </Button>
          <div className='flex-1'>
            <CardTitle>Žádost o schválení</CardTitle>
            <CardDescription className='truncate'>Chceš psát s: {requestingApprovalFor.name}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-4 md:p-6">
          <ScrollArea className="h-full -mr-6 pr-6">
            <div className="space-y-6 max-w-md mx-auto">
              <div>
                <Label htmlFor='select-approver' className="text-base font-semibold">1. Vyber, kdo ti komunikaci povolí:</Label>
                <Select onValueChange={setSelectedApproverId} value={selectedApproverId}>
                  <SelectTrigger id='select-approver' className="mt-2">
                    <SelectValue placeholder="Vyber staršího sourozence" />
                  </SelectTrigger>
                  <SelectContent>
                    {olderSiblings.map(sibling => (
                      <SelectItem key={sibling.id} value={sibling.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6"><AvatarImage src={sibling.avatarUrl} /><AvatarFallback>{sibling.name.charAt(0)}</AvatarFallback></Avatar>
                          <span>{sibling.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedApproverId && (
                <div className="space-y-4 animate-in fade-in-50">
                  <h3 className="text-base font-semibold">2. Zvol způsob schválení</h3>
                  <Accordion type="single" collapsible className="w-full" defaultValue="personal">
                    <AccordionItem value="personal">
                      <AccordionTrigger>Povolit osobně</AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-2">
                        <p className="text-sm text-muted-foreground">{selectedApprover?.name || 'Vybraná osoba'} zadá svůj PIN pro okamžité povolení.</p>
                        <div className="flex gap-2 items-center" onKeyDown={(e) => e.key === 'Enter' && handleApproveInPerson()}>
                          <Input type="password" placeholder="PIN pro ověření" value={approverPin} onChange={(e) => setApproverPin(e.target.value)} disabled={isApproving} />
                          <Button onClick={handleApproveInPerson} disabled={!approverPin || isApproving}>{isApproving ? 'Ověřuji...' : 'Povolit'}</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="request">
                      <AccordionTrigger>Poslat žádost</AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-2">
                        <p className="text-sm text-muted-foreground">Odešle {selectedApprover?.name || 'vybrané osobě'} žádost o schválení.</p>
                        <Button variant="outline" disabled>Odeslat žádost (připravujeme)</Button>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  if (chattingWith) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 border-b p-3">
           <Button variant="ghost" size="icon" onClick={() => setChattingWith(null)}>
              <ArrowLeft />
           </Button>
           <Avatar><AvatarImage src={chattingWith.avatarUrl} /><AvatarFallback>{chattingWith.name.charAt(0)}</AvatarFallback></Avatar>
          <CardTitle className="p-0 text-xl">{chattingWith.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="space-y-4">
                  {messages.map(msg => (
                      <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser.id ? "justify-end" : "justify-start")}>
                          {msg.senderId !== currentUser.id && <Avatar className="h-8 w-8"><AvatarImage src={chattingWith.avatarUrl} /><AvatarFallback>{chattingWith.name.charAt(0)}</AvatarFallback></Avatar>}
                          <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2", msg.senderId === currentUser.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none')}>
                              <p className="text-base break-words">{msg.text}</p>
                              <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp.seconds * 1000), { addSuffix: true, locale: cs }) : 'Odesílání...'}</p>
                          </div>
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
              </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-background flex items-center gap-2">
              <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Napište zprávu..." className="flex-1" autoComplete="off" />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}><Send className="h-5 w-5" /></Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
     <Card className="h-full flex flex-col">
      <CardHeader>
          <CardTitle>Zprávy</CardTitle>
          <CardDescription>Zahajte konverzaci nebo požádejte o schválení nového kontaktu.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
          <ScrollArea className="h-full -mr-6 pr-6">
              <div className="space-y-2">
                   {contacts.map(user => {
                      const isApproved = canMessageAll || approvedContactIds.includes(user.id);
                      return (
                      <button key={user.id} onClick={() => handleContactClick(user)} className="flex items-center gap-4 p-3 w-full text-left rounded-lg hover:bg-accent transition-colors">
                           <Avatar><AvatarImage src={user.avatarUrl} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                          <div className="flex-1">
                              <p className="font-semibold">{user.name}</p>
                              <p className={cn("text-sm", isApproved ? "text-muted-foreground" : "text-blue-500 font-medium")}>{isApproved ? 'Zahájit konverzaci' : 'Požádat o schválení'}</p>
                          </div>
                          {isApproved ? <MessageSquare className="h-5 w-5 text-muted-foreground" /> : <Lock className="h-5 w-5 text-blue-500" />}
                      </button>
                   )})}
                   {contacts.length === 0 && <p className="text-muted-foreground text-center py-8">Nejsou zde žádní další uživatelé.</p>}
              </div>
          </ScrollArea>
      </CardContent>
    </Card>
  );
}
